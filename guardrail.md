# Guardrail.md

Version: 2.0

## Objective

This repository contains critical source code and documentation.

The AI agent (Antigravity/OpenCode) MUST ONLY perform operations explicitly requested by the user.

Default behavior is **read-only** unless modification is explicitly requested.

---

# WRITE SCOPE — USER-APPROVED WORKFLOW

This is a full-stack repository. The agent may write anywhere when the task requires it,
subject to explicit user approval for backend/database operations (per user grant on
2026-08-06).

## Write Scope (ALLOWED — create/edit/delete, task-required)

- `frontend/**` — freely create, edit, and delete (frontend built from scratch).
- `backend/**` — code edits ONLY when the user explicitly approved a task involving
  backend. Never unilaterally.
- `docs/**` — create/edit when part of the requested task.
- Root config files (`README.md`, `AGENTS.md`, `guardrail.md`, `design.md`,
  `.gitignore`) — edit when the user explicitly asks.

## Read-Only Scope (ALLOWED — read only, NEVER write)

- None permanently; treat unrequested areas as read-only until approved.

## Requires Explicit Approval (STRICTLY NEVER without user OK each time)

- **DB state changes:** `go run ./cmd/migrate*`, `go run ./cmd/reset_db*`,
  `go run ./cmd/seed*`, or any SQL against the database.
- **Backend code edits** outside an explicitly approved backend task.
- Committing files outside the task scope.

## The One-Way Gate

> If a change is needed outside the user-approved scope, the agent does NOT make it.
> It must report the need to the user and stop. The user grants approval per request.

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

Unless the user explicitly approves, NEVER:

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

Task-required changes are exempt when the user approved the task.

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

unless explicitly requested/approved by the user per operation.

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

Treat these directories as protected unless the task explicitly requires them
(with user approval for backend/database):

backend/

database/migrations/

infra/

deploy/

.github/

scripts/

backups/

archive/

---

# Absolute Rule

The AI MUST NOT modify, delete, rename, move, or refactor files outside the scope approved by the user for the current task.

If a change is not required to complete the requested task,

DO NOT TOUCH IT.

End of Guardrail.