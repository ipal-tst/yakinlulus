# Admin Dashboard (Operasional) — Design Document

> **Tanggal:** 2026-08-09
> **Status:** Approved (menunggu review user)
> **Cakupan:** Perombakan halaman `/admin` (Dashboard Super Admin) menjadi command-center
> operasional berbasis endpoint existing — tanpa perubahan backend.

## 1. Tujuan

Halaman `/admin` saat ini menampilkan 8 KPI, health statis, quick nav, dan recent activity
dengan `useEffect` manual serta beberapa mapping data yang salah (label CBT monitoring misal,
field KPI mismatch, pass rate dikali 100 dua kali). Tujuan: jadikan halaman ini command center
**operasional** — aktivitas real-time, status ujian, konten, dan kesehatan sistem — dengan
mengikuti pola TanStack Query yang dipakai halaman admin lain dan token design `design.md`.

Frontend-only. **Tidak ada perubahan backend / DB.** Memakai endpoint yang sudah tersedia.

## 2. Keputusan Kunci (hasil brainstorming)

| Area | Keputusan |
|---|---|
| Fokus | Operasional: aktivitas real-time, status CBT/ujian, konten, kesehatan sistem |
| Struktur | Single page scroll |
| Data source | Endpoint existing: `GET /dashboard/admin` + `GET /analytics/overview` |
| Refresh | TanStack Query, `refetchOnWindowFocus: true`, staleTime 30s, tombol "Muat Ulang" |
| KPI | 6 kartu gabungan (aktivitas pengguna + jumlah user/sekolah + konten) |
| Perbaikan | Mapper ulang benar: label CBT (draft/published/archived), pass_rate tidak dikali 100, field KPI dibaca dari key yang benar |

## 3. Sumber Data

| Query | Endpoint | Key | Dipakai untuk |
|---|---|---|---|
| Dashboard | `GET /dashboard/admin` | `["admin-dashboard"]` | KPI, active_users, school_stats, cbt_monitoring, system_health, recent_activity |
| Overview | `GET /analytics/admin/overview` | `["admin-overview"]` | distribusi skor (bracket), avg score, pass rate |

Pemetaan field (existing response):

- `kpi.total_students`, `kpi.total_teachers`, `kpi.total_questions`, `kpi.total_materials`, `kpi.total_exams`
- `active_users.active_24h`, `active_users.online_now`
- `school_stats.total`, `school_stats.active`, `school_stats.verified`
- `cbt_monitoring.scheduled` (DRAFT), `cbt_monitoring.running` (PUBLISHED), `cbt_monitoring.finished` (ARCHIVED)
- `system_health.{api_status, db_status, storage_usage, uptime_hours}`
- `recent_activity[{type,message,created_at}]`
- Overview: `avg_score`, `pass_rate`, `total_participants`, `score_distribution.{bracket_700_plus,bracket_600_699,bracket_500_599,bracket_below_500}`

> Catatan: `cbt_monitoring` fields saat ini di-backend menyimpan DRAFT/PUBLISHED/ARCHIVED
> counts dengan nama `scheduled/running/finished`. Selama backend belum berubah, UI memetakan
> ulang label menjadi **Draft / Published / Archived**. Ketika mislabeling diperbaiki di sisi
> backend, hanya UI perlu menyesuaikan.

## 4. Arsitektur File (front-end only)

```
frontend/src/
├── app/(admin)/admin/page.tsx          ◄── REWRITE: manual useEffect → TanStack Query
├── components/admin/dashboard/
│   ├── admin-dashboard-header.tsx      ◄── BARU: PageHeader + tombol "Muat Ulang"
│   ├── admin-kpi-grid.tsx              ◄── BARU: 6 StatsCard
│   ├── admin-exam-status-card.tsx      ◄── BARU: badge Draft/Published/Archived
│   ├── admin-score-distribution.tsx    ◄── BARU: pie distribusi skor + avg/pass rate
│   ├── admin-system-health.tsx         ◄── BARU: 4 kartu health (dipindah dari page)
│   ├── admin-recent-activity.tsx       ◄── BARU: list recent activity + empty state
│   └── admin-quick-actions.tsx         ◄── BARU: kartu navigasi cepat
└── services/analytics.service.ts       ◄── DIPAKAI (sudah ada `getAdminOverview()`)
```

