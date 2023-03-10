from flask import Blueprint, jsonify

blueprint = Blueprint('test', __name__, url_prefix='/test')


@blueprint.route('', methods=['GET', 'POST'])
@blueprint.route('/', methods=['GET', 'POST'])
def index():
    return jsonify(dict(test=123))
