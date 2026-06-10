"""Singleton watcher service — manages TapwireClient + ChannelMonitor lifecycle."""
import asyncio
import logging
import os
import time
import uuid
from typing import Optional

logger = logging.getLogger(__name__)

_instance: Optional["WatcherService"] = None


def get_watcher_service() -> "WatcherService":
    global _instance
    if _instance is None:
        _instance = WatcherService()
    return _instance


class WatcherService:
    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._client = None
        self._monitor = None
        self.running = False
        self.status = "stopped"   # stopped | unconfigured | starting | running | error
        self.error: Optional[str] = None

    async def start(self) -> bool:
        from watcher.client import TapwireClient
        from watcher.monitor import ChannelMonitor

        api_id_str = os.getenv("TELEGRAM_API_ID", "")
        api_hash = os.getenv("TELEGRAM_API_HASH", "")
        session = os.getenv("TELEGRAM_SESSION", "")

        if not all([api_id_str, api_hash, session]):
            logger.info("Telegram credentials not set — watcher disabled")
            self.status = "unconfigured"
            return False

        try:
            api_id = int(api_id_str)
        except ValueError:
            self.status = "error"
            self.error = "TELEGRAM_API_ID must be an integer"
            logger.error(self.error)
            return False

        self.status = "starting"
        self._client = TapwireClient(api_id, api_hash, session)
        connected = await self._client.connect()
        if not connected:
            self.status = "error"
            self.error = "Telegram auth failed — session may be expired; regenerate TELEGRAM_SESSION"
            logger.error(self.error)
            return False

        self._monitor = ChannelMonitor(
            client=self._client,
            on_signal=self._on_signal,
            on_message=self._on_message,
            poll_interval=float(os.getenv("WATCHER_POLL_INTERVAL", "5")),
        )
        await self._reload_channels()

        self._task = asyncio.create_task(self._run_loop(), name="watcher-poll-loop")
        self.running = True
        self.status = "running"
        logger.info("Watcher service running")
        return True

    async def stop(self):
        self.running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await asyncio.wait_for(self._task, timeout=5)
            except (asyncio.CancelledError, asyncio.TimeoutError):
                pass
        if self._monitor:
            self._monitor.stop()
        if self._client:
            await self._client.disconnect()
        self.status = "stopped"
        logger.info("Watcher service stopped")

    async def reload_channels(self):
        """Reload channel list from DB — called when channels are added/removed via API."""
        if self._monitor and self.status == "running":
            await self._reload_channels()

    async def _reload_channels(self):
        from backend.db.database import get_db
        async with get_db() as db:
            async with db.execute(
                "SELECT id, username, title, telegram_id FROM channels WHERE is_active = 1"
            ) as cursor:
                rows = await cursor.fetchall()
        channels = [dict(r) for r in rows]
        self._monitor.update_channels(channels)
        logger.debug(f"Watcher loaded {len(channels)} active channels")

    async def _run_loop(self):
        """Poll all channels, reload channel list from DB every minute."""
        poll_interval = self._monitor.poll_interval
        reload_every = 60
        last_reload = 0.0

        while True:
            try:
                now = time.monotonic()
                if now - last_reload >= reload_every:
                    await self._reload_channels()
                    last_reload = now

                if not self._client.is_connected:
                    await self._client.reconnect("loop_check")
                    await asyncio.sleep(5)
                    continue

                for channel_id, info in list(self._monitor._channels.items()):
                    await self._monitor._poll_channel(channel_id, info)
                    await asyncio.sleep(0.2)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Watcher loop error: {e}", exc_info=True)

            await asyncio.sleep(poll_interval)

    @staticmethod
    def _media_type(msg) -> Optional[str]:
        if getattr(msg, "gif", None):
            return "animation"
        if getattr(msg, "photo", None):
            return "photo"
        if getattr(msg, "video", None):
            return "video"
        if getattr(msg, "document", None):
            return "document"
        return None

    async def _on_message(self, channel_id: str, info: dict, msg, events):
        """Persist every incoming message for the chat UI, flag self-sent ones,
        broadcast live, and hand the event to the automation engine."""
        from backend.db.database import get_db
        from backend.ws.manager import manager
        from engine.events import Event, EVENT_MESSAGE
        from engine.service import get_engine_service

        text = msg.text or msg.message or getattr(msg, "caption", "") or ""
        media_type = self._media_type(msg)
        now = time.time()
        posted_at = getattr(msg, "date", None)
        posted_ts = posted_at.timestamp() if posted_at else now
        sender_name = info.get("name") or ""

        tid = info.get("telegram_id")
        bot_chat_id = None
        if tid and str(tid).lstrip("-").isdigit():
            bot_chat_id = str(tid) if int(tid) < 0 else f"-100{tid}"

        async with get_db() as db:
            async with db.execute(
                "SELECT user_id FROM channels WHERE id = ?", (channel_id,)
            ) as cursor:
                owner = await cursor.fetchone()
            if not owner:
                return
            user_id = owner["user_id"]

            is_self_sent = 0
            if bot_chat_id:
                async with db.execute(
                    "SELECT 1 FROM sent_messages WHERE chat_id = ? AND telegram_message_id = ?",
                    (bot_chat_id, msg.id),
                ) as cursor:
                    if await cursor.fetchone():
                        is_self_sent = 1

            row_id = str(uuid.uuid4())
            cur = await db.execute(
                """INSERT OR IGNORE INTO channel_messages
                   (id, channel_id, message_id, sender_name, text, has_media,
                    media_type, posted_at, is_self_sent)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (row_id, channel_id, msg.id, sender_name, text,
                 1 if media_type else 0, media_type, posted_ts, is_self_sent),
            )
            inserted = cur.rowcount > 0
            await db.commit()

        if not inserted:  # redelivered message — already handled
            return

        payload = {
            "id": row_id,
            "channel_id": channel_id,
            "message_id": msg.id,
            "sender_name": sender_name,
            "text": text,
            "has_media": bool(media_type),
            "media_type": media_type,
            "posted_at": posted_ts,
            "is_self_sent": bool(is_self_sent),
        }
        await manager.send_to_user(user_id, {"type": "channel_message", "data": payload})

        get_engine_service().emit(Event(
            type=EVENT_MESSAGE,
            user_id=user_id,
            channel_id=channel_id,
            data={
                "text": text,
                "message_id": msg.id,
                "channel_title": sender_name,
                "has_media": bool(media_type),
                "media_type": media_type,
                "extracted": [
                    {"extractor": e.extractor, "data": e.data, "confidence": e.confidence}
                    for e in (events or [])
                ],
            },
            meta={"self_sent": bool(is_self_sent), "source": "watcher"},
        ))

    async def _on_signal(self, channel_id: str, events, raw_text: str, message_id: int):
        """Persist new signal events and broadcast to the channel owner via WebSocket."""
        from backend.db.database import get_db
        from backend.ws.manager import manager

        for event in events:
            if event.extractor != "signal":
                continue

            d = event.data
            tps = d.get("take_profits") or []
            tp1 = tps[0] if len(tps) > 0 else None
            tp2 = tps[1] if len(tps) > 1 else None
            tp3 = tps[2] if len(tps) > 2 else None

            signal_id = str(uuid.uuid4())
            now = time.time()

            async with get_db() as db:
                # Guard against duplicate message IDs (Telegram can redeliver)
                async with db.execute(
                    "SELECT id FROM signals WHERE channel_id = ? AND message_id = ?",
                    (channel_id, message_id),
                ) as cursor:
                    if await cursor.fetchone():
                        continue

                await db.execute(
                    """
                    INSERT INTO signals (
                        id, channel_id, message_id, raw_text, posted_at,
                        pair, direction, entry_price,
                        stop_loss, tp1, tp2, tp3, signal_type, parse_confidence
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        signal_id, channel_id, message_id, raw_text, now,
                        d.get("pair"), d.get("direction"), d.get("entry_price"),
                        d.get("stop_loss"), tp1, tp2, tp3,
                        d.get("signal_type", "market"), event.confidence,
                    ),
                )
                await db.execute(
                    "INSERT INTO outcomes (id, signal_id, status) VALUES (?, ?, 'pending_entry')",
                    (str(uuid.uuid4()), signal_id),
                )
                await db.commit()

                async with db.execute(
                    "SELECT user_id FROM channels WHERE id = ?", (channel_id,)
                ) as cursor:
                    row = await cursor.fetchone()

            if row:
                await manager.send_to_user(row["user_id"], {
                    "type": "new_signal",
                    "data": {
                        "id": signal_id,
                        "channel_id": channel_id,
                        "pair": d.get("pair"),
                        "direction": d.get("direction"),
                        "entry_price": d.get("entry_price"),
                        "stop_loss": d.get("stop_loss"),
                        "tp1": tp1, "tp2": tp2, "tp3": tp3,
                        "signal_type": d.get("signal_type", "market"),
                        "parse_confidence": event.confidence,
                        "posted_at": now,
                        "raw_text": raw_text,
                        "status": "pending_entry",
                    },
                })
                logger.info(
                    "Signal ingested: %s %s channel=%s",
                    d.get("pair"), d.get("direction"), channel_id,
                )
