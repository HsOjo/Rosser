import base64

from app import db
from app.api.base.models import BaseModel


class File(BaseModel):
    hash = db.Column(db.String, index=True)
    extension = db.Column(db.String, index=True)
    url = db.Column(db.String)
    data = db.Column(db.String)  # type: str

    @property
    def raw_data(self):
        if self.data:
            return base64.b64decode(self.data.encode())


