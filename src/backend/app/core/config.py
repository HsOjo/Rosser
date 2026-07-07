import os
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    rosser_token: str = "dev-token-change-me"
    rosser_host: str = "127.0.0.1"
    rosser_port: int = 8000
    rosser_db_url: str = ""
    rosser_data_dir: str = ""
    rosser_storage_dir: str = ""
    rosser_cors_origins: str = ""

    @property
    def db_url(self) -> str:
        if self.rosser_db_url:
            return self.rosser_db_url
        data_dir = Path(self.data_dir)
        data_dir.mkdir(parents=True, exist_ok=True)
        return f"sqlite+aiosqlite:///{data_dir}/rosser.db"

    @property
    def data_dir(self) -> Path:
        if self.rosser_data_dir:
            return Path(self.rosser_data_dir)
        path = Path.home() / ".rosser" / "data"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def storage_dir(self) -> Path:
        if self.rosser_storage_dir:
            return Path(self.rosser_storage_dir)
        path = Path.home() / ".rosser" / "storage"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def cors_origins(self) -> List[str]:
        if not self.rosser_cors_origins:
            return [
                "http://localhost",
                "http://localhost:1420",
                "http://localhost:5173",
                "http://127.0.0.1",
                "http://127.0.0.1:1420",
                "http://127.0.0.1:5173",
                "tauri://localhost",
            ]
        return [o.strip() for o in self.rosser_cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_prefix = ""
        case_sensitive = False


settings = Settings()
