# Wireframe — Halaman Siswa Membership (Keanggotaan)

> **File:** `docs/frontend/wireframes/08-siswa-membership.md`
> **Route:** `/membership` (AppShell, role `SISWA` / `SUPER_SISWA`).
> **Status:** Dokumen acuan pembuatan mockup & implementasi.
> **Tanggal:** 2026-08-09

Dokumen ini adalah wireframe + struktur halaman untuk **modul Membership Siswa** — tempat siswa
melihat **status keanggotaannya** (paket aktif, level, tanggal berakhir, sisa hari), **memperbarui
/perpanjang** membership (renew paket yang sama), dan **meningkatkan level** membership (upgrade ke
paket lebih tinggi: Basic → Premium → Pro → Enterprise).

Diselaraskan dengan backend (`internal/subscription`), DB (`finance.membership_package`,
`finance.package_feature`, `finance.subscription`, `finance.user_membership`, `finance.invoice`),
dan API kontrak (`docs/frontend/API-contract-siswa.md` §14/§15.13). Bagian yang datanya belum ada
ditandai `[KONTRAK BARU]`.

---

## 1. Konteks & Tujuan

- Halaman ini adalah jendela siswa untuk **mengelola keanggotaan berbayar** YakinLulus.id:
  - **Status membership**: paket aktif, level (`basic|premium|pro|enterprise`), tipe
    (`trial|monthly|quarterly|semester|yearly|lifetime`), tanggal aktif/berakhir, **sisa hari**,
    status (`ACTIVE|TRIAL|INACTIVE|EXPIRED|CANCELLED`), auto-renew.
  - **Perpanjang (renew)**: memperpanjang paket yang sama sebelum/setelah habis.
  - **Upgrade level**: pindah ke paket lebih tinggi dengan durasi pilihan (baru = order baru;
    pro-rate opsional `[KONTRAK BARU]`).
  - **Katalog paket**: banding harga & fitur antar level, tandai paket aktif & paket rekomendasi.
- Menjadi **jembatan konversi**: dari status nonaktif/trial → mendorong subscribe; dari aktif →
  mendorong upgrade/perpanjang.
- **UX:** dashboard & belajar ≤ 2 klik; halaman ini boleh ≤ 3 klik (banding paket → pilih → konfirmasi).

---

## 2. Struktur Halaman / Route Map

```text
/(siswa)  → AppShell
│
├── Sidebar — SISWA_NAV
│       ...
│       Peringkat → /ranking
│       Target    → /targets
│       Membership ● → /membership   (active)
│       Konfigurasi → /settings
│
├── Topbar (72px) — search, dark mode, lonceng, avatar
│
└── Main (max-w 1440px)
      ├── ✦ /membership                       → Halaman Membership (semua dalam satu halaman)
      │                                        (status + katalog paket + renew/upgrade)
      └── (modal/drawer) konfirmasi renew/upgrade — tanpa rute terpisah
```

**Rute yang disepakati:**

| Rute | Fungsi |
|---|---|
| `/membership` | Satu halaman: kartu status membership + daftar paket (pricing) + aksi Perpanjang / Upgrade. |

> Tidak ada sub-rute terpisah; alur renew/upgrade memakai **Dialog/Drawer** konfirmasi order.

**Auth:** Bearer JWT via `src/lib/api.ts`. Read + tulis (order membership).

---

