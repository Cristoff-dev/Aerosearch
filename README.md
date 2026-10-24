# AeroSearch

> High-performance hybrid search engine combining lexical search, vector similarity search, and low-latency cache-aside indexing in a modern pnpm monorepo.

## 🏗 Architecture Overview

AeroSearch is structured as a full-stack monorepo that unifies keyword precision and AI semantic retrieval:

```text
aerosearch/
├── apps/
│   ├── api/       # Express 5 + Node.js backend (pgvector, Typesense, Redis, HuggingFace)
│   └── web/       # Next.js 16 (React 19) frontend (Search Omnibox, Route Handler proxy)
├── packages/
│   └── shared/    # Shared TypeScript types, schemas, and API contracts
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

### Component Stack
- **Web Client (`apps/web`)**: Next.js 16 App Router interface featuring a command-palette Search Omnibox (`Cmd+K`), semantic search toggle, and server-side Route Handler proxy.
- **API Engine (`apps/api`)**: Node.js & Express 5 service managing dual-write pipelines, embeddings generation, vector ranking, and cache invalidation.
- **Lexical Search (Typesense)**: In-memory typo-tolerant full-text search engine for fast sub-millisecond keyword lookups.
- **Semantic Vector Search (pgvector)**: PostgreSQL extension storing 768-dimensional product embeddings generated via `all-mpnet-base-v2`.
- **Cache-Aside Layer (Redis)**: High-speed caching for hot query results with automated cache eviction on record mutation.

## 🚀 Prerequisites

Ensure the following tools are installed on your workstation:
- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0` (v12 recommended)
- **Docker & Docker Compose**: For PostgreSQL (pgvector), Redis, and Typesense services.

## ⚙️ Quick Start

### 1. Start Infrastructure Services

Spin up PostgreSQL (with pgvector extension), Redis, and Typesense:

```bash
docker compose up -d
```

### 2. Configure Environment

Copy the example environment variables for the API:

```bash
cp apps/api/.env.example apps/api/.env
```

### 3. Install Dependencies

Install workspace dependencies from the root directory:

```bash
pnpm install
```

### 4. Initialize & Seed Database

Execute Prisma schema push and seed scripts using the explicit path filter:

```bash
pnpm --filter ./apps/api exec prisma db push
pnpm --filter ./apps/api exec tsx prisma/seed.ts
```

### 5. Run Development Servers

Run all workspace applications in parallel:

```bash
pnpm dev
```

Or run services individually:

```bash
# Start API backend (http://localhost:3000)
pnpm dev:api

# Start Web frontend (http://localhost:3001)
pnpm dev:web
```

## 📦 Monorepo Workspace Scripts

| Command | Description |
|---|---|
| `pnpm install` | Installs dependencies across all apps and packages |
| `pnpm dev` | Starts API and Web development servers concurrently |
| `pnpm dev:api` | Starts only the Express API (`apps/api`) |
| `pnpm dev:web` | Starts only the Next.js frontend (`apps/web`) |
| `pnpm --filter ./apps/<app> <command>` | Executes a specific command isolated to a target workspace package |

## 🔄 CI/CD & Docker

The repository includes a fully automated GitHub Actions pipeline (`ci.yml`) triggered on `push` and `pull_request` to `main` and `develop`. 

1. **Build and Test**: Validates the monorepo via isolated Docker infrastructure, runs Prisma migrations, and executes Jest E2E tests ensuring ESM compatibility.
2. **Publish Image**: Builds a highly-optimized Docker image for the API using Buildx cache and pushes it securely to the **GitHub Container Registry (GHCR)** (`ghcr.io/cristoff-dev/aerosearch/aerosearch-api`).