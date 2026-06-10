"""Telegram Bot API sender + dry-run double.

All sends go through a sender implementing the same interface so the rule
runner, tests, and the rule "test fire" endpoint share one code path.
"""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

BOT_API = "https://api.telegram.org/bot{token}/{method}"


def normalize_chat_id(telegram_id: Optional[int], username: Optional[str] = None) -> Optional[str]:
    """Convert a stored channel identity into a Bot API chat_id.

    Telethon stores channel ids as bare positive ints; the Bot API expects the
    -100 prefixed form. Usernames work as @username.
    """
    if telegram_id:
        tid = int(telegram_id)
        if tid > 0:
            return f"-100{tid}"
        return str(tid)
    if username:
        return username if username.startswith("@") else f"@{username}"
    return None


class SendResult:
    def __init__(self, ok: bool, message_id: Optional[int] = None,
                 file_id: Optional[str] = None, error: Optional[str] = None):
        self.ok = ok
        self.message_id = message_id
        self.file_id = file_id
        self.error = error

    def as_dict(self) -> dict:
        return {"ok": self.ok, "message_id": self.message_id, "error": self.error}


class TelegramSender:
    """Bot API HTTP sender with single 429 retry."""

    def __init__(self, timeout: float = 20.0):
        self._timeout = timeout

    async def _call(self, token: str, method: str, data: dict,
                    files: Optional[dict] = None) -> dict:
        url = BOT_API.format(token=token, method=method)
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(url, data=data, files=files)
            body = resp.json()
            if resp.status_code == 429:
                retry_after = (body.get("parameters") or {}).get("retry_after", 3)
                logger.warning(f"Bot API 429 — retrying after {retry_after}s")
                await asyncio.sleep(min(float(retry_after), 30.0))
                resp = await client.post(url, data=data, files=files)
                body = resp.json()
            return body

    @staticmethod
    def _result(body: dict) -> SendResult:
        if body.get("ok"):
            r = body.get("result") or {}
            file_id = None
            for key in ("animation", "video", "document"):
                if isinstance(r.get(key), dict):
                    file_id = r[key].get("file_id")
                    break
            photos = r.get("photo")
            if not file_id and isinstance(photos, list) and photos:
                file_id = photos[-1].get("file_id")
            return SendResult(True, message_id=r.get("message_id"), file_id=file_id)
        return SendResult(False, error=body.get("description", "unknown Bot API error"))

    async def get_me(self, token: str) -> dict:
        return await self._call(token, "getMe", {})

    async def send_text(self, token: str, chat_id: str, text: str,
                        parse_mode: Optional[str] = "HTML") -> SendResult:
        data = {"chat_id": chat_id, "text": text}
        if parse_mode and parse_mode != "none":
            data["parse_mode"] = parse_mode
        return self._result(await self._call(token, "sendMessage", data))

    async def send_media(self, token: str, chat_id: str, kind: str,
                         caption: str = "", parse_mode: Optional[str] = "HTML",
                         file_id: Optional[str] = None, url: Optional[str] = None,
                         file_path: Optional[str] = None) -> SendResult:
        """Send a GIF/photo/video. Source priority: cached file_id > url > local file upload."""
        method, field = {
            "gif": ("sendAnimation", "animation"),
            "photo": ("sendPhoto", "photo"),
            "video": ("sendVideo", "video"),
        }.get(kind, ("sendDocument", "document"))

        data: dict = {"chat_id": chat_id}
        if caption:
            data["caption"] = caption
            if parse_mode and parse_mode != "none":
                data["parse_mode"] = parse_mode

        files = None
        if file_id:
            data[field] = file_id
        elif url:
            data[field] = url
        elif file_path:
            p = Path(file_path)
            if not p.exists():
                return SendResult(False, error=f"media file missing: {file_path}")
            files = {field: (p.name, p.read_bytes())}
        else:
            return SendResult(False, error="no media source (file_id/url/path)")

        return self._result(await self._call(token, method, data, files=files))

    async def copy_message(self, token: str, chat_id: str, from_chat_id: str,
                           message_id: int) -> SendResult:
        return self._result(await self._call(token, "copyMessage", {
            "chat_id": chat_id, "from_chat_id": from_chat_id, "message_id": message_id,
        }))


class DryRunSender:
    """Records would-have-sent payloads. Used by tests and rule test-fire."""

    def __init__(self):
        self.sent: list[dict] = []
        self._next_id = 1000

    def _record(self, kind: str, payload: dict) -> SendResult:
        self._next_id += 1
        self.sent.append({"kind": kind, **payload, "message_id": self._next_id})
        return SendResult(True, message_id=self._next_id)

    async def get_me(self, token: str) -> dict:
        return {"ok": True, "result": {"username": "dry_run_bot"}}

    async def send_text(self, token: str, chat_id: str, text: str,
                        parse_mode: Optional[str] = "HTML") -> SendResult:
        return self._record("text", {"chat_id": chat_id, "text": text, "parse_mode": parse_mode})

    async def send_media(self, token: str, chat_id: str, kind: str,
                         caption: str = "", parse_mode: Optional[str] = "HTML",
                         file_id: Optional[str] = None, url: Optional[str] = None,
                         file_path: Optional[str] = None) -> SendResult:
        return self._record("media", {
            "chat_id": chat_id, "media_kind": kind, "caption": caption,
            "file_id": file_id, "url": url, "file_path": file_path,
        })

    async def copy_message(self, token: str, chat_id: str, from_chat_id: str,
                           message_id: int) -> SendResult:
        return self._record("copy", {
            "chat_id": chat_id, "from_chat_id": from_chat_id, "message_id": message_id,
        })
