from app.api.base.service import BaseService
from .models import Notification


class NotificationService(BaseService):
    model_cls = Notification
