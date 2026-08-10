# Admin Shell Terpadu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun satu Admin Shell terpadu (sidebar grouped + topbar + command palette + guard role) untuk semua role backoffice (SUPER_ADMIN/STAFF/GURU/FINANCE/INVESTOR), menggantikan pola `<AppShell>` per-halaman.

**Architecture:** Nav tree tunggal `config/admin-nav.ts` (grouped + role-gated) → komponen `AdminShell`/`AdminSidebar`/`AdminTopbar`/`AdminGuard` → `layout.tsx` per route-group backoffice; semua halaman backoffice melepas `<AppShell>`. Tidak ada perubahan backend; tidak ada endpoint baru.

**Tech Stack:** Next.js 16 + React 19, TypeScript strict, Tailwind v4, shadcn/ui (base-ui based), Zustand (ui.store, auth.store), lucide-react, TanStack Query. Verifikasi: `npx tsc --noEmit` + `npm run lint` + `npm run test` (vitest — hanya `*.test.ts`, env node; TDD pada modul logika murni). Tanpa komponen-render tests (tidak ada jsdom di config).

## Global Constraints

- **Frontend WRITE bebas** (AGENTS.md) — semua file di bawah `frontend/src/**`. Tidak ada file backend/DB diubah.
- **Design tokens** (design.md/globals.css): sidebar 280px / collapsed 72px, topbar 72px, content `max-w-[1440px]`, main `max-w-[1600px]`, radius 12 (items), primary `#2563EB`. Semua memakai token CSS existing (`--sidebar`, `--primary`, dll).
- **Role model**: `SUPER_ADMIN/SUPER_SISWA/STAFF/GURU/FINANCE/INVESTOR/SISWA` (dari `@/types`). Guard: SUPER_ADMIN bebas semua area; STAFF hanya admin+staff; yang lain hanya area masing-masing; SISWA/SUPER_SISWA ditolak dari backoffice (`router.replace("/siswa")`).
- **Navigasi**: "Segera" badge = modul yang halamannya belum dibangun (lihat §4). `isNavActive(href, path)` = `href === path` untuk href `/admin|/staff|/guru|/finance|/investor`, selain itu `path.startsWith(href + "/")`.
- **Bahasa** antarmuka: Indonesia. Ikon: lucide-react, outline, 16/20.
- komponen baru wajib `"use client"` bila memakai hooks (usePathname/useAuthStore).
- Jangan menambah dependency npm baru (command palette diimplementasikan manual dengan `Dialog` + `Input` + filtering, tanpa `cmdk`).

---

### Task 1: `config/admin-nav.ts` — nav tree grouped + filter role (+ tes)

**Files:**
- Create: `frontend/src/config/admin-nav.ts`
- Test: `frontend/src/config/admin-nav.test.ts`

**Interfaces:**
- Produces: `AdminNavItem`, `AdminNavGroup`, `DASHBOARD_BY_ROLE`, `ADMIN_NAV_GROUPS`, `getAdminNav(role)`, `isNavActive(href,path)`, `findActiveNav(groups,path)`, `flattenNav(groups)`, `dashboardHref(role)`. Task 2/3/4 mengonsumsi tipe & fungsi ini persis.

- [ ] **Step 1: Write the failing test**

