import functools

from app import db


def with_commit(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        res = func(*args, **kwargs)
        db.session.commit()
        return res

    return wrapper
