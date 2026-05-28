"""
Auto-rater: adjusts channel quality scores based on market outcomes.
Architecture ported from signal-watcher/channel_rating_engine.py.
Uses win_rate and streak logic instead of fill_rate.
"""
import json
import logging
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)
_lock = threading.Lock()

STATE_PATH = Path("data/auto_rater_state.json")


def _load_state() -> Dict:
    try:
        return json.loads(STATE_PATH.read_text())
    except Exception:
        return {"channels": {}}


def _save_state(state: Dict):
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2))


def _leading_loss_streak(statuses_newest_first: List[str]) -> int:
    n = 0
    for s in statuses_newest_first:
        if s == "sl_hit":
            n += 1
        else:
            break
    return n


def _decide_tier_adjustment(
    win_rate: Optional[float],
    streak: int,
    signal_count: int,
    min_signals: int = 10,
    down_threshold: float = 0.35,
    up_threshold: float = 0.60,
    streak_need: int = 4,
) -> Tuple[int, str]:
    if signal_count < min_signals:
        return 0, "insufficient_sample"
    if win_rate is None:
        return 0, "no_data"
    if win_rate < down_threshold or streak >= streak_need:
        rule = "win_rate_low" if win_rate < down_threshold else "loss_streak"
        return -1, rule
    if win_rate >= up_threshold:
        return 1, "win_rate_high"
    return 0, "neutral"


async def run_auto_rater_for_channel(channel_id: str, db_factory, cooldown_hours: float = 36.0):
    """After new outcome for channel, re-evaluate auto rules (locked)."""
    with _lock:
        try:
            # Get recent outcomes
            async with db_factory() as db:
                rows = await db.execute_fetchall(
                    """
                    SELECT o.status FROM outcomes o
                    JOIN signals s ON s.id = o.signal_id
                    WHERE s.channel_id = ? AND o.resolved_at > ?
                    ORDER BY o.resolved_at DESC
                    LIMIT 20
                    """,
                    (channel_id, time.time() - 30 * 86400),
                )
            statuses = [r["status"] for r in rows if r["status"]]
            resolved = [s for s in statuses if s in ("tp1_hit", "tp2_hit", "tp3_hit", "sl_hit")]
            if not resolved:
                return

            wins = sum(1 for s in resolved if "tp" in s)
            win_rate = wins / len(resolved)
            streak = _leading_loss_streak(statuses)

            delta, rule = _decide_tier_adjustment(win_rate, streak, len(resolved))
            if delta == 0:
                return

            state = _load_state()
            chs = state.setdefault("channels", {})
            ent = chs.get(channel_id) or {}
            last_ts = float(ent.get("last_auto_ts") or 0)
            if time.time() - last_ts < cooldown_hours * 3600:
                return

            # Update score in channel_scores — nudge quality_score by ±5
            async with db_factory() as db:
                existing = await db.execute_fetchone(
                    "SELECT quality_score FROM channel_scores WHERE channel_id = ? AND window = '30d'",
                    (channel_id,),
                )
                if existing:
                    new_score = min(100, max(0, existing["quality_score"] + delta * 5))
                    await db.execute(
                        "UPDATE channel_scores SET quality_score = ? WHERE channel_id = ? AND window = '30d'",
                        (new_score, channel_id),
                    )
                    await db.commit()

            ent["last_auto_ts"] = time.time()
            ent["last_rule"] = rule
            chs[channel_id] = ent
            _save_state(state)
            logger.info(f"Auto-rater: {channel_id} {rule} delta={delta:+d} (win_rate={win_rate:.1%})")
        except Exception as e:
            logger.error(f"Auto-rater error: {e}")
