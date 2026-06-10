"""API tests for templates, rules, webhooks and media routers."""
import asyncio
import io
import time

import pytest
from httpx import AsyncClient, ASGITransport

from backend.main import app
from backend.db.migrations import run_migrations


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    asyncio.run(run_migrations())


def _client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _register(client, tag) -> dict:
    r = await client.post("/api/auth/register", json={
        "name": "Test", "email": f"api-{tag}-{int(time.time()*1000)}@test.com",
        "password": "pass1234",
    })
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


async def _add_channel(client, headers, title="Out Channel") -> str:
    r = await client.post("/api/channels/", headers=headers,
                          json={"title": title, "telegram_id": int(time.time() * 1000) % 10**9})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _graph(channel_id, trigger="message.received", text="hello {pair}"):
    return {
        "nodes": [
            {"id": "t1", "type": "trigger", "data": {"nodeType": trigger, "config": {}}},
            {"id": "a1", "type": "action",
             "data": {"nodeType": "send_message",
                      "config": {"channel_id": channel_id, "text": text}}},
        ],
        "edges": [{"id": "e1", "source": "t1", "target": "a1"}],
    }


# ── templates ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_template_crud_and_preview():
    async with _client() as client:
        h = await _register(client, "tpl")

        r = await client.post("/api/templates/", headers=h, json={
            "name": "TP celebration", "body": "🎯 {pair} TP{tp_level} HIT! +{pips} pips",
        })
        assert r.status_code == 201, r.text
        tid = r.json()["id"]

        r = await client.get("/api/templates/", headers=h)
        assert len(r.json()) == 1

        r = await client.post(f"/api/templates/{tid}/preview", headers=h, json={})
        assert r.status_code == 200
        assert "XAUUSD TP2 HIT! +150.0 pips" in r.json()["rendered"]

        r = await client.put(f"/api/templates/{tid}", headers=h, json={
            "name": "TP celebration", "body": "updated {pair}",
        })
        assert r.status_code == 200

        r = await client.delete(f"/api/templates/{tid}", headers=h)
        assert r.status_code == 204


@pytest.mark.asyncio
async def test_template_rejects_empty():
    async with _client() as client:
        h = await _register(client, "tpl2")
        r = await client.post("/api/templates/", headers=h, json={"name": "empty", "body": " "})
        assert r.status_code == 422


@pytest.mark.asyncio
async def test_template_ownership_isolation():
    async with _client() as client:
        h1 = await _register(client, "own1")
        h2 = await _register(client, "own2")
        r = await client.post("/api/templates/", headers=h1,
                              json={"name": "mine", "body": "x"})
        tid = r.json()["id"]
        r = await client.get(f"/api/templates/{tid}", headers=h2)
        assert r.status_code == 404


# ── rules ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_rule_create_compile_and_test_fire():
    async with _client() as client:
        h = await _register(client, "rule")
        ch = await _add_channel(client, h)

        r = await client.post("/api/rules/", headers=h, json={
            "name": "echo", "graph": _graph(ch),
        })
        assert r.status_code == 201, r.text
        rule_id = r.json()["id"]
        assert r.json()["trigger_type"] == "message.received"

        # Dry-run test fire — no Telegram credentials needed
        r = await client.post(f"/api/rules/{rule_id}/test", headers=h, json={})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "dry_run"
        assert body["trace"]["actions_run"] == 1

        r = await client.post(f"/api/rules/{rule_id}/disable", headers=h)
        assert r.json()["is_enabled"] is False

        r = await client.get("/api/rules/", headers=h)
        assert len(r.json()) == 1
        assert r.json()[0]["is_enabled"] is False


@pytest.mark.asyncio
async def test_rule_invalid_graph_returns_per_node_errors():
    async with _client() as client:
        h = await _register(client, "rule2")
        bad = {
            "nodes": [
                {"id": "t1", "type": "trigger",
                 "data": {"nodeType": "message.received", "config": {}}},
                {"id": "orphan", "type": "condition",
                 "data": {"nodeType": "text_match", "config": {"value": "x"}}},
            ],
            "edges": [],
        }
        r = await client.post("/api/rules/", headers=h, json={"name": "bad", "graph": bad})
        assert r.status_code == 422
        errors = r.json()["detail"]["errors"]
        assert any(e["node_id"] == "orphan" for e in errors)


