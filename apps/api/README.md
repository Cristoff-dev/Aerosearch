# AeroSearch API (`apps/api`)

Backend API service for AeroSearch, providing hybrid search retrieval (lexical + dense vector search), dual-write synchronization, and Redis caching.

## 🛠 Tech Stack

- **Runtime**: Node.js `>= 20` (ESM native)
- **Framework**: Express 5
- **ORM / Database**: Prisma ORM & PostgreSQL with `pgvector`
- **Search Engine**: Typesense
- **In-Memory Cache**: Redis
- **Embedding Model**: `Xenova/all-mpnet-base-v2` via `@huggingface/transformers`

## 🔐 Environment Variables

Create a `.env` file inside `apps/api/` based on `.env.example`:

```ini
# Server Configuration
PORT=3000
NODE_ENV=development

# PostgreSQL Database (with pgvector support)
DATABASE_URL="postgresql://user:password@localhost:5432/aerosearch?schema=public"

# Redis Cache
REDIS_URL="redis://localhost:6379"

# Typesense Search Engine
TYPESENSE_URL="http://localhost:8108"
TYPESENSE_API_KEY="your_typesense_api_key_here"
```

## 🧠 AI Embeddings: `all-mpnet-base-v2`

Vector embeddings are generated using `@huggingface/transformers` in-process using ONNX Runtime:
- **Model**: `Xenova/all-mpnet-base-v2`
- **Quantization**: `q8` (quantized 8-bit for fast CPU inference and lower memory usage)
- **Dimension**: 768-dimensional dense vector embeddings
- **Pooling & Normalization**: `mean` pooling with L2 normalization (`normalize: true`)

Embeddings are initialized lazily upon first request or preheated during application bootstrap and database seeding.

## 🗄️ Database Setup & pgvector Seeding

1. **Generate Prisma Client**:
   ```bash
   pnpm prisma generate
   ```

2. **Push Database Schema**:
   ```bash
   pnpm prisma db push
   ```

3. **Execute pgvector & Typesense Seed**:
   ```bash
   pnpm dlx tsx prisma/seed.ts
   ```

### What `prisma/seed.ts` does:
- Loops through standard enterprise demo catalog items (laptops, monitors, networking gear).
- Computes 768-dimensional vector embeddings for each record using `EmbeddingService` (`Xenova/all-mpnet-base-v2`).
- Upserts product records into PostgreSQL and updates the vector column via raw SQL:
  ```sql
  UPDATE "products" SET "embedding" = $vector::vector WHERE "id" = $id;
  ```
- Dual-writes and synchronizes the catalog into the Typesense collection schema for fast typo-tolerant lexical searching.

## 🧪 Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Starts development server with hot reload (`tsx watch src/server.ts`) |
| `pnpm build` | Compiles production TypeScript via `tsconfig.build.json` |
| `pnpm start` | Runs compiled production server (`node dist/server.js`) |
| `pnpm test` | Executes Jest test suite using experimental ESM VM modules |
| `pnpm test:watch` | Runs Jest in watch mode for development |
| `pnpm test:coverage` | Runs Jest test suite and generates coverage reports |
| `pnpm test:ci` | Runs Jest in CI mode with single thread and open handles detection |