"""APScheduler background jobs: outcome checks (5 min) and channel scoring (1 hr)."""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)
_scheduler: AsyncIOScheduler = None


def start_outcome_scheduler(db_factory, broadcast_fn=None):
    global _scheduler
    from tracker.outcome_engine import run_outcome_checks
    from scorer.channel_scorer import score_all_channels

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        run_outcome_checks,
        "interval",
        minutes=5,
        args=[db_factory, broadcast_fn],
        id="outcome_checks",
        replace_existing=True,
    )
    _scheduler.add_job(
        score_all_channels,
        "interval",
        hours=1,
        args=[db_factory],
        id="score_channels",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduler started (outcome: 5 min, scoring: 1 hr)")


def stop_outcome_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
