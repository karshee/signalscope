"""
Test signal fixtures for parser unit tests.
Each entry: text, expected_pair, expected_direction, expected_entry (float or None).
expected_entry is None for zone entries or market signals without explicit entry.
"""

TEST_SIGNALS = [
    # 1. Gold buy with emoji header
    {
        "text": "🟢 BUY GOLD\nEntry: 2341.50\nSL: 2328\nTP1: 2355\nTP2: 2368",
        "expected_pair": "XAUUSD",
        "expected_direction": "buy",
        "expected_entry": 2341.50,
    },
    # 2. EURUSD sell with @ price
    {
        "text": "SELL EURUSD @ 1.0850\nSL 1.0880\nTP 1.0800",
        "expected_pair": "EURUSD",
        "expected_direction": "sell",
        "expected_entry": 1.0850,
    },
    # 3. Buy Limit on XAUUSD
    {
        "text": "Buy Limit XAUUSD 2340\nSL: 2325\nTP1: 2360",
        "expected_pair": "XAUUSD",
        "expected_direction": "buy",
        "expected_entry": 2340.0,
    },
    # 4. BTC long with entry zone
    {
        "text": "BTCUSD LONG\nEntry Zone: 67000 - 67500\nSL: 65000\nTP1: 70000\nTP2: 72000",
        "expected_pair": "BTCUSD",
        "expected_direction": "buy",
        "expected_entry": None,  # entry zone, not single price
    },
    # 5. ETH short multi-TP
    {
        "text": "🔴 SHORT ETHUSD\nEntry: 3450\nStop Loss: 3520\nTP1: 3380\nTP2: 3300\nTP3: 3200",
        "expected_pair": "ETHUSD",
        "expected_direction": "sell",
        "expected_entry": 3450.0,
    },
    # 6. GBP/USD sell limit
    {
        "text": "SELL LIMIT GBPUSD 1.2750\nSL: 1.2790\nTP: 1.2680",
        "expected_pair": "GBPUSD",
        "expected_direction": "sell",
        "expected_entry": 1.2750,
    },
    # 7. USDJPY buy with stoploss keyword
    {
        "text": "BUY USDJPY\nEntry 149.50\nstoploss: 148.80\nTP1: 150.50\nTP2: 151.20",
        "expected_pair": "USDJPY",
        "expected_direction": "buy",
        "expected_entry": 149.50,
    },
    # 8. Silver buy — XAGUSD alias
    {
        "text": "📈 BUY SILVER\nEntry: 29.50\nSL: 28.80\nTP1: 30.20\nTP2: 31.00",
        "expected_pair": "XAGUSD",
        "expected_direction": "buy",
        "expected_entry": 29.50,
    },
    # 9. NAS100 long — index trade
    {
        "text": "NASDAQ BUY\nEntry: 18250\nSL: 17900\nTP1: 18600\nTP2: 19000",
        "expected_pair": "NAS100",
        "expected_direction": "buy",
        "expected_entry": 18250.0,
    },
    # 10. WTI crude sell
    {
        "text": "SELL WTI\nEntry 78.50\nSL 80.00\nTarget 1: 76.00\nTarget 2: 74.50",
        "expected_pair": "WTI",
        "expected_direction": "sell",
        "expected_entry": 78.50,
    },
    # 11. GBPJPY sell stop order
    {
        "text": "SELL STOP GBPJPY 189.50\nSL: 190.80\nTP1: 187.50\nTP2: 185.00",
        "expected_pair": "GBPJPY",
        "expected_direction": "sell",
        "expected_entry": 189.50,
    },
    # 12. EURUSD buy — emoji-heavy Telegram style
    {
        "text": "✅ SIGNAL ALERT ✅\n\n🟩 BUY EUR/USD\n\n📌 Entry: 1.0820 - 1.0830\n🔴 SL: 1.0780\n🎯 TP1: 1.0880\n🎯 TP2: 1.0940",
        "expected_pair": "EURUSD",
        "expected_direction": "buy",
        "expected_entry": None,  # zone entry
    },
    # 13. AUDUSD sell with spaced pair letters
    {
        "text": "A U D U S D\nSELL NOW\nEntry: 0.6540\nSL: 0.6580\nTP: 0.6480",
        "expected_pair": "AUDUSD",
        "expected_direction": "sell",
        "expected_entry": 0.6540,
    },
    # 14. XAUUSD with Take Profit keyword
    {
        "text": "GOLD BUY\nEntry: 2350\nStop: 2335\nTake Profit 1: 2365\nTake Profit 2: 2380",
        "expected_pair": "XAUUSD",
        "expected_direction": "buy",
        "expected_entry": 2350.0,
    },
    # 15. USDCAD sell — CAD pair
    {
        "text": "SELL USDCAD\nE.P: 1.3650\nSL: 1.3700\nTP1: 1.3580\nTP2: 1.3500",
        "expected_pair": "USDCAD",
        "expected_direction": "sell",
        "expected_entry": 1.3650,
    },
    # 16. US30 index buy
    {
        "text": "🇺🇸 BUY US30\nEntry 38500\nSL 38000\nTP1 39000\nTP2 39500",
        "expected_pair": "US30",
        "expected_direction": "buy",
        "expected_entry": 38500.0,
    },
    # 17. BTCUSD sell — crypto short
    {
        "text": "SHORT BITCOIN\nEntry: 68500\nStop Loss: 70000\nTP1: 65000\nTP2: 62000\nTP3: 58000",
        "expected_pair": "BTCUSD",
        "expected_direction": "sell",
        "expected_entry": 68500.0,
    },
    # 18. EURGBP buy limit — cross pair
    {
        "text": "BUY LIMIT EURGBP @ 0.8520\nSL 0.8490\nTP 0.8580",
        "expected_pair": "EURGBP",
        "expected_direction": "buy",
        "expected_entry": 0.8520,
    },
    # 19. GBPUSD long — LONG keyword
    {
        "text": "GBPUSD LONG\nEntry 1.2680\nSL 1.2620\nTP1 1.2760\nTP2 1.2840",
        "expected_pair": "GBPUSD",
        "expected_direction": "buy",
        "expected_entry": 1.2680,
    },
    # 20. NZDUSD sell — TP as TG alias
    {
        "text": "NZDUSD SELL\nEntry: 0.6080\nSL: 0.6120\nTG1: 0.6020\nTG2: 0.5960",
        "expected_pair": "NZDUSD",
        "expected_direction": "sell",
        "expected_entry": 0.6080,
    },
    # 21. SPX500 buy — index
    {
        "text": "SPX500 BUY\nEntry 5280\nStop Loss 5200\nTP1 5380\nTP2 5450",
        "expected_pair": "SPX500",
        "expected_direction": "buy",
        "expected_entry": 5280.0,
    },
    # 22. XAUUSD sell — channel-style with dividers
    {
        "text": "===================\nXAUUSD SELL\n===================\nEntry: 2365\nSL: 2378\nTP1: 2348\nTP2: 2330\nTP3: 2310",
        "expected_pair": "XAUUSD",
        "expected_direction": "sell",
        "expected_entry": 2365.0,
    },
    # 23. AUDJPY buy — exotic cross
    {
        "text": "🟢 BUY AUDJPY\nEntry 99.50\nSL 98.80\nTP1 100.50\nTP2 101.20",
        "expected_pair": "AUDJPY",
        "expected_direction": "buy",
        "expected_entry": 99.50,
    },
    # 24. USOIL sell
    {
        "text": "SELL USOIL\nEntry: 79.00\nSL: 80.50\nTP1: 77.00\nTP2: 75.50",
        "expected_pair": "USOIL",
        "expected_direction": "sell",
        "expected_entry": 79.00,
    },
    # 25. BTCUSD buy stop
    {
        "text": "BUY STOP BTCUSD 69500\nSL: 68000\nTP1: 72000\nTP2: 75000",
        "expected_pair": "BTCUSD",
        "expected_direction": "buy",
        "expected_entry": 69500.0,
    },
]
