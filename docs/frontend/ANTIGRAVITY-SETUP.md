# Google Antigravity Setup

This repo ships with a complete backend API contract so Antigravity can rebuild the
frontend for all six roles (SISWA, GURU, STAFF, SUPER_ADMIN, FINANCE, INVESTOR).

## Prerequisites

- Node.js 18+ (frontend toolchain)
- Google Antigravity (IDE or CLI) with an authenticated Gemini model
- Access to this repository (already cloned locally)

## Point Antigravity at the repo

1. Open the project root (`Yakinlulus.id/`) as the workspace in Antigravity.
2. Make sure the **backend is running** so the frontend can be smoke-tested:
   - `cd backend && go run ./cmd/api` (listens on `:8080` by default)
3. Tell Antigravity the base URL is `http://localhost:8080/api/v1`.

## Mount AGENTS.md

The repo already has `AGENTS.md` with project conventions and the design system;
Antigravity reads it automatically when the workspace is opened. It points to
`design.md` (the authoritative design system) and `docs/frontend/*` (API contract).
If missing, create one at the repo root with:

```md
# Yakinlulus.id — Frontend Rebuild

- Stack: Next.js 16 + React 19 + TypeScript strict + Tailwind CSS v4 + shadcn/ui.
- Server state: TanStack Query. Client state: Zustand. Charts: Recharts. Icons: Lucide.
- Design system: follow design.md verbatim (colors, type, spacing, radius, motion).
- All server reads in the plan go to `GET/POST/PUT/PATCH/DELETE <base>/...`.
- Base URL: http://localhost:8080/api/v1
- Auth: Bearer JWT; refresh via /auth/refresh.
- Source of truth for endpoints: docs/frontend/API-contract.md and backend/openapi.yaml.
```

## Apply the frontend/React skill

In Antigravity, select the *frontend/React + TanStack Query* skill before generating
pages. This instructs the model to:

- Build typed fetchers that attach the Bearer token and unwrap `{success}` envelopes.
- Use TanStack Query for caching server state (`useQuery`/`useMutation`).
- Render routes per `docs/frontend/PAGE-WIRING.md`.
- Use shadcn/ui components and the tokens in `design.md` — do not invent a visual style.

## Wire the API client

Create `lib/api.ts` (Next.js App Router `lib/` directory, not `src/`):

```ts
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080/api/v1";

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth) {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Request failed");
  return data.data as T;
}
```

## Verify

1. Run the OpenAPI validator against the backend contract:
   `python -c "import yaml; yaml.safe_load(open('backend/openapi.yaml'))"` → no error.
2. In Antigravity, run the page-by-page checklist in `docs/frontend/PAGE-WIRING.md`;
   confirm each page calls the mapped endpoints and the login flow issues a token.
3. Smoke-test one page: log in as SISWA, open Materials, fetch `/material`.
4. Check the UI against `design.md`: colors (Blue/Green/Orange tokens), Inter font,
   4px spacing, radius 12 default, skeletons for loading, empty states with CTA.

## Troubleshooting

- **401s everywhere** → token missing/expired; wire `/auth/refresh` and re-attach.
- **Path not found (404)** → check prefix: exam-practice is `/exam-practice`, model practice
  is `/practice`. Confirm against `API-contract.md`.
- **Empty lists** → seed the DB via the backend seed command or Supabase console before
  testing student loops.