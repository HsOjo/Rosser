FROM node:20-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

# Copy workspace root configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package manifests only for the packages involved in this build.
# This layer is cached unless package.json or the lockfile changes.
COPY src/shared/package.json ./src/shared/package.json
COPY src/mobile/package.json ./src/mobile/package.json

# Remove unrelated workspace packages from this build's scope.
RUN sed -i '/- "src\/frontend"/d' pnpm-workspace.yaml

# Install only mobile and its dependencies.
# Because source files are not yet copied, dependency install is cached across
# source-only changes.
RUN pnpm --filter @rosser/mobile... install --frozen-lockfile

# Copy source files after dependencies are installed to maximize cache hits.
COPY src/shared ./src/shared
COPY src/mobile ./src/mobile

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