`frontend/src/config/admin-nav.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getAdminNav, isNavActive, findActiveNav, flattenNav, dashboardHref } from "./admin-nav";

describe("admin-nav", () => {
  it("filters groups by role: FINANCE does not see Master Akademik", () => {
    const finance = getAdminNav("FINANCE");
    const titles = finance.map((g) => g.title);
    expect(titles).toContain("Finance & Membership");
    expect(titles).not.toContain("Master Akademik");
  });

  it("always puts Dashboard first", () => {
    const nav = getAdminNav("STAFF");
    expect(nav[0].title).toBe("Dashboard");
    expect(nav[0].items[0].href).toBe("/staff");
  });

  it("SUPER_ADMIN sees every group", () => {
    const nav = getAdminNav("SUPER_ADMIN");
    const titles = nav.map((g) => g.title);
    expect(titles).toEqual(
      expect.arrayContaining(["Master Akademik", "Konten & Ujian", "Finance & Membership"])
    );
  });

  it("hides group when no item matches role", () => {
    const guru = getAdminNav("GURU");
    const titles = guru.map((g) => g.title);
    expect(titles).not.toContain("Finance & Membership");
    expect(titles).toContain("Konten & Ujian");
  });

  it("matches active nav by prefix, dashboard routes by exact", () => {
    expect(isNavActive("/admin/materials", "/admin/materials")).toBe(true);
    expect(isNavActive("/admin/materials", "/admin")).toBe(false);
    expect(isNavActive("/admin", "/admin/exams")).toBe(false);
    expect(isNavActive("/admin", "/admin")).toBe(true);
  });

  it("findActiveNav returns the matching item", () => {
    const nav = getAdminNav("STAFF");
    const m = findActiveNav(nav, "/staff/schools");
    expect(m?.item.title).toBe("Kelola Sekolah");
    expect(m?.group.title).toBe("Master Akademik");
  });

  it("flattenNav lists all reachable items", () => {
    const nav = getAdminNav("STAFF");
    const flat = flattenNav(nav);
    expect(flat.every((i) => i.href.startsWith("/"))).toBe(true);
    expect(flat.length).toBeGreaterThan(0);
  });

  it("dashboardHref maps every role", () => {
    expect(dashboardHref("SUPER_ADMIN")).toBe("/admin");
    expect(dashboardHref("GURU")).toBe("/guru");
    expect(dashboardHref("SISWA")).toBe("/siswa");
  });
});
```
Catatan: jika struktur expected pada dua test pertama tidak persis (mis. jumlah grup), sesuaikan data tabel pada Step 3, JANGAN mengubah test secara asal — nama grup mengikuti tabel §4.

- [ ] **Step 2: Run test to verify it fails**

Run (dari `frontend/`): `npx vitest run src/config/admin-nav.test.ts`
Expected: FAIL — `Cannot find module './admin-nav'`.

- [ ] **Step 3: Implement `admin-nav.ts`**

