import asyncio
import json
from contextlib import asynccontextmanager
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api import router
from app.core.config import settings
from app.core.database import async_session, engine
from app.core.security import get_current_token
from app.models import Base, SettingsSingleton
from app.services.fetch import FetchService

scheduler = AsyncIOScheduler()


async def auto_refresh_job():
    await FetchService.fetch_expires()


async def init_scheduler():
    async with async_session() as session:
        result = await session.execute(select(SettingsSingleton))
        row = result.scalar_one_or_none()
        interval = row.auto_refresh_interval if row and row.auto_refresh_interval else 30
    scheduler.add_job(auto_refresh_job, "interval", minutes=interval, id="auto_refresh")
    scheduler.start()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await init_scheduler()
    yield
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
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.rosser_host, port=settings.rosser_port)
