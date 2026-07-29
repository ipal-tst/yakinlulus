````markdown
# 11_learning_material.md

> Product : YakinLulus.id
> Module : Learning Material
> Document Type : UI/UX Specification
> Version : 1.0.0
> Status : Draft
> Owner : Product Design Team

---

# 1. Purpose

Learning Material merupakan pusat seluruh materi pembelajaran pada YakinLulus.id.

Halaman ini dirancang agar siswa dapat:

- menemukan materi dengan cepat;
- belajar secara terstruktur;
- melanjutkan pembelajaran terakhir;
- memperoleh rekomendasi AI;
- memantau progres belajar.

Learning Material bukan sekadar halaman daftar materi, tetapi merupakan **Learning Experience Hub**.

---

# 2. Design Goals

Tujuan utama halaman ini adalah:

- meningkatkan engagement belajar;
- mengurangi waktu pencarian materi;
- mempercepat proses belajar;
- memberikan pengalaman belajar yang personal;
- mendukung berbagai format materi.

---

# 3. Supported Content

Learning Material mendukung berbagai jenis konten.

- Text Article
- PDF
- Slide Presentation
- Video
- Audio
- Image
- Infographic
- Interactive Content
- Embedded YouTube
- AI Generated Summary
- Downloadable File

---

# 4. User Flow

```
Dashboard

↓

Learning Material

↓

Search / Filter

↓

Material Detail

↓

Study

↓

Quiz

↓

Complete

↓

Recommendation
```

---

# 5. Layout Structure

```
+------------------------------------------------------------+

Header

-------------------------------------------------------------

Breadcrumb

-------------------------------------------------------------

Search Bar

-------------------------------------------------------------

Continue Learning

-------------------------------------------------------------

AI Recommendation

-------------------------------------------------------------

Category

-------------------------------------------------------------

Recent Material

-------------------------------------------------------------

All Material Grid

-------------------------------------------------------------

Pagination

-------------------------------------------------------------

Footer

+------------------------------------------------------------+
```

---

# 6. Navigation

Sidebar

- Dashboard
- Learning Material
- Practice
- CBT
- AI Tutor
- Analytics

---

# 7. Header

Komponen

- Search
- Notification
- Dark Mode
- User Profile

Sticky Header

72 px

---

# 8. Continue Learning

Widget pertama.

Menampilkan:

- Thumbnail
- Subject
- Chapter
- Last Position
- Progress
- Remaining Time

CTA

```
Continue Learning
```

---

# 9. AI Recommendation

AI menampilkan:

- Recommended Material
- Difficulty
- Estimated Time
- Reason Recommendation

Contoh

```
Kami menyarankan
Persamaan Linear
karena akurasi Anda
baru mencapai 61%.
```

---

# 10. Category Section

Kategori utama.

- Matematika
- Bahasa Indonesia
- Bahasa Inggris
- IPA
- IPS
- PKN
- Informatika

Desktop

Grid

Mobile

Horizontal Scroll

---

# 11. Filter

Filter berdasarkan:

- Subject
- Grade
- Chapter
- Difficulty
- Duration
- Type
- Progress
- Favorite

---

# 12. Search

Global Search.

Mencari:

- Judul
- Chapter
- Keyword
- Tag
- Author

Shortcut

```
Ctrl + K
```

---

# 13. Material Card

Setiap card menampilkan:

- Thumbnail
- Subject
- Chapter
- Title
- Difficulty
- Estimated Time
- Progress
- Rating
- Bookmark
- Download
- Continue Button

---

# 14. Material Detail

Layout

```
Header

↓

Title

↓

Meta Information

↓

Video / PDF

↓

Content

↓

Example

↓

Summary

↓

Quiz

↓

Discussion

↓

Recommendation
```

---

# 15. Material Metadata

Menampilkan:

- Subject
- Grade
- Chapter
- Sub Chapter
- Difficulty
- Reading Time
- Updated Date
- Author

---

# 16. Learning Content

Mendukung:

- Markdown
- HTML Sanitized
- Math Formula (KaTeX)
- Image
- SVG
- Video
- PDF Viewer
- Interactive Component

---

# 17. AI Summary

AI menghasilkan:

- Ringkasan materi
- Poin penting
- Rumus utama
- Kesalahan umum
- Tips mengerjakan soal

---

# 18. Interactive Example

Komponen:

- Animation
- Diagram
- Image
- Formula
- Highlight
- Expandable Section

---

# 19. Quiz Section

Di akhir materi.

Jenis:

- Multiple Choice
- True False
- Matching
- Fill Blank

Quiz bersifat latihan.

---

# 20. Discussion

Siswa dapat:

- bertanya
- melihat jawaban guru
- membaca FAQ

AI dapat memberikan jawaban awal.

---

# 21. Recommendation

