import os
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from backend.auth.auth import get_current_user
from backend.db.database import get_db

router = APIRouter(prefix="/api/media", tags=["media"])

_MAX_BYTES = 10 * 1024 * 1024
_ALLOWED = {
    "image/gif": ("gif", ".gif"),
    "video/mp4": ("gif", ".mp4"),       # Telegram GIFs are mp4s without sound
    "image/png": ("photo", ".png"),
    "image/jpeg": ("photo", ".jpg"),
    "image/webp": ("photo", ".webp"),
}


def _media_dir() -> Path:
    return Path(os.getenv("MEDIA_DIR", "data/media"))


@router.get("/")
async def list_media(current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            """SELECT id, kind, filename, mime, size_bytes, telegram_file_id, created_at
               FROM media_assets WHERE user_id = ? ORDER BY created_at DESC""",
            (current_user["id"],),
        ) as cursor:
            rows = await cursor.fetchall()
    return [dict(r) for r in rows]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_media(file: UploadFile, current_user: dict = Depends(get_current_user)):
    if file.content_type not in _ALLOWED:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported type {file.content_type}. Allowed: {sorted(_ALLOWED)}",
        )
    data = await file.read()
    if len(data) > _MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (10MB max)")

    kind, ext = _ALLOWED[file.content_type]
    media_id = str(uuid.uuid4())
    user_dir = _media_dir() / current_user["id"]
    user_dir.mkdir(parents=True, exist_ok=True)
    path = user_dir / f"{media_id}{ext}"
    path.write_bytes(data)

    async with get_db() as db:
        await db.execute(
            """INSERT INTO media_assets
               (id, user_id, kind, filename, mime, size_bytes, path, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (media_id, current_user["id"], kind, file.filename,
             file.content_type, len(data), str(path), time.time()),
        )
        await db.commit()
    return {"id": media_id, "kind": kind, "filename": file.filename, "size_bytes": len(data)}


@router.get("/{media_id}/file")
async def serve_media(media_id: str, current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            "SELECT path, mime FROM media_assets WHERE id = ? AND user_id = ?",
            (media_id, current_user["id"]),
        ) as cursor:
            row = await cursor.fetchone()
    if row is None or not Path(row["path"]).exists():
        raise HTTPException(status_code=404, detail="Media not found")
    return FileResponse(row["path"], media_type=row["mime"])


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(media_id: str, current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            "SELECT path FROM media_assets WHERE id = ? AND user_id = ?",
            (media_id, current_user["id"]),
        ) as cursor:
            row = await cursor.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Media not found")
        await db.execute("DELETE FROM media_assets WHERE id = ?", (media_id,))
        await db.commit()
    try:
        Path(row["path"]).unlink(missing_ok=True)
    except OSError:
        pass
