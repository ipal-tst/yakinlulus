````markdown
# 10_dashboard_admin.md

> Product : YakinLulus.id
> Module : Administrator Dashboard
> Document Type : UI/UX Specification
> Version : 1.0.0
> Status : Draft
> Owner : Product Design Team

---

# 1. Purpose

Administrator Dashboard merupakan halaman utama bagi Administrator setelah login.

Dashboard berfungsi sebagai **Platform Command Center**, yaitu pusat monitoring dan pengelolaan seluruh platform YakinLulus.id.

Dashboard memberikan gambaran kondisi sistem secara real-time, mulai dari pengguna, sekolah, konten, CBT, AI, server, hingga keamanan.

Dashboard harus mampu menjawab tiga pertanyaan utama dalam waktu kurang dari 5 detik:

1. Apakah platform berjalan dengan normal?
2. Apakah ada masalah yang perlu ditangani sekarang?
3. Bagaimana kondisi bisnis dan operasional hari ini?

---

# 2. Design Goals

Dashboard dirancang untuk:

- memonitor kesehatan platform;
- mempercepat pengambilan keputusan;
- mempermudah administrasi;
- mengurangi waktu investigasi masalah;
- memberikan insight operasional secara real-time.

---

# 3. User Persona

Dashboard digunakan oleh:

- Super Admin
- Platform Administrator
- Operation Team
- Customer Success
- Support Team
- Content Manager

---

# 4. Layout Structure

```
+------------------------------------------------------------------+
| Header                                                           |
+------------------------------------------------------------------+
| Sidebar | KPI Cards                                              |
|         +--------------------------+-----------------------------+
|         | System Health            | Active Users                |
|         +--------------------------+-----------------------------+
|         | Revenue & Subscription   | School Statistics           |
|         +--------------------------+-----------------------------+
|         | CBT Monitoring           | AI Usage                    |
|         +--------------------------+-----------------------------+
|         | Server Monitoring        | Security Alert              |
|         +--------------------------+-----------------------------+
|         | Recent Activities                                      |
+------------------------------------------------------------------+
```

Desktop menggunakan sidebar permanen.

---

# 5. Sidebar Navigation

## Dashboard

## User Management

## School Management

## Teacher Management

## Student Management

## Learning Materials

## Question Bank

## CBT Management

## Analytics

## AI Management

## Subscription

## Payment

## File Management

## Notification Center

## Audit Log

## System Settings

---

# 6. Header

Komponen:

- Global Search
- Notification Center
- Quick Action
- System Status Indicator
- Theme Switch
- Administrator Profile

Header bersifat sticky.

Height:

```
72 px
```

---

# 7. Global KPI

Menampilkan KPI utama platform.

Widget:

- Total Users
- Active Users Today
- Total Schools
- Total Teachers
- Total Students
- Total CBT
- Total Materials
- Total Questions

Setiap KPI menampilkan:

- nilai saat ini;
- perubahan dibanding periode sebelumnya;
- trend.

---

# 8. System Health Widget

Monitoring kondisi sistem.

Menampilkan:

- API Status
- Database Status
- Storage Usage
- Redis Status
- Queue Status
- Background Worker
- Uptime

Visual:

Status Badge

Progress

Health Indicator

---

# 9. Active User Widget

Menampilkan:

- Online User
- Active Session
- Login Today
- Peak Concurrent User

Visualisasi:

Line Chart

---

# 10. Revenue & Subscription

Jika platform menggunakan model SaaS.

Menampilkan:

- Active Subscription
- New Subscription
- Monthly Revenue
- Trial User
- Expired Subscription

Visual:

Area Chart

---

# 11. School Statistics

Menampilkan:

- Total School
- Active School
- New School
- Verified School

Visual:

Pie Chart

---

# 12. Learning Content Statistics

Ringkasan konten.

Menampilkan:

- Total Material
- Video
- PDF
- Slide
- Question Bank
- Draft
- Published

---

# 13. CBT Monitoring

Monitoring ujian.

Menampilkan:

- Scheduled Exam
- Running Exam
- Finished Exam
- Failed Exam
- Average Completion

Visual:

Bar Chart

---

# 14. AI Usage Widget

Menampilkan:

- AI Request
- AI Response Time
- AI Recommendation Generated
- AI Tutor Session
- AI Cost Monitoring

Visual:

Area Chart

---

# 15. Server Monitoring

Menampilkan:

- CPU Usage
- RAM Usage
- Storage Usage
- Network Traffic
- Queue Length

Visual:

Gauge Chart

Progress Bar

---

# 16. Security Alert Widget

Monitoring keamanan.

Menampilkan:

- Failed Login
- Suspicious Activity
- Locked Account
- API Abuse
- Security Event

Prioritas:

Critical

Warning

Info

---

# 17. Recent Activity

Timeline aktivitas administrator.

Contoh:

- User dibuat
- School ditambahkan
- CBT dipublish
- Backup selesai
- AI Model diperbarui
- Payment berhasil

---

# 18. Notification Center

Kategori:

- System
- Security
- Payment
- AI
- User Report
- Infrastructure

---

# 19. Quick Action

Shortcut:

- Tambah User
- Tambah Sekolah
- Broadcast Notification
- Backup Database
- Generate Report
- Publish Announcement

---

# 20. Search

Global Search mampu mencari:

