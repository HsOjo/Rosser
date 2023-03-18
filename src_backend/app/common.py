import base64
import ctypes
import hashlib
import os
import platform
import signal
import socket
import sys
import uuid


def get_free_port():
    with socket.socket() as s:
        s.bind(('', 0))
        return s.getsockname()[1]


def get_launch_argv():
    if hasattr(sys, '_MEIPASS'):
        return sys.argv[:1]
    else:
        return [sys.executable, *sys.argv]


def model_to_dict(model):
    if model:
        data = model.__dict__.copy()  # type: dict
        data.pop('_sa_instance_state')
        return data


def generate_uuid():
    return str(uuid.uuid4())


def md5(content: str):
    return hashlib.md5(content.encode()).hexdigest()


def obj_standard(obj, str_key=False, str_obj=False, str_type=False):
    kwargs = locals().copy()
    kwargs.pop('obj')

    this = lambda x: obj_standard(x, **kwargs)
    if type(obj) in [bool, int, float, str, type(None)]:
        return obj
    elif isinstance(obj, bytes):
        return base64.b64encode(obj).decode()
    elif isinstance(obj, list) or isinstance(obj, tuple):
        return [this(i) for i in obj]
    elif isinstance(obj, dict):
        return {str(k) if str_key else this(k): this(v) for k, v in obj.items()}
    elif isinstance(obj, type) and str_type:
        return obj.__name__
    else:
        return str(obj) if str_obj else obj


def send_interrupt(pid):
    if platform.system() == 'Windows':
        ctypes.windll.kernel32.GenerateConsoleCtrlEvent(0, pid)
    else:
        os.kill(pid, signal.SIGINT)


def get_platform_system():
    return os.environ.get('PLATFORM') or platform.system()
