from flask import abort, jsonify
from flask_sqlalchemy.pagination import Pagination
from flask_sqlalchemy.query import Query

from .forms import ArticlePaginateForm
from .models import Article
from ...base.blueprint import BaseBlueprint


class Blueprint(BaseBlueprint):
    model_class = Article

    def paginate(self):
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
            items=list(map(lambda item: item.dict, pagi.items)),
        ))


blueprint = Blueprint('article', __name__, url_prefix='/article')
