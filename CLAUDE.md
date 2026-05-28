# Tapwire

Telegram signal intelligence platform.

## Dev

```bash
# Backend
pip install -r requirements.txt
python run.py  # starts on :8000

# Frontend
cd ui && npm install && npm run dev  # starts on :5173
```

## Architecture

- Backend: FastAPI + SQLite (aiosqlite)
- Auth: JWT (python-jose) + bcrypt
- Watcher: Telethon async polling
- Parser: ported from signal-watcher/signal_parse.py
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS
