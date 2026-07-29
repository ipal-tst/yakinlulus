````markdown
# 15_ai_tutor.md

> Product : YakinLulus.id  
> Module : AI Tutor  
> Document Type : UI/UX Specification  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

AI Tutor merupakan asisten belajar berbasis Artificial Intelligence yang berfungsi sebagai guru pendamping bagi setiap siswa.

AI Tutor tidak hanya menjawab pertanyaan, tetapi juga mampu:

- menjelaskan konsep;
- membuat contoh soal;
- mengevaluasi jawaban;
- memberikan rekomendasi belajar;
- membangun Learning Path yang adaptif.

AI Tutor merupakan salah satu fitur pembeda utama (core differentiator) YakinLulus.id.

---

# 2. Design Goals

AI Tutor dirancang untuk:

- memberikan pengalaman belajar personal;
- membantu siswa belajar mandiri;
- menjelaskan materi sesuai tingkat kemampuan siswa;
- meningkatkan motivasi belajar;
- memberikan jawaban yang akurat melalui RAG (Retrieval Augmented Generation).

---

# 3. AI Capability

AI Tutor mampu:

- Menjawab pertanyaan
- Menjelaskan materi
- Membuat ringkasan
- Membuat contoh soal
- Membuat latihan soal
- Membahas jawaban
- Menjelaskan rumus
- Membuat langkah penyelesaian
- Membuat mind map
- Merekomendasikan materi
- Menganalisis kelemahan siswa

---

# 4. User Flow

```
Dashboard

↓

AI Tutor

↓

Chat Session

↓

Question

↓

AI Processing

↓

Answer

↓

Follow Up

↓

Recommendation

↓

Continue Learning
```

---

# 5. Layout Structure

```
+------------------------------------------------------------+

Header

-------------------------------------------------------------

Conversation History

-------------------------------------------------------------

Chat Area

-------------------------------------------------------------

Suggested Prompt

-------------------------------------------------------------

Attachment

-------------------------------------------------------------

Input Area

-------------------------------------------------------------

Footer

+------------------------------------------------------------+
```

---

# 6. Sidebar

- Dashboard
- Learning Material
- Practice
- CBT
- AI Tutor
- Analytics
- Profile

---

# 7. Header

Komponen:

- New Chat
- Search Chat
- Conversation History
- Settings
- AI Status

Sticky

72 px

---

# 8. Welcome Screen

Ketika belum ada percakapan.

Menampilkan:

```
Halo 👋

Saya AI Tutor YakinLulus.

Apa yang ingin kamu pelajari hari ini?
```

---

# 9. Suggested Prompt

Quick Prompt.

Contoh:

- Jelaskan Persamaan Kuadrat
- Buatkan 20 soal HOTS
- Mengapa jawaban saya salah?
- Ringkas bab ini
- Jelaskan dengan bahasa sederhana
- Berikan contoh sehari-hari

---

# 10. Chat Layout

```
User Message

↓

AI Thinking

↓

AI Response

↓

Suggested Follow Up
```

---

# 11. Message Component

Setiap pesan memiliki:

- Avatar
- Sender
- Timestamp
- Content
- Copy
- Regenerate
- Like
- Dislike

---

# 12. Rich Response

AI mendukung:

- Markdown
- Formula Matematika (KaTeX)
- Table
- Image
- Diagram
- Code Block
- Bullet List
- Numbered List
- Highlight

---

# 13. Attachment

Siswa dapat mengunggah:

- Image
- PDF
- Screenshot Soal
- Word
- Excel *(Future)*

AI akan menganalisis isi file.

---

# 14. OCR Support

Jika pengguna mengunggah gambar soal.

AI mampu:

- membaca teks;
- membaca rumus;
- membaca tabel;
- membaca grafik;
- menjelaskan jawaban.

---

# 15. AI Explanation

Jawaban AI selalu terdiri dari:

1. Jawaban Singkat
2. Penjelasan
3. Langkah Penyelesaian
4. Contoh
5. Tips
6. Materi Terkait

---

# 16. Formula Support

