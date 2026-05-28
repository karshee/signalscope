"""
Signal parser for SignalScope — ported from signal-watcher/signal_parse.py.
All regex patterns preserved from the original battle-tested implementation.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Tuple, Any, Dict

# ── Pair patterns (ported from signal_parse.py PAIR_PATTERNS) ─────────────────
PAIR_PATTERNS: List[Tuple[str, str]] = [
    (r"X\s*A\s*U\s*U\s*S\s*D", "XAUUSD"),
    (r"G\s*O\s*L\s*D", "XAUUSD"),
    (r"B\s*T\s*C\s*/?U\s*S\s*D", "BTCUSD"),
    (r"B\s*I\s*T\s*C\s*O\s*I\s*N", "BTCUSD"),
    (r"E\s*T\s*H\s*U\s*S\s*D", "ETHUSD"),
    (r"E\s*U\s*R\s*[/]?\s*U\s*S\s*D", "EURUSD"),
    (r"G\s*B\s*P\s*[/]?\s*U\s*S\s*D", "GBPUSD"),
    (r"U\s*S\s*D\s*[/]?\s*J\s*P\s*Y", "USDJPY"),
    (r"A\s*U\s*D\s*[/]?\s*U\s*S\s*D", "AUDUSD"),
    (r"U\s*S\s*D\s*[/]?\s*C\s*A\s*D", "USDCAD"),
    (r"U\s*S\s*D\s*[/]?\s*C\s*H\s*F", "USDCHF"),
    (r"N\s*Z\s*D\s*[/]?\s*U\s*S\s*D", "NZDUSD"),
    (r"G\s*B\s*P\s*[/]?\s*J\s*P\s*Y", "GBPJPY"),
    (r"E\s*U\s*R\s*[/]?\s*J\s*P\s*Y", "EURJPY"),
    (r"E\s*U\s*R\s*[/]?\s*G\s*B\s*P", "EURGBP"),
    (r"A\s*U\s*D\s*[/]?\s*N\s*Z\s*D", "AUDNZD"),
    (r"C\s*A\s*D\s*[/]?\s*J\s*P\s*Y", "CADJPY"),
    (r"N\s*Z\s*D\s*[/]?\s*J\s*P\s*Y", "NZDJPY"),
    (r"A\s*U\s*D\s*[/]?\s*C\s*A\s*D", "AUDCAD"),
    (r"G\s*B\s*P\s*[/]?\s*C\s*A\s*D", "GBPCAD"),
    (r"G\s*B\s*P\s*[/]?\s*N\s*Z\s*D", "GBPNZD"),
    (r"G\s*B\s*P\s*[/]?\s*A\s*U\s*D", "GBPAUD"),
    (r"E\s*U\s*R\s*[/]?\s*A\s*U\s*D", "EURAUD"),
    (r"E\s*U\s*R\s*[/]?\s*C\s*A\s*D", "EURCAD"),
    (r"E\s*U\s*R\s*[/]?\s*N\s*Z\s*D", "EURNZD"),
    (r"A\s*U\s*D\s*[/]?\s*J\s*P\s*Y", "AUDJPY"),
    (r"C\s*H\s*F\s*[/]?\s*J\s*P\s*Y", "CHFJPY"),
    (r"X\s*A\s*G\s*U\s*S\s*D", "XAGUSD"),
    (r"S\s*I\s*L\s*V\s*E\s*R", "XAGUSD"),
    (r"U\s*S\s*3\s*0", "US30"),
    (r"N\s*A\s*S\s*(?:1\s*0\s*0|D\s*A\s*Q)", "NAS100"),
    (r"S\s*P\s*X?\s*5\s*0\s*0", "SPX500"),
    (r"U\s*S\s*O\s*I\s*L", "USOIL"),
    (r"W\s*T\s*I", "WTI"),
    (r"C\s*R\s*U\s*D\s*E", "CRUDE"),
]

# ── TP patterns ───────────────────────────────────────────────────────────────
_TP_LINE_NUM = re.compile(r"(?i)^\s*TP\s*\d{1,2}\s*[:=.]\s*(\d+(?:\.\d+)?)\s*$")
_TP_LINE_NUMBERED = re.compile(r"(?i)^\s*TP(\d{1,2})\s*(?:[:=.]+\s*|\s+)(\d+(?:\.\d+)?)\s*$")
_TP_LINE_SPACE = re.compile(r"(?i)^\s*TP\s+(\d+(?:\.\d+)?)\s*$")
_TP_LINE_GLUED = re.compile(r"(?i)^\s*TP(\d{3,}(?:\.\d+)?)\s*$")
_TP_NUMBERED_ANYWHERE = re.compile(r"(?i)\bTP(?:\d{1,2})\s*(?:[:=.]+\s*|\s+)(\d+(?:\.\d+)?)\b")
_TP_ALT_LINE = re.compile(r"(?i)\b(?:TARGET|TG)\s*\d{1,2}\s*[:=.]\s*(\d+(?:\.\d+)?)\b")
_TP_INLINE_PATTERNS = [
    r"(?i)\bTP(?:\s*\d{1,2})+\s*[:=.]+\s*(\d+(?:\.\d+)?)\b",
    r"(?i)\bTP(?:\d{1,2})\s*(?:[:=.]+\s*|\s+)(\d+(?:\.\d+)?)\b",
    r"(?i)\bTP\s+(\d+(?:\.\d+)?)\b",
    r"(?i)\bTP(\d{3,}(?:\.\d+)?)\b",
    r"(?i)\bTP\s*[:=.]\s*(\d+(?:\.\d+)?)\b",
    r"(?i)take\s*profit\s*(?:\d{1,2}\s*)?[:=.]+\s*(\d+(?:\.\d+)?)\b",
    r"(?i)\btarget\s*(?:\d{1,2}\s*)?[:=.]+\s*(\d+(?:\.\d+)?)\b",
]

# ── SL patterns ───────────────────────────────────────────────────────────────
SL_PATTERNS = [
    r"(?i)\bSL\s*[:=]?\s*(\d+(?:\.\d+)?)",
    r"(?i)stop\s*loss\D{0,32}?(\d+(?:\.\d+)?)\b",
    r"(?i)stoploss\s*[:=]?\s*(\d+(?:\.\d+)?)\b",
    r"(?i)\bstop\s*[:=]?\s*(\d+(?:\.\d+)?)\b",
]

# ── Direction patterns ─────────────────────────────────────────────────────────
_MARKET_DIR = [
    (r"\bBUY\b", "buy"),
    (r"\bSELL\b", "sell"),
    (r"\bLONG\b", "buy"),
    (r"\bSHORT\b", "sell"),
    (r"\bBUI\b", "buy"),
    (r"\bSEL\b", "sell"),
]
_LIMIT_LINE = re.compile(r"(?i)\b(BUY|SELL)\s+LIMIT\s+(?:@\s*)?(\d+(?:\.\d+)?)\b")
_LIMIT_LINE_PAIR_MIDDLE = re.compile(r"(?i)\b(BUY|SELL)\s+LIMIT\s+\S+\s+@?\s*(\d+(?:\.\d+)?)\b")
_STOP_LINE = re.compile(r"(?i)\b(BUY|SELL)\s+STOP\s+(?:@\s*)?(\d+(?:\.\d+)?)\b")
_STOP_LINE_PAIR_MIDDLE = re.compile(r"(?i)\b(BUY|SELL)\s+STOP\s+\S+\s+@?\s*(\d+(?:\.\d+)?)\b")

# ── Cancel/Wait/ModifySL patterns ─────────────────────────────────────────────
_CANCEL_WORDS = re.compile(
    r"(?i)\b(cancel(?:led|ed)?|scratch|void|abort\s+this|kill\s+this|forget\s+(?:this|it)|"
    r"remove\s+(?:the\s+)?order|delete\s+(?:the\s+)?order|off\s+the\s+table|"
    r"no\s+longer\s+valid|invalid(?:ate)?)\b"
)
_MODIFY_SL_BE = re.compile(
    r"(?i)(\b(?:move|bring|shift|pull|adjust|set)\s+(?:the\s+)?(?:stop\s*loss|\bsl\b)\b)"
    r"|(\b(?:stop\s*loss|\bsl\b)\s*(?:to|@|→|=)\s*(?:break\s*even|breakeven|b\.?e\.?|entry|open|be\b))"
    r"|(\b(?:break\s*even|breakeven)\b.{0,48}\b(?:sl|stop\s*loss)\b)"
    r"|(\b(?:sl|stop\s*loss)\b.{0,48}\b(?:break\s*even|breakeven|b\.?e\.?|to\s+be\b))"
)


@dataclass
class ParsedSignal:
    raw_text: str
    pair: Optional[str] = None
    direction: Optional[str] = None
    entry_price: Optional[float] = None
    entry_range: Optional[Tuple[float, float]] = None
    stop_loss: Optional[float] = None
    take_profits: List[float] = field(default_factory=list)
    signal_type: str = "market"   # market | pending | update | cancel | note
    order_type: str = "market"    # market | buy_limit | sell_limit | buy_stop | sell_stop
    limit_price: Optional[float] = None
    confidence: float = 0.0
    parse_warnings: List[str] = field(default_factory=list)
    is_edited: bool = False
    edit_count: int = 0


def detect_pair(text: str) -> Optional[str]:
    text_upper = text.upper()
    for pattern, pair_name in PAIR_PATTERNS:
        if re.search(pattern, text_upper):
            return pair_name
    return None


def extract_tps(text: str) -> List[float]:
    if not text:
        return []
    raw = text.replace("\r\n", "\n")
    ordered: List[str] = []
    seen: set = set()

    def add(val: str):
        v = val.strip()
        if v and v not in seen:
            seen.add(v)
            ordered.append(v)

    for line in raw.split("\n"):
        s = line.strip()
        if not s:
            continue
        m = _TP_LINE_NUM.match(s)
        if m:
            add(m.group(1))
            continue
        m = _TP_LINE_NUMBERED.match(s)
        if m:
            add(m.group(2))
            continue
        m = _TP_LINE_SPACE.match(s)
        if m:
            add(m.group(1))
            continue
        m = _TP_LINE_GLUED.match(s)
        if m:
            add(m.group(1))
            continue
        for m in _TP_NUMBERED_ANYWHERE.finditer(s):
            add(m.group(1))
        for m in _TP_ALT_LINE.finditer(s):
            add(m.group(1))

    for pattern in _TP_INLINE_PATTERNS:
        for m in re.finditer(pattern, raw):
            add(m.group(1))

    result = []
    for s in ordered:
        try:
            result.append(float(s))
        except ValueError:
            pass
    return result


def extract_sl(text: str) -> Optional[float]:
    for pattern in SL_PATTERNS:
        m = re.search(pattern, text)
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                pass
    return None


def detect_direction_and_order_type(text: str):
    """Returns (direction, order_type, limit_price)."""
    # Check for limit/stop orders first
    m = _LIMIT_LINE.search(text) or _LIMIT_LINE_PAIR_MIDDLE.search(text)
    if m:
        side = m.group(1).upper()
        price = float(m.group(2))
        ot = "buy_limit" if side == "BUY" else "sell_limit"
        return side.lower(), ot, price

    m = _STOP_LINE.search(text) or _STOP_LINE_PAIR_MIDDLE.search(text)
    if m:
        side = m.group(1).upper()
        price = float(m.group(2))
        ot = "buy_stop" if side == "BUY" else "sell_stop"
        return side.lower(), ot, price

    # Market direction
    text_upper = text.upper()
    for pattern, direction in _MARKET_DIR:
        if re.search(pattern, text_upper):
            return direction, "market", None

    return None, "market", None


def extract_entry_price(text: str, direction: str = "", order_type: str = "market"):
    """Returns (entry_price, entry_range) — one or the other, not both."""
    text_upper = text.upper()
    m = re.search(
        r"(?:BUY|SELL|LONG|SHORT|BUI|SEL)\s*[@:]?\s*(\d+\.?\d*)\s*[-–]?\s*(\d+\.?\d*)?",
        text_upper,
    )
    if m:
        p1 = float(m.group(1))
        if m.group(2):
            p2 = float(m.group(2))
            return None, (min(p1, p2), max(p1, p2))
        return p1, None

    # Match "Entry Zone: 67000 - 67500", "Entry: 2341", "@ 1.0850", etc.
    m2 = re.search(
        r"(?i)(?:entry(?:\s+zone)?|e\.?\s*p\.?|price|@)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*[-–]?\s*(\d+(?:\.\d+)?)?",
        text,
    )
    if m2:
        p1 = float(m2.group(1))
        if m2.group(2):
            p2 = float(m2.group(2))
            return None, (min(p1, p2), max(p1, p2))
        return p1, None

    for line in text.replace("\r\n", "\n").split("\n"):
        s = line.strip()
        if not s:
            continue
        m3 = re.search(
            r"(?i)(?:entry(?:\s+zone)?|e\.?\s*p\.?)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:[-–]\s*(\d+(?:\.\d+)?))?",
            s,
        )
        if m3:
            p1 = float(m3.group(1))
            if m3.group(2):
                p2 = float(m3.group(2))
                return None, (min(p1, p2), max(p1, p2))
            return p1, None

    return None, None


def _compute_confidence(parsed: ParsedSignal) -> float:
    score = 0.0
    if parsed.pair:
        score += 0.3
    if parsed.direction:
        score += 0.2
    if parsed.entry_price or parsed.entry_range or parsed.limit_price:
        score += 0.2
    if parsed.stop_loss:
        score += 0.15
    if parsed.take_profits:
        score += 0.15
    return min(1.0, score)


def is_cancel_signal(text: str) -> bool:
    return bool(_CANCEL_WORDS.search(text))


def is_modify_sl(text: str) -> bool:
    if not text or len(text) > 800:
        return False
    if not _MODIFY_SL_BE.search(text):
        return False
    low = text.lower()
    if re.search(r"(?i)\bsl\s*[:=]\s*\d", text) and not re.search(
        r"(?i)(break\s*even|breakeven|b\.?e\.?\b|to\s+be\b|entry|open\s+price)", low
    ):
        if not re.search(r"(?i)\b(move|bring|shift|pull|adjust)\b", low):
            return False
    return True


def parse_telegram_signal(text: str) -> ParsedSignal:
    """Main entry point: parse raw Telegram text into a ParsedSignal."""
    t = (text or "").strip()
    parsed = ParsedSignal(raw_text=t)

    if is_cancel_signal(t):
        parsed.signal_type = "cancel"
        return parsed

    if is_modify_sl(t):
        parsed.signal_type = "update"
        return parsed

    parsed.pair = detect_pair(t)
    direction, order_type, limit_price = detect_direction_and_order_type(t)
    parsed.direction = direction
    parsed.order_type = order_type

    if order_type != "market" and limit_price:
        parsed.limit_price = limit_price
        parsed.entry_price = limit_price
        parsed.signal_type = "pending"
    else:
        entry_price, entry_range = extract_entry_price(t, direction or "", order_type)
        parsed.entry_price = entry_price
        parsed.entry_range = entry_range

    parsed.stop_loss = extract_sl(t)
    parsed.take_profits = extract_tps(t)

    parsed.confidence = _compute_confidence(parsed)

    has_tp_sl = bool(parsed.take_profits) or bool(parsed.stop_loss)
    has_pair = bool(parsed.pair)
    has_direction = bool(parsed.direction)

    if has_pair and has_direction and has_tp_sl:
        parsed.signal_type = "market" if order_type == "market" else "pending"
    elif has_pair and has_tp_sl:
        parsed.signal_type = "market"
    elif has_direction and has_tp_sl:
        parsed.signal_type = "market"
    else:
        parsed.signal_type = "note"

    return parsed
