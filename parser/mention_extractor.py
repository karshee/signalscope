"""Extract @mentions, URLs, hashtags, and entity references."""
import re
import time

from parser.base_extractor import BaseExtractor, ExtractedEvent

_MENTION = re.compile(r'@([A-Za-z0-9_]{3,})')
_URL     = re.compile(r'https?://[^\s]+')
_HASHTAG = re.compile(r'#([A-Za-z0-9_]+)')
_TICKER  = re.compile(r'\$([A-Z]{2,6})\b')


class MentionExtractor(BaseExtractor):
    name = "mention"

    def can_handle(self, text: str) -> bool:
        return bool(text) and bool(_MENTION.search(text) or _URL.search(text) or _TICKER.search(text))

    def extract(self, text: str, channel_id: str = "", message_id: int = 0) -> list[ExtractedEvent]:
        mentions = _MENTION.findall(text)
        urls     = _URL.findall(text)
        hashtags = _HASHTAG.findall(text)
        tickers  = _TICKER.findall(text)

        if not any([mentions, urls, hashtags, tickers]):
            return []

        return [ExtractedEvent(
            extractor="mention",
            event_type="entities",
            confidence=1.0,
            data={"mentions": mentions, "urls": urls, "hashtags": hashtags, "tickers": tickers},
            raw_text=text,
            channel_id=channel_id,
            message_id=message_id,
            timestamp=time.time(),
            tags=mentions + tickers,
        )]
