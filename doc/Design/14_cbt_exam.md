````markdown
# 14_cbt_exam.md

> Product : YakinLulus.id  
> Module : Computer Based Test (CBT)  
> Document Type : UI/UX Specification  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

CBT (Computer Based Test) merupakan modul ujian online resmi pada YakinLulus.id yang digunakan untuk:

- Try Out
- Ujian Sekolah
- UTS
- UAS
- CBT Harian
- Simulasi UTBK
- TKA
- Tes Seleksi Internal

CBT memiliki tingkat keamanan, stabilitas, dan reliabilitas yang lebih tinggi dibanding fitur Practice.

CBT dirancang untuk mampu menangani lebih dari **10.000 concurrent users** secara bersamaan.

---

# 2. Design Goals

CBT dirancang untuk:

- fokus penuh pada pengerjaan soal;
- meminimalkan distraksi;
- menjaga integritas ujian;
- mendukung koneksi internet tidak stabil;
- memberikan pengalaman ujian yang cepat dan nyaman.

---

# 3. User Flow

```
Dashboard

↓

Exam List

↓

Exam Detail

↓

System Check

↓

Exam Rules

↓

Start Exam

↓

Question Navigation

↓

Review Answer

↓

Submit

↓

Confirmation

↓

Finish

↓

Result (Optional)
```

---

# 4. Layout Structure

```
+--------------------------------------------------------------+

Header

---------------------------------------------------------------

Exam Information

---------------------------------------------------------------

Question Palette

---------------------------------------------------------------

Question Area

---------------------------------------------------------------

Answer Option

---------------------------------------------------------------

Navigation

---------------------------------------------------------------

Submit

+--------------------------------------------------------------+
```

---

# 5. Exam Lifecycle

```
Scheduled

↓

Ready

↓

Running

↓

Submitted

↓

Auto Submitted

↓

Finished

↓

Published Result
```

---

# 6. Header

Header menampilkan:

- Exam Name
- Timer
- Progress
- Internet Status
- Sync Status
- Fullscreen Status

Header bersifat sticky.

Height

```
72 px
```

---

# 7. System Check

Sebelum ujian dimulai sistem melakukan pemeriksaan:

- Browser Compatibility
- Screen Resolution
- Internet Connection
- Fullscreen
- Device Time
- Battery Level *(Mobile)*
- Camera *(Future)*
- Microphone *(Future)*

Jika pemeriksaan gagal, siswa tidak dapat memulai ujian.

---

# 8. Exam Rules

Menampilkan:

- Durasi
- Jumlah Soal
- Passing Grade
- Larangan
- Auto Submit
- Randomization
- Nilai

Siswa wajib menyetujui aturan.

---

# 9. Exam Information

Menampilkan:

- Nama Ujian
- Mata Pelajaran
- Jenjang
- Kelas
- Durasi
- Jumlah Soal
- Sisa Waktu

---

# 10. Question Palette

Question Palette berada di sisi kanan desktop.

Menampilkan nomor seluruh soal.

Status:

- Belum Dijawab
- Sudah Dijawab
- Ditandai
- Aktif

Klik nomor untuk berpindah soal.

---

# 11. Question Area

Menampilkan:

- Nomor Soal
- Isi Soal
- Story (jika ada)
- Gambar
- Rumus Matematika
- Diagram
- Tabel

---

# 12. Story Question

Satu bacaan digunakan oleh beberapa soal.

```
Story

↓

Question 21

Question 22

Question 23

Question 24
```

Story tetap terlihat selama siswa mengerjakan kelompok soal tersebut.

---

# 13. Answer Option

MVP

- Multiple Choice

Future

- Multiple Response
- Essay
- Matching
- Drag Drop

---

# 14. Navigation

Tombol:

- Previous
- Next
- Flag Question
- Clear Answer

Shortcut Keyboard

```
← Previous

→ Next

1-5 Select Option

F Flag

Ctrl+Enter Submit
```

