````markdown
# 12_question_bank.md

> Product : YakinLulus.id  
> Module : Question Bank (Bank Soal)  
> Document Type : UI/UX Specification  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

Question Bank merupakan pusat pengelolaan seluruh soal pada platform YakinLulus.id.

Halaman ini digunakan oleh:

- Admin
- Staff
- Guru

untuk membuat, mengelola, mengimpor, mengelompokkan, meninjau, dan mempublikasikan soal.

Question Bank menjadi sumber utama untuk:

- Practice
- CBT
- AI Recommendation
- Question Generator
- Analytics

---

# 2. Design Goals

Halaman ini dirancang untuk:

- mempercepat pembuatan soal;
- memudahkan pencarian soal;
- mendukung import ribuan soal;
- mempermudah review kualitas soal;
- mendukung AI Assisted Authoring.

---

# 3. User Flow

```
Dashboard

↓

Question Bank

↓

Search / Filter

↓

Question List

↓

Question Detail

↓

Edit

↓

Review

↓

Publish

↓

Used in CBT / Practice
```

---

# 4. Layout Structure

```
+---------------------------------------------------------------+

Header

---------------------------------------------------------------

Breadcrumb

---------------------------------------------------------------

Statistics

---------------------------------------------------------------

Search

---------------------------------------------------------------

Advanced Filter

---------------------------------------------------------------

Quick Action

---------------------------------------------------------------

Question Table

---------------------------------------------------------------

Pagination

---------------------------------------------------------------

Question Preview Drawer

---------------------------------------------------------------

Footer

+---------------------------------------------------------------+
```

---

# 5. Sidebar Navigation

- Dashboard
- Question Bank
- Learning Material
- Practice
- CBT
- Analytics
- AI Assistant

---

# 6. Header

Komponen:

- Global Search
- Notification
- User Menu
- Theme Toggle

Sticky

72 px

---

# 7. Statistics Widget

Menampilkan:

- Total Questions
- Draft
- Published
- Archived
- Used in CBT
- AI Generated
- Need Review

Menggunakan KPI Card.

---

# 8. Quick Action

Shortcut:

- Tambah Soal
- Import Excel
- Import Word
- Import PDF
- AI Generate Question
- Bulk Edit
- Export
- Review Queue

---

# 9. Search

Mencari berdasarkan:

- Question ID
- Judul
- Kata Kunci
- Pembahasan
- Tag
- Author

Shortcut

```
Ctrl + K
```

---

# 10. Advanced Filter

Filter berdasarkan:

- Jenjang
- Kelas
- Mata Pelajaran
- Bab
- Sub Bab
- Topik
- Tingkat Kesulitan
- Tahun
- Kurikulum
- Status
- Tipe Soal
- Sumber
- AI Generated
- Reviewed
- Published

Filter dapat disimpan sebagai preset.

---

# 11. Question Table

Kolom:

- Checkbox
- Question ID
- Preview
- Subject
- Grade
- Chapter
- Difficulty
- Question Type
- Source
- Status
- Used Count
- Last Updated
- Action

---

# 12. Question Preview

Preview tanpa berpindah halaman.

Menampilkan:

- Soal
- Gambar
- Pilihan Jawaban
- Jawaban Benar
- Pembahasan
- Metadata

Menggunakan Right Drawer.

---

# 13. Question Detail

Layout

```
Question

↓

Image

↓

Options

↓

Correct Answer

↓

Explanation

↓

Learning Objective

↓

Tags

↓

Metadata

↓

Usage History

↓

Revision History
```

---

# 14. Question Metadata

Menampilkan:

- Question ID
- Subject
- Grade
- Chapter
- Sub Chapter
- Topic
- Difficulty
- Curriculum
- Source
- Author
- Reviewer
- Version
- Created Date
- Updated Date

---

# 15. Question Type

Mendukung:

- Multiple Choice
- Multiple Response
- True / False
- Matching
- Fill Blank
- Essay *(Future)*

Untuk MVP, tipe utama tetap **Multiple Choice**.

---

# 16. Rich Content Support

Question Editor mendukung:

- Rich Text
- Image
- SVG
- Table
- Math Formula (KaTeX)
- Chemical Formula
- Diagram
- Audio *(Future)*
- Video *(Future)*

---

# 17. Story Question

Satu bacaan dapat digunakan oleh beberapa soal.

```
Story

↓

Question 1

Question 2

Question 3

Question 4
```

Story ditampilkan satu kali.

---

# 18. Image Support

Mendukung:

- PNG
- JPG
- SVG
- WEBP

Maximum:

5 MB

---

# 19. AI Question Generator

AI membantu:

- membuat soal baru;
- membuat pembahasan;
- membuat distraktor;
- menentukan tingkat kesulitan;
- membuat variasi soal.

Guru tetap menjadi reviewer akhir.

---

# 20. Bulk Import

Mendukung:

- Excel
- CSV
- Word
- PDF *(OCR Pipeline)*
- Image *(OCR Pipeline)*

Import menampilkan:

- Preview
- Error Validation
- Duplicate Detection
- Success Summary

---

# 21. Bulk Edit

Aksi massal:

- Publish
- Archive
- Delete
- Change Subject
- Change Chapter
- Change Difficulty
- Change Tags

---

# 22. Version History

