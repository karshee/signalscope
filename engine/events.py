"""Normalized events flowing through the automation engine."""
from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from typing import Optional

EVENT_MESSAGE = "message.received"
EVENT_OUTCOME = "outcome.event"
EVENT_SCHEDULE = "schedule.tick"
EVENT_WEBHOOK = "webhook.received"

EVENT_TYPES = (EVENT_MESSAGE, EVENT_OUTCOME, EVENT_SCHEDULE, EVENT_WEBHOOK)


@dataclass
class Event:
    """A single normalized event. `data` is type-specific, `meta` is engine bookkeeping.

    data payloads by type:
      message.received: {text, message_id, channel_title, has_media, media_type, extracted: [...]}
      outcome.event:    {signal_id, outcome: "tp_hit"|"sl_hit", tp_level, pair, direction, pips, rr, raw_text}
      schedule.tick:    {rule_id, cron}
      webhook.received: {token_id, token_name, body: dict}
    """
    type: str
    user_id: str
    channel_id: Optional[str] = None
    data: dict = field(default_factory=dict)
    meta: dict = field(default_factory=dict)
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    occurred_at: float = field(default_factory=time.time)

    @property
    def self_sent(self) -> bool:
        return bool(self.meta.get("self_sent"))

    def dedup_key(self) -> str:
        """Stable key identifying this logical event for at-most-once rule firing."""
        if self.type == EVENT_MESSAGE:
            return f"msg:{self.channel_id}:{self.data.get('message_id')}"
        if self.type == EVENT_OUTCOME:
            return f"out:{self.data.get('signal_id')}:{self.data.get('outcome')}:{self.data.get('tp_level')}"
        return f"evt:{self.id}"