`frontend/src/config/admin-nav.ts`:
```ts
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Activity,
  Globe,
  GraduationCap,
  Building2,
  Target,
  BookOpen,
  HelpCircle,
  FolderKanban,
  FileCheck,
  Users,
  Bell,
  BrainCircuit,
  CreditCard,
  Wallet,
  Receipt,
  TrendingUp,
  BarChart3,
  ScrollText,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: "Segera";
}

export interface AdminNavGroup {
  title: string;
  icon: LucideIcon;
  collapsible: boolean;
  roles: UserRole[];
  items: AdminNavItem[];
}

export const DASHBOARD_BY_ROLE: Partial<Record<UserRole, AdminNavItem>> = {
  SUPER_ADMIN: { title: "Dashboard Admin", href: "/admin", icon: ShieldCheck, roles: ["SUPER_ADMIN", "STAFF"] },
  STAFF: { title: "Dashboard Staff", href: "/staff", icon: ShieldCheck, roles: ["SUPER_ADMIN", "STAFF"] },
  GURU: { title: "Dashboard Guru", href: "/guru", icon: GraduationCap, roles: ["SUPER_ADMIN", "GURU"] },
  FINANCE: { title: "Dashboard Finance", href: "/finance", icon: TrendingUp, roles: ["SUPER_ADMIN", "FINANCE"] },
  INVESTOR: { title: "Investor Board", href: "/investor", icon: BarChart3, roles: ["SUPER_ADMIN", "INVESTOR"] },
};

const KONFIG: AdminNavGroup = {
  title: "Konfigurasi Umum",
  icon: Activity,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF"],
  items: [
    { title: "Monitoring & Config", href: "/admin/monitor-config", icon: Activity, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "Health Monitor", href: "/admin/health", icon: Activity, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "CMS", href: "/admin/cms", icon: Globe, roles: ["SUPER_ADMIN", "STAFF"] },
  ],
};

const MASTER: AdminNavGroup = {
  title: "Master Akademik",
  icon: GraduationCap,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF"],
  items: [
    { title: "Akademik (Level/Grade)", href: "/admin/academic", icon: GraduationCap, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "Kelola Sekolah", href: "/staff/schools", icon: Building2, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "Target Sekolah", href: "/staff/target-schools", icon: Target, roles: ["SUPER_ADMIN", "STAFF"] },
  ],
};

const KONTEN: AdminNavGroup = {
  title: "Konten & Ujian",
  icon: BookOpen,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF", "GURU"],
  items: [
    { title: "Materi Pelajaran", href: "/admin/materials", icon: BookOpen, roles: ["SUPER_ADMIN", "STAFF", "GURU"] },
    { title: "Bank Soal", href: "/admin/questions", icon: FileCheck, roles: ["SUPER_ADMIN", "STAFF", "GURU"] },
    { title: "Media", href: "/guru/media", icon: FolderKanban, roles: ["SUPER_ADMIN", "STAFF", "GURU"] },
    { title: "Kelola Ujian", href: "/admin/exams", icon: FileCheck, roles: ["SUPER_ADMIN", "STAFF", "GURU"] },
  ],
};

const PENGGUNA: AdminNavGroup = {
  title: "Pengguna & Komunikasi",
  icon: Users,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF"],
  items: [
    { title: "Kelola Pengguna", href: "/admin/users", icon: Users, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "Broadcast Notifikasi", href: "/staff/notifications", icon: Users, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "AI & Asisten", href: "/staff/ai", icon: BrainCircuit, roles: ["SUPER_ADMIN", "STAFF"] },
  ],
};

const FINANCE: AdminNavGroup = {
  title: "Finance & Membership",
  icon: CreditCard,
  collapsible: true,
  roles: ["SUPER_ADMIN", "FINANCE"],
  items: [
    { title: "Paket Membership", href: "/finance/plans", icon: CreditCard, roles: ["SUPER_ADMIN", "FINANCE"], badge: "Segera" },
    { title: "Pelanggan", href: "/finance/subscribers", icon: Users, roles: ["SUPER_ADMIN", "FINANCE"], badge: "Segera" },
    { title: "Pembayaran & Invoice", href: "/finance/payments", icon: Receipt, roles: ["SUPER_ADMIN", "FINANCE"], badge: "Segera" },
    { title: "Transaksi", href: "/finance/transactions", icon: Wallet, roles: ["SUPER_ADMIN", "FINANCE"] },
    { title: "Payout", href: "/finance/payouts", icon: Wallet, roles: ["SUPER_ADMIN", "FINANCE"] },
    { title: "Laporan Keuangan", href: "/finance/reports", icon: TrendingUp, roles: ["SUPER_ADMIN", "FINANCE"], badge: "Segera" },
  ],
};

const ANALISIS: AdminNavGroup = {
  title: "Analisis & Laporan",
  icon: BarChart3,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF", "FINANCE", "INVESTOR"],
  items: [
    { title: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: ["SUPER_ADMIN", "STAFF"] },
    { title: "Investor Board", href: "/investor", icon: BarChart3, roles: ["SUPER_ADMIN", "INVESTOR"] },
    { title: "Financial Reports", href: "/investor/reports", icon: TrendingUp, roles: ["SUPER_ADMIN", "INVESTOR"], badge: "Segera" },
  ],
};

const SISTEM: AdminNavGroup = {
  title: "Sistem",
  icon: ScrollText,
  collapsible: true,
  roles: ["SUPER_ADMIN", "STAFF"],
  items: [
    { title: "Audit Log", href: "/staff/audit", icon: ScrollText, roles: ["SUPER_ADMIN", "STAFF"] },
  ],
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [KONFIG, MASTER, KONTEN, PENGGUNA, FINANCE, ANALISIS, SISTEM];

export function getAdminNav(role: UserRole): AdminNavGroup[] {
  const dash = DASHBOARD_BY_ROLE[role];
  const groups: AdminNavGroup[] = [];
  for (const g of ADMIN_NAV_GROUPS) {
    const items = g.items.filter((i) => i.roles.includes(role));
    if (!items.length) continue;
    groups.push({ ...g, items, roles: g.roles.filter((r) => r === role) });
  }
  if (dash) {
    groups.unshift({ title: "Dashboard", icon: dash.icon, collapsible: false, roles: [role], items: [dash] });
  }
  return groups;
}

export function isNavActive(href: string, pathname: string): boolean {
  const isDashboard = ["/admin", "/staff", "/guru", "/finance", "/investor", "/"].includes(href);
  return isDashboard ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function findActiveNav(groups: AdminNavGroup[], pathname: string): { group: AdminNavGroup; item: AdminNavItem } | null {
  for (const g of groups) {
    for (const item of g.items) {
      if (isNavActive(item.href, pathname)) return { group: g, item };
    }
  }
  return null;
}

export function flattenNav(groups: AdminNavGroup[]): AdminNavItem[] {
  return groups.flatMap((g) => g.items);
}

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  SUPER_ADMIN: "/admin",
  STAFF: "/staff",
  GURU: "/guru",
  FINANCE: "/finance",
  INVESTOR: "/investor",
  SISWA: "/siswa",
  SUPER_SISWA: "/siswa",
};

export function dashboardHref(role: UserRole): string {
  return DASHBOARD_ROUTES[role] || "/login";
}
```

