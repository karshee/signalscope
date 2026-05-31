import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.db.migrations import run_migrations
from backend.routers import auth, channels, signals, scores, settings, admin
from backend.ws.feed import router as ws_router

_UI_DIST = Path(__file__).parent.parent / "ui" / "dist"

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s %(name)-24s %(levelname)-8s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_migrations()
    logger.info("DB migrations OK")

    # ── Outcome + score scheduler ──────────────────────────────────────────────
    from backend.db.database import get_db
    from backend.ws.manager import manager
    from tracker.scheduler import start_outcome_scheduler, stop_outcome_scheduler
    from tracker.outcome_engine import run_outcome_checks
    from scorer.channel_scorer import score_all_channels

    async def _broadcast_outcome(payload: dict):
        signal_id = (payload.get("data") or {}).get("signal_id")
        if not signal_id:
            return
        async with get_db() as db:
            async with db.execute(
                """SELECT c.user_id FROM signals s
                   JOIN channels c ON s.channel_id = c.id
                   WHERE s.id = ?""",
                (signal_id,),
            ) as cursor:
                row = await cursor.fetchone()
        if row:
            await manager.send_to_user(row["user_id"], payload)

    start_outcome_scheduler(get_db, broadcast_fn=_broadcast_outcome)
    logger.info("Outcome/score scheduler started")

    # Initial pass on startup — catch any signals that arrived while the app was down
    asyncio.create_task(run_outcome_checks(get_db, _broadcast_outcome))
    asyncio.create_task(score_all_channels(get_db))

    # ── Telegram watcher ───────────────────────────────────────────────────────
    from backend.services.watcher_service import get_watcher_service
    svc = get_watcher_service()
    await svc.start()

    yield

    # ── Shutdown ───────────────────────────────────────────────────────────────
    await svc.stop()
    stop_outcome_scheduler()
    logger.info("Shutdown complete")


app = FastAPI(title="Tapwire API", lifespan=lifespan)

_allowed_origins = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:8100,http://localhost:3000"
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(channels.router)
app.include_router(signals.router)
app.include_router(scores.router)
app.include_router(settings.router)
app.include_router(admin.router)
app.include_router(ws_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Serve built frontend — mount assets, catch-all for React Router
if _UI_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(_UI_DIST / "assets")), name="assets")

    @app.get("/favicon.svg")
    async def favicon():
        return FileResponse(str(_UI_DIST / "favicon.svg"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str, request: Request):
        return FileResponse(
            str(_UI_DIST / "index.html"),
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
        )
