"""Per-user Telegram bot credentials, stored encrypted in user_settings."""
from __future__ import annotations

import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def get_bot_token(user_id: str) -> Optional[str]:
    """Return the user's decrypted Bot API token, or None if not configured."""
    from backend.db.database import get_db
    from backend.services.crypto import decrypt_str

    async with get_db() as db:
        async with db.execute(
            "SELECT value FROM user_settings WHERE user_id = ? AND key = 'telegram'",
            (user_id,),
        ) as cursor:
            row = await cursor.fetchone()

    if not row:
        return None
    try:
        cfg = json.loads(row["value"])
        enc = cfg.get("bot_token_enc")
        if not enc:
            return None
        return decrypt_str(enc)
    except (ValueError, json.JSONDecodeError) as e:
        logger.warning(f"Bot token unreadable for user {user_id}: {e}")
        return None
