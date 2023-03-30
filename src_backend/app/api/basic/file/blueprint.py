from flask import abort, request, Response

from app import db
from . import tasks
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
        if not (file and file.data):
            res = tasks.download.delay(id)
            try:
                res.wait(timeout=10)
                db.session.refresh(file)
            except TimeoutError:
                pass

        if not (file and file.data):
            abort(404)

        return Response(file.data)


blueprint = Blueprint('file', __name__, url_prefix='/file')
