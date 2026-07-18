import asyncio
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import async_session
from app.core.http import load_proxy_from_db, validate_proxy_url
from app.core.security import get_current_token
from app.core.updater import check_update
from app.core.version import APP_VERSION
from app.models import Article, ArticleState, Category, Notification, Setting, Site, Subscription, Tag, Task
from app.schemas import (
    ArticleIds,
    ArticleListItem,
    ArticleOut,
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    FetchRequest,
    HealthOut,
    NotificationOut,
    PaginatedArticles,
    PreviewRequest,
    PreviewResponse,
    ProxySettings,
    SettingsOut,
    SettingsUpdate,
    SiteOut,
    SiteUpdate,
    SubscriptionCreate,
    SubscriptionOut,
    SubscriptionUpdate,
    TagCreate,
    TagOut,
    TagUpdate,
    TaskOut,
    TokenValidateOut,
    UpdateCheckOut,
)
from app.services.fetch import FetchService
from app.services.opml import OPMLService
from app.services.site import SiteService

router = APIRouter()


# --- Categories ---

@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(select(Category))
        return result.scalars().all()


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(data: CategoryCreate, token: str = Depends(get_current_token)):
    async with async_session() as session:
        cat = Category(title=data.title, description=data.description)
        session.add(cat)
        await session.commit()
        await session.refresh(cat)
        return cat


@router.get("/categories/{category_id}", response_model=CategoryOut)
async def get_category(category_id: str, token: str = Depends(get_current_token)):
    async with async_session() as session:
        cat = await session.get(Category, category_id)
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        return cat


@router.put("/categories/{category_id}", response_model=CategoryOut)
async def update_category(category_id: str, data: CategoryUpdate, token: str = Depends(get_current_token)):
    async with async_session() as session:
        cat = await session.get(Category, category_id)
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        if data.title is not None:
            cat.title = data.title
        if data.description is not None:
            cat.description = data.description
        await session.commit()
        await session.refresh(cat)
        return cat


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: str, token: str = Depends(get_current_token)):
    async with async_session() as session:
        cat = await session.get(Category, category_id)
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        await session.delete(cat)
        await session.commit()
        return None


# --- Subscriptions ---

