from app import db
from app.api.base.models import BaseModel


class Subscription(BaseModel):
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), index=True)
    site_id = db.Column(db.Integer, db.ForeignKey('site.id'), index=True)
    title = db.Column(db.String, index=True)
    description = db.Column(db.String)
    url = db.Column(db.String, index=True)
    fetch_time = db.Column(db.DateTime)

    @property
    def category(self):
        from app.api.category.models import Category
        return Category.query_by_id(self.category_id)

    @property
    def site(self):
        from app.api.site.models import Site
        return Site.query_by_id(self.site_id)
