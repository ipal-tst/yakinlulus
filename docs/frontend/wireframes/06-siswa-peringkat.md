# Wireframe — Halaman Siswa Peringkat (Ranking / Leaderboard)

> **File:** `docs/frontend/wireframes/06-siswa-peringkat.md`
> **Route:** `/ranking` (AppShell, role `SISWA` / `SUPER_SISWA`) + sub-rute detail.
> **Status:** Dokumen acuan pembuatan mockup & implementasi.
> **Tanggal:** 2026-08-09

Dokumen ini adalah wireframe + struktur halaman untuk **modul Peringkat Siswa** — peringkat
**seluruh siswa** YakinLulus.id berdasarkan hasil ujian, dengan dua mode yang diminta user:

1. **Ranking Ujian 1-attempt** — peringkat siswa pada **satu paket ujian** (nilai terbaik / skor
   attempt pada paket itu).
2. **Peringkat Rata-rata** — peringkat berdasarkan **rata-rata hasil** dari **beberapa ujian /
   paket tertentu** (agregat), dikelompokkan per mapel (`subject_scores`) dan total.

Diselaraskan dengan backend (`internal/ranking`), DB (`ranking.leaderboard_entry`,
`cbt.exam_package`, `cbt.exam_attempt`, `cbt.grading_result`), dan API kontrak
(`docs/frontend/API-contract-siswa.md` §9). Bagian yang datanya belum ada ditandai
`[KONTRAK BARU]`.

---

## 1. Konteks & Tujuan

- Halaman ini adalah jendela siswa untuk melihat **posisi kompetitifnya** vs siswa lain, sebagai
  **pemicu motivasi** (sejalan dengan kartu target dashboard `01-siswa-dashboard.md`).
- Menyediakan **2 mode ranking** yang bisa dipilih user:
  - **Per Paket (1-attempt / nilai terbaik):** pilih satu **paket ujian** → lihat leaderboard siswa
    pada paket itu (score attempt terbaik di paket tsb). Paket 1-attempt hanya punya satu nilai per
    siswa.
  - **Rata-rata (multi ujian):** pilih **beberapa paket/ujian** (atau semua dari suatu
    kategori/jenjang) → peringkat dihitung dari **rata-rata nilai** seluruh ujian terpilih.
- Setiap baris menampilkan: peringkat, avatar+nama, sekolah, skor per mapel (`subject_scores`),
  total & rata-rata.
- **Highlight posisi saya** (row "kamu") + kartu ringkas posisi pribadi di header.
- Mode kompetitif: badge/jeda perubahan peringkat antar bulan opsional.

**UX:** dashboard & learning ≤ 2 klik (design.md); ranking perlu picker, jadi maksimal 3 klik.

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
│       Peringkat ● → /ranking       (active)
│       ...
│
├── Topbar (72px) — search, dark mode, lonceng, avatar
│
└── Main (max-w 1440px)
      ├── ✦ /ranking                      → Leaderboard utama (mode + picker + podium + tabel)
      ├── ✦ /ranking/subjects/:subjectId  → Ranking khusus satu mapel (nilai terbaik / rata-rata)
      └── (lama) /ranking/:id             → detail (opsional kompatibilitas, tidak wajib)
