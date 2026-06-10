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
                watch_config TEXT DEFAULT '{"extractors": ["signal", "sentiment", "mention"]}',
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

        await db.execute("""
            CREATE TABLE IF NOT EXISTS message_templates (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                body TEXT NOT NULL DEFAULT '',
                parse_mode TEXT DEFAULT 'HTML',
                media_id TEXT,
                media_url TEXT,
                created_at REAL,
                updated_at REAL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS media_assets (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                kind TEXT NOT NULL,
                filename TEXT,
                mime TEXT,
                size_bytes INTEGER,
                path TEXT NOT NULL,
                telegram_file_id TEXT,
                created_at REAL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS automation_rules (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                is_enabled INTEGER DEFAULT 1,
                graph_json TEXT NOT NULL,
                compiled_json TEXT NOT NULL,
                trigger_type TEXT NOT NULL,
                rate_limit_per_min INTEGER DEFAULT 10,
                last_fired_at REAL,
                created_at REAL,
                updated_at REAL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS rule_executions (
                id TEXT PRIMARY KEY,
                rule_id TEXT NOT NULL,
                event_id TEXT,
                event_type TEXT,
                status TEXT NOT NULL,
                detail TEXT,
                duration_ms REAL,
                created_at REAL,
                FOREIGN KEY (rule_id) REFERENCES automation_rules(id)
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS webhook_tokens (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                token TEXT UNIQUE NOT NULL,
                is_active INTEGER DEFAULT 1,
                last_used_at REAL,
                created_at REAL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS sent_messages (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                rule_id TEXT,
                chat_id TEXT NOT NULL,
                telegram_message_id INTEGER,
                template_id TEXT,
                kind TEXT,
                created_at REAL
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS channel_messages (
                id TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                message_id INTEGER NOT NULL,
                sender_name TEXT,
                text TEXT,
                has_media INTEGER DEFAULT 0,
                media_type TEXT,
                posted_at REAL,
                is_self_sent INTEGER DEFAULT 0,
                UNIQUE(channel_id, message_id),
                FOREIGN KEY (channel_id) REFERENCES channels(id)
            )
        """)

        # Indexes for FK lookups and range queries
        await db.executescript("""
            CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);
            CREATE INDEX IF NOT EXISTS idx_signals_channel_id ON signals(channel_id);
            CREATE INDEX IF NOT EXISTS idx_signals_posted_at ON signals(posted_at DESC);
            CREATE INDEX IF NOT EXISTS idx_signals_pair ON signals(pair);
            CREATE INDEX IF NOT EXISTS idx_outcomes_signal_id ON outcomes(signal_id);
            CREATE INDEX IF NOT EXISTS idx_channel_scores_channel_id ON channel_scores(channel_id);
            CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
            CREATE INDEX IF NOT EXISTS idx_templates_user ON message_templates(user_id);
            CREATE INDEX IF NOT EXISTS idx_media_user ON media_assets(user_id);
            CREATE INDEX IF NOT EXISTS idx_rules_user ON automation_rules(user_id);
            CREATE INDEX IF NOT EXISTS idx_rules_trigger ON automation_rules(trigger_type, is_enabled);
            CREATE INDEX IF NOT EXISTS idx_exec_rule ON rule_executions(rule_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_exec_created ON rule_executions(created_at DESC);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_sent_chat_msg ON sent_messages(chat_id, telegram_message_id);
            CREATE INDEX IF NOT EXISTS idx_chmsg_channel ON channel_messages(channel_id, posted_at DESC);
        """)

        await db.commit()

        # Incremental migrations — safe to run on existing databases
        await _add_column_if_missing(db, "channels", "watch_config",
                                     "TEXT DEFAULT '{\"extractors\": [\"signal\", \"sentiment\", \"mention\"]}'")


async def _add_column_if_missing(db, table: str, column: str, column_def: str):
    """Add a column to an existing table if it does not already exist."""
    async with db.execute(f"PRAGMA table_info({table})") as cursor:
        cols = [row[1] for row in await cursor.fetchall()]
    if column not in cols:
        await db.execute(f"ALTER TABLE {table} ADD COLUMN {column} {column_def}")
        await db.commit()
