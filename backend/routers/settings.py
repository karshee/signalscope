import json
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from backend.auth.auth import get_current_user
from backend.db.database import get_db

router = APIRouter(prefix="/api/settings", tags=["settings"])

_ALLOWED_KEYS = frozenset({
    "telegram", "mt5", "notifications", "theme", "timezone", "currency",
})


def _serialize(value: Any) -> str:
    if isinstance(value, (dict, list, bool)):
        return json.dumps(value)
    return str(value)


def _deserialize(raw: str) -> Any:
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return raw


@router.get("/")
async def get_settings(current_user: dict = Depends(get_current_user)):
    """Return all settings for the current user as a key→value dict."""
    async with get_db() as db:
        async with db.execute(
            "SELECT key, value FROM user_settings WHERE user_id = ?",
            (current_user["id"],),
        ) as cursor:
            rows = await cursor.fetchall()

    out = {r["key"]: _deserialize(r["value"]) for r in rows}

    # Never return the encrypted bot token — mask to last 4 chars
    tg = out.get("telegram")
    if isinstance(tg, dict) and tg.get("bot_token_enc"):
        from backend.services.crypto import decrypt_str, mask_secret
        try:
            tg["bot_token_masked"] = mask_secret(decrypt_str(tg["bot_token_enc"]))
        except ValueError:
            tg["bot_token_masked"] = None
        del tg["bot_token_enc"]

    return out


@router.put("/")
async def update_settings(
    settings: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    """Upsert settings key-value pairs for the current user."""
    invalid = [k for k in settings if k not in _ALLOWED_KEYS]
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid settings keys: {invalid}. Allowed: {sorted(_ALLOWED_KEYS)}",
        )

    # Bot tokens are encrypted at rest and never echoed back in full
    tg = settings.get("telegram")
    if isinstance(tg, dict):
        tg.pop("bot_token_masked", None)
        if tg.get("bot_token"):
            from backend.services.crypto import encrypt_str
            tg["bot_token_enc"] = encrypt_str(tg.pop("bot_token"))
        else:
            # Round-tripped settings without a new token keep the stored one
            async with get_db() as db:
                async with db.execute(
                    "SELECT value FROM user_settings WHERE user_id = ? AND key = 'telegram'",
                    (current_user["id"],),
                ) as cursor:
                    row = await cursor.fetchone()
            if row:
                existing = _deserialize(row["value"])
                if isinstance(existing, dict) and existing.get("bot_token_enc"):
                    tg["bot_token_enc"] = existing["bot_token_enc"]

    async with get_db() as db:
        for key, value in settings.items():
            await db.execute(
                """
                INSERT INTO user_settings (user_id, key, value)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
                """,
                (current_user["id"], key, _serialize(value)),
            )
        await db.commit()

    return {"updated": list(settings.keys())}


@router.post("/telegram/test")
async def test_telegram(current_user: dict = Depends(get_current_user)):
    """Test Telegram connection using server-configured credentials."""
    import os
    from backend.services.watcher_service import get_watcher_service

    svc = get_watcher_service()
    if svc.status == "running":
        return {"connected": True, "message": "Watcher is running"}

    api_id_str = os.getenv("TELEGRAM_API_ID", "")
    api_hash = os.getenv("TELEGRAM_API_HASH", "")
    session = os.getenv("TELEGRAM_SESSION", "")

    if not all([api_id_str, api_hash, session]):
        return {
            "connected": False,
            "message": "TELEGRAM_API_ID / TELEGRAM_API_HASH / TELEGRAM_SESSION not configured on server",
        }

    try:
        from watcher.client import TapwireClient
        client = TapwireClient(int(api_id_str), api_hash, session)
        ok = await client.connect()
        await client.disconnect()
        if ok:
            return {"connected": True, "message": "Credentials valid"}
        return {
            "connected": False,
            "message": "Session invalid or expired — regenerate TELEGRAM_SESSION",
        }
    except Exception as e:
        return {"connected": False, "message": str(e)}


@router.post("/telegram/bot/test")
async def test_bot(current_user: dict = Depends(get_current_user)):
    """Verify the user's bot token against the Bot API (getMe)."""
    from engine.credentials import get_bot_token
    from engine.sender import TelegramSender

    token = await get_bot_token(current_user["id"])
    if not token:
        return {"connected": False, "message": "No bot token configured"}

    try:
        body = await TelegramSender().get_me(token)
    except Exception as e:
        return {"connected": False, "message": f"Bot API unreachable: {e}"}

    if body.get("ok"):
        username = (body.get("result") or {}).get("username")
        return {"connected": True, "message": f"Connected as @{username}",
                "bot_username": username}
    return {"connected": False,
            "message": body.get("description", "Token rejected by Telegram")}


@router.post("/mt5/test")
async def test_mt5(current_user: dict = Depends(get_current_user)):
    """MT5 integration — not yet implemented."""
    return {"connected": False, "message": "MT5 integration coming soon"}
