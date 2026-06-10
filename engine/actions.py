"""Action executors — registry keyed by type.

Each executor receives (config, event, ctx) and returns a detail dict that is
stored in the execution log. ActionContext carries everything an action needs
so executors stay pure and testable.
"""
from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from engine.events import Event, EVENT_MESSAGE
from engine.sender import normalize_chat_id
from engine.templating import render, build_context

logger = logging.getLogger(__name__)


class ActionError(Exception):
    pass


@dataclass
class ActionContext:
    user_id: str
    rule_id: Optional[str]
    sender: Any                      # TelegramSender | DryRunSender
    bot_token: Optional[str]
    dry_run: bool = False
    template_context: dict = field(default_factory=dict)


async def _load_channel(channel_id: str, user_id: str) -> Optional[dict]:
    from backend.db.database import get_db
    async with get_db() as db:
        async with db.execute(
            "SELECT id, username, title, telegram_id FROM channels WHERE id = ? AND user_id = ?",
            (channel_id, user_id),
        ) as cursor:
            row = await cursor.fetchone()
    return dict(row) if row else None


async def _load_template(template_id: str, user_id: str) -> Optional[dict]:
    from backend.db.database import get_db
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM message_templates WHERE id = ? AND user_id = ?",
            (template_id, user_id),
        ) as cursor:
            row = await cursor.fetchone()
    return dict(row) if row else None


async def _load_media(media_id: str, user_id: str) -> Optional[dict]:
    from backend.db.database import get_db
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM media_assets WHERE id = ? AND user_id = ?",
            (media_id, user_id),
        ) as cursor:
            row = await cursor.fetchone()
    return dict(row) if row else None


