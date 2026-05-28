#!/usr/bin/env python3
"""
tapwire CLI — watch any Telegram channel, extract any signal.

Usage:
  tapwire watch @channel --keywords bitcoin,eth
  tapwire watch @channel --extract signals
  tapwire watch @channel --extract all --webhook https://...
  tapwire channels list
  tapwire export --channel @channel --format csv
"""
import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path


def cmd_watch(args):
    """Watch a Telegram channel and extract events."""
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    api_id = os.getenv("TELEGRAM_API_ID")
    api_hash = os.getenv("TELEGRAM_API_HASH")
    session = os.getenv("TELEGRAM_SESSION")

    if not all([api_id, api_hash, session]):
        print("Error: Set TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION in .env")
        print("Run: python -m tapwire.cli.setup to authenticate")
        sys.exit(1)

    from parser.extractor_registry import ExtractorRegistry
    keywords = args.keywords.split(",") if args.keywords else None

    if args.extract == "signals":
        from parser.signal_extractor import SignalExtractor
        registry = ExtractorRegistry()
        registry.register(SignalExtractor())
    elif args.extract == "keywords" and keywords:
        from parser.keyword_extractor import KeywordExtractor
        registry = ExtractorRegistry()
        registry.register(KeywordExtractor(keywords))
    elif args.extract == "sentiment":
        from parser.sentiment_extractor import SentimentExtractor
        registry = ExtractorRegistry()
        registry.register(SentimentExtractor())
    else:
        registry = ExtractorRegistry.default(keywords=keywords)

    print(f"Watching {args.channel}... Press Ctrl+C to stop.\n")

    async def run():
        from watcher.client import TapwireClient
        client = TapwireClient(int(api_id), api_hash, session)
        connected = await client.connect()
        if not connected:
            print("Failed to connect to Telegram")
            sys.exit(1)

        channel = args.channel.lstrip("@")
        last_id = 0

        while True:
            try:
                msgs = await client.fetch_messages(channel, min_id=last_id, limit=20)
                for msg in msgs:
                    if msg.id > last_id:
                        last_id = msg.id
                    text = msg.text or msg.message or ""
                    if not text:
                        continue
                    events = registry.process(text, channel_id=channel, message_id=msg.id)
                    for ev in events:
                        if args.output == "json":
                            print(json.dumps({
                                "extractor": ev.extractor,
                                "event_type": ev.event_type,
                                "confidence": ev.confidence,
                                "data": ev.data,
                                "timestamp": ev.timestamp,
                            }))
                        else:
                            ts = time.strftime("%H:%M:%S", time.localtime(ev.timestamp))
                            print(f"[{ts}] [{ev.extractor.upper()}] {ev.event_type} (conf: {ev.confidence:.0%})")
                            if args.verbose:
                                for k, v in ev.data.items():
                                    if v:
                                        print(f"  {k}: {v}")

                        if args.webhook:
                            import urllib.request
                            payload = json.dumps({"extractor": ev.extractor, "data": ev.data}).encode()
                            try:
                                urllib.request.urlopen(args.webhook, payload, timeout=5)
                            except Exception:
                                pass

                await asyncio.sleep(float(args.interval))
            except KeyboardInterrupt:
                break

        await client.disconnect()

    asyncio.run(run())


def cmd_channels(args):
    """List watched channels from local DB."""
    import sqlite3
    db_path = Path("data/tapwire.db")
    if not db_path.exists():
        print("No local database found. Start the web server first.")
        return
    conn = sqlite3.connect(db_path)
    rows = conn.execute("SELECT title, username, is_active, added_at FROM channels").fetchall()
    if not rows:
        print("No channels configured.")
        return
    print(f"{'Title':<30} {'Username':<20} {'Active':<8}")
    print("-" * 60)
    for title, username, active, added in rows:
        print(f"{(title or ''):<30} {('@' + username if username else ''):<20} {'yes' if active else 'no':<8}")
    conn.close()


def cmd_export(args):
    """Export signals to JSON or CSV."""
    import sqlite3
    db_path = Path("data/tapwire.db")
    if not db_path.exists():
        print("No local database found.")
        return
    conn = sqlite3.connect(db_path)
    since_ts = time.time() - int(args.since.rstrip("d")) * 86400 if args.since else 0
    rows = conn.execute(
        "SELECT id, channel_id, pair, direction, entry_price, stop_loss, tp1, tp2, posted_at "
        "FROM signals WHERE posted_at > ? ORDER BY posted_at DESC",
        (since_ts,)
    ).fetchall()
    cols = ["id", "channel_id", "pair", "direction", "entry_price", "stop_loss", "tp1", "tp2", "posted_at"]

    if args.format == "csv":
        import csv
        writer = csv.writer(sys.stdout)
        writer.writerow(cols)
        for row in rows:
            writer.writerow(row)
    else:
        data = [dict(zip(cols, row)) for row in rows]
        print(json.dumps(data, indent=2))
    conn.close()


def main():
    parser = argparse.ArgumentParser(
        prog="tapwire",
        description="Watch any Telegram channel. Extract any signal.",
    )
    sub = parser.add_subparsers(dest="command")

    # watch
    watch_p = sub.add_parser("watch", help="Watch a channel in real-time")
    watch_p.add_argument("channel", help="Channel username e.g. @cryptonews")
    watch_p.add_argument("--extract", default="all", choices=["all", "signals", "keywords", "sentiment"], help="Which extractor to run")
    watch_p.add_argument("--keywords", help="Comma-separated keywords to watch for")
    watch_p.add_argument("--webhook", help="POST events to this URL")
    watch_p.add_argument("--output", default="text", choices=["text", "json"])
    watch_p.add_argument("--interval", default="5", help="Poll interval in seconds")
    watch_p.add_argument("-v", "--verbose", action="store_true")

    # channels
    ch_p = sub.add_parser("channels", help="Manage watched channels")
    ch_p.add_argument("action", choices=["list"], help="Action to perform")

    # export
    exp_p = sub.add_parser("export", help="Export data")
    exp_p.add_argument("--format", default="json", choices=["json", "csv"])
    exp_p.add_argument("--since", default="30d", help="e.g. 7d, 30d, 90d")

    args = parser.parse_args()

    if args.command == "watch":
        cmd_watch(args)
    elif args.command == "channels":
        cmd_channels(args)
    elif args.command == "export":
        cmd_export(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
