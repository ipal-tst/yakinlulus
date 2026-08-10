# Admin Dashboard Operasional — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merombak halaman `/admin` menjadi command-center operasional: 6 kartu KPI, status CBT (Draft/Published/Archived), distribusi skor (PieChart), kesehatan sistem, aktivitas terbaru, dan akses cepat — memakai TanStack Query (bukan `useEffect` manual) dengan data dari `GET /dashboard/admin` + `GET /analytics/admin/overview`. Frontend-only.

**Architecture:** Mapper murni (`dashboard-mappers.ts`) memetakan response backend → model display (label CBT benar, pass_rate tanpa ×100, bracket distribusi). Halaman `/admin` rewrite ke `useQuery` (keys `["admin-dashboard"]`, `["admin-overview"]`). Komponen presentasional dipisah ke `components/admin/dashboard/*`. Tidak ada perubahan backend / DB / endpoint.

**Tech Stack:** Next.js 16 + React 19, TypeScript strict, Tailwind v4, shadcn/ui tokens (design.md), TanStack Query, Recharts v3 (PieChart — sudah di package.json), lucide-react, Vitest (`*.test.ts`, env node; test hanya logika murni `.ts` — bukan komponen `.tsx`).

Sanity binding end: `Ref` untuk admin shell ~ `docs/superpowers/specs/2026-08-09-admin-dashboard-design.md`.

## Global Constraints

