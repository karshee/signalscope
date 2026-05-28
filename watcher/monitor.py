import asyncio
import logging
import time
import uuid
from typing import Optional, Callable, Any
from watcher.client import TapwireClient
from parser.extractor_registry import ExtractorRegistry
from parser.base_extractor import ExtractedEvent

logger = logging.getLogger(__name__)


class ChannelMonitor:
    def __init__(
        self,
        client: TapwireClient,
        on_signal: Callable,  # async callback(channel_id, events: list[ExtractedEvent], raw_text, message_id)
        poll_interval: float = 5.0,
        registry: Optional[ExtractorRegistry] = None,
    ):
        self.client = client
        self.on_signal = on_signal
        self.poll_interval = poll_interval
        self.registry = registry or ExtractorRegistry.default()
        self._channels: dict = {}  # channel_id -> {"name": str, "last_msg_id": int, "telegram_id": int}
        self._running = False
        self._last_ids: dict = {}  # str(telegram_id) -> int

    def add_channel(self, channel_id: str, name: str, telegram_id: int, last_msg_id: int = 0):
        self._channels[channel_id] = {
            "name": name,
            "telegram_id": telegram_id,
            "last_msg_id": last_msg_id,
        }
        self._last_ids[str(telegram_id)] = last_msg_id

    def remove_channel(self, channel_id: str):
        if channel_id in self._channels:
            tid = self._channels[channel_id].get("telegram_id")
            del self._channels[channel_id]
            if tid:
                self._last_ids.pop(str(tid), None)

    def update_channels(self, channels: list):
        """Replace channel list from DB."""
        self._channels.clear()
        for ch in channels:
            cid = ch["id"]
            tid = ch.get("telegram_id") or ch.get("username")
            self._channels[cid] = {
                "name": ch.get("title", ""),
                "telegram_id": tid,
                "last_msg_id": self._last_ids.get(str(tid), 0),
            }

    async def _poll_channel(self, channel_id: str, info: dict):
        tid = info["telegram_id"]
        if not tid:
            return
        key = str(tid)
        last_id = self._last_ids.get(key, 0)

        try:
            msgs = await self.client.fetch_messages(tid, min_id=last_id, limit=50)
        except Exception as e:
            logger.warning(f"Poll error for {info['name']}: {e}")
            return

        max_id = last_id
        for msg in msgs:
            if msg.id > max_id:
                max_id = msg.id
            text = msg.text or msg.message or getattr(msg, "caption", "") or ""
            if not text:
                continue

            try:
                events = self.registry.process(text, channel_id=channel_id, message_id=msg.id)
                if events:
                    await self.on_signal(channel_id, events, text, msg.id)
            except Exception as e:
                logger.warning(f"Extract error: {e}")

        if max_id > last_id:
            self._last_ids[key] = max_id

    async def run(self):
        self._running = True
        logger.info("Channel monitor started")
        while self._running:
            if not self.client.is_connected:
                await self.client.reconnect("monitor_loop_check")
                await asyncio.sleep(5)
                continue

            for channel_id, info in list(self._channels.items()):
                await self._poll_channel(channel_id, info)
                await asyncio.sleep(0.2)  # small yield

            await asyncio.sleep(self.poll_interval)

    def stop(self):
        self._running = False
