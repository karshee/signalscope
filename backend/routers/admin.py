from fastapi import APIRouter, Depends

from backend.auth.auth import get_current_user
from backend.db.database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/status")
async def status(current_user: dict = Depends(get_current_user)):
    from backend.services.watcher_service import get_watcher_service
    svc = get_watcher_service()

    async with get_db() as db:
        async with db.execute("SELECT COUNT(*) as count FROM signals") as cursor:
            signal_row = await cursor.fetchone()
        async with db.execute(
            "SELECT COUNT(*) as count FROM channels WHERE is_active = 1"
        ) as cursor:
            channel_row = await cursor.fetchone()

    return {
        "watcher_running": svc.running,
        "watcher_status": svc.status,
        "watcher_error": svc.error,
        "signal_count": signal_row["count"] if signal_row else 0,
        "channel_count": channel_row["count"] if channel_row else 0,
    }