- User
- School
- Teacher
- Student
- CBT
- Material
- Question
- Payment
- Audit Log

Shortcut

```
Ctrl + K
```

---

# 21. Empty State

Contoh:

```
Belum ada data.

[ Refresh ]
```

---

# 22. Loading State

Menggunakan Skeleton Loading.

Widget dimuat secara independen.

---

# 23. Error State

```
Data gagal dimuat.

[ Coba Lagi ]
```

Kesalahan pada satu widget tidak memengaruhi widget lainnya.

---

# 24. Responsive Behavior

Desktop

- Sidebar permanen
- Grid 12 kolom

Tablet

- Sidebar collapse
- Grid 8 kolom

Mobile

- Dashboard ringkas
- Widget prioritas saja

---

# 25. Accessibility

Memenuhi WCAG 2.2 AA.

Mendukung:

- Keyboard Navigation
- Screen Reader
- Visible Focus
- High Contrast

---

# 26. API Requirement

Dashboard menggunakan endpoint agregasi:

```
GET /admin/dashboard

GET /admin/system-health

GET /admin/platform-summary

GET /admin/revenue

GET /admin/security

GET /admin/server

GET /admin/notifications

GET /admin/recent-activity
```

Disarankan menggunakan cache untuk data yang tidak berubah cepat.

---

# 27. Performance Requirement

Target:

- Dashboard Ready < 3 detik
- First Contentful Paint < 2 detik
- Lazy Load widget sekunder
- Skeleton Loading
- Maksimal 3 request paralel
- Auto Refresh setiap 60 detik untuk monitoring

---

# 28. Component Dependency

Dashboard menggunakan:

- AppShell
- Sidebar
- Header
- KPI Card
- Statistic Card
- Status Card
- Alert Card
- Chart
- Table
- Progress Bar
- Gauge
- Badge
- Avatar
- Search Box
- Notification Menu
- Empty State
- Skeleton
- Toast

---

# 29. Data Contract

Setiap widget bersifat independen.

State wajib:

- Loading
- Success
- Empty
- Error

Widget dapat diperbarui tanpa memengaruhi widget lain.

---

# 30. Security

Dashboard hanya dapat diakses oleh:

- Super Admin
- Platform Admin

Data harus mengikuti Role-Based Access Control (RBAC).

Seluruh aktivitas dicatat dalam Audit Log.

Widget sensitif seperti Revenue dan Security hanya ditampilkan kepada role yang memiliki izin.

---

# 31. Analytics Event

Event yang dicatat:

- Admin Dashboard Viewed
- Widget Opened
- Search Used
- Report Generated
- Backup Started
- Broadcast Sent
- User Created
- Security Alert Opened

---

# 32. Widget Priority

Urutan prioritas widget:

1. Global KPI
2. System Health
3. Security Alert
4. Active User
5. Server Monitoring
6. CBT Monitoring
7. AI Usage
8. Revenue
9. School Statistics
10. Recent Activity

Widget prioritas tinggi harus selalu berada pada area atas dashboard.

---

# 33. Monitoring Rules

Dashboard harus mendukung:

- Auto Refresh
- Manual Refresh
- Filter berdasarkan tanggal
- Filter berdasarkan sekolah
- Filter berdasarkan wilayah
- Export ke Excel/PDF
- Full Screen Chart

---

# 34. Future Enhancement

Dashboard dirancang agar mendukung:

- Multi Region Monitoring
- Multi Tenant Dashboard
- AI Predictive Analytics
- Fraud Detection
- Real-Time Log Viewer
- Queue Monitoring
- Kubernetes Monitoring
- Cost Optimization Dashboard
- SLA Dashboard
- Business Intelligence Dashboard
- Incident Management
- Feature Flag Monitoring

Tanpa mengubah struktur dashboard utama.

---

# 35. QA Checklist

- □ Semua KPI tampil benar.
- □ Sidebar berfungsi.
- □ Header sticky.
- □ Global Search berfungsi.
- □ Semua widget memiliki loading state.
- □ Semua widget memiliki empty state.
- □ Semua widget memiliki error state.
- □ Dashboard responsif.
- □ Auto refresh berjalan normal.
- □ Security widget hanya tampil sesuai hak akses.
- □ API sesuai kontrak.
- □ Event analytics tercatat.
- □ Audit log mencatat seluruh aksi administrator.
- □ Dashboard memenuhi standar WCAG 2.2 AA.
````

## Rekomendasi Arsitektur Dashboard Admin

Saya menyarankan Dashboard Admin menggunakan **widget-based monitoring architecture** dengan tingkat pembaruan data yang berbeda sesuai karakteristik widget, bukan semua widget melakukan polling bersamaan.

Contohnya:

| Widget            | Refresh                   |
| ----------------- | ------------------------- |
| System Health     | 30–60 detik               |
| Server Monitoring | 15–30 detik               |
| Active Users      | 30 detik                  |
| Security Alert    | Real-time (WebSocket/SSE) |
| Revenue           | Manual / 5–15 menit       |
| School Statistics | Manual / 15 menit         |
| Learning Content  | Manual                    |
| Recent Activity   | 30–60 detik               |

Pendekatan ini mengurangi beban server, meningkatkan performa frontend, dan memberikan pengalaman monitoring yang lebih responsif untuk tim operasional.
