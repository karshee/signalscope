from fastapi import APIRouter

from backend.db.database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/status")
async def status():
    """Return watcher status and basic counts."""
    async with get_db() as db:
        async with db.execute("SELECT COUNT(*) as count FROM signals") as cursor:
            signal_row = await cursor.fetchone()

        async with db.execute(
            "SELECT COUNT(*) as count FROM channels WHERE is_active = 1"
        ) as cursor:
            channel_row = await cursor.fetchone()

    signal_count = signal_row["count"] if signal_row else 0
    channel_count = channel_row["count"] if channel_row else 0

    return {
        "watcher_running": False,
        "signal_count": signal_count,
        "channel_count": channel_count,
    }
