from app.api.base.service import BaseService
from app.api.site.service import SiteService
from .models import Subscription


class SubscriptionService(BaseService):
    model_cls = Subscription

    def add(self, url, **kwargs) -> 'Subscription':
        kwargs.update(url=url, site_id=SiteService().get_by_url(url).id)
        return super().add(**kwargs)

    def edit(self, id, **kwargs) -> 'int':
        url = kwargs.get('url')
        if url:
            kwargs.update(site_id=SiteService().get_by_url(url).id)
        return super().edit(id, **kwargs)
