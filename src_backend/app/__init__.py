if __import__('os').environ.get('GEVENT_SUPPORT'):
    __import__('gevent.monkey').monkey.patch_all()

import json
import os
import signal
import subprocess
from typing import TYPE_CHECKING

from .utils.window import EventHandler, helper

if TYPE_CHECKING:
    import webview

import click
from click import Context
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

from . import common
from .api import test

app = Flask(__name__, static_url_path='/')
app.register_blueprint(test.blueprint)

cors = CORS(app, origins=['*'])
socket_io = SocketIO(app)


@click.group(invoke_without_command=True)
@click.pass_context
def cli(ctx: Context):
    if ctx.invoked_subcommand:
        return

    args = common.get_launch_argv()
    env = os.environ.copy()

    port = common.get_free_port()
    backend_url = f'http://127.0.0.1:{port}'
    frontend_url = os.environ.get('FRONTEND_URL', f'{backend_url}/index.html')

    p_serve = subprocess.Popen(args + [
        'serve', '-p', str(port)
    ], env=dict(**env, GEVENT_SUPPORT='1'))

    p_view = subprocess.Popen(args + [
        'view', frontend_url, '--debug',
        '--context', json.dumps(dict(
            backend_url=backend_url,
        ))
    ])

    try:
        p_view.wait()
    finally:
        p_serve.send_signal(signal.SIGINT)
        p_view.send_signal(signal.SIGINT)


@click.option('-h', '--host')
@click.option('-p', '--port', type=int)
@click.option('-r', '--use-reloader', is_flag=True)
@cli.command()
def serve(host: str, port: int, **kwargs):
    if not port:
        port = common.get_free_port()
    socket_io.run(app, host, port, **kwargs)


@click.argument('url')
@click.option('-t', '--title', default='')
@click.option('-d', '--debug', is_flag=True)
@click.option('-g', '--gui')
@click.option('-c', '--context')
@cli.command()
def view(url: str, title: str, **kwargs):
    import webview
    context = kwargs.pop('context', 'null')
    event = EventHandler()

    @event.connect('loaded')
    def on_loaded(window: 'webview.Window'):
        window.evaluate_js(f'''
            localStorage.setItem('PY_CONTEXT', '{context}');
        ''')
        window.set_title(helper.get_title(window))

    event.register(webview.create_window(title, html=f'''
        <script> setInterval(() => location.href = "{url}", 500) </script>
    '''))
    webview.start(**kwargs)
