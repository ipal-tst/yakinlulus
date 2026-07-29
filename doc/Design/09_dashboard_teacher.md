````markdown
# 09_dashboard_teacher.md

> Product : YakinLulus.id  
> Module : Teacher Dashboard  
> Document Type : UI/UX Specification  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

Teacher Dashboard merupakan halaman utama bagi guru setelah login.

Dashboard berfungsi sebagai **Teaching Command Center**, yaitu pusat kendali seluruh aktivitas mengajar, mulai dari pembuatan materi, pengelolaan bank soal, CBT, analisis hasil belajar siswa, hingga rekomendasi pembelajaran berbasis AI.

Dashboard harus mampu menjawab tiga pertanyaan utama dalam waktu kurang dari 5 detik:

1. Apa yang harus saya kerjakan hari ini?
2. Bagaimana perkembangan siswa saya?
3. Tindakan apa yang paling penting saat ini?

---

# 2. Design Goals

Dashboard dirancang untuk:

- menghemat waktu guru;
- mengurangi pekerjaan administratif;
- mempermudah monitoring kelas;
- mempercepat pembuatan materi dan ujian;
- memberikan insight berbasis data.

---

# 3. User Persona

Target pengguna:

- Guru SD
- Guru SMP
- Guru SMA/SMK
- Tutor Bimbel
- Pengajar Privat

---

# 4. Layout Structure

```
+---------------------------------------------------------------+
| Header                                                        |
+---------------------------------------------------------------+
| Sidebar | Greeting | Today's Schedule | Notification | Profile|
|         +-----------------------------------------------+     |
|         | Quick Action                                 |      |
|         +----------------------+------------------------+      |
|         | My Classes           | Upcoming CBT           |      |
|         +----------------------+------------------------+      |
|         | Student Progress     | AI Teaching Insight    |      |
|         +----------------------+------------------------+      |
|         | Question Bank        | Material Library       |      |
|         +----------------------+------------------------+      |
|         | Recent Activity                              |      |
+---------------------------------------------------------------+
```

Desktop menggunakan sidebar permanen.

---

# 5. Sidebar Navigation

- Dashboard
- My Classes
- Learning Materials
- Question Bank
- Practice Questions
- CBT Management
- Students
- Analytics
- AI Assistant
- Calendar
- Notifications
- Profile
- Settings

---

# 6. Header

Komponen:

- Logo
- Search
- Notification
- Calendar Shortcut
- Dark Mode Toggle
- User Avatar

Sticky Header.

Height:

72 px

---

# 7. Greeting Widget

Menampilkan:

- Nama Guru
- Hari dan tanggal
- Jumlah kelas aktif
- Jumlah siswa aktif

Contoh:

```
Selamat Pagi Pak Budi

Hari ini Anda memiliki
3 kelas dan 2 CBT terjadwal.
```

---

# 8. Today's Schedule Widget

Menampilkan:

- Jadwal mengajar
- Mata pelajaran
- Kelas
- Jam
- Status

CTA

```
Masuk Kelas
```

---

# 9. Quick Action Widget

Shortcut menuju aktivitas yang paling sering dilakukan.

Komponen:

- Buat Materi
- Tambah Soal
- Buat CBT
- Nilai Jawaban
- Import Excel
- Upload File

---

# 10. My Classes Widget

Menampilkan:

- Total kelas
- Jumlah siswa
- Progress pembelajaran
- Kehadiran

CTA

```
Kelola Kelas
```

---

# 11. Upcoming CBT Widget

Informasi:

- Nama CBT
- Mata pelajaran
- Kelas
- Jumlah peserta
- Jadwal
- Status

Status:

- Draft
- Scheduled
- Running
- Finished

---

# 12. Student Progress Widget

Visualisasi:

- Progress belajar
- Rata-rata nilai
- Penyelesaian materi
- Kehadiran
- Aktivitas belajar

Menggunakan:

- Line Chart
- Progress Bar
- KPI Card

---

# 13. AI Teaching Insight Widget

AI memberikan rekomendasi berdasarkan data kelas.

Contoh:

```
72% siswa mengalami kesulitan
pada materi Persamaan Kuadrat.

Disarankan memberikan
latihan tambahan tingkat dasar.
```

CTA

```
Lihat Rekomendasi
```

---

# 14. Question Bank Widget

Ringkasan:

- Total soal
- Soal baru
- Draft
- Published

Quick Action:

- Tambah Soal
- Import Excel
- Generate AI

---

# 15. Material Library Widget

Ringkasan:

- Total materi
- Draft
- Published
- Video
- PDF
- Slide

CTA

```
Kelola Materi
```

---

# 16. Recent Activity

Timeline aktivitas guru.

Contoh:

