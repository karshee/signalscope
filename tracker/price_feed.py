"""
Price feed for outcome tracking.
- Crypto: ccxt (Binance, free tier)
- FX/Gold/Indices: yfinance (15-min delay — acceptable for post-hoc scoring)
"""
import asyncio
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

# Map canonical pairs to yfinance tickers
_YFINANCE_MAP = {
    "XAUUSD": "GC=F",
    "XAGUSD": "SI=F",
    "EURUSD": "EURUSD=X",
    "GBPUSD": "GBPUSD=X",
    "USDJPY": "JPY=X",
    "AUDUSD": "AUDUSD=X",
    "USDCAD": "CAD=X",
    "USDCHF": "CHF=X",
    "NZDUSD": "NZDUSD=X",
    "GBPJPY": "GBPJPY=X",
    "EURJPY": "EURJPY=X",
    "EURGBP": "EURGBP=X",
    "AUDNZD": "AUDNZD=X",
    "CADJPY": "CADJPY=X",
    "NZDJPY": "NZDJPY=X",
    "AUDCAD": "AUDCAD=X",
    "GBPCAD": "GBPCAD=X",
    "GBPNZD": "GBPNZD=X",
    "GBPAUD": "GBPAUD=X",
    "EURAUD": "EURAUD=X",
    "EURCAD": "EURCAD=X",
    "EURNZD": "EURNZD=X",
    "AUDJPY": "AUDJPY=X",
    "CHFJPY": "CHFJPY=X",
    "US30": "^DJI",
    "NAS100": "^NDX",
    "SPX500": "^GSPC",
    "USOIL": "CL=F",
    "WTI": "CL=F",
    "CRUDE": "CL=F",
}

_CCXT_SYMBOLS = {
    "BTCUSD": "BTC/USDT",
    "ETHUSD": "ETH/USDT",
}


async def get_current_price(pair: str) -> Optional[float]:
    """Get latest price for a pair. Returns None if unavailable."""
    if pair in _CCXT_SYMBOLS:
        return await _get_ccxt_price(pair)
    return await _get_yfinance_price(pair)


async def _get_yfinance_price(pair: str) -> Optional[float]:
    ticker = _YFINANCE_MAP.get(pair)
    if not ticker:
        return None
    try:
        import yfinance as yf
        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()

        def _fetch():
            t = yf.Ticker(ticker)
            hist = t.history(period="1d", interval="5m")
            if hist.empty:
                return None
            return float(hist["Close"].iloc[-1])

        return await loop.run_in_executor(None, _fetch)
    except Exception as e:
        logger.debug(f"yfinance error for {pair}: {e}")
        return None


async def _get_ccxt_price(pair: str) -> Optional[float]:
    symbol = _CCXT_SYMBOLS.get(pair)
    if not symbol:
        return None
    try:
        import ccxt.async_support as ccxt
        exchange = ccxt.binance({"enableRateLimit": True})
        try:
            ticker = await exchange.fetch_ticker(symbol)
            return float(ticker["last"])
        finally:
            await exchange.close()
    except Exception as e:
        logger.debug(f"ccxt error for {pair}: {e}")
        return None


def pips_distance(pair: str, price_a: float, price_b: float) -> float:
    """Calculate pip distance between two prices."""
    diff = abs(price_a - price_b)
    # JPY pairs: 1 pip = 0.01; Gold: 1 pip = 0.1 (or 1.0); others: 1 pip = 0.0001
    if "JPY" in pair:
        return diff / 0.01
    elif pair in ("XAUUSD", "XAGUSD"):
        return diff / 0.1
    elif pair in ("US30", "NAS100", "SPX500", "BTCUSD", "ETHUSD", "USOIL", "WTI", "CRUDE"):
        return diff  # points, not pips
    else:
        return diff / 0.0001
