import hmac
import secrets
import time
import uuid
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from backend.auth.auth import get_current_user
from backend.db.database import get_db

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

_MAX_BODY_BYTES = 16 * 1024
_INGEST_RATE_PER_MIN = 60
_ingest_times: dict[str, deque] = defaultdict(deque)


class WebhookTokenIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)


def _public(row: dict) -> dict:
    return {k: row[k] for k in
            ("id", "name", "token", "is_active", "last_used_at", "created_at")}


@router.get("/")
async def list_tokens(current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM webhook_tokens WHERE user_id = ? ORDER BY created_at DESC",
            (current_user["id"],),
        ) as cursor:
            rows = await cursor.fetchall()
    return [_public(dict(r)) for r in rows]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_token(token_in: WebhookTokenIn,
                       current_user: dict = Depends(get_current_user)):
    token_id = str(uuid.uuid4())
    token = secrets.token_hex(16)
    now = time.time()
    async with get_db() as db:
        await db.execute(
            """INSERT INTO webhook_tokens (id, user_id, name, token, is_active, created_at)
               VALUES (?, ?, ?, ?, 1, ?)""",
            (token_id, current_user["id"], token_in.name, token, now),
        )
        await db.commit()
    return {"id": token_id, "name": token_in.name, "token": token, "created_at": now}


@router.post("/{token_id}/rotate")
async def rotate_token(token_id: str, current_user: dict = Depends(get_current_user)):
    new_token = secrets.token_hex(16)
    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM webhook_tokens WHERE id = ? AND user_id = ?",
            (token_id, current_user["id"]),
        ) as cursor:
            if await cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Webhook token not found")
        await db.execute(
            "UPDATE webhook_tokens SET token = ? WHERE id = ?", (new_token, token_id)
        )
        await db.commit()
    return {"id": token_id, "token": new_token}


@router.delete("/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_token(token_id: str, current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM webhook_tokens WHERE id = ? AND user_id = ?",
            (token_id, current_user["id"]),
        ) as cursor:
            if await cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Webhook token not found")
        await db.execute("DELETE FROM webhook_tokens WHERE id = ?", (token_id,))
        await db.commit()


@router.post("/ingest/{token}", status_code=status.HTTP_202_ACCEPTED)
async def ingest(token: str, request: Request):
    """Unauthenticated event ingest — the token IS the credential.

    External systems (e.g. a trade watcher) POST a JSON body here; it becomes a
    `webhook.received` event for the token owner's rules. Body fields are
    available to templates as {webhook.field}.
    """
    body_bytes = await request.body()
    if len(body_bytes) > _MAX_BODY_BYTES:
        raise HTTPException(status_code=413, detail="Body too large (16KB max)")
    try:
        import json
        body = json.loads(body_bytes) if body_bytes else {}
        if not isinstance(body, dict):
            raise ValueError
    except ValueError:
        raise HTTPException(status_code=422, detail="Body must be a JSON object")

    async with get_db() as db:
        async with db.execute(
            "SELECT id, user_id, name, token FROM webhook_tokens WHERE is_active = 1"
        ) as cursor:
            rows = await cursor.fetchall()

    # Constant-time comparison against each active token
    match = None
    for r in rows:
        if hmac.compare_digest(r["token"], token):
            match = dict(r)
    if not match:
        raise HTTPException(status_code=404, detail="Unknown webhook token")

    times = _ingest_times[match["id"]]
    now = time.monotonic()
    while times and now - times[0] > 60:
        times.popleft()
    if len(times) >= _INGEST_RATE_PER_MIN:
        raise HTTPException(status_code=429, detail="Webhook rate limit exceeded")
    times.append(now)

    async with get_db() as db:
        await db.execute(
            "UPDATE webhook_tokens SET last_used_at = ? WHERE id = ?",
            (time.time(), match["id"]),
        )
        await db.commit()

    from engine.events import Event, EVENT_WEBHOOK
    from engine.service import get_engine_service
    accepted = get_engine_service().emit(Event(
        type=EVENT_WEBHOOK,
        user_id=match["user_id"],
        data={"token_id": match["id"], "token_name": match["name"], "body": body},
        meta={"source": "webhook"},
    ))
    return {"accepted": accepted}
