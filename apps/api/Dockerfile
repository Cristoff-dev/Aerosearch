FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable

FROM base AS development
WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY . .

RUN pnpm install --frozen-lockfile --ignore-scripts

WORKDIR /usr/src/app/apps/api
RUN pnpm dlx prisma@7.10.0 generate
RUN pnpm run build

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]

FROM base AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY . .

RUN pnpm install --prod --frozen-lockfile --ignore-scripts

WORKDIR /usr/src/app/apps/api
RUN pnpm dlx prisma@7.10.0 generate

WORKDIR /usr/src/app
RUN chown -R node:node /usr/src/app

WORKDIR /usr/src/app/apps/api
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]