Setiap perubahan soal memiliki:

- Version
- Editor
- Timestamp
- Change Log

Soal dapat dikembalikan ke versi sebelumnya.

---

# 23. Review Workflow

Status:

```
Draft

↓

In Review

↓

Approved

↓

Published

↓

Archived
```

Setiap status memiliki riwayat.

---

# 24. Usage History

Menampilkan:

- Digunakan pada Practice
- Digunakan pada CBT
- Jumlah penggunaan
- Tingkat keberhasilan siswa
- Tingkat kesulitan aktual

---

# 25. Analytics Widget

Statistik soal:

- Average Score
- Wrong Answer Rate
- Correct Answer Rate
- Discrimination Index *(Future)*
- Difficulty Index
- Popularity

---

# 26. Empty State

```
Belum ada soal.

[ Tambah Soal ]
```

---

# 27. Loading State

Menggunakan Skeleton.

Preview dimuat secara lazy.

---

# 28. Error State

```
Soal gagal dimuat.

[ Coba Lagi ]
```

---

# 29. Responsive Behavior

Desktop

- Table penuh
- Drawer Preview

Tablet

- Compact Table

Mobile

- Card View
- Preview Full Screen

---

# 30. Accessibility

Memenuhi WCAG 2.2 AA.

Mendukung:

- Keyboard Navigation
- Screen Reader
- Focus Visible
- Alt Text pada gambar

---

# 31. API Requirement

```
GET /questions

GET /questions/{id}

POST /questions

PUT /questions/{id}

DELETE /questions/{id}

POST /questions/import

POST /questions/export

POST /questions/review

GET /questions/history

GET /questions/analytics

POST /questions/ai-generate
```

---

# 32. Performance Requirement

Target:

- Initial Load < 2 detik
- Search < 500 ms
- Preview Drawer < 300 ms
- Infinite Pagination
- Server-side Filtering
- Lazy Image Loading

---

# 33. Component Dependency

Menggunakan:

- AppShell
- DataTable
- Filter Panel
- Search Box
- Drawer
- Rich Text Editor
- Image Viewer
- Formula Renderer
- Badge
- Status Chip
- Pagination
- Upload Dialog
- Progress Dialog
- Skeleton
- Toast

---

# 34. Data Contract

Minimal field:

- Question ID
- Question
- Options
- Correct Answer
- Explanation
- Subject
- Grade
- Chapter
- Topic
- Difficulty
- Source
- Tags
- Status
- Version

---

# 35. Security

Hak akses:

Admin

- Full Access

Staff

- CRUD sesuai permission

Teacher

- CRUD soal milik sendiri
- Melihat soal yang dibagikan

Semua aktivitas dicatat dalam Audit Log.

---

# 36. Analytics Event

Dicatat:

- Question Created
- Question Updated
- Question Deleted
- Question Published
- Question Imported
- Question Exported
- AI Generate Used
- Preview Opened
- Search Used

---

# 37. Widget Priority

Urutan prioritas:

1. Statistics
2. Search
3. Filter
4. Quick Action
5. Question Table
6. Preview Drawer
7. Analytics

---

# 38. Future Enhancement

Dirancang mendukung:

- OCR Pipeline
- AI Difficulty Calibration
- AI Distractor Generator
- AI Question Review
- Duplicate Detection AI
- Bloom Taxonomy Classification
- Question Quality Score
- Collaborative Review
- Real-time Co-editing
- Voice Question
- Video Question
- Adaptive Question Pool

---

# 39. QA Checklist

□ Search berfungsi.

□ Filter bekerja.

□ Table pagination benar.

□ Preview Drawer tampil.

□ Rich Text tampil benar.

□ Formula matematika tampil benar.

□ Image tampil benar.

□ Import Excel berhasil.

□ Import Word berhasil.

□ Duplicate Detection berjalan.

□ Version History tersedia.

□ Review Workflow sesuai.

□ Empty State tersedia.

□ Loading State tersedia.

□ Error State tersedia.

□ Responsive.

□ WCAG AA.

□ Analytics Event tercatat.

□ API sesuai kontrak.

---

# 40. Design Notes

## Layout Priority

```
Statistics

↓

Search

↓

Advanced Filter

↓

Quick Action

↓

Question Table

↓

Preview Drawer
```

## Table Default

Page Size

```
25 Rows
```

Pilihan:

- 25
- 50
- 100

## Preview Drawer

Width

```
560 px
```

## Question Editor

Editor menggunakan layout dua panel:

```
Question Editor

|

Live Preview
```

Sehingga guru dapat melihat hasil akhir secara langsung saat membuat atau mengedit soal.

## Default Sorting

- Last Updated
- Published
- Most Used
- Recently Created
````

### Rekomendasi

Karena **Bank Soal merupakan inti (core domain)** YakinLulus.id, saya menyarankan editor soal menggunakan **split-view editor**:

* **Panel kiri:** Editor (soal, pilihan jawaban, metadata, pembahasan).
* **Panel kanan:** Live Preview persis seperti tampilan siswa saat mengerjakan latihan atau CBT.

Pendekatan ini mengurangi kesalahan format, mempercepat proses review, dan memastikan soal yang dibuat guru identik dengan pengalaman yang akan diterima siswa saat belajar maupun mengikuti ujian.
