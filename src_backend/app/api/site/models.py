from app import db
from app.api.base.models import BaseModel


class Site(BaseModel):
    url = db.Column(db.String, index=True)
    title = db.Column(db.String)
    favicon_id = db.Column(db.Integer, db.ForeignKey('file.id'), index=True)
