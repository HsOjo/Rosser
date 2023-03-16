import os
import platform

import webview

from app import common


class PyWebViewAPI:
    window: 'webview.Window'

    def get_properties(self):
        return {k: getattr(self, k) for k in ['x', 'y', 'width', 'height', 'on_top']}

    def get_platform(self):
        return platform.platform()

    def interupt(self):
        common.send_interrupt(os.getpid())

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
