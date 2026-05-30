import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.auth.auth import get_current_user
from backend.db.database import get_db

router = APIRouter(prefix="/api/signals", tags=["signals"])


@router.get("/stats/today")
async def stats_today(current_user: dict = Depends(get_current_user)):
    today_start = time.time() - (time.time() % 86400)

    async with get_db() as db:
        # Signals posted today across user's channels
        async with db.execute(
            """
            SELECT COUNT(*) as count
            FROM signals s
            JOIN channels c ON s.channel_id = c.id
            WHERE c.user_id = ? AND s.posted_at >= ?
            """,
            (current_user["id"], today_start),
        ) as cursor:
            today_row = await cursor.fetchone()

        # Active signals (pending_entry or open)
        async with db.execute(
            """
            SELECT COUNT(*) as count
            FROM signals s
            JOIN channels c ON s.channel_id = c.id
            LEFT JOIN outcomes o ON s.id = o.signal_id
            WHERE c.user_id = ?
              AND (o.status IS NULL OR o.status IN ('pending_entry', 'open'))
            """,
            (current_user["id"],),
        ) as cursor:
            active_row = await cursor.fetchone()

    return {
        "total_today": today_row["count"] if today_row else 0,
        "active": active_row["count"] if active_row else 0,
    }


@router.get("/")
async def list_signals(
    channel_id: Optional[str] = Query(None),
    pair: Optional[str] = Query(None),
    direction: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    conditions = ["c.user_id = ?"]
    params: list = [current_user["id"]]

    if channel_id:
        conditions.append("s.channel_id = ?")
        params.append(channel_id)

    if pair:
        conditions.append("s.pair = ?")
        params.append(pair)

    if direction:
        conditions.append("s.direction = ?")
        params.append(direction)

    if status:
        conditions.append("o.status = ?")
        params.append(status)

    where_clause = " AND ".join(conditions)
    params.extend([limit, offset])

    async with get_db() as db:
        async with db.execute(
            f"""
            SELECT
                s.*,
                o.status as status,
                o.pips_result,
                o.rr_result,
                o.entry_hit,
                o.sl_hit,
                o.tp1_hit, o.tp2_hit, o.tp3_hit,
                c.title as channel_title,
                c.username as channel_username
            FROM signals s
            JOIN channels c ON s.channel_id = c.id
            LEFT JOIN outcomes o ON s.id = o.signal_id
            WHERE {where_clause}
            ORDER BY s.posted_at DESC
            LIMIT ? OFFSET ?
            """,
            params,
        ) as cursor:
            rows = await cursor.fetchall()

    return [dict(r) for r in rows]


@router.get("/{signal_id}")
async def get_signal(
    signal_id: str,
    current_user: dict = Depends(get_current_user),
):
    async with get_db() as db:
        async with db.execute(
            """
            SELECT
                s.*,
                o.id as outcome_id,
                o.status as status,
                o.entry_hit, o.entry_hit_at, o.entry_price_actual,
                o.tp1_hit, o.tp2_hit, o.tp3_hit, o.sl_hit,
                o.close_price, o.pips_result, o.rr_result,
                o.slippage_pips, o.entry_missed, o.resolved_at,
                c.title as channel_title, c.username as channel_username
            FROM signals s
            JOIN channels c ON s.channel_id = c.id
            LEFT JOIN outcomes o ON s.id = o.signal_id
            WHERE s.id = ? AND c.user_id = ?
            """,
            (signal_id, current_user["id"]),
        ) as cursor:
            row = await cursor.fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Signal not found")

    return dict(row)
