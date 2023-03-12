from app.api.base.service import BaseService
from .models import Article, ArticleAttachment


class ArticleService(BaseService):
    model_cls = Article


class ArticleAttachmentService(BaseService):
    model_cls = ArticleAttachment
