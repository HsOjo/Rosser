from urllib.parse import urljoin

from bs4 import BeautifulSoup
from flask import url_for

from app import celery
from app.api.basic.file.models import File
from app.api.basic.file.service import FileService
from app.api.subscription.article.models import Article, ArticleAttachment
from app.api.subscription.article.service import ArticleService, ArticleAttachmentService


@celery.task
def fetch_attachments(id):
    service_article = ArticleService()
    article = service_article.get(id)  # type: Article
    if not article:
        return

    summary_detail = article.meta.get('summary_detail', {})  # type: dict
    if summary_detail.get('type') == 'text/html':
        summary = summary_detail.get('value')
        bs = BeautifulSoup(summary, 'html.parser')
        images = bs.find_all('img')
        for image in images:
            image_url = urljoin(article.link, image.get('src'))
            file = FileService().localize(image_url, download=False)  # type: File
            image['src'] = f'$file@{file.id}'
            ArticleAttachmentService().add(
                article_id=article.id,
                file_type=ArticleAttachment.FILE_TYPE_IMAGE,
                file_id=file.id,
            )

        service_article.edit(article.id, summary=str(bs))
