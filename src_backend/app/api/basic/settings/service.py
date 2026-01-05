from app.api.base.service import BaseService
from .models import Settings


class SettingsService(BaseService):
    model_cls = Settings

    def get_instance(self):
        return Settings.get_instance()
