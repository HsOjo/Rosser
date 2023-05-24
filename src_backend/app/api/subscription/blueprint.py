import datetime

from flask import abort, jsonify

from app.api.base.forms import MutipleItemsForm
from . import article, tasks
from .forms import BodyForm
from .models import Subscription
from .service import SubscriptionService
from ..base.blueprint import BaseBlueprint


class Blueprint(BaseBlueprint):
    service_class = SubscriptionService
    body_form_class = BodyForm

    def register_rules(self):
        super().register_rules()
        self.add_url_rule('/fetch', methods=['POST'], view_func=self.fetch)
        self.add_url_rule('/fetch-expires', methods=['POST'], view_func=self.fetch_expires)
        self.add_url_rule('/fetch-all', methods=['POST'], view_func=self.fetch_all)

    def fetch(self):
        form = MutipleItemsForm()
        if not form.validate():
            abort(401)

        res = tasks.fetch_many.delay(ids=form.ids.data)
        return jsonify(dict(res_id=res.id))

    def fetch_expires(self):
        yesterday = datetime.datetime.now() - datetime.timedelta(days=1)
        res = tasks.fetch_many.delay(ids=self.service.all_ids(Subscription.fetch_time < yesterday))
        return jsonify(dict(res_id=res.id))

    def fetch_all(self):
        res = tasks.fetch_many.delay()
        return jsonify(dict(res_id=res.id))


blueprint = Blueprint('subscription', __name__, url_prefix='/subscription')
blueprint.register_blueprint(article.blueprint)
