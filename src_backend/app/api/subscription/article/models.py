from app import db
from app.api.base.models import BaseModel
from app.common import model_to_dict


class Article(BaseModel):
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscription.id'), index=True)

    hash = db.Column(db.String, index=True)
    title = db.Column(db.String, index=True)
    summary = db.Column(db.String)
    link = db.Column(db.String)
    publish_time = db.Column(db.DateTime)
    meta = db.Column(db.JSON)

    @property
    def subscription(self):
        from app.api.subscription.models import Subscription
        return Subscription.query_by_id(self.subscription_id)

    @property
    def thumb_id(self):
        from app.api.basic.file.models import File
        return db.session.query(File.id).join(ArticleAttachment).filter(
            ArticleAttachment.file_type == ArticleAttachment.FILE_TYPE_THUMB,
            ArticleAttachment.article_id == self.id,
        ).limit(1).scalar()

    @property
    def state(self):
        return ArticleState.query_by_field(ArticleState.article_id, self.id)

    @property
    def dict(self):
        return dict(
            **model_to_dict(self),
            thumb_id=self.thumb_id,
            state=model_to_dict(self.state)
        )


class ArticleState(BaseModel):
    article_id = db.Column(db.Integer, db.ForeignKey('article.id'), index=True)
    is_read = db.Column(db.Boolean, index=True, default=False)
    is_hide = db.Column(db.Boolean, index=True, default=False)
    is_favourite = db.Column(db.Boolean, index=True, default=False)


class ArticleAttachment(BaseModel):
    FILE_TYPE_THUMB = 1

    article_id = db.Column(db.Integer, db.ForeignKey('article.id'), index=True)
    file_type = db.Column(db.Integer, index=True)
    file_id = db.Column(db.Integer, db.ForeignKey('file.id'), index=True)
