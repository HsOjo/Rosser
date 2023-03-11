from typing import List

from flask import Blueprint, abort, jsonify, request

from app import db
from app.api.base.forms import MutipleItemsForm
from . import article, tasks
from .forms import AddForm, EditForm
from .models import Subscription
from ...common import model_to_dict

blueprint = Blueprint('subscription', __name__, url_prefix='/subscription')
blueprint.register_blueprint(article.blueprint)


@blueprint.route('/all', methods=['GET'])
def all():
    items = Subscription.query.all()  # type: List[Subscription]
    return jsonify(list(map(model_to_dict, items)))


@blueprint.route('/get/<int:id>', methods=['GET'])
def get(id: int):
    item = Subscription.query.get(id)  # type: Subscription
    return jsonify(model_to_dict(item))


@blueprint.route('/add', methods=['POST'])
def add():
    form = AddForm()
    if not form.validate():
        abort(401)

    item = Subscription(**form.data)
    db.session.add(item)
    db.session.commit()

    return jsonify(dict(id=item.id))


@blueprint.route('/edit/<int:id>', methods=['POST'])
def edit(id: int):
    form = EditForm()
    if not form.validate():
        abort(401)

    item = Subscription.query.get(id)  # type: Subscription
    item.__dict__.update(**form.data)
    db.session.add(item)
    db.session.commit()

    return jsonify(dict(id=item.id))


@blueprint.route('/delete', methods=['POST'])
def delete():
    form = MutipleItemsForm()
    if not form.validate():
        abort(401)

    num = Subscription.query.filter(Subscription.id.in_(form.ids.data)).delete()
    return jsonify(dict(num=num))


@blueprint.route('/fetch', methods=['POST'])
def fetch():
    form = MutipleItemsForm()
    if not form.validate():
        abort(401)

    res = tasks.fetch_many.delay(ids=form.ids.data)
    return jsonify(dict(res_id=res.id))


@blueprint.route('/fetch-all', methods=['POST'])
def fetch_all():
    res = tasks.fetch_many.delay()
    return jsonify(dict(res_id=res.id))
