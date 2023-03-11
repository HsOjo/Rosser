import multiprocessing
import os

import click
from celery.apps.beat import Beat
from celery.apps.worker import Worker
from celery.bin.base import COMMA_SEPARATED_LIST
from celery.events.cursesmon import evtop
from celery.utils.nodenames import default_nodename, host_format

from app import celery


@click.option('-c', '--concurrency', type=int, default=None)
@click.option('-P', '--pool', type=str, default='gevent')
@click.option('-E', '--task-events', is_flag=True)
@click.option('-Q', '--queues', type=COMMA_SEPARATED_LIST)
def worker(concurrency: int, pool: str, task_events: bool, queues: list):
    hostname = f'{host_format(default_nodename(None))}:{"-".join(queues or [])}:{os.getpid()}'
    if concurrency is None:
        if pool == 'gevent':
            concurrency = 64
        else:
            concurrency = multiprocessing.cpu_count() * 2

    Worker(app=celery, **locals()).start()


@click.option('-s', '--schedule', type=str, default=None)
@click.option('--max-interval', type=int, default=None)
def beat(schedule: str, max_interval: int):
    if not schedule:
        schedule = os.path.join(os.path.abspath('data'), 'celerybeat-schedule.db')
    Beat(app=celery, **locals()).run()


def events():
    evtop(celery)
