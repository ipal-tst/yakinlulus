````markdown
# 13_practice.md

> Product : YakinLulus.id  
> Module : Practice (Latihan Soal)  
> Document Type : UI/UX Specification  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

Practice merupakan fitur latihan soal yang memungkinkan siswa mengerjakan soal kapan saja tanpa terikat jadwal seperti CBT.

Fitur ini dirancang untuk:

- meningkatkan pemahaman materi;
- membangun kebiasaan belajar;
- mengidentifikasi kelemahan siswa;
- memberikan rekomendasi belajar berbasis AI.

Practice adalah **Adaptive Learning Engine**, bukan sekadar kumpulan soal.

---

# 2. Design Goals

Practice dirancang agar:

- cepat memulai latihan (<10 detik)
- fokus pada soal
- minim distraksi
- memberikan feedback instan
- memotivasi siswa untuk terus berlatih

---

# 3. User Flow

```
Dashboard

↓

Practice

↓

Choose Subject

↓

Choose Chapter

↓

Choose Difficulty

↓

Generate Practice

↓

Answer Question

↓

Submit

↓

Result

↓

AI Recommendation

↓

Continue Practice
```

---

# 4. Layout Structure

```
+----------------------------------------------------------+

Header

----------------------------------------------------------

Continue Practice

----------------------------------------------------------

Quick Practice

----------------------------------------------------------

Recommended Practice

----------------------------------------------------------

Practice Category

----------------------------------------------------------

Practice History

----------------------------------------------------------

Leaderboard

----------------------------------------------------------

Footer

+----------------------------------------------------------+
```

---

# 5. Sidebar Navigation

- Dashboard
- Learning Material
- Practice
- CBT Exam
- AI Tutor
- Analytics
- Achievement

---

# 6. Header

Komponen:

- Search
- Notification
- User Menu
- Theme Toggle

Sticky

72 px

---

# 7. Continue Practice

Menampilkan latihan terakhir.

Informasi:

- Subject
- Chapter
- Progress
- Remaining Question

CTA

```
Continue
```

---

# 8. Quick Practice

Memulai latihan hanya dengan satu klik.

Pilihan:

- 10 Soal
- 20 Soal
- 30 Soal
- 50 Soal

AI akan memilih soal secara otomatis.

---

# 9. Recommended Practice

AI merekomendasikan latihan berdasarkan:

- hasil latihan sebelumnya;
- materi yang baru selesai;
- kelemahan siswa;
- target ujian.

---

# 10. Practice Category

Kategori:

- Mata Pelajaran
- Bab
- Topik
- Tingkat Kesulitan
- UTBK
- HOTS
- Try Out

Desktop menggunakan Grid.

Mobile menggunakan Horizontal Scroll.

---

# 11. Filter

Filter berdasarkan:

- Subject
- Grade
- Chapter
- Difficulty
- Question Count
- Estimated Time
- Source

---

# 12. Search

Mencari latihan berdasarkan:

- Subject
- Chapter
- Keyword

Shortcut

```
Ctrl + K
```

---

# 13. Practice Configuration

Sebelum latihan dimulai siswa dapat menentukan:

- Mata Pelajaran
- Bab
- Tingkat Kesulitan
- Jumlah Soal
- Acak Soal
- Acak Pilihan Jawaban
- Timer (Opsional)

---

# 14. Practice Screen Layout

```
+------------------------------------------------------+

Header

------------------------------------------------------

Question Progress

------------------------------------------------------

Question Area

------------------------------------------------------

Image / Formula

------------------------------------------------------

Answer Options

------------------------------------------------------

Navigation

------------------------------------------------------

Submit

+------------------------------------------------------+
```

---

# 15. Question Area

Menampilkan:

- Nomor soal
- Isi soal
- Gambar
- Rumus
- Diagram
- Audio *(Future)*

---

# 16. Answer Options

Support:

- Multiple Choice

Future:

- Multiple Response
- Essay
- Matching

---

# 17. Question Navigation

Navigasi:

- Previous
- Next
- Jump Number
- Flag Question

Progress ditampilkan di bagian atas.

---

# 18. Timer

Mode:

Tanpa Timer

atau

Countdown Timer

Timer dapat diaktifkan guru atau siswa.

---

# 19. Auto Save

Jawaban disimpan otomatis ketika:

- memilih jawaban;
- berpindah soal;
- refresh halaman;
- reconnect internet.

---

# 20. Submit Confirmation

```
Apakah Anda yakin
ingin menyelesaikan latihan?

[ Kembali ]

[ Submit ]
```

---

# 21. Result Screen

Menampilkan:

- Score
- Correct Answer
- Wrong Answer
- Accuracy
- Time Used
- Rank (Opsional)
- XP
- Achievement

---

# 22. Question Review

Setelah submit siswa dapat melihat:

- Soal
- Jawaban sendiri
- Jawaban benar
- Pembahasan
- Video Pembahasan
- Tingkat Kesulitan

---

