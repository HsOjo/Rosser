from typing import Literal

import webview


class EventHandler:
    def __init__(self):
        self.event_funcs = {}

    def connect(self, event_type: Literal[
        "closed", "closing", "loaded", "shown", "minimized", "maximized", "restored", "resized", "moved"
    ]):
        def wrapper(f):
            event_funcs = self.event_funcs[event_type] = self.event_funcs.get(event_type, [])
            event_funcs.append(f)
            return f

        return wrapper

    def register(self, window: 'webview.Window'):
        for t, event_funcs in self.event_funcs.items():
            events = getattr(window.events, t)
            for f in event_funcs:
                events += lambda *args, **kwargs: f(window, *args, **kwargs)
