"""Keyword and pattern matching extractor."""
import re
import time
from typing import Optional

from parser.base_extractor import BaseExtractor, ExtractedEvent


class KeywordExtractor(BaseExtractor):
    name = "keyword"

    def __init__(self, keywords: list[str], case_sensitive: bool = False):
        self.keywords = keywords
        self.flags = 0 if case_sensitive else re.IGNORECASE
        self._patterns = [re.compile(r'\b' + re.escape(kw) + r'\b', self.flags) for kw in keywords]

    def can_handle(self, text: str) -> bool:
        if not text:
            return False
        check = text if self.flags else text.lower()
        return any(kw.lower() in check for kw in self.keywords)

    def extract(self, text: str, channel_id: str = "", message_id: int = 0) -> list[ExtractedEvent]:
        hits = []
        for kw, pat in zip(self.keywords, self._patterns):
            matches = pat.findall(text)
            if matches:
                hits.append(ExtractedEvent(
                    extractor="keyword",
                    event_type="keyword_hit",
                    confidence=1.0,
                    data={"keyword": kw, "match_count": len(matches), "context": text[:300]},
                    raw_text=text,
                    channel_id=channel_id,
                    message_id=message_id,
                    timestamp=time.time(),
                    tags=[kw.lower()],
                ))
        return hits
