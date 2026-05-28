"""Trading signal extractor — wraps signal_parser.py as a BaseExtractor."""
import time

from parser.base_extractor import BaseExtractor, ExtractedEvent
from parser.signal_parser import parse_telegram_signal


class SignalExtractor(BaseExtractor):
    name = "signal"

    def can_handle(self, text: str) -> bool:
        if not text or len(text) < 10:
            return False
        t = text.upper()
        return any(kw in t for kw in ("BUY", "SELL", "LONG", "SHORT", "XAUUSD", "GOLD", "BTCUSD", "EURUSD", "GBPUSD", "TP", "SL", "STOP LOSS"))

    def extract(self, text: str, channel_id: str = "", message_id: int = 0) -> list[ExtractedEvent]:
        parsed = parse_telegram_signal(text)
        if parsed.signal_type == "note":
            return []
        return [ExtractedEvent(
            extractor="signal",
            event_type=f"trade_{parsed.signal_type}",
            confidence=parsed.confidence,
            data={
                "pair": parsed.pair,
                "direction": parsed.direction,
                "entry_price": parsed.entry_price,
                "stop_loss": parsed.stop_loss,
                "take_profits": parsed.take_profits,
                "order_type": parsed.order_type,
                "signal_type": parsed.signal_type,
            },
            raw_text=text,
            channel_id=channel_id,
            message_id=message_id,
            timestamp=time.time(),
            tags=[parsed.pair or "", parsed.direction or "", "trade"],
        )]