> **Penamaan const**: variabel group = `KONFIG, MASTER, KONTEN, PENGGUNA, FINANCE, ANALISIS, SISTEM`; array `ADMIN_NAV_GROUPS = [KONFIG, MASTER, KONTEN, PENGGUNA, FINANCE, ANALISIS, SISTEM]`. Jangan menambah variabel lain.

- [ ] **Step 4: Fix const naming (konsistensi compile)**

Ganti nama variabel agar cocok dengan referensi array `ADMIN_NAV_GROUPS`. Nama valid: `KONFIG, MASTER, KONTEN, PENGGUNA, FINANCE, ANALISIS, SISTEM`. Rentang = `[KONFIG, MASTER, KONTEN, PENGGUNA, FINANCE, ANALISIS, SISTEM]`.

- [ ] **Step 5: Run test to verify it passes** (`npx vitest run src/config/admin-nav.test.ts`) — PASS.
- [ ] **Step 6: typecheck** — `cd frontend && npx tsc --noEmit` — PASS.
- [ ] **Step 7: Commit** — `git add frontend/src/config/admin-nav.ts frontend/src/config/admin-nav.test.ts && git commit -m "feat(admin): add grouped role-aware admin nav config"`

---

### Task 2: `AdminShell` + `AdminSidebar` (grouped collapsible)

**Files:**
- Create: `frontend/src/components/layout/admin-sidebar.tsx`
- Create: `frontend/src/components/layout/admin-shell.tsx`
- Modify: `frontend/src/stores/ui.store.ts`

**Interfaces:**
- Consumes: `getAdminNav`, `isNavActive`, `dashboardHref` (Task 1), `useAuthStore`.user, `useUIStore`.
- Produces: `AdminShell({children})`, `AdminSidebar` (internal), `MobileSidebarOpen` prop. Task 3/5 menggunakannya.

- [ ] **Step 1: Extend `ui.store.ts` untuk expand/collapse group**

`frontend/src/stores/ui.store.ts` (ganti seluruh isi):
```ts
import { create } from "zustand";

interface UIState {
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    collapsedGroups: string[];
    toggleGroup: (title: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
    collapsedGroups: [],
    toggleGroup: (title: string) =>
        set((state) => ({
            collapsedGroups: state.collapsedGroups.includes(title)
                ? state.collapsedGroups.filter((t) => t !== title)
                : [...state.collapsedGroups, title],
        })),
}));
```

