# syntax=docker/dockerfile:1
FROM node:20-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

# Copy workspace root configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all workspace packages (required for pnpm lockfile validation).
# mobile doesn't depend on frontend, but the lockfile was generated with the full workspace.
COPY src/shared ./src/shared
COPY src/frontend ./src/frontend
COPY src/mobile ./src/mobile

# Remove unrelated workspace packages from this build's scope.
RUN sed -i '/- "src\/frontend"/d' pnpm-workspace.yaml

# Install only mobile and its dependencies
RUN pnpm --filter @rosser/mobile... install --frozen-lockfile

# Build shared package first
RUN pnpm --filter @rosser/shared build

# Build the mobile H5 app
RUN pnpm --filter @rosser/mobile build

# Production stage: serve the static build with nginx
FROM nginx:alpine

COPY --from=builder /app/src/mobile/dist /usr/share/nginx/html
COPY src/mobile/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
