from backend.db.database import get_db


async def run_migrations():
    """Create all tables if they don't exist."""
    async with get_db() as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                password_hash TEXT NOT NULL,
                plan TEXT DEFAULT 'free',
                created_at REAL,
                last_login REAL
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS channels (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                username TEXT,
                title TEXT NOT NULL,
                telegram_id INTEGER,
                added_at REAL,
                is_active INTEGER DEFAULT 1,
                avatar_url TEXT,
                subscriber_count INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS signals (
                id TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                message_id INTEGER,
                raw_text TEXT,
                posted_at REAL,
                pair TEXT,
                direction TEXT,
                entry_price REAL,
                entry_range_lo REAL,
                entry_range_hi REAL,
                stop_loss REAL,
                tp1 REAL, tp2 REAL, tp3 REAL,
                signal_type TEXT DEFAULT 'market',
                parse_confidence REAL,
                parse_warnings TEXT,
                is_edit INTEGER DEFAULT 0,
                edit_count INTEGER DEFAULT 0,
                FOREIGN KEY (channel_id) REFERENCES channels(id)
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS outcomes (
                id TEXT PRIMARY KEY,
                signal_id TEXT UNIQUE,
                status TEXT DEFAULT 'pending_entry',
                entry_hit INTEGER DEFAULT 0,
                entry_hit_at REAL,
                entry_price_actual REAL,
                tp1_hit INTEGER DEFAULT 0,
                tp2_hit INTEGER DEFAULT 0,
                tp3_hit INTEGER DEFAULT 0,
                sl_hit INTEGER DEFAULT 0,
                close_price REAL,
                pips_result REAL,
                rr_result REAL,
                slippage_pips REAL,
                entry_missed INTEGER DEFAULT 0,
                resolved_at REAL,
                FOREIGN KEY (signal_id) REFERENCES signals(id)
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS channel_scores (
                channel_id TEXT,
                window TEXT,
                computed_at REAL,
                win_rate REAL,
                avg_rr REAL,
                entry_accuracy REAL,
                missed_entry_rate REAL,
                edit_rate REAL,
                signal_count INTEGER,
                quality_score REAL,
                quality_tier TEXT,
                metrics_json TEXT,
                PRIMARY KEY (channel_id, window)
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id TEXT,
                key TEXT,
                value TEXT,
                PRIMARY KEY (user_id, key)
            )
        """)

        await db.commit()
