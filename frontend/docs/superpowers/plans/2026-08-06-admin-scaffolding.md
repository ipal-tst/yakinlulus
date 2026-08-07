# Admin Scaffolding (SUPER_ADMIN + STAFF) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build complete, detailed admin scaffolding for `SUPER_ADMIN` and `STAFF` — dashboard, users, schools, target-schools, notifications, audit, AI config, health/logs, analytics — wired to real backend endpoints per `docs/frontend/API-contract.md`.

**Architecture:** Feature-folder per module (`src/components/admin/<module>/` + `src/services/<module>.service.ts` + types). Thin page routes compose module components. TanStack Query for server state, react-hook-form + zod for forms, upgraded TanStack DataTable shared component.

**Tech Stack:** Next.js 16 + React 19 + TypeScript strict + Tailwind CSS v4 + shadcn/ui + TanStack Query v5 + TanStack Table v9 + react-hook-form + zod + Vitest.

## Global Constraints

- API base: `http://localhost:8080/api/v1` (via `NEXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1"` in `src/lib/api.ts`).
- All data calls go through `api<T>(endpoint, opts)` from `src/lib/api.ts` (already handles auth Bearer, envelope unwrap, 401 auto-logout).
- Response envelope: `{ success, data, message }`; errors `{ success, error: { code, message } }`.
- Design system per `design.md` verbatim: radius 12 inputs (h-11), card radius 16, page max-w 1440px content, skeleton loading, empty-state component, Max 6 chart colors.
- UI components exist in `src/components/ui/`: avatar, badge, breadcrumb, button, card, dialog, dropdown-menu, input, pagination, progress, select, separator, sheet, skeleton, table, tabs, tooltip. Do NOT add new UI deps.
- Server state via TanStack Query (provider already in `src/components/providers.tsx`).
- Commits scoped per task. Run `npx.cmd tsc --noEmit` and `npm.cmd run lint` after each task.
- Pre-existing lint errors in `src/types/index.ts` and old pages are OUT of scope unless a task touches that exact file/line.

---

### Task 1: Vitest setup + test script

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `"test": "vitest run"` script)

**Interfaces:**
- Produces: `npm run test` command; Vitest reads `vitest.config.ts`.

- [ ] **Step 1: Create vitest config**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Add test script to package.json**

In `package.json` `scripts`, add:

```json
"test": "vitest run"
```

- [ ] **Step 3: Add a smoke test to prove Vitest runs**

Create `src/lib/utils.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
  it("keeps the first truthy argument when second is undefined", () => {
    expect(cn("text-sm", undefined)).toBe("text-sm");
  });
});
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm.cmd run test`
Expected: `Test Files 1 passed`, `Tests 2 passed`.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json src/lib/utils.test.ts
git commit -m "test: add vitest setup"
```

---

### Task 2: Fix dashboard service endpoints + AdminDashboard types

**Files:**
- Modify: `src/services/dashboard.service.ts`
- Modify: `src/types/index.ts` (remove `StaffDashboard`, keep others)
- Create: `src/types/admin.ts`
- Modify: `src/app/(staff)/staff/page.tsx`
- Test: `src/services/dashboard.service.test.ts`

**Interfaces:**
- Consumes: `api<T>` from `src/lib/api.ts`.
- Produces: `dashboardService.getAdminDashboard(): Promise<AdminDashboard>`;
  `AdminDashboard`, `KPIData`, `SystemHealth`, `ActiveUserStat`, `SchoolStat`, `CBTMonitoring`, `ActivityItem` types in `src/types/admin.ts`.

- [ ] **Step 1: Write failing endpoint contract test**

```ts
// src/services/dashboard.service.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.fn();
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { dashboardService } from "./dashboard.service";

