from datetime import datetime
from typing import Annotated, Any

from pydantic import BaseModel, BeforeValidator, ConfigDict, field_serializer


StrOrDatetime = Annotated[
    str,
    BeforeValidator(lambda v: v.isoformat() if isinstance(v, datetime) else v),
]


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    @field_serializer("create_time", "update_time", "publish_time", "fetch_time", check_fields=False)
    def _serialize_datetime(self, value: datetime | str | None) -> str | None:
        if isinstance(value, datetime):
            return value.isoformat()
        return value


class CategoryCreate(BaseSchema):
    title: str
    description: str | None = None


class CategoryUpdate(BaseSchema):
    title: str | None = None
    description: str | None = None


class CategoryOut(BaseSchema):
    id: str
    title: str
    description: str | None = None


class SiteCreate(BaseSchema):
    url: str
    title: str | None = None


class SiteUpdate(BaseSchema):
    url: str | None = None
    title: str | None = None
    concurrency_limit: int | None = None


class SiteOut(BaseSchema):
    id: str
    url: str
    title: str | None = None
    favicon_id: str | None = None
    concurrency_limit: int = 4


class SubscriptionCreate(BaseSchema):
    category_id: str | None = None
    title: str
    description: str | None = None
    url: str
    refresh_interval: int | None = 60


class SubscriptionUpdate(BaseSchema):
    category_id: str | None = None
    title: str | None = None
    description: str | None = None
    url: str | None = None
    refresh_interval: int | None = None


class SubscriptionOut(BaseSchema):
    id: str
    category_id: str | None = None
    site_id: str | None = None
    title: str
    description: str | None = None
    url: str
    fetch_time: str | None = None
    refresh_interval: int = 60


class ArticleContentItem(BaseSchema):
    type: str
    value: str

class ArticleOut(BaseSchema):
    id: str
    subscription_id: str
    hash: str
    title: str
    summary: str | None = None
    content: list[ArticleContentItem] | None = None
    author: str | None = None
    link: str | None = None
    publish_time: StrOrDatetime | None = None
    meta: dict[str, Any] | None = None
    is_read: bool = False
    is_hide: bool = False
    is_star: bool = False
    tags: list["TagOut"] = []


class ArticleListItem(BaseSchema):
    id: str
    subscription_id: str
    hash: str
    title: str
    summary: str | None = None
    author: str | None = None
    link: str | None = None
    publish_time: StrOrDatetime | None = None
    is_read: bool = False
    is_hide: bool = False
    is_star: bool = False
    tags: list["TagOut"] = []


class ArticleListParams(BaseSchema):
    subscription_id: str | None = None
    category_id: str | None = None
    site_id: str | None = None
    tag: str | None = None
    is_read: bool | None = None
    is_star: bool | None = None
    is_hide: bool | None = None
    search: str | None = None
    order: str = "publish_time desc"
    page: int = 1
    size: int = 20


class PaginatedArticles(BaseSchema):
    items: list[ArticleListItem]
    total: int
    page: int
    size: int


class ArticleIds(BaseSchema):
    ids: list[str]


class TagCreate(BaseSchema):
    title: str
    color: str | None = None


class TagUpdate(BaseSchema):
    title: str | None = None
    color: str | None = None


class TagOut(BaseSchema):
    id: str
    title: str
    color: str | None = None


class FileOut(BaseSchema):
    id: str
    hash: str
    extension: str | None = None
    url: str
    stored: bool = False


class NotificationOut(BaseSchema):
    id: str
    type: str
    params: dict[str, Any] | None = None
    is_read: bool = False
    subscription_id: str | None = None
    subscription_title: str | None = None
    create_time: StrOrDatetime


class ProxySettings(BaseSchema):
    enabled: bool = False
    url: str | None = None


class SettingsOut(BaseSchema):
    proxy: ProxySettings = ProxySettings()


class SettingsUpdate(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    proxy: ProxySettings | None = None


class TaskOut(BaseSchema):
    id: str
    task_id: str
    name: str
    status: str
    progress: int
    result: str | None = None
    error: str | None = None


class PreviewRequest(BaseSchema):
    url: str


class PreviewResponse(BaseSchema):
    title: str | None = None
    description: str | None = None


class FetchRequest(BaseSchema):
    ids: list[str]


class HealthOut(BaseSchema):
    status: str
    version: str


class UpdateAsset(BaseSchema):
    name: str
    url: str


class UpdateCheckOut(BaseSchema):
    current: str
    latest: str
    have_new: bool
    name: str
    tag_name: str
    published_at: str
    html_url: str
    body: str
    download_url: str | None = None
    assets: list[UpdateAsset] = []


class TokenValidateOut(BaseSchema):
    valid: bool


class ArticleTagRequest(BaseSchema):
    tag_ids: list[str]
