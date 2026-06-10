import asyncio
import json
import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.auth.auth import get_current_user
from backend.db.database import get_db
from engine.compiler import compile_graph, CompileError
from engine.events import Event, EVENT_MESSAGE, EVENT_OUTCOME, EVENT_SCHEDULE, EVENT_WEBHOOK

router = APIRouter(prefix="/api/rules", tags=["rules"])


def _schedule_engine_resync(user_id: str):
    from engine.service import get_engine_service
    asyncio.create_task(get_engine_service().rules_changed(user_id))


class RuleIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    graph: dict
    is_enabled: bool = True
    rate_limit_per_min: int = Field(default=10, ge=1, le=60)


class TestFireIn(BaseModel):
    event_type: Optional[str] = None
    data: Optional[dict] = None
    channel_id: Optional[str] = None


def _compile_or_422(graph: dict) -> dict:
    try:
        return compile_graph(graph)
    except CompileError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Rule graph is invalid", "errors": e.errors},
        )


def _row_to_rule(row) -> dict:
    d = dict(row)
    d["graph"] = json.loads(d.pop("graph_json"))
    d["compiled"] = json.loads(d.pop("compiled_json"))
    d["is_enabled"] = bool(d["is_enabled"])
    return d


@router.get("/")
async def list_rules(current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            """SELECT r.*,
                      (SELECT COUNT(*) FROM rule_executions e
                       WHERE e.rule_id = r.id AND e.created_at > ?) AS executions_24h
               FROM automation_rules r WHERE r.user_id = ?
               ORDER BY r.updated_at DESC""",
            (time.time() - 86400, current_user["id"]),
        ) as cursor:
            rows = await cursor.fetchall()
    return [_row_to_rule(r) for r in rows]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_rule(rule_in: RuleIn, current_user: dict = Depends(get_current_user)):
    compiled = _compile_or_422(rule_in.graph)
    rule_id = str(uuid.uuid4())
    now = time.time()
    async with get_db() as db:
        await db.execute(
            """INSERT INTO automation_rules
               (id, user_id, name, description, is_enabled, graph_json, compiled_json,
                trigger_type, rate_limit_per_min, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (rule_id, current_user["id"], rule_in.name, rule_in.description,
             1 if rule_in.is_enabled else 0, json.dumps(rule_in.graph),
             json.dumps(compiled), compiled["trigger"]["type"],
             rule_in.rate_limit_per_min, now, now),
        )
        await db.commit()
    _schedule_engine_resync(current_user["id"])
    return {"id": rule_id, "name": rule_in.name, "trigger_type": compiled["trigger"]["type"]}


@router.get("/{rule_id}")
async def get_rule(rule_id: str, current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM automation_rules WHERE id = ? AND user_id = ?",
            (rule_id, current_user["id"]),
        ) as cursor:
            row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    return _row_to_rule(row)


@router.put("/{rule_id}")
async def update_rule(rule_id: str, rule_in: RuleIn,
                      current_user: dict = Depends(get_current_user)):
    compiled = _compile_or_422(rule_in.graph)
    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM automation_rules WHERE id = ? AND user_id = ?",
            (rule_id, current_user["id"]),
        ) as cursor:
            if await cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Rule not found")
        await db.execute(
            """UPDATE automation_rules
               SET name = ?, description = ?, is_enabled = ?, graph_json = ?,
                   compiled_json = ?, trigger_type = ?, rate_limit_per_min = ?, updated_at = ?
               WHERE id = ?""",
            (rule_in.name, rule_in.description, 1 if rule_in.is_enabled else 0,
             json.dumps(rule_in.graph), json.dumps(compiled),
             compiled["trigger"]["type"], rule_in.rate_limit_per_min,
             time.time(), rule_id),
        )
        await db.commit()
    _schedule_engine_resync(current_user["id"])
    return {"id": rule_id, "updated": True}


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(rule_id: str, current_user: dict = Depends(get_current_user)):
    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM automation_rules WHERE id = ? AND user_id = ?",
            (rule_id, current_user["id"]),
        ) as cursor:
            if await cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Rule not found")
        await db.execute("DELETE FROM rule_executions WHERE rule_id = ?", (rule_id,))
        await db.execute("DELETE FROM automation_rules WHERE id = ?", (rule_id,))
        await db.commit()
    _schedule_engine_resync(current_user["id"])


async def _set_enabled(rule_id: str, user_id: str, enabled: bool):
    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM automation_rules WHERE id = ? AND user_id = ?",
            (rule_id, user_id),
        ) as cursor:
            if await cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Rule not found")
        await db.execute(
            "UPDATE automation_rules SET is_enabled = ?, updated_at = ? WHERE id = ?",
            (1 if enabled else 0, time.time(), rule_id),
        )
        await db.commit()
    _schedule_engine_resync(user_id)


@router.post("/{rule_id}/enable")
async def enable_rule(rule_id: str, current_user: dict = Depends(get_current_user)):
    await _set_enabled(rule_id, current_user["id"], True)
    return {"id": rule_id, "is_enabled": True}


@router.post("/{rule_id}/disable")
async def disable_rule(rule_id: str, current_user: dict = Depends(get_current_user)):
    await _set_enabled(rule_id, current_user["id"], False)
    return {"id": rule_id, "is_enabled": False}


_SAMPLE_EVENTS = {
    EVENT_MESSAGE: {"text": "BUY XAUUSD @ 2410, SL 2395, TP 2425 2440", "message_id": 1,
                    "channel_title": "Test Channel", "extracted": []},
    EVENT_OUTCOME: {"signal_id": "test", "outcome": "tp_hit", "tp_level": 2,
                    "pair": "XAUUSD", "direction": "BUY", "pips": 150.0, "rr": 2.5,
                    "raw_text": "BUY XAUUSD", "channel_title": "Test Channel"},
    EVENT_SCHEDULE: {},
    EVENT_WEBHOOK: {"token_id": "test", "token_name": "test",
                    "body": {"event": "tp_hit", "pair": "XAUUSD", "tp_level": 2, "pips": 150}},
}


@router.post("/{rule_id}/test")
async def test_rule(rule_id: str, fire: Optional[TestFireIn] = None,
                    current_user: dict = Depends(get_current_user)):
    """Dry-run the rule against a sample (or supplied) event. Nothing is sent
    to Telegram — the trace shows exactly what would happen."""
    from engine.runner import RuleRunner
    from engine.sender import DryRunSender

    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM automation_rules WHERE id = ? AND user_id = ?",
            (rule_id, current_user["id"]),
        ) as cursor:
            row = await cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule = dict(row)
    fire = fire or TestFireIn()
    event_type = fire.event_type or rule["trigger_type"]
    data = dict(_SAMPLE_EVENTS.get(event_type, {}))
    if event_type == EVENT_SCHEDULE:
        data["rule_id"] = rule_id
    if fire.data:
        data.update(fire.data)

    event = Event(type=event_type, user_id=current_user["id"],
                  channel_id=fire.channel_id, data=data, meta={"source": "test"})

    runner = RuleRunner(DryRunSender())
    result = await runner.test_rule(rule, event)
    return result
