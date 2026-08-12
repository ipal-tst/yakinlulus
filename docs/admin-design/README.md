# Kelompok Master Akademik — Indeks Dokumentasi

> Kelompok ini mencakup tiga halaman admin inti yang menjadi fondasi konten platform.
> Setiap dokumen berdiri sendiri; dokumen `00` merangkum perubahan backend/DB.

## Daftar Dokumen

| No | Dokumen | Isi |
|---|---|---|
| 00 | `00-ringkasan-backend-migration.md` | Migration, enum, API baru, urutan kerja (shared untuk grup ini) |
| 00k | `00-kerangka-template.md` | **Kerangka navigasi admin** — sidebar, topbar, nav tree lengkap semua modul, guard |
| 01 | `01-master-akademik.md` | Jenjang · Kelas · Mapel · Kurikulum · Program — CRUD, checkbox, import/export, tabel rapi |
| 02 | `02-kelola-sekolah.md` | Identitas & profil + data siswa/rombel/kuram per tahun — CRUD lengkap |
| 03 | `03-target-sekolah.md` | Nilai penerimaan per tahun, analisa progress — CRUD, filter tahun, tren |
| 04 | `04-materi-pelajaran.md` | Materi Pelajaran — authoring blok terstruktur, media pendukung, filter |
| 05 | `05-bank-soal.md` | Bank Soal — soal detil + pembahasan + media, bulk, import/export, filter detil |
| 06 | `06-ujian.md` | Ujian — wizard subtes multimapel, jadwal, penilaian (IRT), attempt policy, rank/target |

## Keputusan Desain Utama (ringkas)

- **Bentuk pendidikan**: SD/SMP/SMA/SMK + `institution_type` (SEKOLAH/PT).
- **Nilai penerimaan**: tabel `target_school_score` per tahun → filter & analisa progress.
- **Siswa & rombel**: tabel `school_demographic` per tahun; tanpa split gender; tanpa koordinat.
- **Kurikulum sekolah**: satu kolom `curriculum_code`.
- **Status & yayasan**: `school_status` NEGERI/SWASTA + `yayasan_name`.
- **Tabel**: `DataTable` TanStack, checkbox tiap row + bulk aksi, sortable, sticky, resize,
  pagination; nama jelas tidak terpotong.
- **Import/Export**: wizard upload→preview→submit; templat downloadable; export per filter/terpilih.
- **CRUD penuh**: create/edit/delete/toggle di tiap entitas; delete dgn AlertDialog & peringatan cascade.