````markdown
# 17_chart_visualization.md

> Product : YakinLulus.id
> Module : Data Visualization System
> Document Type : UI/UX Specification
> Version : 1.0.0
> Status : Draft
> Owner : Product Design Team

---

# 1. Purpose

Chart Visualization merupakan standar visualisasi data pada seluruh platform YakinLulus.id.

Tujuan utama:

- menyajikan data dengan cepat dipahami;
- membantu pengambilan keputusan;
- meningkatkan pengalaman analisis;
- menjaga konsistensi visual di seluruh aplikasi.

Chart digunakan pada:

- Student Dashboard
- Teacher Dashboard
- Admin Dashboard
- Analytics
- CBT
- AI Recommendation
- Learning Progress
- Reporting

---

# 2. Design Principles

Visualisasi data harus mengikuti prinsip:

- Simple
- Minimal
- Readable
- Interactive
- Responsive
- Accessible
- Consistent
- Insight First

Chart tidak boleh hanya terlihat menarik, tetapi harus membantu pengguna mengambil keputusan.

---

# 3. Visualization Hierarchy

```
Dashboard

↓

Summary KPI

↓

Trend

↓

Comparison

↓

Detail Analysis

↓

Raw Data
```

Dashboard selalu dimulai dari KPI, kemudian grafik, lalu tabel.

---

# 4. Supported Chart Types

## KPI Card

Digunakan untuk

- Total User
- Total Student
- Total Teacher
- Total School
- Total Question
- Revenue

---

## Line Chart

Digunakan untuk

- Progress Belajar
- Aktivitas Harian
- Login User
- Penggunaan AI
- Pertumbuhan Pengguna
- Nilai dari waktu ke waktu

---

## Area Chart

Digunakan untuk

- Cumulative Learning
- AI Usage
- Revenue Growth
- Active User

---

## Bar Chart

Digunakan untuk

- Nilai Mata Pelajaran
- Soal per Bab
- CBT Result
- Jumlah Materi
- Aktivitas Guru

---

## Horizontal Bar Chart

Digunakan untuk

- Top 10 Student
- Top Subject
- Top School
- Ranking

---

## Stacked Bar

Digunakan untuk

- Jawaban Benar vs Salah
- Progress Kelas
- Perbandingan Semester

---

## Pie Chart

Digunakan hanya untuk:

- Distribusi Role
- Distribusi Gender
- Subscription

Maksimal:

```
5 Slice
```

---

## Donut Chart

Digunakan untuk

- Completion Rate
- Progress
- CBT Status
- Subscription

---

## Radar Chart

Digunakan untuk

- Kemampuan Siswa

Contoh:

- Logika
- Matematika
- Bahasa
- IPA
- IPS

---

## Heatmap

Digunakan untuk

- Aktivitas Belajar
- Kalender Belajar
- Login Harian
- AI Usage

Mirip GitHub Contribution.

---

## Gauge Chart

Digunakan untuk

- CPU
- RAM
- Storage
- AI Load
- Server Health

---

## Scatter Plot

Digunakan untuk

- Korelasi waktu belajar dengan nilai
- Korelasi latihan dengan hasil CBT

---

# 5. Chart Usage Matrix

| Data | Chart |
|---------|------------|
| Trend | Line |
| Growth | Area |
| Comparison | Bar |
| Ranking | Horizontal Bar |
| Composition | Donut |
| Correlation | Scatter |
| Performance | Radar |
| Server | Gauge |
| Calendar | Heatmap |

---

# 6. Dashboard Recommendation

## Student Dashboard

- KPI Card
- Donut Progress
- Line Learning Progress
- Bar Subject Score
- Heatmap Activity

---

## Teacher Dashboard

- KPI Card
- Line Student Progress
- Bar Class Score
- Radar Skill Analysis
- Donut Completion

---

## Admin Dashboard

- KPI Card
- Area Active User
- Line Revenue
- Gauge Server
- Pie School Distribution
- Heatmap User Activity

---

# 7. Chart Layout

Dashboard

```
KPI

↓

Primary Chart

↓

Secondary Chart

↓

Table
```

---

# 8. Chart Container

Desktop

```
Height

320 px
```

Medium

```
280 px
```

Small

```
220 px
```

---

# 9. Card Layout

```
Title

↓

Subtitle

↓

Chart

↓

Legend

↓

Footer
```

---

# 10. Color Usage

Menggunakan Design Token.

Primary

```
Blue
```

Success

```
Green
```

Warning

```
Gold
```

Danger

```
Red
```

Neutral

```
Gray
```

Tidak menggunakan lebih dari:

```
6 warna
```

dalam satu chart.

---

# 11. Legend

Legend wajib:

- jelas;
- dapat diklik;
- dapat hide/show series.

Posisi:

Desktop

```
Top Right
```

Mobile

```
Bottom
```

---

# 12. Tooltip

Tooltip wajib menampilkan:

- Nama Data
- Nilai
- Satuan
- Persentase (jika ada)

Tooltip muncul saat hover atau tap.

