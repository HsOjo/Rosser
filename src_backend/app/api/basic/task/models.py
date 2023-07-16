from app import Environ, celery
from app import db
from app.api.base.models import BaseModel


class Task(BaseModel):
    STATUS_READY = 1
    STATUS_RUNNING = 2
    STATUS_FINISH = 3

    seed = db.Column(db.String, index=True, default=Environ.seed)
    task_id = db.Column(db.String, index=True)
    name = db.Column(db.String, index=True)
    status = db.Column(db.Integer, index=True)

    @property
    def meta(self):
        return celery.backend.get_task_meta(self.task_id)

    @property
    def state(self):
        return celery.backend.get_state(self.task_id)

    @property
    def result(self):
        return celery.backend.get_result(self.task_id)

    @property
    def traceback(self):
        return celery.backend.get_traceback(self.task_id)
