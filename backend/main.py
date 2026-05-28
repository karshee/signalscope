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


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_migrations()
    yield


app = FastAPI(title="Tapwire API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


# Serve built frontend — mount assets, catch-all serves index.html for React Router
if _UI_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(_UI_DIST / "assets")), name="assets")

    @app.get("/favicon.svg")
    async def favicon():
        return FileResponse(str(_UI_DIST / "favicon.svg"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str, request: Request):
        return FileResponse(str(_UI_DIST / "index.html"))
