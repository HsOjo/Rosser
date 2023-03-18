import os
from urllib.parse import urlparse

import webview

from app import common


class PyWebViewAPI:
    window: 'webview.Window'

    def get_properties(self):
        return {k: getattr(self, k) for k in ['x', 'y', 'width', 'height', 'on_top']}

    def get_platform(self):
        return common.get_platform_system()

    def interupt(self):
        common.send_interrupt(os.getpid())

    def window_open(self, url):
        url_obj = urlparse(url)
        webview.create_window(url_obj.netloc, url, width=1280, height=720)

    def __dir__(self):
        return list(set(list(super().__dir__()) + [
            'create_confirmation_dialog', 'create_file_dialog', 'destroy',
            'hide', 'minimize', 'move', 'resize', 'restore', 'set_title',
            'show', 'toggle_fullscreen'
        ]))

    def __getattribute__(self, item):
        try:
            attr = object.__getattribute__(self, item)
        except AttributeError:
            attr = getattr(self.window, item)

        return attr
