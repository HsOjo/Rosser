import asyncio
import json
import os
import platform
from contextlib import asynccontextmanager
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.core.config import settings
from app.core.database import engine
from app.core.http import load_proxy_from_db
from app.core.security import get_current_token
from app.models import Base
from app.services.fetch import FetchService

scheduler = AsyncIOScheduler()


def is_process_alive(pid: int) -> bool:
    """Check whether a process with the given PID is still running."""
    if platform.system() == "Windows":
        import ctypes

        kernel32 = ctypes.windll.kernel32
        SYNCHRONIZE = 0x00100000
        handle = kernel32.OpenProcess(SYNCHRONIZE, False, pid)
        if not handle:
            return False
        kernel32.CloseHandle(handle)
        return True
    else:
        try:
            os.kill(pid, 0)
            return True
        except ProcessLookupError:
            return False
        except PermissionError:
            return True


async def monitor_parent(parent_pid: int):
    """Exit the process if the parent process dies."""
    while True:
        await asyncio.sleep(5)
        if not is_process_alive(parent_pid):
            print(f"Parent process {parent_pid} died, exiting")
            os._exit(1)


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
    await load_proxy_from_db()
    await init_scheduler()
    yield
    if monitor_task:
        monitor_task.cancel()
    scheduler.shutdown()


app = FastAPI(
    title="Rosser",
    version="0.1.0",
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
