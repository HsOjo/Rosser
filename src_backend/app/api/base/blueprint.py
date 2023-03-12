from typing import TypeVar, Type

from flask import Blueprint, abort, jsonify
from flask_wtf import FlaskForm

from app import common
from app.api.base.forms import PaginateForm, MutipleItemsForm
from app.api.base.models import BaseModel

T = TypeVar('T')


class BaseBlueprint(Blueprint):
    model_class: 'Type[BaseModel]'
    add_form_class: 'Type[FlaskForm]'
    edit_form_class: 'Type[FlaskForm]'

    def __init__(self, name: str, import_name: str, **kwargs):
        super().__init__(name, import_name, **kwargs)
        self.register_rules()

    def register_rules(self):
        self.add_url_rule('/all', methods=['GET'], view_func=self.all)
        self.add_url_rule('/paginate', methods=['POST'], view_func=self.paginate)
        self.add_url_rule('/get/<int:id>', methods=['GET'], view_func=self.get_)

        if getattr(self, 'add_form_class', None):
            self.add_url_rule('/add', methods=['POST'], view_func=self.add)
        if getattr(self, 'edit_form_class', None):
            self.add_url_rule('/edit/<int:id>', methods=['POST'], view_func=self.edit)

        self.add_url_rule('/delete', methods=['POST'], view_func=self.delete_)

    def paginate(self):
        form = PaginateForm()
        if not form.validate():
            abort(401)

        pagi = self.model_class.query.paginate(**form.data)
        return jsonify(dict(
            page=pagi.page,
            per_page=pagi.per_page,
            total=pagi.total,
            items=list(map(lambda item: item.dict, pagi.items)),
        ))

    def all(self):
        items = self.model_class.query.all()
        return jsonify(list(map(lambda item: item.dict, items)))

    def get_(self, id: int):
        item = self.model_class.query_by_id(id)
        return jsonify(item.dict)

    def add(self):
        form = self.add_form_class()
        if not form.validate():
            abort(401)

        item = self.model_class.create(**form.data)
        return jsonify(dict(id=item.id))

    def edit(self, id: int):
        form = self.edit_form_class()
        if not form.validate():
            abort(401)

        item = self.model_class.query_by_id(id)
        item.update(**form.data)

        return jsonify(dict(id=item.id))

    def delete_(self):
        form = MutipleItemsForm()
        if not form.validate():
            abort(401)

        num = self.model_class.query.filter(self.model_class.id.in_(form.ids.data)).delete()
        return jsonify(dict(num=num))
