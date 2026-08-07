# Design Specification: Bank Soal Admin UI & Multi-Format Import Engine

**Date:** 2026-08-07  
**Scope:** Frontend Only (`frontend/src/...`)  
**Constraint:** Strict read-only for existing items (NO Edit, NO Delete actions).

---

## 1. Overview & Objectives

Enhance the **Bank Soal (Question Bank)** administration module in YakinLulus.id to support enterprise-grade question authoring, detailed cataloging, and multi-format document/file ingestion (PDF, DOCX, XLSX, CSV).

### Key Features
1. **Admin Bank Soal Dashboard & Catalog Table (`/admin/questions`)**
   - Metrics overview bar (Total Soal, Drafts, Published, Difficulty breakdown, Import Jobs status).
   - Rich Data Table with multi-faceted filtering (Subject, Education Level, Difficulty, Question Type, Status, HOTS flag, Search).
   - Comprehensive **Detail Drawer / Slide-Over Panel** to preview full question blocks, options, explanations, classification tags, IRT statistics, and version history.
   - Strictly NO Edit/Delete buttons (compliance with user constraint).
   - Header actions: "Tambah Soal", "Import Soal (PDF/Docx/Xlsx/CSV)", "Export Data".

2. **Halaman Tambah Soal (`/admin/questions/create`)**
   - Multi-section authoring interface with real-time student preview card.
   - **Section 1: Hierarchical Master Academic Classification** (Level, Subject, Grade, Chapter, Topic, Competency/Capaian Pembelajaran).
   - **Section 2: Question Type & Cognitive Metadata** (Single Choice, Multiple Choice, True/False, Short Answer, Essay; Difficulty EASY/MEDIUM/HARD/EXPERT, Bloom's Taxonomy C1-C6, Estimated Duration, HOTS badge, Calculator allowed, Option Randomization).
   - **Section 3: Block-Based Content Editor** (Paragraph text, LaTeX formula builder with real-time rendering, Image media preview, Table structure builder).
   - **Section 4: Option & Answer Key Builder** (Dynamic options A-E with score weights & correct answer toggle, or True/False statement grid, or Short Answer key terms).
   - **Section 5: Pembahasan (Explanation) & Hints** (Step-by-step solution blocks and hint list).

3. **Halaman Import Soal Multi-Format (`/admin/questions/import`)**
   - Supports **PDF, DOCX, XLSX, CSV** document processing.
   - **Format Selection & Template Downloads**: Download pre-built Excel (.xlsx) and CSV template files with sample formatting rules.
   - **OCR & AI Parsing Pipeline Stepper**:
     - Stage 1: Upload File & Classification Defaults
     - Stage 2: Processing Pipeline Animation/Status (Upload → Validation → OCR/AI Parsing → Quality Review → Import Execution)
     - Stage 3: Interactive Parsed Question Review Table (Preview extracted question text, options, detected answer, confidence score, warning/error badges)
     - Stage 4: Batch Import Submission & Execution Summary

---

## 2. Architecture & File Structure

```text
frontend/src/
├── app/(admin)/admin/questions/
│   ├── page.tsx                     # Bank Soal Catalog & Table (Enhanced)
│   ├── create/
│   │   └── page.tsx                 # Halaman Tambah Soal (Full Form & Live Preview)
│   └── import/
│       └── page.tsx                 # Halaman Import Soal (PDF, DOCX, XLSX, CSV)
├── components/admin/questions/
│   ├── question-detail-drawer.tsx   # Read-only Detail Slide-over Panel
│   ├── question-filter-bar.tsx      # Comprehensive Filter & Search Bar
│   ├── question-stats-bar.tsx       # Metrics summary cards
│   ├── block-editor.tsx             # Block content editor (Text, LaTeX, Image, Table)
│   ├── option-builder.tsx           # Dynamic answer key & options configuration
│   ├── import-dropzone.tsx          # Drag & Drop file uploader with format badges
│   └── parsed-question-table.tsx    # Parsed questions review table before import
├── services/
│   ├── question.service.ts          # Enhanced Question API Service
│   └── question-import.service.ts   # Import engine & template service
└── types/
    └── question-bank.ts             # Comprehensive Question Bank & Import Type definitions
```

---

## 3. UI/UX Specifications

### Color & Aesthetic Tokens
- Primary: Deep Indigo / Violet (`hsl(234, 89%, 64%)`)
- Accents: Emerald Green for Valid/Correct, Amber for Warnings/HOTS, Crimson for Errors/Expert.
- Styling: Modern glassmorphism cards, rounded-2xl panels, subtle micro-interactions, responsive grid layout.

### Data Table Actions (Catalog)
- Checkbox select for batch export.
- Row Click / "Lihat Detail" button → Opens `QuestionDetailDrawer`.
- Copy Code button → Quick clipboard copy of `question_code`.
- **NO Edit or Delete buttons** present in table rows or drawers.

---

## 4. Verification & Testing Plan

1. **Catalog Page Testing**: Navigate to `/admin/questions`, test search query filtering, filter by Subject, Difficulty, Type, and verify row detail drawer opens with complete question data.
2. **Create Page Testing**: Navigate to `/admin/questions/create`, fill form fields across all 5 sections, observe real-time preview card, and click "Simpan Soal" to verify question creation.
3. **Import Page Testing**: Navigate to `/admin/questions/import`, select file formats (PDF, DOCX, XLSX, CSV), download sample template, simulate file drop, observe OCR/AI pipeline step execution, review parsed table, and confirm batch import.
