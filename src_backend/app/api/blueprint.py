from flask import Blueprint

from . import test

blueprint = Blueprint('api', __name__, url_prefix='/api')
blueprint.register_blueprint(test.blueprint)
