from urllib.parse import urlparse

from app.api.base.service import BaseService
from . import tasks
from .models import Site


class SiteService(BaseService):
    model_cls = Site

    def get_by_url(self, url_str) -> 'Site':
        url = urlparse(url_str)
        site_url = f'{url.scheme}://{url.netloc}'

        site = self.get_by_field(Site.url, site_url)
        if not site:
            site = self.add(url=site_url)
            tasks.fetch_site.delay(site.id)

        return site