---

# 15. Timer

Countdown Timer.

Ketika:

```
05:00
```

Timer berubah warna menjadi kuning.

Ketika:

```
01:00
```

Timer berubah merah.

Saat:

```
00:00
```

Auto Submit.

---

# 16. Auto Save

Jawaban otomatis disimpan:

- memilih jawaban;
- berpindah soal;
- setiap 10 detik;
- reconnect internet.

Tidak ada tombol Save.

---

# 17. Offline Recovery

Jika koneksi terputus:

- siswa tetap mengerjakan soal;
- jawaban disimpan lokal;
- sinkronisasi otomatis saat koneksi kembali.

Status koneksi ditampilkan pada header.

---

# 18. Fullscreen Mode

Selama ujian:

- Fullscreen wajib aktif.
- Keluar dari fullscreen memunculkan peringatan.
- Jumlah pelanggaran dicatat.

---

# 19. Anti Cheating

Fitur:

- Disable Copy
- Disable Paste
- Disable Right Click
- Disable Text Selection
- Fullscreen Detection
- Tab Switch Detection
- Window Blur Detection

Future:

- Webcam Monitoring
- AI Proctoring
- Face Recognition
- Voice Detection

---

# 20. Submit Confirmation

```
Anda masih memiliki

5 soal belum dijawab.

Apakah yakin ingin submit?

[ Kembali ]

[ Submit ]
```

---

# 21. Auto Submit

Submit otomatis apabila:

- waktu habis;
- koneksi kembali setelah batas waktu;
- administrator menghentikan ujian.

---

# 22. Finish Screen

Menampilkan:

- Ujian selesai
- Waktu pengerjaan
- Sinkronisasi berhasil
- Status pengiriman jawaban

Jika hasil dapat langsung ditampilkan:

CTA

```
Lihat Hasil
```

---

# 23. Result Screen

Opsional.

Bergantung konfigurasi ujian.

Menampilkan:

- Score
- Correct
- Wrong
- Blank
- Rank *(Opsional)*
- Percentile *(Opsional)*
- Time Used

---

# 24. Review

Jika diizinkan.

Menampilkan:

- Soal
- Jawaban
- Jawaban Benar
- Pembahasan

Jika tidak diizinkan:

```
Review dinonaktifkan.
```

---

# 25. Exam History

Menampilkan:

- Nama Ujian
- Nilai
- Tanggal
- Status
- Durasi

---

# 26. Empty State

```
Belum ada ujian.

[ Refresh ]
```

---

# 27. Loading State

Menggunakan Skeleton.

Question dimuat secara lazy.

---

# 28. Error State

```
Terjadi kesalahan.

Silakan coba kembali.

[ Refresh ]
```

---

# 29. Responsive Behavior

Desktop

- Sidebar Palette
- Center Question

Tablet

- Collapsible Palette

Mobile

- Bottom Question Navigator
- Full Width

---

# 30. Accessibility

Memenuhi WCAG 2.2 AA.

Mendukung:

- Keyboard Navigation
- Screen Reader
- Focus Indicator
- High Contrast

---

# 31. API Requirement

```
GET /exam

GET /exam/{id}

POST /exam/start

GET /exam/question

POST /exam/answer

POST /exam/autosave

POST /exam/heartbeat

POST /exam/submit

GET /exam/result

GET /exam/history
```

---

# 32. Performance Requirement

Target:

- Start Exam < 2 detik
- Next Question < 300 ms
- Auto Save < 100 ms
- Heartbeat setiap 30 detik
- Sync Recovery < 5 detik
- Mendukung 10.000 concurrent users

---

# 33. Component Dependency

Menggunakan:

- AppShell
- Exam Header
- Question Viewer
- Formula Renderer
- Image Viewer
- Story Panel
- Question Palette
- Answer Card
- Countdown Timer
- Network Status
- Sync Status
- Confirmation Dialog
- Skeleton
- Toast

