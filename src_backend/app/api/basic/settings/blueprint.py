from flask import jsonify, abort
from flask_wtf import FlaskForm
from wtforms import IntegerField, StringField
from wtforms.validators import NumberRange, Optional, AnyOf

from app.api.base.blueprint import BaseBlueprint
from .models import Settings


class SettingsForm(FlaskForm):
    auto_refresh_interval = IntegerField(validators=[Optional(), NumberRange(min=0, max=1440)])
    theme = StringField(validators=[Optional(), AnyOf(['light', 'dark'])])
    font_size = IntegerField(validators=[Optional(), NumberRange(min=12, max=20)])


class Blueprint(BaseBlueprint):
    def __init__(self, name: str, import_name: str, **kwargs):
        super().__init__(name, import_name, **kwargs)
        self.add_url_rule('/get', methods=['GET'], view_func=self.get_settings)
        self.add_url_rule('/update', methods=['POST'], view_func=self.update_settings)

    def get_settings(self):
        settings = Settings.get_instance()
        return jsonify(settings.dict)

    def update_settings(self):
        form = SettingsForm()
        if not form.validate():
            abort(401)

        settings = Settings.get_instance()
        update_data = {k: v for k, v in form.data.items() if v is not None}
        if update_data:
            settings.update(**update_data)

        return jsonify(settings.dict)


blueprint = Blueprint('settings', __name__)
