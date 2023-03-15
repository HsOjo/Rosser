from wtforms import StringField

from app.api.base.forms import JSONForm


class BodyForm(JSONForm):
    title = StringField('标题')
    description = StringField('描述')
