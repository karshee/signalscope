import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from backend.auth.auth import get_current_user
from backend.db.database import get_db
from engine.sender import TelegramSender, normalize_chat_id

router = APIRouter(prefix="/api/channels", tags=["messages"])


class SendIn(BaseModel):
    template_id: Optional[str] = None
    text: Optional[str] = None
    media_id: Optional[str] = None


async def _owned_channel(db, channel_id: str, user_id: str) -> dict:
    async with db.execute(
        "SELECT * FROM channels WHERE id = ? AND user_id = ?",
        (channel_id, user_id),
    ) as cursor:
        row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Channel not found")
    return dict(row)


@router.get("/{channel_id}/messages")
async def list_messages(
    channel_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    before: Optional[float] = None,
    current_user: dict = Depends(get_current_user),
):
    async with get_db() as db:
        await _owned_channel(db, channel_id, current_user["id"])
        where = "channel_id = ?"
        params: list = [channel_id]
        if before:
            where += " AND posted_at < ?"
            params.append(before)
        params.append(limit)
        async with db.execute(
            f"""SELECT * FROM channel_messages WHERE {where}
                ORDER BY posted_at DESC LIMIT ?""",
            params,
        ) as cursor:
            rows = await cursor.fetchall()
    return [dict(r) for r in reversed(rows)]  # oldest-first for the chat view


@router.post("/{channel_id}/send", status_code=status.HTTP_201_CREATED)
async def send_message(
    channel_id: str,
    send_in: SendIn,
    current_user: dict = Depends(get_current_user),
):
    """Manual send from the chat composer (or a one-click template chip)."""
    from engine.credentials import get_bot_token
    from engine.actions import ActionContext, exec_send_message, exec_send_media, ActionError
    from engine.events import Event, EVENT_MESSAGE
    from engine.templating import build_context

    token = await get_bot_token(current_user["id"])
    if not token:
        raise HTTPException(
            status_code=400,
            detail="No bot token configured — add your bot in Settings first",
        )

    async with get_db() as db:
        channel = await _owned_channel(db, channel_id, current_user["id"])

    # Manual sends reuse the action executors so template/media resolution,
    # file_id caching and the sent_messages ledger behave identically.
    dummy_event = Event(type=EVENT_MESSAGE, user_id=current_user["id"],
                        channel_id=channel_id, data={}, meta={"source": "composer"})
    ctx = ActionContext(
        user_id=current_user["id"], rule_id=None, sender=TelegramSender(),
        bot_token=token, template_context=build_context(dummy_event),
    )
    try:
        if send_in.media_id:
            detail = await exec_send_media(
                {"channel_id": channel_id, "media_id": send_in.media_id,
                 "caption": send_in.text or ""},
                dummy_event, ctx)
            kind = "animation"
        elif send_in.template_id or (send_in.text and send_in.text.strip()):
            detail = await exec_send_message(
                {"channel_id": channel_id, "template_id": send_in.template_id,
                 "text": send_in.text},
                dummy_event, ctx)
            kind = "text"
        else:
            raise HTTPException(status_code=422, detail="Nothing to send")
    except ActionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Insert immediately so the chat shows it without waiting for the next poll;
    # the watcher's INSERT OR IGNORE dedupes when it sees the same message.
    row_id = str(uuid.uuid4())
    now = time.time()
    tg_msg_id = detail.get("message_id")
    if tg_msg_id:
        async with get_db() as db:
            await db.execute(
                """INSERT OR IGNORE INTO channel_messages
                   (id, channel_id, message_id, sender_name, text, has_media,
                    media_type, posted_at, is_self_sent)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)""",
                (row_id, channel_id, tg_msg_id, channel.get("title"),
                 detail.get("text") or detail.get("caption") or "",
                 1 if kind != "text" else 0,
                 "animation" if kind != "text" else None, now),
            )
            await db.commit()

    return {"sent": True, "message_id": tg_msg_id, "detail": detail}
