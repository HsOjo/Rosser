import asyncio
import hashlib
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin, urlparse
from uuid import uuid4

import feedparser
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import async_session
from app.core.http import create_client
from app.models import (
    Article,
    ArticleAttachment,
    ArticleState,
    File,
    Notification,
    SettingsSingleton,
    Site,
    Subscription,
    Task,
)
from app.services.file import FileService

FETCH_TIMEOUT = 30.0
MAX_CONCURRENT_FETCHES = 5
USER_AGENT = "Rosser/1.0 (+https://github.com/rosser/rosser)"


class FetchService:
    _semaphore = asyncio.Semaphore(MAX_CONCURRENT_FETCHES)
    _on_new_articles: list[callable] = []
    _on_subscription_fetch: list[callable] = []

    @classmethod
    def on_new_articles(cls, callback: callable):
        cls._on_new_articles.append(callback)

    @classmethod
    def on_subscription_fetch(cls, callback: callable):
        cls._on_subscription_fetch.append(callback)

    @classmethod
    async def _notify_new_articles(cls, subscription_id: str, count: int):
        for callback in cls._on_new_articles:
            try:
                await callback(subscription_id, count)
            except Exception:
                pass

    @classmethod
    async def _notify_subscription_fetch(cls, subscription_id: str, added: int, error: str | None = None):
        for callback in cls._on_subscription_fetch:
            try:
                await callback(subscription_id, added, error)
            except Exception:
                pass

    @classmethod
    async def preview(cls, url: str) -> dict[str, str | None]:
        async with create_client(timeout=FETCH_TIMEOUT) as client:
            try:
                resp = await client.get(url, headers={"User-Agent": USER_AGENT})
                resp.raise_for_status()
                parsed = feedparser.parse(resp.content)
                feed = parsed.get("feed", {})
                return {
                    "title": feed.get("title") or None,
                    "description": feed.get("description") or feed.get("subtitle") or None,
                }
            except Exception:
                return {"title": None, "description": None}

    @classmethod
    async def fetch_subscription(cls, subscription_id: str, task_id: str | None = None) -> dict[str, Any]:
        async with async_session() as session:
            sub = await session.get(Subscription, subscription_id)
            if not sub:
                return {"added": 0, "error": "Subscription not found"}

            try:
                articles = await cls._fetch_feed(session, sub)
                await session.commit()

                if articles:
                    notif = Notification(
                        type="articles.new",
                        params={"subscription_id": sub.id, "count": len(articles)},
                        subscription_id=sub.id,
                    )
                    session.add(notif)
                    await session.commit()
                    await cls._notify_new_articles(sub.id, len(articles))

                sub.fetch_time = datetime.now(timezone.utc).isoformat()
                await session.commit()
                await cls._notify_subscription_fetch(sub.id, len(articles))

                return {"added": len(articles), "error": None}
            except Exception as e:
                await cls._notify_subscription_fetch(subscription_id, 0, error=str(e))
                return {"added": 0, "error": str(e)}

    @classmethod
    async def fetch_all(cls, task_id: str | None = None) -> dict[str, Any]:
        async with async_session() as session:
            result = await session.execute(select(Subscription))
            subs = result.scalars().all()

        results = await asyncio.gather(
            *(cls.fetch_subscription(sub.id, task_id=task_id) for sub in subs),
            return_exceptions=True,
        )

        total_added = 0
        errors = []
        for sub, res in zip(subs, results):
            if isinstance(res, Exception):
                errors.append(f"{sub.title}: {res}")
                continue
            total_added += res["added"]
            if res["error"]:
                errors.append(f"{sub.title}: {res['error']}")

        return {"added": total_added, "errors": errors}

    @classmethod
    async def fetch_expires(cls, task_id: str | None = None) -> dict[str, Any]:
        # Fetch subscriptions whose last fetch_time is older than auto_refresh_interval minutes.
        # This method is called every minute by the scheduler; each subscription is evaluated
        # independently based on its own fetch_time.
        async with async_session() as session:
            settings_row = await session.execute(select(SettingsSingleton))
            settings_row = settings_row.scalar_one_or_none()
            interval = (settings_row.auto_refresh_interval or 30) if settings_row else 30

            result = await session.execute(select(Subscription))
            subs = result.scalars().all()

        now = time.time()
        to_fetch = []
        for sub in subs:
            if not sub.fetch_time:
                to_fetch.append(sub)
            else:
                try:
                    ft = datetime.fromisoformat(sub.fetch_time).timestamp()
                    if (now - ft) / 60 >= interval:
                        to_fetch.append(sub)
                except Exception:
                    to_fetch.append(sub)

        results = await asyncio.gather(
            *(cls.fetch_subscription(sub.id, task_id=task_id) for sub in to_fetch),
            return_exceptions=True,
        )

        total_added = 0
        errors = []
        for sub, res in zip(to_fetch, results):
            if isinstance(res, Exception):
                errors.append(f"{sub.title}: {res}")
                continue
            total_added += res["added"]
            if res["error"]:
                errors.append(f"{sub.title}: {res['error']}")

        return {"added": total_added, "errors": errors}

    @classmethod
    async def _fetch_feed(cls, session, sub: Subscription) -> list[Article]:
        async with cls._semaphore:
            async with create_client(timeout=FETCH_TIMEOUT) as client:
                resp = await client.get(sub.url, headers={"User-Agent": USER_AGENT})
                resp.raise_for_status()
                parsed = feedparser.parse(resp.content)

        entries = parsed.get("entries", [])
        new_articles: list[Article] = []

        for entry in entries:
            entry_id = entry.get("id", "")
            link = entry.get("link", "")
            hash_val = hashlib.md5((entry_id or link).encode()).hexdigest()

            existing = await session.execute(
                select(Article).where(
                    Article.subscription_id == sub.id, Article.hash == hash_val
                )
            )
            if existing.scalar_one_or_none():
                continue

            title = entry.get("title", "Untitled")
            summary = entry.get("summary", entry.get("description", ""))

            # Extract Atom content as structured list of {type, value}
            content_items: list[dict[str, str]] = []
            raw_content = entry.get("content")
            if raw_content and isinstance(raw_content, list):
                for c in raw_content:
                    if isinstance(c, dict):
                        item_type = c.get("type", "text/plain")
                        item_value = c.get("value", "")
                        if item_value:
                            content_items.append({"type": item_type, "value": item_value})

            author = entry.get("author") or None

            publish_time = None
            if entry.get("published_parsed"):
                try:
                    dt = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                    publish_time = dt.isoformat()
                except Exception:
                    pass

            # Localize images in summary and each content item
            summary, summary_file_ids = await FileService.localize_images(session, summary, client=None)
            all_file_ids = list(summary_file_ids)
            for item in content_items:
                localized, file_ids = await FileService.localize_images(session, item["value"], client=None)
                item["value"] = localized
                all_file_ids.extend(file_ids)
            file_ids = list(dict.fromkeys(all_file_ids))

            article = Article(
                subscription_id=sub.id,
                hash=hash_val,
                title=title,
                summary=summary or None,
                content=content_items or None,
                author=author,
                link=link,
                publish_time=publish_time,
                meta={k: v for k, v in entry.items() if k not in {"title", "summary", "description", "link", "id", "published_parsed", "author", "content"}},
            )
            session.add(article)
            await session.flush()

            article_state = ArticleState(article_id=article.id)
            session.add(article_state)

            for file_id in file_ids:
                att = ArticleAttachment(article_id=article.id, file_type="image", file_id=file_id)
                session.add(att)

            new_articles.append(article)

        return new_articles