Mendukung:

- Aljabar
- Kalkulus
- Statistika
- Trigonometri
- Kimia
- Fisika

Rendering menggunakan KaTeX.

---

# 17. Citation

Jika jawaban berasal dari Learning Material.

AI menampilkan:

- sumber materi;
- bab;
- sub bab;
- tautan menuju materi.

Hal ini dilakukan melalui RAG.

---

# 18. Suggested Follow Up

Contoh:

- Jelaskan lebih sederhana
- Berikan contoh lain
- Buatkan latihan
- Jelaskan langkah nomor 3
- Buatkan mind map

---

# 19. AI Recommendation

Setelah percakapan.

AI memberikan rekomendasi:

- materi;
- latihan;
- CBT;
- video;
- pembahasan.

---

# 20. Conversation History

Menampilkan:

- Judul Chat
- Waktu
- Mata Pelajaran
- Status Favorite

Pengguna dapat:

- Rename
- Delete
- Pin
- Archive

---

# 21. Search Conversation

Mencari berdasarkan:

- Judul
- Isi Chat
- Mata Pelajaran
- Tanggal

Shortcut

```
Ctrl + K
```

---

# 22. AI Context Memory

AI memahami konteks percakapan sebelumnya.

Contoh:

```
Bagaimana nomor 3?

↓

AI mengetahui bahwa
nomor 3 mengacu
pada soal sebelumnya.
```

---

# 23. AI Learning Profile

AI menggunakan data siswa:

- kelas;
- jenjang;
- progress belajar;
- histori latihan;
- hasil CBT;
- kelemahan;
- target belajar.

Sehingga jawaban menjadi lebih personal.

---

# 24. AI Safety

AI tidak boleh:

- memberikan jawaban yang menyesatkan;
- mengarang sumber;
- menghasilkan konten berbahaya;
- memberikan informasi di luar konteks pendidikan tanpa penjelasan.

Jika AI tidak yakin, AI harus menyatakan keterbatasannya.

---

# 25. Empty State

```
Belum ada percakapan.

Mulailah bertanya.
```

---

# 26. Loading State

Menggunakan:

- Typing Indicator
- Thinking Animation
- Skeleton Response

---

# 27. Error State

```
AI sedang tidak tersedia.

Silakan coba beberapa saat lagi.

[ Coba Lagi ]
```

---

# 28. Responsive Behavior

Desktop

- Sidebar Chat
- Chat Area

Tablet

- Drawer History

Mobile

- Full Screen Chat

Bottom Input Sticky

---

# 29. Accessibility

Mendukung:

- Keyboard Navigation
- Screen Reader
- Focus Indicator
- Voice Input *(Future)*
- WCAG 2.2 AA

---

# 30. API Requirement

```
POST /ai/chat

POST /ai/stream

GET /ai/history

GET /ai/history/{id}

DELETE /ai/history

POST /ai/upload

POST /ai/recommendation

POST /ai/regenerate

POST /ai/feedback
```

Streaming menggunakan Server-Sent Events (SSE) atau WebSocket.

---

# 31. Performance Requirement

Target:

- First Token < 2 detik
- Streaming Response aktif
- OCR < 5 detik
- PDF Analysis < 10 detik
- Conversation Search < 500 ms

---

# 32. Component Dependency

Menggunakan:

- AppShell
- Chat Bubble
- Markdown Viewer
- KaTeX Renderer
- File Upload
- Image Viewer
- PDF Preview
- Suggestion Chip
- Typing Indicator
- Conversation List
- Search Box
- Toast

---

# 33. Data Contract

Setiap percakapan memiliki:

- Conversation ID
- User ID
- Subject
- Title
- Message
- Attachment
- Timestamp
- AI Model
- Citation
- Feedback
- Token Usage

---

# 34. Security

Hak akses:

- Student
- Teacher *(mode pendamping)*
- Administrator *(monitoring terbatas)*

Keamanan:

- JWT Authentication
- Rate Limiting
- Prompt Sanitization
- File Validation
- Audit Log

Data percakapan bersifat privat.

