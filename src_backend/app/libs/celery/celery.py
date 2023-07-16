import os
from abc import ABC
from typing import Callable, Union

from celery import Celery as _Celery
from celery.app.task import Task as _Task
from celery.backends.base import Backend


class ContextTask(_Task, ABC):
    def apply_async(self, *args, **kwargs):
        from flask import g
        headers = kwargs.pop('headers', None) or {}
        try:
            headers.update(g=g.__dict__)
        except RuntimeError:
            pass

        return super().apply_async(*args, headers=headers, **kwargs)

    def __call__(self, *args, **kwargs):
        from flask import g
        from app import app
        with app.app_context():
            g_data = self.request.get('g')
            if g_data:
                g.__dict__.update(g_data)
            return self.run(*args, **kwargs)


class Celery(_Celery):
    task_cls = 'app.libs.celery:ContextTask'
    task: Union[Callable[[...], 'ContextTask'], Callable[[...], Callable[[...], 'ContextTask']]]
    backend: 'Backend'

    def init_app(self, app):
        self.main = app.import_name

        data_dir = os.path.abspath('data')

        broker_dir = os.path.join(os.path.abspath('data'), 'broker')
        os.makedirs(broker_dir, exist_ok=True)

        path_beat_db = os.path.join(data_dir, 'celery.db')
        self.conf.broker_url = f'sqla+sqlite:///{path_beat_db}'
        path_beat_db = os.path.join(data_dir, 'celerybeat-result.db')
        self.conf.result_backend = f'db+sqlite:///{path_beat_db}'
