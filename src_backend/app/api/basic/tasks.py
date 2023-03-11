import base64
import os

import requests

from app import celery, common, db


@celery.task
def cache_file(url):
    from app.api.basic.models import File
    url_hash = common.md5(url)
    file = File.query.filter(File.hash == url_hash).first()
    if not file:
        resp = requests.get(url)
        filename = os.path.basename(url)
        extension = os.path.splitext(filename)[1]

        file = File(hash=url_hash, url=url, extension=extension, data=base64.b64encode(resp.content).decode())
        db.session.add(file)
        db.session.commit()

    return file.id
