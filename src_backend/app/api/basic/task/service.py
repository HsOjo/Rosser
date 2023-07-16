from app import Environ
from app.api.base.service import BaseService
from .models import Task


class TaskService(BaseService):
    model_cls = Task
    default_filters = [
        Task.seed == Environ.seed,
    ]
