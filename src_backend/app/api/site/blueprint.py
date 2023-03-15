from .service import SiteService
from ..base.blueprint import BaseBlueprint


class Blueprint(BaseBlueprint):
    service_class = SiteService


blueprint = Blueprint('site', __name__, url_prefix='/site')
