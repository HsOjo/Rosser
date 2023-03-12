from typing import Type, List, TypeVar

from app.api.base.decorators import with_commit
from app.api.base.models import BaseModel

Model = TypeVar('Model', bound=BaseModel)


class BaseService:
    model_cls: 'Type[Model]'

    def all(self) -> 'List[Model]':
        return self.model_cls.query_all()

    def get(self, id) -> 'Model':
        return self.model_cls.query_by_id(id)

    def get_many(self, *ids) -> 'List[Model]':
        return self.model_cls.query.filter(self.model_cls.id.in_(ids)).all()

    def get_by_field(self, field, value) -> 'Model':
        return self.model_cls.query_by_field(field, value)

    def add(self, **kwargs) -> 'Model':
        return self.model_cls.create(**kwargs)

    @with_commit
    def edit(self, id, **kwargs) -> 'int':
        return self.model_cls.query.filter(self.model_cls.id == id).update(kwargs)

    @with_commit
    def delete(self, *ids) -> 'int':
        return self.model_cls.query.filter(self.model_cls.id.in_(ids)).delete(synchronize_session=False)

    def count(self, *ops):
        return self.model_cls.query.filter(*ops).count()
