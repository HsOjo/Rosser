from app.api.base.service import BaseService
from .models import Article, ArticleAttachment, ArticleState


class ArticleService(BaseService):
    model_cls = Article


class ArticleStateService(BaseService):
    model_cls = ArticleState


class ArticleAttachmentService(BaseService):
    model_cls = ArticleAttachment
