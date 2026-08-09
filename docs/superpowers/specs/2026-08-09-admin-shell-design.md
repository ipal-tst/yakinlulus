# Admin Shell Terpadu — Design Document

> **Tanggal:** 2026-08-09
> **Status:** Approved (menunggu review user)
> **Cakupan:** Kerangka Admin (topnav + sidebar) untuk semua role backoffice.

## 1. Tujuan

Satu kerangka layout terpadu untuk area backoffice YakinLulus.id — **SUPER_ADMIN, STAFF, GURU,
FINANCE, INVESTOR** — menggantikan pola lama di mana ~40 halaman masing-masing menampilkan
`<AppShell>` sendiri tanpa layout group, nav per-role di-hardcode di `sidebar.tsx`, tanpa auth guard,
dan topbar menunjuk link siswa.

## 2. Keputusan Kunci (hasil brainstorming)

| Area | Keputusan |
|---|---|
| Cakupan | Satu Admin Shell terpadu untuk semua role backoffice |
| Nav | Grouped by module + submenu collapsible (`Collapsible` shadcn) |
| Layout | `layout.tsx` per route-group (`(admin)`, `(staff)`, `(guru)`, `(finance)`, `(investor)`) |
| Topbar | Command Palette (shadcn `Command` + `Dialog`) + Breadcrumb + theme toggle + notif admin + user menu role-aware |
| Nav drift | Nav tree jadi source-of-truth utk semua modul termasuk yang belum dibangun (placeholder "Segera") |
| Guard | Role guard di layout; **SUPER_ADMIN bisa masuk semua area**; STAFF hanya admin+staff; SISWA/SUPER_SISWA ditolak dari area backoffice |
| Dashboards | Role-aware: kandungan KPI tiap dashboard beda per role (GURU = KPI konten+progress murid binaan; FINANCE = KPI keuangan; INVESTOR = laporan+pertumbuhan) |
| Cmd palette | Pakai komponen shadcn `command` (`cmdk` otomatis dependency; tanpa install manual tambahan) |

## 3. Arsitektur File

```
frontend/src/
├── app/
│   ├── layout.tsx                        (existing — Providers, font)
│   ├── (admin)/admin/layout.tsx          ◄── BARU  guard + AdminShell
│   ├── (staff)/staff/layout.tsx          ◄── BARU
│   ├── (guru)/guru/layout.tsx            ◄── BARU
│   ├── (finance)/finance/layout.tsx      ◄── BARU
│   ├── (investor)/investor/layout.tsx    ◄── BARU
│   └── **/page.tsx (backoffice)          ◄── lepas <AppShell>
├── components/
│   ├── layout/
│   │   ├── admin-shell.tsx      ◄── BARU (pengganti AppShell utk backoffice)
│   │   ├── admin-sidebar.tsx    ◄── BARU (grouped nav + submenu, role-aware)
│   │   ├── admin-topbar.tsx     ◄── BARU (breadcrumb + cmd + theme + notif + user)
│   │   └── command-palette.tsx  ◄── BARU
│   ├── ui/command.tsx           ◄── shadcn (npx shadcn add command)
│   └── (existing: app-shell.tsx tetap utk siswa)
├── config/admin-nav.ts          ◄── BARU (nav tree grouped + roles + metadata)
├── stores/ui.store.ts           ◄── extend (expand state per group, persist)
└── lib/auth.ts / stores/auth.store.ts  (existing, dipakai guard)
```

## 4. Model Navigasi (`config/admin-nav.ts`)

```ts
type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: "Segera";           // modul yang halamannya belum dibangun
};
type AdminNavGroup = {
  title: string;
  icon: LucideIcon;
  collapsible: boolean;
  items: AdminNavItem[];
  roles: UserRole[];          // grup disembunyikan penuh bila filter kosong
};
```

- **getAdminNav(user: User): AdminNavGroup[]** — filter item/group berdasar role, simpan urutan tetap.
- **Dashboard** = grup tunggal, item = dashboard utk role login (dari map `DASHBOARDS`).

### Daftar grup & item (role-filter)

| Grup | Item (href) | Roles |
|---|---|---|
| Dashboard | (per role: `/admin`, `/staff`, `/guru`, `/finance`, `/investor`) | semua |
| Konfigurasi Umum | Monitoring & Config `/admin/monitor-config`, Health `/admin/health`, CMS `/admin/cms` | SUPER_ADMIN, STAFF |
| Master Akademik | Akademik `/admin/academic`, Sekolah `/staff/schools`, Target Sekolah `/staff/target-schools` | SUPER_ADMIN, STAFF |
| Konten & Ujian | Materi `/admin/materials`, Bank Soal `/admin/questions`, Media `/guru/media`, Kelola Ujian `/admin/exams` | SUPER_ADMIN, STAFF, GURU (role-gated per item) |
| Pengguna & Komunikasi | Kelola Pengguna `/admin/users`, Broadcast Notifikasi `/staff/notifications`, AI `/staff/ai` | SUPER_ADMIN, STAFF |
| Finance | Paket `/finance/plans`, Pelanggan `/finance/subscribers`, Pembayaran `/finance/payments`, Transaksi `/finance/transactions`, Payout `/finance/payouts`, Laporan `/finance/reports` | SUPER_ADMIN, FINANCE |
| Analisis & Laporan | Analytics `/admin/analytics`, Investor Board `/investor`, Financial Reports `/investor/reports` | SUPER_ADMIN + FINANCE/INVESTOR per item |
| Sistem | Audit Log `/staff/audit`, Monitoring `/admin/monitor-config` | SUPER_ADMIN, STAFF |

