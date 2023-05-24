from wtforms import IntegerField

from app.api.base.forms import JSONForm


class SubscriptionDaysForm(JSONForm):
    subscription_id = IntegerField('订阅ID')
    days = IntegerField('天数')
