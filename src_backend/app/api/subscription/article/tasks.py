from urllib.parse import urljoin

from bs4 import BeautifulSoup

from app import celery
from app.api.basic.file.service import FileService
from app.api.subscription.article.models import Article, ArticleAttachment
from app.api.subscription.article.service import ArticleService, ArticleAttachmentService


@celery.task
def fetch_thumb(id):
    article = ArticleService().get(id)  # type: Article
    if not article:
        return

    if article.meta.get('summary_detail', {}).get('type') == 'text/html':
        bs = BeautifulSoup(article.summary, 'html.parser')
        thumb_img = bs.find('img')
        if thumb_img:
            thumb_url = urljoin(article.link, thumb_img.get('src'))

            file = FileService().cache_file(thumb_url)
            ArticleAttachmentService().add(
                article_id=article.id,
                file_type=ArticleAttachment.FILE_TYPE_THUMB,
                file_id=file.id,
            )
