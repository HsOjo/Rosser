from flask import request
from flask_wtf import FlaskForm
from wtforms import IntegerField, FieldList
from wtforms_json import flatten_json, MultiDict


class JSONForm(FlaskForm):
    def __init__(self, formdata=None, **kwargs):
        if not formdata:
            formdata = request.get_json()
            if formdata:
                formdata = MultiDict(flatten_json(self.__class__, formdata))

        super().__init__(formdata, **kwargs)


class PaginateForm(JSONForm):
    page = IntegerField('页号', default=1)
    per_page = IntegerField('每页数量', default=10)


class MutipleItemsForm(JSONForm):
    ids = FieldList(IntegerField('ID'))
