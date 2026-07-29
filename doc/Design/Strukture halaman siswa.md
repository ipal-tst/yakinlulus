Untuk **YakinLulus.id**, halaman siswa tidak hanya berisi belajar dan ujian. Jika targetnya adalah menjadi **Super App EdTech**, maka halaman siswa harus mendukung seluruh siklus belajar (**Learn → Practice → Evaluate → Improve → Graduate**).

Saya menyarankan struktur berdasarkan **Student Learning Journey**, bukan berdasarkan database.

---

# Struktur Halaman Siswa YakinLulus.id

```text
Beranda
├── Dashboard
├── Continue Learning
├── Jadwal Hari Ini
├── Progress Belajar
├── Statistik
├── Target Belajar
├── Rekomendasi AI
├── Pengumuman
├── Event
├── Challenge Hari Ini

Belajar
├── Semua Mata Pelajaran
├── Berdasarkan Jenjang
├── Berdasarkan Kelas
├── Berdasarkan Kurikulum
├── Berdasarkan Bab
├── Berdasarkan Kompetensi
├── Materi Favorit
├── Materi Terakhir
├── Download
├── Bookmark
├── Riwayat Belajar

Materi
├── Detail Materi
├── Ringkasan
├── Video
├── PDF
├── Audio
├── Gambar
├── Animasi
├── Contoh Soal
├── Quiz Materi
├── Catatan
├── Highlight
├── Bookmark
├── Diskusi
├── AI Tutor
├── Lampiran

Latihan
├── Semua Latihan
├── Latihan Per Bab
├── Latihan Per Mata Pelajaran
├── Latihan Adaptif
├── Daily Practice
├── Weekly Practice
├── Challenge
├── Try Out Mini
├── Bookmark Soal
├── Riwayat Latihan

Kerjakan Latihan
├── Soal
├── Navigator
├── Timer
├── Bookmark
├── Coret-Coret
├── Kalkulator
├── Rumus Cepat
├── Catatan
├── Flag Soal

Hasil Latihan
├── Nilai
├── Pembahasan
├── Jawaban Saya
├── Jawaban Benar
├── Statistik
├── Grafik
├── Analisis AI
├── Rekomendasi Materi

CBT
├── Daftar Ujian
├── Jadwal
├── Ujian Hari Ini
├── Token
├── Riwayat
├── Hasil
├── Sertifikat

Mengerjakan CBT
├── Halaman Ujian
├── Nomor Soal
├── Timer
├── Flag
├── Coretan
├── Kalkulator
├── Rumus
├── Auto Save
├── Resume

Hasil CBT
├── Nilai
├── Ranking
├── Passing Grade
├── Pembahasan
├── Statistik
├── Analisis AI

Try Out
├── Try Out Nasional
├── Try Out Sekolah
├── Try Out Premium
├── Jadwal
├── Riwayat
├── Ranking Nasional
├── Analisis

Question Bank
├── Cari Soal
├── Filter
├── Favorit
├── Riwayat
├── Pembahasan

AI Tutor
├── Chat AI
├── Tanya Soal
├── Jelaskan Materi
├── Ringkas Materi
├── Buat Latihan
├── Analisis Nilai
├── Rekomendasi Belajar
├── Riwayat Chat

Target Belajar
├── Target Harian
├── Target Mingguan
├── Target Bulanan
├── Target Semester
├── Progress
├── Reminder

Roadmap Belajar
├── Hari Ini
├── Minggu Ini
├── Bulan Ini
├── Materi Berikutnya
├── AI Recommendation

Progress
├── Dashboard
├── Progress Mapel
├── Progress Bab
├── Progress Kompetensi
├── Waktu Belajar
├── Target
├── Konsistensi
├── Heatmap

Analisis
├── Analisis Nilai
├── Analisis Kelemahan
├── Analisis Kekuatan
├── Kesalahan Terbanyak
├── Tingkat Kesulitan
├── Rekomendasi

Leaderboard
├── Sekolah
├── Kota
├── Nasional
├── Teman
├── Mingguan
├── Bulanan

Achievement
├── Badge
├── XP
├── Level
├── Misi
├── Reward

Sertifikat
├── Semua Sertifikat
├── Download
├── Share

Kalender
├── Jadwal Belajar
├── Jadwal Ujian
├── Deadline
├── Event

Notifikasi
├── Semua
├── Akademik
├── Ujian
├── Reward
├── Sistem

Download
├── Materi
├── Video Offline
├── PDF
├── Audio

Profil
├── Biodata
├── Foto
├── Sekolah
├── Target
├── Prestasi
├── Pengaturan

Pengaturan
├── Tema
├── Bahasa
├── Notifikasi
├── Privasi
├── Device
├── Keamanan

Bantuan
├── FAQ
├── Tutorial
├── Hubungi Admin
├── Laporkan Masalah
```

