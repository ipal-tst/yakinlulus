# Excel Embedded Image Import & Client-Side Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable admins to import Excel question files containing embedded cell images (`Gambar Soal` & `Gambar Pembahasan`), preview them in the browser via `exceljs`, configure target storage folder paths from the UI, and automatically upload images to backend storage (`/api/v1/media/upload`).

**Architecture:** Frontend parses `.xlsx` embedded images using `exceljs`, converts binary drawing buffers to base64 Data URLs & Blob Files, attaches them to `ParsedQuestionRow`, renders thumbnail lightboxes in the import table and dropdown editor, and executes batch media upload with user-configured folder tags upon clicking "Simpan Import Soal".

**Tech Stack:** Next.js 16, TypeScript, `exceljs`, Go Fiber (`POST /api/v1/media/upload`), Tailwind CSS, `shadcn/ui`.

## Global Constraints
- TypeScript must compile cleanly (`cmd /c "npx tsc --noEmit"` in `frontend`).
- Excel cell anchor detection must use top-left cell row (`image.range.tl.row`) and column (`image.range.tl.col`).
- File uploads use the existing `POST /api/v1/media/upload` multipart endpoint with `file` and `folder` form values.

---

### Task 1: Add `exceljs` Dependency & Update Excel Template Generator

**Files:**
- Modify: `frontend/package.json`
- Modify: `backend/internal/question_bank/import_xlsx.go:380-450`

**Interfaces:**
- Consumes: `backend/internal/question_bank/import_xlsx.go` template handler.
- Produces: `exceljs` package in frontend node_modules; Excel template with explicit `Gambar Soal` (Col H) & `Gambar Pembahasan` (Col AB) headers.

- [ ] **Step 1: Install `exceljs` package in frontend**

Run: `cmd /c "npm install exceljs --prefix frontend"`
Expected: `exceljs` added to `frontend/package.json`.

- [ ] **Step 2: Update backend XLSX template header columns**

In `backend/internal/question_bank/import_xlsx.go`, ensure headers include `Gambar Soal` and `Gambar Pembahasan` column designations.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cmd /c "npx tsc --noEmit"` in `frontend`.
Expected: PASS with zero errors.

- [ ] **Step 4: Commit Task 1**

```bash
git add frontend/package.json frontend/package-lock.json backend/internal/question_bank/import_xlsx.go
git commit -m "feat(import): install exceljs and update question import template schema"
```

---

### Task 2: Implement Client-Side `exceljs` Embedded Image Extractor

**Files:**
- Modify: `frontend/src/services/question-excel-parser.ts`

**Interfaces:**
- Consumes: `exceljs` Workbook API.
- Produces: `parseExcelQuestionFileWithExcelJS(file: File): Promise<ParsedQuestionRow[]>` containing `questionImageBase64`, `pembahasanImageBase64`, `questionImageFile`, `pembahasanImageFile`.

- [ ] **Step 1: Extend `ParsedQuestionRow` interface**

```typescript
export interface ParsedQuestionRow {
    // Existing fields...
    questionImageBase64?: string;
    pembahasanImageBase64?: string;
    questionImageFile?: File;
    pembahasanImageFile?: File;
    questionImageUrl?: string;
    pembahasanImageUrl?: string;
}
```

- [ ] **Step 2: Add `exceljs` workbook parser function**

Implement `parseExcelQuestionFileWithExcelJS(file: File)`:
1. Load buffer using `exceljs.Workbook.xlsx.load(buffer)`.
2. Extract images from `worksheet.getImages()`.
3. Map `range.tl.row` (0-indexed Excel row) to question row index.
4. Extract image buffer from `workbook.getImage(imageId)`, convert to base64 Data URL and `File` object.
5. Populate `questionImageBase64`/`pembahasanImageBase64` into the respective `ParsedQuestionRow`.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cmd /c "npx tsc --noEmit"` in `frontend`.
Expected: PASS with zero errors.

- [ ] **Step 4: Commit Task 2**

```bash
git add frontend/src/services/question-excel-parser.ts
git commit -m "feat(import): implement client-side embedded image extractor using exceljs"
```

---

### Task 3: Build Storage Settings & Image Preview UI in Import Page

**Files:**
- Modify: `frontend/src/app/(admin)/admin/questions/import/page.tsx`

**Interfaces:**
- Consumes: `ParsedQuestionRow` with image Data URLs.
- Produces: Storage Path Input Panel (`targetFolder`), Table Media Thumbnail Badge, Lightbox Modal, Dropdown Drawer Image Cards with Replace/Delete buttons.

- [ ] **Step 1: Add Storage Settings Panel**

Add state `targetFolder` (default: `"questions/general"`) with input selector for custom folder categorization (e.g. `questions/utbk-2026`).

- [ ] **Step 2: Add Media Column & Thumbnail Lightbox**

Render `📷 Gambar` column in the preview table. Show thumbnail image when present. Clicking thumbnail triggers a Lightbox Modal.

- [ ] **Step 3: Add Image Management to Expanded Row Drawer**

Inside the dropdown drawer editor (`<tr key={`drawer-${row.id}`}>`), render Question Image preview and Solution Image preview cards with `[Ganti Gambar]` and `[Hapus]` controls.

- [ ] **Step 4: Verify TypeScript compilation**

Run: `cmd /c "npx tsc --noEmit"` in `frontend`.
Expected: PASS with zero errors.

- [ ] **Step 5: Commit Task 3**

```bash
git add frontend/src/app/\(admin\)/admin/questions/import/page.tsx
git commit -m "feat(import): add storage settings panel and image preview controls to import UI"
```

---

### Task 4: Implement Batch Media Upload & Database Save Workflow

**Files:**
- Modify: `frontend/src/app/(admin)/admin/questions/import/page.tsx`

**Interfaces:**
- Consumes: `POST /api/v1/media/upload` Fiber endpoint.
- Produces: Automatic image upload before question creation, associating persisted media URLs to questions.

- [ ] **Step 1: Implement `uploadRowImages` helper**

Iterate over rows with `questionImageFile` or `pembahasanImageFile`. Formulate `FormData` with `file` and `folder: targetFolder`. Upload to `/api/v1/media/upload` and obtain public media `url`.

- [ ] **Step 2: Update `handleSaveAll` batch save handler**

In `handleSaveAll`:
1. Upload pending images via `uploadRowImages`.
2. Update question payload `block1_image_url` and `pembahasan_image_url` with persisted URLs.
3. Submit final question batch payload to backend.

- [ ] **Step 3: Run end-to-end type check**

Run: `cmd /c "npx tsc --noEmit"` in `frontend`.
Expected: PASS with zero errors.

- [ ] **Step 4: Commit Task 4**

```bash
git add frontend/src/app/\(admin\)/admin/questions/import/page.tsx
git commit -m "feat(import): integrate batch media upload workflow on save"
```
