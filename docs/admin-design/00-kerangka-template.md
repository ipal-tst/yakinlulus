# Kerangka Template Admin — Sidebar, Topbar & Navigasi (Dokumen Desain)

> **Status:** Draft desain (greenfield — shell eksisting hanya referensi)
> **Tujuan:** kerangka navigasi terpadu utk seluruh area backoffice (SUPER_ADMIN/STAFF/GURU/
> FINANCE/INVESTOR). Menjadi **fondasi** penempatan semua modul yang didokumentasikan di
> `01-…-07-…md`.
> **Dasar:** `docs/superpowers/specs/2026-08-09-admin-shell-design.md` + `config/admin-nav.ts` + `design.md`.

---

## 1. Prinsip Kerangka

1. **Satu shell, banyak role** — layout sama utk semua role; isi (menu, breadcrumb, guard) berbeda
   berdasarkan role login (`getAdminNav(user.role)`).
2. **Nav = sumber kebenaran** — `config/admin-nav.ts` mendefinisikan grup+item+role; halaman
   placeholder yg belum dibangun ditandai badge (opsional), bukan dihapus.
3. **Role-aware guard** — SUPER_ADMIN bisa masuk semua area; STAFF admin+staff; GURU guru; dsb.
   SISWA/SUPER_SISWA ditolak dari backoffice.
4. **Konsisten design tokens** — seluruh kerangka memakai CSS variables dari `design.md`
   (sidebar 280/72px, topbar 72px, content max-w 1440/1600px).
5. **Responsive** — sidebar collapse di md-, mobile memakai Sheet (drawer kiri).

---

## 2. Arena Layout

```
┌──────────────┬─────────────────────────────────────────────────┐
│              │  TOPBAR (72px)                                   │
│   SIDEBAR    │  ┌───────────────────────────────────────────┐  │
│  (280px)     │  │ ⌘ menu   Breadcrumb      🔍  🌓  🔔  👤  │  │
│              │  └───────────────────────────────────────────┘  │
│  ══ grups ══ │                                                │
│  Dashboard   │   MAIN (max-w 1440, box 1600)                   │
│  Master      │                                                │
│  Konten      │       <slot> halaman per modul </slot>          │
│  Pengguna    │                                                │
│  Keuangan    │                                                │
│  Analitik    │                                                │
│  Sistem      │                                                │
│              │                                                │
│  [profil ft] │                                                │
└──────────────┴─────────────────────────────────────────────────┘
```

- Sidebar collapse → 72px (ikon saja + tooltip), toggle di topbar/sidebar.
- Mobile (< md): sidebar disembunyikan; hamburger → `Sheet` kiri 280px.

---

## 3. Struktur File (target greenfield)

```
frontend/src/
├── app/(admin)/admin/layout.tsx      guard + AdminShell   (eksisting, tetap)
├── app/(staff)/staff/layout.tsx                            (eksisting, tetap)
├── app/(guru)/guru/layout.tsx        (eksisting, tetap)
├── app/(finance)/finance/layout.tsx  (eksisting, tetap)
├── app/(investor)/investor/layout.tsx (eksisting, tetap)
├── components/layout/
│   ├── admin-shell.tsx     struct: <Sidebar/> + <Topbar/> + <main>
│   ├── admin-sidebar.tsx   grup+item nav (Collapsible), collapse, mobile Sheet
│   ├── admin-topbar.tsx    menu/breadcrumb/search/theme/notif/user
│   └── command-palette.tsx Ctrl+K navigasi cepat
├── components/ui/*         shadcn primitives (Tabs, Sheet, Collapsible, Command, dsb.)
├── config/admin-nav.ts     NAV TREE — satu-satunya sumber navigasi
├── stores/ui.store.ts      sidebarCollapsed, collapsedGroups (persist)
└── lib/auth.ts / stores/auth.store.ts
```

---

## 4. Model Navigasi (`config/admin-nav.ts`)

```ts
export type AdminNavItem = {
  title: string;            // label Indonesia
  href: string;             // route
  icon: LucideIcon;         // lucide outline 20
  roles: UserRole[];        // role yang boleh lihat
  badge?: "Segera" | number; // status/badge (mis. unread)
};
export type AdminNavGroup = {
  title: string;
  icon: LucideIcon;
  collapsible: boolean;
  roles: UserRole[];
  items: AdminNavItem[];
};
export function getAdminNav(role: UserRole): AdminNavGroup[]; // filter + urut tetap
export function isNavActive(href, pathname): boolean;          // active detection
export function dashboardHref(role): string;
export function flattenNav(groups): AdminNavItem[];            // utk cmd palette
```