- **FRONTEND WRITE bebas** (AGENTS.md) — semua file di bawah `frontend/src/**`. Tidak ada file backend/DB diubah.
- **Design tokens** (design.md / globals.css): main `max-w-[1600px]`, content `max-w-[1440px]`, radius 12 default (card 16/20), shadow small → medium hover, warna token: `--primary` blue, `--success` green, `--warning` orange; badge status: DRAFT=outline, PUBLISHED=success, ARCHIVED=secondary.
- **PieChart maksimum 6 warna.** Warna bracket (dari CSS var existing): `bg-primary` (#2563EB), `bg-green-500`, `bg-orange-500`, `bg-[#7c3aed]` (violet accent). Mapping tetap, jangan ganti.
- **Bahasa UI:** Indonesia.
- **Ikon:** lucide-react outline stroke 2, ukuran 16/20/24.
- **Komponen yang memakai hooks client** wajib `"use client"` (interaktivitas). Komponen presentasional tanpa state tidak perlu.
- **Jangan menambah dependency npm baru.**
- **Grid/KPI konsisten** dengan `StatsCard` existing (`frontend/src/components/data-display/stats-card.tsx`) — deploy prop `description` untuk sub-label.
- **Verifikasi:** `npx tsc --noEmit`, `npm run lint`, `npm run test`.
- Halaman `/admin` tetap dibungkus `<AppShell>` (admin shell terpadu di spec terpisah); komponen reusable untuk dipasang ke `AdminShell` nanti.

---

## Keberadaan yang SUDAH DIPAKAI (jangan dibuat ulang)

- `frontend/src/services/dashboard.service.ts` — sudah punya `getAdminDashboard()` → `/dashboard/admin`.
- `frontend/src/services/analytics.service.ts` — sudah punya `getAdminOverview()` → `/analytics/admin/overview`.
- `frontend/src/types/admin.ts` — `AdminDashboard`, `KPIData`, `SystemHealth`, `ActiveUserStat`, `SchoolStat`, `CBTMonitoring`, `ActivityItem`.
- `frontend/src/components/data-display/stats-card.tsx` — `StatsCard`.
- `frontend/src/components/admin/page-header.tsx` — `PageHeader`.
- shadcn `Card`, `Badge`, `Button`, `Skeleton`.

---

## Struktur File

```
frontend/src/
├── utils/
│   └── dashboard-mappers.ts                    ◄── BARU (murni, di-test)
├── lib/
│   └── ... (tidak berubah)
├── services/
│   ├── analytics.service.ts                    ◄── UPDATE: type AdminOverview diperluas
│   └── dashboard.service.ts                    (tidak berubah)
├── components/admin/dashboard/
│   ├── admin-dashboard-header.tsx              ◄── BARU (wrapper PageHeader + tombol Muat Ulang)
│   ├── admin-kpi-grid.tsx                      ◄── BARU
│   ├── admin-exam-status.tsx                   ◄── BARU
│   ├── admin-score-distribution.tsx            ◄── BARU (PieChart)
│   ├── admin-system-health.tsx                 ◄── BARU
│   ├── admin-recent-activity.tsx               ◄── BARU
│   └── admin-quick-actions.tsx                 ◄── BARU
├── app/(admin)/admin/page.tsx                  ◄── REWRITE (TanStack Query)
└── types/admin.ts                              (tidak berubah — sudah lengkap)
```

---

### Task 1: `dashboard-mappers.ts` — mapper murni + tes (TDD)

**Files:**
- Create: `frontend/src/lib/dashboard-mappers.ts`
- Test: `frontend/src/lib/dashboard-mappers.test.ts`

**Interfaces:**
- Produces (dipakai Task 2–7):
  ```ts
  type CBTStatus = { label: string; value: number; variant: "outline" | "success" | "secondary" };
  type ScoreBracket = { name: string; value: number; color: string };
  export function dumpKPI(dash: AdminDashboard) → { students, teachers, active24, onlineNow, schoolActive, schoolTotal, schoolVerified, contentQuestions, contentMaterials, contentExams }
  export function mapCBTStatus(m: CBTMonitoring) → [CBTStatus, CBTStatus, CBTStatus]  // Draft/Published/Archived pakai value scheduled/running/finished
  export function mapScoreDistribution(ov) → ScoreBracket[]   // 4 bracket; empty jadi []
  export function formatPassRate(v?: number) → string         // "85.3%" ; undefined → "-" ; jangan dikali 100
  export function formatAvg(v?: number) → string              // "123.4" ; undefined → "-"
  export function uptimeLabel(h?: number) → string            // 0/undefined → "-"; else floor(h/24) + " hari" (sisa jam bila < 24: "X jam")
  ```

- [ ] **Step 1: tulis failing test**

`frontend/src/lib/dashboard-mappers.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { dumpKPI, mapExamStatus, mapScoreDistribution, formatPct, formatAvg, uptimeLabel } from "./dashboard-mappers";
import { AdminDashboard, CBTMonitoring } from "@/types/admin";

const dash = {
  kpi: { total_students: 120, total_teachers: 8, total_questions: 340, total_materials: 55, total_exams: 12, total_users: 0, active_today: 0, total_schools: 0 },
  active_users: { online_now: 3, active_24h: 88 },
  school_stats: { total: 10, active: 7, verified: 4 },
} as AdminDashboard;

describe("dumpKPI", () => {
  it("memetakan field operasional yang benar", () => {
    const k = dumpKPI(dash);
    expect(k).toEqual({ students: 120, teachers: 8, active24: 88, onlineNow: 3, schoolActive: 7, schoolTotal: 10, schoolVerified: 4, contentQuestions: 340, contentMaterials: 55, contentExams: 12 });
  });
});

describe("mapExamStatus", () => {
  it("memetakan scheduled→Draft, running→Published, finished→Archived", () => {
    const m: CBTMonitoring = { scheduled: 2, running: 5, finished: 9 };
    expect(mapExamStatus(m)).toEqual([
      { label: "Draft", value: 2 },
      { label: "Published", value: 5 },
      { label: "Archived", value: 9 },
    ]);
  });
});

describe("mapScoreDistribution", () => {
  it("memetakan 4 bracket", () => {
    const d = mapScoreDistribution({ score_distribution: { bracket_700_plus: 3, bracket_600_699: 4, bracket_500_599: 5, bracket_below_500: 2 }, total_participants: 14 });
    expect(d).toHaveLength(4);
    expect(d[0].name).toBe("≥700");
    expect(d.reduce((s, x) => s + x.value, 0)).toBe(14);
  });
  it("mengembalikan empty saat nihil", () => {
    expect(mapScoreDistribution({})).toEqual([]);
  });
});

describe("formatPct / formatAvg / uptimeLabel", () => {
  it("pass_rate tetap % (0-100) tanpa dikali 100", () => {
    expect(formatPct(85)).toBe("85.0%");
    expect(formatPct(0)).toBe("0.0%");
    expect(formatPct(undefined)).toBe("-");
  });
  it("formatAvg 1 desimal", () => {
    expect(formatAvg(64.25)).toBe("64.3");
    expect(formatAvg(undefined)).toBe("-");
  });
  it("uptime", () => {
    expect(uptimeLabel(undefined)).toBe("-");
    expect(uptimeLabel(50)).toBe("2 hari");
    expect(uptimeLabel(5)).toBe("5 jam");
  });
});
```

- [ ] **Step 2: jalankan, pastikan FAIL**

Run: `npx vitest run src/lib/dashboard-mappers.test.ts`
Expected: FAIL — "Cannot find module './dashboard-mappers'".

- [ ] **Step 3: implementasi minimal**

`frontend/src/lib/dashboard-mappers.ts`:
```ts
export type KPIValues = { students: number; teachers: number; active24: number; onlineNow: number; schoolActive: number; schoolTotal: number; schoolVerified: number; contentQuestions: number; contentMaterials: number; contentExams: number };
export type ExamStatus = { label: "Draft" | "Published" | "Archived"; value: number };
export type ScoreBracket = { name: string; value: number; color: string };

export function dumpKPI(d: { kpi?: any; active_users?: any; school_stats?: any }): KPIValues {
  const k = d.kpi ?? {};
  const a = d.active_users ?? {};
  const s = d.school_stats ?? {};
  return {
    students: k.total_students ?? 0,
    teachers: k.total_teachers ?? 0,
    active24: a.active_24h ?? 0,
    onlineNow: a.online_now ?? 0,
    schoolActive: s.active ?? 0,
    schoolTotal: s.total ?? 0,
    schoolVerified: s.verified ?? 0,
    contentQuestions: k.total_questions ?? 0,
    contentMaterials: k.total_materials ?? 0,
    contentExams: k.total_exams ?? 0,
  };
}

export function mapExamStatus(m: { scheduled?: number; running?: number; finished?: number }): ExamStatus[] {
  return [
    { label: "Draft", value: m.scheduled ?? 0 },
    { label: "Published", value: m.running ?? 0 },
    { label: "Archived", value: m.finished ?? 0 },
  ];
}

const BRACKET_COLORS = ["#2563eb", "#16a34a", "#f97316", "#7c3aed"];

export function mapScoreDistribution(overview: any): ScoreBracket[] {
  const sd = overview?.score_distribution;
  if (!sd) return [];
  const items: [string, number][] = [
    ["≥700", sd.bracket_700_plus ?? 0],
    ["600–699", sd.bracket_600_699 ?? 0],
    ["500–599", sd.bracket_500_599 ?? 0],
    ["<500", sd.bracket_below_500 ?? 0],
  ];
  return items.filter(([, v]) => v > 0).map(([name, value], i) => ({ name, value, color: BRACKET_COLORS[i % BRACKET_COLORS.length] }));
}

export function formatPct(v?: number): string {
  if (v === undefined || v === null) return "-";
  return `${v.toFixed(1)}%`;
}

export function formatAvg(v?: number): string {
  if (v === undefined || v === null) return "-";
  return v.toFixed(1);
}

export function uptimeLabel(h?: number): string {
  if (h === undefined || h === null || h <= 0) return "-";
  if (h < 24) return `${Math.round(h)} jam`;
  return `${Math.floor(h / 24)} hari`;
}
```

- [ ] **Step 4: jalankan, pastikan PASS**

Run: `npx vitest run src/lib/dashboard-mappers.test.ts`
Expected: PASS (all green).

- [ ] **Step 5: commit**

```bash
git add frontend/src/lib/dashboard-mappers.ts frontend/src/lib/dashboard-mappers.test.ts
git commit -m "feat(dashboard): mapper murni untuk KPI admin + tes"
```

---

### Task 2: Perluas type `AdminOverview` di `analytics.service.ts`

**Files:**
- Modify: `frontend/src/services/analytics.service.ts`
- Test: `frontend/src/services/analytics.service.test.ts` (extend)

**Interfaces:**
- Consumes: Task 1 mappers (type `ScoreBracket`).
- Produces: `AdminOverview` dengan `score_distribution`, `total_participants`, `average_score`, `pass_rate` bertipe eksplisit.

- [ ] **Step 1: tulis tes yang gagal** — tambah ke `analytics.service.test.ts` assertion shape:

```ts
it("exposes score_distribution & total_answers from overview", async () => {
  apiMock.mockResolvedValue({
    total_participants: 14,
    avg_score: 61.2,
    pass_rate: 42.85,
    score_distribution: { bracket_700_plus: 3, bracket_600_699: 4, bracket_500_599: 5, bracket_below_500: 2 },
  });
  const res = await analyticsService.getAdminOverview();
  expect(res.score_distribution.bracket_700_plus).toBe(3);
  expect(res.total_participants).toBe(14);
});
```

- [ ] **Step 2: run, pastikan FAIL** (type `AdminOverview` sekarang `[key:string]: unknown` → `res.score_distribution` dianggap `unknown`, runtime test bisa gagal).

Run: `npx vitest run src/services/analytics.service.test.ts`

- [ ] **Step 3: implementasi** — ganti type `AdminOverview` di `analytics.service.ts`:

```ts
export interface ScoreDistributionBreakdown {
  bracket_700_plus?: number;
  bracket_600_699?: number;
  bracket_500_599?: number;
  bracket_below_500?: number;
}
export interface AdminOverview {
  total_participants?: number;
  total_exams?: number;
  total_questions?: number;
  total_answers?: number;
  avg_score?: number;
  pass_rate?: number;
  item_fit_index?: number;
  score_distribution?: ScoreDistributionBreakdown;
  subject_performance?: { subject_id: string; subject_name: string; avg_score: number; difficulty: string; total_questions: number }[];
}
```

- [ ] **Step 4: run PASS** `npx vitest run src/services/analytics.service.test.ts`

- [ ] **Step 5: commit** `feat(analytics): type AdminOverview diperluas (bracket, participant)`

---

### Task 3: `admin-kpi-grid.tsx` + konek ke mapper

**Files:**
- Create: `frontend/src/components/admin/dashboard/admin-kpi-grid.tsx`

**Interfaces:**
- Consumes: `dumpKPI` (Task 1), `AdminDashboard`, `StatsCard`.
- Produces: `<AdminKPIGrid dash={AdminDashboard} />` dipakai Task 7.

- [ ] **Step 1–4 (tanpa tes komponen — logika sudah covered Task 1; komponen presentasional):**

`frontend/src/components/admin/dashboard/admin-kpi-grid.tsx`:
```tsx
"use client";
import { Users, Wifi, GraduationCap, BookOpenCheck, Building2, Layers } from "lucide-react";
import { StatsCard } from "@/components/data-display/stats-card";
import { dumpKPI } from "@/lib/dashboard-mappers";
import type { AdminDashboard } from "@/types/admin";

export function AdminKPIGrid({ dash }: { dash: AdminDashboard | null }) {
  const k = dumpKPI(dash);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatsCard title="Pengguna Aktif 24j" value={k.active24} icon={Users} />
      <StatsCard title="Online Sekarang" value={k.onlineNow} icon={Wifi} description="live" />
      <StatsCard title="Total Siswa" value={k.students} icon={GraduationCap} />
      <StatsCard title="Total Guru" value={k.teachers} icon={BookOpenCheck} />
      <StatsCard title="Sekolah Aktif" value={k.schoolActive} description={`terdaftar ${k.schoolTotal} · terverifikasi ${k.schoolVerified}`} icon={Building2} />
      <StatsCard title="Konten Platform" value={k.contentQuestions} description={`${k.contentMaterials} materi · ${k.contentExams} ujian`} icon={Layers} />
    </div>
  );
}
```

- [ ] **Step 5: commit** `feat(dashboard): grid KPI 6 kartu`

---

### Task 4: `admin-exam-status.tsx` + tes status (opsional mapper sudah di-test Task 1)

**Files:**
- Create: `frontend/src/components/admin/dashboard/admin-exam-status.tsx`

**Interfaces:**
- Consumes: `mapExamStatus` (Task 1), `Badge`.
- Produces: `AdminExamStatus({ monitor })` — kolom kiri "Ujian & Tryout".

- [ ] **Step 1–4:**

```tsx
"use client";
import { Badge } from "@/components/ui/badge";
import { mapExamStatus } from "@/lib/dashboard-mappers";
import type { CBTMonitoring } from "@/types/admin";

const VARIANT = { Draft: "outline", Published: "success", Archived: "secondary" } as const;

export function AdminExamStatus({ monitor }: { monitor?: CBTMonitoring }) {
  const items = mapExamStatus(monitor);
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.label} className="flex items-center justify-between rounded-xl border border-border p-4">
          <span className="text-sm font-medium">{it.label}</span>
          <Badge variant={VARIANT[it.label]}>{it.value}</Badge>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: commit** `feat(dashboard): status ujian Draft/Published/Archived`

---

### Task 5: `admin-score-distribution.tsx` — PieChart + stats

**Files:**
- Create: `frontend/src/components/admin/dashboard/admin-score-distribution.tsx`
- Pastikan recharts di-import dari `recharts` (sudah ada di package.json v3).

**Interfaces:**
- Consumes: `AdminOverview`, `mapScoreDistribution`, `formatPct`, `formatAvg`, Card, Skeleton.
- Produces: `AdminScoreDistribution({ overview, isLoading })`.

- [ ] **Step 1–4:**

```tsx
"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { mapScoreDistribution, formatPct, formatAvg } from "@/lib/dashboard-mappers";
import type { AdminOverview } from "@/services/analytics.service";

export function AdminScoreDistribution({ overview, isLoading }: { overview?: AdminOverview; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-56 w-full rounded-2xl" />;
  const data = mapScoreDistribution(overview);
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Distribusi Skor Peserta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data skor.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center justify-between">
          {mapScoreDistribution(overview).map((b) => (
            <div key={b.name} className="text-center">
              <p className="text-lg font-bold">{b.value}</p>
              <p className="text-xs text-muted-foreground">{b.name}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-muted p-3"><p className="text-muted-foreground">Skor rerata</p><p className="font-bold text-base">{formatAvg(overview?.avg_score)}</p></div>
          <div className="rounded-xl bg-muted p-3"><p className="text-muted-foreground">Tingkat lulus</p><p className="font-bold text-base">{formatPct(overview?.pass_rate)}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: commit** `feat(dashboard): distribusi skor PieChart`

---

### Task 6: `admin-system-health.tsx`, `admin-recent-activity.tsx`, `admin-quick-actions.tsx`

**Files:** Create 3 komponen berikut (presentasional, tidak ada logika baru — formatPct/formatAvg/uptimeLabel dari Task 1).

- **`admin-system-health.tsx`** — 4 kartu (Shield API, Database DB, HardDrive Storage %, Activity Uptime) memakai `uptimeLabel`; warna: green/blue/orange. isi dari `SystemHealth`.
- **`admin-recent-activity.tsx`** — list `ActivityItem[]`; ikon per type (`user`→Users, `exam`→FileCheck, `material`→BookOpen, default→Activity); empty state CTA ke `/admin/exams`; tampilkan `message` + waktu (`created_at` di-format `new Date(...).toLocaleString("id-ID")`).
- **`admin-quick-actions.tsx`** — grid 4 kartu link: Master Akademik `/admin/academic`, Kelola Pengguna `/admin/users`, Analitik & Laporan `/admin/analytics`, Kelola Ujian `/admin/exams`. Memakai `PageHeader`-style card; ikon ArrowRight.

Skeleton masing-masing section saat `isLoading` gunakan `Skeleton h-... w-full rounded-2xl` (bukan spinner). Komponen `isLoading?: boolean` menjadi prop opsional.

- [ ] **Step 1–4: tulis file di atas** (konten sesuai deskripsi, sesuaikan import `@/components/ui/card`, `lucide-react`, `Skeleton`, `Button`).

- [ ] **Step 5: commit** `feat(dashboard): health, recent activity, quick actions`

---

### Task 7: Rewrite halaman `/admin`

**Files:**
- Modify: `frontend/src/app/(admin)/admin/page.tsx` (REWRITE)

**Interfaces:**
- Consumes: `dashboardService.getAdminDashboard`, `analyticsService.getAdminOverview`, komponen Task 3–6, `PageHeader`, `Skeleton`.
- Produces: halaman `/admin` final.

- [ ] **Step 1–4: rewrite**

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { analyticsService } from "@/services/analytics.service";
import { AdminKPIGrid } from "@/components/admin/dashboard/admin-kpi-grid";
import { AdminExamStatus } from "@/components/admin/dashboard/admin-exam-status";
import { AdminScoreDistribution } from "@/components/admin/dashboard/admin-score-distribution";
import { AdminSystemHealth } from "@/components/admin/dashboard/admin-system-health";
import { AdminRecentActivity } from "@/components/admin/dashboard/admin-recent-activity";
import { AdminQuickActions } from "@/components/admin/dashboard/admin-quick-actions";

export default function AdminDashboardPage() {
  const dashQuery = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => dashboardService.getAdminDashboard(), staleTime: 30_000, refetchOnWindowFocus: true });
  const overviewQuery = useQuery({ queryKey: ["admin-overview"], queryFn: () => analyticsService.getAdminOverview(), staleTime: 30_000, refetchOnWindowFocus: true });

  const err = dashQuery.error ?? overviewQuery.error;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Admin"
          description="Ringkasan operasional platform: aktivitas pengguna, ujian, konten, dan kesehatan sistem."
          actions={
            <Button variant="outline" size="sm" onClick={() => { dashQuery.refetch(); overviewQuery.refetch(); }} className="rounded-lg">
              <RefreshCw className={dashQuery.isFetching ? "animate-spin" : ""} /> Muat Ulang
            </Button>
          }
        />

        {err && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Gagal memuat sebagian data.</span>
            <Button variant="ghost" size="sm" onClick={() => { dashQuery.refetch(); overviewQuery.refetch(); }} className="ml-auto rounded-lg">Coba Lagi</Button>
          </div>
        )}

        <AdminKPIGrid dash={dashQuery.data ?? null} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Ujian &amp; Tryout</h3>
            {dashQuery.isLoading ? (
              <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : (
              <AdminExamStatus monitor={dashQuery.data?.cbt_monitoring} />
            )}
          </section>
          <AdminScoreDistribution overview={overviewQuery.data} isLoading={overviewQuery.isLoading} />
        </div>

        <AdminSystemHealth health={dashQuery.data?.system_health} isLoading={dashQuery.isLoading} />
        <AdminQuickActions />
        <AdminRecentActivity items={dashQuery.data?.recent_activity} isLoading={dashQuery.isLoading} />
      </div>
    </AppShell>
  );
}
```

Tambahkan `import { Skeleton } from "@/components/ui/skeleton";` di blok import (dipakai di loading badges).

- [ ] **Step 5: tsc**

Run: `npx tsc --noEmit` di `frontend/` → pastikan seluruh proyek lolos; perbaiki error type bila muncul.

- [ ] **Step 6: lint**

Run: `npm run lint` di `frontend/` — perbaiki semua warning (unused import, dsb).

- [ ] **Step 7: test**

Run: `npm test` — seluruh suite hijau.

- [ ] **Step 8: commit** `feat(dashboard): halaman /admin command-center operasional (TanStack Query)`

---

### Task 8: Dokumentasi singkat + selesai

**Files:**
- Modify: `docs/frontend/PAGE-WIRING.md` — update baris `/admin` deksripsi halaman baru (opsional satu baris, tanpa merombak).

**Interfaces:** tidak ada.

- [ ] **Step 1:** Jalankan `git status` — pastikan commit kamu tetap scoped (hanya `frontend/**` + `docs/frontend/PAGE-WIRING.md`). JANGAN commit file tak terkait (`docs/superpowers/plans/2026-08-09-admin-shell.md`, `frontend/src/app/(siswa)/membership/` dll — itu milik task lain).

- [ ] **Step 2: final check** `npx tsc --noEmit && npm run lint && npm test`

- [ ] **Step 3:** Umumkan selesai + ringkasan bagian yang dikerjakan.