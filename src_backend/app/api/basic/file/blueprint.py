from flask import abort, request, Response

from .models import File
from ...base.blueprint import BaseBlueprint


class Blueprint(BaseBlueprint):
    model_class = File

    def register_rules(self):
        super().register_rules()
        self.add_url_rule('/download/<int:id>', view_func=self.download)

    def download(self, id: int):
        if request.method != 'GET':
            return
        file = File.query_by_id(id)
        data = file.raw_data
        if not data:
            abort(404)
        return Response(data)


blueprint = Blueprint('file', __name__, url_prefix='/file')
