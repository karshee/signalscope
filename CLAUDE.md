# Tapwire

Telegram channel management + automation platform: chat workspace for channels, message templates (text + GIF), and a visual Trigger→Condition→Action rule builder that posts via each user's own bot.

## Dev

```bash
# Backend
pip install -r requirements.txt
python run.py  # starts on :8000 (API + built SPA)

# Frontend
cd ui && npm install && npm run dev  # starts on :3000

# Tests
python3 -m pytest
```

## Architecture

- Backend: FastAPI + SQLite WAL (aiosqlite), single process serves API + built SPA
- Auth: JWT (python-jose) + bcrypt; user secrets Fernet-encrypted
- Watcher: Telethon async polling — the READ credential (server env: TELEGRAM_API_ID/HASH/SESSION)
- Parser: extractor registry (signals/keywords) from message text
- Tracker: APScheduler, TP/SL detection vs live prices (yfinance/ccxt)
- Engine (engine/): asyncio EventBus → RuleRunner; events: message.received, outcome.event, schedule.tick, webhook.received; posts via Telegram Bot API with per-user bot token — the WRITE credential
- Rules: stored as React Flow graph JSON + server-compiled execution tree (compile-at-save, per-node validation)
- Loop protection: sent_messages self-sent skip, per-rule rate limit with auto-disable, LRU event dedup
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS + React Flow
- Prod: docker-compose.prod.yml (multi-stage build, nginx :80 with WS upgrade); infra/ has AWS Terraform (defined, NOT deployed)

Docs: docs/architecture.md, docs/rule-engine.md, docs/setup-telegram.md, docs/webhooks.md

## Shipping changes

Use the `/ship-pr` skill to commit, branch, and open a PR against `main` — never commit
directly to it. `karshee` reviews.

## No CI/CD pipeline

There is no `.github/workflows/` in this repo — no automated tests, build, or deploy on
push or PR. What runs on this box (`:8000` API+SPA, `:3000` dev frontend) is started by
hand under the `signalscope` systemd unit. `infra/` holds Terraform for an AWS deployment
that is defined but not applied.
