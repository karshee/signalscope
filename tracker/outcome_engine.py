"""
Outcome engine: checks open signals against live prices to detect TP/SL hits.
Runs every 5 minutes via APScheduler.
"""
import asyncio
import logging
import time
import uuid
from typing import Optional, Callable

from tracker.price_feed import get_current_price, pips_distance

logger = logging.getLogger(__name__)


async def check_signal_outcome(signal: dict, db) -> Optional[dict]:
    """
    Check one signal. Returns outcome update dict if resolved, else None.
    signal: dict with pair, entry_price, stop_loss, tp1, tp2, tp3, direction
    """
    pair = signal.get("pair")
    if not pair:
        return None

    current_price = await get_current_price(pair)
    if current_price is None:
        return None

    entry = signal.get("entry_price")
    sl = signal.get("stop_loss")
    tp1 = signal.get("tp1")
    tp2 = signal.get("tp2")
    tp3 = signal.get("tp3")
    direction = (signal.get("direction") or "").lower()

    outcome = {}

    # Entry check: did price reach entry zone?
    outcome_status = signal.get("outcome_status", "pending_entry")
    entry_hit = bool(signal.get("entry_hit"))

    if not entry_hit and entry:
        if direction == "buy" and current_price <= entry * 1.002:  # within 0.2%
            outcome["entry_hit"] = 1
            outcome["entry_hit_at"] = time.time()
            outcome["entry_price_actual"] = current_price
            entry_hit = True
            outcome_status = "active"
        elif direction == "sell" and current_price >= entry * 0.998:
            outcome["entry_hit"] = 1
            outcome["entry_hit_at"] = time.time()
            outcome["entry_price_actual"] = current_price
            entry_hit = True
            outcome_status = "active"

    if not entry_hit and not entry:
        # Market order — treat as always entered
        entry_hit = True
        outcome_status = "active"
        if not signal.get("entry_hit"):
            outcome["entry_hit"] = 1
            outcome["entry_hit_at"] = signal.get("posted_at", time.time())

    if entry_hit:
        ref_price = signal.get("entry_price_actual") or entry or current_price

        # Check SL
        if sl and not signal.get("sl_hit"):
            sl_hit = False
            if direction == "buy" and current_price <= sl:
                sl_hit = True
            elif direction == "sell" and current_price >= sl:
                sl_hit = True

            if sl_hit:
                pips = pips_distance(pair, ref_price, sl)
                rr = 0.0
                if tp1 and ref_price and sl:
                    potential = abs(tp1 - ref_price)
                    risk = abs(ref_price - sl)
                    rr = potential / risk if risk > 0 else 0
                outcome.update({
                    "sl_hit": 1,
                    "status": "sl_hit",
                    "close_price": current_price,
                    "pips_result": -abs(pips),
                    "rr_result": -rr,
                    "resolved_at": time.time(),
                })
                return outcome

        # Check TPs
        for tp_num, tp_val in enumerate([(tp1, "tp1_hit"), (tp2, "tp2_hit"), (tp3, "tp3_hit")], 1):
            tp_price, tp_key = tp_val
            if not tp_price or signal.get(tp_key):
                continue
            tp_hit = False
            if direction == "buy" and current_price >= tp_price:
                tp_hit = True
            elif direction == "sell" and current_price <= tp_price:
                tp_hit = True

            if tp_hit:
                pips = pips_distance(pair, ref_price, tp_price)
                rr = 0.0
                if sl and ref_price:
                    risk_pips = pips_distance(pair, ref_price, sl)
                    rr = pips / risk_pips if risk_pips > 0 else 0
                outcome[tp_key] = 1
                # Only mark fully resolved on TP3 or if no further TPs
                if tp_num == 3 or (tp_num == 1 and not tp2 and not tp3) or (tp_num == 2 and not tp3):
                    outcome.update({
                        "status": f"tp{tp_num}_hit",
                        "close_price": current_price,
                        "pips_result": pips,
                        "rr_result": rr,
                        "resolved_at": time.time(),
                    })
                else:
                    outcome["status"] = f"tp{tp_num}_hit"

    if outcome_status and not outcome.get("status"):
        outcome["status"] = outcome_status

    return outcome if outcome else None


async def run_outcome_checks(db, broadcast_fn: Optional[Callable] = None):
    """Run outcome checks for all open signals."""
    try:
        async with db() as conn:
            rows = await conn.execute_fetchall(
                """
                SELECT s.id, s.pair, s.direction, s.entry_price, s.stop_loss,
                       s.tp1, s.tp2, s.tp3, s.posted_at,
                       o.status as outcome_status, o.entry_hit, o.entry_price_actual,
                       o.tp1_hit, o.tp2_hit, o.tp3_hit, o.sl_hit
                FROM signals s
                LEFT JOIN outcomes o ON o.signal_id = s.id
                WHERE o.status IN ('pending_entry', 'active', 'tp1_hit', 'tp2_hit')
                   OR (o.status IS NULL AND s.posted_at > ?)
                LIMIT 100
                """,
                (time.time() - 7 * 86400,),  # only check signals from last 7 days
            )
        for row in rows:
            signal = dict(row)
            update = await check_signal_outcome(signal, db)
            if update:
                async with db() as conn:
                    # Build SET clause dynamically
                    fields = list(update.keys())
                    vals = list(update.values())
                    set_clause = ", ".join(f"{f} = ?" for f in fields)
                    vals.append(signal["id"])
                    await conn.execute(
                        f"UPDATE outcomes SET {set_clause} WHERE signal_id = ?",
                        vals,
                    )
                    await conn.commit()

                if broadcast_fn and update.get("status") and "hit" in update.get("status", ""):
                    await broadcast_fn({
                        "type": "outcome_update",
                        "data": {"signal_id": signal["id"], **update},
                    })
    except Exception as e:
        logger.error(f"Outcome check error: {e}")