- Menambahkan soal
- Publish materi
- Membuat CBT
- Menilai ujian
- Login
- Import Excel

---

# 17. Notification Panel

Kategori:

- CBT
- Tugas
- Sistem
- AI
- Pengumuman

---

# 18. Search

Global Search mampu mencari:

- Materi
- Soal
- Siswa
- Kelas
- CBT
- AI Chat

Shortcut

```
Ctrl + K
```

---

# 19. Empty State

Contoh:

```
Belum ada kelas.

[ Tambah Kelas ]
```

---

# 20. Loading State

Menggunakan Skeleton.

Tidak menggunakan spinner penuh.

---

# 21. Error State

```
Data gagal dimuat.

[ Coba Lagi ]
```

---

# 22. Responsive Behavior

Desktop

- Sidebar permanen
- 12 Grid

Tablet

- Sidebar collapse
- 8 Grid

Mobile

- Bottom Navigation
- Semua widget satu kolom

---

# 23. Accessibility

Dashboard memenuhi WCAG 2.2 AA.

Mendukung:

- Keyboard Navigation
- Screen Reader
- Visible Focus
- High Contrast

---

# 24. API Requirement

Dashboard memerlukan endpoint:

```
GET /teacher/dashboard

GET /teacher/classes

GET /teacher/schedule

GET /teacher/materials

GET /teacher/question-bank

GET /teacher/cbt

GET /teacher/student-progress

GET /teacher/analytics

GET /teacher/notifications

GET /teacher/ai-insight
```

Disarankan menggunakan endpoint agregasi untuk mempercepat initial load.

---

# 25. Performance Requirement

Target:

- Dashboard Ready < 3 detik
- FCP < 2 detik
- Lazy Load widget sekunder
- Skeleton Loading
- Maksimal 3 request paralel saat initial load

---

# 26. Component Dependency

Menggunakan komponen:

- AppShell
- Sidebar
- Header
- Dashboard Card
- Statistic Card
- KPI Card
- Progress Bar
- Line Chart
- Bar Chart
- Calendar Widget
- Notification Menu
- Button
- Avatar
- Badge
- Search Box
- Empty State
- Skeleton
- Toast

---

# 27. Data Contract

Setiap widget independen.

Setiap widget wajib memiliki:

- Loading
- Success
- Empty
- Error

Kerusakan satu widget tidak boleh memengaruhi widget lain.

---

# 28. Security

Dashboard hanya dapat diakses oleh role:

- Teacher

Semua data difilter berdasarkan:

- Teacher ID
- School ID
- Assigned Classes
- Subject Assignment
- Workspace

---

# 29. Analytics Event

Event yang dicatat:

- Teacher Dashboard Viewed
- Create Material Clicked
- Add Question Clicked
- Create CBT Clicked
- AI Recommendation Viewed
- Student Progress Viewed
- Search Used
- Notification Opened

---

# 30. Widget Priority

Urutan prioritas widget:

1. Today's Schedule
2. Quick Action
3. My Classes
4. Student Progress
5. AI Teaching Insight
6. Upcoming CBT
7. Question Bank
8. Material Library
9. Recent Activity

Widget dengan prioritas tinggi harus tampil pada area atas dashboard.

---

# 31. Future Enhancement

Dashboard dirancang agar mendukung:

- Live Class
- AI Lesson Planner
- AI Question Generator
- AI Essay Evaluation
- Student Risk Detection
- Smart Attendance
- Parent Communication
- Learning Heatmap
- Classroom Collaboration
- Gamification Dashboard
- Video Conference Integration

Tanpa mengubah struktur dashboard utama.

---

# 32. QA Checklist

- □ Layout sesuai spesifikasi.
- □ Sidebar berfungsi.
- □ Header sticky.
- □ Search berfungsi.
- □ Quick Action mengarah ke halaman yang benar.
- □ Semua widget memiliki loading state.
- □ Semua widget memiliki empty state.
- □ Semua widget memiliki error state.
- □ Dashboard responsif.
- □ Kontras memenuhi WCAG AA.
- □ Keyboard navigation berfungsi.
- □ Endpoint sesuai kontrak API.
- □ Analytics event tercatat.
- □ Widget independen dan tidak saling memengaruhi.
````

## Rekomendasi

Dashboard guru sebaiknya **berorientasi pada produktivitas**, bukan statistik. Berbeda dengan dashboard siswa yang fokus pada motivasi belajar, dashboard guru harus meminimalkan jumlah klik untuk aktivitas yang paling sering dilakukan, seperti membuat materi, mengelola bank soal, dan menyusun CBT. Oleh karena itu, area **Quick Action**, **Today's Schedule**, dan **AI Teaching Insight** sebaiknya ditempatkan pada bagian paling atas karena memberikan dampak terbesar terhadap efisiensi kerja guru.
