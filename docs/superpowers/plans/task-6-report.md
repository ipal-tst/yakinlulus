# Task 6 Report — Master Akademik Filter & Navigation Update

**Date:** 2026-08-11  
**Status:** ✅ COMPLETED  
**No Git Commit**

---

## Summary

Task 6 melengkapi halaman Master Akademik (`/admin/academic`) dengan:

- **Filter detil**: Status dropdown di halaman utama + setiap tab
- **Export/Import menu**: Dropdown import + tombol export per tab
- **Refetch button**: Tombol Muat Ulang untuk refresh semua data
- **Nav consistency**: Item menu Master Akademik sesuai `00-kerangka-template.md`

---

## Changes Made

### `frontend/src/app/(admin)/admin/academic/page.tsx`

**Modifikasi:**
1. Tambah state `filterStatus` (`"all" | "active" | "inactive"`)
2. Update query keys: subjects, curriculums, programs dengan `filterStatus`
3. Filter bar di bawah breadcrumb: menampilkan filter status + tombol
4. Header actions:
   - Dropdown "Import ▾" → link `/admin/academic/import`
   - Tombol "Muat Ulang" (refetch semua query)
   - Tombol "+ Tambah" per tab (buka dialog form)
5. Kirim `filterStatus` ke tab komponen

### `frontend/src/app/(admin)/admin/academic/tabs/subjects-tab.tsx`

**Modifikasi:**
1. Props `filterStatus?: "all" | "active" | "inactive"`
2. Query key: `["academic-all-subjects", filterStatus]`
3. Dropdown filter di header tab (bukan filter bar global)
4. Export button per tab (sudah ada)
5. Import button di halaman utama

### `frontend/src/app/(admin)/admin/academic/tabs/curriculums-tab.tsx`

**Modifikasi:**
1. Props `filterStatus?: "all" | "active" | "inactive"`
2. Query key: `["academic-curriculums", filterStatus]`
3. Dropdown filter di header tab
4. Export button per tab

### `frontend/src/app/(admin)/admin/academic/tabs/programs-tab.tsx`

**Modifikasi:**
1. Props `filterStatus?: "all" | "active" | "inactive"`
2. Query key: `["academic-programs", filterStatus]`
3. Dropdown filter di header tab
4. Export button per tab

### `frontend/src/services/academic-master.service.ts`

**Modifikasi:**
1. `getSubjects(levelId, gradeId, status)` → support filter `is_active`
2. `getCurriculums(status)` → support filter `is_active`
3. `getPrograms(status)` → support filter `is_active`

**Backend requirement:** Endpoint harus support query param `is_active=all|active|inactive`

### `frontend/src/config/admin-nav.ts`

**Tidak diubah** — sudah sesuai `00-kerangka-template.md`:

| Grup | Item | href | Status |
|------|------|------|--------|
| Master Akademik | Akademik | `/admin/academic` | ✅ |
| Master Akademik | Import Akademik | `/admin/academic/import` | ✅ |
| Master Akademik | Kelola Sekolah | `/admin/schools` (SA), `/staff/schools` (ST) | ✅ |
| Master Akademik | Target Sekolah | `/admin/schools?tab=targets` | ✅ |

---

## Filter Behavior

### Global Filter (Page Level)
- **Lokasi:** Di bawah breadcrumb navigation
- **Status dropdown:** mempengaruhi subjects, curriculums, programs di semua tab
- **Jenjang/Kelas/Mapel cascade:** tetap via `selectedLevel/Grade/Subject` state

### Per-Tab Filter
- **Lokasi:** Header setiap tab (Subjects/Curriculums/Programs)
- **Dropdown:** "Semua Status" / "Aktif" / "Non-aktif"
- **Fungsi:** Filter data di tab tersebut (override global status jika tab aktif)

### Export Behavior
- **Import dropdown (header):** Link ke `/admin/academic/import`
- **Export buttons (per tab):** Memanggil `academicMasterService.exportXlsx(kind)` dengan filename `akademik-<kind>-<date>.xlsx`

---

## Verification Results

| Command | Status | Output |
|---------|--------|--------|
| `npx tsc --noEmit` | ✅ PASS | No errors |
| `npx eslint` | ✅ PASS | 0 errors (25 warnings — pre-existing) |
| `npx vitest run` | ✅ PASS | 17 test files, 61 tests passed |

**Notes:**
- Warning `@typescript-eslint/no-unused-vars` pada `page.tsx`, tab komponen — sudah dibersihkan import tambahan dari Task 5
- Warning `react-hooks/incompatible-library` — pre-existing di form dialogs
- Warning `no-location-assign-relative-destination` — pre-existing di service
- No errors pada file yang dimodifikasi Task 6

---

## Concerns

1. **Backend API compatibility:**
   - `GET /academic/subjects?is_active=active|inactive`
   - `GET /academic/curriculums?is_active=active|inactive`
   - `GET /academic/programs?is_active=active|inactive`
   - Backend must handle optional `is_active` query param

2. **Filter status di hierarchy tab (Kelas):**
   - Filter status tidak berlaku di hierarchy tab (tingkat jenjang/kelas/mapel)
   - Hanya berlaku di tab Mata Pelajaran, Kurikulum, Program
   - (Ditahan sementara karena subject di hierarchy menggunakan filter berbeda)

3. **Dropdown import (page header):**
   - Saat ini link ke halaman import existing (`/admin/academic/import`)
   - Belum ada dropdown sub-menu untuk import berdasarkan tab aktif (opsional)

---

## Files Modified

| File | Changes |
|------|---------|
| `frontend/src/app/(admin)/admin/academic/page.tsx` | Filter bar, export/import menu, refetch, status propagation |
| `frontend/src/app/(admin)/admin/academic/tabs/subjects-tab.tsx` | Filter props, query key, dropdown filter |
| `frontend/src/app/(admin)/admin/academic/tabs/curriculums-tab.tsx` | Filter props, query key, dropdown filter |
| `frontend/src/app/(admin)/admin/academic/tabs/programs-tab.tsx` | Filter props, query key, dropdown filter |
| `frontend/src/services/academic-master.service.ts` | Support `is_active` query param |

---

## Status Summary

✅ Task 6 selesai  
✅ Tipe check pass  
✅ Lint check pass (0 errors)  
✅ Test pass (61/61)  
✅ Nav menu sesuai desain  
✅ Filter status berfungsi  
✅ Export/Import menu tersedia  

**No commit.** Siap untuk Task 7 verification.
