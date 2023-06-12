from wtforms import StringField
from wtforms.validators import DataRequired

from app.api.base.forms import JSONForm


class BodyForm(JSONForm):
    title = StringField('标题', validators=[DataRequired()])
    description = StringField('描述')
