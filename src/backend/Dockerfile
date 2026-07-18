FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY src/backend/pyproject.toml src/backend/uv.lock ./
RUN touch README.md && \
    pip install uv && \
    uv sync --no-dev

COPY src/backend/app ./app
COPY src/backend/alembic ./alembic
COPY src/backend/alembic.ini ./
COPY src/backend/scripts/docker-entrypoint.sh ./docker-entrypoint.sh
COPY VERSION ./

RUN chmod +x ./docker-entrypoint.sh

ENV ROSSER_HOST=0.0.0.0
ENV ROSSER_PORT=8000

EXPOSE 8000

CMD ["./docker-entrypoint.sh"]