async def _record_sent(ctx: ActionContext, chat_id: str, message_id: Optional[int],
                       template_id: Optional[str], kind: str):
    if ctx.dry_run or message_id is None:
        return
    from backend.db.database import get_db
    async with get_db() as db:
        await db.execute(
            """INSERT OR IGNORE INTO sent_messages
               (id, user_id, rule_id, chat_id, telegram_message_id, template_id, kind, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (str(uuid.uuid4()), ctx.user_id, ctx.rule_id, chat_id,
             message_id, template_id, kind, time.time()),
        )
        await db.commit()


async def _cache_file_id(media_id: str, file_id: str):
    from backend.db.database import get_db
    async with get_db() as db:
        await db.execute(
            "UPDATE media_assets SET telegram_file_id = ? WHERE id = ?",
            (file_id, media_id),
        )
        await db.commit()


def _require_token(ctx: ActionContext):
    if not ctx.bot_token and not ctx.dry_run:
        raise ActionError("no bot token configured — add one in Settings")


async def _resolve_chat(config: dict, ctx: ActionContext) -> tuple[str, dict]:
    channel_id = config.get("channel_id")
    if not channel_id:
        raise ActionError("action has no target channel")
    channel = await _load_channel(channel_id, ctx.user_id)
    if not channel:
        raise ActionError(f"target channel {channel_id} not found")
    chat_id = normalize_chat_id(channel.get("telegram_id"), channel.get("username"))
    if not chat_id:
        raise ActionError(f"channel {channel.get('title')} has no telegram id or username")
    return chat_id, channel


async def _send_template_media(ctx: ActionContext, chat_id: str, template: dict,
                               caption: str) -> "SendResult":
    """Send a template's attached media (uploaded asset or external URL)."""
    parse_mode = template.get("parse_mode") or "HTML"
    if template.get("media_id"):
        media = await _load_media(template["media_id"], ctx.user_id)
        if not media:
            raise ActionError("template media asset missing")
        result = await ctx.sender.send_media(
            ctx.bot_token, chat_id, media["kind"], caption=caption, parse_mode=parse_mode,
            file_id=media.get("telegram_file_id"), file_path=media.get("path"),
        )
        if result.ok and result.file_id and not media.get("telegram_file_id"):
            await _cache_file_id(media["id"], result.file_id)
        return result
    return await ctx.sender.send_media(
        ctx.bot_token, chat_id, "gif", caption=caption, parse_mode=parse_mode,
        url=template.get("media_url"),
    )


async def exec_send_message(config: dict, event: Event, ctx: ActionContext) -> dict:
    """Post a template (or inline text) to a channel. Templates with media send as media+caption."""
    _require_token(ctx)
    chat_id, channel = await _resolve_chat(config, ctx)

    template = None
    template_id = config.get("template_id")
    if template_id:
        template = await _load_template(template_id, ctx.user_id)
        if not template:
            raise ActionError(f"template {template_id} not found")
        body = template["body"]
        parse_mode = template.get("parse_mode") or "HTML"
    else:
        body = config.get("text") or ""
        parse_mode = config.get("parse_mode") or "HTML"
    if not body and not (template and (template.get("media_id") or template.get("media_url"))):
        raise ActionError("nothing to send — empty body and no media")

    text, warnings = render(body, ctx.template_context)

    if template and (template.get("media_id") or template.get("media_url")):
        result = await _send_template_media(ctx, chat_id, template, caption=text)
        kind = "animation"
    else:
        result = await ctx.sender.send_text(ctx.bot_token, chat_id, text, parse_mode)
        kind = "text"

    if not result.ok:
        raise ActionError(f"send failed: {result.error}")
    await _record_sent(ctx, chat_id, result.message_id, template_id, kind)
    return {"chat_id": chat_id, "channel": channel.get("title"), "text": text,
            "message_id": result.message_id, "warnings": warnings}


async def exec_send_media(config: dict, event: Event, ctx: ActionContext) -> dict:
    """Post a GIF/photo (library asset or URL) with an optional caption template."""
    _require_token(ctx)
    chat_id, channel = await _resolve_chat(config, ctx)
    caption, warnings = render(config.get("caption") or "", ctx.template_context)

    media_id = config.get("media_id")
    if media_id:
        media = await _load_media(media_id, ctx.user_id)
        if not media:
            raise ActionError(f"media asset {media_id} not found")
        result = await ctx.sender.send_media(
            ctx.bot_token, chat_id, media["kind"], caption=caption,
            file_id=media.get("telegram_file_id"), file_path=media.get("path"),
        )
        if result.ok and result.file_id and not media.get("telegram_file_id"):
            await _cache_file_id(media_id, result.file_id)
    elif config.get("media_url"):
        result = await ctx.sender.send_media(
            ctx.bot_token, chat_id, config.get("kind") or "gif",
            caption=caption, url=config["media_url"],
        )
    else:
        raise ActionError("send media action needs a media asset or URL")

    if not result.ok:
        raise ActionError(f"send failed: {result.error}")
    await _record_sent(ctx, chat_id, result.message_id, None, "animation")
    return {"chat_id": chat_id, "channel": channel.get("title"), "caption": caption,
            "message_id": result.message_id, "warnings": warnings}


async def exec_forward_message(config: dict, event: Event, ctx: ActionContext) -> dict:
    """Copy the triggering message to another channel (Bot API copyMessage —
    the bot must be admin in the source channel too)."""
    _require_token(ctx)
    if event.type != EVENT_MESSAGE:
        raise ActionError("forward only works on message triggers")
    chat_id, channel = await _resolve_chat(config, ctx)

    source = await _load_channel(event.channel_id, ctx.user_id) if event.channel_id else None
    if not source:
        raise ActionError("source channel not found")
    from_chat = normalize_chat_id(source.get("telegram_id"), source.get("username"))
    message_id = event.data.get("message_id")
    if not from_chat or not message_id:
        raise ActionError("source message not addressable")

    result = await ctx.sender.copy_message(ctx.bot_token, chat_id, from_chat, int(message_id))
    if not result.ok:
        raise ActionError(f"copy failed: {result.error}")
    await _record_sent(ctx, chat_id, result.message_id, None, "copy")
    return {"chat_id": chat_id, "channel": channel.get("title"),
            "from_chat_id": from_chat, "message_id": result.message_id}


ACTIONS: dict[str, Callable] = {
    "send_message": exec_send_message,
    "send_media": exec_send_media,
    "forward_message": exec_forward_message,
}

ACTION_TYPES = tuple(ACTIONS.keys())


async def execute(action_type: str, config: dict, event: Event, ctx: ActionContext) -> dict:
    fn = ACTIONS.get(action_type)
    if not fn:
        raise ActionError(f"unknown action type {action_type!r}")
    return await fn(config, event, ctx)


def validate_action(action_type: str, config: dict) -> list[str]:
    errors = []
    if action_type in ("send_message", "send_media", "forward_message"):
        if not config.get("channel_id"):
            errors.append("action needs a target channel")
    if action_type == "send_message":
        if not config.get("template_id") and not str(config.get("text", "")).strip():
            errors.append("post message needs a template or text")
    if action_type == "send_media":
        if not config.get("media_id") and not str(config.get("media_url", "")).strip():
            errors.append("post media needs an uploaded asset or a URL")
    return errors
