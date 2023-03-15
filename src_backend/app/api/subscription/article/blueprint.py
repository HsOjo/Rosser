from .service import ArticleService
from ...base.blueprint import BaseBlueprint


class Blueprint(BaseBlueprint):
    service_class = ArticleService


blueprint = Blueprint('article', __name__, url_prefix='/article')
