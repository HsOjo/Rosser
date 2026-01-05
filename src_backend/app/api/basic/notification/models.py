from app import db
from app.api.base.models import BaseModel


class Notification(BaseModel):
    TYPE_NEW_ARTICLES = 1
    TYPE_FETCH_ERROR = 2

    type = db.Column(db.Integer, index=True)
    title = db.Column(db.String)
    message = db.Column(db.String)
    is_read = db.Column(db.Boolean, default=False, index=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscription.id', ondelete='SET NULL'), nullable=True)
