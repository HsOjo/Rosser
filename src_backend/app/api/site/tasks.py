from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from app import celery
from app.api.basic.file.service import FileService
from app.api.site.models import Site


@celery.task
def fetch_site(id):
    from app.api.site.service import SiteService
    ss = SiteService()
    site = ss.get(id)  # type: Site
    if not site:
        return

    resp = requests.get(site.url, headers={'User-Agent': 'Mozilla/5.0'})
    bs = BeautifulSoup(resp.content, 'html.parser')

    title = getattr(bs.title, 'string', None)
    if title:
        ss.edit(site.id, title=title)

    icon_link = bs.find("link", rel="icon")
    if not icon_link:
        icon_link = bs.find("link", rel="shortcut icon")

    if icon_link:
        icon_href = icon_link.get('href')
        if icon_href:
            icon_url = urljoin(site.url, icon_href)
            file = FileService().cache_file(icon_url)
            ss.edit(site.id, favicon_id=file.id)
