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

## 待完善功能

| 优先级 | 功能 | 说明 |
|--------|------|------|
| ~~高~~ | ~~通知功能~~ | ~~已完成~~ - 新文章推送通知、通知列表显示 |
| ~~高~~ | ~~自动刷新~~ | ~~已完成~~ - 可配置刷新间隔，定时自动抓取订阅 |
| 中 | 全文搜索 | 文章标题、内容的全文检索 |
| 中 | 用户偏好设置 | 主题切换、字体大小、快捷键配置 |
| 中 | WebSocket 实时推送 | 利用已集成的 SocketIO 推送任务状态和新文章 |
| 低 | 标签系统 | 自定义标签，替代固定的星标/隐藏状态 |
| 低 | 离线模式 | 完善断网场景下的阅读体验 |
| 低 | Electron 增强 | 应用菜单、全局快捷键、自动更新 |
| 低 | 性能优化 | 大数据集渲染优化、响应缓存 |

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