```

**Rute yang disepakati:**

| Rute | Fungsi |
|---|---|
| `/ranking` | Halaman utama: pilih mode (per paket / rata-rata), pilih paket/bulan, podium Top-3, tabel ranking seluruh siswa, highlight posisi saya. |
| `/ranking/subjects/:subjectId` | Filter leaderboard hanya untuk **satu mapel** (`subject_scores` → `average` pada mapel itu). Opsional; dapat digabung ke main page via tab. |
| `/ranking/:id` (lama) | Kompatibilitas opsional — jika tidak dipakai, abaikan. |

**Auth:** Bearer JWT via `src/lib/api.ts`. Read-only.

---

## 3. Wireframe ASCII — `/ranking` (Leaderboard Utama)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [MAIN] max-w 1440 · p-4/6/8                                                 │
│                                                                             │
│ ┌ HEADER ───────────────────────────────────────────────────────────────┐  │
│ │  🏆 Peringkat Nasional                                                │  │
│ │  [Penjelasan: posisi kompetitif di seluruh siswa berdasarkan ujian]   │  │
│ │  Posisi Saya: #12 (top 0.1%) · naik 3 dari bulan lalu · 15.420 siswa  │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌ PICKER / FILTER (row: mode + paket + bulan) ──────────────────────────┐ │
│ │  Mode:   [● Nilai Terbaik (1-attempt)]  [○ Rata-rata (multi ujian)]   │ │
│ │  Ujian:  [▾ Pilih paket ujian ▾]        [▾ Pilih paket ujian ▾]      │ │
│ │  Bulan:  [▾ 2026-08 ▾] (opsional)       Mapel: [Semua ▾]             │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ PODIUM TOP-3 (3 kartu; #1 tengah lebih tinggi) ───────────────────────┐ │
│ │       [2] 👤 Amanda Putri          │  [1] 👑 Rizky M.                  │
│ │       SMA N 3 Bandung             │  SMA N 8 Jakarta                  │
│ │       785.0  🥈                   │  795.0  🥇 (tengah, lebih besar)   │
│ │  [3] 🥉 Kevin P.  ──  SMA N 1 Yogyakarta  ──  770.0                    │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ TABEL RANKING (semua siswa, sortable) ─────────────────────────────────┐ │
│ │  # | Siswa (avatar+nama) | Sekolah | Mapel A | Mapel B | Total | Rata  │ │
│ │  12| 🔵 Kamu (bold, bg-primary/10) | SMA 12 | 90 | 85 | 720 | 712      │ │
│ │  13| 👤 … | SMA … | 88 | 80 | 712 | 705                                │ │
│ │  (scroll; kolom mapel dari subject_scores; header sortable)            │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

> Mode **Rata-rata**: picker ujian multi-select (atau "semua paket kategori/jenjang"); kolom Total =
> `avg` dari seluruh paket terpilih; kolom mapel = rata-rata `subject_scores` per mapel.

---

## 3.1 Wireframe — `/ranking/subjects/:subjectId` (Ranking per Mapel)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Breadcrumb]  Peringkat / Mapel › Matematika                                │
│                                                                             │
│ ┌ HEADER MAPEL ──────────────────────────────────────────────────────────┐ │
│ │  📐 Matematika · ranking terbaik semua siswa (nilai mapel)              │ │
│ │  Posisi Saya di Matematika: #7 · rata-rata mapel 84.2                   │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ PODIUM TOP-3 mapel ───────────────────────────────────────────────────┐ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌ TABEL (kolom: #, siswa, sekolah, nilai mapel) ─────────────────────────┐ │
│ └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Spesifikasi per-seksi

### 4.1 Mode Ranking

| Mode | Endpoint | Keterangan |
|---|---|---|
| **Per Paket (1-attempt / nilai terbaik)** | `GET /leaderboard?package_id=&month=&limit=` (existing) | peringkat semua siswa pada satu paket; nilai = skor attempt (1-attempt hanya 1 nilai per siswa). |
| **Rata-rata (multi ujian)** | `GET /leaderboard/aggregate` `[KONTRAK BARU]` | peringkat dari rata-rata hasil seluruh paket terpilih; per siswa `total = avg`, per mapel `avg(subject_scores)`. |

### 4.2 Picker / Filter

- **Mode**: radio `Nilai Terbaik (1-attempt)` / `Rata-rata (multi ujian)`.
- **Ujian**: dropdown single-select (mode 1) atau multi-select / "semua paket jenjang" (mode rata).
  Sumber: `GET /exam-packages?education_level=` (existing, §15.9).
- **Bulan**: opsional (`month=YYYY-MM`, default bulan berjalan).
- **Mapel**: dropdown `Semua` + daftar mapel (untuk link `/ranking/subjects/:subjectId`).

### 4.3 Podium Top-3

- 3 kartu (grid): rank 2–1–3, #1 di tengah dan lebih menonjol (Crown/🥇, border accent).
- Tiap kartu: avatar, nama, sekolah, skor total. Badge medal 🥇🥈🥉.

### 4.4 Tabel Ranking

| Kolom | Field | Catatan |
|---|---|---|
| # | `rank` | header sortable |
| Siswa | `full_name` + avatar | baris **saya** di-highlight (bold + `bg-primary/10`) |
| Sekolah | `school_name` | — |
| Per mapel | `subject_scores.{subject_id}` | dinamis (1 kolom per mapel di paket) |
| Total | `total` | sortable |
| Rata-rata | `average` | `total / jumlah mapel` (dari backend) |

- Pagination / virtual scroll untuk jumlah siswa besar (limit 100 → API).
- Kolom mapel bisa disembunyikan di mobile (tampil nama + total).

### 4.5 Kartu "Posisi Saya"

- Di header: `Posisi Saya: #12 · top 0.1% · naik 3 dari bulan lalu · total siswa 15.420`.
- Sumber: dari `ranking.user_rank_summary.global_rank` (existing, dipakai dashboard) + total
  siswa (`total` dari leaderboard / `analytics`). Delta antar bulan `[KONTRAK BARU]` (opsional).

---

## 5. Mapping Data → API → DB (ringkasan)