describe("dashboardService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /dashboard/admin for admin dashboard", async () => {
    apiMock.mockResolvedValue({ kpi: {} });
    const res = await dashboardService.getAdminDashboard();
    expect(apiMock).toHaveBeenCalledWith("/dashboard/admin", {});
    expect(res).toEqual({ kpi: {} });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd run test`
Expected: FAIL — `getAdminDashboard` does not exist.

- [ ] **Step 3: Rewrite dashboard.service.ts**

```ts
// src/services/dashboard.service.ts
import { api } from "@/lib/api";
import { SiswaDashboard, GuruDashboard, AdminDashboard } from "@/types/admin";

export const dashboardService = {
    async getStudentDashboard(): Promise<SiswaDashboard> {
        return api<SiswaDashboard>("/dashboard/student");
    },

    async getTeacherDashboard(): Promise<GuruDashboard> {
        return api<GuruDashboard>("/dashboard/teacher");
    },

    async getAdminDashboard(): Promise<AdminDashboard> {
        return api<AdminDashboard>("/dashboard/admin");
    },
};
```

- [ ] **Step 4: Create src/types/admin.ts**

```ts
export type UserRole =
    | "SUPER_ADMIN"
    | "STAFF"
    | "FINANCE"
    | "GURU"
    | "SISWA"
    | "INVESTOR";

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    avatar_url?: string;
    grade_id?: string;
    school_name?: string;
    gender?: string;
    phone?: string;
    major?: string;
    created_at: string;
    updated_at: string;
}

export interface GreetingInfo {
    full_name: string;
    greeting: string;
    date: string;
    motivation: string;
}

export interface ActivityItem {
    type: string;
    message: string;
    created_at: string;
}

export interface SiswaDashboard {
    greeting?: GreetingInfo;
    continue_learning?: unknown[];
    today_goal?: { target_materials: number; completed_materials: number; target_questions: number; answered_questions: number; progress_pct: number };
    learning_progress?: unknown[];
    weekly_activity?: unknown[];
    upcoming_exams?: unknown[];
    exam_stats?: unknown;
    recent_activity?: ActivityItem[];
}

export interface GuruDashboard {
    greeting?: GreetingInfo;
    today_schedule?: unknown[];
    quick_actions?: { label: string; icon: string; path: string }[];
    my_classes?: unknown[];
    upcoming_exams?: unknown[];
    student_progress?: unknown[];
    question_bank_stat?: { total: number; draft: number; published: number };
    recent_activity?: ActivityItem[];
}

export interface KPIData {
    total_users: number;
    active_today: number;
    total_schools: number;
    total_teachers: number;
    total_students: number;
    total_exams: number;
    total_materials: number;
    total_questions: number;
}

export interface SystemHealth {
    api_status: string;
    db_status: string;
    storage_usage: number;
    uptime_hours: number;
}

export interface ActiveUserStat {
    online_now: number;
    active_24h: number;
}

export interface SchoolStat {
    total: number;
    active: number;
    verified: number;
}

export interface CBTMonitoring {
    scheduled: number;
    running: number;
    finished: number;
}

export interface AdminDashboard {
    kpi: KPIData;
    system_health: SystemHealth;
    active_users: ActiveUserStat;
    school_stats: SchoolStat;
    cbt_monitoring: CBTMonitoring;
    recent_activity: ActivityItem[];
}

export interface AdminHealthService {
    name: string;
    endpoint?: string;
    status: string;
    latency: string;
    uptime: string;
}

export interface AdminHealth {
    services: AdminHealthService[];
}

export interface LogEntry {
    id: string;
    timestamp: string;
    level: string;
    module: string;
    message: string;
}

export interface PaginatedData<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: { code: string; message: string };
}
```

- [ ] **Step 5: Remove StaffDashboard from src/types/index.ts**

Delete the `StaffDashboard` interface (lines ~264-272). Also remove now-unused imports if the file references them. Do NOT touch the other interfaces.

- [ ] **Step 6: Update /staff page to use AdminDashboard**

Rewrite `src/app/(staff)/staff/page.tsx` body data source: replace `StaffDashboard` import and `/dashboard/staff` usage with `dashboardService.getAdminDashboard()` and `AdminDashboard` type. Render KPI StatsCards from `data.kpi` (total_users, total_schools, total_teachers, total_students, total_exams) plus a system-health badge row from `data.system_health`. Keep the quick-menu cards. Use `StatsCard` and `Skeleton` while loading. Example snippet:

```tsx
const { data, isLoading } = useQuery({ queryKey: ["admin-dashboard"], queryFn: dashboardService.getAdminDashboard });
```

(This page file becomes fully wired in Task 3's shared-primitives usage; for this task, minimal correct fetch + render of KPI cards is enough.)

- [ ] **Step 7: Run tests + typecheck**

Run: `npm.cmd run test` → all pass.
Run: `npx.cmd tsc --noEmit` → exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/services/dashboard.service.ts src/types/admin.ts src/types/index.ts src/app/(staff)/staff/page.tsx src/services/dashboard.service.test.ts
git commit -m "fix(dashboard): use real /dashboard/admin endpoint; add AdminDashboard types"
```

---

### Task 3: Upgrade DataTable to TanStack (keep Column<T> API)

**Files:**
- Modify: `src/components/data-display/data-table.tsx`
- Test: `src/components/data-display/data-table.test.ts` (pure helper for CSV export)

**Interfaces:**
- Consumes: `@tanstack/react-table`, `cn`.
- Produces: `DataTable<T>` with same `Column<T>` interface (backward compatible for SISWA/GURU pages) + sorting, sticky header, CSV export.

- [ ] **Step 1: Write failing CSV export helper test**

```ts
// src/components/data-display/data-table.test.ts
import { describe, it, expect } from "vitest";
import { toCSV } from "./data-table";

describe("toCSV", () => {
  it("escapes commas and quotes", () => {
    const rows = [{ name: 'A, "B"', score: 10 }];
    const csv = toCSV(rows, ["name", "score"]);
    expect(csv).toContain('"A, ""B"""');
  });
  it("includes header row", () => {
    const csv = toCSV([{ a: 1 }], ["a"]);
    expect(csv.split("\n")[0]).toBe("a");
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm.cmd run test`
Expected: FAIL — `toCSV` not exported.

- [ ] **Step 3: Rewrite data-table.tsx (TanStack + toCSV export)**

```tsx
"use client";

import { useMemo, useState } from "react";
import {
    ColumnDef,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsUpDown, Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
    header: string;
    accessorKey: keyof T | ((row: T) => React.ReactNode);
    cell?: (row: T) => React.ReactNode;
    enableSorting?: boolean;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    searchPlaceholder?: string;
    pageSize?: number;
    enableExport?: boolean;
}

export function toCSV<T>(rows: T[], keys: string[]): string {
    const escape = (v: unknown) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = keys.join(",");
    const body = rows.map((r) => keys.map((k) => escape((r as Record<string, unknown>)[k])).join(","));
    return [header, ...body].join("\n");
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    searchPlaceholder = "Cari data...",
    pageSize = 10,
    enableExport = true,
}: DataTableProps<T>) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);

    const tableColumns = useMemo<ColumnDef<T>[]>(() => {
        return columns.map((col, i) => ({
            id: typeof col.accessorKey === "function" ? `col-${i}` : String(col.accessorKey),
            header: col.header,
            accessorFn: (row) =>
                typeof col.accessorKey === "function" ? undefined : (row as Record<string, unknown>)[col.accessorKey as string],
            cell: (info) => {
                const row = info.row.original as T;
                if (col.cell) return col.cell(row);
                if (typeof col.accessorKey === "function") return col.accessorKey(row);
                return String((row as Record<string, unknown>)[col.accessorKey as string] ?? "");
            },
            enableSorting: col.enableSorting ?? true,
        }));
    }, [columns]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize } },
    });

    const exportKeys = columns
        .map((c) => (typeof c.accessorKey === "string" ? c.accessorKey : undefined))
        .filter((k): k is string => Boolean(k));

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9"
                    />
                </div>
                {enableExport && exportKeys.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                            const rows = table.getCoreRowModel().rows.map((r) => r.original as T);
                            const csv = toCSV(rows, exportKeys);
                            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "export.csv";
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                    >
                        <Download className="h-4 w-4" /> Ekspor CSV
                    </Button>
                )}
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="max-h-[560px] overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs text-xs uppercase text-muted-foreground font-semibold border-b border-border z-10">
                            {table.getHeaderGroups().map((hg) => (
                                <tr key={hg.id}>
                                    {hg.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className={cn(
                                                "px-4 py-3.5 whitespace-nowrap select-none",
                                                header.column.getCanSort() && "cursor-pointer hover:text-foreground"
                                            )}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <span className="inline-flex items-center gap-1.5">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() &&
                                                    (header.column.getIsSorted() ? (
                                                        header.column.getIsSorted() === "asc" ? (
                                                            <ChevronsUpDown className="h-3 w-3 rotate-180" />
                                                        ) : (
                                                            <ChevronsUpDown className="h-3 w-3" />
                                                        )
                                                    ) : (
                                                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                                                    ))}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3.5 align-middle">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                                        Tidak ada data ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
                <div>
                    Halaman <span className="font-semibold text-foreground">{table.getState().pagination.pageIndex + 1}</span> dari{" "}
                    <span className="font-semibold text-foreground">{table.getPageCount()}</span> ({table.getFilteredRowModel().rows.length} item)
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="rounded-lg h-8 px-3"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="rounded-lg h-8 px-3"
                    >
                        Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Run tests + typecheck**

Run: `npm.cmd run test` → pass.
Run: `npx.cmd tsc --noEmit` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/data-display/data-table.tsx src/components/data-display/data-table.test.ts
git commit -m "feat(data-table): upgrade to TanStack with sorting + CSV export"
```

