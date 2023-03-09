import socket
import sys


def get_free_port():
    with socket.socket() as s:
        s.bind(('', 0))
        return s.getsockname()[1]


def get_launch_argv():
    return [sys.executable, *sys.argv]
