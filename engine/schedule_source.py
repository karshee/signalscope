"""Schedule trigger source — one cron job per enabled schedule rule."""
from __future__ import annotations

import json
import logging
from typing import Callable, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from engine.events import Event, EVENT_SCHEDULE

logger = logging.getLogger(__name__)


class ScheduleSource:
    def __init__(self, emit: Callable[[Event], bool]):
        self._emit = emit
        self._scheduler: Optional[AsyncIOScheduler] = None

    def start(self):
        if not self._scheduler:
            self._scheduler = AsyncIOScheduler()
            self._scheduler.start()

    def stop(self):
        if self._scheduler:
            self._scheduler.shutdown(wait=False)
            self._scheduler = None

    async def resync(self):
        """Reload all enabled schedule rules into cron jobs. Called on engine
        start and whenever a rule is created/updated/toggled."""
        if not self._scheduler:
            return
        from backend.db.database import get_db

        for job in self._scheduler.get_jobs():
            job.remove()

        async with get_db() as db:
            async with db.execute(
                """SELECT id, user_id, compiled_json FROM automation_rules
                   WHERE trigger_type = ? AND is_enabled = 1""",
                (EVENT_SCHEDULE,),
            ) as cursor:
                rules = await cursor.fetchall()

        count = 0
        for rule in rules:
            try:
                compiled = json.loads(rule["compiled_json"])
                cron = (compiled["trigger"].get("config") or {}).get("cron")
                if not cron:
                    continue
                self._scheduler.add_job(
                    self._fire,
                    CronTrigger.from_crontab(cron),
                    args=[rule["id"], rule["user_id"], cron],
                    id=f"rule-{rule['id']}",
                    replace_existing=True,
                )
                count += 1
            except Exception as e:
                logger.warning(f"Could not schedule rule {rule['id']}: {e}")
        logger.info(f"Schedule source: {count} cron rule(s) active")

    async def _fire(self, rule_id: str, user_id: str, cron: str):
        self._emit(Event(
            type=EVENT_SCHEDULE,
            user_id=user_id,
            data={"rule_id": rule_id, "cron": cron},
            meta={"source": "scheduler"},
        ))
