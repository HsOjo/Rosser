from flask import Blueprint

from . import basic, category, subscription

blueprint = Blueprint('api', __name__, url_prefix='/api')
blueprint.register_blueprint(basic.blueprint)
blueprint.register_blueprint(category.blueprint)
blueprint.register_blueprint(subscription.blueprint)
