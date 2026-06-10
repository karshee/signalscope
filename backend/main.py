import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.db.migrations import run_migrations
from backend.routers import (
    auth, channels, signals, scores, settings, admin,
    templates, rules, executions, webhooks, media, messages,
)
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

    from engine.events import Event, EVENT_OUTCOME
    from engine.service import get_engine_service

    async def _broadcast_outcome(payload: dict):
        data = payload.get("data") or {}
        signal_id = data.get("signal_id")
        if not signal_id:
            return
        async with get_db() as db:
            async with db.execute(
                """SELECT c.user_id, c.id AS channel_id, c.title AS channel_title,
                          s.pair, s.direction, s.raw_text
                   FROM signals s
                   JOIN channels c ON s.channel_id = c.id
                   WHERE s.id = ?""",
                (signal_id,),
            ) as cursor:
                row = await cursor.fetchone()
        if not row:
            return
        await manager.send_to_user(row["user_id"], payload)

        # TP/SL hits become automation triggers ("when TP2 hits, post the GIF")
        status = data.get("status") or ""
        if status == "sl_hit":
            outcome, tp_level = "sl_hit", None
        elif status.startswith("tp") and status.endswith("_hit"):
            outcome, tp_level = "tp_hit", int(status[2])
        else:
            return
        get_engine_service().emit(Event(
            type=EVENT_OUTCOME,
            user_id=row["user_id"],
            channel_id=row["channel_id"],
            data={
                "signal_id": signal_id,
                "outcome": outcome,
                "tp_level": tp_level,
                "pair": row["pair"],
                "direction": row["direction"],
                "pips": data.get("pips_result"),
                "rr": data.get("rr_result"),
                "raw_text": row["raw_text"],
                "channel_title": row["channel_title"],
            },
            meta={"source": "tracker"},
        ))

    engine = get_engine_service()
    await engine.start()

    start_outcome_scheduler(get_db, broadcast_fn=_broadcast_outcome)
    logger.info("Outcome/score scheduler started")

    # Initial pass on startup — catch any signals that arrived while the app was down
    asyncio.create_task(run_outcome_checks(get_db, _broadcast_outcome))
    asyncio.create_task(score_all_channels(get_db))

    async def _daily_prune():
        while True:
            await asyncio.sleep(86400)
            try:
                await engine.prune()
            except Exception as e:
                logger.error(f"Retention prune failed: {e}")

    prune_task = asyncio.create_task(_daily_prune(), name="engine-prune")

    # ── Telegram watcher ───────────────────────────────────────────────────────
    from backend.services.watcher_service import get_watcher_service
    svc = get_watcher_service()
    await svc.start()

    yield

    # ── Shutdown ───────────────────────────────────────────────────────────────
    prune_task.cancel()
    await svc.stop()
    await engine.stop()
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
app.include_router(templates.router)
app.include_router(rules.router)
app.include_router(executions.router)
app.include_router(webhooks.router)
app.include_router(media.router)
app.include_router(messages.router)
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
        # The catch-all would otherwise swallow unmatched API paths (e.g. a
        # missing trailing slash) and return HTML to JSON clients.
        if full_path.startswith(("api/", "ws/")):
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(
            str(_UI_DIST / "index.html"),
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
        )
