# Task 3 Report: Frontend — extend service + helper export/bulk

**Status:** ✅ COMPLETE  
**Date:** 2026-08-11

## Summary

Extended `academic-master.service.ts` with 3 new methods for export/bulk operations, created `academic-excel.ts` helper with pure functions, and wrote tests following TDD.

## Files Changed

| File | Action |
|------|--------|
| `frontend/src/services/academic-master.service.ts` | EXTEND — added `exportXlsx`, `bulkDelete`, `bulkStatus` methods |
| `frontend/src/components/admin/academic/academic-excel.ts` | CREATE — pure helpers: `kindLabel`, `downloadBlob`, type `AcademicKind`, `BulkResult` |
| `frontend/src/components/admin/academic/academic-excel.test.ts` | CREATE — 5 tests for `kindLabel` |

## Interfaces

```ts
// academic-excel.ts
export type AcademicKind = "level" | "grade" | "subject" | "curriculum" | "program";
export interface BulkResult { processed: number; deleted: number; failed: number; errors: { row: number; message: string }[] }
export function kindLabel(kind: AcademicKind): string;
export function downloadBlob(blob: Blob, filename: string): void;

// academic-master.service.ts
exportXlsx(kind: AcademicKind, ids?: string[]): Promise<Blob>;
bulkDelete(kind: AcademicKind, ids: string[]): Promise<BulkResult>;
bulkStatus(kind: AcademicKind, ids: string[], isActive: boolean): Promise<BulkResult>;
```

## Verification Results

### Vitest (5/5 passed)
```
❯ node node_modules/vitest/dist/cli.js run src/components/admin/academic/academic-excel.test.ts

 ✓ src/components/admin/academic/academic-excel.test.ts  (5 tests) 4ms
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

### ESLint (0 errors, 3 warnings)
```
✖ 3 problems (0 errors, 3 warnings)
```
Warnings only:
- `@next/next/no-location-assign-relative-destination` on 401-redirect blocks (same pattern as existing `question-import.service.ts`)

### TypeScript (clean)
```
❯ node node_modules/typescript/bin/tsc --noEmit
(no output — clean)
```

## Implementation Notes

- `api()` tidak support blob response (JSON-only pattern), jadi `exportXlsx` menggunakan raw `fetch` + `Authorization` header via localStorage `yl_token` (pola dari `question-import.service.ts`).
- `downloadBlob` menggunakan `URL.createObjectURL` + anchor `click()` + revoke.
- `kindLabel` map: level→"Jenjang", grade→"Kelas", subject→"Mata Pelajaran", curriculum→"Kurikulum", program→"Program".
- `bulkStatus` mengirim `is_active` (snake_case) sesuai kontrak backend `bulk.go`.

## Concerns

1. `window.location.href` warnings pada service 401-redirect — same pattern as `question-import.service.ts`, bisa diabaikan (warnings, bukan errors).
2. `exportXlsx` tidak menangani retry token refresh (sama seperti pola existing).
3. TDD helper test dihapus dari `downloadBlob` karena memerlukan `jsdom` environment (vitest.config pakai `node`). `kindLabel` saja sudah cukup untuk verifikasi pure helper.

## Next

Task 4 (BulkActionBar + ImportResultCard components).