---

# 34. Data Contract

Setiap sesi ujian memiliki:

- Exam Session ID
- User ID
- Exam ID
- Question ID
- Answer
- Remaining Time
- Progress
- Sync Status
- Submit Status
- Device Information

---

# 35. Security

Hak akses:

- Student
- Assigned Teacher *(Monitoring)*
- Administrator

Keamanan:

- JWT Authentication
- Session Validation
- Device Validation
- Request Signature
- Auto Logout setelah ujian selesai

Semua aktivitas dicatat dalam Audit Log.

---

# 36. Analytics Event

Dicatat:

- Exam Started
- Question Viewed
- Question Answered
- Question Flagged
- Auto Save
- Network Lost
- Network Restored
- Fullscreen Exit
- Tab Switch
- Submit
- Auto Submit
- Result Viewed

---

# 37. Widget Priority

Urutan prioritas:

1. Timer
2. Question Area
3. Answer Option
4. Question Palette
5. Navigation
6. Network Status
7. Sync Status

---

# 38. Future Enhancement

Dirancang mendukung:

- AI Proctoring
- Face Recognition
- Webcam Recording
- Live Monitoring
- Lockdown Browser
- Multi Device Detection
- Eye Tracking
- Voice Detection
- AI Fraud Detection
- Offline Native Exam Client
- Real-Time Supervisor Dashboard

---

# 39. QA Checklist

□ System Check berjalan.

□ Timer akurat.

□ Auto Save berjalan.

□ Heartbeat terkirim.

□ Offline Recovery berhasil.

□ Sync otomatis berjalan.

□ Question Palette benar.

□ Flag Question bekerja.

□ Submit Confirmation muncul.

□ Auto Submit berjalan.

□ Fullscreen wajib aktif.

□ Tab Switch tercatat.

□ Result mengikuti konfigurasi.

□ Review mengikuti konfigurasi.

□ Responsive.

□ WCAG AA.

□ Analytics Event tercatat.

□ Audit Log lengkap.

□ API sesuai kontrak.

---

# 40. Design Notes

## Exam Screen Layout

```
+------------------------------------------------------+

Header (Sticky)

-------------------------------------------------------

Question

-------------------------------------------------------

Answer

-------------------------------------------------------

Navigation

-------------------------------------------------------

Question Palette

+------------------------------------------------------+
```

## Maximum Question Width

```
960 px
```

Area soal dipusatkan agar mudah dibaca.

## Question Palette

Desktop

```
Right Sidebar
```

Tablet

```
Collapsible Drawer
```

Mobile

```
Bottom Drawer
```

## Color Status

Belum Dijawab

Gray

Sudah Dijawab

Blue

Ditandai

Gold

Soal Aktif

Green

## Default Exam Configuration

- Random Question ✔
- Random Answer ✔
- Auto Save ✔
- Heartbeat ✔
- Offline Recovery ✔
- Fullscreen ✔
- Anti Cheat ✔
- Auto Submit ✔
- Timer ✔
- Audit Log ✔
- Network Monitoring ✔
````

---

## Rekomendasi Arsitektur

Untuk YakinLulus.id, saya menyarankan modul CBT menggunakan **Session-Based Exam Architecture**.

Arsitektur ini memisahkan **Exam**, **Exam Session**, dan **Student Answer** sebagai entitas yang berbeda:

* **Exam** berisi konfigurasi ujian.
* **Exam Session** menyimpan status ujian setiap siswa (waktu mulai, sisa waktu, status sinkronisasi, perangkat, pelanggaran).
* **Student Answer** menyimpan jawaban per soal secara independen.

Dengan pendekatan ini, sistem dapat menangani kasus seperti koneksi terputus, auto-save, auto-submit, pemulihan sesi, monitoring real-time, serta skalabilitas hingga puluhan ribu peserta ujian secara bersamaan tanpa mengorbankan integritas data.
