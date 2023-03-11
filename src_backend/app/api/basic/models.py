import base64

from app import db


class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hash = db.Column(db.String, index=True)
    extension = db.Column(db.String, index=True)
    url = db.Column(db.String)
    data = db.Column(db.String)  # type: str

    @property
    def raw_data(self):
        return base64.b64decode(self.data.encode())