---

### Task 4: Shared admin primitives (PageHeader, ConfirmDialog)

**Files:**
- Create: `src/components/admin/page-header.tsx`
- Create: `src/components/admin/confirm-dialog.tsx`

**Interfaces:**
- Produces: `<PageHeader title description actions? breadcrumb? />`;
  `<ConfirmDialog open title description confirmLabel variant onConfirm onCancel loading? />` (uses `ui/dialog`).

- [ ] **Step 1: Create PageHeader**

```tsx
// src/components/admin/page-header.tsx
"use client";

import * as React from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
    );
}
```

- [ ] **Step 2: Create ConfirmDialog**

```tsx
// src/components/admin/confirm-dialog.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    variant?: "default" | "destructive";
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Konfirmasi",
    variant = "default",
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <DialogFooter className="gap-2 sm:justify-end">
                    <Button variant="outline" onClick={onCancel} disabled={loading} className="rounded-xl">
                        Batal
                    </Button>
                    <Button variant={variant} onClick={onConfirm} disabled={loading} className="rounded-xl">
                        {loading ? "Memproses..." : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx.cmd tsc --noEmit` → exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/page-header.tsx src/components/admin/confirm-dialog.tsx
git commit -m "feat(admin): shared PageHeader and ConfirmDialog primitives"
```

---

### Task 5: Users module (refactor existing page into components)

**Files:**
- Create: `src/services/user.service.ts`
- Create: `src/components/admin/users/UserRoleBadge.tsx`
- Create: `src/components/admin/users/UserTable.tsx`
- Create: `src/components/admin/users/UserFormDialog.tsx`
- Modify: `src/app/(staff)/staff/users/page.tsx`
- Test: `src/services/user.service.test.ts`

**Interfaces:**
- Consumes: `api<T>`, `AdminDashboard` User type from `src/types/admin.ts` (re-export `User`, `UserRole`).
- Produces: `userService.listUsers(params?), createUser(payload), updateUser(id, payload), toggleActivate(id, active), deleteUser(id)`.
- `UserRoleBadge({ role })` — maps role → Badge variant (SUPER_ADMIN=destructive, STAFF=warning, GURU=secondary, FINANCE=default, SISWA=outline, INVESTOR=default).

- [ ] **Step 1: Write failing service contract test**

```ts
// src/services/user.service.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.fn();
vi.mock("@/lib/api", () => ({ api: apiMock }));

import { userService } from "./user.service";

