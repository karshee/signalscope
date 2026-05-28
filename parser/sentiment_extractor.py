"""Lightweight sentiment extractor using word lists."""
import time

from parser.base_extractor import BaseExtractor, ExtractedEvent

_BULLISH = ["buy", "long", "bullish", "moon", "pump", "breakout", "accumulate", "calls", "upside", "surge", "rally", "all time high", "ath", "launch", "partnership", "listing"]
_BEARISH = ["sell", "short", "bearish", "dump", "drop", "crash", "rugpull", "rug", "scam", "hack", "exploit", "fraud", "warning", "danger", "avoid", "ban", "shutdown"]
_URGENT  = ["urgent", "breaking", "alert", "now", "immediately", "asap", "critical", "emergency"]


def _score(text: str, words: list[str]) -> int:
    t = text.lower()
    return sum(1 for w in words if w in t)


class SentimentExtractor(BaseExtractor):
    name = "sentiment"
    min_score: int = 1

    def can_handle(self, text: str) -> bool:
        return bool(text and len(text) > 10)

    def extract(self, text: str, channel_id: str = "", message_id: int = 0) -> list[ExtractedEvent]:
        bull = _score(text, _BULLISH)
        bear = _score(text, _BEARISH)
        urgent = _score(text, _URGENT)
        total = bull + bear
        if total < self.min_score:
            return []

        if bull > bear:
            sentiment, score = "bullish", min(1.0, bull / max(total, 1))
        elif bear > bull:
            sentiment, score = "bearish", min(1.0, bear / max(total, 1))
        else:
            sentiment, score = "neutral", 0.5

        return [ExtractedEvent(
            extractor="sentiment",
            event_type="sentiment_signal",
            confidence=score,
            data={"sentiment": sentiment, "bull_score": bull, "bear_score": bear, "urgent": urgent > 0},
            raw_text=text,
            channel_id=channel_id,
            message_id=message_id,
            timestamp=time.time(),
            tags=[sentiment] + (["urgent"] if urgent else []),
        )]
