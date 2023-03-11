from flask_wtf import FlaskForm
from wtforms import StringField
from wtforms.validators import DataRequired

from app.api.base.forms import JSONForm


class FileForm(JSONForm):
    path = StringField('路径', validators=[DataRequired()])
