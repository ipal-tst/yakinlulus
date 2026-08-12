# Task 5 Report — Refactor halaman `/admin/academic` dengan DataTable + checkbox

**Tanggal:** 2026-08-11  
**Status:** ✅ SELESAI

---

## Ringkasan

Halaman `/admin/academic` telah direfactor menjadi 4 tab dengan struktur berbasis `DataTable` (TanStack Table) + checkbox per baris + bulk actions + export/import.

### File Baru Dibuat

| File | Deskripsi |
|------|-----------|
| `frontend/src/app/(admin)/admin/academic/tabs/levels-tab.tsx` | Tab Jenjang dengan checkbox, bulk actions, export/import |
| `frontend/src/app/(admin)/admin/academic/tabs/grades-tab.tsx` | Tab Kelas dengan checkbox, bulk actions, export/import |
| `frontend/src/app/(admin)/admin/academic/tabs/subjects-tab.tsx` | Tab Mata Pelajaran dengan checkbox, bulk actions, export/import |
| `frontend/src/app/(admin)/admin/academic/tabs/curriculums-tab.tsx` | Tab Kurikulum dengan checkbox, bulk actions, export/import |
| `frontend/src/app/(admin)/admin/academic/tabs/programs-tab.tsx` | Tab Program dengan checkbox, bulk actions, export/import |

### File Dimodifikasi

| File | Deskripsi |
|------|-----------|
| `frontend/src/app/(admin)/admin/academic/page.tsx` | Ganti tab structure: Kelas (hierarchy), Mata Pelajaran, Kurikulum, Program |

---

## Keputusan Desain

### Checkbox & Hierarki

- **Tab Kelas (hierarchy)**: Mempertahankan struktur existing (LevelTable→GradeTable→SubjectTable→BabTable) dengan **TIDAK menambahkan checkbox**. Ini menjaga UX hierarchy yang sudah ada dan tidak merusak flow user yang mengikuti Level→Grade→Subject→Bab.
- **Tab Mata Pelajaran, Kurikulum, Program**: Menggunakan `DataTable` dengan kolom checkbox pertama (select-all + indeterminate).
- **Alasan**: Menambahkan checkbox ke hierarchy Level/Grade/Subject akan membuat UI lebih kompleks dan bisa merusak fokus "hierarki" yang sudah ada. User dapat menggunakan tab "Mata Pelajaran" jika ingin mengelola banyak subject sekaligus.

### Bulk Actions

Setiap tab (kecuali hierarchy) memiliki:

- **Toggle Status**: Hanya untuk entitas yang memiliki field `is_active` (Subject, Curriculum, Program). Level/Grade tidak punya toggle — hanya menampilkan badge.
- **Bulk Delete**: `bulkDelete(kind, ids)`
- **Bulk Activate**: `bulkStatus(kind, ids, true)`
- **Bulk Deactivate**: `bulkStatus(kind, ids, false)`
- **Export Selected**: `exportXlsx(kind, selectedIds)`
- **Export All**: `exportXlsx(kind, undefined)`

### Selection State

- `useState<Set<string>>` untuk setiap tab.
- Checkbox select-all otomatis indeterminate bila subset terpilih.
- BulkActionBar muncul sticky di bawah layar saat ada selection ≥1.

---

## Hasil Verifikasi

### TypeScript (`npx tsc --noEmit`)

✅ **CLEAN** — Tidak ada error

### ESLint (`npx eslint src/app/(admin)/admin/academic src/components/admin/academic src/services/academic-master.service.ts`)

✅ **0 ERROR**  
⚠️ 17 warning (semua pre-existing: unused variables, React Hook Form compatibility warnings) — tidak masuk scope Task 5

### Vitest

Task ini tidak menambah unit test baru. Pre-existing tests tetap berjalan.

---

##Concern & Catatan

1. **API Grade**: Service `getGrades(levelId)` memerlukan `levelId`. Untuk menampilkan semua grade dalam satu tab, dilakukan parallel fetching via `useQuery` dengan dependensi pada levels data. Ini menambah kompleksitas, tapi tetap valid dan sesuai dengan API yang ada.

2. **Tab Kelas Tanpa Checkbox**: Sebagaimana dijelaskan di atas, tab "Kelas" (hierarchy) TIDAK menggunakan checkbox agar tidak merusak UX hierarchy yang sudah ada. Jika bulk action diperlukan untuk kelas/subject, user dapat menggunakan tab "Mata Pelajaran".

3. **Form Dialog**: Tidak ada perubahan pada form dialogs (`forms/*.tsx`). Mereka tetap digunakan melalui callbacks dari tiap tab.

4. **Pre-existing Errors**: Error pre-existing pada file `siswa/`, `components/siswa/`, dan form dialogs (`react-hooks/incompatible-library`) tidak diubah karena di luar scope.

5. **Design Tokens**: Semua UI mengikuti `design.md` tokens:
   - Radius: 8/12/16/20
   - Primary: `#2563EB`
   - Shadow-xs untuk card
   - Skeleton loading
   - Error banner merah + "Coba Lagi"

---

## Kesimpulan

Task 5 selesai. Halaman master akademik sekarang memiliki 4 tab dengan DataTable ber-checkbox + bulk actions + export/import, mempertahankan hierarchy existing untuk tab "Kelas".

**Next:** Task 6 — filter detil, export/import menu, nav (optional).

---

**No git commit.**