@pytest.mark.asyncio
async def test_rule_ownership_isolation():
    async with _client() as client:
        h1 = await _register(client, "rown1")
        h2 = await _register(client, "rown2")
        ch = await _add_channel(client, h1)
        r = await client.post("/api/rules/", headers=h1,
                              json={"name": "mine", "graph": _graph(ch)})
        rule_id = r.json()["id"]
        assert (await client.get(f"/api/rules/{rule_id}", headers=h2)).status_code == 404
        assert (await client.delete(f"/api/rules/{rule_id}", headers=h2)).status_code == 404


# ── webhooks ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_webhook_token_lifecycle_and_ingest():
    async with _client() as client:
        h = await _register(client, "wh")
        r = await client.post("/api/webhooks/", headers=h, json={"name": "signal-watcher"})
        assert r.status_code == 201
        token = r.json()["token"]
        token_id = r.json()["id"]

        # Ingest with the real token (engine not running in tests → accepted False,
        # but the request is authenticated and processed)
        r = await client.post(f"/api/webhooks/ingest/{token}",
                              json={"event": "tp_hit", "pair": "XAUUSD"})
        assert r.status_code == 202

        # Bad token → 404
        r = await client.post("/api/webhooks/ingest/deadbeef", json={})
        assert r.status_code == 404

        # Non-object body → 422
        r = await client.post(f"/api/webhooks/ingest/{token}", json=[1, 2])
        assert r.status_code == 422

        # Rotate invalidates the old token
        r = await client.post(f"/api/webhooks/{token_id}/rotate", headers=h)
        new_token = r.json()["token"]
        assert new_token != token
        r = await client.post(f"/api/webhooks/ingest/{token}", json={})
        assert r.status_code == 404
        r = await client.post(f"/api/webhooks/ingest/{new_token}", json={})
        assert r.status_code == 202

        r = await client.delete(f"/api/webhooks/{token_id}", headers=h)
        assert r.status_code == 204


# ── media ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_media_upload_serve_delete():
    async with _client() as client:
        h = await _register(client, "media")
        gif = b"GIF89a" + b"\x00" * 64
        r = await client.post("/api/media/", headers=h,
                              files={"file": ("win.gif", io.BytesIO(gif), "image/gif")})
        assert r.status_code == 201, r.text
        media_id = r.json()["id"]
        assert r.json()["kind"] == "gif"

        r = await client.get(f"/api/media/{media_id}/file", headers=h)
        assert r.status_code == 200
        assert r.content == gif

        # Other users can't fetch it
        h2 = await _register(client, "media2")
        r = await client.get(f"/api/media/{media_id}/file", headers=h2)
        assert r.status_code == 404

        r = await client.delete(f"/api/media/{media_id}", headers=h)
        assert r.status_code == 204


@pytest.mark.asyncio
async def test_media_rejects_bad_mime():
    async with _client() as client:
        h = await _register(client, "media3")
        r = await client.post("/api/media/", headers=h,
                              files={"file": ("x.exe", io.BytesIO(b"MZ"), "application/octet-stream")})
        assert r.status_code == 422


# ── settings bot token ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_bot_token_encrypted_and_masked():
    async with _client() as client:
        h = await _register(client, "settings")
        r = await client.put("/api/settings/", headers=h, json={
            "telegram": {"bot_token": "123456:ABC-secret-token-xyz9"},
        })
        assert r.status_code == 200

        r = await client.get("/api/settings/", headers=h)
        tg = r.json()["telegram"]
        assert "bot_token" not in tg
        assert "bot_token_enc" not in tg
        assert tg["bot_token_masked"].endswith("xyz9")
        assert "secret" not in str(tg)

        # Re-saving settings without a new token keeps the stored one
        r = await client.put("/api/settings/", headers=h, json={
            "telegram": {"bot_token_masked": tg["bot_token_masked"]},
        })
        assert r.status_code == 200
        r = await client.get("/api/settings/", headers=h)
        assert r.json()["telegram"]["bot_token_masked"].endswith("xyz9")


@pytest.mark.asyncio
async def test_channel_messages_endpoint():
    async with _client() as client:
        h = await _register(client, "msgs")
        ch = await _add_channel(client, h, title="Chat Channel")
        r = await client.get(f"/api/channels/{ch}/messages", headers=h)
        assert r.status_code == 200
        assert r.json() == []

        # Sending without a bot token configured → 400 with guidance
        r = await client.post(f"/api/channels/{ch}/send", headers=h, json={"text": "hi"})
        assert r.status_code == 400
        assert "bot token" in r.json()["detail"].lower()
