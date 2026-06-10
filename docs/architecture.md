# Architecture

Single Python process (FastAPI + uvicorn, started by `run.py`) serving the JSON API, WebSocket updates, and the built React SPA. SQLite (WAL mode, aiosqlite) is the only datastore. In production an nginx container fronts the process for port 80 + WebSocket upgrade (`docker-compose.prod.yml`).

## Module map

| Module | Role |
|---|---|
| `backend/` | FastAPI app: routers (`/api/*`), JWT auth, aiosqlite layer, WebSocket manager, Fernet crypto for stored secrets |
| `watcher/` | Telethon (MTProto user session) — polls each watched channel every `WATCHER_POLL_INTERVAL` (5s default). Server-level READ credential |
| `parser/` | Extractor registry — pulls signals/keywords out of raw message text |
| `tracker/` | APScheduler job (every 5 min) — checks open signals against live prices (yfinance/ccxt), detects TP/SL hits |
| `scorer/` | Channel quality scoring over signal outcomes (win rate, RR, tiers) |
| `engine/` | Automation engine: event bus, rule compiler/runner, condition + action registries, Bot API sender, per-rule cron source |
| `ui/` | React 18 + Vite + TypeScript + Tailwind SPA, React Flow rule editor |

## Event flow

```
 watcher ──── message.received ──┐
 (Telethon poll, 5s)             │
                                 │
 tracker ──── outcome.event ─────┤      ┌─────────────┐      ┌────────────────┐
 (TP/SL detection, 5 min)        ├────▶ │  EventBus   │────▶ │   RuleRunner   │
                                 │      │ (asyncio    │      │ match enabled  │
 scheduler ── schedule.tick ─────┤      │  queue,     │      │ rules by       │
 (one cron job per rule)         │      │  1000 cap,  │      │ (user_id,      │
                                 │      │  drop-on-   │      │  trigger_type) │
 webhook ──── webhook.received ──┘      │  full)      │      └───────┬────────┘
 (POST /api/webhooks/ingest/{token})    └─────────────┘              │
                                                       walk compiled tree:
                                                       conditions gate subtrees,
                                                       actions post via Bot API
                                                                     │
                                              ┌──────────────────────┼──────────────┐
                                              ▼                      ▼              ▼
                                       Telegram Bot API       rule_executions   WebSocket
                                       (user's own token)     (trace + status)  (live UI)
```

Guards applied before any rule fires: self-sent skip (messages the engine itself posted are marked in `sent_messages` and skipped unless the trigger opts in), LRU event dedup (at-most-once per rule+event), and a per-rule sliding-window rate limit (default 10/min) that **auto-disables** the rule when tripped. The bus drops events (with a log) rather than block the watcher/tracker hot paths.

Rules are stored twice: the React Flow graph JSON (what the editor renders) and a server-compiled execution tree (`engine/compiler.py`), compiled at save time with per-node validation (exactly one trigger, no cycles, no orphans, ≤50 nodes).

## Database tables

| Table | One-liner |
|---|---|
| `users` | Accounts: email, bcrypt hash, plan |
| `channels` | Watched/managed Telegram channels per user (`telegram_id`, `username`, watch config) |
| `signals` | Parsed trading signals (pair, direction, entry, SL, TP1–3, parse confidence) |
| `outcomes` | Per-signal lifecycle: entry hit, TP1–3/SL hits, pips/RR result |
| `channel_scores` | Computed quality metrics per channel per window (win rate, RR, tier) |
| `user_settings` | Key/value settings per user — includes the Fernet-encrypted bot token (`telegram.bot_token_enc`) |
| `message_templates` | Reusable post bodies (`{variables}`, parse mode, optional attached media/URL) |
| `media_assets` | Uploaded GIFs/photos: file path, mime, cached Telegram `file_id` |
| `automation_rules` | One row per rule: graph JSON + compiled JSON, `trigger_type`, `rate_limit_per_min`, enabled flag |
| `rule_executions` | One row per rule firing: status, full step trace, duration |
| `webhook_tokens` | Named ingest tokens (the token itself is the credential) |
| `sent_messages` | Ledger of engine-sent messages — powers self-sent loop detection |
| `channel_messages` | Chat workspace message cache per channel |

## Retention / pruning

A daily task (`EngineService.prune`, started from the FastAPI lifespan) enforces:

- `channel_messages` — capped at the most recent **200 per channel**
- `rule_executions` — deleted after **30 days**

Cached rule lists in the runner expire after 30s (or immediately on any rule mutation via `rules_changed`).

## SQLite / scaling

SQLite in WAL mode handles this workload comfortably: one writer process, read-heavy API, event volumes bounded by Telegram polling. Backups are a single-file `sqlite3 .backup` (see `infra/`).

If multi-process workers or >1 app node are ever needed, the scale-up path is Postgres: the DB layer is plain SQL behind `backend/db/database.py`, so the migration is mostly swapping aiosqlite for asyncpg/SQLAlchemy and porting `backend/db/migrations.py`. The in-process EventBus would also need an external queue (e.g. Redis) at that point.