> Urutan dan ikon final ditetapkan saat implementasi; grup Dashboard tetap pertama.

## 5. Sidebar (wireframe)

```
┌─ SIDEBAR (280px / collapsed 72px) ───────────────┐
│  [YL]  YakinLulus.id                              │
│        {caption role}                            │
│──────────────────────────────────────────────────│
│  ⌕ Cari menu…        (filter lokal grup/item)     │
│──────────────────────────────────────────────────│
│  ■  Dashboard                                     │
│  ≡  Master Akademik     ▾  (Collapsible)          │
│  ≡  Konten & Ujian      ▾                         │
│  ≡  Pengguna & Komunikasi ▾                       │
│  ≡  Analisis & Laporan  ▾                          │
│  ≡  Sistem              ▾                         │
│──────────────────────────────────────────────────│
│  👤 [avatar] Nama      ▾                        │
│      Role                                       │
└──────────────────────────────────────────────────┘
```

- Item aktif: `pathname.startsWith(href)`; highlight `bg-primary/10` + text primary.
- Group tanpa item ber-role → disembunyikan.
- Item "Segera" → badge amber kecil; klik → halaman placeholder (empty-state).
- Collapse desktop: ikon saja + tooltip; group → flyout hover.
- Mobile: `Sheet` drawer (seperti MobileSidebar existing).

## 6. Topbar (wireframe)

```
┌─ TOPBAR (72px, sticky, backdrop-blur) ─────────────────────────────────────┐
│ ☰  Beranda / Master Akademik / Grade      │  ⌕  ☾  🔔  👤 Nama ▾      │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Breadcrumb** (shadcn `Breadcrumb`): `Beranda / {Grup} / {Item}` — dari nav config.
- **Command Palette** (shadcn `Command` + `Dialog`): cari halaman (dari nav tree) + aksi admin + user. `Ctrl+K` / `/`. Keyboard-first, navigasi Enter.
- **Theme toggle**: next-themes (existing).
- **Notifikasi admin**: lonceng + unread badge → `/staff/notifications` (utk STAFF/ADMIN); untuk role lain → placeholder (fase 2).
- **User dropdown role-aware**: Akun → `/admin/settings`, Keluar → logout. Hapus ngarah `/profile` & `/settings` siswa.

## 7. Guard (per route-group layout)

| Area | Roles dibolehkan | Redirect jika salah |
|---|---|---|
| `(admin)` | SUPER_ADMIN, STAFF | ke dashboard role |
| `(staff)` | SUPER_ADMIN, STAFF | ke dashboard role |
| `(guru)` | SUPER_ADMIN, GURU | ke dashboard role |
| `(finance)` | SUPER_ADMIN, FINANCE | ke dashboard role |
| `(investor)` | SUPER_ADMIN, INVESTOR | ke dashboard role |

- Berbasis `useAuthStore().user?.role`. Belum login → `/login`. SISWA/SUPER_SISWA → `/siswa`.
- Guard di dalam layout group (Server component ringan + client guard). Tidak menambah middleware/proxy di fase ini (perbatasan tetap API 401).

## 8. Fase Implementasi (urutan & verifikasi)

| # | Fase | Output | Verifikasi |
|---|---|---|---|
| 1 | `config/admin-nav.ts` + type | Data nav source of truth + filter role | tsc clean; render list per role |
| 2 | `AdminShell` + `AdminSidebar` | grouped collapsible nav, active, collapse, mobile drawer | per-role render; screenshot |
| 3 | `AdminTopbar` | breadcrumb + theme + notif + user menu role-aware | interaksi click-through; menu benar-per-role |
| 4 | Command Palette (shadcn) | ctrl+k → cari halaman → navigasi | keyboard + click; tsc clean |
| 5 | `layout.tsx` per grup + guard + lepas `<AppShell>` | semua halaman backoffice pakai AdminShell | guard per area; tak ada AppShell ganda |
| 6 | Empty-state placeholder "Segera" | nav item tanpa halaman → halaman placeholder | klik setiap item |

**Constraint:** frontend WRITE bebas (AGENTS.md). Tidak ada komit backend/subscription ke internal. Tanpa tambahan dependency selain shadcn `command`.

## 9. Security Notes (fullstack-guardian)

- **Auth**: guard mensyaratkan login; 401 di `lib/api.ts` tetap sebagai fail-safe.
- **Authz**: role di-clamp di server, nav client hanya UX; jangan pernah mengandalkan navbar untuk keamanan.
- **Output**: halaman tidak mengekspos data sensitif; tidak ada endpoint baru (nav purely client-side).
- **Logging**: aktivitas pemerintahan tercatat di `identity *`/audit (existing).

## 10. Referensi

- `design.md` §15/16 (shell sizing 280/72, topbar 72, max-w 1600/1440).
- `docs/frontend/SIDEBAR.md` (baseline nav existing) — digantikan oleh `admin-nav.ts`.
- `AGENTS.md` (stack, rule, approval proses).