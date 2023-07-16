from app.api.base.service import BaseService
from .models import Article, ArticleAttachment, ArticleState


class ArticleService(BaseService):
    model_cls = Article

    def add(self, **kwargs) -> 'Article':
        article = self.model_cls.create(**kwargs)
        ArticleStateService().add(article_id=article.id)
        return article


class ArticleStateService(BaseService):
    model_cls = ArticleState


class ArticleAttachmentService(BaseService):
    model_cls = ArticleAttachment
