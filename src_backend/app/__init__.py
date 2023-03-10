if __import__('os').environ.get('GEVENT_SUPPORT'):
    __import__('gevent.monkey').monkey.patch_all()

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

from . import common, api
from .cli import cli

app = Flask(__name__, static_url_path='/')
cors = CORS(app, origins=['*'])
socket_io = SocketIO(app)

app.register_blueprint(api.blueprint)
