from io import BytesIO

from flask import Blueprint, jsonify, abort, send_file
from opyml import OPML

from .forms import FileForm
from .models import File
from ..category.models import Category
from ..subscription.models import Subscription
from ... import db

blueprint = Blueprint('basic', __name__, url_prefix='/basic')


@blueprint.route('/import-opml', methods=['POST'])
def import_opml():
    form = FileForm()
    if not form.validate():
        abort(401)

    with open(form.path.data) as io:
        opml_str = io.read()

    opml = OPML.from_xml(opml_str)
    for category_outline in opml.body.outlines:
        category = Category.query.filter(Category.title == category_outline.title).first()
        if not category:
            category = Category(
                title=category_outline.title,
                description=category_outline.text,
            )
            db.session.add(category)
            db.session.commit()

        for subscription_outline in category_outline.outlines:
            if subscription_outline.type != 'rss' or Subscription.query.filter(
                    Subscription.category_id == category.id,
                    Subscription.url == subscription_outline.xml_url,
            ).count():
                continue

            subscription = Subscription(
                category_id=category.id,
                title=subscription_outline.title,
                description=subscription_outline.text,
                url=subscription_outline.xml_url,
            )
            db.session.add(subscription)
            db.session.commit()

    # Todo: 重构

    return jsonify(dict(finished=1))


@blueprint.route('/export-opml', methods=['POST'])
def export_opml():
    form = FileForm()
    if not form.validate():
        abort(401)

    opml = OPML()
    categories = Category.query.all()
    no_category_subscriptions = Subscription.query.filter(Subscription.category_id == None).all()

    # Todo

    return jsonify(dict(finished=1))


@blueprint.route('/file/<int:id>')
def file(id: int):
    file = File.query.get(id)
    with BytesIO(file.raw_data) as io:
        return send_file(io, as_attachment=True, download_name=f'{file.id}{file.extension}')