describe("userService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /auth/users", async () => {
    apiMock.mockResolvedValue({ items: [] });
    await userService.listUsers({ page: 1, limit: 20 });
    expect(apiMock).toHaveBeenCalledWith("/auth/users", { params: { page: 1, limit: 20 } });
  });

  it("POSTs /auth/users", async () => {
    apiMock.mockResolvedValue({ id: "u1" });
    await userService.createUser({ email: "a@b.c", password: "x", full_name: "A", role: "SISWA" });
    expect(apiMock).toHaveBeenCalledWith("/auth/users", { method: "POST", body: { email: "a@b.c", password: "x", full_name: "A", role: "SISWA" } });
  });

  it("PATCHes /auth/users/:id/activate", async () => {
    apiMock.mockResolvedValue({ id: "u1", is_active: false });
    await userService.toggleActivate("u1", false);
    expect(apiMock).toHaveBeenCalledWith("/auth/users/u1/activate", { method: "PATCH", body: { active: false } });
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm.cmd run test` → FAIL (`userService` missing).

- [ ] **Step 3: Create user.service.ts**

```ts
// src/services/user.service.ts
import { api } from "@/lib/api";
import { User, UserRole, PaginatedData } from "@/types/admin";

export const userService = {
    async listUsers(params?: { page?: number; limit?: number; q?: string }): Promise<PaginatedData<User> | User[]> {
        return api<PaginatedData<User> | User[]>("/auth/users", { params });
    },

    async createUser(payload: { email: string; password: string; full_name: string; role: UserRole }): Promise<User> {
        return api<User>("/auth/users", { method: "POST", body: payload });
    },

    async updateUser(id: string, payload: Partial<User>): Promise<User> {
        return api<User>(`/auth/users/${id}`, { method: "PUT", body: payload });
    },

    async toggleActivate(id: string, active: boolean): Promise<User> {
        return api<User>(`/auth/users/${id}/activate`, { method: "PATCH", body: { active } });
    },

    async deleteUser(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/auth/users/${id}`, { method: "DELETE" });
    },
};
```

- [ ] **Step 4: Create UserRoleBadge**

```tsx
// src/components/admin/users/UserRoleBadge.tsx
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/admin";

const roleVariant: Record<UserRole, "default" | "secondary" | "warning" | "destructive" | "outline"> = {
    SUPER_ADMIN: "destructive",
    STAFF: "warning",
    GURU: "secondary",
    FINANCE: "default",
    SISWA: "outline",
    INVESTOR: "default",
};

export function UserRoleBadge({ role }: { role: UserRole }) {
    return <Badge variant={roleVariant[role] ?? "outline"}>{role}</Badge>;
}
```

- [ ] **Step 5: Create UserTable**

```tsx
// src/components/admin/users/UserTable.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@/types/admin";
import { UserRoleBadge } from "./UserRoleBadge";
import { MoreHorizontal, Power, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserTableProps {
    users: User[];
    loading?: boolean;
    onToggleActivate: (user: User) => void;
    onDelete: (user: User) => void;
}

export function UserTable({ users, onToggleActivate, onDelete }: UserTableProps) {
    const columns: Column<User>[] = [
        {
            header: "Nama",
            accessorKey: "full_name",
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{row.full_name}</span>
                    <span className="text-xs text-muted-foreground">{row.email}</span>
                </div>
            ),
        },
        { header: "Peran / Role", accessorKey: "role", cell: (row) => <UserRoleBadge role={row.role} /> },
        {
            header: "Status",
            accessorKey: "is_active",
            cell: (row) => (
                <Badge variant={row.is_active ? "success" : "outline"}>
                    {row.is_active ? "Aktif" : "Non-aktif"}
                </Badge>
            ),
        },
        { header: "Sekolah", accessorKey: (row) => row.school_name || "-" },
        {
            header: "Aksi",
            accessorKey: "id",
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onToggleActivate(row)}>
                            <Power className="h-4 w-4 mr-2" />
                            {row.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return <DataTable columns={columns} data={users} searchPlaceholder="Cari nama atau email..." />;
}
```

Note: check `DropdownMenuItem` supports `variant` prop in the installed `dropdown-menu.tsx`; if not, use `className="text-destructive"` instead.

- [ ] **Step 6: Create UserFormDialog**

```tsx
// src/components/admin/users/UserFormDialog.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/types/admin";

const schema = z.object({
    full_name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    role: z.enum(["SUPER_ADMIN", "STAFF", "FINANCE", "GURU", "SISWA", "INVESTOR"]),
});

type FormValues = z.infer<typeof schema>;

interface UserFormDialogProps {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (values: FormValues) => void;
}

const ROLE_OPTIONS: UserRole[] = ["SISWA", "GURU", "STAFF", "FINANCE", "INVESTOR", "SUPER_ADMIN"];

export function UserFormDialog({ open, loading = false, onClose, onSubmit }: UserFormDialogProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { role: "SISWA" },
    });

    React.useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Nama Lengkap</label>
                        <Input {...register("full_name")} className="h-11" />
                        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Email</label>
                        <Input type="email" {...register("email")} className="h-11" />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Kata Sandi</label>
                        <Input type="password" {...register("password")} className="h-11" />
                        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Peran (Role)</label>
                        <Select value={watch("role")} onValueChange={(v) => setValue("role", v as UserRole)}>
                            <SelectTrigger className="h-11 w-full">
                                <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLE_OPTIONS.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                    </div>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-xl">
                            {loading ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 7: Rewrite /staff/users page to compose components**

```tsx
// src/app/(staff)/staff/users/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { UserTable } from "@/components/admin/users/UserTable";
import { UserFormDialog } from "@/components/admin/users/UserFormDialog";
import { userService } from "@/services/user.service";
import { User } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, AlertCircle } from "lucide-react";

export default function UserManagementPage() {
    const qc = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["admin-users"],
        queryFn: () => userService.listUsers({ page: 1, limit: 200 }),
    });

    const users = Array.isArray(data) ? data : data?.items || [];

    const createMutation = useMutation({
        mutationFn: userService.createUser,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) => userService.toggleActivate(id, active),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    const deleteMutation = useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            setDeleteTarget(null);
        },
    });

    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    title="Manajemen Pengguna"
                    description="Kelola semua akun siswa, guru, staff, finance, dan admin."
                    actions={
                        <Button onClick={() => setFormOpen(true)} className="rounded-xl gap-2 font-medium">
                            <UserPlus className="h-4 w-4" /> Tambah User
                        </Button>
                    }
                />

                {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error instanceof Error ? error.message : "Gagal memuat pengguna"}</span>
                        <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                            Coba lagi
                        </Button>
                    </div>
                )}

                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <UserTable
                        users={users}
                        onToggleActivate={(u) => toggleMutation.mutate({ id: u.id, active: !u.is_active })}
                        onDelete={(u) => setDeleteTarget(u)}
                    />
                )}

                <UserFormDialog
                    open={formOpen}
                    loading={createMutation.isPending}
                    onClose={() => setFormOpen(false)}
                    onSubmit={(v) =>
                        createMutation.mutate(v, {
                            onSuccess: () => setFormOpen(false),
                        })
                    }
                />

                <ConfirmDialog
                    open={Boolean(deleteTarget)}
                    title="Hapus pengguna?"
                    description={`${deleteTarget?.full_name} (${deleteTarget?.email}) akan dihapus permanen.`}
                    confirmLabel="Hapus"
                    variant="destructive"
                    loading={deleteMutation.isPending}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                />
            </div>
        </AppShell>
    );
}
```

- [ ] **Step 8: Run tests + typecheck + lint**

Run: `npm.cmd run test` → pass. `npx.cmd tsc --noEmit` → exit 0. `npm.cmd run lint` → only pre-existing errors.

- [ ] **Step 9: Commit**

```bash
git add src/services/user.service.ts src/services/user.service.test.ts src/components/admin/users src/app/(staff)/staff/users/page.tsx
git commit -m "feat(users): modular user management with TanStack Query + RHF forms"
```

---

### Task 6: Schools module

**Files:**
- Create: `src/services/school.service.ts`
- Create: `src/components/admin/schools/SchoolTable.tsx`
- Create: `src/components/admin/schools/SchoolFormDialog.tsx`
- Modify: `src/app/(staff)/staff/schools/page.tsx`
- Test: `src/services/school.service.test.ts`

**Interfaces:**
- Produces: `schoolService.listSchools(params?), createSchool(payload), updateSchool(id, payload), toggleStatus(id, status), deleteSchool(id)`.
- Endpoints: `GET /school`, `POST /school`, `PUT /school/:id`, `PATCH /school/:id/status`, `DELETE /school/:id`.

- [ ] **Step 1: Write failing contract test**

```ts
// src/services/school.service.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const apiMock = vi.fn();
vi.mock("@/lib/api", () => ({ api: apiMock }));
import { schoolService } from "./school.service";

