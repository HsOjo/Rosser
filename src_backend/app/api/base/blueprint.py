from flask import Blueprint

_AUTO = object()


class BaseBlueprint(Blueprint):
    def __init__(self, name: str, import_name: str, url_prefix: str = _AUTO, **kwargs):
        if url_prefix == _AUTO:
            url_prefix = f'/{name.replace("_", "-")}'
        kwargs.update(url_prefix=url_prefix)

        super().__init__(name, import_name, **kwargs)