---

# 35. Analytics Event

Dicatat:

- AI Chat Started
- Prompt Sent
- File Uploaded
- OCR Used
- Response Generated
- Citation Clicked
- Recommendation Clicked
- Feedback Submitted
- Conversation Saved

---

# 36. Widget Priority

Urutan:

1. Chat Area
2. Suggested Prompt
3. Conversation History
4. Attachment
5. Recommendation

---

# 37. AI Architecture Notes

AI Tutor menggunakan arsitektur:

```
User

↓

Gateway API

↓

AI Service

↓

Prompt Builder

↓

RAG Engine

↓

Vector Database

↓

LLM

↓

Response Formatter

↓

Streaming Response
```

AI **tidak mengambil jawaban langsung dari LLM**, tetapi melalui proses RAG agar jawaban sesuai materi resmi YakinLulus.id.

---

# 38. Future Enhancement

Dirancang mendukung:

- Voice Conversation
- AI Avatar Teacher
- AI Whiteboard
- AI Drawing Recognition
- AI Essay Checker
- AI Coding Tutor
- AI Speaking Evaluation
- AI Pronunciation Checker
- Multi Language Tutor
- Live Collaboration
- AI Study Planner
- AI Learning Coach

---

# 39. QA Checklist

□ Chat berjalan.

□ Streaming aktif.

□ OCR berhasil.

□ PDF dianalisis.

□ Formula tampil benar.

□ Citation muncul.

□ Rekomendasi muncul.

□ History tersimpan.

□ Search Chat berjalan.

□ Feedback tersimpan.

□ Empty State tersedia.

□ Loading State tersedia.

□ Error State tersedia.

□ Responsive.

□ WCAG AA.

□ Analytics Event tercatat.

□ API sesuai kontrak.

□ Data percakapan aman.

---

# 40. Design Notes

## Layout Priority

```
Conversation History

↓

Chat Area

↓

Suggested Prompt

↓

Input Area
```

## Chat Width

Maximum

```
900 px
```

Agar teks nyaman dibaca.

## Bubble Width

Maximum

```
75%
```

## Attachment Preview

- Image Thumbnail
- PDF Preview
- OCR Status
- Upload Progress

## Suggested Prompt

Minimal 6 prompt.

Maksimal 12 prompt.

Disusun berdasarkan:

- Mata pelajaran aktif
- Progress belajar
- Riwayat percakapan
- AI Recommendation

## Default AI Behavior

- Streaming Response ✔
- Citation ✔
- Markdown ✔
- KaTeX ✔
- OCR ✔
- RAG ✔
- Context Memory ✔
- Personalized Recommendation ✔
- Conversation History ✔
- Feedback Collection ✔
````

---

# Rekomendasi Arsitektur AI Tutor

Untuk YakinLulus.id, AI Tutor sebaiknya dibangun sebagai **AI Orchestrator**, bukan sekadar chatbot.

Setiap pertanyaan diproses melalui beberapa tahap:

1. **Intent Detection** – mengenali tujuan pengguna (bertanya, meminta soal, ringkasan, pembahasan, dll.).
2. **Context Builder** – menggabungkan profil siswa, riwayat belajar, dan konteks percakapan.
3. **RAG Retrieval** – mengambil materi resmi, bank soal, dan pembahasan yang relevan dari Vector Database.
4. **LLM Generation** – menghasilkan jawaban berdasarkan konteks dan dokumen yang ditemukan.
5. **Response Formatter** – menyusun jawaban menjadi format yang mudah dibaca, lengkap dengan rumus, tabel, sitasi, dan rekomendasi lanjutan.
6. **Learning Analytics** – mencatat topik yang ditanyakan untuk memperbarui profil belajar siswa dan meningkatkan personalisasi rekomendasi di masa mendatang.

Dengan arsitektur ini, AI Tutor menjadi pusat ekosistem pembelajaran yang terintegrasi dengan **Learning Material**, **Question Bank**, **Practice**, **CBT**, dan **Analytics**, bukan hanya layanan tanya jawab.
