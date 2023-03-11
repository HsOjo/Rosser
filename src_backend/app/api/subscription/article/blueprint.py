from typing import List

from flask import Blueprint, abort, jsonify
from flask_sqlalchemy.pagination import Pagination
from flask_sqlalchemy.query import Query

from app.api.base.forms import MutipleItemsForm
from app.common import model_to_dict
from .forms import ArticlePaginateForm
from .models import Article

blueprint = Blueprint('article', __name__, url_prefix='/article')


@blueprint.route('/paginate', methods=['POST'])
def paginate():
    form = ArticlePaginateForm()
    if not form.validate():
        abort(401)

    query = Article.query.order_by(Article.publish_time.desc())  # type: Query
    if form.subscription_id.data:
        query = query.filter(Article.subscription_id == form.subscription_id.data)

    pagi = query.paginate(page=form.page.data, per_page=form.per_page.data)  # type: Pagination
    return jsonify(dict(
        page=pagi.page,
        per_page=pagi.per_page,
        total=pagi.total,
        items=list(map(model_to_dict, pagi.items)),
    ))


@blueprint.route('/all', methods=['GET'])
def all():
    items = Article.query.all()  # type: List[Article]
    return jsonify(list(map(model_to_dict, items)))


@blueprint.route('/get/<int:id>', methods=['GET'])
def get(id: int):
    item = Article.query.get(id)  # type: Article
    return jsonify(model_to_dict(item))


@blueprint.route('/delete', methods=['POST'])
def delete():
    form = MutipleItemsForm()
    if not form.validate():
        abort(401)

    num = Article.query.filter(Article.id.in_(form.ids.data)).delete()
    return jsonify(dict(num=num))