---

## 5. NAV TREE LENGKAP (menggabungkan seluruh modul 01–07)

> Kolom `Roles`: `SA`=SUPER_ADMIN, `ST`=STAFF, `GU`=GURU, `FI`=FINANCE, `IN`=INVESTOR.

| # | Grup | Item | href | Roles |
|---|---|---|---|---|
| 1 | **Dashboard** | Dashboard Admin | `/admin` | SA,ST |
|   |  (auto per role, `DASHBOARD_BY_ROLE`) | Staff | `/staff` | ST |
|   |  | Guru | `/guru` | GU |
|   |  | Finance | `/finance` | FI |
|   |  | Investor Board | `/investor` | IN |
| 2 | **Master Akademik** | Akademik | `/admin/academic` | SA,ST |
|   |  | Import Akademik | `/admin/academic/import` | SA,ST |
|   |  | Kelola Sekolah | `/admin/schools` | SA,ST |
|   |  | Target Sekolah | (tab di schools) | SA,ST |
| 3 | **Konten & Ujian** | Materi Pelajaran | `/admin/materials` | SA,ST,GU |
|   |  | Bank Soal | `/admin/questions` | SA,ST,GU |
|   |  | Kelola Ujian | `/admin/exams` | SA,ST,GU |
|   |  | Media | `/admin/media` | SA,ST,GU |
| 4 | **Pengguna & Akses** | Kelola Pengguna | `/admin/users` | SA,ST |
|   |  | Role & Permission | `/admin/roles` | SA |
| 5 | **Broadcast & Notifikasi** | Kirim Pengumuman | `/staff/notifications` | SA,ST |
|   |  | Template Notifikasi | `/staff/notifications` (tab) | SA,ST |
| 6 | **Keuangan** | Dashboard Finance | `/finance` | FI,SA |
|   |  | Paket Membership | `/finance/plans` | FI,SA,IN |
|   |  | Pelanggan & Subscriber | `/finance/subscribers` | FI,SA,IN |
|   |  | Pembayaran & Invoice | `/finance/payments` | FI,SA |
|   |  | Transaksi | `/finance/transactions` | FI,SA |
|   |  | Payout | `/finance/payouts` | FI,SA |
|   |  | Laporan Keuangan | `/finance/reports` | FI,SA,IN |
| 7 | **Analitik & Laporan** | Analytics Admin | `/admin/analytics` | SA,ST |
|   |  | Laporan Hasil Belajar | `/admin/reports` | SA,ST |
|   |  | Investor Reports | `/investor/reports` | IN |
| 8 | **Sistem** | Monitoring & Config | `/admin/monitor-config` | SA,ST |
|   |  | CMS | `/admin/cms` | SA,ST |
|   |  | Health | `/admin/health` | SA |
|   |  | Audit Log | (tab monitor-config) | SA,ST |

> Nav tree di atas memakai structure eksisting `admin-nav.ts` dan mengambi peran sebagai dasar
> struktur navigasi; item yang belum dibangun memakai `badge:"Segera"`.

---

## 6. Kategori Nav & Ikon (Ref)

| Modul | Ikon Lucide | Keterangan |
|---|---|---|
| Dashboard | LayoutDashboard | aktive indicator utama |
| Akademik | GraduationCap | jenjang/kelas/mapel |
| Sekolah | Building2 | katalog |
| Target | Target | PTN/school target |
| Materi | BookOpen | learn material |
| Bank Soal | FolderKanban / HelpCircle | question |
| Ujian | FileCheck | exam |
| Media | Image / Film | asset |
| Pengguna | Users | user mgmt |
| Role/Permission | Shield / KeyRound | RBAC |
| Keuangan | Wallet / CreditCard | finance |
| Analitik | BarChart3 | analytics |
| CMS | Globe | cms |
| Monitoring | Activity / Gauge | system health |
| Broadcast | Megaphone | notification |

---

## 7. Komponen Rendering Nav (AdminSidebar)

