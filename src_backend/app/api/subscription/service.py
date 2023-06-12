from urllib.parse import urlparse

from app.api.base.service import BaseService
from app.api.site.service import SiteService
from .models import Subscription


class SubscriptionService(BaseService):
    model_cls = Subscription

    def add(self, url, **kwargs) -> 'Subscription':
        url_obj = urlparse(url)
        if url_obj.scheme and url_obj.netloc:
            kwargs.update(url=url, site_id=SiteService().get_by_url(url).id)
            return super().add(**kwargs)

    def edit(self, *ids, **kwargs) -> 'int':
        url = kwargs.get('url')
        if url:
            kwargs.update(site_id=SiteService().get_by_url(url).id)
        return super().edit(*ids, **kwargs)