@router.get("/subscriptions", response_model=list[SubscriptionOut])
async def list_subscriptions(token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(select(Subscription))
        return result.scalars().all()


@router.post("/subscriptions", response_model=SubscriptionOut, status_code=status.HTTP_201_CREATED)
async def create_subscription(data: SubscriptionCreate, token: str = Depends(get_current_token)):
    async with async_session() as session:
        site = await SiteService.ensure_site(session, data.url)
        sub = Subscription(
            category_id=data.category_id,
            site_id=site.id,
            title=data.title,
            description=data.description,
            url=data.url,
        )
        session.add(sub)
        await session.commit()
        await session.refresh(sub)
        asyncio.create_task(FetchService.fetch_subscription(sub.id))
        return sub


@router.get("/subscriptions/{subscription_id}", response_model=SubscriptionOut)
async def get_subscription(subscription_id: str, token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(
            select(Subscription).where(Subscription.id == subscription_id)
        )
        sub = result.scalar_one_or_none()
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription not found")
        return sub


@router.put("/subscriptions/{subscription_id}", response_model=SubscriptionOut)
async def update_subscription(subscription_id: str, data: SubscriptionUpdate, token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(
            select(Subscription).where(Subscription.id == subscription_id)
        )
        sub = result.scalar_one_or_none()
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription not found")
        for field in ("category_id", "title", "description", "url", "refresh_interval"):
            val = getattr(data, field, None)
            if val is not None:
                setattr(sub, field, val)
        await session.commit()
        await session.refresh(sub)
        return sub


@router.delete("/subscriptions/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subscription(subscription_id: str, token: str = Depends(get_current_token)):
    async with async_session() as session:
        sub = await session.get(Subscription, subscription_id)
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription not found")
        await session.delete(sub)
        await session.commit()
        return None


@router.post("/subscriptions/preview", response_model=PreviewResponse)
async def preview_subscription(data: PreviewRequest, token: str = Depends(get_current_token)):
    return await FetchService.preview(data.url)


async def _run_fetch_task(task_id: str, subscription_ids: list[str]):
    async with async_session() as session:
        task = await session.execute(select(Task).where(Task.task_id == task_id))
        task = task.scalar_one_or_none()
        if task:
            task.status = "running"
            await session.commit()

    total_added = 0
    errors = []
    try:
        for sid in subscription_ids:
            res = await FetchService.fetch_subscription(sid, task_id=task_id)
            total_added += res.get("added", 0)
            if res.get("error"):
                errors.append(f"{sid}: {res['error']}")

        async with async_session() as session:
            task = await session.execute(select(Task).where(Task.task_id == task_id))
            task = task.scalar_one_or_none()
            if task:
                task.status = "done"
                task.progress = 100
                task.result = f"added {total_added}"
                if errors:
                    task.error = "; ".join(errors)
                await session.commit()
    except Exception as e:
        async with async_session() as session:
            task = await session.execute(select(Task).where(Task.task_id == task_id))
            task = task.scalar_one_or_none()
            if task:
                task.status = "failed"
                task.error = str(e)
                await session.commit()


@router.post("/subscriptions/fetch")
async def fetch_subscriptions(data: FetchRequest, token: str = Depends(get_current_token)):
    task_id = str(uuid4())
    async with async_session() as session:
        task = Task(task_id=task_id, name="fetch_subscriptions", status="ready")
        session.add(task)
        await session.commit()

    asyncio.create_task(_run_fetch_task(task_id, data.ids))
    return {"task_id": task_id}


@router.post("/subscriptions/fetch-all")
async def fetch_all_subscriptions(token: str = Depends(get_current_token)):
    return await FetchService.fetch_all()


@router.post("/subscriptions/fetch-expires")
async def fetch_expires_subscriptions(token: str = Depends(get_current_token)):
    return await FetchService.fetch_expires()


# --- Articles ---

@router.get("/articles", response_model=PaginatedArticles)
async def list_articles(
    subscription_id: str | None = None,
    category_id: str | None = None,
    site_id: str | None = None,
    tag: str | None = None,
    is_read: bool | None = None,
    is_star: bool | None = None,
    is_hide: bool | None = None,
    search: str | None = None,
    order: str = "publish_time desc",
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    token: str = Depends(get_current_token),
):
    async with async_session() as session:
        stmt = select(Article).options(selectinload(Article.state), selectinload(Article.tags))
        count_stmt = select(func.count(Article.id))

        if subscription_id:
            stmt = stmt.where(Article.subscription_id == subscription_id)
            count_stmt = count_stmt.where(Article.subscription_id == subscription_id)
        if category_id:
            sub_ids_result = await session.execute(
                select(Subscription.id).where(Subscription.category_id == category_id)
            )
            sub_ids = list(sub_ids_result.scalars().all())
            stmt = stmt.where(Article.subscription_id.in_(sub_ids))
            count_stmt = count_stmt.where(Article.subscription_id.in_(sub_ids))
        if site_id:
            sub_ids_result = await session.execute(
                select(Subscription.id).where(Subscription.site_id == site_id)
            )
            sub_ids = list(sub_ids_result.scalars().all())
            stmt = stmt.where(Article.subscription_id.in_(sub_ids))
            count_stmt = count_stmt.where(Article.subscription_id.in_(sub_ids))
        if search:
            stmt = stmt.where(
                (Article.title.ilike(f"%{search}%")) | (Article.summary.ilike(f"%{search}%")) | (Article.content.ilike(f"%{search}%")) | (Article.author.ilike(f"%{search}%"))
            )
            count_stmt = count_stmt.where(
                (Article.title.ilike(f"%{search}%")) | (Article.summary.ilike(f"%{search}%")) | (Article.content.ilike(f"%{search}%")) | (Article.author.ilike(f"%{search}%"))
            )
        if tag:
            tag_obj = await session.execute(select(Tag).where(Tag.title == tag))
            tag_obj = tag_obj.scalar_one_or_none()
            if tag_obj:
                stmt = stmt.where(Article.tags.any(Tag.id == tag_obj.id))
                count_stmt = count_stmt.where(Article.tags.any(Tag.id == tag_obj.id))

        need_state_join = is_read is not None or is_star is not None or is_hide is not None
        # Default: exclude hidden articles unless explicitly viewing hidden
        if is_hide is None:
            need_state_join = True

        # Ordering by article_state columns requires the state join as well.
        # Normalize "col_dir" or "col_asc" to "col dir" while preserving
        # underscores inside the column name (e.g. read_time).
        state_order_cols = {"read_time", "update_time", "create_time"}
        order_norm = order
        if " " not in order and "_" in order:
            order_norm = " ".join(order.rsplit("_", 1))
        order_col = order_norm.split()[0] if order_norm else ""
        if order_col in state_order_cols:
            need_state_join = True

        if need_state_join:
            stmt = stmt.join(ArticleState)
            count_stmt = count_stmt.join(ArticleState)
            if is_read is not None:
                stmt = stmt.where(ArticleState.is_read == is_read)
                count_stmt = count_stmt.where(ArticleState.is_read == is_read)
            if is_star is not None:
                stmt = stmt.where(ArticleState.is_star == is_star)
                count_stmt = count_stmt.where(ArticleState.is_star == is_star)
            if is_hide is not None:
                stmt = stmt.where(ArticleState.is_hide == is_hide)
                count_stmt = count_stmt.where(ArticleState.is_hide == is_hide)
            else:
                stmt = stmt.where(ArticleState.is_hide == False)
                count_stmt = count_stmt.where(ArticleState.is_hide == False)

        parts = order_norm.split()
        if len(parts) == 2:
            col_name, direction = parts
            if col_name in state_order_cols:
                col = getattr(ArticleState, col_name, ArticleState.update_time)
            else:
                col = getattr(Article, col_name, Article.publish_time)
            stmt = stmt.order_by(col.desc() if direction == "desc" else col.asc())
        else:
            stmt = stmt.order_by(Article.publish_time.desc())

        total_result = await session.execute(count_stmt)
        total = total_result.scalar() or 0

        stmt = stmt.offset((page - 1) * size).limit(size)
        result = await session.execute(stmt)
        articles = result.scalars().all()

        items = []
        for art in articles:
            state = art.state
            items.append(
                ArticleListItem(
                    id=art.id,
                    subscription_id=art.subscription_id,
                    hash=art.hash,
                    title=art.title,
                    summary=art.summary,
                    author=art.author,
                    link=art.link,
                    publish_time=art.publish_time,
                    is_read=state.is_read if state else False,
                    is_hide=state.is_hide if state else False,
                    is_star=state.is_star if state else False,
                    tags=art.tags,
                )
            )

        return PaginatedArticles(items=items, total=total, page=page, size=size)


@router.get("/articles/{article_id}", response_model=ArticleOut)
async def get_article(article_id: str, token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(
            select(Article)
            .where(Article.id == article_id)
            .options(selectinload(Article.state), selectinload(Article.tags))
        )
        art = result.scalar_one_or_none()
        if not art:
            raise HTTPException(status_code=404, detail="Article not found")
        state = art.state
        return ArticleOut(
            id=art.id,
            subscription_id=art.subscription_id,
            hash=art.hash,
            title=art.title,
            summary=art.summary,
            content=art.content,
            author=art.author,
            link=art.link,
            publish_time=art.publish_time,
            meta=art.meta,
            is_read=state.is_read if state else False,
            is_hide=state.is_hide if state else False,
            is_star=state.is_star if state else False,
            tags=art.tags,
        )


@router.post("/articles/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(data: ArticleIds, token: str = Depends(get_current_token)):
    async with async_session() as session:
        for aid in data.ids:
            result = await session.execute(select(ArticleState).where(ArticleState.article_id == aid))
            state = result.scalar_one_or_none()
            if state:
                state.is_read = True
                state.read_time = datetime.now(timezone.utc)
        await session.commit()
    return None


@router.post("/articles/unread", status_code=status.HTTP_204_NO_CONTENT)
async def mark_unread(data: ArticleIds, token: str = Depends(get_current_token)):
    async with async_session() as session:
        for aid in data.ids:
            result = await session.execute(select(ArticleState).where(ArticleState.article_id == aid))
            state = result.scalar_one_or_none()
            if state:
                state.is_read = False
                state.read_time = None
        await session.commit()
    return None


@router.post("/articles/star", status_code=status.HTTP_204_NO_CONTENT)
async def mark_star(data: ArticleIds, token: str = Depends(get_current_token)):
    async with async_session() as session:
        for aid in data.ids:
            result = await session.execute(select(ArticleState).where(ArticleState.article_id == aid))
            state = result.scalar_one_or_none()
            if state:
                state.is_star = True
        await session.commit()
    return None


@router.post("/articles/unstar", status_code=status.HTTP_204_NO_CONTENT)
async def mark_unstar(data: ArticleIds, token: str = Depends(get_current_token)):
    async with async_session() as session:
        for aid in data.ids:
            result = await session.execute(select(ArticleState).where(ArticleState.article_id == aid))
            state = result.scalar_one_or_none()
            if state:
                state.is_star = False
        await session.commit()
    return None


@router.post("/articles/hide", status_code=status.HTTP_204_NO_CONTENT)
async def mark_hide(data: ArticleIds, token: str = Depends(get_current_token)):
    async with async_session() as session:
        for aid in data.ids:
            result = await session.execute(select(ArticleState).where(ArticleState.article_id == aid))
            state = result.scalar_one_or_none()
            if state:
                state.is_hide = True
        await session.commit()
    return None


@router.post("/articles/unhide", status_code=status.HTTP_204_NO_CONTENT)
async def mark_unhide(data: ArticleIds, token: str = Depends(get_current_token)):
    async with async_session() as session:
        for aid in data.ids:
            result = await session.execute(select(ArticleState).where(ArticleState.article_id == aid))
            state = result.scalar_one_or_none()
            if state:
                state.is_hide = False
        await session.commit()
    return None


@router.post("/articles/read-before-days", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read_before_days(days: int, token: str = Depends(get_current_token)):
    from datetime import timedelta
    async with async_session() as session:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        result = await session.execute(
            select(ArticleState).join(Article).where(
                Article.publish_time < cutoff,
                ArticleState.is_read == False,
            )
        )
        for state in result.scalars().all():
            state.is_read = True
            state.read_time = datetime.now(timezone.utc)
        await session.commit()
    return None


# --- Tags ---

@router.get("/tags", response_model=list[TagOut])
async def list_tags(token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(select(Tag))
        return result.scalars().all()


@router.post("/tags", response_model=TagOut, status_code=status.HTTP_201_CREATED)
async def create_tag(data: TagCreate, token: str = Depends(get_current_token)):
    async with async_session() as session:
        tag = Tag(title=data.title, color=data.color)
        session.add(tag)
        await session.commit()
        await session.refresh(tag)
        return tag


@router.put("/tags/{tag_id}", response_model=TagOut)
async def update_tag(tag_id: str, data: TagUpdate, token: str = Depends(get_current_token)):
    async with async_session() as session:
        tag = await session.get(Tag, tag_id)
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        if data.title is not None:
            tag.title = data.title
        if data.color is not None:
            tag.color = data.color
        await session.commit()
        await session.refresh(tag)
        return tag


@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(tag_id: str, token: str = Depends(get_current_token)):
    async with async_session() as session:
        tag = await session.get(Tag, tag_id)
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        await session.delete(tag)
        await session.commit()
        return None



@router.post("/articles/{article_id}/tags")
async def tag_article(article_id: str, tag_ids: list[str], token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(
            select(Article).options(selectinload(Article.tags)).where(Article.id == article_id)
        )
        art = result.scalar_one_or_none()
        if not art:
            raise HTTPException(status_code=404, detail="Article not found")
        for tid in tag_ids:
            tag = await session.get(Tag, tid)
            if tag and tag not in art.tags:
                art.tags.append(tag)
        await session.commit()
        return {"ok": True}


@router.delete("/articles/{article_id}/tags/{tag_id}")
async def untag_article(article_id: str, tag_id: str, token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(
            select(Article).options(selectinload(Article.tags)).where(Article.id == article_id)
        )
        art = result.scalar_one_or_none()
        if not art:
            raise HTTPException(status_code=404, detail="Article not found")
        art.tags = [t for t in art.tags if t.id != tag_id]
        await session.commit()
        return {"ok": True}


# --- Sites ---

@router.get("/sites", response_model=list[SiteOut])
async def list_sites(token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(select(Site))
        return result.scalars().all()


@router.get("/sites/{site_id}", response_model=SiteOut)
async def get_site(site_id: str, token: str = Depends(get_current_token)):
    async with async_session() as session:
        site = await session.get(Site, site_id)
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        return site


@router.put("/sites/{site_id}", response_model=SiteOut)
async def update_site(site_id: str, data: SiteUpdate, token: str = Depends(get_current_token)):
    async with async_session() as session:
        site = await session.get(Site, site_id)
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        if data.title is not None:
            site.title = data.title
        if data.concurrency_limit is not None:
            site.concurrency_limit = data.concurrency_limit
        await session.commit()
        await session.refresh(site)
        return site


@router.post("/sites/{site_id}/fetch", response_model=SiteOut)
async def fetch_site(site_id: str, token: str = Depends(get_current_token)):
    async with async_session() as session:
        site = await SiteService.fetch_site(session, site_id)
        if not site:
            raise HTTPException(status_code=404, detail="Site not found")
        return site


# --- Files ---

@router.get("/files/{file_id}/download")
async def download_file(file_id: str, exp: int = 0, sig: str = ""):
    from app.core.security import verify_file_url
    from app.services.file import FileService
    from fastapi.responses import FileResponse

    if not verify_file_url(file_id, exp, sig, settings.rosser_token):
        raise HTTPException(status_code=403, detail="Invalid or expired signature")

    async with async_session() as session:
        path = await FileService.download(session, file_id)
        if not path:
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(path)


# --- Notifications ---

@router.get("/notifications", response_model=list[NotificationOut])
async def list_notifications(
    is_read: bool | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    token: str = Depends(get_current_token),
):
    async with async_session() as session:
        stmt = (
            select(Notification, Subscription.title.label("subscription_title"))
            .outerjoin(Subscription, Notification.subscription_id == Subscription.id)
            .order_by(Notification.create_time.desc())
        )
        if is_read is not None:
            stmt = stmt.where(Notification.is_read == is_read)
        stmt = stmt.offset((page - 1) * size).limit(size)
        result = await session.execute(stmt)
        items = []
        for row in result.mappings().all():
            notif = row["Notification"]
            title = row["subscription_title"]
            items.append({
                "id": notif.id,
                "type": notif.type,
                "params": notif.params,
                "is_read": notif.is_read,
                "subscription_id": notif.subscription_id,
                "subscription_title": title,
                "create_time": notif.create_time,
            })
        return items


@router.get("/notifications/unread-count")
async def unread_count(token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(
            select(func.count(Notification.id)).where(Notification.is_read == False)
        )
        return {"count": result.scalar() or 0}


@router.post("/notifications/mark-read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notifications_read(ids: list[str], token: str = Depends(get_current_token)):
    async with async_session() as session:
        for nid in ids:
            notif = await session.get(Notification, nid)
            if notif:
                notif.is_read = True
        await session.commit()
    return None


@router.post("/notifications/mark-all-read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_read(token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(select(Notification).where(Notification.is_read == False))
        for notif in result.scalars().all():
            notif.is_read = True
        await session.commit()
    return None


# --- Settings ---

@router.get("/settings", response_model=SettingsOut)
async def get_settings(token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(select(Setting))
        rows = {row.id: row.value for row in result.scalars().all()}

    proxy = ProxySettings(**(rows.get("proxy") or {}))
    return SettingsOut(proxy=proxy)


@router.put("/settings", response_model=SettingsOut)
async def update_settings(data: SettingsUpdate, token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(select(Setting))
        existing = {row.id: row for row in result.scalars().all()}

        if data.proxy is not None:
            if data.proxy.enabled:
                try:
                    validate_proxy_url(data.proxy.url)
                except ValueError as exc:
                    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
            proxy_value = data.proxy.model_dump()
            if not proxy_value.get("enabled"):
                proxy_value["url"] = None
            if "proxy" in existing:
                existing["proxy"].value = proxy_value
            else:
                session.add(Setting(id="proxy", value=proxy_value))

        await session.commit()

    await load_proxy_from_db()
    return await get_settings(token=token)


# --- Tasks ---

@router.get("/tasks", response_model=list[TaskOut])
async def list_tasks(token: str = Depends(get_current_token)):
    async with async_session() as session:
        result = await session.execute(select(Task).order_by(Task.create_time.desc()))
        return result.scalars().all()


# --- OPML ---

@router.post("/opml/import")
async def import_opml(file: bytes, token: str = Depends(get_current_token)):
    entries = OPMLService.parse(file)
    new_sub_ids: list[str] = []
    async with async_session() as session:
        for entry in entries:
            existing = await session.execute(
                select(Subscription).where(Subscription.url == entry["url"])
            )
            if existing.scalar_one_or_none():
                continue
            cat_id = None
            if entry.get("category"):
                cat = await session.execute(
                    select(Category).where(Category.title == entry["category"])
                )
                cat = cat.scalar_one_or_none()
                if not cat:
                    cat = Category(title=entry["category"])
                    session.add(cat)
                    await session.flush()
                cat_id = cat.id
            site = await SiteService.ensure_site(session, entry["url"])
            sub = Subscription(
                category_id=cat_id,
                site_id=site.id,
                title=entry.get("title") or "Untitled",
                url=entry["url"],
            )
            session.add(sub)
            await session.flush()
            new_sub_ids.append(sub.id)
        await session.commit()

    for sub_id in new_sub_ids:
        asyncio.create_task(FetchService.fetch_subscription(sub_id))

    return {"imported": len(entries)}


@router.get("/opml/export")
async def export_opml(token: str = Depends(get_current_token)):
    async with async_session() as session:
        subs = (await session.execute(select(Subscription))).scalars().all()
        cats = (await session.execute(select(Category))).scalars().all()
        data = OPMLService.export(subs, cats)
    from fastapi.responses import Response
    return Response(content=data, media_type="application/xml", headers={"Content-Disposition": "attachment; filename=rosser.opml"})


# --- Health ---

@router.get("/health", response_model=HealthOut)
async def health():
    return HealthOut(status="ok", version=APP_VERSION)


# --- Update ---

@router.get("/update", response_model=UpdateCheckOut)
async def check_for_update(force: bool = False, token: str = Depends(get_current_token)):
    try:
        release, have_new = await check_update(force=force)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    return UpdateCheckOut(
        current=APP_VERSION,
        latest=release.tag_name,
        have_new=have_new,
        name=release.name,
        tag_name=release.tag_name,
        published_at=release.published_at,
        html_url=release.html_url,
        body=release.body,
        download_url=release.download_url,
        assets=release.assets,
    )


# --- Auth ---

@router.get("/auth/validate", response_model=TokenValidateOut)
async def validate_token(token: str = Depends(get_current_token)):
    return TokenValidateOut(valid=True)
