from wtforms import StringField, IntegerField

from app.api.base.forms import JSONForm


class BodyForm(JSONForm):
    category_id = IntegerField('分类ID')
    title = StringField('标题')
    description = StringField('描述')
    url = StringField('订阅链接')
