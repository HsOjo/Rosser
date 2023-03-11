from app import db


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, index=True)
    description = db.Column(db.String)

    @property
    def subscriptions(self):
        from app.api.subscription.models import Subscription
        return Subscription.query.filter(Subscription.category_id == self.category_id).all()
