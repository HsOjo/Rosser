from wtforms import IntegerField

from app.api.base.forms import PaginateForm


class ArticlePaginateForm(PaginateForm):
    subscription_id = IntegerField('订阅ID')
