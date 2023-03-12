from app import db
from app.api.base.models import BaseModel


class Category(BaseModel):
    title = db.Column(db.String, index=True)
    description = db.Column(db.String)

    @property
    def subscriptions(self):
        from app.api.subscription.models import Subscription
        return Subscription.query.filter(Subscription.category_id == self.id).all()
