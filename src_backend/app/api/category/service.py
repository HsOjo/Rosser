from app.api.base.service import BaseService
from .models import Category


class CategoryService(BaseService):
    model_cls = Category
