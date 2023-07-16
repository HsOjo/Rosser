from .forms import BodyForm
from .service import CategoryService
from ..base.curd_blueprint import CurdBlueprint


class Blueprint(CurdBlueprint):
    service_class = CategoryService
    body_form_class = BodyForm


blueprint = Blueprint('category', __name__)
