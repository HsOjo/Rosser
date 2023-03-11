from datetime import datetime

from app import db


class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), index=True)
    title = db.Column(db.String, index=True)
    description = db.Column(db.String)
    url = db.Column(db.String, index=True)
    icon_id = db.Column(db.Integer, db.ForeignKey('file.id'), index=True)
    create_time = db.Column(db.DateTime, default=datetime.now())
    fetch_time = db.Column(db.DateTime)

    @property
    def category(self):
        from app.api.category.models import Category
        return Category.query.get(self.category_id)
