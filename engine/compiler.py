"""Compile a React Flow rule graph into an executable tree.

Graph contract (what the editor saves):
  nodes: [{id, type: "trigger"|"condition"|"action", data: {nodeType, config}}]
  edges: [{id?, source, target}]

Compiled tree (what the runner walks):
  {"version": 1,
   "trigger": {"type": <event type>, "config": {...}},
   "children": [{"kind": "condition"|"action", "type": ..., "config": {...}, "children": [...]}]}

Validation happens here so the editor gets per-node errors at save time and
the runtime stays a dumb tree-walker.
"""
from __future__ import annotations

from engine.events import EVENT_TYPES
from engine.conditions import CONDITION_TYPES, validate_condition
from engine.actions import ACTION_TYPES, validate_action

MAX_NODES = 50


class CompileError(Exception):
    """Raised on invalid graphs. `errors` is a list of {node_id, message}."""

    def __init__(self, errors: list[dict]):
        self.errors = errors
        super().__init__("; ".join(e["message"] for e in errors))


def _err(node_id, message) -> dict:
    return {"node_id": node_id, "message": message}


def validate_trigger_config(node_type: str, config: dict) -> list[str]:
    errors = []
    if node_type == "schedule.tick":
        cron = (config.get("cron") or "").strip()
        if not cron:
            errors.append("schedule trigger requires a cron expression")
        elif len(cron.split()) != 5:
            errors.append("cron must have 5 fields (min hour day month weekday)")
    if node_type == "outcome.event":
        events = config.get("events")
        if events is not None:
            bad = [e for e in events if e not in ("tp_hit", "sl_hit")]
            if bad:
                errors.append(f"unknown outcome events: {bad}")
    return errors


def compile_graph(graph: dict) -> dict:
    nodes = graph.get("nodes") or []
    edges = graph.get("edges") or []
    errors: list[dict] = []

    if not nodes:
        raise CompileError([_err(None, "graph has no nodes")])
    if len(nodes) > MAX_NODES:
        raise CompileError([_err(None, f"graph exceeds {MAX_NODES} nodes")])

    by_id: dict[str, dict] = {}
    for n in nodes:
        nid = n.get("id")
        if not nid:
            errors.append(_err(None, "node missing id"))
            continue
        if nid in by_id:
            errors.append(_err(nid, "duplicate node id"))
        by_id[nid] = n

    triggers = [n for n in nodes if n.get("type") == "trigger"]
    if len(triggers) != 1:
        errors.append(_err(None, f"rule must have exactly one trigger (found {len(triggers)})"))

    # Adjacency + incoming counts
    children_of: dict[str, list[str]] = {nid: [] for nid in by_id}
    incoming: dict[str, int] = {nid: 0 for nid in by_id}
    for e in edges:
        src, dst = e.get("source"), e.get("target")
        if src not in by_id or dst not in by_id:
            errors.append(_err(None, f"edge references unknown node ({src} -> {dst})"))
            continue
        children_of[src].append(dst)
        incoming[dst] += 1

    if errors:
        raise CompileError(errors)

    trigger = triggers[0]
    tid = trigger["id"]
    if incoming[tid] > 0:
        errors.append(_err(tid, "trigger cannot have incoming connections"))

    # Per-node type + config validation
    for n in nodes:
        nid = n["id"]
        kind = n.get("type")
        data = n.get("data") or {}
        node_type = data.get("nodeType")
        config = data.get("config") or {}

        if kind == "trigger":
            if node_type not in EVENT_TYPES:
                errors.append(_err(nid, f"unknown trigger type {node_type!r}"))
            else:
                errors.extend(_err(nid, m) for m in validate_trigger_config(node_type, config))
        elif kind == "condition":
            if node_type not in CONDITION_TYPES:
                errors.append(_err(nid, f"unknown condition type {node_type!r}"))
            else:
                errors.extend(_err(nid, m) for m in validate_condition(node_type, config))
        elif kind == "action":
            if node_type not in ACTION_TYPES:
                errors.append(_err(nid, f"unknown action type {node_type!r}"))
            else:
                errors.extend(_err(nid, m) for m in validate_action(node_type, config))
        else:
            errors.append(_err(nid, f"unknown node kind {kind!r}"))

    # Cycle detection (iterative DFS with colors)
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {nid: WHITE for nid in by_id}

    def has_cycle(start: str) -> bool:
        stack = [(start, iter(children_of[start]))]
        color[start] = GRAY
        while stack:
            nid, it = stack[-1]
            advanced = False
            for child in it:
                if color[child] == GRAY:
                    return True
                if color[child] == WHITE:
                    color[child] = GRAY
                    stack.append((child, iter(children_of[child])))
                    advanced = True
                    break
            if not advanced:
                color[nid] = BLACK
                stack.pop()
        return False

    for nid in by_id:
        if color[nid] == WHITE and has_cycle(nid):
            errors.append(_err(None, "graph contains a cycle"))
            break

    # Reachability from trigger
    reachable = set()
    queue = [tid]
    while queue:
        cur = queue.pop()
        if cur in reachable:
            continue
        reachable.add(cur)
        queue.extend(children_of[cur])
    orphans = set(by_id) - reachable
    for nid in sorted(orphans):
        errors.append(_err(nid, "node is not connected to the trigger"))

    if errors:
        raise CompileError(errors)

    # Build the tree
    def build(nid: str, seen: frozenset) -> dict:
        n = by_id[nid]
        data = n.get("data") or {}
        return {
            "kind": n["type"],
            "node_id": nid,
            "type": data.get("nodeType"),
            "config": data.get("config") or {},
            "children": [build(c, seen | {nid}) for c in children_of[nid] if c not in seen],
        }

    tdata = trigger.get("data") or {}
    return {
        "version": 1,
        "trigger": {
            "node_id": tid,
            "type": tdata.get("nodeType"),
            "config": tdata.get("config") or {},
        },
        "children": [build(c, frozenset({tid})) for c in children_of[tid]],
    }
