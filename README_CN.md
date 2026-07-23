# Rosser

Rosser 是一款可自托管、跨平台使用的 RSS 阅读器。它在同一后端下提供桌面客户端、移动端 H5 与统一 Web 入口，让你可以在自己的基础设施上订阅与阅读资讯。

[English](README.md) | 中文

![Rosser icon](src/frontend/src-tauri/icons/128x128@2x.png)

## 架构

- **后端**：FastAPI + SQLAlchemy（异步） + SQLite + Alembic + APScheduler
- **桌面端**：Tauri + Vue3 + Vite + Naive UI
- **移动端**：Vue3 + Vite + Tailwind CSS + Pinia + Vue Router + Vue I18n（仅 H5，远程模式）
- **共享包**：TypeScript monorepo 包，通过 OpenAPI 生成类型

## 开发

### 前置要求

- [uv](https://docs.astral.sh/uv/)（Python 3.12+）
- [pnpm](https://pnpm.io/) 9+
- [Node.js](https://nodejs.org/) 20+

### 初始化

```bash
# 安装依赖
pnpm install
cd src/backend && uv sync --extra dev

# 同时启动所有服务（后端 + 前端 + 移动端）
pnpm dev
```

### 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 同时启动后端、前端和移动端 |
| `pnpm dev:backend` | 仅启动 FastAPI 后端 |
| `pnpm dev:frontend` | 启动桌面端前端（Vite 开发服务器） |
| `pnpm dev:mobile` | 启动移动端前端（Vite 开发服务器） |
| `pnpm gen:api` | 根据后端重新生成 OpenAPI 类型 |
| `pnpm build` | 构建所有前端包 |

### 后端

```bash
cd src/backend
uv run python -m app.main
```

API 文档地址：`http://127.0.0.1:8000/docs`

### 桌面端（远程模式）

```bash
pnpm --filter @rosser/frontend dev:vite
```

### 移动端

```bash
# 开发服务器
pnpm --filter @rosser/mobile dev

# 单元测试
pnpm --filter @rosser/mobile test

# E2E 测试
pnpm --filter @rosser/mobile test:e2e
```

## 部署

### Docker

项目根目录包含一份全栈 `docker-compose.yml`，同时启动后端、前端（Web 远程模式）、移动端 H5 以及一个可选的统一接入代理：

```bash
cp .env.example .env
# 编辑 .env，至少修改 ROSSER_TOKEN
docker compose up -d
```

部署完成后：

- 后端 API：`http://localhost:8000`
- 前端独立入口：`http://localhost:8001`
- 移动端 H5 独立入口：`http://localhost:8002`
- 统一接入点（根据 UA 自动分发前端/移动端）：`http://localhost:8003`

统一接入点规则：

- `/api/*` → 后端 API
- `/ws` → 后端 WebSocket
- `/` 及静态资源 → 桌面端 UA 走前端，移动端 UA 走移动端

首次使用前端或移动端时，在连接设置中填写后端地址 `http://localhost:8000` 和 `ROSSER_TOKEN`；若通过统一接入点 `http://localhost:8003` 访问，也可以将后端地址设为 `http://localhost:8003`（API 请求会自动被代理到后端）。

> 后端的数据与文件持久化使用项目根目录的 `./data` 和 `./storage` 目录卷，容器重建或升级后不会丢失。

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `ROSSER_TOKEN` | `dev-token-change-me` | 认证使用的 Bearer Token |
| `ROSSER_HOST` | `0.0.0.0` | 后端绑定地址 |
| `ROSSER_PORT` | `8000` | 后端监听端口 |
| `ROSSER_DATA_DIR` | `~/.rosser/data` | SQLite 数据库目录 |
| `ROSSER_STORAGE_DIR` | `~/.rosser/storage` | 文件存储目录 |
| `ROSSER_RELOAD` | `0` | 开发时设为 `1`/`true` 开启自动重载 |
| `ROSSER_CORS_ORIGINS` | `http://localhost:8001,...` | 允许的 CORS 来源 |
| `ROSSER_FRONTEND_PORT` | `8001` | 前端独立入口宿主机端口 |
| `ROSSER_MOBILE_PORT` | `8002` | 移动端 H5 独立入口宿主机端口 |
| `ROSSER_PROXY_PORT` | `8003` | 统一接入点宿主机端口 |

## 许可证

GPL-3.0
