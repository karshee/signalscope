"""
Telegram client for SignalScope — ported from signal-watcher/watcher.py.
Handles connection, flood-wait, reconnection with exponential backoff.
"""
import asyncio
import logging
import os
from typing import Optional, Callable, Any
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import FloodWaitError, SecurityError

logger = logging.getLogger(__name__)


class SignalScopeClient:
    def __init__(self, api_id: int, api_hash: str, session_string: str):
        self.api_id = api_id
        self.api_hash = api_hash
        self.session_string = session_string
        self._client: Optional[TelegramClient] = None
        self._connected = False

    def _make_client(self) -> TelegramClient:
        return TelegramClient(
            StringSession(self.session_string),
            self.api_id,
            self.api_hash,
            receive_updates=False,  # poll-only, avoids post-sleep backlog
            connection_retries=5,
            retry_delay=2,
        )

    async def connect(self) -> bool:
        """Connect and verify auth. Returns True if success."""
        max_retries = 5
        for attempt in range(max_retries):
            try:
                self._client = self._make_client()
                await self._client.connect()
                if not await self._client.is_user_authorized():
                    logger.error("Session expired — re-authenticate")
                    return False
                me = await self._client.get_me()
                logger.info(f"Connected as {me.first_name} (@{getattr(me, 'username', None)})")
                self._connected = True
                return True
            except Exception as e:
                delay = 2 ** attempt
                logger.warning(f"Connect attempt {attempt+1} failed: {e}. Retry in {delay}s")
                await asyncio.sleep(delay)
        return False

    async def disconnect(self):
        if self._client and self._client.is_connected():
            await self._client.disconnect()
        self._connected = False

    async def reconnect(self, reason: str = "unknown"):
        logger.info(f"Reconnecting ({reason})...")
        await self.disconnect()
        await asyncio.sleep(2)
        await self.connect()

    async def fetch_messages(self, chat_id, min_id: int = 0, limit: int = 50):
        """Fetch new messages from channel since min_id."""
        if not self._client:
            return []
        try:
            msgs = []
            async for msg in self._client.iter_messages(chat_id, min_id=min_id, limit=limit):
                msgs.append(msg)
            msgs.reverse()
            return msgs
        except FloodWaitError as e:
            logger.warning(f"Flood wait {e.seconds}s for {chat_id}")
            await asyncio.sleep(e.seconds)
            return []
        except SecurityError as e:
            logger.warning(f"Security error: {e} — reconnecting")
            await self.reconnect("security_error")
            return []
        except Exception as e:
            logger.warning(f"Fetch error for {chat_id}: {e}")
            # Reconnect on connection-level errors
            err_str = str(e).lower()
            if any(x in err_str for x in ("connection", "timeout", "reset", "closed")):
                await self.reconnect(str(type(e).__name__))
            return []

    @property
    def is_connected(self) -> bool:
        return self._client is not None and self._client.is_connected()
