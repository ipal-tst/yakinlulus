# Design Specification: Matrix Table UI Layout for True/False & Suitability Questions

**Date:** 2026-08-07  
**Status:** Approved by User  
**Target Files:**
- `frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx`
- `frontend/src/app/(siswa)/exams/[id]/result/page.tsx`

---

## 1. Objective

Redesign the UI rendering of `TRUE_FALSE_MATRIX` and `SUITABILITY_MATRIX` questions in the CBT interface (`/exams/[id]/cbt`) and Exam Result page (`/exams/[id]/result`) into a clean HTML table format with column headers and labeled rows (A, B, C, D, etc.).

---

## 2. Table Layout Specification

### 2.1 Table Structure for `TRUE_FALSE_MATRIX`
| Opsi | Pernyataan | Benar | Salah |
|---|---|:---:|:---:|
| **A** | *Pernyataan 1* | `[ BENAR ]` | `[ SALAH ]` |
| **B** | *Pernyataan 2* | `[ BENAR ]` | `[ SALAH ]` |
| **C** | *Pernyataan 3* | `[ BENAR ]` | `[ SALAH ]` |

### 2.2 Table Structure for `SUITABILITY_MATRIX`
| Opsi | Pernyataan | Sesuai | Tidak Sesuai |
|---|---|:---:|:---:|
| **A** | *Pernyataan 1* | `[ SESUAI ]` | `[ TIDAK SESUAI ]` |
| **B** | *Pernyataan 2* | `[ SESUAI ]` | `[ TIDAK SESUAI ]` |
| **C** | *Pernyataan 3* | `[ SESUAI ]` | `[ TIDAK SESUAI ]` |

---

## 3. Visual Styling
- **Header**: Dark/Muted background with bold centered text for choice columns.
- **Row Labels**: A, B, C, D badges in primary/muted theme.
- **Selection Highlight**: Selected choice button fills with active color (Emerald for Benar/Sesuai, Red/Amber for Salah/Tidak Sesuai).

---

## 4. Verification Plan

1. **Type Safety**: Run `npx tsc --noEmit` in `frontend/` to confirm 0 compilation errors.
2. **Visual Verification**: Confirm that matrix questions render as a clean HTML table in `/exams/ex-1/cbt`.
