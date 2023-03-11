import os

from flask import Flask


def create_app():
    from app import api, cors, socket_io, db, migrate, celery
    db_path = os.path.join(os.path.abspath('data'), 'rosser.db')

    app = Flask(__name__, static_url_path='/')
    app.config['WTF_CSRF_ENABLED'] = False
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.register_blueprint(api.blueprint)

    cors.init_app(app, origins=['*'])
    socket_io.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db)
    celery.init_app(app)

    return app
