from typing import Any, Dict

from fastapi import APIRouter, Depends

from backend.auth.auth import get_current_user
from backend.db.database import get_db

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/")
async def get_settings(current_user: dict = Depends(get_current_user)):
    """Return all settings for the current user as a key→value dict."""
    async with get_db() as db:
        async with db.execute(
            "SELECT key, value FROM user_settings WHERE user_id = ?",
            (current_user["id"],),
        ) as cursor:
            rows = await cursor.fetchall()

    return {r["key"]: r["value"] for r in rows}


@router.put("/")
async def update_settings(
    settings: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    """Upsert settings key-value pairs for the current user."""
    async with get_db() as db:
        for key, value in settings.items():
            await db.execute(
                """
                INSERT INTO user_settings (user_id, key, value)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
                """,
                (current_user["id"], key, str(value)),
            )
        await db.commit()

    return {"updated": list(settings.keys())}


@router.post("/telegram/test")
async def test_telegram(current_user: dict = Depends(get_current_user)):
    """Test Telegram connection (stub)."""
    return {"connected": False, "message": "Telegram not configured"}


@router.post("/mt5/test")
async def test_mt5(current_user: dict = Depends(get_current_user)):
    """Test MT5 connection (stub)."""
    return {"connected": False, "message": "MT5 not configured"}
