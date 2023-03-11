from typing import List

from flask import Blueprint, abort, jsonify
from flask_sqlalchemy.pagination import Pagination

from app import db
from app.api.base.forms import PaginateForm, MutipleItemsForm
from .forms import AddForm, EditForm
from .models import Category
from ...common import model_to_dict

blueprint = Blueprint('category', __name__, url_prefix='/category')


@blueprint.route('/paginate', methods=['POST'])
def paginate():
    form = PaginateForm()
    if not form.validate():
        abort(401)

    pagi = Category.query.paginate(**form.data)  # type: Pagination
    return jsonify(pagi.__dict__)


@blueprint.route('/all', methods=['GET'])
def all():
    items = Category.query.all()  # type: List[Category]
    return jsonify(list(map(model_to_dict, items)))


@blueprint.route('/get/<int:id>', methods=['GET'])
def get(id: int):
    item = Category.query.get(id)  # type: Category
    return jsonify(model_to_dict(item))


@blueprint.route('/add', methods=['POST'])
def add():
    form = AddForm()
    if not form.validate():
        abort(401)

    item = Category(**form.data)
    db.session.add(item)
    db.session.commit()

    return jsonify(dict(id=item.id))


@blueprint.route('/edit/<int:id>', methods=['POST'])
def edit(id: int):
    form = EditForm()
    if not form.validate():
        abort(401)

    item = Category.query.get(id)  # type: Category
    item.__dict__.update(**form.data)
    db.session.add(item)
    db.session.commit()

    return jsonify(dict(id=item.id))


@blueprint.route('/delete', methods=['POST'])
def delete():
    form = MutipleItemsForm()
    if not form.validate():
        abort(401)

    num = Category.query.filter(Category.id.in_(form.ids.data)).delete()
    return jsonify(dict(num=num))
