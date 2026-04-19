# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Full stack (Docker Compose)
make build && make up    # Build and start all services
make down                # Stop all services
make logs                # View logs
make proto               # Regenerate gRPC code from .proto files

# Frontend (from frontend/)
bun run dev              # Dev server on port 3000
bun run build            # Production build
bun run lint             # Biome lint
bun run lint:fix         # Biome auto-fix
```

## Architecture

Serverless function platform with database management UI. Four services orchestrated via Docker Compose:

```
Frontend (Next.js, :3000)
    ↓ HTTP/JSON
Gateway (Go/Gin, :8080)
    ├─→ gRPC → Functions Service (:50055)
    └─→ gRPC → Database Service (:50056)
                    ↓
              PostgreSQL (:5432)
```

**Functions Service** — CRUD for user-defined functions + execution in isolated Docker containers (Python, Node.js). Uses Docker SDK to run code in Alpine containers with timeout enforcement.

**Database Service** — Schema management (tables, columns) and row CRUD against user databases. Exposes SQL execution via gRPC.

**Gateway** — REST-to-gRPC translator. All frontend API calls go through here.

Each Go service follows: `model/` → `repository/` → `usecase/` → `server/` → `main.go`

## Key Paths

- `proto/` — Protocol Buffer definitions (source of truth for service contracts)
- `gen/` — Generated gRPC Go code (never edit manually, use `make proto`)
- `services/{functions,database,gateway}/` — Go microservices
- `frontend/src/lib/{functions,database}-api.ts` — Frontend API clients
- `frontend/src/features/` — Feature modules (functions, editor, auth, settings)
- `frontend/src/components/` — Shared UI components (shadcn)
- `db/init.sql` — Creates storage_db, functions_db, user_db

## Tech Stack

- **Backend**: Go 1.25, gRPC, Gin, GORM, Docker SDK
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Biome, shadcn/ui
- **Package manager**: Bun (frontend)
- **Database**: PostgreSQL 16 with GORM AutoMigrate

## Git Conventions

- Branch: `<prefix>/<issue-number>-<description>` (e.g., `feat/12-add-timeout`)
- Commit: `<prefix>: <message>` (e.g., `feat: add function execution timeout`)
- Prefixes: feat, fix, refactor, docs, chore, test
- PRs target `main`, include `Closes #N` for auto-close

## Environment

All config via docker-compose.yaml environment variables:
- `DATABASE_URL` — PostgreSQL connection (e.g., `postgres://dev:dev@postgres:5432/functions_db?sslmode=disable`)
- `FUNCTIONS_GRPC_ADDR` / `DATABASE_GRPC_ADDR` — gRPC service addresses
- `PORT` — Gateway HTTP port (default 8080)
