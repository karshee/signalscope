"""Safe {var} interpolation for message templates.

Plain regex replacement — no str.format / eval, so template bodies can never
reach code. Unknown variables are left literal and reported as warnings.
"""
from __future__ import annotations

import re
import time
from typing import Any

from engine.events import Event, EVENT_MESSAGE, EVENT_OUTCOME, EVENT_WEBHOOK

VAR_RE = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_.]*)\}")


def render(body: str, context: dict) -> tuple[str, list[str]]:
    """Interpolate {var} placeholders from a flat context dict.

    Returns (rendered_text, warnings). Unknown vars stay literal.
    """
    warnings: list[str] = []

    def _sub(m: re.Match) -> str:
        key = m.group(1)
        if key in context and context[key] is not None:
            return str(context[key])
        warnings.append(f"unknown variable {{{key}}}")
        return m.group(0)

    return VAR_RE.sub(_sub, body), warnings


def _flatten(prefix: str, obj: Any, out: dict, depth: int = 0):
    if depth > 4:
        return
    if isinstance(obj, dict):
        for k, v in obj.items():
            _flatten(f"{prefix}.{k}" if prefix else str(k), v, out, depth + 1)
    elif isinstance(obj, (str, int, float, bool)) or obj is None:
        out[prefix] = obj


def build_context(event: Event) -> dict:
    """Build the flat variable context available to templates for a given event."""
    now = time.gmtime(event.occurred_at)
    ctx: dict = {
        "date": time.strftime("%Y-%m-%d", now),
        "time": time.strftime("%H:%M", now),
        "event_type": event.type,
    }

    if event.type == EVENT_MESSAGE:
        ctx["text"] = event.data.get("text")
        ctx["channel_title"] = event.data.get("channel_title")
        ctx["message_id"] = event.data.get("message_id")
        # Surface parsed signal fields from extractors as first-class vars
        for ext in event.data.get("extracted") or []:
            if ext.get("extractor") == "signal":
                d = ext.get("data") or {}
                ctx.setdefault("pair", d.get("pair"))
                ctx.setdefault("direction", d.get("direction"))
                ctx.setdefault("entry_price", d.get("entry_price"))
                ctx.setdefault("stop_loss", d.get("stop_loss"))
    elif event.type == EVENT_OUTCOME:
        for k in ("pair", "direction", "outcome", "tp_level", "pips", "rr", "signal_id"):
            ctx[k] = event.data.get(k)
        ctx["text"] = event.data.get("raw_text")
        ctx["channel_title"] = event.data.get("channel_title")
    elif event.type == EVENT_WEBHOOK:
        _flatten("webhook", event.data.get("body") or {}, ctx)

    return ctx