Setelah materi selesai.

AI merekomendasikan:

- materi berikutnya;
- latihan soal;
- CBT;
- video terkait.

---

# 22. Bookmark

Siswa dapat:

- bookmark materi;
- menghapus bookmark;
- melihat daftar bookmark.

---

# 23. Download

Download:

- PDF
- Slide
- Ringkasan

Sesuai hak akses.

---

# 24. Progress Tracking

Progress dihitung berdasarkan:

- Scroll Position
- Video Progress
- Quiz Completion
- Reading Time

---

# 25. Completion Rule

Materi dianggap selesai apabila:

- seluruh konten dibaca;
- video selesai;
- quiz selesai.

Progress tersimpan otomatis.

---

# 26. Empty State

```
Belum ada materi.

[ Refresh ]
```

---

# 27. Loading State

Menggunakan Skeleton.

- Card
- Thumbnail
- Title
- Description

---

# 28. Error State

```
Materi gagal dimuat.

[ Coba Lagi ]
```

---

# 29. Responsive Behavior

Desktop

12 Grid

Tablet

8 Grid

Mobile

Single Column

---

# 30. Accessibility

Mendukung:

- Keyboard Navigation
- Screen Reader
- Caption Video
- Alt Text Image
- WCAG 2.2 AA

---

# 31. API Requirement

```
GET /materials

GET /materials/{id}

GET /materials/recommendation

GET /materials/continue

GET /materials/bookmark

POST /materials/progress

POST /materials/bookmark

GET /materials/search

GET /materials/filter
```

---

# 32. Performance Requirement

Target:

- Initial Load < 2 detik
- Material Detail < 2 detik
- Lazy Load Image
- Lazy Load Video
- Progressive PDF Loading
- Infinite Scroll (opsional)

---

# 33. Component Dependency

Menggunakan:

- AppShell
- Sidebar
- Search Bar
- Filter Panel
- Material Card
- Video Player
- PDF Viewer
- Markdown Viewer
- Progress Bar
- Bookmark Button
- Rating
- Skeleton
- Empty State
- Toast
- Pagination

---

# 34. Data Contract

Setiap material memiliki:

- ID
- Subject
- Grade
- Chapter
- Difficulty
- Duration
- Type
- Progress
- Thumbnail
- Rating
- Bookmark Status

---

# 35. Security

Hak akses berdasarkan:

- Role
- Subscription
- Enrollment
- Workspace

Download mengikuti permission.

---

# 36. Analytics Event

Dicatat:

- Material Viewed
- Material Completed
- Bookmark Added
- Download Started
- Quiz Started
- Quiz Completed
- AI Summary Viewed
- Search Used

---

# 37. Widget Priority

Urutan:

1. Continue Learning
2. AI Recommendation
3. Search
4. Category
5. Filter
6. Recent Material
7. Material Grid

---

# 38. Future Enhancement

Dirancang mendukung:

- AI Voice Narration
- AI Translation
- AI Flashcard
- AI Mind Map
- Interactive Simulation
- Virtual Laboratory
- AR Learning
- Offline Download
- Collaborative Notes
- Learning Path
- Adaptive Learning

---

# 39. QA Checklist

□ Continue Learning berfungsi.

□ AI Recommendation tampil.

□ Search bekerja.

□ Filter bekerja.

□ Bookmark tersimpan.

□ Download sesuai permission.

□ Progress tersimpan otomatis.

□ Quiz berjalan.

□ Recommendation muncul setelah selesai.

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
Continue Learning

↓

AI Recommendation

↓

Search

↓

Category

↓

Recent Material

↓

Material Grid
```

## Card Size

Desktop

```
320 × 360 px
```

Tablet

```
280 × 340 px
```

Mobile

```
100% Width
```

## Thumbnail Ratio

```
16 : 9
```

## Maximum Line

Title

```
2 Lines
```

Description

```
3 Lines
```

## Default Sorting

- Continue Learning
- AI Recommendation
- Recently Updated
- Most Popular
- Highest Rating
````

## Rekomendasi Arsitektur

Saya menyarankan halaman **Learning Material** menggunakan konsep **Netflix + Coursera + Duolingo**, bukan sekadar daftar materi.

Artinya:

* **Bagian atas** berisi konten yang dipersonalisasi (Continue Learning, AI Recommendation, Learning Path).
* **Bagian tengah** berisi kategori dan koleksi materi yang dapat dijelajahi.
* **Bagian bawah** berisi seluruh katalog materi dengan filter dan pencarian yang kuat.

Dengan pendekatan ini, halaman tidak hanya berfungsi sebagai repositori materi, tetapi menjadi pengalaman belajar yang adaptif dan mampu mendorong siswa untuk terus melanjutkan proses belajar tanpa harus mencari materi secara manual.
