from .forms import BodyForm
from .service import CategoryService
from ..base.blueprint import BaseBlueprint


class Blueprint(BaseBlueprint):
    service_class = CategoryService
    body_form_class = BodyForm


blueprint = Blueprint('category', __name__, url_prefix='/category')
