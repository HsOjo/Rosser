from flask import request
from flask_sqlalchemy.query import Query
from flask_wtf import FlaskForm
from sqlalchemy import desc, asc
from wtforms import Field, FormField
from wtforms import IntegerField, FieldList, Form, StringField
from wtforms.validators import DataRequired
from wtforms_json import flatten_json, MultiDict


class DataField(Field):
    def process_formdata(self, valuelist:list):
        setattr(self, 'data', valuelist.pop() if valuelist else None)


class JSONForm(FlaskForm):
    def __init__(self, formdata=None, **kwargs):
        if not formdata:
            formdata = request.get_json(silent=True)
            if formdata:
                formdata = MultiDict(flatten_json(self.__class__, formdata))

        super().__init__(formdata, **kwargs)


class FieldOperateForm(Form):
    field = StringField(validators=[DataRequired()])
    operate = StringField(validators=[DataRequired()])
    value = DataField()


class QueryForm(JSONForm):
    # 定义操作符及其对应的函数
    OPERATORS = {
        'eq': ('__eq__', None),  # 等于
        'ne': ('__ne__', None),  # 不等于
        'lt': ('__lt__', None),  # 小于
        'le': ('__le__', None),  # 小于等于
        'gt': ('__gt__', None),  # 大于
        'ge': ('__ge__', None),  # 大于等于
        'like': ('like', lambda x: f'%{x}%'),  # 相似于
        'ilike': ('ilike', lambda x: f'%{x.lower()}%'),  # 忽略大小写相似于
        'in': ('in_', lambda x: [int(v) for v in x] if isinstance(x, list) else [int(x)]),  # 在列表中
        'not_in': ('notin_', lambda x: [int(v) for v in x] if isinstance(x, list) else [int(x)]),  # 不在列表中
    }

    filters = FieldList(FormField(FieldOperateForm))
    orders = FieldList(FormField(FieldOperateForm))

    def query_func(self, query: Query, model_cls=None):
        # 应用筛选条件
        for filter in self.filters:
            field, operate, value = filter.field.data, filter.operate.data, filter.value.data
            if operate not in self.OPERATORS:  # 如果操作符不在 OPERATORS 字典中，则忽略此条件
                continue
            func_name, value_transformer = self.OPERATORS[operate]
            field_obj = getattr(model_cls, field)

            if func_name:
                if value_transformer:
                    value = value_transformer(value)
                query = query.filter(getattr(field_obj, func_name)(value))

        # 应用排序条件
        for order in self.orders:
            field, operate = order.field.data, order.operate.data
            if operate == 'desc':  # 降序排序
                query = query.order_by(desc(getattr(model_cls, field)))
            elif operate == 'asc':  # 升序排序
                query = query.order_by(asc(getattr(model_cls, field)))

        return query


class MutipleItemsForm(JSONForm):
    ids = FieldList(IntegerField('ID'))
