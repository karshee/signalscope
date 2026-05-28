"""APScheduler background scheduler for outcome checks."""
import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)
_scheduler: AsyncIOScheduler = None


def start_outcome_scheduler(db_factory, broadcast_fn=None):
    global _scheduler
    from tracker.outcome_engine import run_outcome_checks

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        run_outcome_checks,
        "interval",
        minutes=5,
        args=[db_factory, broadcast_fn],
        id="outcome_checks",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Outcome scheduler started (every 5 min)")


def stop_outcome_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
