from flask import abort, jsonify

from app.api.base.forms import MutipleItemsForm
from . import article, tasks
from .forms import AddForm, EditForm
from .models import Subscription
from ..base.blueprint import BaseBlueprint


class Blueprint(BaseBlueprint):
    model_class = Subscription
    add_form_class = AddForm
    edit_form_class = EditForm

    def register_rules(self):
        super().register_rules()
        self.add_url_rule('/fetch', methods=['POST'], view_func=self.fetch)
        self.add_url_rule('/fetch-all', methods=['POST'], view_func=self.fetch_all)

    def fetch(self):
        form = MutipleItemsForm()
        if not form.validate():
            abort(401)

        res = tasks.fetch_many.delay(ids=form.ids.data)
        return jsonify(dict(res_id=res.id))

    def fetch_all(self):
        res = tasks.fetch_many.delay()
        return jsonify(dict(res_id=res.id))


blueprint = Blueprint('subscription', __name__, url_prefix='/subscription')
blueprint.register_blueprint(article.blueprint)
