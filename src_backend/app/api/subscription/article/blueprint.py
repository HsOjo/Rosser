import datetime

from flask import abort, jsonify

from .forms import SubscriptionDaysForm
from .models import ArticleState, Article
from .service import ArticleService, ArticleStateService
from ...base.blueprint import BaseBlueprint
from ...base.forms import MutipleItemsForm


class Blueprint(BaseBlueprint):
    service_class = ArticleService

    def register_rules(self):
        super().register_rules()
        self.add_url_rule('/read-before-days', methods=['POST'], view_func=self.read_before_days)
        self.add_url_rule('/read', methods=['POST'], view_func=self.read)
        self.add_url_rule('/unread', methods=['POST'], view_func=self.unread)
        self.add_url_rule('/hide', methods=['POST'], view_func=self.hide)
        self.add_url_rule('/unhide', methods=['POST'], view_func=self.unhide)
        self.add_url_rule('/star', methods=['POST'], view_func=self.star)
        self.add_url_rule('/unstar', methods=['POST'], view_func=self.unstar)

    def update_state(self, **kwargs):
        form = MutipleItemsForm()
        if not form.validate():
            abort(401)

        service_state = ArticleStateService()
        service_state.edit(
            *service_state.all_ids(
                ArticleState.article_id.in_(form.ids.data)
            ), **kwargs,
        )

        return jsonify(dict(finished=1))

    def update_state_before_days(self, **kwargs):
        form = SubscriptionDaysForm()
        if not form.validate():
            abort(401)

        filters = [Article.publish_time < datetime.datetime.now() - datetime.timedelta(days=form.days.data)]
        if form.subscription_id.data:
            filters.append(Article.subscription_id == form.subscription_id.data)

        service_state = ArticleStateService()
        service_state.edit(*service_state.all_ids(
            ArticleState.article_id.in_(
                self.service.all_ids(
                    *filters,
                )
            )
        ), **kwargs)

        return jsonify(dict(finished=1))

    def read(self):
        return self.update_state(is_read=True)

    def unread(self):
        return self.update_state(is_read=False)

    def hide(self):
        return self.update_state(is_hide=True)

    def unhide(self):
        return self.update_state(is_hide=False)

    def star(self):
        return self.update_state(is_star=True)

    def unstar(self):
        return self.update_state(is_star=False)

    def read_before_days(self):
        return self.update_state_before_days(is_read=True)


blueprint = Blueprint('article', __name__, url_prefix='/article')
