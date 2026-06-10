"""Automation engine tests — compiler, conditions, templating, runner guards."""
import asyncio
import json
import time
import uuid

import pytest

from backend.db.migrations import run_migrations
from backend.db.database import get_db
from engine.compiler import compile_graph, CompileError
from engine.conditions import evaluate as eval_condition
from engine.events import Event, EVENT_MESSAGE, EVENT_OUTCOME, EVENT_WEBHOOK
from engine.runner import RuleRunner
from engine.sender import DryRunSender, normalize_chat_id
from engine.templating import render, build_context


# ── helpers ───────────────────────────────────────────────────────────────────

def node(nid, kind, node_type, config=None):
    return {"id": nid, "type": kind, "data": {"nodeType": node_type, "config": config or {}}}


def edge(src, dst):
    return {"id": f"{src}-{dst}", "source": src, "target": dst}


def simple_graph(action_config=None):
    return {
        "nodes": [
            node("t1", "trigger", EVENT_MESSAGE),
            node("a1", "action", "send_message",
                 action_config or {"channel_id": "ch-out", "text": "hello {pair}"}),
        ],
        "edges": [edge("t1", "a1")],
    }


_tg_counter = [1000]


async def seed_user_with_channels():
    user_id = str(uuid.uuid4())
    _tg_counter[0] += 2
    async with get_db() as db:
        await db.execute(
            "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, 'x', ?)",
            (user_id, f"{user_id}@test.com", time.time()),
        )
        for cid, title, tg in (("ch-in", "Source Channel", _tg_counter[0]),
                               ("ch-out", "VIP Channel", _tg_counter[0] + 1)):
            await db.execute(
                """INSERT INTO channels (id, user_id, title, telegram_id, added_at)
                   VALUES (?, ?, ?, ?, ?)""",
                (f"{cid}-{user_id[:8]}", user_id, title, tg, time.time()),
            )
        await db.commit()
    return user_id


