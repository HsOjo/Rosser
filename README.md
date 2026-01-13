# Rosser

一个基于 Electron + Vue 3 + Flask 的 RSS 阅读器桌面应用。

## 技术栈

**前端**
- Vue 3 (Composition API) + TypeScript
- Vite 4
- Electron 22
- Ant Design Vue 3
- Vuex 4

**后端**
- Flask + SQLAlchemy
- SQLite
- Celery + Gevent (异步任务)
- Flask-SocketIO

## 已实现功能

- [x] 订阅源管理 (增删改查)
- [x] 分类管理
- [x] 站点管理 (自动抓取 favicon、标题)
- [x] 文章列表展示 (分页加载、无限滚动)
- [x] 文章详情查看 (原文模式 / 文章模式)
- [x] 文章状态管理 (已读、星标、隐藏)
- [x] 高级筛选与多维度排序
- [x] OPML 导入导出
- [x] 全局进度条
- [x] 图片本地化缓存
- [x] 多平台支持 (macOS、Windows、Linux)
- [x] 新文章推送通知
- [x] 定时自动抓取订阅
- [x] 全文搜索 (文章标题检索)
- [x] 用户偏好设置 (深浅色主题、字体大小)
- [x] Electron 增强 (应用菜单、快捷键)
- [x] 性能优化 (响应缓存)
- [x] 标签系统 (简化版 - 收藏/隐藏标签显示)
- [x] 国际化支持 (中文/英文切换)
- [x] 订阅编辑功能 (支持修改订阅信息)

## 待完善功能

| 优先级 | 功能 | 说明 |
|--------|------|------|
| 中 | WebSocket 实时推送 | 利用已集成的 SocketIO 推送任务状态和新文章 |

## 开发

```bash
# 前端
npm install
npm run dev

# 后端
pip install -r src_backend/requirements.txt
python src_backend/main.py serve
```

## 构建

```bash
npm run build
npm run package
```
