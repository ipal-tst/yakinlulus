Saya ingin menaikkan standar dokumen ini lagi.

Menurut saya **08_dashboard_student.md** seharusnya bukan sekadar mockup atau penjelasan layout.

Dashboard siswa adalah **halaman terpenting** di YakinLulus.id. Hampir semua aktivitas belajar dimulai dari sini. Karena itu, dokumen ini harus menjadi **Product UI Specification**, bukan hanya UI Design.

Dokumen ini harus cukup detail sehingga:

* UI/UX Designer dapat membuat Figma tanpa bertanya lagi.
* Frontend Engineer dapat mengimplementasikan halaman.
* Backend Engineer tahu API apa saja yang dibutuhkan.
* QA tahu apa yang harus diuji.
* Product Manager memahami tujuan setiap widget.

---

````markdown
# 08_dashboard_student.md

> Product : YakinLulus.id
> Module : Student Dashboard
> Document Type : UI/UX Specification
> Version : 1.0.0
> Status : Draft
> Owner : Product Design Team

---

# 1. Purpose

Student Dashboard merupakan halaman utama setelah siswa berhasil login.

Dashboard berfungsi sebagai **Learning Command Center**, yaitu pusat aktivitas belajar yang menampilkan ringkasan progres, rekomendasi pembelajaran, jadwal, dan akses cepat ke seluruh fitur utama.

Dashboard harus mampu menjawab tiga pertanyaan utama dalam waktu kurang dari 5 detik:

1. Apa yang harus saya pelajari hari ini?
2. Sejauh mana progres belajar saya?
3. Apa langkah terbaik berikutnya?

---

# 2. Design Goals

Dashboard dirancang dengan tujuan:

- mengurangi cognitive load;
- meningkatkan motivasi belajar;
- mempercepat akses ke aktivitas utama;
- menampilkan informasi yang relevan;
- memberikan rekomendasi belajar yang personal.

---

# 3. Layout Structure

```
+--------------------------------------------------------------+
| Header                                                       |
+--------------------------------------------------------------+
| Sidebar | Greeting | Today's Goal | Notification | Profile   |
|         +-----------------------------------------------+    |
|         | Continue Learning                            |     |
|         +----------------------+------------------------+     |
|         | Learning Progress    | AI Recommendation      |     |
|         +----------------------+------------------------+     |
|         | Weekly Activity      | Upcoming CBT           |     |
|         +----------------------+------------------------+     |
|         | Achievement           | Leaderboard           |     |
|         +-----------------------------------------------+     |
|         | Recent Activity                             |       |
+--------------------------------------------------------------+
```

Desktop menggunakan sidebar permanen.

Tablet menggunakan sidebar collapse.

Mobile menggunakan bottom navigation.

---

# 4. Navigation Structure

## Sidebar

- Dashboard
- Learning Materials
- Practice
- CBT Exam
- AI Tutor
- Analytics
- Achievement
- Bookmark
- Notification
- Profile
- Settings

---

# 5. Header

Komponen:

- Logo
- Search Bar
- Notification
- Dark Mode Toggle
- User Avatar
- User Menu

Header bersifat sticky.

Height:

72 px.

---

# 6. Greeting Section

Menampilkan:

- Sapaan personal.
- Nama siswa.
- Motivational Quote.
- Tanggal hari ini.

Contoh:

```
Selamat Pagi, Andi 👋

Hari ini targetmu adalah menyelesaikan
2 materi dan 20 latihan soal.
```

---

# 7. Today's Goal Widget

Informasi:

- Target belajar harian.
- Progress target.
- Persentase penyelesaian.
- CTA "Mulai Belajar".

Komponen:

- Progress Ring
- Button
- Summary

---

# 8. Continue Learning Widget

Menampilkan materi terakhir yang dipelajari.

Informasi:

- Thumbnail.
- Nama materi.
- Mata pelajaran.
- Chapter.
- Progress.
- Durasi tersisa.
- Tombol "Lanjutkan".

Jika tidak ada progres:

Tampilkan rekomendasi materi pertama.

---

# 9. Learning Progress Widget

Menampilkan:

- Total progress belajar.
- Mata pelajaran.
- Persentase.
- Target mingguan.

Visual:

Progress Bar.

---

# 10. AI Recommendation Widget

Ditenagai oleh AI.

Menampilkan:

- Topik yang perlu dipelajari.
- Tingkat kesulitan.
- Alasan rekomendasi.
- CTA.

Contoh:

```
Kamu masih sering salah pada
Persamaan Kuadrat.

Pelajari materi berikut.
```

---

