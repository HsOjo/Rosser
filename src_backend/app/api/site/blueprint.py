from .models import Site
from ..base.blueprint import BaseBlueprint


class Blueprint(BaseBlueprint):
    model_class = Site


blueprint = Blueprint('site', __name__, url_prefix='/site')
