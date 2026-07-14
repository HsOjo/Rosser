# Rosser

Rosser is an RSS reader rebuilt with modern technologies.

![Rosser icon](src/frontend/src-tauri/icons/128x128@2x.png)

## Architecture

- **Backend**: FastAPI + SQLAlchemy(async) + SQLite + Alembic + APScheduler
- **Desktop**: Tauri + Vue3 + Vite + Naive UI
- **Mobile**: Vue3 + Vite + Tailwind CSS + Pinia + Vue Router + Vue I18n (H5, remote only)
- **Shared**: TypeScript monorepo package with OpenAPI-generated types

## Development

### Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python 3.12+)
- [pnpm](https://pnpm.io/) 9+
- [Node.js](https://nodejs.org/) 20+

### Setup

```bash
# Install dependencies
pnpm install
cd src/backend && uv sync --extra dev

# Start everything (backend + frontend + mobile)
pnpm dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start backend, frontend, and mobile concurrently |
| `pnpm dev:backend` | Start FastAPI backend only |
| `pnpm dev:frontend` | Start desktop frontend (Vite dev server) |
| `pnpm dev:mobile` | Start mobile frontend (Vite dev server) |
| `pnpm gen:api` | Regenerate OpenAPI types from backend |
| `pnpm build` | Build all frontend packages |

### Backend

```bash
cd src/backend
uv run python -m app.main
```

API docs available at `http://127.0.0.1:8000/docs`.

### Desktop (Remote Mode)

```bash
pnpm --filter @rosser/frontend dev:vite
```

### Mobile

```bash
# Development server
pnpm --filter @rosser/mobile dev

# Unit tests
pnpm --filter @rosser/mobile test

# E2E tests
pnpm --filter @rosser/mobile test:e2e
```

## Deployment

### Docker

```bash
cd src/backend
docker compose up -d
```

Set `ROSSER_TOKEN` and optionally `ROSSER_CORS_ORIGINS` in environment or `.env` file.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ROSSER_TOKEN` | `dev-token-change-me` | Bearer token for authentication |
| `ROSSER_HOST` | `127.0.0.1` | Bind address |
| `ROSSER_PORT` | `8000` | Listen port |
| `ROSSER_DATA_DIR` | `~/.rosser/data` | SQLite database directory |
| `ROSSER_STORAGE_DIR` | `~/.rosser/storage` | File storage directory |
| `ROSSER_RELOAD` | `0` | Set to `1`/`true` to enable auto-reload (development only) |
| `ROSSER_CORS_ORIGINS` | `http://localhost,...` | Allowed CORS origins |

## License

GPL-3.0
