import json
import os
import signal
import subprocess

import click
import webview

from app import common
from app.utils.pywebview_api import PyWebViewAPI
from app.utils.window import EventHandler


@click.option('-h', '--host')
@click.option('-p', '--port', type=int)
@click.option('-r', '--use-reloader', is_flag=True)
def serve(host: str, port: int, **kwargs):
    from app import app, socket_io
    if not port:
        port = common.get_free_port()
    socket_io.run(app, host, port, **kwargs)


@click.argument('url')
@click.option('-t', '--title', default='')
@click.option('-d', '--debug', is_flag=True)
@click.option('-g', '--gui')
@click.option('-c', '--context')
def view(url: str, title: str, **kwargs):
    context = kwargs.pop('context', 'null')
    event = EventHandler()

    @event.connect('loaded')
    def on_loaded(window: 'webview.Window'):
        window.evaluate_js(f'''
            localStorage.setItem('PY_CONTEXT', '{context}');
        '''.strip())

    api = PyWebViewAPI()
    main_window = api.window = webview.create_window(title, js_api=api, html=f'''
    <body style="display: flex;
        align-items: center;
        height: 100%;
        color: #6D6867;
        border: #BABBBC solid 1px;
        margin: 0;
        padding: 0 16px;
        font-size: 1.25rem;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        ">
    <p>⌛️ Now Loading...</p>
    <script> setInterval(() => location.href = "{url}", 100)</script>
    </body>''', width=675, height=50, frameless=True, easy_drag=False, transparent=True, vibrancy=True)

    event.register(main_window)
    webview.start(**kwargs)


def start():
    args = common.get_launch_argv()
    env = os.environ.copy()

    port = common.get_free_port()
    backend_url = f'http://127.0.0.1:{port}'
    frontend_url = os.environ.get('FRONTEND_URL', f'{backend_url}/index.html')

    processes = []

    p_view = subprocess.Popen(args + [
        'view', frontend_url, '--debug',
        '--context', json.dumps(dict(
            backend_url=backend_url,
        ))
    ])

    p_serve = subprocess.Popen(args + [
        'serve', '-p', str(port), '-r'
    ], env=dict(**env, GEVENT_SUPPORT='1'))
    p_worker = subprocess.Popen(args + [
        'worker', '-E'
    ], env=dict(**env, GEVENT_SUPPORT='1'))
    p_beat = subprocess.Popen(args + [
        'beat',
    ])

    processes.append(p_serve)
    processes.append(p_worker)
    processes.append(p_beat)

    try:
        p_view.wait()
    finally:
        for p in processes:
            p.send_signal(signal.SIGINT)
        for p in processes:
            p.wait()
