from flask import abort, request, Response

from .models import File
from .service import FileService
from ...base.blueprint import BaseBlueprint


class Blueprint(BaseBlueprint):
    service_class = FileService

    def register_rules(self):
        super().register_rules()
        self.add_url_rule('/download/<int:id>', view_func=self.download)

    def download(self, id: int):
        if request.method != 'GET':
            return
        file = self.service.get(id)  # type: File
        data = file.raw_data
        if not data:
            abort(404)
        return Response(data)


blueprint = Blueprint('file', __name__, url_prefix='/file')
