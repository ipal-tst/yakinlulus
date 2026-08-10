# Wireframe — Halaman Siswa Target Sekolah (Target)

> **File:** `docs/frontend/wireframes/07-siswa-target.md`
> **Route:** `/targets` (AppShell, role `SISWA` / `SUPER_SISWA`).
> **Status:** Dokumen acuan pembuatan mockup & implementasi.
> **Tanggal:** 2026-08-09

Dokumen ini adalah wireframe + struktur halaman untuk **modul Target Sekolah** — tempat siswa
menjelajah sekolah tujuan (SMP/SMA/Universitas), melihat **nilai seleksi tahun terakhir**,
membandingkan dengan **nilai ujiannya sendiri**, dan mengelola **target sekolah** (maksimal 2:
pilihan 1 & 2) sesuai jenjang **1 tingkat di atas** jenjang siswa saat ini.

Diselaraskan dengan backend (`internal/profile`, `internal/target_schools`), DB
(`academic.school`, `academic.target_school`, `identity.student_target`), dan API kontrak
(`docs/frontend/API-contract-siswa.md` §11/§15.12). Bagian yang datanya belum ada ditandai
`[KONTRAK BARU]`.

---

## 1. Konteks & Tujuan

- Halaman ini adalah jendela siswa untuk **mencari & memilih sekolah tujuan** berdasarkan:
  - **jenjang berikutnya** dari jenjang siswa saat ini (SD→**SMP**, SMP→**SMA**, SMA→**UNIVERSITY**);
  - **faktor geografis**: provinsi & kabupaten/kota;
  - **nilai masuk tahun terakhir** (`academic_year` + `min_score`).
- Menampilkan **perbandingan langsung** antara nilai terbaik siswa (dari tryout/ujian) vs nilai
  minimum sekolah → **jarak nilai** (gap) & **kesempatan lulus** (badge hijau/amber/merah).
- Menyorot **sekolah berpeluang besar masuk** (tanda hijau) agar siswa fokus pada pilihan realistis.
- Mengelola **daftar target** siswa: maksimal **2** (pilihan 1 dan 2) — sesuai skema
  `identity.student_target` (unique `(user_id, choice)`), dengan CRUD (simpan/ubah/hapus).
- Menjadi **pemicu motivasi** & jembatan ke dashboard (`01-siswa-dashboard.md` — kartu
  `target_comparison`, tombol "Kelola Target → `/targets`").

**UX:** maksimal ≤ 3 klik untuk sampai ke perbandingan nilai; pencarian & filter ≤ 3 klik.

---

## 2. Struktur Halaman / Route Map

```text
/(siswa)  → AppShell
│
├── Sidebar — SISWA_NAV
│       Beranda   → /siswa
│       Belajar   → /materials
│       Latihan   → /practice
│       Ujian     → /exams
│       Hasil     → /results
│       Peringkat → /ranking
│       Target    ● → /targets   (active)
│       ...
│
├── Topbar (72px) — search, dark mode, lonceng, avatar
│
└── Main (max-w 1440px)
      ├── ✦ /targets                    → Halaman Target Sekolah (semua dalam satu halaman)
      │                                   (list sekolah + filter + banding nilai + target saya / CRUD)
      └── (modal/drawer) belum rute
```

**Rute yang disepakati:**

| Rute | Fungsi |
|---|---|
| `/targets` | Satu halaman: banner jenjang otomatis, filter (provinsi, kabupaten/kota, cari, "hanya peluang tinggi"), daftar sekolah + kartu perbandingan, dan panel "Target Saya" (2 slot) dengan dialog tambah/ubah/hapus. |

> Tidak ada sub-rute terpisah — edit/ubah target memakai **Drawer/Dialog**, silakan tambah bila
> mockup membutuhkan halaman detail sekolah (`/targets/:schoolId` opsional).

**Auth:** Bearer JWT via `src/lib/api.ts`. Semua read + tulis.

---

