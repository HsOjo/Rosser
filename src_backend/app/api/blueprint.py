from . import basic, category, subscription, site
from .base.blueprint import BaseBlueprint

blueprint = BaseBlueprint('api', __name__)
blueprint.register_blueprint(basic.blueprint)
blueprint.register_blueprint(category.blueprint)
blueprint.register_blueprint(subscription.blueprint)
blueprint.register_blueprint(site.blueprint)