- [ ] **Step 2: Write `admin-sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Search } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";
import { getAdminNav, isNavActive, dashboardHref } from "@/config/admin-nav";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/avatar";

export function AdminSidebar() {
    const { user, logout } = useAuthStore();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const router = useRouter();
    const pathname = usePathname();
    const [filter, setFilter] = useState("");

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const groups = user ? getAdminNav(user.role) : [];
    const dash = user ? dashboardHref(user.role) : "/login";

    const content = (
        <>
            {/* Brand Header */}
            <div className="h-[72px] flex items-center justify-between px-4 border-b border-sidebar-border">
                <Link href={dash} className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold font-heading text-xl shrink-0">YL</div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="font-heading font-bold text-lg leading-none text-foreground">
                                YakinLulus<span className="text-primary">.id</span>
                            </span>
                            <span className="text-[11px] text-muted-foreground font-medium">{user?.role} Platform</span>
                        </div>
                    )}
                </Link>
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 text-muted-foreground shrink-0 hidden md:flex">
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            {/* Search + Nav */}
            <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
                {!collapsed && (
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="Cari menu…"
                            className="h-9 w-full rounded-xl bg-muted/60 pl-9 pr-3 text-xs font-medium border border-transparent focus:border-input focus:bg-background transition-all outline-none"
                        />
                    </div>
                )}
                {groups.map((group) => {
                    const matches = group.items.filter((i) => i.title.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
                    if (filter && matches.length === 0) return null;

                    // Dashboard / group tanpa collapsible semua
                    if (!group.collapsible || group.items.length === 1 && !filter) {
                        const item = (filter ? matches : group.items)[0];
                        const Icon = item.icon;
                        const active = isNavActive(item.href, pathname);
                        return (
                            <Link key={item.href} href={item.href} title={collapsed ? item.title : undefined}
                              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150",
                                active ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                                       : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                collapsed && "justify-center px-0")}>
                                <Icon className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "")} />
                                {!collapsed && <span>{item.title}</span>}
                                {item.badge && !collapsed && <Badge className="ml-auto text-[9px] bg-amber-100 text-amber-700">{item.badge}</Badge>}
                            </Link>
                        );
                    }

                    const nonFiltered = filter ? matches : group.items;
                    if (nonFiltered.length === 0) return null;

                    return (
                        <Collapsible key={group.title} defaultOpen={!useUIStore.getState().collapsedGroups.includes(group.title)}>
                            <CollapsibleTrigger className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
                                <Button asChild size="icon" variant="ghost" className="h-5 w-5 p-0">
                                    <group.icon className="h-5 w-5 shrink-0" />
                                </Button>
                                {!collapsed && (
                                    <>
                                        <span className="flex-1 text-left">{group.title}</span>
                                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform data-[panel-state=open]:-rotate-180" />
                                    </>
                                )}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-1 pt-1">
                                {nonFiltered... }
                            </CollapsibleContent>
                        </Collapsible>
                    );
                })}
            </nav>
        </>
    );

    return (
        <>
            <aside className={cn("fixed left-0 top-0 z-30 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col justify-between hidden md:flex",
                collapsed ? "w-[72px]" : "w-[280px]")}>
                {content}
            </aside>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden fixed left-3 top-3 z-40 text-muted-foreground">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                    <div className="flex flex-col h-full">{content}</div>
                </SheetContent>
            </Sheet>
        </>
    );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
    const { collapsed } = useUIStore();
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <AdminSidebar />
            <div className={cn("flex-1 flex flex-col transition-all duration-300", collapsed ? "md:ml-[72px]" : "md:ml-[280px]")}>
                <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-[1440px] mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}
```
> Note: cuplikan di atas sengaja di-compress untuk menunjukkan struktur; saat implementasi tulis komponen **lengkap & valid** (import semua yang dipakai, JSX benar, `group.icon` dipakai sebagai komponen via `const GroupIcon = ...`). Beri attention khusus untuk: (a) `defaultOpen` mengecek state store PADA render (bukan saat mount) — gunakan `const { collapsedGroups } = useUIStore()` di komponen induk dan pass boolean; (b) item badge "Segera"; (c) navigasi filter; (d) footer profile belum dimasukkan (lihat catatan di bawah); (e) `main` tanpa Topbar (Topbar ditambahkan Task 3).

- [ ] **Step 3: Cek tsc & lint** — `npx tsc --noEmit` dan `npm run lint` dari `frontend/` → PASS.
- [ ] **Step 4: Manual smoke** — `npm run dev`, buka `/admin` sebagai role SUPER_ADMIN (mock login), pastikan grup tampil, click item aktif highlight, collapsed (double arrow) → ikon only, mobile bar buka drawer. Report dibuat subagent di file `report` (lihat kontrak SDD).
- [ ] **Step 5: Commit** — `git add frontend/src/components/layout/admin-sidebar.tsx frontend/src/components/layout/admin-shell.tsx frontend/src/stores/ui.store.ts && git commit -m "feat(admin): grouped collapsed admin sidebar shell"`

---

### Task 3: `AdminTopbar` (breadcrumb + theme + notif + user menu role-aware)

**Files:**
- Create: `frontend/src/components/layout/admin-topbar.tsx`

**Interfaces:**
- Consumes: `getAdminNav`, `findActiveNav`, `dashboardHref` (Task 1); `AdminShell` (Task 2) — add `<AdminTopbar />` di atas `<main>`.
- Produces: `AdminTopbar` (renders inside `AdminShell`).

