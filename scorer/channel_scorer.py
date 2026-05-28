"""Compute and store channel quality scores."""
import json
import logging
import time
import uuid
from typing import Optional

from scorer.metrics import (
    compute_win_rate, compute_avg_rr, compute_entry_accuracy,
    compute_quality_score, quality_tier,
)

logger = logging.getLogger(__name__)

WINDOWS = {"7d": 7, "30d": 30, "90d": 90}


async def score_channel(channel_id: str, db_factory, window: str = "30d"):
    """Compute and store quality score for a channel."""
    days = WINDOWS.get(window, 30)
    since = time.time() - days * 86400

    async with db_factory() as db:
        signal_rows = await db.execute_fetchall(
            """
            SELECT s.id, s.tp1, s.tp2, s.tp3, s.entry_price, s.stop_loss,
                   s.is_edit, s.edit_count,
                   o.status, o.entry_hit, o.rr_result, o.pips_result,
                   o.tp1_hit, o.tp2_hit, o.tp3_hit, o.sl_hit
            FROM signals s
            LEFT JOIN outcomes o ON o.signal_id = s.id
            WHERE s.channel_id = ? AND s.posted_at > ?
            """,
            (channel_id, since),
        )

    outcomes = [dict(r) for r in signal_rows]
    signal_count = len(outcomes)
    edit_rate = sum(1 for o in outcomes if o.get("is_edit")) / max(signal_count, 1)

    win_rate = compute_win_rate(outcomes)
    avg_rr = compute_avg_rr(outcomes)
    entry_accuracy = compute_entry_accuracy(outcomes)
    missed_entry_rate = 1.0 - (entry_accuracy or 0.0)

    score = compute_quality_score(win_rate, avg_rr, entry_accuracy, signal_count, edit_rate)
    tier = quality_tier(score)

    metrics = {
        "win_rate": win_rate,
        "avg_rr": avg_rr,
        "entry_accuracy": entry_accuracy,
        "missed_entry_rate": missed_entry_rate,
        "edit_rate": edit_rate,
        "signal_count": signal_count,
        "quality_score": score,
        "quality_tier": tier,
    }

    async with db_factory() as db:
        await db.execute(
            """
            INSERT OR REPLACE INTO channel_scores
            (channel_id, window, computed_at, win_rate, avg_rr, entry_accuracy,
             missed_entry_rate, edit_rate, signal_count, quality_score, quality_tier, metrics_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                channel_id, window, time.time(),
                win_rate, avg_rr, entry_accuracy,
                missed_entry_rate, edit_rate, signal_count, score, tier,
                json.dumps(metrics),
            ),
        )
        await db.commit()

    return metrics


async def score_all_channels(db_factory):
    """Score all active channels for all windows."""
    async with db_factory() as db:
        channels = await db.execute_fetchall(
            "SELECT id FROM channels WHERE is_active = 1"
        )
    for ch in channels:
        for window in WINDOWS:
            try:
                await score_channel(ch["id"], db_factory, window)
            except Exception as e:
                logger.warning(f"Score channel {ch['id']} ({window}): {e}")
