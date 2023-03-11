from datetime import datetime
from urllib.parse import urlparse, urljoin

import feedparser
import requests
from bs4 import BeautifulSoup
from celery.result import allow_join_result

from app import celery, db, common
from app.api.basic.tasks import cache_file
from app.libs.celery import ContextTask


@celery.task(bind=True)
def fetch_many(self: 'ContextTask', ids=None):
    from app.api.subscription.models import Subscription
    query = Subscription.query
    if ids:
        query = query.filter(Subscription.id.in_(ids))

    subscriptions = query.all()

    results = []
    for subscription in subscriptions:
        results.append(fetch_one.delay(subscription.id))

    total = len(results)
    for index, result in enumerate(results):
        result.wait()
        self.update_state(state='PROGRESS', meta=dict(
            current=index + 1,
            total=total
        ))


@celery.task
def fetch_one(id):
    from app.api.subscription.models import Subscription
    from .article.models import Article

    subscription = Subscription.query.get(id)
    if not subscription:
        return

    if not subscription.icon_id:
        fetch_icon.delay(id)

    subscription.fetch_time = datetime.now()
    db.session.add(subscription)
    db.session.commit()

    feed = feedparser.parse(subscription.url)
    for entry in feed.entries:
        entry = entry.copy()  # type: dict
        entry.pop('keymap', None)

        hash = common.md5(entry.pop('id', entry.get('link')))
        article = Article.query.filter(Article.hash == hash).first()
        if not article:
            article = Article(hash=hash, subscription_id=subscription.id)

        article.title = entry.pop('title', None)
        article.summary = entry.pop('summary', None)
        article.link = entry.pop('link', None)

        publish_time = entry.pop('published_parsed', None)
        if publish_time:
            article.publish_time = datetime(*publish_time[:6])

        article.meta = common.obj_standard(entry, True, True, True)
        if entry.get('summary_detail', {}).get('type') == 'text/html':
            bs = BeautifulSoup(article.summary, 'html.parser')
            thumb_img = bs.find('img')
            if thumb_img:
                thumb_url = urljoin(article.link, thumb_img.get('src'))
                res = cache_file.delay(thumb_url)
                try:
                    with allow_join_result():
                        file_id = res.get()
                    article.thumb_id = file_id
                except:
                    pass

        db.session.add(article)
        db.session.commit()


@celery.task
def fetch_icon(id):
    from app.api.subscription.models import Subscription

    subscription = Subscription.query.get(id)
    if not subscription:
        return

    url = urlparse(subscription.url)
    root_url = f'{url.scheme}://{url.netloc}'

    resp = requests.get(root_url)
    bs = BeautifulSoup(resp.content, 'html.parser')
    icon_link = bs.find("link", rel="icon")
    if not icon_link:
        icon_link = bs.find("link", rel="shortcut icon")
    if icon_link:
        icon_href = icon_link.get('href')
        if icon_href:
            icon_url = urljoin(root_url, icon_href)
            res = cache_file.delay(icon_url)
            try:
                with allow_join_result():
                    file_id = res.get()
                subscription.icon_id = file_id
                db.session.add(subscription)
                db.session.commit()
            except:
                pass