## 3. Wireframe ASCII — `/targets` (Target Sekolah)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [MAIN] max-w 1440 · p-4/6/8                                                 │
│                                                                             │
│ ┌ HEADER ───────────────────────────────────────────────────────────────┐  │
│ │  🎯 Target Sekolah                                                     │  │
│ │  [Sesuai jenjangmu: SMP → target jenjang SMA]                           │  │
│ │  [Banner kecil: Jenjang terdeteksi: SMP · filter target otomatis SMA]  │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ FILTER / SEARCH (row) ───────────────────────────────────────────────┐  │
│ │  Provinsi: [▾ Pilih Provinsi ▾]  Kab./Kota: [▾ Pilih ▾ (cascade)]      │ │
│ │  Cari: [🔍 Nama sekolah…]        [ ] Hanya peluang tinggi (hijau)      │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ "SEKOLAH BERELUANG BESAR" (bila filter hidup; list hijau) ───────────┐ │
│ │  ✅ SMA N 1 Jakarta        · SMA · 570/700 · Nilaimu 654 · 💚 92%    │ │
│ │     [Provinsi: DKI Jakarta · Kab/Kota: Jakarta Selatan] [Jadikan T] │ │
│ │  ✅ SMK N 2 Bandung        · SMA · 540/700 · Nilaimu 654 · 💚 86%    │ │
│ │  (kartu hijau: gap kecil, badge "Peluang Tinggi", teks CTA)         │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ DAFTAR SEKOLAH (kartu list, sort per min_score asc) ──────────────────┐ │
│ │  #   Sekolah (nama+badge jenjang)   Nilai min | Maks | Nilaimu | Jarak │ │
│ │  1   SMA N 1 Jakarta (SMA)          570|700   |  654    | +84   💚    │ │
│ │       Prov: DKI Jakarta · Kota: Jakpus · Tahun 2025/2026               │ │
│ │      [J: Jadikan Target]  [▾ pilihan target 1/2]                       │ │
│ │  2   SMA N 3 Depok (SMA)           590|700   |  654    | +64   💚     │ │
│ │  3   MAN 1 Bandung (SMA)            620|700   |  654    | +34   🟡     │ │
│ │  … (pagination)                                                        │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ PANEL "TARGET SAYA" (2 slot) right column / bottom ──────────────────┐  │
│ │  Pilihan 1 [✎ubah] [🗑]  Pilihan 2 [＋tambah] [🗑]                     │ │
│ │  SMA N 1 Jakarta                 — belum diisi                        │ │
│ │  Jurusan: IPA (opsional)           [Set Target]                       │ │
│ │  Target skor UTBK: 654/700 · 92%   (bagan hijau)                      │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Perbandingan (Jarak):** kolom `Nilai min→maks` (nilai masuk tahun terakhir),
> `Nilaimu` = skor ujian terbaik siswa pada paket/mapel relevan, `Jarak` = `min_score - nilaimu`
> (negatif = lolos/aman 💚, 0–gap kecil 🟡, jauh 🔴).

---

## 3.1 Wireframe — Dialog/Drawer "Tambah/Ubah Target" (CRUD)

