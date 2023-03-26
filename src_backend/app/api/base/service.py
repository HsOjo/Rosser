from typing import Type, List, TypeVar, Callable, Iterable

from flask_sqlalchemy.pagination import Pagination
from flask_sqlalchemy.query import Query

from app.api.base.decorators import with_commit
from app.api.base.models import BaseModel

Model = TypeVar('Model', bound=BaseModel)
QueryFunc = TypeVar('QueryFunc', bound=Callable[[...], Query])


class BaseService:
    model_cls: 'Type[Model]'

    def query(self, *filters, orders: 'Iterable' = None, func: 'QueryFunc' = None):
        query = self.model_cls.query
        if func:
            query = func(query=query, model_cls=self.model_cls)
        if filters:
            query = query.filter(*filters)
        if orders:
            query = query.order_by(*orders)

        return query

    def paginate(self, page, per_page, query_func: 'QueryFunc' = None, **kwargs) -> 'Pagination':
        return self.query(func=query_func).paginate(page=page, per_page=per_page, **kwargs)

    def count(self, *filters, query_func: 'QueryFunc' = None):
        query = self.query(*filters, func=query_func)
        if filters:
            query.filter(*filters)
        return query.count()

    def all(self, *filters, query_func: 'QueryFunc' = None) -> 'List[Model]':
        return self.query(*filters, func=query_func).all()

    def get_many(self, *ids) -> 'List[Model]':
        return self.all(self.model_cls.id.in_(ids))

    def get(self, id) -> 'Model':
        return self.model_cls.query_by_id(id)

    def get_by_field(self, field, value) -> 'Model':
        return self.model_cls.query_by_field(field, value)

    def add(self, **kwargs) -> 'Model':
        return self.model_cls.create(**kwargs)

    @with_commit
    def edit(self, id, query_func: 'QueryFunc' = None, **kwargs) -> 'int':
        return self.query(func=query_func).filter(self.model_cls.id == id).update(kwargs)

    @with_commit
    def delete(self, *ids, query_func: 'QueryFunc' = None) -> 'int':
        return self.query(func=query_func).filter(self.model_cls.id.in_(ids)).delete(synchronize_session=False)