- [ ] **Step 1: Implement `admin-topbar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { Menu, Search, Sun, Moon, Bell, LogOut, User as UserIcon, Settings } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { getAdminNav, findActiveNav, dashboardHref } from "@/config/admin-nav";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  useState(() => { setMounted(true); }, []);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMemo(undefined); // placeholder hanya jika mount effect di atas tidak valid — implementasi: ganti dengan useEffect(() => setMounted(true), [])

  const handleLogout = () => { logout(); router.push("/login"); };

  const groups = user ? getAdminNav(user.role) : [];
  const active = findActiveNav(groups, pathname);

  return (
    <header className="sticky top-0 z-20 h-[72px] bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden text-muted-foreground" title="Menu">
          <Menu className="h-5 w-5" />
        </Button>

        <button type="button" onClick={openCommand}
          className="relative hidden sm:flex items-center w-64 md:w-80 h-10 rounded-xl bg-muted/60 pl-9 pr-4 text-xs font-medium text-muted-foreground border border-transparent hover:border-input transition-all cursor-text text-left">
          <Search className="absolute left-3 h-4 w-4" />
          <span>Cari halaman admin…  <kbd className="ml-2 rounded bg-background border border-border px-1.5 text-[10px]">Ctrl K</kbd></span>
        </button>

        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={dashboardHref(user?.role || "SISWA")}>Beranda</BreadcrumbLink>
            </BreadcrumbItem>
            {active?.group && active.group.title !== "Dashboard" && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={active.item.href}>{active.group.title}</BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            {active?.item && active.item.title !== "Beranda" && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbPage>{active.item.title}</BreadcrumbPage>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        {mounted && (
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl text-muted-foreground hover:text-foreground" title="Ganti Tema">
            {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
          </Button>
        )}

        <Link href="/staff/notifications">
          <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-foreground" title="Notifikasi">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            )}
          </Button>
        </Link>

        <div className="flex items-center gap-3 pl-2 border-l border-border">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 group outline-none">
              <Avatar src={user?.avatar_url} fallback={user?.full_name?.charAt(0) || "U"} size="sm" />
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold group-hover:text-primary transition-colors text-foreground">{user?.full_name || "Pengguna"}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{user?.role}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                  <UserIcon className="h-4 w-4" /> <span>Akun</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                  <Settings className="h-4 w-4" /> <span>Pengaturan</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                <LogOut className="h-4 w-4" /> <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
```
> `openCommand` akan diisi Task 4 (state command palette dinaikkan di `AdminTopbar` dengan `const [commandOpen, setCommandOpen] = useState(false)` dan tombol membuka dialog). Tambahkan `const [commandOpen, setCommandOpen] = useState(false)` dan `onClick={() => setCommandOpen(true)}`, lalu tandai `<CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />` di akhir header (desain Task 4). Untuk Task 3 selesai berjalan TANPA command palette (tombol non-fungsi sementara).

- [ ] **Step 2: Pasang `AdminTopbar` ke `AdminShell`** — tambahkan `<AdminTopbar />` antara `</div>` flex-col dan `<main>` di `admin-shell.tsx`. Jadikan komponen di `<div className="flex-1 flex flex-col ...">`:
```
{/* ... */}
<AdminTopbar />
<main ...>...</main>
```
(Ekspor `AdminTopbar`; import dari `@/components/layout/admin-topbar`.)

- [ ] **Step 3: tsc + lint + manual smoke** (breadcrumb mengikuti item aktif; user menu → `/admin/settings`, tidak ke `/profile` siswa).
- [ ] **Step 4: Commit** — `git add frontend/src/components/layout/admin-topbar.tsx frontend/src/components/layout/admin-shell.tsx && git commit -m "feat(admin): topbar with breadcrumb theme notif user menu"`

---

### Task 4: Command Palette (manual, tanpa cmdk)

**Files:**
- Create: `frontend/src/components/layout/command-palette.tsx`
- Modify: `frontend/src/components/layout/admin-topbar.tsx` (wire command open + Ctrl+K/kbd)

**Interfaces:**
- Consumes: `getAdminNav`, `flattenNav`, `isNavActive` (Task 1), `Dialog` shadcn, `useRouter`.
- Produces: `CommandPalette({ open, onOpenChange })`.

- [ ] **Step 1: Implement `command-palette.tsx`**