describe("schoolService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /school", async () => {
    apiMock.mockResolvedValue([]);
    await schoolService.listSchools();
    expect(apiMock).toHaveBeenCalledWith("/school", {});
  });

  it("POSTs /school", async () => {
    apiMock.mockResolvedValue({ id: "s1" });
    await schoolService.createSchool({ name: "SMA X" });
    expect(apiMock).toHaveBeenCalledWith("/school", { method: "POST", body: { name: "SMA X" } });
  });

  it("PATCHes /school/:id/status", async () => {
    apiMock.mockResolvedValue({ id: "s1" });
    await schoolService.toggleStatus("s1", "INACTIVE");
    expect(apiMock).toHaveBeenCalledWith("/school/s1/status", { method: "PATCH", body: { status: "INACTIVE" } });
  });
});
```

- [ ] **Step 2: Run to verify fail** — `schoolService` missing.

- [ ] **Step 3: Create school.service.ts**

```ts
// src/services/school.service.ts
import { api } from "@/lib/api";

export interface School {
    id: string;
    name: string;
    code?: string;
    npsn?: string;
    education_level?: string;
    province?: string;
    regency?: string;
    status?: string;
    total_students?: number;
    created_at?: string;
    updated_at?: string;
}

export interface SchoolPayload {
    name: string;
    code?: string;
    npsn?: string;
    education_level?: string;
    province?: string;
    regency?: string;
}

export const schoolService = {
    async listSchools(params?: { page?: number; limit?: number; q?: string }): Promise<School[]> {
        return api<School[]>("/school", { params });
    },

    async createSchool(payload: SchoolPayload): Promise<School> {
        return api<School>("/school", { method: "POST", body: payload });
    },

    async updateSchool(id: string, payload: Partial<SchoolPayload>): Promise<School> {
        return api<School>(`/school/${id}`, { method: "PUT", body: payload });
    },

    async toggleStatus(id: string, status: string): Promise<School> {
        return api<School>(`/school/${id}/status`, { method: "PATCH", body: { status } });
    },

    async deleteSchool(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/school/${id}`, { method: "DELETE" });
    },
};
```

- [ ] **Step 4: Create SchoolTable + SchoolFormDialog** (mirror users module pattern: DataTable columns for name/code/level/status/total_students, DropdownMenu actions; form dialog with name, code, npsn, education_level, province, regency using react-hook-form + zod).

Use `Badge variant={sch.status === "ACTIVE" ? "success" : "outline"}` for status column.

- [ ] **Step 5: Rewrite /staff/schools page** — compose PageHeader + SchoolTable + SchoolFormDialog + ConfirmDialog with `useQuery`/`useMutation` on `schoolService`, mirroring Task 5 Step 7 structure exactly (Skeleton loading, error banner, empty state).

- [ ] **Step 6: Run tests + typecheck + lint**

- [ ] **Step 7: Commit**

```bash
git add src/services/school.service.ts src/services/school.service.test.ts src/components/admin/schools src/app/(staff)/staff/schools/page.tsx
git commit -m "feat(schools): modular school management wired to /school"
```

---

### Task 7: Target Schools module

**Files:**
- Create: `src/services/target-school.service.ts`
- Create: `src/components/admin/target-schools/TargetSchoolTable.tsx`
- Create: `src/components/admin/target-schools/TargetSchoolFormDialog.tsx`
- Create: `src/app/(staff)/staff/target-schools/page.tsx`
- Test: `src/services/target-school.service.test.ts`

**Interfaces:**
- Endpoints: `GET/POST /target-schools`, `GET/PUT/DELETE /target-schools/:id`.
- Backend shape (target_schools.go:19-29): `{ id, name, level, min_score?, max_score?, max_total_score, subjects: string[], academic_year?, is_active, created_at, updated_at }`.

- [ ] **Step 1: Write failing contract test** — assert `GET /target-schools`, `POST /target-schools`, `PUT /target-schools/:id`, `DELETE /target-schools/:id` calls.

- [ ] **Step 2: Run to verify fail**

- [ ] **Step 3: Create target-school.service.ts**

```ts
// src/services/target-school.service.ts
import { api } from "@/lib/api";

export interface TargetSchool {
    id: string;
    name: string;
    level: string;
    min_score?: number;
    max_score?: number;
    max_total_score: number;
    subjects: string[];
    academic_year?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TargetSchoolPayload {
    name: string;
    level: string;
    min_score?: number;
    max_score?: number;
    max_total_score: number;
    subjects: string[];
    academic_year?: string;
    is_active?: boolean;
}

export const targetSchoolService = {
    async listTargetSchools(): Promise<TargetSchool[]> {
        return api<TargetSchool[]>("/target-schools");
    },

    async createTargetSchool(payload: TargetSchoolPayload): Promise<TargetSchool> {
        return api<TargetSchool>("/target-schools", { method: "POST", body: payload });
    },

    async updateTargetSchool(id: string, payload: Partial<TargetSchoolPayload>): Promise<TargetSchool> {
        return api<TargetSchool>(`/target-schools/${id}`, { method: "PUT", body: payload });
    },

    async deleteTargetSchool(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/target-schools/${id}`, { method: "DELETE" });
    },
};
```

- [ ] **Step 4: Create TargetSchoolTable + TargetSchoolFormDialog** — columns: name, level (Badge), max_total_score, subjects (comma list, truncate), is_active (Badge), actions (edit/delete). Form: name, level, min_score, max_score, max_total_score (number inputs), subjects (comma-separated input → split), is_active toggle. react-hook-form + zod.

- [ ] **Step 5: Create /staff/target-schools/page.tsx** — compose like Task 5 Step 7 (query key `["admin-target-schools"]`).

- [ ] **Step 6: Run tests + typecheck + lint**

- [ ] **Step 7: Commit**

```bash
git add src/services/target-school.service.ts src/services/target-school.service.test.ts src/components/admin/target-schools src/app/(staff)/staff/target-schools/page.tsx
git commit -m "feat(target-schools): target school CRUD page"
```

---

### Task 8: Notifications module (broadcast + templates)

**Files:**
- Create: `src/services/notification.service.ts`
- Create: `src/components/admin/notifications/BroadcastForm.tsx`
- Create: `src/components/admin/notifications/TemplateTable.tsx`
- Create: `src/components/admin/notifications/TemplateFormDialog.tsx`
- Create: `src/app/(staff)/staff/notifications/page.tsx`
- Test: `src/services/notification.service.test.ts`

**Interfaces:**
- Endpoints: `POST /notifications/broadcast`, `POST /notifications/send`,
  `GET/POST /notifications/templates`, `PUT/DELETE /notifications/templates/:id`.
- Produces: `notificationService.broadcast(payload)`, `send(payload)`, `listTemplates()`, `createTemplate(payload)`, `updateTemplate(id, payload)`, `deleteTemplate(id)`.

- [ ] **Step 1: Write failing contract test**

```ts
// src/services/notification.service.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const apiMock = vi.fn();
vi.mock("@/lib/api", () => ({ api: apiMock }));
import { notificationService } from "./notification.service";