```
┌ DRAWER (kanan, animation 200ms) ───────────────────────────────────────────┐
│  Tambah Target Sekolah                         [✕]                         │
│                                                                            │
│  Jenjang target        [◉ jenjang otomatis: SMA]                            │
│  Sekolah               [▾ pilih sekolah dari katalog ▾]                    │
│  Provinsi (auto)       Jakarta – Jakarta Selatan (readonly)                │
│  Nilai masuk           { min_score } (readonly, dari sekolah)              │
│  Jurusan (opsional)    [input: e.g. "IPS" / "IPA"]                         │
│  Target skor (ops)     [input number e.g. 735]  ← passing_score_irt        │
│                                                                            │
│  ┌ RINGKASAN ────────────────────────────────────────────────────┐        │
│  │ Nilaimu saat ini vs target:  654 / 570 · 💚 Peluang tinggi     │        │
│  └────────────────────────────────────────────────────────────────┘        │
│  [Batal]                                               [Simpan Target]    │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Spesifikasi per-seksi

### 4.1 Jenjang & level target (aturan "1 tingkat di atas")

| Jenjang siswa (`academic.education_level.code`) | Jenjang target yang difilter | Sumber |
|---|---|---|
| `SD` | `SMP` | `targetschool.Level` |
| `SMP` | `SMA` | `targetschool.Level` |
| `SMA` (atau kosong/unknown) | `UNIVERSITY` | `targetschool.Level` |

- Dideteksi dari siswa: **`GET /auth/me` → `grade_id`** + `GET /academic/grades` (bila tersedia
  `education_level`), atau endpoint **`GET /profile/targets`** yang sudah mengembalikan
  `target_type` hasil mapping backend (`targetTypeFromGrade`). **Implement:** tampilkan teks
  "Target jenjang {next}" dari `EnrichedTarget.target_type`.
- Filter katalog sekolah selalu terikat jenjang ini (default) — siswa tidak melihat sekolah jenjang lain.

### 4.2 Filter / Pencarian

| Filter | Sumber data | Behavior |
|---|---|---|
| Provinsi | `GET /schools` / `GET /target-schools` (extend) | dropdown dari daftar unik provinsi katalog |
| Kabupaten/Kota | lanjut dari provinsi terpilih (`city`) | dropdown cascade (kosong bila provinsi kosong) |
| Cari nama | `?q=…` (ILIKE di `name`) | lookup nama sekolah |
| Hanya peluang tinggi | client/API filter | tampilkan hanya baris dengan `verdict = "PASSED"`/`chance_pct ≥ ambang` |

### 4.3 Daftar sekolah & banding skor

| Kolom | Field | Keterangan |
|---|---|---|
| Sekolah | `name` + `level` badge | dari `target_school.name` / join `academic.school` |
| Provinsi / Kabupaten | `province`, `city` (`academic.school`) | `[KONTRAK BARU]` extend katalog untuk memuat field ini |
| Nilai | `min_score` | nilai seleksi (tahun terakhir, `academic_year`); diberi label "Nilai masuk (tahun terakhir)" |
| Nilaimu | `student_score` | hasil `ResolveStudentScore` (backend compute) vs `school.Subjects` |
| Jarak | `gap = min_score − student_score` | negatif → lolos |
| Verdict | `threshold_state`: `PASSED` / `BELOW` / `PENDING` | sesuai `motivationalState` (profile.go) |
| Badge/warna | `chance` | hijau `PASSED`/`≥85%`, amber `60–84%`, merah `<60` |
| Tombol | "Jadikan Target" | → panel Target Saya (choice 1 atau 2) |

> **Hitungan kesempatan (client fallback):** `chance_pct = min(100, student_score / max(min_score,1) × 100)`.
> Bila backend `[KONTRAK BARU]` belum ada, komposisi di client dari `student_score`+`min_score`.

### 4.4 Target Saya (CRUD)

- **2 slot** (pilihan 1 & 2) — konsisten dengan DB `identity.student_target` (`choice IN (1,2)`).
- Tiap slot: nama sekolah, jenjang, jurusan (opsional), skor target (opsional `passing_score_irt`),
  jarak & `progress_bar`.
- **Create/Update:** `PUT /profile/targets` (upsert) — request `{choice, target_school_id, school_name,
  major?, passing_score_irt?}`. Untuk **choice 2** kosong → tidak dikirim.
- **Delete:** `[KONTRAK BARU]` — daftar `DELETE /profile/targets/:choice` (atau `PUT` dengan choice
  kosong). Lihat §7.
- Statistik di tiap slot dari `GET /profile/targets` (existing `EnrichedTarget`: `min_score`,
  `max_score`, `max_total_score`, `subjects`, `student_score`, `progress_pct`, `has_score_data`,
  `threshold_state`, `motivational`).

### 4.5 Banding & Peluang (nilai siswa)

| Elemen | Sumber |
|---|---|
| `Nilaimu` per sekolah | `ResolveStudentScore` (backend) atau `[KONTRAK BARU]` `GET /targets/catalog` |
| Kartu "Sekolah Berpeluang Besar" | daftar `verdict=PASSED`/`chance ≥ ambang`; pakai tone hijau `#16A34A` |
| Gap / jarak poin | `min_score - student_score` (negatif = lolos) |

---

## 5. Mapping Data → API → DB (ringkasan)

| Isi | Endpoint | Tabel sumber |
|---|---|---|
| Katalog sekolah target (jenjang+prov+city+nilai) | `GET /target-schools?level=` (existing) + extend provinsi/kota `[KONTRAK BARU]` | `academic.target_school`, `academic.school` |
| Target saya (enriched) | `GET /profile/targets` (existing) | `identity.student_target`, `academic.school`, `academic.target_school` |
| Simpan/ubah target | `PUT /profile/targets` (existing) | upsert `identity.student_target` |
| Hapus target | `DELETE /profile/targets/:choice` `[KONTRAK BARU]` | `identity.student_target` |
| Nilai siswa per sekolah | `ResolveStudentScore` (backend profile) — atau `[KONTRAK BARU]` `GET /targets/catalog` | `cbt.grading_detail`, `academic.subject` |
| Level / jenjang next | `GET /profile/targets` (Enriched `target_type`) / `GET /auth/me`+grades | `academic.education_level`, `academic.student_enrollment` |

> Perhatikan: `academic.target_school` punya FK `school_id → academic.school` (opsional). Bila isi, lokasi
> (provinsi/kabupaten) bisa dibaca dari `academic.school` (tabel master). Bila tidak, katalog target tidak
> punya lokasi → tampil tanpa filter geografi (`[KONTRAK BARU]` menambah kolom region atau join).

---

## 6. Penanda / Asumsi

- **`student_target = 2` target maks.** — UI hanya menampilkan 2 slot; bila user mencoba menambah
  yang ke-3 → tampilkan pesan "Pilihan penuh" dengan aksi ubah/hapus.
- **Data nilai ("tahun terakhir")** mengikuti `target_school.academic_year` + `min_score` yang dikelola
  admin/staff di `/staff/target-schools`. Siswa hanya membaca.
