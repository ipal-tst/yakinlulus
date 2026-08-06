# Guardrail.md

Version: 1.0

## Objective

This repository contains critical source code and documentation.

The AI agent (Antigravity/OpenCode) MUST ONLY perform operations explicitly requested by the user.

Default behavior is **read-only** unless modification is explicitly requested.

---

# ANTIGRAVITY SCOPE — FRONTEND ONLY (HARD RULE)

This repository is **backend-first**. The backend (`backend/`), database migrations,
API contract, and documentation are the **protected, immutable source of truth**.

Antigravity's ONLY job is to **build the frontend**. Everything else is off-limits.

## Write Scope (ALLOWED — create/edit/delete)

- `frontend/**` — Antigravity may freely create, edit, and delete files **only inside
  the `frontend/` directory** (the frontend is being built from scratch).

## Read-Only Scope (ALLOWED — read only, NEVER write)

- `backend/**` — may READ code to understand endpoints/schemas, NEVER write.
- `docs/frontend/API-contract.md`, `docs/frontend/PAGE-WIRING.md` — source of truth for
  endpoints and page structure. Read, follow, NEVER modify.
- `backend/openapi.yaml` — API spec. Read, NEVER modify.
- `design.md` — design system spec. Read, follow, NEVER modify.
- `README.md`, `AGENTS.md`, `guardrail.md`, `.gitignore` — read; never edit.

## Forbidden (STRICTLY NEVER — regardless of "helpfulness")

- **NEVER modify, delete, rename, move, or refactor ANY file inside `backend/`.**
  No exceptions. This includes Go code, migrations, `openapi.yaml`, config, tests,
  `go.mod`, `go.sum`.
- **NEVER run backend commands that mutate state:**
  `go run ./cmd/migrate*`, `go run ./cmd/reset_db*`, `go run ./cmd/seed*`, or any SQL
  against the database.
- NEVER modify `docs/` (any file), migrations, or root config files.
- NEVER "optimize", "clean up", or "fix" anything outside `frontend/` even if it looks
  broken, outdated, or incorrect.
- NEVER commit, stage, or push files outside `frontend/`. If a git diff contains any
  non-`frontend/` change, STOP and ask.

## The One-Way Gate

> If a change is needed outside `frontend/`, Antigravity does NOT make it. It must
> report the need to the user and stop. The user will handle backend/API changes.

The backend is the contract. The frontend must conform to it — never the reverse.

---

# Core Principles

1. Never assume.
2. Never delete unless explicitly instructed.
3. Never refactor outside the requested scope.
4. Never "clean up" unrelated code.
5. Preserve project stability over optimization.
6. Minimize the number of modified files.
7. Every modification must be directly related to the user's request.

---

# Scope Limitation

The agent may ONLY modify files that are directly required for the requested task.

If a task can be completed by modifying:

- one file

then modify exactly one file.

If two files are required:

- modify only those two files.

Do NOT touch any unrelated files.

---

# Forbidden Operations

Unless the user explicitly writes the command, NEVER:

- delete files
- rename files
- move files
- reorganize folders
- regenerate project structure
- replace frameworks
- rewrite architecture
- remove comments
- remove documentation
- remove tests
- remove migrations
- remove configuration
- remove API endpoints
- remove environment variables

---

# File Deletion Policy

Deleting ANY file requires an explicit instruction from the user.

Examples of valid instructions:

- "Delete foo.ts"
- "Remove old migration"
- "Delete unused component"

Without those words:

DO NOT DELETE.

Even if:

- file appears unused
- linter reports unused
- compiler reports unused
- duplicate exists
- AI believes it is obsolete

Deletion is prohibited.

---

# Refactoring Policy

Allowed:

- fix requested bug
- implement requested feature
- improve requested function

Not allowed:

- large refactor
- project-wide formatting
- import sorting across repository
- changing coding style
- renaming symbols globally
- restructuring folders

unless explicitly requested.

---

# Documentation Policy

Never remove:

- README
- docs/*
- architecture documents
- ADR
- markdown files

unless explicitly requested.

---

# Configuration Files

Treat these as HIGH RISK.

Never rewrite without instruction.

Examples:

.env

.env.example

docker-compose.yml

Dockerfile

nginx.conf

package.json

go.mod

go.sum

pnpm-lock.yaml

package-lock.json

tsconfig.json

vite.config.*

next.config.*

eslint.config.*

prettier.*

---

# Database Safety

Never:

- drop table
- truncate table
- remove migration
- rewrite migration history
- change production schema

unless explicitly requested.

Schema changes must be additive whenever possible.

Preferred:

ADD

Never default to:

DROP

---

# API Stability

Never remove:

- endpoints
- request fields
- response fields

Prefer backward compatibility.

---

# Testing

Never remove tests.

If behavior changes:

update or add tests.

---

# Dependency Policy

Do not upgrade packages automatically.

Do not replace libraries.

Do not migrate frameworks.

Unless explicitly instructed.

---

# Security Files

Never modify:

- authentication
- authorization
- permissions
- encryption
- secrets handling

unless the task explicitly targets security.

---

# Large Changes

If more than 10 files would be modified:

STOP.

Ask for confirmation.

---

# Dangerous Commands

Never execute automatically:

rm -rf

git clean

git reset --hard

git checkout .

git restore .

git push --force

git rebase

git filter-repo

history rewrite

database drop

truncate

format disk

---

# Git Policy

Do not:

- amend commits
- squash commits
- rewrite history

Only create commits if explicitly requested.

---

# Generated Files

Only regenerate generated files if:

- required by build
- explicitly requested

Never delete generated files automatically.

---

# Code Style

Follow existing repository conventions.

Do not introduce new style rules.

Do not perform repository-wide formatting.

---

# Minimal Change Principle

Always choose the smallest possible change.

Example:

If 3 lines solve the issue,

do not rewrite 300 lines.

---

# User Intent Wins

When user instruction conflicts with optimization,

follow the user.

Do not "improve" unrelated code.

---

# Ask Before Acting

If uncertain:

STOP.

Ask for clarification.

Never guess.

---

# Protected Directories

Treat these directories as protected unless explicitly included in the task.

backend/            # ABSOLUTELY protected — never modify/delete (see ANTIGRAVITY SCOPE)

docs/

database/migrations/

infra/

deploy/

.github/

scripts/

backups/

archive/

---

# Absolute Rule

The AI MUST NEVER modify, delete, rename, move, or refactor files outside the explicit scope requested by the user.

If a change is not required to complete the requested task,

DO NOT TOUCH IT.

End of Guardrail.