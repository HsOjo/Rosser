from .forms import AddForm, EditForm
from .models import Category
from ..base.blueprint import BaseBlueprint


class Blueprint(BaseBlueprint):
    model_class = Category
    add_form_class = AddForm
    edit_form_class = EditForm


blueprint = Blueprint('category', __name__, url_prefix='/category')
