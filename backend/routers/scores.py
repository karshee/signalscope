from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.auth.auth import get_current_user
from backend.db.database import get_db

router = APIRouter(prefix="/api/scores", tags=["scores"])


@router.get("/")
async def list_scores(current_user: dict = Depends(get_current_user)):
    """List channel scores for all of the user's channels (30d window by default)."""
    async with get_db() as db:
        async with db.execute(
            """
            SELECT
                cs.*,
                c.title as channel_title,
                c.username as channel_username
            FROM channel_scores cs
            JOIN channels c ON cs.channel_id = c.id
            WHERE c.user_id = ? AND cs.window = '30d'
            ORDER BY cs.quality_score DESC NULLS LAST
            """,
            (current_user["id"],),
        ) as cursor:
            rows = await cursor.fetchall()

    return [dict(r) for r in rows]


@router.get("/leaderboard")
async def leaderboard(
    window: str = Query("30d", pattern="^(7d|30d|90d)$"),
    min_signals: int = Query(5, ge=1),
    current_user: dict = Depends(get_current_user),
):
    """All channels sorted by quality_score descending (filtered by min_signals)."""
    async with get_db() as db:
        async with db.execute(
            """
            SELECT
                cs.*,
                c.title as channel_title,
                c.username as channel_username
            FROM channel_scores cs
            JOIN channels c ON cs.channel_id = c.id
            WHERE cs.window = ?
              AND cs.signal_count >= ?
            ORDER BY cs.quality_score DESC NULLS LAST
            """,
            (window, min_signals),
        ) as cursor:
            rows = await cursor.fetchall()

    return [dict(r) for r in rows]


@router.get("/channel/{channel_id}")
async def channel_scores(
    channel_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get score detail for a channel across all windows."""
    async with get_db() as db:
        # Verify ownership
        async with db.execute(
            "SELECT id FROM channels WHERE id = ? AND user_id = ?",
            (channel_id, current_user["id"]),
        ) as cursor:
            row = await cursor.fetchone()

        if row is None:
            raise HTTPException(status_code=404, detail="Channel not found")

        async with db.execute(
            """
            SELECT cs.*, c.title as channel_title, c.username as channel_username
            FROM channel_scores cs
            JOIN channels c ON cs.channel_id = c.id
            WHERE cs.channel_id = ?
            ORDER BY cs.window
            """,
            (channel_id,),
        ) as cursor:
            rows = await cursor.fetchall()

    return [dict(r) for r in rows]
