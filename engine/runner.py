"""Rule runner — matches events to enabled rules and walks their compiled trees."""
from __future__ import annotations

import json
import logging
import time
import uuid
from collections import OrderedDict, deque
from typing import Any, Optional

from engine.events import Event, EVENT_MESSAGE, EVENT_OUTCOME, EVENT_SCHEDULE, EVENT_WEBHOOK
from engine import conditions as cond_mod
from engine import actions as act_mod
from engine.actions import ActionContext, ActionError
from engine.templating import build_context

logger = logging.getLogger(__name__)

DEDUP_LRU_SIZE = 2048
RULE_CACHE_TTL = 30.0


class RuleRunner:
    def __init__(self, sender: Any):
        self.sender = sender
        self._rule_cache: dict[str, tuple[float, list[dict]]] = {}  # user_id -> (loaded_at, rules)
        self._dedup: OrderedDict[str, None] = OrderedDict()
        self._fire_times: dict[str, deque] = {}  # rule_id -> recent fire timestamps

    # ── cache ─────────────────────────────────────────────────────────────────

    def invalidate(self, user_id: Optional[str] = None):
        if user_id:
            self._rule_cache.pop(user_id, None)
        else:
            self._rule_cache.clear()

    async def _rules_for(self, user_id: str, trigger_type: str) -> list[dict]:
        from backend.db.database import get_db
        cached = self._rule_cache.get(user_id)
        if cached and time.monotonic() - cached[0] < RULE_CACHE_TTL:
            rules = cached[1]
        else:
            async with get_db() as db:
                async with db.execute(
                    "SELECT * FROM automation_rules WHERE user_id = ? AND is_enabled = 1",
                    (user_id,),
                ) as cursor:
                    rules = [dict(r) for r in await cursor.fetchall()]
            self._rule_cache[user_id] = (time.monotonic(), rules)
        return [r for r in rules if r["trigger_type"] == trigger_type]

    # ── guards ────────────────────────────────────────────────────────────────

    def _seen(self, rule_id: str, event: Event) -> bool:
        key = f"{rule_id}:{event.dedup_key()}"
        if key in self._dedup:
            return True
        self._dedup[key] = None
        if len(self._dedup) > DEDUP_LRU_SIZE:
            self._dedup.popitem(last=False)
        return False

    def _rate_limited(self, rule: dict) -> bool:
        limit = rule.get("rate_limit_per_min") or 10
        times = self._fire_times.setdefault(rule["id"], deque())
        now = time.monotonic()
        while times and now - times[0] > 60:
            times.popleft()
        if len(times) >= limit:
            return True
        times.append(now)
        return False

    @staticmethod
    def _trigger_matches(trigger: dict, event: Event, rule: dict) -> bool:
        cfg = trigger.get("config") or {}
        if event.type == EVENT_MESSAGE:
            if event.self_sent and not cfg.get("include_self_sent"):
                return False
            ids = cfg.get("channel_ids")
            if ids and event.channel_id not in ids:
                return False
            return True
        if event.type == EVENT_OUTCOME:
            wanted = cfg.get("events")
            if wanted and event.data.get("outcome") not in wanted:
                return False
            ids = cfg.get("channel_ids")
            if ids and event.channel_id not in ids:
                return False
            min_tp = cfg.get("min_tp_level")
            if min_tp and event.data.get("outcome") == "tp_hit":
                if (event.data.get("tp_level") or 0) < int(min_tp):
                    return False
            return True
        if event.type == EVENT_SCHEDULE:
            return event.data.get("rule_id") == rule["id"]
        if event.type == EVENT_WEBHOOK:
            token_id = cfg.get("token_id")
            if token_id and event.data.get("token_id") != token_id:
                return False
            return True
        return False

    # ── execution ─────────────────────────────────────────────────────────────

    async def handle_event(self, event: Event):
        try:
            rules = await self._rules_for(event.user_id, event.type)
        except Exception as e:
            logger.error(f"Rule lookup failed: {e}", exc_info=True)
            return
        for rule in rules:
            try:
                await self._run_rule(rule, event)
            except Exception as e:
                logger.error(f"Rule {rule['id']} crashed: {e}", exc_info=True)

    async def _run_rule(self, rule: dict, event: Event, dry_run: bool = False) -> dict:
        started = time.monotonic()
        compiled = json.loads(rule["compiled_json"]) if isinstance(
            rule.get("compiled_json"), str) else rule["compiled_json"]
        trace: dict = {"steps": [], "actions_run": 0}

        if not self._trigger_matches(compiled["trigger"], event, rule):
            return {"status": "skipped", "reason": "trigger filter"}

        if not dry_run:
            if self._seen(rule["id"], event):
                return {"status": "skipped", "reason": "duplicate event"}
            if self._rate_limited(rule):
                await self._auto_disable(rule)
                await self._log_execution(rule, event, "rate_limited", trace, started)
                return {"status": "rate_limited"}

        ctx = await self._build_context(rule, event, dry_run)
        status = "success"
        try:
            ran = await self._walk(compiled["children"], event, ctx, trace)
            if ran == 0:
                status = "condition_failed"
        except ActionError as e:
            status = "error"
            trace["error"] = str(e)
        except Exception as e:
            status = "error"
            trace["error"] = f"unexpected: {e}"
            logger.error(f"Rule {rule['id']} action error: {e}", exc_info=True)

        if dry_run:
            status = "dry_run" if status == "success" else status
        await self._log_execution(rule, event, status, trace, started, dry_run=dry_run)
        return {"status": status, "trace": trace}

    async def _build_context(self, rule: dict, event: Event, dry_run: bool) -> ActionContext:
        from engine.credentials import get_bot_token
        from engine.sender import DryRunSender
        token = None if dry_run else await get_bot_token(event.user_id)
        return ActionContext(
            user_id=event.user_id,
            rule_id=rule["id"],
            sender=DryRunSender() if dry_run else self.sender,
            bot_token=token,
            dry_run=dry_run,
            template_context=build_context(event),
        )

    async def _walk(self, nodes: list[dict], event: Event, ctx: ActionContext,
                    trace: dict) -> int:
        """Depth-first walk. Conditions gate their subtree. Returns actions executed."""
        ran = 0
        for node in nodes:
            if node["kind"] == "condition":
                passed = cond_mod.evaluate(node["type"], node["config"], event)
                trace["steps"].append({"node_id": node.get("node_id"), "kind": "condition",
                                       "type": node["type"], "passed": passed})
                if passed:
                    ran += await self._walk(node.get("children") or [], event, ctx, trace)
            elif node["kind"] == "action":
                detail = await act_mod.execute(node["type"], node["config"], event, ctx)
                trace["steps"].append({"node_id": node.get("node_id"), "kind": "action",
                                       "type": node["type"], "detail": detail})
                trace["actions_run"] = trace.get("actions_run", 0) + 1
                ran += 1
                ran += await self._walk(node.get("children") or [], event, ctx, trace)
        return ran

    async def _auto_disable(self, rule: dict):
        """Rate limit tripped — disable the rule rather than spam a channel."""
        from backend.db.database import get_db
        from backend.ws.manager import manager
        logger.warning(f"Rule {rule['id']} ({rule['name']}) hit rate limit — auto-disabling")
        async with get_db() as db:
            await db.execute(
                "UPDATE automation_rules SET is_enabled = 0, updated_at = ? WHERE id = ?",
                (time.time(), rule["id"]),
            )
            await db.commit()
        self.invalidate(rule["user_id"])
        await manager.send_to_user(rule["user_id"], {
            "type": "rule_disabled",
            "data": {"rule_id": rule["id"], "name": rule["name"],
                     "reason": "rate limit exceeded — check for loops"},
        })

    async def _log_execution(self, rule: dict, event: Event, status: str,
                             trace: dict, started: float, dry_run: bool = False):
        from backend.db.database import get_db
        from backend.ws.manager import manager
        duration_ms = (time.monotonic() - started) * 1000
        exec_id = str(uuid.uuid4())
        now = time.time()
        try:
            async with get_db() as db:
                await db.execute(
                    """INSERT INTO rule_executions
                       (id, rule_id, event_id, event_type, status, detail, duration_ms, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (exec_id, rule["id"], event.id, event.type, status,
                     json.dumps(trace), duration_ms, now),
                )
                if status == "success" and not dry_run:
                    await db.execute(
                        "UPDATE automation_rules SET last_fired_at = ? WHERE id = ?",
                        (now, rule["id"]),
                    )
                await db.commit()
        except Exception as e:
            logger.error(f"Failed to log execution: {e}")

        try:
            await manager.send_to_user(rule["user_id"], {
                "type": "rule_execution",
                "data": {"id": exec_id, "rule_id": rule["id"], "rule_name": rule["name"],
                         "event_type": event.type, "status": status,
                         "actions_run": trace.get("actions_run", 0), "created_at": now},
            })
        except Exception:
            pass

    # ── dry-run test fire (used by POST /api/rules/{id}/test) ────────────────

    async def test_rule(self, rule: dict, event: Event) -> dict:
        return await self._run_rule(rule, event, dry_run=True)
