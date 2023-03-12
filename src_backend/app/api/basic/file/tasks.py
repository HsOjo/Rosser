import base64

import requests

from app import celery
from app.libs.celery import ContextTask


@celery.task(bind=True, max_retries=3)
def download(self: 'ContextTask', id):
    from .service import FileService
    fs = FileService()

    file = fs.get(id)
    if not file or file.data:
        return

    try:
        resp = requests.get(file.url)
        fs.edit(file.id, data=base64.b64encode(resp.content).decode())
    except:
        self.retry(eta=10)
