import os
from urllib.parse import urlparse

from app import common
from app.api.base.service import BaseService
from . import tasks
from .models import File


class FileService(BaseService):
    model_cls = File

    def cache_file(self, url):
        url_hash = common.md5(url)
        file = self.get_by_field(File.hash, url_hash)
        if not file:
            filename = os.path.basename(urlparse(url).path)
            extension = os.path.splitext(filename)[1]
            file = File.create(hash=url_hash, url=url, extension=extension)
            tasks.download.delay(file.id)

        return file
