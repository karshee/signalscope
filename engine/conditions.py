"""Condition evaluators — registry keyed by type, mirroring parser/extractor_registry."""
from __future__ import annotations

import logging
import re
import time
from typing import Any, Callable, Optional
from zoneinfo import ZoneInfo

from engine.events import Event
from engine.templating import build_context

logger = logging.getLogger(__name__)


def _get_field(event: Event, field: str) -> Any:
    """Resolve a dotted field path against the template context, then raw data."""
    ctx = build_context(event)
    if field in ctx:
        return ctx[field]
    cur: Any = event.data
    for part in field.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None
    return cur


def _coerce_pair(a: Any, b: Any) -> tuple[Any, Any]:
    """Coerce to floats when both look numeric so 2 >= "1.5" compares sanely."""
    try:
        return float(a), float(b)
    except (TypeError, ValueError):
        return str(a), str(b)


# ── Evaluators ────────────────────────────────────────────────────────────────

def eval_text_match(config: dict, event: Event) -> bool:
    value = _get_field(event, config.get("field") or "text")
    if value is None:
        return False
    text = str(value)
    pattern = str(config.get("value", ""))
    mode = config.get("mode", "contains")
    if not config.get("case_sensitive"):
        if mode != "regex":
            text, pattern = text.lower(), pattern.lower()

    if mode == "contains":
        return pattern in text
    if mode == "exact":
        return text == pattern
    if mode == "regex":
        flags = 0 if config.get("case_sensitive") else re.IGNORECASE
        try:
            return re.search(pattern, str(value), flags) is not None
        except re.error:
            return False
    return False


def eval_channel_filter(config: dict, event: Event) -> bool:
    ids = config.get("channel_ids") or []
    return event.channel_id in ids


_OPS: dict[str, Callable[[Any, Any], bool]] = {
    "==": lambda a, b: a == b,
    "!=": lambda a, b: a != b,
    ">": lambda a, b: a > b,
    ">=": lambda a, b: a >= b,
    "<": lambda a, b: a < b,
    "<=": lambda a, b: a <= b,
}


def eval_field_compare(config: dict, event: Event) -> bool:
    actual = _get_field(event, config.get("field", ""))
    expected = config.get("value")
    op = config.get("op", "==")

    if op == "in":
        items = expected if isinstance(expected, list) else [expected]
        return actual in items or str(actual) in [str(i) for i in items]
    if op == "contains":
        return actual is not None and str(expected) in str(actual)

    if actual is None:
        return False
    fn = _OPS.get(op)
    if not fn:
        return False
    a, b = _coerce_pair(actual, expected)
    try:
        return fn(a, b)
    except TypeError:
        return False


def eval_time_window(config: dict, event: Event) -> bool:
    tz = ZoneInfo(config.get("timezone") or "UTC")
    import datetime as dt
    now = dt.datetime.fromtimestamp(event.occurred_at, tz)

    days = config.get("days")  # 0=Monday .. 6=Sunday
    if days and now.weekday() not in days:
        return False

    start, end = config.get("start"), config.get("end")
    if start and end:
        cur = now.strftime("%H:%M")
        if start <= end:
            return start <= cur <= end
        return cur >= start or cur <= end  # window crosses midnight
    return True


CONDITIONS: dict[str, Callable[[dict, Event], bool]] = {
    "text_match": eval_text_match,
    "channel_filter": eval_channel_filter,
    "field_compare": eval_field_compare,
    "time_window": eval_time_window,
}

CONDITION_TYPES = tuple(CONDITIONS.keys())


def evaluate(cond_type: str, config: dict, event: Event) -> bool:
    fn = CONDITIONS.get(cond_type)
    if not fn:
        logger.warning(f"Unknown condition type {cond_type!r}")
        return False
    try:
        return fn(config, event)
    except Exception as e:
        logger.warning(f"Condition {cond_type} raised: {e}")
        return False


# ── Save-time config validation ───────────────────────────────────────────────

def validate_condition(cond_type: str, config: dict) -> list[str]:
    errors = []
    if cond_type == "text_match":
        if not str(config.get("value", "")).strip():
            errors.append("text match needs a value")
        if config.get("mode", "contains") not in ("contains", "exact", "regex"):
            errors.append("mode must be contains/exact/regex")
        if config.get("mode") == "regex":
            try:
                re.compile(str(config.get("value", "")))
            except re.error as e:
                errors.append(f"invalid regex: {e}")
    elif cond_type == "channel_filter":
        if not config.get("channel_ids"):
            errors.append("channel filter needs at least one channel")
    elif cond_type == "field_compare":
        if not str(config.get("field", "")).strip():
            errors.append("field compare needs a field")
        if config.get("op", "==") not in ("==", "!=", ">", ">=", "<", "<=", "in", "contains"):
            errors.append("unknown comparison operator")
    elif cond_type == "time_window":
        for key in ("start", "end"):
            v = config.get(key)
            if v and not re.fullmatch(r"\d{2}:\d{2}", v):
                errors.append(f"{key} must be HH:MM")
        tz = config.get("timezone")
        if tz:
            try:
                ZoneInfo(tz)
            except Exception:
                errors.append(f"unknown timezone {tz!r}")
    return errors
