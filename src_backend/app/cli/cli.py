import click
from click import Context


def create_cli():
    @click.group(invoke_without_command=True)
    @click.pass_context
    def cli(ctx: 'Context'):
        if ctx.invoked_subcommand:
            return

        main.start()

    from . import main, worker
    cli.command(main.view)
    cli.command(main.serve)
    cli.command(main.start)
    cli.command(worker.worker)
    cli.command(worker.beat)
    cli.command(worker.events)

    from flask_migrate import cli as migrate_cli
    cli.add_command(getattr(migrate_cli, 'db'))

    return cli
