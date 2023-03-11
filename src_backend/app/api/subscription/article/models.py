from datetime import datetime

from app import db


class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscription.id'), index=True)

    hash = db.Column(db.String, index=True)
    title = db.Column(db.String, index=True)
    summary = db.Column(db.String)
    link = db.Column(db.String)
    publish_time = db.Column(db.DateTime)
    thumb_id = db.Column(db.Integer, db.ForeignKey('file.id'), index=True)
    meta = db.Column(db.JSON)
    create_time = db.Column(db.DateTime, default=datetime.now())
    update_time = db.Column(db.DateTime, onupdate=datetime.now())

    @property
    def subscription(self):
        from app.api.subscription.models import Subscription
        return Subscription.query.get(self.subscription_id)

    @property
    def state(self):
        return ArticleState.query.filter(ArticleState.article_id == self.id).first()


class ArticleState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('article.id'), index=True)
    is_read = db.Column(db.Boolean, index=True, default=False)
    is_hide = db.Column(db.Boolean, index=True, default=False)
    is_favourite = db.Column(db.Boolean, index=True, default=False)
