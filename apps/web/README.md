# AeroSearch Web (`apps/web`)

Modern Next.js 16 frontend interface for AeroSearch, featuring a keyboard-first Search Omnibox and a secure Route Handler backend proxy.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **State & Data Fetching**: TanStack React Query v5
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 🚀 Next.js Setup & Getting Started

### 1. Environment Configuration

Create a `.env.local` file inside `apps/web/`:

```ini
BACKEND_API_URL=http://localhost:3000
BACKEND_API_KEY=your_secret_api_key_here
```

### 2. Install & Run

From either the monorepo root or the `apps/web` directory:

```bash
# From workspace root
pnpm --filter ./apps/web dev

# Or inside apps/web
pnpm dev
```

The application will start on **`http://localhost:3001`**.

## 🔍 Search Omnibox Component (`SearchOmnibox.tsx`)

Located at `src/components/SearchOmnibox.tsx`, the Omnibox provides an interactive spotlight-style search experience:

- **Global Keyboard Shortcuts**:
  - `Cmd + K` or `Ctrl + K`: Focuses and activates the search input from anywhere on the page.
  - `Escape`: Clears the query and blurs focus.
- **Debounced Fetching**: 250ms debounce window before executing queries to prevent redundant network requests.
- **Hybrid / Semantic Toggle**:
  - Default mode: Fast lexical full-text search against Typesense.
  - Semantic mode (`useSemantic=true`): AI vector similarity search powered by `pgvector`.
- **Smooth Animations**: Animated transitions for search results, empty states, and loading states powered by Framer Motion.

## 🛡️ Route Handler Proxy (`src/app/api/search/route.ts`)

The Next.js App Router Route Handler (`GET /api/search`) serves as a secure reverse proxy to the backend API:

### Architecture Benefits
1. **Secret Masking**: Injects private authentication tokens (`BACKEND_API_KEY` / `X-API-Key`) server-side without exposing credentials to browser client bundles.
2. **Topology Abstraction**: Shield internal microservice URLs (`BACKEND_API_URL`) from external clients.
3. **Cache Policy Control**: Enforces `cache: 'no-store'` on upstream requests to maintain consistent real-time cache invalidation across client queries.

### Request Flow
```text
Client (Browser)
   │
   ▼ GET /api/search?q=laptop&useSemantic=true
Next.js Route Handler Proxy (apps/web)
   │ (Appends X-API-Key & forwards query parameters)
   ▼ GET http://localhost:3000/api/v1/search?q=laptop&useSemantic=true
Express API (apps/api)
```

## 🧪 Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Starts the Next.js development server on port 3001 |
| `pnpm build` | Creates an optimized production build |
| `pnpm start` | Starts the compiled production server |
| `pnpm lint` | Runs ESLint to check for code issues |