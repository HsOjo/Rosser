from typing import Optional

from sqlalchemy import Column, JSON, ForeignKey, Integer, String, Table, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "category"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="category", cascade="all, delete-orphan"
    )


class Site(Base):
    __tablename__ = "site"

    url: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    favicon_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("file.id", ondelete="SET NULL"), nullable=True
    )

    favicon: Mapped[Optional["File"]] = relationship(foreign_keys=[favicon_id])
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="site", cascade="all, delete-orphan"
    )


class Subscription(Base):
    __tablename__ = "subscription"

    category_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("category.id", ondelete="SET NULL"), nullable=True
    )
    site_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("site.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    fetch_time: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    category: Mapped[Optional["Category"]] = relationship(back_populates="subscriptions")
    site: Mapped[Optional["Site"]] = relationship(back_populates="subscriptions")
    articles: Mapped[list["Article"]] = relationship(
        back_populates="subscription", cascade="all, delete-orphan"
    )
    tags: Mapped[list["Tag"]] = relationship(
        secondary="subscription_tag", back_populates="subscriptions"
    )


class Article(Base):
    __tablename__ = "article"

    subscription_id: Mapped[str] = mapped_column(
        ForeignKey("subscription.id", ondelete="CASCADE"), nullable=False
    )
    hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    author: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    link: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    publish_time: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    meta: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    subscription: Mapped["Subscription"] = relationship(back_populates="articles")
    state: Mapped[Optional["ArticleState"]] = relationship(
        back_populates="article", uselist=False, cascade="all, delete-orphan"
    )
    attachments: Mapped[list["ArticleAttachment"]] = relationship(
        back_populates="article", cascade="all, delete-orphan"
    )
    tags: Mapped[list["Tag"]] = relationship(
        secondary="article_tag", back_populates="articles"
    )

    __table_args__ = (UniqueConstraint("subscription_id", "hash", name="uq_article_sub_hash"),)


class ArticleState(Base):
    __tablename__ = "article_state"

    article_id: Mapped[str] = mapped_column(
        ForeignKey("article.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    is_read: Mapped[bool] = mapped_column(default=False)
    is_hide: Mapped[bool] = mapped_column(default=False)
    is_star: Mapped[bool] = mapped_column(default=False)

    article: Mapped["Article"] = relationship(back_populates="state")


class ArticleAttachment(Base):
    __tablename__ = "article_attachment"

    article_id: Mapped[str] = mapped_column(
        ForeignKey("article.id", ondelete="CASCADE"), nullable=False
    )
    file_type: Mapped[str] = mapped_column(String(64), nullable=False)
    file_id: Mapped[str] = mapped_column(
        ForeignKey("file.id", ondelete="CASCADE"), nullable=False
    )

    article: Mapped["Article"] = relationship(back_populates="attachments")
    file: Mapped["File"] = relationship()


class File(Base):
    __tablename__ = "file"

    hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    extension: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    stored: Mapped[bool] = mapped_column(default=False)
    rel_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)


class Notification(Base):
    __tablename__ = "notification"

    type: Mapped[str] = mapped_column(String(64), nullable=False)
    params: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_read: Mapped[bool] = mapped_column(default=False)
    subscription_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("subscription.id", ondelete="SET NULL"), nullable=True
    )


class SettingsSingleton(Base):
    __tablename__ = "settings"

    auto_refresh_interval: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    theme: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    font_size: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)


class Task(Base):
    __tablename__ = "task"

    task_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="ready")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Tag(Base):
    __tablename__ = "tag"

    title: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    color: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)

    subscriptions: Mapped[list["Subscription"]] = relationship(
        secondary="subscription_tag", back_populates="tags"
    )
    articles: Mapped[list["Article"]] = relationship(
        secondary="article_tag", back_populates="tags"
    )


subscription_tag = Table(
    "subscription_tag",
    Base.metadata,
    Column("subscription_id", ForeignKey("subscription.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True),
)

article_tag = Table(
    "article_tag",
    Base.metadata,
    Column("article_id", ForeignKey("article.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True),
)