describe("notificationService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("POSTs /notifications/broadcast", async () => {
    apiMock.mockResolvedValue({ message: "ok" });
    await notificationService.broadcast({ title: "T", message: "M" });
    expect(apiMock).toHaveBeenCalledWith("/notifications/broadcast", { method: "POST", body: { title: "T", message: "M" } });
  });

  it("GETs /notifications/templates", async () => {
    apiMock.mockResolvedValue([]);
    await notificationService.listTemplates();
    expect(apiMock).toHaveBeenCalledWith("/notifications/templates", {});
  });
});
```

- [ ] **Step 2: Run to verify fail**

- [ ] **Step 3: Create notification.service.ts**

```ts
// src/services/notification.service.ts
import { api } from "@/lib/api";

export interface NotificationTemplate {
    id: string;
    name: string;
    title: string;
    message: string;
    channel?: string;
    created_at?: string;
}

export const notificationService = {
    async broadcast(payload: { title: string; message: string; audience?: string }): Promise<{ message: string }> {
        return api<{ message: string }>("/notifications/broadcast", { method: "POST", body: payload });
    },

    async send(payload: { user_id: string; title: string; message: string }): Promise<{ message: string }> {
        return api<{ message: string }>("/notifications/send", { method: "POST", body: payload });
    },

    async listTemplates(): Promise<NotificationTemplate[]> {
        return api<NotificationTemplate[]>("/notifications/templates");
    },

    async createTemplate(payload: Omit<NotificationTemplate, "id">): Promise<NotificationTemplate> {
        return api<NotificationTemplate>("/notifications/templates", { method: "POST", body: payload });
    },

    async updateTemplate(id: string, payload: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
        return api<NotificationTemplate>(`/notifications/templates/${id}`, { method: "PUT", body: payload });
    },

    async deleteTemplate(id: string): Promise<{ message: string }> {
        return api<{ message: string }>(`/notifications/templates/${id}`, { method: "DELETE" });
    },
};
```

- [ ] **Step 4: Create BroadcastForm** — card with title/message/audience fields + submit → `notificationService.broadcast`, success toast/inline message.

- [ ] **Step 5: Create TemplateTable + TemplateFormDialog** — list templates with edit/delete; form dialog for create/update.

- [ ] **Step 6: Create /staff/notifications/page.tsx** — PageHeader + BroadcastForm + Tabs (Broadcast / Templates) using `ui/tabs`; query keys `["notification-templates"]`.

- [ ] **Step 7: Run tests + typecheck + lint**

- [ ] **Step 8: Commit**

```bash
git add src/services/notification.service.ts src/services/notification.service.test.ts src/components/admin/notifications src/app/(staff)/staff/notifications/page.tsx
git commit -m "feat(notifications): staff broadcast + templates page"
```

---

### Task 9: Audit module (move page + wire API)

**Files:**
- Delete: `src/app/(staff)/staff/audit-logs/page.tsx` (moved)
- Create: `src/app/(staff)/staff/audit/page.tsx`
- Create: `src/services/audit.service.ts`
- Create: `src/components/admin/audit/AuditStatsCards.tsx`
- Create: `src/components/admin/audit/AuditLogTable.tsx`
- Test: `src/services/audit.service.test.ts`

**Interfaces:**
- Endpoints: `GET /audit-logs/stats`, `GET /audit-logs`.
- Backend shapes (audit.go:19-38): `AuditLog { id, event_type, actor_email, actor_role, action, description, entity_type, entity_id, ip_address, severity, created_at }`, `AuditStats { total_logs, critical_count, warning_count, info_count, today_count, login_attempts }`.

- [ ] **Step 1: Write failing contract test** — `GET /audit-logs/stats`, `GET /audit-logs` (with `?limit=`).

- [ ] **Step 2: Run to verify fail**

- [ ] **Step 3: Create audit.service.ts**

```ts
// src/services/audit.service.ts
import { api } from "@/lib/api";

export interface AuditLog {
    id: string;
    event_type: string;
    actor_email: string;
    actor_role: string;
    action: string;
    description: string;
    entity_type: string;
    entity_id: string;
    ip_address: string;
    severity: string;
    created_at: string;
}