## 3. Wireframe ASCII — `/membership`

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [MAIN] max-w 1440 · p-4/6/8                                                 │
│                                                                             │
│ ┌ HEADER ───────────────────────────────────────────────────────────────┐  │
│ │  💳 Membership                                                       │  │
│ │  [Kelola status keanggotaan, perpanjang, atau tingkatkan paketmu]    │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ STATUS MEMBERSHIP (kartu besar) ──────────────────────────────────────┐  │
│ │  💎 Premium            [● Aktif]        sisa 21 hari (berakhir 30-08)  │ │
│ │  Aktif sejak: 02-07-2026 · auto-renew: ON/OFF [toggle]               │ │
│ │  ┌ LIMIT/PAKAI ─────────────────────────────────────────────────┐    │ │
│ │  │  Tryout/bulan: 5/10 · Materi premium: ✓ · Download: ✓       │    │ │
│ │  └──────────────────────────────────────────────────────────────┘    │ │
│ │  [🔄 Perpanjang Premium]  [⬆️ Naik ke Pro]                         │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ KATALOG PAKET (3–4 kartu pricing, grid) ──────────────────────────────┐ │
│ │  [Basic]      [Premium]      [Pro]         [Enterprise]               │ │
│ │  Rp 49.000    Rp 99.000      Rp 199.000    Rp 499.000                 │ │
│ │  /bulan       /bulan         /bulan        /tahun                     │ │
│ │  · fitur …    · fitur … (⚡  │ · fitur …    · fitur …                 │ │
│ │  [Aktif]      [Perpanjang]   [Pilih]       [Pilih]                    │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ TAB "DURASI" (per paket) ─────────────────────────────────────────────┐ │
│ │  [1 bulan] [3 bulan (-10%)] [6 bulan (-15%)] [1 tahun (-20%)]         │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ INFO / RINWAYAT ──────────────────────────────────────────────────────┐ │
│ │  Riwayat transaksi (opsional): invoice #INV-2026-001 · Premium · Paid │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Alur:** Status kartu selalu tampil di atas. Saat siswa memilih **Perpanjang** (paket sama) →
> drawer konfirmasi durasi + total → buat order. Saat memilih **Upgrade** (level lebih tinggi) →
> drawer pilih paket baru + durasi → buat order.

---

## 3.1 Wireframe — Dialog/Drawer "Perpanjang / Upgrade" (order)

```
┌ DRAWER (kanan, animation 200ms) ───────────────────────────────────────────┐
│  [Perpanjang Premium] / [Upgrade ke Pro]           [✕]                    │
│                                                                            │
│  Paket:              Premium → Pro (upgrade)                               │
│  Durasi:             [● 1 bulan] [○ 3 bln -10%] [○ 6 bln -15%] [○ 1 thn -20%]│
│  Harga:              Rp 199.000 × 1 bulan                                   │
│  Disk:                -                                                      │
│  Total:              Rp 199.000                                              │
│                                                                            │
│  Metode pembayaran:  [● Transfer bank] [○ E-wallet] [○ QRIS] (opsional)    │
│                                                                            │
│  ┌ RINGKASAN ──────────────────────────────────────────────────────┐      │
│  │ Aktif dari: 09-08-2026 · sampai: 08-09-2026 · otomatis perpanjang │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│  [Batal]                                            [Buat Pesanan]        │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Upgrade prorate** (opsional `[KONTRAK BARU]`): bila aktif tersisa, tampilkan "Sisa paket
> aktif (21 hari) dikonversi" bila backend mendukung pro-rate; default v1 = order baru langsung aktif
> saat pembayaran (paket lama otomatis nonaktif).

---

## 4. Spesifikasi per-seksi

### 4.1 Kartu Status Membership

| Elemen | Field | Keterangan |
|---|---|---|
| Paket aktif | `plan_name`, `level` | `basic|premium|pro|enterprise` (badge) |
| Status | `status` | `ACTIVE` (hijau), `TRIAL` (biru), `INACTIVE` (abu), `EXPIRED` (merah), `CANCELLED` (abu) |
| Periode | `active_from`, `expired_at` | format `dd-mm-yyyy` |
| Sisa hari | `remaining_day` | hitung dari `expired_at` vs `now`; 0 → badge "Kadaluarsa" |
| Auto-renew | `auto_renew` | toggle `[KONTRAK BARU]` update |
| Pakai | fitur/limit aktif | dari `package_feature` (feature_name + is_unlimited) |
| Aksi | — | `Perpanjang` (paket sama) / `Naik ke {next}` (level berikutnya, bila ada) |

Sumber: `GET /membership/me` `[KONTRAK BARU]` (lihat §7) — join `user_membership` + `membership_package`.

### 4.2 Katalog Paket (pricing cards)

| Elemen | Field |
|---|---|
| Nama & level | `name`, `level` badge |
| Harga | `price` (IDR) + `duration_days` label (`/bulan`, `/tahun`) |
| Harga coret (opsional) | `discount_price` bila ada |
| Fitur | `features[]` (`package_feature.feature_name`), centang/ikon |
| Tanda | `is_featured` → badge "Populer"; paket aktif → tombol `Perpanjang`; level lebih tinggi → `Pilih`/`Upgrade` |
| Urutan | `sort_order`, `is_active` |

Sumber: `GET /membership/plans` `[KONTRAK BARU]` (student-facing; backend `/subscriptions/plans`
saat ini **ber-gate admin** — lihat catatan §4.3).

### 4.3 Catatan endpoint backend saat ini

- Backend `internal/subscription` mengekspos `/subscriptions/*` (stats, plans, users) — seluruhnya
  ber-gate **SUPER_ADMIN/STAFF/FINANCE/INVESTOR**. **Tidak ada** endpoint khusus siswa.
- Frontend `/membership` (saat ini) fallback ke `GET /exam-packages` (paket TRY OUT, bukan paket
  membership) + mock. → Untuk halaman membership sebenarnya, endpoint student-facing
  **`[KONTRAK BARU]`** (§7) dibutuhkan.

### 4.4 Perpanjang (Renew) & Upgrade

| Alur | Detail |
|---|---|
| **Renew** | Paket sama, pilih durasi → order baru → bayar → `user_membership` diperpanjang (`expired_at` = lama + durasi, `renewal_count++`). Bila EXPIRED → diaktivasi dari hari ini. |
| **Upgrade** | Paket lebih tinggi, pilih durasi → order baru → bayar → paket lama nonaktif, baru aktif (`active_from` = hari bayar). Pro-rate opsional `[KONTRAK BARU]`. |
| Order | `POST /membership/orders` `[KONTRAK BARU]` → buat `finance.invoice` (DRAFT/UNPAID) + arahkan ke metode bayar (manual/infrastruktur). Setelah konfirmasi → `user_membership` ter-update. |

### 4.5 Empty & status khusus

- **Belum punya membership** (`INACTIVE`): kartu status → "Belum berlangganan" + CTA "Lihat Paket"
  (scroll ke katalog). Semua kartu paket → tombol `Pilih`.
- **Trial aktif**: badge "Masa percobaan" + countdown sisa hari + CTA "Jadi Member".
- **Kadaluarsa**: banner merah "Membership kamu telah berakhir" + CTA "Perpanjang".

---

## 5. Mapping Data → API → DB (ringkasan)

| Isi | Endpoint | Tabel sumber |
|---|---|---|
| Status membership saya | `GET /membership/me` `[KONTRAK BARU]` | `finance.user_membership`, `finance.membership_package`, `finance.subscription` |
| Katalog paket (student) | `GET /membership/plans` `[KONTRAK BARU]` | `finance.membership_package`, `finance.package_feature` |
| Buat order / invoice | `POST /membership/orders` `[KONTRAK BARU]` | `finance.invoice`, `finance.user_membership` |
| Update auto-renew | `PATCH /membership/me/auto-renew` `[KONTRAK BARU]` | `finance.user_membership` |
| (Admin/Finance) kelola paket | `GET/POST/PUT/DELETE /subscriptions/plans` (existing, admin-gated) | `finance.membership_package`, `finance.package_feature` |
| (Admin/Finance) riwayat | `GET /subscriptions/users` (existing, admin-gated) | `finance.user_membership`, `finance.invoice` |
| (Siswa, fallback lama) katalog tryout | `GET /exam-packages` (existing §14) | `cms.exam_packages` view |

---

## 6. Penanda / Asumsi

- **Payment gateway belum siap** → order = buat `finance.invoice` (status `UNPAID`/`PENDING`) + alur
  manual/konfirmasi admin. Tombol "Buat Pesanan" tersedia; tanda `[KONTRAK BARU]`.
- **Pro-rate upgrade** v1 tidak wajib: upgrade = paket baru aktif saat bayar (paket lama nonaktif).
  Perhitungan prorate ditandai opsional.
- **Katalog paket membership ≠ katalog tryout** (`/exam-packages`). Halaman membership memakai paket
  dari `finance.membership_package` (level Basic/Premium/Pro/Enterprise).
- **Level order** dijamin oleh backend (`level IN basic<premium<pro<enterprise`); frontend hanya
  menampilkan urutan `sort_order`.
- **Mockup presentasi**: data `finance.*` belum penuh → fallback demo data (status TRIAL, 3–4 kartu
  paket) dengan label `[KONTRAK BARU]`.

---

## 7. Daftar API Kontrak yang HARUS DIBUAT `[KONTRAK BARU]`

| # | Method | Endpoint | Role | Response (usulan) |
|---|---|---|---|---|
| 1 | GET | `/membership/me` | SISWA | `{ has_membership, plan:{id, name, level, price, duration_days, features[]}, status:"ACTIVE\|TRIAL\|INACTIVE\|EXPIRED\|CANCELLED", active_from, expired_at, remaining_day, auto_renew, is_trial, limits_used:[{feature_name, used?, max?}] }` |
| 2 | GET | `/membership/plans` | SISWA | `[{id, name, level, package_type, price, discount_price, duration_days, features:[{name, is_unlimited, value}], is_featured, is_active, sort_order}]` — hanya paket `is_active = true` |
| 3 | POST | `/membership/orders` | SISWA | `{plan_id, duration: package_type\|days, method?}` → 201 `{invoice_id, invoice_number, subtotal, discount, total, status:"UNPAID\|PENDING", payment_methods[]}` (order baru = renew/upgrade) |
| 4 | PATCH | `/membership/me/auto-renew` | SISWA | `{auto_renew:boolean}` → ack |
| 5 | GET | `/membership/orders` (opsional) | SISWA | riwayat invoice user: `[{invoice_number, plan_name, total, status, issued_at, paid_at}]` |
| 6 | — | reuse existing | SISWA | `GET /exam-packages` (§14) — hanya untuk blok "tryout" bila halaman menyertakan |

> Catatan gate: endpoint `/subscriptions/*` tetap **admin-only** (tidak dipakai siswa). Endpoint
> `/membership/*` di atas adalah **namespace baru untuk siswa** — perlu registrasi di `main.go`.

---

## 8. Catatan Implementasi (saat implementasi)

- **Service:** tambah `frontend/src/services/membership.service.ts` + hooks TanStack Query:
  `useMyMembership()` (`GET /membership/me`), `useMembershipPlans()` (`GET /membership/plans`),
  `useCreateOrder()` (`POST /membership/orders`), `useUpdateAutoRenew()` (`PATCH`).
- **Type:** perluas `src/types/index.ts`: `MembershipStatus`, `MembershipPlan`, `MyMembership`,
  `MembershipOrder`. Ganti tipe lama `ExamPackage`-as-membership bila tidak dipakai lagi.
- **UI:** komponen `MembershipStatusCard`, `PlanCard`/`PlanGrid`, `DurationTabs`, `OrderDrawer`,
  `AutoRenewToggle`. Skeleton saat loading (bukan spinner).
- **Level map:** `basic→Premium→pro→enterprise` untuk label "Naik ke {next}".
- **Format harga:** IDR (Intl.NumberFormat 'id-ID', tanpa desimal).
- **Rule #1/#4 AGENTS:** kontrak `/membership/*` & endpoint baru di `main.go` + update openapi harus
  disetujui user dulu sebelum implementasi backend.

### Checklist Verifikasi
- [ ] Kartu status menampilkan paket/level/status/sisa hari & auto-renew sesuai `GET /membership/me`.
- [ ] Katalog paket menampilkan harga + fitur; paket aktif = `Perpanjang`, level lebih tinggi = `Upgrade`.
- [ ] Drawer order menghitung total & membuat invoice (`POST /membership/orders`).
- [ ] Status INACTIVE/TRIAL/EXPIRED menampilkan empty state & CTA benar.
- [ ] `npx tsc --noEmit` clean; lint clean.

---

## 9. Revisi

| Tanggal | Perubahan |
|---|---|
| 2026-08-09 | Wireframe Membership v1: `/membership` (kartu status: paket/level/sisa hari/auto-renew, katalog paket Basic→Enterprise dengan harga & fitur, tab durasi, drawer order renew/upgrade) + `[KONTRAK BARU]` `/membership/me`, `/membership/plans`, `/membership/orders`, `PATCH /membership/me/auto-renew`, `/membership/orders`. |
