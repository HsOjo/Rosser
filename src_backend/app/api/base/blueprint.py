from typing import TypeVar, Type

from flask import Blueprint, abort, jsonify
from flask_wtf import FlaskForm

from app.api.base.forms import MutipleItemsForm, QueryForm
from app.api.base.service import BaseService

T = TypeVar('T')


class BaseBlueprint(Blueprint):
    service_class: 'Type[BaseService]'
    body_form_class: 'Type[FlaskForm]'
    add_form_class: 'Type[FlaskForm]'
    edit_form_class: 'Type[FlaskForm]'

    def __init__(self, name: str, import_name: str, **kwargs):
        super().__init__(name, import_name, **kwargs)
        self.register_rules()

    def register_rules(self):
        self.add_url_rule('/all', methods=['GET', 'POST'], view_func=self.all)
        self.add_url_rule('/paginate/<int:per_page>/<int:page>', methods=['GET', 'POST'], view_func=self.paginate)
        self.add_url_rule('/get/<int:id>', methods=['GET'], view_func=self.get_)

        body_form_class = getattr(self, 'body_form_class', None)
        self.add_form_class = getattr(self, 'add_form_class', body_form_class)
        self.edit_form_class = getattr(self, 'edit_form_class', body_form_class)

        if self.add_form_class:
            self.add_url_rule('/add', methods=['POST'], view_func=self.add)
        if self.edit_form_class:
            self.add_url_rule('/edit/<int:id>', methods=['POST'], view_func=self.edit)

        self.add_url_rule('/delete', methods=['POST'], view_func=self.delete_)

    @property
    def service(self):
        return self.service_class()

    def paginate(self, page: int, per_page: int):
        form = QueryForm()
        if not form.validate():
            abort(401)

        pagi = self.service.paginate(
            page=page, per_page=per_page,
            query_func=form.query_func,
        )

        return jsonify(dict(
            page=pagi.page,
            per_page=pagi.per_page,
            total=pagi.total,
            items=list(map(lambda item: item.dict, pagi.items)),
        ))

    def all(self):
        form = QueryForm()
        if not form.validate():
            abort(401)

        items = self.service.all(query_func=form.query_func)
        return jsonify(list(map(lambda item: item.dict, items)))

    def get_(self, id: int):
        item = self.service.get(id)
        return jsonify(item.dict)

    def add(self):
        form = self.add_form_class()
        if not form.validate():
            abort(401)

        item = self.service.add(**form.data)
        return jsonify(dict(id=getattr(item, 'id', None)))

    def edit(self, id: int):
        form = self.edit_form_class()
        if not form.validate():
            abort(401)

        result = self.service.edit(id, **form.data)
        return jsonify(dict(result=result))

    def delete_(self):
        form = MutipleItemsForm()
        if not form.validate():
            abort(401)

        result = self.service.delete(*form.ids.data)
        return jsonify(dict(result=result))
