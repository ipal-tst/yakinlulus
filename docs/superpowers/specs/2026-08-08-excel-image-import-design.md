# Technical Design: Excel Embedded Image Import with Client-Side Preview & Configurable Storage Path

## 1. Executive Summary & Goal
Enhance the YakinLulus.id Admin Question Import system to allow administrators to insert question images (`Gambar Soal`) and explanation images (`Gambar Pembahasan`) directly into Excel template cells (`template_import_soal.xlsx`). The frontend parses embedded cell images client-side via `exceljs`, displays live visual thumbnail previews in the import table before committing data, allows target storage folder configuration directly from the UI, and automatically uploads the images to the system's media storage when saving.

---

## 2. Requirements & Specification

### 2.1 Excel Template & Cell Anchor Schema
* **Template File**: `backend/static/templates/template_import_soal.xlsx` (and dynamic generator in `import_xlsx.go`).
* **Cell Anchor Rules**:
  * Images **MUST** be placed inside specific cells on sheet `Soal` (Row $N$ corresponds to Question $N-1$).
  * **Column H (Index 7)**: `Gambar Soal` (Embedded image for question text).
  * **Column AB (Index 27)**: `Gambar Pembahasan` (Embedded image for explanation text).
* **Anchor Detection**: The parser resolves top-left cell anchor (`image.range.tl.col`, `image.range.tl.row`) to link the image to the exact question row.

---

### 2.2 Client-Side Parsing Engine (`exceljs`)
* **Package**: `exceljs` library in `frontend/src/services/question-excel-parser.ts`.
* **Process**:
  1. Read workbook array buffer.
  2. Extract drawing objects using `worksheet.getImages()`.
  3. Convert binary image buffer to Data URL (`data:image/{extension};base64,...`) and construct client Blob File object.
  4. Associate extracted image Data URLs with the corresponding `ParsedQuestionRow` instance.

---

### 2.3 Data Model Extensions (`ParsedQuestionRow`)
Extend the TypeScript interface in `question-excel-parser.ts`:
```typescript
export interface ParsedQuestionRow {
    // Existing metadata fields...
    questionImageBase64?: string;
    pembahasanImageBase64?: string;
    questionImageFile?: File;
    pembahasanImageFile?: File;
    questionImageUrl?: string;
    pembahasanImageUrl?: string;
}
```

---

### 2.4 Frontend UI & Admin Storage Configuration
1. **Storage Settings Panel** (Halaman Admin `/admin/questions/import`):
   * **Target Folder Path Input**: Configurable input field (e.g., `questions/utbk-2026/matematika` or default `questions/general`).
   * Allows admins to categorize media without backend configuration changes.
2. **Preview Table Enhancement**:
   * New **"Media / Gambar"** column rendering thumbnail badges (`📷 Soal`, `📷 Solusi`).
   * Clicking a thumbnail opens a full-screen **Lightbox Modal** preview.
3. **Expandable Dropdown Editor & Student POV Modal**:
   * Real-time image preview cards below the Question text area and Explanation text area.
   * Actions: **[Upload/Ganti Gambar]**, **[Hapus Gambar]**.

---

### 2.5 Backend API Integration & Storage Upload Workflow
1. **Upload Endpoint**: `POST /api/v1/media/upload` (accepts `file` multipart, `folder`, `entity_type`, `entity_id`).
2. **Batch Upload Executed On Save**:
   * When admin clicks **"Simpan Import Soal"**:
     1. Collect rows containing un-uploaded `questionImageFile` or `pembahasanImageFile`.
     2. Upload image files to `/api/v1/media/upload` with the configured `folder` parameter.
     3. Populate returned storage URLs (`https://.../uploads/questions/...`) into question payload `block1_image_url` and `pembahasan_image_url`.
     4. Dispatch bulk question create API request to backend.

---

## 3. Self-Review & Integrity Check
* **Placeholder Scan**: Verified 0 `TODO`, `TBD`, or ambiguous statements.
* **Consistency Check**: Backend media endpoint matches existing `media.go` module (`POST /api/v1/media/upload`). Frontend parsing aligns with Next.js 16 client components.
* **Scope Boundary**: Dedicated strictly to Excel embedded image extraction, preview table rendering, storage path selection, and media batch upload.

---

## 4. Verification Plan
* **Automated Type Check**: `cmd /c "npx tsc --noEmit"` in `frontend`.
* **Template Generation Check**: Recompile backend API and verify sheet headers in generated XLSX template.
* **E2E Upload Workflow Test**: Parse test Excel with embedded PNG image $\rightarrow$ Verify table preview thumbnail $\rightarrow$ Execute Save $\rightarrow$ Verify media URL persistence in database.
