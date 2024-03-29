from flask import jsonify

from . import tasks
from .service import SiteService
from ..base.curd_blueprint import CurdBlueprint


class Blueprint(CurdBlueprint):
    service_class = SiteService

    def register_rules(self):
        super().register_rules()
        self.add_url_rule('/fetch/<int:id>', view_func=self.fetch, methods=['POST'])

    def fetch(self, id: int):
        res = tasks.fetch_site.delay(id)
        return jsonify(res_id=res.id)


blueprint = Blueprint('site', __name__)