- **Skor siswa** dihitung dari tryout/subtest **best (serupa dashboard)**; jika siswa belum punya nilai
  → tampil "Belum ada nilai tryout" dan tombol CTA "Kerjakan Tryout" (ke `/exams`).
- **Provinsi/kabupaten** tidak ada di katalog target → `[KONTRAK BARU]`; untuk mockup presentasi,
  sediakan data mock region; label filter tetap ditampilkan.
- **Delete** belum ada di endpoint `PUT` (hanya upsert) → `[KONTRAK BARU]`; untuk mockup, hapus
  secara client lalu PUT *tanpa* choice tsb (fallback).

---

## 7. Daftar API Kontrak yang HARUS DIBUAT `[KONTRAK BARU]`

| # | Method | Endpoint | Role | Response (usulan) |
|---|---|---|---|---|
| 1 | GET | `/target-schools` (extend) | SISWA | tambah param `?province=&city=&q=` + field `province`, `city`, `district`, `academic_year` pada tiap item katalog |
| 2 | GET | `/targets/catalog` (usulan) | SISWA | `[ { school_id, name, level, province, city, min_score, max_score, academic_year, subjects, student_score, has_score_data, gap, chance_pct, status:"PASSED\|BELOW\|PENDING" } ]` — perbandingan & tingkat terhitung **server-side** |
| 3 | DELETE | `/profile/targets/:choice` (usulan) | SISWA | hapus target pilihan `1|2` → `200` ack (atau `PUT` dengan slot kosong) |
| 4 | GET | `/profile/targets` (existing, reuse) | SISWA | daftar target enriched (dipakai langsung panel "Target Saya") |
| 5 | PUT | `/profile/targets` (existing, reuse) | SISWA | simpan/ubah target per choice (upsert) |

> Pilihan **2 + 3** membantu menghindari komposisi client; fallback tetap: komposisi client dari
> `GET /target-schools` + `GET /profile/targets` + `min_score`.

---

## 8. Catatan Implementasi (saat implementasi)

- **Service:** tambah/perluas `frontend/src/services/profile.service.ts` + hook TanStack Query:
  `useMyTargets()` (`GET /profile/targets`), `useTargetSchools({level,province,city,q})`
  (extend `/target-schools`), `useSaveTargets()` (`PUT`), `useDeleteTarget()` (`[KONTRAK BARU]`).
- **Type:** perluas `src/types/index.ts` / buat `TargetSchool`, `EnrichedTarget`, `TargetSlot =
  {choice:1|2, ...}` — sesuaikan dengan respons backend (snake_case).
- **UI:** komponen `SchoolFilter`, `SchoolCard`/`SchoolTable`, `ChanceBadge`, `TargetSlotCard`,
  `TargetFormDrawer`. Kalau memungkinkan, 1 halaman dengan 2 kolom (list + target saya).
- **Jenjang:** baca `target_type` dari `GET /profile/targets` (atau `GET /auth/me`) → filter default
  katalog. Jangan hard-code per-level.
- **Mockup presentasi:** data katalog belum penuh → placeholder `[KONTRAK BARU]`; label "hijau"
  (≥85%) dihitung dari `chance_pct` client-side.
- **Rule #1/#4 AGENTS:** konfirmasi kontrak baru (katalog + DELETE) & migrasi kolom region (bila perlu)
  ke user dulu sebelum implementasi backend.

### Checklist Verifikasi
- [ ] Halaman `/targets` menampilkan katalog sesuai jenjang otomatis (SD→SMP, SMP→SMA, SMA→UNIVERSITY).
- [ ] Filter provinsi → kabupaten/kota cascade; cari nama; toggle "hijau" benar.
- [ ] Setiap baris menampilkan `min_score` (tahun terakhir) & `student_score`, gap, badge warna.
- [ ] Panel "Target Saya" memuat max 2 slot; simpan/ubah via `PUT /profile/targets`; hapus via
      endpoint target.
- [ ] Belum ada nilai → state kosong + CTA ke `/exams`.
- [ ] `npx tsc --noEmit` clean; lint clean.

---

## 9. Revisi

| Tanggal | Perubahan |
|---|---|
| 2026-08-09 | Wireframe Target v1: `/targets` (deteksi jenjang otomatis, filter provinsi/kabupaten/kota + cari, daftar sekolah dengan nilai masuk tahun terakhir + perbandingan skor siswa + badge peluang, panel "Target Saya" max 2 slot dengan CRUD, drawer tambah/ubah) + extend `/target-schools` (region) + `GET /targets/catalog` + `DELETE /profile/targets/:choice` `[KONTRAK BARU]`. |