async def seed_rule(user_id, graph, rate_limit=10, enabled=True):
    compiled = compile_graph(graph)
    rule_id = str(uuid.uuid4())
    async with get_db() as db:
        await db.execute(
            """INSERT INTO automation_rules
               (id, user_id, name, is_enabled, graph_json, compiled_json,
                trigger_type, rate_limit_per_min, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (rule_id, user_id, "test rule", 1 if enabled else 0,
             json.dumps(graph), json.dumps(compiled),
             compiled["trigger"]["type"], rate_limit, time.time(), time.time()),
        )
        await db.commit()
    return rule_id, compiled


def out_channel(user_id):
    return f"ch-out-{user_id[:8]}"


def in_channel(user_id):
    return f"ch-in-{user_id[:8]}"


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    asyncio.run(run_migrations())


# ── compiler ──────────────────────────────────────────────────────────────────

def test_compile_valid_graph():
    compiled = compile_graph(simple_graph())
    assert compiled["trigger"]["type"] == EVENT_MESSAGE
    assert compiled["children"][0]["kind"] == "action"
    assert compiled["children"][0]["type"] == "send_message"


def test_compile_rejects_no_trigger():
    g = {"nodes": [node("a1", "action", "send_message", {"channel_id": "c", "text": "x"})],
         "edges": []}
    with pytest.raises(CompileError):
        compile_graph(g)


def test_compile_rejects_two_triggers():
    g = simple_graph()
    g["nodes"].append(node("t2", "trigger", EVENT_WEBHOOK))
    g["edges"].append(edge("t2", "a1"))
    with pytest.raises(CompileError, match="exactly one trigger"):
        compile_graph(g)


def test_compile_rejects_cycle():
    g = {
        "nodes": [
            node("t1", "trigger", EVENT_MESSAGE),
            node("c1", "condition", "text_match", {"value": "x"}),
            node("c2", "condition", "text_match", {"value": "y"}),
        ],
        "edges": [edge("t1", "c1"), edge("c1", "c2"), edge("c2", "c1")],
    }
    with pytest.raises(CompileError, match="cycle"):
        compile_graph(g)


def test_compile_rejects_orphan():
    g = simple_graph()
    g["nodes"].append(node("c9", "condition", "text_match", {"value": "x"}))
    with pytest.raises(CompileError, match="not connected"):
        compile_graph(g)


def test_compile_rejects_bad_regex():
    g = {
        "nodes": [
            node("t1", "trigger", EVENT_MESSAGE),
            node("c1", "condition", "text_match", {"mode": "regex", "value": "[unclosed"}),
            node("a1", "action", "send_message", {"channel_id": "c", "text": "x"}),
        ],
        "edges": [edge("t1", "c1"), edge("c1", "a1")],
    }
    with pytest.raises(CompileError, match="invalid regex"):
        compile_graph(g)


def test_compile_rejects_bad_cron():
    g = {
        "nodes": [
            node("t1", "trigger", "schedule.tick", {"cron": "every day"}),
            node("a1", "action", "send_message", {"channel_id": "c", "text": "x"}),
        ],
        "edges": [edge("t1", "a1")],
    }
    with pytest.raises(CompileError, match="cron"):
        compile_graph(g)


def test_compile_rejects_empty_action():
    g = simple_graph({"channel_id": "ch-out"})  # no template, no text
    with pytest.raises(CompileError, match="template or text"):
        compile_graph(g)


def test_compile_error_carries_node_ids():
    g = simple_graph()
    g["nodes"].append(node("c9", "condition", "text_match", {"value": "x"}))
    try:
        compile_graph(g)
        assert False, "should have raised"
    except CompileError as e:
        assert any(err["node_id"] == "c9" for err in e.errors)


# ── templating ────────────────────────────────────────────────────────────────

def test_render_interpolates_and_warns():
    text, warnings = render("TP{tp_level} hit on {pair}! {nope}",
                            {"tp_level": 2, "pair": "XAUUSD"})
    assert text == "TP2 hit on XAUUSD! {nope}"
    assert warnings == ["unknown variable {nope}"]


def test_outcome_event_context():
    ev = Event(type=EVENT_OUTCOME, user_id="u", data={
        "pair": "XAUUSD", "outcome": "tp_hit", "tp_level": 2, "pips": 150.0,
    })
    ctx = build_context(ev)
    assert ctx["pair"] == "XAUUSD"
    assert ctx["tp_level"] == 2
    text, _ = render("{pair} +{pips} pips", ctx)
    assert text == "XAUUSD +150.0 pips"


def test_webhook_context_flattens_body():
    ev = Event(type=EVENT_WEBHOOK, user_id="u",
               data={"body": {"event": "tp_hit", "trade": {"symbol": "BTCUSD"}}})
    ctx = build_context(ev)
    assert ctx["webhook.event"] == "tp_hit"
    assert ctx["webhook.trade.symbol"] == "BTCUSD"


# ── conditions ────────────────────────────────────────────────────────────────

def _msg_event(text, channel_id="ch-1", **meta):
    return Event(type=EVENT_MESSAGE, user_id="u", channel_id=channel_id,
                 data={"text": text, "message_id": 1}, meta=meta)


def test_text_match_contains_case_insensitive():
    assert eval_condition("text_match", {"value": "GOLD"}, _msg_event("buy gold now"))
    assert not eval_condition("text_match", {"value": "GOLD", "case_sensitive": True},
                              _msg_event("buy gold now"))


def test_text_match_regex():
    assert eval_condition("text_match", {"mode": "regex", "value": r"TP\d\s+hit"},
                          _msg_event("TP2 hit!"))


def test_channel_filter():
    cfg = {"channel_ids": ["ch-1", "ch-2"]}
    assert eval_condition("channel_filter", cfg, _msg_event("x", channel_id="ch-1"))
    assert not eval_condition("channel_filter", cfg, _msg_event("x", channel_id="ch-9"))


def test_field_compare_numeric_coercion():
    ev = Event(type=EVENT_OUTCOME, user_id="u", data={"tp_level": 2, "pair": "XAUUSD"})
    assert eval_condition("field_compare", {"field": "tp_level", "op": ">=", "value": "2"}, ev)
    assert not eval_condition("field_compare", {"field": "tp_level", "op": ">", "value": 2}, ev)
    assert eval_condition("field_compare", {"field": "pair", "op": "in",
                                            "value": ["XAUUSD", "BTCUSD"]}, ev)


def test_time_window_always_true_without_bounds():
    assert eval_condition("time_window", {}, _msg_event("x"))


# ── sender helpers ────────────────────────────────────────────────────────────

def test_normalize_chat_id():
    assert normalize_chat_id(1569906975) == "-1001569906975"
    assert normalize_chat_id(-1001569906975) == "-1001569906975"
    assert normalize_chat_id(None, "joesignals") == "@joesignals"
    assert normalize_chat_id(None, None) is None


# ── runner end-to-end (dry run path — no Telegram credentials needed) ─────────

@pytest.mark.asyncio
async def test_runner_executes_matching_rule():
    user_id = await seed_user_with_channels()
    graph = {
        "nodes": [
            node("t1", "trigger", EVENT_MESSAGE),
            node("c1", "condition", "text_match", {"value": "tp"}),
            node("a1", "action", "send_message",
                 {"channel_id": out_channel(user_id), "text": "Result: {text}"}),
        ],
        "edges": [edge("t1", "c1"), edge("c1", "a1")],
    }
    rule_id, _ = await seed_rule(user_id, graph)

    runner = RuleRunner(DryRunSender())
    rule = await _load_rule(rule_id)
    ev = Event(type=EVENT_MESSAGE, user_id=user_id, channel_id=in_channel(user_id),
               data={"text": "TP smashed", "message_id": 42})
    result = await runner.test_rule(rule, ev)

    assert result["status"] == "dry_run"
    steps = result["trace"]["steps"]
    assert steps[0]["kind"] == "condition" and steps[0]["passed"]
    assert steps[1]["kind"] == "action"
    assert steps[1]["detail"]["text"] == "Result: TP smashed"
    assert result["trace"]["actions_run"] == 1


@pytest.mark.asyncio
async def test_runner_condition_blocks_subtree():
    user_id = await seed_user_with_channels()
    graph = {
        "nodes": [
            node("t1", "trigger", EVENT_MESSAGE),
            node("c1", "condition", "text_match", {"value": "no-match-ever"}),
            node("a1", "action", "send_message",
                 {"channel_id": out_channel(user_id), "text": "x"}),
        ],
        "edges": [edge("t1", "c1"), edge("c1", "a1")],
    }
    rule_id, _ = await seed_rule(user_id, graph)
    runner = RuleRunner(DryRunSender())
    rule = await _load_rule(rule_id)
    ev = Event(type=EVENT_MESSAGE, user_id=user_id, channel_id=in_channel(user_id),
               data={"text": "hello", "message_id": 1})
    result = await runner.test_rule(rule, ev)
    assert result["status"] == "condition_failed"
    assert result["trace"]["actions_run"] == 0


@pytest.mark.asyncio
async def test_self_sent_messages_skipped():
    user_id = await seed_user_with_channels()
    rule_id, _ = await seed_rule(user_id, {
        "nodes": [
            node("t1", "trigger", EVENT_MESSAGE),
            node("a1", "action", "send_message",
                 {"channel_id": out_channel(user_id), "text": "echo"}),
        ],
        "edges": [edge("t1", "a1")],
    })
    runner = RuleRunner(DryRunSender())
    rule = await _load_rule(rule_id)
    ev = Event(type=EVENT_MESSAGE, user_id=user_id, channel_id=in_channel(user_id),
               data={"text": "echo", "message_id": 7}, meta={"self_sent": True})
    result = await runner.test_rule(rule, ev)
    assert result["status"] == "skipped"
    assert result["reason"] == "trigger filter"


@pytest.mark.asyncio
async def test_duplicate_event_dedup():
    user_id = await seed_user_with_channels()
    await _seed_bot_token(user_id)
    rule_id, _ = await seed_rule(user_id, {
        "nodes": [
            node("t1", "trigger", EVENT_MESSAGE),
            node("a1", "action", "send_message",
                 {"channel_id": out_channel(user_id), "text": "once"}),
        ],
        "edges": [edge("t1", "a1")],
    })
    sender = DryRunSender()
    runner = RuleRunner(sender)
    ev = Event(type=EVENT_MESSAGE, user_id=user_id, channel_id=in_channel(user_id),
               data={"text": "hi", "message_id": 99})
    await runner.handle_event(ev)
    # same logical message redelivered as a fresh Event object
    ev2 = Event(type=EVENT_MESSAGE, user_id=user_id, channel_id=in_channel(user_id),
                data={"text": "hi", "message_id": 99})
    await runner.handle_event(ev2)
    assert len(sender.sent) == 1


@pytest.mark.asyncio
async def test_rate_limit_auto_disables_rule():
    user_id = await seed_user_with_channels()
    await _seed_bot_token(user_id)
    rule_id, _ = await seed_rule(user_id, {
        "nodes": [
            node("t1", "trigger", EVENT_MESSAGE),
            node("a1", "action", "send_message",
                 {"channel_id": out_channel(user_id), "text": "spam"}),
        ],
        "edges": [edge("t1", "a1")],
    }, rate_limit=2)
    sender = DryRunSender()
    runner = RuleRunner(sender)
    for i in range(4):
        ev = Event(type=EVENT_MESSAGE, user_id=user_id, channel_id=in_channel(user_id),
                   data={"text": f"msg {i}", "message_id": 1000 + i})
        await runner.handle_event(ev)
        runner.invalidate(user_id)  # force fresh DB read so the disable is observed

    assert len(sender.sent) == 2
    async with get_db() as db:
        async with db.execute(
            "SELECT is_enabled FROM automation_rules WHERE id = ?", (rule_id,)
        ) as cursor:
            row = await cursor.fetchone()
    assert row["is_enabled"] == 0

    async with get_db() as db:
        async with db.execute(
            "SELECT status FROM rule_executions WHERE rule_id = ? ORDER BY created_at",
            (rule_id,),
        ) as cursor:
            statuses = [r["status"] for r in await cursor.fetchall()]
    assert "rate_limited" in statuses


@pytest.mark.asyncio
async def test_outcome_trigger_with_min_tp_and_template():
    user_id = await seed_user_with_channels()
    template_id = str(uuid.uuid4())
    async with get_db() as db:
        await db.execute(
            """INSERT INTO message_templates (id, user_id, name, body, created_at, updated_at)
               VALUES (?, ?, 'tp', '🎯 {pair} TP{tp_level} HIT! +{pips} pips', ?, ?)""",
            (template_id, user_id, time.time(), time.time()),
        )
        await db.commit()

    rule_id, _ = await seed_rule(user_id, {
        "nodes": [
            node("t1", "trigger", EVENT_OUTCOME,
                 {"events": ["tp_hit"], "min_tp_level": 2}),
            node("a1", "action", "send_message",
                 {"channel_id": out_channel(user_id), "template_id": template_id}),
        ],
        "edges": [edge("t1", "a1")],
    })
    runner = RuleRunner(DryRunSender())
    rule = await _load_rule(rule_id)

    low = Event(type=EVENT_OUTCOME, user_id=user_id, channel_id=in_channel(user_id),
                data={"signal_id": "s1", "outcome": "tp_hit", "tp_level": 1,
                      "pair": "XAUUSD", "pips": 50})
    assert (await runner.test_rule(rule, low))["status"] == "skipped"

    high = Event(type=EVENT_OUTCOME, user_id=user_id, channel_id=in_channel(user_id),
                 data={"signal_id": "s1", "outcome": "tp_hit", "tp_level": 2,
                       "pair": "XAUUSD", "pips": 150})
    result = await runner.test_rule(rule, high)
    assert result["status"] == "dry_run"
    assert result["trace"]["steps"][0]["detail"]["text"] == "🎯 XAUUSD TP2 HIT! +150 pips"


@pytest.mark.asyncio
async def test_sent_messages_recorded_on_real_path():
    user_id = await seed_user_with_channels()
    await _seed_bot_token(user_id)
    rule_id, _ = await seed_rule(user_id, {
        "nodes": [
            node("t1", "trigger", EVENT_MESSAGE),
            node("a1", "action", "send_message",
                 {"channel_id": out_channel(user_id), "text": "recorded"}),
        ],
        "edges": [edge("t1", "a1")],
    })
    sender = DryRunSender()
    runner = RuleRunner(sender)
    ev = Event(type=EVENT_MESSAGE, user_id=user_id, channel_id=in_channel(user_id),
               data={"text": "go", "message_id": 555})
    await runner.handle_event(ev)
    assert len(sender.sent) == 1
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM sent_messages WHERE rule_id = ?", (rule_id,)
        ) as cursor:
            rows = await cursor.fetchall()
    assert len(rows) == 1
    assert rows[0]["chat_id"].startswith("-100")


# ── helpers ───────────────────────────────────────────────────────────────────

async def _load_rule(rule_id):
    async with get_db() as db:
        async with db.execute(
            "SELECT * FROM automation_rules WHERE id = ?", (rule_id,)
        ) as cursor:
            return dict(await cursor.fetchone())


async def _seed_bot_token(user_id):
    from backend.services.crypto import encrypt_str
    async with get_db() as db:
        await db.execute(
            "INSERT OR REPLACE INTO user_settings (user_id, key, value) VALUES (?, 'telegram', ?)",
            (user_id, json.dumps({"bot_token_enc": encrypt_str("123:TEST")})),
        )
        await db.commit()
