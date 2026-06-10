import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.auth.auth import get_current_user
from backend.db.database import get_db
from engine.templating import render

router = APIRouter(prefix="/api/templates", tags=["templates"])

_PARSE_MODES = ("HTML", "MarkdownV2", "none")

# Sample context used by the live preview in the editor
_SAMPLE_CONTEXT = {
    "pair": "XAUUSD", "direction": "BUY", "tp_level": 2, "pips": 150.0, "rr": 2.5,
    "outcome": "tp_hit", "text": "BUY XAUUSD @ 2410", "channel_title": "VIP Signals",
    "date": "2026-06-10", "time": "14:30", "entry_price": 2410.0, "stop_loss": 2395.0,
}


class TemplateIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    body: str = Field(default="", max_length=4000)
    parse_mode: str = "HTML"
    media_id: Optional[str] = None
    media_url: Optional[str] = None


def _validate(template_in: TemplateIn):
    if template_in.parse_mode not in _PARSE_MODES:
        raise HTTPException(status_code=422, detail=f"parse_mode must be one of {_PARSE_MODES}")
    if not template_in.body.strip() and not (template_in.media_id or template_in.media_url):
        raise HTTPException(status_code=422, detail="Template needs a body or media")


@router.get("/")
async def list_templates(current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM message_templates WHERE user_id = ? ORDER BY updated_at DESC",
            (current_user["id"],),
        ) as cursor:
            rows = await cursor.fetchall()
    return [dict(r) for r in rows]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_template(
    template_in: TemplateIn,
    current_user: dict = Depends(get_current_user),
):
    _validate(template_in)
    template_id = str(uuid.uuid4())
    now = time.time()
    async with get_db() as db:
        await db.execute(
            """INSERT INTO message_templates
               (id, user_id, name, body, parse_mode, media_id, media_url, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (template_id, current_user["id"], template_in.name, template_in.body,
             template_in.parse_mode, template_in.media_id, template_in.media_url, now, now),
        )
        await db.commit()
    return {"id": template_id, "name": template_in.name, "created_at": now}


@router.get("/{template_id}")
async def get_template(template_id: str, current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM message_templates WHERE id = ? AND user_id = ?",
            (template_id, current_user["id"]),
        ) as cursor:
            row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return dict(row)


@router.put("/{template_id}")
async def update_template(
    template_id: str,
    template_in: TemplateIn,
    current_user: dict = Depends(get_current_user),
):
    _validate(template_in)
    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM message_templates WHERE id = ? AND user_id = ?",
            (template_id, current_user["id"]),
        ) as cursor:
            if await cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Template not found")
        await db.execute(
            """UPDATE message_templates
               SET name = ?, body = ?, parse_mode = ?, media_id = ?, media_url = ?, updated_at = ?
               WHERE id = ?""",
            (template_in.name, template_in.body, template_in.parse_mode,
             template_in.media_id, template_in.media_url, time.time(), template_id),
        )
        await db.commit()
    return {"id": template_id, "updated": True}


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: str, current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM message_templates WHERE id = ? AND user_id = ?",
            (template_id, current_user["id"]),
        ) as cursor:
            if await cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Template not found")
        await db.execute("DELETE FROM message_templates WHERE id = ?", (template_id,))
        await db.commit()


@router.post("/{template_id}/preview")
async def preview_template(
    template_id: str,
    context: Optional[dict] = None,
    current_user: dict = Depends(get_current_user),
):
    """Render the template against a sample (or supplied) variable context."""
    async with get_db() as db:
        async with db.execute(
            "SELECT body FROM message_templates WHERE id = ? AND user_id = ?",
            (template_id, current_user["id"]),
        ) as cursor:
            row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Template not found")
    text, warnings = render(row["body"], {**_SAMPLE_CONTEXT, **(context or {})})
    return {"rendered": text, "warnings": warnings}
