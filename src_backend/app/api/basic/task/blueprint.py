from .service import TaskService
from ...base.curd_blueprint import CurdBlueprint


class Blueprint(CurdBlueprint):
    service_class = TaskService


blueprint = Blueprint('task', __name__)
