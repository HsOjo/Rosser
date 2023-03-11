from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField

from app.api.base.forms import JSONForm


class AddForm(JSONForm):
    category_id = IntegerField('分类ID')
    title = StringField('标题')
    description = StringField('描述')
    url = StringField('订阅链接')


class EditForm(AddForm):
    id = IntegerField('ID')
