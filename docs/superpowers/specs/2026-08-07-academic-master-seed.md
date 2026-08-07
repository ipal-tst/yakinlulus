# Academic Master Seed — Bahasa Indonesia / IPAS / Matematika (SD)

> Seeded 2026-08-07. Source dir: `Hierarki Mapel/` → Supabase Postgres `academic.*`.

## Goal
Memuat hierarki mapel SD (kelas 4–6) dari folder `Hierarki Mapel` ke master akademik,
sesuai chain `Jenjang → Kelas → Mapel → Bab → Subbab → Topik`.

## Keputusan yang disepakati
- **Kurikulum:** tidak diisi. Tabel `curriculum_subject` wajib memerlukan `curriculum_id`,
  sehingga memakai kurikulum aktif `DEFAULT` yang sudah ada sebagai FK internal (tanpa menambah kurikulum baru).
- **Kode mapel-kelas (label kode):** mapel tunggal + relasi kelas. Kode mapel:
  `bind` (Bahasa Indonesia), `IPAS`, `MTK`. Kode kelas = grade `4/5/6`. Tree **1× per mapel**
  (tidak digandakan per kelas).
- **Kode Bab/Subbab:** label polos — `chapter.code` = `BAB01..`, `subchapter.code` = `1.1`, `2.3`, dst.
  Bukan UUID.
- **Struktur:** `Bab → Subbab → Topik`. Kompetensi (tujuan pencapaian) disimpan sebagai
  `subchapter.description`. `topic` **tanpa kolom code** (sesuai skema, disimpan via `name` + `order_no`).

## Pemetaan → tabel
| Sumber | Tabel | Kolom |
|--------|-------|-------|
| Jenjang SD | `academic.education_level` | sdah ada |
| Kelas 4/5/6 | `academic.grade` | `code`,`name` |
| Mapel | `academic.subject` | `code`,`name` |
| link | `academic.curriculum_subject` | `curriculum_id`(DEFAULT), `subject_id`, `education_level_id`, `grade_id=NULL` |
| Bab | `academic.chapter` | `code`=`BABxx`, `title`, `order_no` |
| Subbab | `academic.subchapter` | `code`=`x.y`, `title`, `order_no`, `description`=tujuan |
| Topik | `academic.topic` | `name`, `order_no` |

## Hasil (terverifikasi via query agregat)
| Mapel | Kode | Bab | Subbab | Topik |
|-------|------|----:|-------:|------:|
| Bahasa Indonesia | bind | 8 | 23 | 130 |
| IPAS | IPAS | 8 | 28 | 185 |
| Matematika | MTK | 6 | 26 | 126 |
| Total | | 22 | 77 | 441 |

Checks: `dup topics: false`, `orphan topics: 0`.

## Cara menjalankan ulang (idempotent)
```bash
cd backend && go run ./cmd/seed_academic
```
Skipppendeteksi mapel yang sudah ada (`subject.code`), aman dijalankan ulang.

## Catatan
- Kode `bind/IPAS/MTK` + `-kelas` (`bind-4` dst) hanya label referensi; tidak disimpan
  sebagai kolom tersisi (skema tidak punya kolom kode per-kelas).
- No commit dibuat. Seeder berada di `backend/cmd/seed_academic/{main.go,data.go,helpers.go}`.