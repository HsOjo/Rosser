import click
from click import Context


def create_cli():
    @click.group()
    @click.pass_context
    def cli(ctx: 'Context'):
        pass

    from . import main, worker
    cli.command(main.serve)
    cli.command(worker.worker)
    cli.command(worker.beat)
    cli.command(worker.events)

    from flask_migrate import cli as migrate_cli
    cli.add_command(getattr(migrate_cli, 'db'))

    return cli
