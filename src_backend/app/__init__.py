if __import__('os').environ.get('GEVENT_SUPPORT'):
    __import__('gevent.monkey').monkey.patch_all()

import wtforms_json
from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

from .application import create_app
from .cli import create_cli
from .environ import Environ
from .libs.celery import Celery

cors = CORS()
socket_io = SocketIO()
db = SQLAlchemy()
migrate = Migrate()
celery = Celery()
wtforms_json.init()

app = create_app()
cli = create_cli()