---

# 13. Animation

Animasi:

Fade

Scale

Grow

Durasi

```
300 ms
```

Animasi hanya terjadi saat data pertama kali dimuat atau diperbarui.

---

# 14. Empty Chart

Jika tidak ada data.

```
Tidak ada data
untuk ditampilkan.
```

Tampilkan ilustrasi sederhana.

---

# 15. Loading State

Menggunakan:

- Skeleton
- Placeholder Chart

Bukan spinner.

---

# 16. Error State

```
Data gagal dimuat.

[ Refresh ]
```

---

# 17. Filter Integration

Chart harus dapat difilter berdasarkan:

- Tanggal
- Mata Pelajaran
- Jenjang
- Kelas
- Sekolah
- Guru

Filter diperbarui tanpa reload halaman.

---

# 18. Drill Down

Semua chart utama mendukung:

```
Click

↓

Detail Page
```

Contoh:

```
Bar

Matematika

↓

Detail Nilai Matematika
```

---

# 19. Export

Mendukung:

- PNG
- SVG
- PDF
- CSV
- Excel

---

# 20. Responsive Rules

Desktop

Multi Column

Tablet

2 Column

Mobile

Single Column

Chart menggunakan lebar penuh.

---

# 21. Accessibility

Semua chart wajib:

- WCAG 2.2 AA
- Keyboard Navigation
- Screen Reader Summary
- High Contrast
- Color Blind Friendly

Data tidak boleh hanya dibedakan berdasarkan warna.

---

# 22. Performance

Target:

- Render < 300 ms
- Update < 150 ms
- Lazy Render
- Virtualization untuk dataset besar

---

# 23. Component Dependency

Menggunakan:

- Chart Card
- Legend
- Tooltip
- Filter
- Export Menu
- Skeleton
- Empty State
- Error State

---

# 24. Recommended Library

Frontend

```
Recharts
```

Dashboard

```
Recharts + React
```

Heatmap

```
Nivo Heatmap
```

Gauge

```
Recharts RadialBar
```

Future

```
Apache ECharts
```

untuk dashboard enterprise yang lebih kompleks.

---

# 25. Naming Convention

```
Chart

↓

Type

↓

Variant
```

Contoh

```
ProgressLineChart

ScoreBarChart

ServerGaugeChart

LearningHeatmap
```

---

# 26. Analytics Event

Dicatat:

- Chart Viewed
- Filter Changed
- Drill Down
- Export
- Legend Toggle

---

# 27. Figma Component

```
Chart/

├── KPI
├── Line
├── Area
├── Bar
├── Donut
├── Pie
├── Radar
├── Heatmap
├── Gauge
├── Scatter
```

---

# 28. QA Checklist

□ Semua chart responsif.

□ Menggunakan Design Token.

□ Tooltip tampil benar.

□ Legend dapat digunakan.

□ Loading tersedia.

□ Empty State tersedia.

□ Error State tersedia.

□ Export berjalan.

□ Drill Down bekerja.

□ Filter bekerja.

□ Color Blind Friendly.

□ WCAG AA.

□ Tidak ada hardcoded color.

□ Performa memenuhi target.

---

# 29. Recommended Visualization per Module

## Student

- Progress Donut
- Learning Line
- Subject Score Bar
- Study Heatmap

---

## Teacher

- Class Progress Line
- Student Ranking
- Completion Donut
- Skill Radar

---

## Admin

- KPI
- Active User Area
- Revenue Line
- Server Gauge
- School Distribution Donut
- Activity Heatmap

---

## AI Analytics

- Token Usage
- Request Trend
- AI Response Time
- Model Usage
- Recommendation Success

---

## CBT Analytics

- Average Score
- Passing Rate
- Wrong Answer Analysis
- Difficulty Distribution
- Time Distribution

---

# 30. Best Practices

Gunakan:

✔ KPI sebelum Chart

✔ Maksimal 2–3 chart utama per layar

✔ Maksimal 6 warna per chart

✔ Tooltip informatif

✔ Drill Down untuk detail

✔ Filter tanpa reload

✔ Responsif di semua perangkat

✔ Konsisten dengan Design Token

Hindari:

✖ 3D Chart

✖ Pie Chart dengan terlalu banyak kategori

✖ Animasi berlebihan

✖ Warna acak

✖ Label yang terpotong

✖ Menampilkan terlalu banyak metrik dalam satu grafik
````

### Rekomendasi

Untuk YakinLulus.id, gunakan **Recharts** sebagai standar utama karena terintegrasi baik dengan React, ringan, dan mudah dikustomisasi menggunakan Design Token. Terapkan aturan **"KPI → Chart → Table"** di seluruh dashboard agar pengguna memperoleh ringkasan, tren, dan detail secara berurutan. Hindari penggunaan berbagai library chart sekaligus kecuali ada kebutuhan khusus (misalnya heatmap kompleks atau visualisasi enterprise), sehingga tampilan tetap konsisten dan beban pemeliharaan tetap rendah.