# 11. Weekly Activity Widget

Visualisasi:

Bar Chart 7 hari.

Menampilkan:

- Durasi belajar.
- Soal dikerjakan.
- Materi selesai.

---

# 12. Upcoming CBT Widget

Informasi:

- Nama ujian.
- Mata pelajaran.
- Tanggal.
- Countdown.
- Status.

CTA:

Lihat Detail.

---

# 13. Achievement Widget

Menampilkan:

- Badge terbaru.
- XP.
- Level.
- Streak.
- Total Achievement.

---

# 14. Leaderboard Widget

Menampilkan:

- Ranking.
- Top 10 siswa.
- Posisi pengguna.
- XP.

---

# 15. Recent Activity

Menampilkan timeline aktivitas:

- Belajar materi.
- Mengerjakan soal.
- Mengikuti CBT.
- Mendapat badge.
- Login.

---

# 16. Search

Global Search mampu mencari:

- Materi.
- Soal.
- CBT.
- Guru.
- AI Chat History.

Shortcut:

Ctrl + K.

---

# 17. Empty State

Setiap widget memiliki Empty State.

Contoh:

```
Belum ada materi yang dipelajari.

[ Mulai Belajar ]
```

---

# 18. Loading State

Menggunakan Skeleton Loader.

Tidak menggunakan spinner penuh kecuali proses panjang.

---

# 19. Error State

Jika API gagal:

```
Data tidak dapat dimuat.

[ Coba Lagi ]
```

---

# 20. Responsive Behavior

## Desktop

Sidebar permanen.

Grid 12 kolom.

---

## Tablet

Sidebar collapse.

Grid 8 kolom.

---

## Mobile

Bottom Navigation.

Semua widget menjadi satu kolom.

---

# 21. Accessibility

Seluruh widget:

- keyboard accessible;
- screen reader friendly;
- focus visible;
- memenuhi WCAG 2.2 AA.

---

# 22. API Requirement

Dashboard membutuhkan endpoint:

- GET /dashboard/summary
- GET /dashboard/progress
- GET /dashboard/recommendation
- GET /dashboard/upcoming-exams
- GET /dashboard/achievement
- GET /dashboard/activity
- GET /dashboard/leaderboard
- GET /notifications

Semua endpoint harus mendukung caching.

---

# 23. Performance Requirement

Target:

- First Contentful Paint < 2 detik.
- Dashboard Ready < 3 detik.
- Lazy Load widget sekunder.
- Skeleton Loading untuk seluruh card.
- Maksimal 3 request paralel saat initial load (gunakan endpoint agregasi bila memungkinkan).

---

# 24. Component Dependency

Dashboard menggunakan komponen dari Component Library:

- AppShell
- Sidebar
- Header
- Breadcrumb
- Card
- Widget Container
- Progress Ring
- Progress Bar
- Chart
- Avatar
- Badge
- Button
- Search Box
- Notification Menu
- Empty State
- Skeleton
- Toast

---

# 25. Data Contract

Widget harus independen.

Kegagalan satu widget tidak boleh menyebabkan widget lain gagal dimuat.

Setiap widget memiliki:

- loading;
- success;
- empty;
- error state.

---

# 26. Security

Dashboard hanya dapat diakses oleh pengguna dengan role **Student**.

Data harus difilter berdasarkan:

- User ID
- Kelas
- Jenjang
- Enrollment
- Hak akses

---

# 27. Analytics Event

Event yang dicatat:

- Dashboard Viewed
- Widget Clicked
- Continue Learning Clicked
- Recommendation Clicked
- Search Used
- Achievement Viewed
- Leaderboard Viewed

---

# 28. QA Checklist

- □ Semua widget tampil sesuai spesifikasi.
- □ Sidebar berfungsi.
- □ Header sticky.
- □ Search berfungsi.
- □ Semua CTA mengarah ke halaman yang benar.
- □ Semua widget memiliki loading state.
- □ Semua widget memiliki empty state.
- □ Semua widget memiliki error state.
- □ Dashboard responsif.
- □ Kontras memenuhi WCAG AA.
- □ Keyboard navigation berfungsi.
- □ API sesuai kontrak.
- □ Event analytics tercatat.

---

# 29. Future Enhancement

Dashboard dirancang agar mudah dikembangkan dengan modul tambahan:

- AI Study Plan
- Daily Challenge
- Smart Calendar
- Focus Mode
- Learning Heatmap
- Friend Activity
- Study Group
- Mentor Recommendation
- Personalized News
- Live Class
- Offline Progress Sync

Tanpa mengubah struktur dasar layout dan navigasi.