export interface AuditStats {
    total_logs: number;
    critical_count: number;
    warning_count: number;
    info_count: number;
    today_count: number;
    login_attempts: number;
}

export const auditService = {
    async getStats(): Promise<AuditStats> {
        return api<AuditStats>("/audit-logs/stats");
    },

    async getLogs(params?: { page?: number; limit?: number; severity?: string }): Promise<AuditLog[] | { items: AuditLog[] }> {
        return api<AuditLog[] | { items: AuditLog[] }>("/audit-logs", { params });
    },
};
```

- [ ] **Step 4: Create AuditStatsCards** — 4 StatsCards from `AuditStats` (Total Logs, Critical, Warning, Hari Ini).

- [ ] **Step 5: Create AuditLogTable** — DataTable columns: action (Badge by severity), description, actor_email, entity_type, created_at (formatted); severity Badge variant (CRITICAL=destructive, WARNING=warning, INFO=secondary).

- [ ] **Step 6: Create /staff/audit/page.tsx** — PageHeader + AuditStatsCards + AuditLogTable, query keys `["audit-logs"]`, `["audit-stats"]`.

- [ ] **Step 7: Delete old /staff/audit-logs/page.tsx** — `git rm`.

- [ ] **Step 8: Run tests + typecheck + lint** — confirm `/staff/audit` (sidebar href) now exists.

- [ ] **Step 9: Commit**

```bash
git add src/services/audit.service.ts src/services/audit.service.test.ts src/components/admin/audit src/app/(staff)/staff/audit/page.tsx
git rm src/app/(staff)/staff/audit-logs/page.tsx
git commit -m "feat(audit): staff audit log page wired to /audit-logs"
```

---

### Task 10: AI Config module

**Files:**
- Create: `src/services/ai.service.ts`
- Create: `src/components/admin/ai/AiConfigForm.tsx`
- Create: `src/app/(staff)/staff/ai/page.tsx`
- Test: `src/services/ai.service.test.ts`

**Interfaces:**
- Endpoints: `GET /ai/config`, `PUT /ai/config`, `POST /ai/test-connection`.

- [ ] **Step 1: Write failing contract test** — `GET /ai/config`, `PUT /ai/config`, `POST /ai/test-connection`.

- [ ] **Step 2: Run to verify fail**

- [ ] **Step 3: Create ai.service.ts**

```ts
// src/services/ai.service.ts
import { api } from "@/lib/api";

export interface AiConfig {
    model?: string;
    endpoint?: string;
    api_key_masked?: string;
    temperature?: number;
    max_tokens?: number;
    enabled?: boolean;
    [key: string]: unknown;
}

export const aiService = {
    async getConfig(): Promise<AiConfig> {
        return api<AiConfig>("/ai/config");
    },

    async updateConfig(payload: Partial<AiConfig>): Promise<AiConfig> {
        return api<AiConfig>("/ai/config", { method: "PUT", body: payload });
    },

    async testConnection(): Promise<{ ok: boolean; message?: string }> {
        return api<{ ok: boolean; message?: string }>("/ai/test-connection", { method: "POST" });
    },
};
```

- [ ] **Step 4: Create AiConfigForm** — loads `GET /ai/config` on mount, form fields (model, temperature, max_tokens, enabled switch) with react-hook-form + zod, submit → `updateConfig`, plus a "Uji Koneksi" button → `testConnection` showing result.

- [ ] **Step 5: Create /staff/ai/page.tsx** — PageHeader + AiConfigForm (query key `["ai-config"]`).

- [ ] **Step 6: Run tests + typecheck + lint**

- [ ] **Step 7: Commit**

```bash
git add src/services/ai.service.ts src/services/ai.service.test.ts src/components/admin/ai src/app/(staff)/staff/ai/page.tsx
git commit -m "feat(ai): staff AI config page"
```

---

### Task 11: SUPER_ADMIN health/logs + analytics pages

**Files:**
- Create: `src/services/admin.service.ts`
- Create: `src/services/analytics.service.ts`
- Create: `src/components/admin/admin/HealthStatusGrid.tsx`
- Create: `src/components/admin/admin/LogsViewer.tsx`
- Create: `src/components/admin/analytics/OverviewKPISection.tsx`
- Create: `src/components/admin/analytics/ExamReportsTable.tsx`
- Create: `src/app/(admin)/admin/health/page.tsx`
- Create: `src/app/(admin)/admin/analytics/page.tsx`
- Test: `src/services/admin.service.test.ts`, `src/services/analytics.service.test.ts`

**Interfaces:**
- Endpoints: `GET /admin/health`, `GET /admin/logs?limit=`, `GET /analytics/admin/overview`, `GET /analytics/admin/reports/exams`.
- Backend shapes: `AdminHealth { services: [{ name, endpoint?, status, latency, uptime }] }` (admin/repository.go:14-22); `LogEntry { id, timestamp, level, module, message }` (admin/repository.go:26-31).

- [ ] **Step 1: Write failing contract tests**

```ts
// src/services/admin.service.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const apiMock = vi.fn();
vi.mock("@/lib/api", () => ({ api: apiMock }));
import { adminService } from "./admin.service";

describe("adminService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /admin/health", async () => {
    apiMock.mockResolvedValue({ services: [] });
    await adminService.getHealth();
    expect(apiMock).toHaveBeenCalledWith("/admin/health", {});
  });

  it("GETs /admin/logs with limit", async () => {
    apiMock.mockResolvedValue({ logs: [] });
    await adminService.getLogs(100);
    expect(apiMock).toHaveBeenCalledWith("/admin/logs", { params: { limit: 100 } });
  });
});
```

```ts
// src/services/analytics.service.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const apiMock = vi.fn();
vi.mock("@/lib/api", () => ({ api: apiMock }));
import { analyticsService } from "./analytics.service";

