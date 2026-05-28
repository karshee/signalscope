"""Parser unit tests."""
import pytest
from parser.signal_parser import parse_telegram_signal


def test_gold_buy_signal():
    r = parse_telegram_signal("🟢 BUY GOLD\nEntry: 2341.50\nSL: 2328\nTP1: 2355\nTP2: 2368")
    assert r.pair == "XAUUSD"
    assert r.direction == "buy"
    assert r.entry_price == 2341.5
    assert r.stop_loss == 2328.0
    assert 2355.0 in r.take_profits
    assert r.signal_type == "market"
    assert r.confidence == 1.0


def test_eurusd_sell():
    r = parse_telegram_signal("SELL EURUSD @ 1.0850\nSL 1.0880\nTP 1.0800")
    assert r.pair == "EURUSD"
    assert r.direction == "sell"
    assert r.entry_price == 1.085


def test_buy_limit():
    r = parse_telegram_signal("Buy Limit XAUUSD 2340\nSL: 2325\nTP1: 2360")
    assert r.pair == "XAUUSD"
    assert r.direction == "buy"
    assert r.order_type == "buy_limit"
    assert r.limit_price == 2340.0
    assert r.signal_type == "pending"


def test_btcusd_entry_zone():
    r = parse_telegram_signal(
        "BTCUSD LONG\nEntry Zone: 67000 - 67500\nSL: 65000\nTP1: 70000\nTP2: 72000"
    )
    assert r.pair == "BTCUSD"
    assert r.direction == "buy"
    assert r.entry_range is not None
    assert r.stop_loss == 65000.0


def test_cancel_signal():
    r = parse_telegram_signal("Cancel the XAUUSD order — no longer valid")
    assert r.signal_type == "cancel"


def test_modify_sl():
    r = parse_telegram_signal("Move SL to break even on EURUSD trade")
    assert r.signal_type == "update"


def test_multiple_tps():
    r = parse_telegram_signal(
        "SELL GBPUSD\nEntry: 1.2650\nSL: 1.2700\nTP1: 1.2600\nTP2: 1.2550\nTP3: 1.2500"
    )
    assert r.pair == "GBPUSD"
    assert len(r.take_profits) == 3
    assert 1.2600 in r.take_profits
    assert 1.2500 in r.take_profits


def test_nas100():
    r = parse_telegram_signal("NAS100 BUY\nEntry: 19800\nSL: 19600\nTP: 20200")
    assert r.pair == "NAS100"
    assert r.direction == "buy"


def test_xagusd_silver():
    r = parse_telegram_signal("SILVER SELL\nEntry 32.50\nSL 33.00\nTP 31.50")
    assert r.pair == "XAGUSD"
    assert r.direction == "sell"


def test_no_pair_returns_note():
    r = parse_telegram_signal("Great trading week everyone! Up 5% this month.")
    assert r.signal_type == "note"


def test_confidence_increases_with_fields():
    low = parse_telegram_signal("BUY something")
    high = parse_telegram_signal("BUY XAUUSD @ 2341\nSL: 2320\nTP1: 2360")
    assert high.confidence > low.confidence


def test_all_fixtures():
    from parser.fixtures.test_signals import TEST_SIGNALS
    for i, sig in enumerate(TEST_SIGNALS):
        r = parse_telegram_signal(sig["text"])
        if "expected_pair" in sig and sig["expected_pair"]:
            assert r.pair == sig["expected_pair"], f"Fixture {i}: pair {r.pair!r} != {sig['expected_pair']!r}"
        if "expected_direction" in sig and sig["expected_direction"]:
            assert r.direction == sig["expected_direction"], f"Fixture {i}: dir {r.direction!r} != {sig['expected_direction']!r}"
