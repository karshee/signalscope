"""In-process event bus — single consumer task feeding the rule runner."""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

from engine.events import Event

logger = logging.getLogger(__name__)


class EventBus:
    def __init__(self, handler, max_queue: int = 1000):
        self._handler = handler          # async callable(Event)
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=max_queue)
        self._task: Optional[asyncio.Task] = None

    def emit(self, event: Event) -> bool:
        """Enqueue an event. Drops (with a log) if the queue is full — automation
        lag must never block the watcher/tracker hot paths."""
        try:
            self._queue.put_nowait(event)
            return True
        except asyncio.QueueFull:
            logger.error(f"Event bus full — dropping {event.type} for user {event.user_id}")
            return False

    async def _consume(self):
        while True:
            event = await self._queue.get()
            try:
                await self._handler(event)
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.error(f"Event handler error: {e}", exc_info=True)
            finally:
                self._queue.task_done()

    def start(self):
        if not self._task or self._task.done():
            self._task = asyncio.create_task(self._consume(), name="engine-event-bus")

    async def stop(self):
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await asyncio.wait_for(self._task, timeout=5)
            except (asyncio.CancelledError, asyncio.TimeoutError):
                pass