Keputusan: `getAdminOverview()` SUDAH ada di `frontend/src/services/analytics.service.ts`
(`GET /analytics/admin/overview`). Frontend memakai service itu; tidak menambah fungsi baru.
Type `AdminDashboard` di `frontend/src/types/admin.ts` tetap dipakai untuk `/dashboard/admin`.
Type `AdminOverview` (di `analytics.service.ts`) dipakai untuk hasil overview; bagian
`score_distribution` dan `subject_performance` ditambahkan bila belum ada di type tsb.

## 5. UI Structure

```
┌────────────────────────────────────────────────────────────┐
│ PageHeader "Dashboard Admin" + desc operasional +           │
│   tombol Muat Ulang (rotasi ikon saat refetching)          │
├────────────────────────────────────────────────────────────┤
│ GRID KPI (6 kolom pada lg, 2 pada sm)                      │
│   Pengguna Aktif 24j  Online Now (badge live)  Total Siswa │
│   Total Guru  Sekolah Aktif (sub: terdaftar·terverifikasi) │
│   Konten Platform (sub: soal·materi·ujian)                 │
├────────────────────────────────────────────────────────────┤
│ "Ujian & Tryout" — grid 2 kolom                          │
│  kiri: 3 kartu status (Draft / Published / Archived)       │
│  kanan: distribusi skor (PieChart bracket) + avg score &    │
│         pass rate badge                                    │
├────────────────────────────────────────────────────────────┤
│ "Kesehatan Sistem" — grid 4 kolom                          │
│   API Status · DB Status · Storage % · Uptime              │
├────────────────────────────────────────────────────────────┤
│ Grid 2 kolom:                                              │
│   kiri: "Aktivitas Terbaru" (list type-icon + message +    │
│         waktu; empty state CTA)                            │
│   kanan: "Akses Cepat" 4 kartu nav (Akademik, Pengguna,    │
│         Analitik, Ujian)                                   │
└────────────────────────────────────────────────────────────┘
```

Letak: tetap `<AppShell>` (admin shell terpadu dirilis terpisah di spec
`2026-08-09-admin-shell-design.md`; halaman ini sedapat mungkin reusable agar mudah
dipindahkan ke shell baru).

## 6. Behavior & States

- **Loading:** skeleton di setiap section (bukan spinner). Grid KPI 6 skeleton h-24; section lain skeleton h-28.
- **Error:** banner merah + tombol "Coba Lagi" yang me-refetch kedua query. Jika salah satu gagal, section yang sukses tetap tampil.
- **Empty:** `recent_activity` kosong → card "Belum ada aktivitas terbaru" + CTA ke `/admin/exams`.
- **Refresh:** tombol "Muat Ulang" di header memanggil `refetch()`; `refetchOnWindowFocus:true`; `staleTime: 30_000`.
- **Ikon semantics:** type activity `user`=Users, `exam`=FileCheck, `material`=BookOpen; unknown=Activity.
- **Pass rate / avg score:** tampil 1 desimal (`toFixed(1)`), pass_rate yg sudah dalam bentuk persen tidak dikali ulang, dilabeli "%".

## 7. Error & Edge Case

- Response `/dashboard/admin` nullable field → default `0` / caption "-".
- Pie distribusi skor kosong (participants 0) → state empty "Belum ada data ujian" kecil.
- `uptime_hours` masih `0` saat backend belum hitung → tampil "—" (bukan "0 hari").

## 8. Test

- Vitest pada komponen pure (baru):
  - `admin-kpi-grid`: mapping field benar (tidak lagi baca `total_users` dsb yang salah key), angka pas.
  - `admin-score-distribution`: 4 bracket dari overview; empty state saat `total_answers=0`; pass_rate render tanpa ×100.
  - `admin-exam-status`: mapping scheduled→Draft dst.
- Tidak ada test backend (tidak ada perubahan backend).

## 9. Batas Scope (non-goals)

- Tidak menambahkan endpoint baru, tidak menyentuh backend/DB.
- Tidak mengubah `AdminDashboard` type kecuali diperlukan untuk type-check.
- Tidak merombak shell/layout (itu spec terpisah).
- Tidak menambah polling real-time 30-an det.