1. **Group collapse** — `Collapsible` per group (state di `ui.store.collapsedGroups`, persist localStorage).
2. **Item** — `Link` role-filter, icon outline 20, active mendapat `bg-sidebar-accent` + icon text-primary.
3. **Collapse mode** — sidebar 72px: tampil ikon saja; `title` tooltip.
4. **Badge** — `badge:"Segera"` pil kecil amber; angka utk unread.
5. **Search nav** — `/menu` field filter item (filter client).
6. **Footer profil** — avatar + nama + role + menu logout.

---

## 8. Komponen Topbar (AdminTopbar)

```
┌──────────────────────────────────────────────────────────────┐
│ [☰]  ⌘ | Breadcrumb > Master Akademik > Import   [🔍] [🌓] [🔔] [👤▾] │
└──────────────────────────────────────────────────────────────┘
```

1. **Mobile menu toggle** — hamburger → Sheet kiri (md:hidden).
2. **Command Palette (Ctrl+K)** — Dialog + Input + daftar `flattenNav` (title/href, keyboard utility).
3. **Breadcrumb** — dari `pathname`; menampilkan "Dashboard › Grup › Halaman". Banggakan role-aware.
4. **Theme toggle** — `next-themes` (light/dark).
5. **Notification bell** — badge unread; dropdown list notifikasi admin (visible utk SA/ST).
6. **User menu** — avatar + nama + role + dropdown (Akun, Pengaturan, Keluar).

---

## 9. Guard & Role (Layout Route-group)

```tsx
// (admin)/admin/layout.tsx (contoh)
export function AdminLayout({children}) {
  const { user } = useAuthStore();
  return <AdminGuard allowed={["SUPER_ADMIN","STAFF"]} fallback="/login">
    <AdminShell>{children}</AdminShell>
  </AdminGuard>;
}
```

- `AdminGuard` — cek role; tolak redirect (SISWA → `/siswa`; unauthenticated → `/login`).
- SUPER_ADMIN: akses **semua** area backoffice.
- STAFF: admin + staff area.
- GURU/FINANCE/INVESTOR: area sendiri.
- Permission granular (modul/tindakan) akan di-supply oleh `role_permission` matrix (lihat `07-kelola-pengguna.md`).

---

## 10. Cross-Modul Navigation (brenjang group)

| Sumber halaman | Tautan keluar | Menuju |
|---|---|---|
| Dashboard Admin (quick actions) | Akademik, Pengguna, Analitik, Ujian | grup masing2 page |
| Master Akademik | Konten (Mapel → Materi) | materi terkait |
| Materi | "Buat Soal dari materi ini" | `/admin/questions/create` |
| Bank Soal | "Gunakan di Ujian" | `/admin/exams/create` |
| Sekolah | Target Sekolah | `/admin/schools` tab |
| Ujian | "Analitik" | `/admin/analytics` |

---

## 11. Design Tokens (dari `design.md`)

| Token | Nilai |
|---|---|
| Sidebar width | 280px / collapsed 72px |
| Topbar height | 72px |
| Content | max-w 1440px (box 1600px) |
| Radius (sidebar active) | 12 |
| Sidebar bg | `--sidebar` (Gray-50/900) |
| Active bg | `--sidebar-accent` + primary icon |
| Icon | lucide outline, stroke 2, 20 (menu) / 16 (mb) |
| Motion | 150/200ms fade/slide; tanpa bounce |
| Active indicator | `bg-primary/10` + `text-primary` |

---

## 12. State & Error Handling

| Kondisi | UI |
|---|---|
| Loading user | skeleton sidebar + topbar (bukan spinner) |
| Belum login | guard redirect `/login` |
| Role tak cukup | alert 403 + link dashboard role |
| Nav group kosong (role-filter) | grup disembunyikan, bukan menampilkan kosong |
| Mobile | drawer Sheet; backdrop click close |

---

## 13. Checklist Sebelum Implementasi Modul

- [x] Shell (sidebar+topbar) reuse utk semua `layout.tsx`.
- [x] Nav tree di `config/admin-nav.ts` memuat **semua** modul 01–07 (grup + role + badge).
- [x] Guard role di tiap route-group.
- [x] Command palette dari flattened nav.
- [x] Breadcrumb role-aware.
- [x] Responsive (collapse + Sheet).

---

**Dokumen terkait grup:** `01-master-akademik`, `02-kelola-sekolah`, `03-target-sekolah`,
`04-materi-pelajaran`, `05-bank-soal`, `06-ujian`, `07-kelola-pengguna`, `api-kontrak-admin`.