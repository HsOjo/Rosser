from celery import Task as CeleryTask, signals


@signals.task_sent.connect
def task_sent(sender=None, task_id=None, task: str = None, args=None, kwargs=None, **other_args):
    from app.api.basic.task.models import Task
    from app.api.basic.task.service import TaskService

    TaskService().add(task_id=task_id, name=task, status=Task.STATUS_READY)


@signals.task_prerun.connect
def task_prerun(sender=None, task_id=None, task: 'CeleryTask' = None, args=None, kwargs=None, **other_args):
    from app.api.basic.task.models import Task
    from app.api.basic.task.service import TaskService

    from app import app
    with app.app_context():
        service = TaskService()
        service.edit(
            *service.all_ids(Task.task_id == task_id),
            status=Task.STATUS_RUNNING,
        )


@signals.task_postrun.connect
def task_postrun(sender=None, task_id=None, task: 'CeleryTask' = None, args=None, kwargs=None, **other_args):
    from app.api.basic.task.models import Task
    from app.api.basic.task.service import TaskService

    from app import app
    with app.app_context():
        service = TaskService()
        service.edit(
            *service.all_ids(Task.task_id == task_id),
            status=Task.STATUS_FINISH,
        )
