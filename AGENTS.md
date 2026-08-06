# YakinLulus.id — Agent Guidelines

> For AI coding agents (Antigravity, OpenCode, etc.). Read `guardrail.md` too — it is
> the authoritative safety policy and takes precedence.

## Mission

This repo is **backend-first**. Your ONLY job is to build the frontend inside the
`frontend/` directory. Everything else is protected, read-only, or strictly forbidden.

## Scope

| Area | Mode |
|------|------|
| `frontend/**` | **WRITE** — create, edit, delete freely (frontend is built from scratch here) |
| `backend/**` | READ-ONLY — read code to understand endpoints/schemas; NEVER write |
| `docs/frontend/API-contract.md` | READ-ONLY — source of truth for all endpoints |
| `docs/frontend/PAGE-WIRING.md` | READ-ONLY — page structure per role |
| `backend/openapi.yaml` | READ-ONLY — API spec |
| `README.md`, `AGENTS.md`, `guardrail.md`, `.gitignore` | READ-ONLY |

## Hard Rules

1. **NEVER modify, delete, rename, move, or refactor anything in `backend/`.** No
   exceptions, no "helpful" cleanup, no matter how broken it looks.
2. **NEVER run** `go run ./cmd/migrate*`, `go run ./cmd/reset_db*`, `go run ./cmd/seed*`,
   or any SQL against the database.
3. NEVER modify `docs/` or root config files.
4. NEVER stage, commit, or push files outside `frontend/`. If your git diff contains any
   non-`frontend/` change, STOP and ask the user.
5. The backend is the contract — the frontend conforms to it, never the reverse. If you
   need a backend/API change, report it to the user and stop; do not make it yourself.

## Frontend Stack

- React + TypeScript + Vite, TanStack Query for server state, Tailwind.
- Base URL: `http://localhost:8080/api/v1` (from `docs/frontend/ANTIGRAVITY-SETUP.md`).
- Auth: Bearer JWT; refresh via `/auth/refresh`.
- Build pages per `docs/frontend/PAGE-WIRING.md` using the endpoints in
  `docs/frontend/API-contract.md`.