```tsx
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { getAdminNav, flattenNav } from "@/config/admin-nav";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => (user ? flattenNav(getAdminNav(user.role)) : []), [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return items;
    return items.filter((it) => it.title.toLocaleLowerCase().includes(q) || it.href.toLocaleLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => { setIndex(0); setQuery(""); if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Enter") setIndex((i) => Math.min(i + 1, filtered.length - 1));
    if (e.key === "Tab") { e.preventDefault(); setIndex((i) => (i + 1) % Math.max(filtered.length, 1)); }
    // eslint wants text feedback; arrow handled via onKeyUp below
  }, [filtered.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Cari halaman</DialogTitle>
        <div className="flex items-center border-b px-4">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(i + 1, filtered.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
              if (e.key === "Escape") onOpenChange(false);
              if (e.key === "Enter" && filtered[index]) { router.push(filtered[index].href); onOpenChange(false); }
            }}
            placeholder="Cari halaman admin…" className="border-0 shadow-none focus-visible:ring-0 h-12 text-sm" />
        </div>
        <ul className="max-h-80 overflow-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">Tidak ada hasil untuk “{query}”</li>
          )}
          {filtered.map((it, i) => {
            const Icon = it.icon;
            return (
              <li key={it.href}>
                <button type="button" onMouseMove={() => setIndex(i)} onClick={() => { router.push(it.href); onOpenChange(false); }}
                  className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left", i === index ? "bg-primary/10 text-primary" : "text-foreground")}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{it.title}</span>
                  <span className="text-[10px] text-muted-foreground">{it.href}</span>
                  {i === index && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Wire ke `AdminTopbar`** — tambah `const [commandOpen, setCommandOpen] = useState(false)`; tombol "Cari halaman…" → `onClick={() => setCommandOpen(true)}`; render `<CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />` tepat sebelum `</header>`. Tambah shortcut global: `useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCommandOpen((v) => !v); } }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);`
- [ ] **Step 3: tsc + lint; manual: Ctrl+K buka/tutup; ketik cari; Enter navigasi; Esc close**
- [ ] **Step 4: Commit** — `git add frontend/src/components/layout/command-palette.tsx frontend/src/components/layout/admin-topbar.tsx && git commit -m "feat(admin): keyboard command palette navigation"`

---

### Task 5: `layout.tsx` per route-group + guard + lepas `<AppShell>` dari halaman backoffice

**Files:**
- Create: `frontend/src/components/layout/admin-guard.tsx`
- Create (5): `frontend/src/app/(admin)/admin/layout.tsx`, `(staff)/staff/layout.tsx`, `(guru)/guru/layout.tsx`, `(finance)/finance/layout.tsx`, `(investor)/investor/layout.tsx`
- Modify: semua `page.tsx` di group `(admin)`, `(staff)`, `(guru)`, `(finance)`, `(investor)` — hapus `import { AppShell }` dan bukaan/tutup `<AppShell>`/`</AppShell>`. JANGAN sentuh group `(siswa)`.

**Interfaces:**
- Consumes: `AdminShell` (Task 2), `AdminTopbar` (Task 3), `useAuthStore`, `dashboardHref` (Task 1).

- [ ] **Step 1: `admin-guard.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { dashboardHref } from "@/config/admin-nav";

const ALLOWED: Record<string, readonly string[]> = {
  "(admin)": ["SUPER_ADMIN", "STAFF"],
  "(staff)": ["SUPER_ADMIN", "STAFF"],
  "(guru)": ["SUPER_ADMIN", "GURU"],
  "(finance)": ["SUPER_ADMIN", "FINANCE"],
  "(investor)": ["SUPER_ADMIN", "INVESTOR"],
};

