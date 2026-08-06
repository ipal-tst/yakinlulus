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
| `design.md` | READ-ONLY — design system spec (colors, type, spacing, components) |
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

- **Framework**: Next.js 16 + React 19, TypeScript strict, Tailwind CSS v4.
- **UI**: shadcn/ui component library (Button, Input, Select, Dialog, Drawer, Card, Badge,
  Tabs, Accordion, Tooltip, Dropdown, Table, Toast, Skeleton, Progress, Avatar, Pagination,
  Breadcrumb, Command Palette, Date Picker, Calendar).
- **Server state**: TanStack Query.
- **Client state**: Zustand.
- **Charts**: Recharts (Bar, Area, Pie, Line, Heatmap, Progress Ring). Max 6 colors.
- **Tables**: TanStack Table (sticky header, pagination, sorting, filtering, column resize,
  export).
- **Icons**: Lucide React, outline style, stroke 2, sizes 16/20/24/32.
- **Motion**: Framer Motion (150/200/250ms; Fade/Slide/Scale/Hover only — no bounce/spin/flash).
- **Theme**: next-themes (dark mode full support).
- **Fonts**: Inter (primary), Plus Jakarta Sans (alternative), JetBrains Mono (code).

## Design System — follow `design.md`

Read `design.md` (Design System YakinLulus.id v1.0, Production Ready) and implement it
verbatim. Non-negotiables:

- **Style**: Modern Minimal Education — card-based UI, flat design, soft shadows, soft
  glassmorphism ONLY on popups. No skeuomorphism, no heavy gradients, no glass everywhere.
- **Colors** (via CSS variables / tokens): Primary Blue `#2563EB` (buttons, links, active,
  progress), Secondary Green `#16A34A` (success/achievement/scores), Accent Orange `#F97316`
  (badges/warning/highlights, never as background). Usage ratio ~70% primary / 20% neutral /
  10% accent. Dark mode: bg Gray950, card Gray900, text Gray50.
- **Contrast** ≥ 4.5:1 (WCAG AA). Keyboard navigable, screen-reader friendly, visible focus
  ring, skip navigation.
- **Typography**: Display 48, H1 40, H2 32, H3 28, H4 24, Body 16, Small 14, Caption 12.
  Weights: Regular/Medium/Semibold/Bold.
- **Spacing**: 4px scale (4/8/12/16/20/24/32/40/48/64/80/96).
- **Radius**: 8 (small), 12 (default), 16 (large), 20 (dialog), 999 (pill).
- **Shadows**: light — small (card), medium (dropdown), large (dialog).
- **Layout**: max width 1600px, content 1440px, sidebar 280px (collapsed 72px), topbar 72px.
- **Forms**: input height 44px, radius 12, label above input, error below input,
  placeholder Gray400.
- **Loading**: skeletons, never full-screen spinners. **Empty states**: simple illustration
  + CTA.
- **CBT pages**: full focus — no popups, no big animations, no busy background, no ads.
- **UX**: dashboard & start-exam & learning ≤2 clicks; search ≤3 clicks.
- **Error UI**: 404/500/403/offline/connection-lost each with illustration + CTA.
- **Responsive**: mobile / tablet / laptop / desktop / ultrawide; all cards responsive.
- **Design tokens**: all colors/radius/spacing/shadow/typography as CSS variables.

## API Integration

- Base URL: `http://localhost:8080/api/v1` (from `docs/frontend/ANTIGRAVITY-SETUP.md`).
- Auth: Bearer JWT; refresh via `/auth/refresh`.
- Build pages per `docs/frontend/PAGE-WIRING.md` using the endpoints in
  `docs/frontend/API-contract.md`.
