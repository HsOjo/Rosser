import socket
import sys


def get_free_port():
    with socket.socket() as s:
        s.bind(('', 0))
        return s.getsockname()[1]


def get_launch_argv():
    if hasattr(sys, '_MEIPASS'):
        return sys.argv[:1]
    else:
        return [sys.executable, *sys.argv]
