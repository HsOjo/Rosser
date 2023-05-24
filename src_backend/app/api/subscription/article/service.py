from app.api.base.service import BaseService
from .models import Article, ArticleAttachment, ArticleState


class ArticleService(BaseService):
    model_cls = Article

    def add(self, **kwargs) -> 'Article':
        article = self.model_cls.create(**kwargs)
        ArticleStateService().add(article_id=article.id)
        return article

    def delete(self, *ids) -> 'int':
        service_article_state = ArticleStateService()
        service_article_state.delete(*service_article_state.all_ids(ArticleState.article_id.in_(ids)))
        return super().delete(*ids)


class ArticleStateService(BaseService):
    model_cls = ArticleState


class ArticleAttachmentService(BaseService):
    model_cls = ArticleAttachment
