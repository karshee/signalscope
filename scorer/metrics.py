"""Metric definitions for channel quality scoring."""
from typing import List, Dict, Any, Optional
import math


def compute_win_rate(outcomes: List[Dict]) -> Optional[float]:
    resolved = [o for o in outcomes if o.get("status") in ("tp1_hit", "tp2_hit", "tp3_hit", "sl_hit")]
    if not resolved:
        return None
    wins = sum(1 for o in resolved if "tp" in (o.get("status") or ""))
    return wins / len(resolved)


def compute_avg_rr(outcomes: List[Dict]) -> Optional[float]:
    rrs = [o["rr_result"] for o in outcomes if o.get("rr_result") is not None and o["rr_result"] != 0]
    if not rrs:
        return None
    return sum(rrs) / len(rrs)


def compute_entry_accuracy(outcomes: List[Dict]) -> Optional[float]:
    total = len(outcomes)
    if not total:
        return None
    hits = sum(1 for o in outcomes if o.get("entry_hit"))
    return hits / total


def compute_quality_score(
    win_rate: Optional[float],
    avg_rr: Optional[float],
    entry_accuracy: Optional[float],
    signal_count: int,
    edit_rate: float = 0.0,
) -> float:
    """Composite quality score 0-100."""
    if signal_count < 3:
        return 0.0

    score = 0.0
    if win_rate is not None:
        score += win_rate * 40  # 40 points max for win rate
    if avg_rr is not None:
        rr_score = min(avg_rr / 3.0, 1.0) * 30  # 30 points max (capped at 3:1)
        score += rr_score
    if entry_accuracy is not None:
        score += entry_accuracy * 20  # 20 points max
    # Penalise high edit rate (channels that frequently edit signals are suspicious)
    score -= min(edit_rate * 10, 10)  # up to -10 for high edit rate

    return max(0.0, min(100.0, score))


def quality_tier(score: float) -> str:
    if score >= 90:
        return "S"
    if score >= 80:
        return "A"
    if score >= 70:
        return "B"
    if score >= 55:
        return "C"
    if score >= 40:
        return "D"
    return "F"
