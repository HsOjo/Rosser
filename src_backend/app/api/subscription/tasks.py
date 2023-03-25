from datetime import datetime

import feedparser

from app import celery, db, common
from app.api.subscription.article.models import Article
from app.api.subscription.article.service import ArticleService
from app.api.subscription.article.tasks import fetch_thumb
from app.api.subscription.service import SubscriptionService
from app.libs.celery import ContextTask


@celery.task(bind=True)
def fetch_many(self: 'ContextTask', ids=None):
    ss = SubscriptionService()
    subscriptions = ss.get_many(*ids) if ids else ss.all()

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


@celery.task(bind=True, max_retries=3)
def fetch_one(self: 'ContextTask', id):
    ss = SubscriptionService()
    ars = ArticleService()

    subscription = ss.get(id)
    if not subscription:
        return

    try:
        feed = feedparser.parse(subscription.url)
    except:
        raise self.retry(countdown=10)

    for entry in feed.entries:
        entry = entry.copy()  # type: dict
        entry.pop('keymap', None)

        hash = common.md5(entry.pop('id', entry.get('link')))
        article = ars.get_by_field(Article.hash, hash)
        if not article:
            article = ars.add(hash=hash, subscription_id=subscription.id)

        article.title = entry.pop('title', None)
        article.summary = entry.pop('summary', None)
        article.link = entry.pop('link', None)

        publish_time = entry.pop('published_parsed', None)
        if publish_time:
            article.publish_time = datetime(*publish_time[:6])

        article.meta = common.obj_standard(entry, True, True, True)
        db.session.commit()

        fetch_thumb.delay(article.id)
