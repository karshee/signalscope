"""Base class for all message extractors."""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class ExtractedEvent:
    extractor: str           # "signal" | "keyword" | "mention" | "sentiment" | "custom"
    event_type: str          # e.g. "trade_signal", "keyword_hit", "mention"
    confidence: float        # 0.0 - 1.0
    data: dict               # extractor-specific structured data
    raw_text: str
    channel_id: str
    message_id: int
    timestamp: float
    tags: list[str] = field(default_factory=list)


class BaseExtractor(ABC):
    name: str = "base"

    @abstractmethod
    def can_handle(self, text: str) -> bool:
        """Quick pre-check before full extraction."""
        ...

    @abstractmethod
    def extract(self, text: str, channel_id: str = "", message_id: int = 0) -> list[ExtractedEvent]:
        """Extract zero or more events from a message."""
        ...