# 23. AI Recommendation

Setelah latihan selesai AI memberikan:

- kelemahan utama;
- materi yang perlu dipelajari;
- latihan berikutnya;
- prediksi kesiapan ujian.

---

# 24. Practice History

Menampilkan:

- Tanggal
- Subject
- Score
- Accuracy
- Time
- Difficulty

---

# 25. Leaderboard

Menampilkan:

- Ranking
- XP
- Streak
- Weekly Rank

---

# 26. Gamification

Reward:

- XP
- Coin *(Future)*
- Badge
- Achievement
- Daily Streak

---

# 27. Empty State

```
Belum ada latihan.

[ Mulai Latihan ]
```

---

# 28. Loading State

Menggunakan Skeleton.

Question dimuat secara bertahap.

---

# 29. Error State

```
Latihan gagal dimuat.

[ Coba Lagi ]
```

---

# 30. Responsive Behavior

Desktop

- Sidebar
- Question Centered

Tablet

- Compact Layout

Mobile

- Full Width
- Sticky Bottom Navigation

---

# 31. Accessibility

Mendukung:

- Keyboard Navigation
- Screen Reader
- High Contrast
- Focus Indicator
- WCAG 2.2 AA

---

# 32. API Requirement

```
GET /practice

POST /practice/start

GET /practice/question

POST /practice/answer

POST /practice/autosave

POST /practice/submit

GET /practice/result

GET /practice/history

GET /practice/recommendation
```

---

# 33. Performance Requirement

Target:

- Start Practice < 2 detik
- Next Question < 300 ms
- Auto Save < 100 ms
- Result < 2 detik

---

# 34. Component Dependency

Menggunakan:

- AppShell
- Question Viewer
- Formula Renderer
- Image Viewer
- Answer Card
- Question Navigator
- Progress Bar
- Timer
- Skeleton
- Result Card
- Recommendation Card
- Toast

---

# 35. Data Contract

Setiap latihan memiliki:

- Practice ID
- Subject
- Grade
- Chapter
- Difficulty
- Question Count
- Timer
- Score
- Accuracy
- Duration

---

# 36. Security

Data latihan hanya dapat diakses oleh:

- Student
- Assigned Teacher
- Administrator

Jawaban siswa tidak boleh dapat dimanipulasi dari frontend.

---

# 37. Analytics Event

Dicatat:

- Practice Started
- Practice Paused
- Practice Continued
- Question Answered
- Question Flagged
- Practice Submitted
- Result Viewed
- Review Viewed
- AI Recommendation Viewed

---

# 38. Widget Priority

Urutan:

1. Continue Practice
2. Quick Practice
3. Recommended Practice
4. Category
5. History
6. Leaderboard

---

# 39. Future Enhancement

Dirancang mendukung:

- Adaptive Practice
- AI Difficulty Adjustment
- Multiplayer Practice
- Challenge Friends
- Daily Mission
- Weekly Challenge
- Smart Retry
- Voice Question
- Offline Practice
- AI Tutor Review
- Learning Heatmap

---

# 40. QA Checklist

□ Continue Practice bekerja.

□ Quick Practice berjalan.

□ Search berfungsi.

□ Filter berfungsi.

□ Timer akurat.

□ Auto Save berjalan.

□ Navigasi soal benar.

□ Submit Confirmation muncul.

□ Result sesuai.

□ Review soal lengkap.

□ AI Recommendation tampil.

□ History tersimpan.

□ Leaderboard tampil.

□ Empty State tersedia.

□ Loading State tersedia.

□ Error State tersedia.

□ Responsive.

□ WCAG AA.

□ Analytics Event tercatat.

□ API sesuai kontrak.

---

# 41. Design Notes

## Layout Priority

```
Continue Practice

↓

Quick Practice

↓

Recommended Practice

↓

Category

↓

History

↓

Leaderboard
```

## Practice Screen

Lebar maksimum area soal:

```
960 px
```

Area soal dipusatkan agar fokus pengguna tetap tinggi.

## Question Navigation

```
Previous

Question Number

Next
```

Question Number dapat diklik untuk berpindah langsung.

## Progress Indicator

```
Question 12 / 40

████████░░░░

30%
```

## Default Practice Mode

- Random Question
- Random Answer Option
- Instant Feedback setelah submit
- Auto Save aktif
- AI Recommendation aktif
- Review tersedia setelah selesai
- Progress tersimpan otomatis
````

### Rekomendasi

Fitur **Practice** sebaiknya dibangun dengan filosofi **"learning first, testing second"**. Berbeda dengan CBT yang mensimulasikan ujian formal, Practice harus memberikan pengalaman belajar yang fleksibel: siswa dapat berhenti dan melanjutkan kapan saja, memperoleh pembahasan yang lengkap, serta menerima rekomendasi AI berdasarkan kesalahan yang dibuat. Pendekatan ini akan meningkatkan retensi belajar dan mendorong kebiasaan latihan secara berkelanjutan.
