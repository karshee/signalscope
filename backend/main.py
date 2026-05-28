from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db.migrations import run_migrations
from backend.routers import auth, channels, signals, scores, settings, admin
from backend.ws.feed import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_migrations()
    yield


app = FastAPI(title="SignalScope API", lifespan=lifespan)

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
