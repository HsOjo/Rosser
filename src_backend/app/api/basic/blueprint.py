from typing import Union

from flask import jsonify, abort
from opyml import OPML, Outline, Body

from . import file, task, notification, settings
from .forms import FileForm
from ..base.blueprint import BaseBlueprint
from ..category.models import Category
from ..category.service import CategoryService
from ..subscription.models import Subscription
from ..subscription.service import SubscriptionService

blueprint = BaseBlueprint('basic', __name__)
blueprint.register_blueprint(file.blueprint)
blueprint.register_blueprint(task.blueprint)
blueprint.register_blueprint(notification.blueprint)
blueprint.register_blueprint(settings.blueprint)


@blueprint.route('/import-opml', methods=['POST'])
def import_opml():
    form = FileForm()
    if not form.validate():
        abort(401)

    with open(form.path.data) as io:
        opml_str = io.read()

    cs = CategoryService()
    ss = SubscriptionService()
    opml = OPML.from_xml(opml_str)

    def outline_scan(outline: 'Union[Outline, Body]', depth=0, category=None):
        if getattr(outline, 'type', None) == 'rss':
            if not ss.count(Subscription.category_id == category.id, Subscription.url == outline.xml_url):
                ss.add(
                    category_id=getattr(category, 'id', None),
                    title=outline.title,
                    description=outline.text,
                    url=outline.xml_url,
                )
        else:
            if depth:
                category = cs.get_by_field(Category.title, outline.title)
                if not category:
                    category = cs.add(title=outline.title, description=outline.text)

            for sub_outline in outline.outlines:
                outline_scan(sub_outline, depth=depth + 1, category=category)

    outline_scan(opml.body)

    return jsonify(dict(finished=1))


@blueprint.route('/export-opml', methods=['POST'])
def export_opml():
    form = FileForm()
    if not form.validate():
        abort(401)

    opml = OPML()
    cs = CategoryService()
    for category in cs.all():
        category: Category
        outline = Outline(title=category.title, text=category.description)
        for subscription in category.subscriptions:
            subscription: Subscription
            outline.outlines.append(Outline(
                title=subscription.title,
                text=subscription.description,
                xml_url=subscription.url,
                type='rss',
            ))
        opml.body.outlines.append(outline)

    with open(form.path.data, 'w') as io:
        io.write(opml.to_xml())

    return jsonify(dict(finished=1))