export function AdminGuard({ area, children }: { area: keyof typeof ALLOWED; children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) { router.replace("/login"); return; }
    if (user.role === "SISWA" || user.role === "SUPER_SISWA") { router.replace("/siswa"); return; }
    if (!ALLOWED[area].includes(user.role)) router.replace(dashboardHref(user.role));
  }, [isLoading, isAuthenticated, user, area, router]);

  if (isLoading || !user) return null;
  return <>{children}</>;
}
```

- [ ] **Step 2: Buat 5 layout.tsx** (pola sama; area & import berbeda)

```tsx
// (admin)/admin/layout.tsx
import { AdminGuard } from "@/components/layout/admin-guard";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard area="(admin)">
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
```
Salin pola untuk `(staff)` area `"(staff)"`, `(guru)` `"(guru)"`, `(finance)` `"(finance)"`, `(investor)` `"(investor)"`.

- [ ] **Step 3: Codemod lepas `<AppShell>` di halaman backoffice**

Untuk setiap file `page.tsx` di group `(admin)/(staff)/(guru)/(finance)/(investor)`:
a) Hapus baris `import { AppShell } from "@/components/layout/app-shell";`
b) Hapus baris `<AppShell>` dan baris `</AppShell>` (termasuk yang ada di dalam branch loading/error).
c) Jaga indentasi isi child supaya tetap valid (indent tak mati tidak wajib — hanya gaya).

Periksa tak ada panggilan `<AppShell` tersisa di 5 group:
```bash
cd frontend && rg "AppShell" src/app -g "*.tsx"
```
Hanya baris komentar/dok (boleh ada) — pastikan **tidak ada** `AppShell` digunakan di group backoffice. Group `(siswa)` TETAP memakai AppShell (tidak disentuh).

Hati-hati file dengan `<AppShell showSidebar=...>`? Ber-semua dipakai sebagai `<AppShell>` — jika ada props, pertahankan penjelasan (hapus props juga; layout sudah memberi shell). Pastikan setiap halaman punya satu root elemen setelah div dihapus (wrap di `<div>` jika perlu).

- [ ] **Step 4: Validasi** — `npx tsc --noEmit`; `npm run lint`; `npm run test` (vitest tetap pass). Manual smoke: login sebagai masing-masing role → area benar; SISWA paksa `/admin` → redirect `/siswa`; GURU paksa `/admin` → redirect `/guru`; SUPER_ADMIN buka `/finance/plans` (placeholder Task 6) tanpa redirect.
- [ ] **Step 5: Commit** — staged: 5 layout + guard + semua halaman backoffice yang diubah. `git add frontend/src/app/(admin) frontend/src/app/(staff) frontend/src/app/(guru) frontend/src/app/(finance) frontend/src/app/(investor) frontend/src/components/layout/admin-guard.tsx && git commit -m "feat(admin): per-area layouts with role guard, drop per-page AppShell"`

---

### Task 6: Empty-state placeholder pages untuk nav item "Segera"

**Files:**
- Create: `frontend/src/components/layout/page-placeholder.tsx`
- Create: `frontend/src/app/(finance)/finance/plans/page.tsx`, `subscribers/page.tsx`, `payments/page.tsx`, `reports/page.tsx`, `(investor)/investor/reports/page.tsx`

**Interfaces:**
- Consumes: `EmptyState` (existing `@/components/feedback/empty-state`), `Button`, `AdminShell` (via layout). `.badge` pada nav dihapus setelah halaman dibuat (Task 6 lanjutan).

- [ ] **Step 1: `page-placeholder.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Construction } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <EmptyState
      icon={<Construction className="h-10 w-10" />}
      title={title}
      description={description}
    >
      <Button asChild>
        <Link href="/">Kembali ke dashboard</Link>
      </Button>
    </EmptyState>
  );
}
```
> Sesuaikan prop `EmptyState` yang benar — baca `frontend/src/components/feedback/empty-state.tsx` saat implementasi untuk nama props (mis. `icon/title/description/action/children`). Jangan asal; periksa.

- [ ] **Step 2: Buat 5 halaman placeholder** (contoh Finance plans)

```tsx
// (finance)/finance/plans/page.tsx
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function FinancePlansPage() {
  return <PagePlaceholder title="Paket Membership" description="Modul ini belum dibangun. Halaman akan menampilkan CRUD paket membership (Basic/Premium/Pro/Enterprise)." />;
}
```
Salin utk `subscribers` (Pelanggan), `payments` (Pembayaran & Invoice), `reports` (Laporan Keuangan), `(investor)/investor/reports` (Financial Reports — hanya investor).

- [ ] **Step 3: Hapus badge "Segera"** dari `admin-nav.ts` utk item yang sudah punya halaman.
- [ ] **Step 4: Validasi** — `npx tsc --noEmit`; `npm run lint`; manual: `/finance/plans`, `/finance/subscribers`, `/finance/payments`, `/finance/reports`, `/investor/reports` → tampil placeholder.
- [ ] **Step 5: Commit** — `git add frontend/src/components/layout/page-placeholder.tsx frontend/src/app/'(finance)' frontend/src/app/'(investor)' frontend/src/config/admin-nav.ts && git commit -m "feat(admin): placeholder pages for planned modules"`

---

## Self-Review (dijalankan setelah plan selesai — oleh executor/controller)

1. **Spec coverage** — rapikan per area; grup Dashboard role-aware; guard SUPER_ADMIN bebas semua area, STAFF admin+staff; navbar grouped+submenu; topbar cmd+breadcrumb+notif+user role-aware; empty-state "Segera"; tidak ada komit backend.
2. **Placeholder scan** — jelaskan pseudo seperti `...`/`TODO` (mis.-catatan pada variant di Step 1/3 AdminSidebar & AdminTopbar diberi catatan eksplisit bahwa jelas SAS diperlukan saat implementasi).
3. **Type consistency** — `adminNav.ts` type `AdminNavItem.roles: UserRole[]`; `getAdminNav`, `findActiveNav`, `flattenNav`, `dashboardHref` signature konsisten dipakai di sidebar/topbar/command-palette/guard.

---

## Execution Handoff

Setelah plan di-save, jalankan plan dengan subagent-driven (dispatcher) untuk eksekusi task-by-task dengan review — atau inline bila user pilih.