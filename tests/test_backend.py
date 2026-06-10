"""Backend integration tests."""
import asyncio
import os
import time
import pytest
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests")

from backend.main import app
from backend.db.migrations import run_migrations


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    asyncio.run(run_migrations())


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_and_login():
    email = f"integ+{int(time.time()*1000)}@test.com"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/api/auth/register", json={
            "name": "Test", "email": email, "password": "pass1234"
        })
        assert r.status_code == 201, r.text
        token = r.json()["access_token"]
        assert token

        r2 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r2.status_code == 200
        assert r2.json()["email"] == email


@pytest.mark.asyncio
async def test_401_without_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/channels/")
    assert r.status_code == 401
