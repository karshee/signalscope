import time
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status

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


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
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
async def login(user_in: UserLogin, response: Response):
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
