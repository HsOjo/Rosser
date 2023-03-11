from wtforms import StringField, IntegerField

from app.api.base.forms import JSONForm


class AddForm(JSONForm):
    title = StringField('标题')
    description = StringField('描述')


class EditForm(AddForm):
    id = IntegerField('ID')