---

# Detail Dashboard Siswa

Halaman pertama yang dibuka siswa.

```text
Header
├── Foto Profil
├── Nama
├── Level
├── XP
├── Streak Belajar
├── Notifikasi

Quick Action
├── Belajar
├── Latihan
├── CBT
├── AI Tutor

Widget
├── Continue Learning
├── Jadwal Hari Ini
├── Challenge Hari Ini
├── Target Hari Ini
├── Progress Mingguan
├── Materi Baru
├── Ujian Terdekat
├── Nilai Terakhir
├── Rekomendasi AI

Chart
├── Waktu Belajar
├── Progress Bab
├── Nilai
├── Konsistensi
```

---

# Halaman Detail Materi

```text
Materi
│
├── Informasi
├── Ringkasan
├── Video
├── PDF
├── Audio
├── Animasi
├── Contoh
├── Simulasi
├── Quiz
├── Catatan
├── Highlight
├── Bookmark
├── AI Tutor
├── Diskusi
├── Lampiran
└── Rekomendasi Materi Selanjutnya
```

---

# Halaman Mengerjakan Soal

```text
Header
├── Nama Paket
├── Progress
├── Timer

Sidebar
├── Nomor Soal
├── Flag
├── Bookmark

Konten
├── Soal
├── Gambar
├── Rumus
├── Video
├── Audio

Tools
├── Coretan
├── Highlight
├── Kalkulator
├── Konversi
├── Catatan

Footer
├── Sebelumnya
├── Berikutnya
├── Simpan
├── Selesai
```

---

# Halaman Hasil Latihan

```text
Score

Passing Grade

Ranking

Grafik Nilai

Statistik Jawaban

Pembahasan

AI Feedback

Kesalahan Terbanyak

Materi Yang Harus Dipelajari

Rekomendasi Latihan Berikutnya
```

---

# Halaman Progress Belajar

```text
Ringkasan

Progress Semua Mata Pelajaran

Progress Semua Bab

Progress Kompetensi

Progress Semester

Jam Belajar

Target

Heatmap Aktivitas

Streak

Grafik Perkembangan

Perbandingan Mingguan

AI Insight
```

---

# Halaman AI Tutor

```text
Chat

Voice Chat

Upload Gambar Soal

Upload PDF

Scan Kamera

Riwayat

Bookmark

Prompt Favorit

Penjelasan Langkah Demi Langkah

Latihan Otomatis

Ringkasan Materi

Quiz Otomatis
```

---

# Halaman Profil

```text
Profil

Prestasi

XP

Badge

Target

Riwayat Belajar

Riwayat Nilai

Riwayat Ujian

Download Sertifikat

Pengaturan
```

---

# Alur Navigasi Utama Siswa

Agar sederhana di perangkat mobile maupun web, navigasi utama sebaiknya hanya terdiri dari 6 menu inti:

```text
Beranda
│
├── Dashboard
│
Belajar
│
├── Materi
├── AI Tutor
├── Bookmark
│
Latihan
│
├── Practice
├── Try Out
├── Bank Soal
│
Ujian
│
├── CBT
├── Hasil
│
Progress
│
├── Analitik
├── Target
├── Achievement
│
Profil
    ├── Akun
    ├── Pengaturan
    ├── Bantuan
```

