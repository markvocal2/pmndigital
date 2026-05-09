# pmndigital

Monorepo for the `main-pmndigital` stack hosted at https://pmndigital.co

## Architecture

- `frontend/` — Next.js 16 (App Router) + Prisma 7 + Tailwind 4
- `backend/` — NestJS 11 + TypeORM
- `compose/` — production docker-compose (image refs to GHCR)
- `.github/workflows/` — CI (lint/test/build) + Deploy (build, push to GHCR, trigger Komodo webhook)

Frontend serves `pmndigital.co` and `www.pmndigital.co`. Caddy path-routes `/api/*` to the NestJS backend.

## Schema authority

**Prisma (frontend) owns the database schema.** All DDL changes go through `prisma migrate`.
TypeORM in the backend uses entities as **read-only mappings** of Prisma-managed tables:
- `synchronize: false`
- `migrationsRun: false`

A CI guard fails the build if `backend/src/migrations/` gains files.

## CI/CD flow

```
push → CI (lint, typecheck, test) → main only → build images on Actions
     → ghcr.io/markvocal2/pmndigital-{backend,frontend}:sha-<commit> + :latest
     → curl Komodo webhook (X-Komodo-Webhook-Secret)
     → Komodo: docker compose pull && up -d
```

## Local dev

```bash
# frontend
cd frontend && npm install && npm run dev

# backend
cd backend && npm install && npm run start:dev
```

## Production deploy

Push to `main` → GitHub Actions handles everything. Rollback = edit `BACKEND_TAG` / `FRONTEND_TAG` in `/opt/docker/main-pmndigital/.env` on the VPS and re-trigger the Komodo webhook.

## Secrets

Runtime secrets live in `/opt/docker/main-pmndigital/.env` on the VPS (gitignored, root-owned, 600).
Never commit `.env` or hardcode credentials in `compose/docker-compose.yml`.
<!-- pipeline verified 2026-05-09T04:09:27Z -->
