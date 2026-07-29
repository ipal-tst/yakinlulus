# Checklist Sprint Implementasi: AI Multi-Modal Question Importer
**Platform YakinLulus.id**

---

## 📌 Sprint 1: Backend Core & Multi-Modal AI Parser Service
- [x] **[Backend] DTO & Request Structs**: Buat DTO untuk AI Vision parsing (`ParseQuestionsReq`, `ParsedQuestionResult`, `ParsedOption`).
- [x] **[Backend] Multi-Modal AI Service**: Buat method `ParseQuestionsFromImage` di `internal/ai` pendukung Vision API (base64 image / PDF page image ke AI Vision prompt).
- [x] **[Backend] Dynamic Prompt Engineering**: Terapkan Prompt Engineering presisi tinggi untuk menghasilkan JSON murni terstruktur (Content, LaTeX, Options A-E, Key, Difficulty, Bloom Level, & Pembahasan).
- [x] **[Backend] API Endpoint Registration**: Tambahkan route POST `/api/v1/question-bank/import-ai` dan `/api/v1/ai/parse-questions` di Fiber Handler.
- [x] **[Backend] Multi-Format Fallback Parser**: Dukungan ekstraksi dasar untuk payload CSV/Excel/JSON & Images.

---

## 📌 Sprint 2: Frontend Interactive Staging Area & KaTeX Preview
- [x] **[Frontend] Drag & Drop Upload Modal**: Buat komponen `AIPDFImportModal.tsx` di `/admin/question-bank` pendukung upload file `.pdf`, `.png`, `.jpg`, `.csv`, `.xlsx`.
- [x] **[Frontend] Interactive Preview Table**: Buat komponen `StagingPreviewTable.tsx` / staging area untuk inline-editing (edit teks soal, opsi, kunci, difficulty, bloom level, & pembahasan).
- [x] **[Frontend] Live KaTeX Math Renderer**: Integrasikan KaTeX/LaTeX renderer agar rumus matematika tampil real-time saat diedit.
- [x] **[Frontend] Per-Row AI Actions**: Tambahkan tombol `✨ Generate Pembahasan (AI)` per soal dan tombol `🗑️ Hapus Soal`.
- [x] **[Frontend] Global Metadata Controls**: Dropdown pengesetan Mata Pelajaran, Bab, dan Sumber Soal secara global sebelum import.

---

## 📌 Sprint 3: Atomic DB Batch Import & End-to-End Testing
- [x] **[Backend] Atomic Batch Transaction**: Jalankan `BEGIN ... COMMIT` untuk insert masal ke `contents`, `content_questions`, `content_question_options`.
- [x] **[Backend] Audit & Job Tracking**: Pencatatan audit trail otomatis ke tabel `question_import_jobs` dan `question_import_rows`.
- [x] **[Backend] Media Storage Integrator**: Menyimpan & mengasosiasikan media gambar/diagram soal ke server storage via `internal/media`.
- [x] **[Testing] End-to-End Verification**: Verifikasi kompilasi backend Go (`go build ./cmd/api`) dan frontend TypeScript (`tsc --noEmit`).
- [x] **[Documentation] User Guide**: Dokumentasi komprehensif dan strategi impementasi fitur AI Question Importer.
