import time
import uuid
from collections import defaultdict
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from backend.auth.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.auth.models import Token, UserCreate, UserLogin, UserOut
from backend.db.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ── Simple in-memory rate limiter ─────────────────────────────────────────────

_attempts: dict[str, list[float]] = defaultdict(list)


def _check_rate_limit(key: str, max_attempts: int = 10, window: int = 60) -> None:
    now = time.time()
    _attempts[key] = [t for t in _attempts[key] if now - t < window]
    if len(_attempts[key]) >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait before trying again.",
        )
    _attempts[key].append(now)


# ── Auth endpoints ─────────────────────────────────────────────────────────────

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, request: Request):
    _check_rate_limit(f"register:{request.client.host}", max_attempts=5, window=300)

    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM users WHERE email = ?", (user_in.email,)
        ) as cursor:
            existing = await cursor.fetchone()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        user_id = str(uuid.uuid4())
        now = time.time()
        password_hash = hash_password(user_in.password)

        await db.execute(
            """
            INSERT INTO users (id, email, name, password_hash, plan, created_at, last_login)
            VALUES (?, ?, ?, ?, 'free', ?, ?)
            """,
            (user_id, user_in.email, user_in.name, password_hash, now, now),
        )
        await db.commit()

    access_token = create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, request: Request, response: Response):
    _check_rate_limit(f"login:{request.client.host}", max_attempts=10, window=60)

    async with get_db() as db:
        async with db.execute(
            "SELECT id, password_hash FROM users WHERE email = ?", (user_in.email,)
        ) as cursor:
            row = await cursor.fetchone()

    if row is None or not verify_password(user_in.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_id = row["id"]

    async with get_db() as db:
        await db.execute(
            "UPDATE users SET last_login = ? WHERE id = ?",
            (time.time(), user_id),
        )
        await db.commit()

    access_token = create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    refresh_token = create_access_token(
        data={"sub": user_id, "type": "refresh"},
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        samesite="lax",
    )

    return Token(access_token=access_token)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return UserOut(**current_user)


# ── Profile update ─────────────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


@router.put("/me", response_model=UserOut)
async def update_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    updates = {}
    if data.name is not None:
        updates["name"] = data.name.strip()
    if data.email is not None:
        updates["email"] = data.email.strip().lower()

    if not updates:
        return UserOut(**current_user)

    if "email" in updates and updates["email"] != current_user["email"]:
        async with get_db() as db:
            async with db.execute(
                "SELECT id FROM users WHERE email = ? AND id != ?",
                (updates["email"], current_user["id"]),
            ) as cursor:
                conflict = await cursor.fetchone()
        if conflict:
            raise HTTPException(status_code=409, detail="Email already in use")

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [current_user["id"]]

    async with get_db() as db:
        await db.execute(f"UPDATE users SET {set_clause} WHERE id = ?", values)
        await db.commit()
        async with db.execute(
            "SELECT id, email, name, plan, created_at FROM users WHERE id = ?",
            (current_user["id"],),
        ) as cursor:
            row = await cursor.fetchone()

    return UserOut(**dict(row))


# ── Password change ────────────────────────────────────────────────────────────

class ChangePassword(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
async def change_password(
    data: ChangePassword,
    current_user: dict = Depends(get_current_user),
):
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    async with get_db() as db:
        async with db.execute(
            "SELECT password_hash FROM users WHERE id = ?", (current_user["id"],)
        ) as cursor:
            row = await cursor.fetchone()

    if not row or not verify_password(data.current_password, row["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_hash = hash_password(data.new_password)
    async with get_db() as db:
        await db.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (new_hash, current_user["id"]),
        )
        await db.commit()

    return {"message": "Password updated"}


# ── Account deletion ───────────────────────────────────────────────────────────

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user: dict = Depends(get_current_user),
    response: Response = None,
):
    user_id = current_user["id"]
    async with get_db() as db:
        # Delete outcomes for user's signals
        async with db.execute(
            """
            SELECT s.id FROM signals s
            JOIN channels c ON s.channel_id = c.id
            WHERE c.user_id = ?
            """,
            (user_id,),
        ) as cursor:
            signal_rows = await cursor.fetchall()

        for row in signal_rows:
            await db.execute("DELETE FROM outcomes WHERE signal_id = ?", (row["id"],))

        # Delete signals, channel_scores, channels, settings, user
        await db.execute(
            "DELETE FROM signals WHERE channel_id IN (SELECT id FROM channels WHERE user_id = ?)",
            (user_id,),
        )
        await db.execute(
            "DELETE FROM channel_scores WHERE channel_id IN (SELECT id FROM channels WHERE user_id = ?)",
            (user_id,),
        )
        await db.execute("DELETE FROM channels WHERE user_id = ?", (user_id,))
        await db.execute("DELETE FROM user_settings WHERE user_id = ?", (user_id,))
        await db.execute("DELETE FROM users WHERE id = ?", (user_id,))
        await db.commit()

    if response:
        response.delete_cookie("refresh_token")