| Isi | Endpoint | Tabel sumber |
|---|---|---|
| Ranking per paket | `GET /leaderboard?package_id=&month=` (existing) | `ranking.leaderboard_entry`, `cbt.exam_package`, `cbt.exam_attempt`, `cbt.grading_result`, `cbt.grading_detail`, `question.question_subject`, `academic.subject` |
| Daftar paket (picker) | `GET /exam-packages?education_level=` (existing §15.9) | `cms.exam_packages` (view), `cbt.exam_package` |
| Ranking rata-rata multi ujian | `GET /leaderboard/aggregate` `[KONTRAK BARU]` | agregat di atas, di-`AVG` per siswa |
| Ranking per mapel | `GET /leaderboard?package_id=&month=` (existing) + filter mapel `[KONTRAK BARU: extend]` | `ranking.subject_ranking` (opsional) |
| Posisi saya / total siswa | `ranking.user_rank_summary` + hitung total peserta (existing) | `ranking.user_rank_summary` |

> Backend saat ini: `internal/ranking` — `GetLeaderboard(package_id, month, limit)` → `[]RankingRow`
> `{rank, user_id, full_name, school_name, subject_scores{...}, total, average}`. Untuk mode
> rata-rata & filter mapel, tambahkan endpoint `[KONTRAK BARU]` (lihat §7).

---

## 6. Penanda / Asumsi

- **Mode 1-attempt** sudah didukung penuh oleh `GET /leaderboard` (existing).
- **Mode rata-rata** dan **filter per mapel** adalah `[KONTRAK BARU]`; untuk mockup presentasi,
  hitung di client dari `GET /leaderboard` per paket (fetch beberapa paket → rata-rata lokal).
- Kolom mapel dinamis dari `subject_scores`; frontend harus toleran terhadap key `subject_id` yang
  tidak dikenal (render sebagai kolom "Mapel Lain" atau sembunyikan).

---

## 7. Daftar API Kontrak yang HARUS DIBUAT `[KONTRAK BARU]`

| # | Method | Endpoint | Role | Response (usulan) |
|---|---|---|---|---|
| 1 | GET | `/leaderboard/aggregate` | SISWA | `?package_ids=a,b&month=&limit=` → `[]RankingRow` (per siswa: `total = AVG(score)` seluruh paket; `average` = rata-rata; `subject_scores` di-`AVG`) |
| 2 | GET | `/leaderboard` (extend) | SISWA | tambah query `subject_id=` → filter baris hanya untuk mapel tsb (rank dihitung dari `subject_scores[subject_id]`) |
| 3 | GET | `/leaderboard/me` (opsional) | SISWA | `?package_id=&month=` → `{rank, total_siswa, delta_rank}` untuk kartu "Posisi Saya" |
| 4 | GET | `/exam-packages` (existing, reuse) | SISWA | daftar paket untuk picker (§15.9) |

---

## 8. Catatan Implementasi (saat implementasi)

- **Service/hook:** buat/ perluas `frontend/src/services/ranking.service.ts` + hooks TanStack Query:
  `useLeaderboard(packageId, month)`, `useLeaderboardAggregate(packageIds)`, `useMyRank()`.
- **Type:** tambah `RankingRow` (snake_case dari backend) di `src/types/index.ts` (sudah ada
  `RankingItem` mock — ganti/superset), `LeaderboardMode = "BEST" | "AVERAGE"`.
- **UI:** komponen `RankingPodium` (top-3), `RankingTable` (sortable, highlight saya),
  `ModePicker`, `PackageMultiSelect` (mode rata-rata).
- **Fallback:** bila `/leaderboard/aggregate` belum ada → komposisi client (fetch beberapa paket,
  rata-rata lokal). Tandai baris sebagai data mock `[KONTRAK BARU]`.
- **Avatar:** gunakan `avatar_url` jika ada; fallback inisial (`Avatar` shadcn).
- **Mobile:** podium → list 3 baris; tabel → nama + total (+ mapel pada `md+`).
- **Sorting/pagination:** kolom sortable di client; limit besar dari API (max 100) + pagination.

### Checklist Verifikasi
- [ ] Mode 1-attempt menampilkan leaderboard paket dengan benar (`GET /leaderboard`).
- [ ] Mode rata-rata (multi paket) menampilkan aggregate; baris "saya" di-highlight.
- [ ] Kolom per mapel dari `subject_scores` dirender dinamis; toleran mapel tak dikenal.
- [ ] Kartu "Posisi Saya" benar (rank + total siswa + delta).
- [ ] `/ranking/subjects/:subjectId` memfilter leaderboard per mapel.
- [ ] `npx tsc --noEmit` clean; lint clean.

---

## 9. Revisi

| Tanggal | Perubahan |
|---|---|
| 2026-08-09 | Wireframe Peringkat v1: `/ranking` (mode Nilai Terbaik 1-attempt + Rata-rata multi ujian, picker paket/bulan/mapel, podium top-3, tabel ranking sortable + highlight saya, kartu posisi saya) + `/ranking/subjects/:subjectId` (ranking per mapel) + `GET /leaderboard/aggregate` `[KONTRAK BARU]`. |
