import asyncio
import json
import logging
import os
import sys
from contextlib import asynccontextmanager
from typing import Any

# PyInstaller with console=False on Windows sets sys.stdout/stderr to None;
# uvicorn's DefaultFormatter calls sys.stdout.isatty() and crashes without this.
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

from app.api import router
from app.core.config import settings
from app.core.database import (
    async_session,
    cleanup_orphan_articles,
    cleanup_orphan_article_states,
    cleanup_orphan_notifications,
    cleanup_orphan_subscription_tags,
    engine,
)
from app.core.http import load_proxy_from_db
from app.core.process import monitor_parent
from app.core.security import get_current_token
from app.models import Base
from app.services.fetch import FetchService

scheduler = AsyncIOScheduler()


async def auto_refresh_job():
    await FetchService.fetch_expires()


async def init_scheduler():
    scheduler.add_job(auto_refresh_job, "interval", minutes=1, id="auto_refresh")
    scheduler.start()


async def broadcast_new_articles(subscription_id: str, count: int):
    await manager.broadcast({
        "type": "articles.new",
        "subscription_id": subscription_id,
        "count": count,
    })


async def broadcast_subscription_fetch(subscription_id: str, added: int, error: str | None = None):
    await manager.broadcast({
        "type": "subscription.fetch",
        "subscription_id": subscription_id,
        "added": added,
        "error": error,
    })


FetchService.on_new_articles(broadcast_new_articles)
FetchService.on_subscription_fetch(broadcast_subscription_fetch)


@asynccontextmanager
async def lifespan(app: FastAPI):
    parent_pid = os.environ.get("ROSSER_PARENT_PID")
    monitor_task = None
    if parent_pid:
        try:
            monitor_task = asyncio.create_task(monitor_parent(int(parent_pid)))
        except ValueError:
            pass
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        cleaned = 0
        for cleanup in (
            cleanup_orphan_articles,
            cleanup_orphan_article_states,
            cleanup_orphan_notifications,
            cleanup_orphan_subscription_tags,
        ):
            count = await cleanup(session)
            cleaned += count
            if count:
                logger.warning("Cleaned up %d orphan %s", count, cleanup.__name__)
        await session.commit()
        if cleaned:
            logger.warning("Total orphan records cleaned: %d", cleaned)

    await load_proxy_from_db()
    await init_scheduler()
    yield
    if monitor_task:
        monitor_task.cancel()
    scheduler.shutdown()


app = FastAPI(
    title="Rosser",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active:
            self.active.remove(websocket)

    async def broadcast(self, message: dict[str, Any]):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token or token != settings.rosser_token:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Echo back or handle commands if needed
                await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# Export openapi.json for frontend generation
def run_server() -> None:
    import uvicorn

    reload = os.environ.get("ROSSER_RELOAD", "") in ("1", "true", "yes")
    uvicorn.run(
        "app.main:app" if reload else app,
        host=settings.rosser_host,
        port=settings.rosser_port,
        reload=reload,
    )


if __name__ == "__main__":
    run_server()
