import asyncio
import json
import time
import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.auth.auth import get_current_user
from backend.db.database import get_db

router = APIRouter(prefix="/api/channels", tags=["channels"])

_DEFAULT_WATCH_CONFIG = {"extractors": ["signal", "sentiment", "mention"]}


def _schedule_watcher_reload():
    """Fire-and-forget: tell the watcher to re-read channel list from DB."""
    from backend.services.watcher_service import get_watcher_service
    svc = get_watcher_service()
    if svc.status == "running":
        asyncio.create_task(svc.reload_channels())


class ChannelCreate(BaseModel):
    username: Optional[str] = None
    title: str
    telegram_id: Optional[int] = None
    watch_config: Optional[dict[str, Any]] = None


class ChannelUpdate(BaseModel):
    is_active: Optional[int] = None
    title: Optional[str] = None
    watch_config: Optional[dict[str, Any]] = None


@router.get("/")
async def list_channels(current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            """
            SELECT
                c.id, c.username, c.title, c.telegram_id, c.added_at,
                c.is_active, c.avatar_url, c.subscriber_count,
                cs.quality_score, cs.quality_tier, cs.win_rate,
                cs.avg_rr, cs.signal_count, cs.window
            FROM channels c
            LEFT JOIN channel_scores cs
                ON c.id = cs.channel_id AND cs.window = '30d'
            WHERE c.user_id = ?
            ORDER BY c.added_at DESC
            """,
            (current_user["id"],),
        ) as cursor:
            rows = await cursor.fetchall()

    return [dict(r) for r in rows]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_channel(
    channel_in: ChannelCreate,
    current_user: dict = Depends(get_current_user),
):
    channel_id = str(uuid.uuid4())
    now = time.time()

    watch_config_json = json.dumps(channel_in.watch_config or _DEFAULT_WATCH_CONFIG)

    async with get_db() as db:
        await db.execute(
            """
            INSERT INTO channels (id, user_id, username, title, telegram_id, added_at, is_active, watch_config)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            """,
            (
                channel_id,
                current_user["id"],
                channel_in.username,
                channel_in.title,
                channel_in.telegram_id,
                now,
                watch_config_json,
            ),
        )
        await db.commit()

    _schedule_watcher_reload()
    return {"id": channel_id, "title": channel_in.title, "added_at": now, "watch_config": channel_in.watch_config or _DEFAULT_WATCH_CONFIG}


@router.get("/{channel_id}")
async def get_channel(
    channel_id: str,
    current_user: dict = Depends(get_current_user),
):
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM channels WHERE id = ? AND user_id = ?",
            (channel_id, current_user["id"]),
        ) as cursor:
            row = await cursor.fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Channel not found")

    return dict(row)


@router.put("/{channel_id}")
async def update_channel(
    channel_id: str,
    channel_in: ChannelUpdate,
    current_user: dict = Depends(get_current_user),
):
    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM channels WHERE id = ? AND user_id = ?",
            (channel_id, current_user["id"]),
        ) as cursor:
            row = await cursor.fetchone()

        if row is None:
            raise HTTPException(status_code=404, detail="Channel not found")

        updates = {}
        if channel_in.is_active is not None:
            updates["is_active"] = channel_in.is_active
        if channel_in.title is not None:
            updates["title"] = channel_in.title
        if channel_in.watch_config is not None:
            updates["watch_config"] = json.dumps(channel_in.watch_config)

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [channel_id]
            await db.execute(
                f"UPDATE channels SET {set_clause} WHERE id = ?", values
            )
            await db.commit()

    _schedule_watcher_reload()
    return {"id": channel_id, "updated": list(updates.keys())}


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_channel(
    channel_id: str,
    current_user: dict = Depends(get_current_user),
):
    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM channels WHERE id = ? AND user_id = ?",
            (channel_id, current_user["id"]),
        ) as cursor:
            row = await cursor.fetchone()

        if row is None:
            raise HTTPException(status_code=404, detail="Channel not found")

        # Delete dependent records first
        async with db.execute(
            "SELECT id FROM signals WHERE channel_id = ?", (channel_id,)
        ) as cursor:
            signal_rows = await cursor.fetchall()

        signal_ids = [r["id"] for r in signal_rows]

        for sig_id in signal_ids:
            await db.execute("DELETE FROM outcomes WHERE signal_id = ?", (sig_id,))

        await db.execute("DELETE FROM signals WHERE channel_id = ?", (channel_id,))
        await db.execute(
            "DELETE FROM channel_scores WHERE channel_id = ?", (channel_id,)
        )
        await db.execute("DELETE FROM channels WHERE id = ?", (channel_id,))
        await db.commit()

    _schedule_watcher_reload()
