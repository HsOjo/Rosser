from datetime import datetime

from flask_sqlalchemy.query import Query

from app import db
from app.api.base.decorators import with_commit
from app.common import model_to_dict


class BaseModel(db.Model):
    __abstract__ = True

    query: 'Query'

    id = db.Column(db.Integer, primary_key=True)
    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, onupdate=datetime.now)

    @classmethod
    @with_commit
    def create(cls, **kwargs):
        obj = cls(**kwargs)
        db.session.add(obj)
        return obj

    @with_commit
    def update(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    @with_commit
    def delete(self):
        db.session.delete(self)

    @classmethod
    def query_all(cls):
        return cls.query.all()

    @classmethod
    def query_by_id(cls, id):
        return cls.query.get(id)

    @classmethod
    def query_by_field(cls, field, value):
        if isinstance(field, str):
            field = getattr(cls, field)
        return cls.query.filter(field == value).first()

    @property
    def dict(self):
        return model_to_dict(self)