describe("analyticsService", () => {
  beforeEach(() => apiMock.mockReset());
  afterEach(() => vi.clearAllMocks());

  it("GETs /analytics/admin/overview", async () => {
    apiMock.mockResolvedValue({});
    await analyticsService.getAdminOverview();
    expect(apiMock).toHaveBeenCalledWith("/analytics/admin/overview", {});
  });

  it("GETs /analytics/admin/reports/exams", async () => {
    apiMock.mockResolvedValue([]);
    await analyticsService.getExamReports();
    expect(apiMock).toHaveBeenCalledWith("/analytics/admin/reports/exams", {});
  });
});
```

- [ ] **Step 2: Run to verify fail**

- [ ] **Step 3: Create admin.service.ts**

```ts
// src/services/admin.service.ts
import { api } from "@/lib/api";
import { AdminHealth, LogEntry } from "@/types/admin";

export const adminService = {
    async getHealth(): Promise<AdminHealth> {
        return api<AdminHealth>("/admin/health");
    },

    async getLogs(limit = 50): Promise<{ logs: LogEntry[] }> {
        return api<{ logs: LogEntry[] }>("/admin/logs", { params: { limit } });
    },
};
```

- [ ] **Step 4: Create analytics.service.ts**

```ts
// src/services/analytics.service.ts
import { api } from "@/lib/api";

export interface AdminOverview {
    total_students?: number;
    total_teachers?: number;
    total_exams?: number;
    total_questions?: number;
    active_sessions?: number;
    avg_score?: number;
    [key: string]: unknown;
}

export interface ExamReport {
    exam_id: string;
    title: string;
    status?: string;
    total_participants?: number;
    total_started?: number;
    total_finished?: number;
    average_score?: number;
    pass_rate?: number;
    [key: string]: unknown;
}

export const analyticsService = {
    async getAdminOverview(): Promise<AdminOverview> {
        return api<AdminOverview>("/analytics/admin/overview");
    },

    async getExamReports(): Promise<ExamReport[]> {
        return api<ExamReport[]>("/analytics/admin/reports/exams");
    },
};
```

- [ ] **Step 5: Create HealthStatusGrid + LogsViewer**

`HealthStatusGrid`: grid of cards, one per `health.services` item — name, status Badge (healthy→success), latency, uptime.
`LogsViewer`: DataTable with columns level (Badge: ERROR=destructive, WARN=warning, INFO=secondary), module, message, timestamp (formatted); row `LogEntry`.

- [ ] **Step 6: Create OverviewKPISection + ExamReportsTable**

`OverviewKPISection`: StatsCards from `AdminOverview` (total_students, total_teachers, total_exams, total_questions).
`ExamReportsTable`: DataTable columns — title, status Badge, total_participants, total_finished, average_score, pass_rate.

- [ ] **Step 7: Create /admin/health/page.tsx and /admin/analytics/page.tsx**

Both wrap in `AppShell`, use `PageHeader`, `useQuery` hooks (keys `["admin-health"]`, `["admin-logs"]`, `["admin-analytics-overview"]`, `["admin-exam-reports"]`), Skeleton loading, error banner.

- [ ] **Step 8: Run tests + typecheck + lint**

- [ ] **Step 9: Commit**

```bash
git add src/services/admin.service.ts src/services/analytics.service.ts src/services/admin.service.test.ts src/services/analytics.service.test.ts src/components/admin/admin src/components/admin/analytics src/app/(admin)
git commit -m "feat(admin): SUPER_ADMIN health/logs and analytics pages"
```

---

### Task 12: Sidebar role gating + route group wiring

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

**Interfaces:**
- Consumes: `useAuthStore`, `UserRole` from `src/types/admin`.

- [ ] **Step 1: Add roles gating to sidebar**

In `src/components/layout/sidebar.tsx`:

1. Add `roles?: UserRole[]` to `NavItem` interface.
2. Add SUPER_ADMIN-only items:

```tsx
const SUPER_ADMIN_NAV: NavItem[] = [
    { title: "Health & Logs", href: "/admin/health", icon: Activity, roles: ["SUPER_ADMIN"] },
    { title: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: ["SUPER_ADMIN"] },
];
```

(import `Activity`, `BarChart3` from lucide-react)

3. Filter combined nav by role:

```tsx
const role = user?.role || "SISWA";
let navItems: NavItem[] = [];
if (role === "GURU") navItems = GURU_NAV;
if (role === "STAFF" || role === "SUPER_ADMIN") navItems = [...STAFF_NAV, ...GURU_NAV.slice(1)];
if (role === "FINANCE") navItems = FINANCE_NAV;
if (role === "INVESTOR") navItems = INVESTOR_NAV;
if (role === "SUPER_ADMIN") navItems = [...navItems, ...SUPER_ADMIN_NAV];
navItems = navItems.filter((item) => !item.roles || item.roles.includes(role));
```

4. Update `UserRole` import to come from `@/types/admin` (re-exported same union).

- [ ] **Step 2: Typecheck + lint**

Run: `npx.cmd tsc --noEmit` → exit 0. `npm.cmd run lint` → only pre-existing errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat(sidebar): role-gated SUPER_ADMIN nav items"
```

---

### Task 13: Final verification

- [ ] **Step 1: Run full test suite**

Run: `npm.cmd run test`
Expected: ALL test files pass (dashboard, user, school, target-school, notification, audit, ai, admin, analytics).

- [ ] **Step 2: Typecheck**

Run: `npx.cmd tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Production build**

Run: `npm.cmd run build`
Expected: build succeeds. If pre-existing type errors outside touched files block build, report them; do NOT fix unrelated files.

- [ ] **Step 4: Manual smoke check (optional, backend running)**

Log in as `admin@yakinlulus.id` / `Admin@123!`, visit `/staff/users`, `/staff/schools`, `/staff/target-schools`, `/staff/notifications`, `/staff/audit`, `/staff/ai`, `/admin/health`, `/admin/analytics` — each renders skeleton then data or empty state, no console 500.

- [ ] **Step 5: Final commit if any lint/typecheck fixes were applied**

```bash
git add -A
git commit -m "chore(admin): final verification fixes"
```
(only if Step 1-3 produced fixes)
