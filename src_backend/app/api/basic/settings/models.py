from app import db
from app.api.base.models import BaseModel


class Settings(BaseModel):
    # 自动刷新间隔 (分钟), 0 表示禁用
    auto_refresh_interval = db.Column(db.Integer, default=30)
    # 主题: light / dark
    theme = db.Column(db.String(16), default='dark')
    # 字体大小 (px)
    font_size = db.Column(db.Integer, default=14)

    @classmethod
    def get_instance(cls):
        """获取或创建单例设置"""
        instance = cls.query.first()
        if not instance:
            instance = cls.create()
        return instance
