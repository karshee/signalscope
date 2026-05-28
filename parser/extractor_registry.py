"""Registry that runs all enabled extractors on a message."""
from __future__ import annotations

import logging
from typing import Optional

from parser.base_extractor import BaseExtractor, ExtractedEvent
from parser.signal_extractor import SignalExtractor
from parser.keyword_extractor import KeywordExtractor
from parser.sentiment_extractor import SentimentExtractor
from parser.mention_extractor import MentionExtractor

logger = logging.getLogger(__name__)


class ExtractorRegistry:
    def __init__(self):
        self._extractors: list[BaseExtractor] = []

    def register(self, extractor: BaseExtractor) -> "ExtractorRegistry":
        self._extractors.append(extractor)
        return self

    def process(self, text: str, channel_id: str = "", message_id: int = 0) -> list[ExtractedEvent]:
        events = []
        for ext in self._extractors:
            try:
                if ext.can_handle(text):
                    events.extend(ext.extract(text, channel_id, message_id))
            except Exception as e:
                logger.warning(f"Extractor {ext.name!r} failed: {e}")
        return events

    @classmethod
    def default(cls, keywords: Optional[list[str]] = None) -> "ExtractorRegistry":
        reg = cls()
        reg.register(SignalExtractor())
        reg.register(SentimentExtractor())
        reg.register(MentionExtractor())
        if keywords:
            reg.register(KeywordExtractor(keywords))
        return reg
