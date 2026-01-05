from flask import jsonify, abort

from app.api.base.curd_blueprint import CurdBlueprint
from app.api.base.forms import MutipleItemsForm
from .models import Notification
from .service import NotificationService


class Blueprint(CurdBlueprint):
    service_class = NotificationService

    def register_rules(self):
        super().register_rules()
        self.add_url_rule('/unread-count', methods=['GET'], view_func=self.unread_count)
        self.add_url_rule('/mark-read', methods=['POST'], view_func=self.mark_read)
        self.add_url_rule('/mark-all-read', methods=['POST'], view_func=self.mark_all_read)

    def unread_count(self):
        count = self.service.count(Notification.is_read == False)
        return jsonify(dict(count=count))

    def mark_read(self):
        form = MutipleItemsForm()
        if not form.validate():
            abort(401)
        result = self.service.edit(*form.ids.data, is_read=True)
        return jsonify(dict(result=result))

    def mark_all_read(self):
        ids = self.service.all_ids(Notification.is_read == False)
        result = self.service.edit(*ids, is_read=True) if ids else 0
        return jsonify(dict(result=result))


blueprint = Blueprint('notification', __name__)
