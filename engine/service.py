"""Singleton engine service — wires bus, runner, sender and schedule source.

Started/stopped from the FastAPI lifespan. Event sources (watcher, tracker,
webhook router) call `get_engine_service().emit(event)`.
"""
from __future__ import annotations

import logging
import time
import uuid
from typing import Optional

from engine.bus import EventBus
from engine.events import Event
from engine.runner import RuleRunner
from engine.schedule_source import ScheduleSource
from engine.sender import TelegramSender

logger = logging.getLogger(__name__)

_instance: Optional["EngineService"] = None


def get_engine_service() -> "EngineService":
    global _instance
    if _instance is None:
        _instance = EngineService()
    return _instance


class EngineService:
    def __init__(self):
        self.sender = TelegramSender()
        self.runner = RuleRunner(self.sender)
        self.bus = EventBus(self.runner.handle_event)
        self.schedules = ScheduleSource(self.emit)
        self.running = False

    async def start(self):
        self.bus.start()
        self.schedules.start()
        await self.schedules.resync()
        self.running = True
        logger.info("Automation engine running")

    async def stop(self):
        self.running = False
        self.schedules.stop()
        await self.bus.stop()
        logger.info("Automation engine stopped")

    def emit(self, event: Event) -> bool:
        if not self.running:
            return False
        return self.bus.emit(event)

    async def rules_changed(self, user_id: str):
        """Invalidate caches + resync cron jobs after any rule mutation."""
        self.runner.invalidate(user_id)
        if self.running:
            await self.schedules.resync()

    async def prune(self):
        """Daily retention: cap channel_messages per channel, age out executions."""
        from backend.db.database import get_db
        async with get_db() as db:
            await db.execute("""
                DELETE FROM channel_messages WHERE id IN (
                    SELECT id FROM (
                        SELECT id, ROW_NUMBER() OVER (
                            PARTITION BY channel_id ORDER BY posted_at DESC
                        ) AS rn FROM channel_messages
                    ) WHERE rn > 200
                )
            """)
            await db.execute(
                "DELETE FROM rule_executions WHERE created_at < ?",
                (time.time() - 30 * 86400,),
            )
            await db.commit()
        logger.info("Engine retention prune complete")
