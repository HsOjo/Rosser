import click

from app import common


@click.option('-h', '--host')
@click.option('-p', '--port', type=int)
@click.option('-r', '--use-reloader', is_flag=True)
def serve(host: str, port: int, **kwargs):
    from app import app, socket_io
    if not port:
        port = common.get_free_port()
    socket_io.run(app, host, port, **kwargs)
