# 11_analytics.md

# YakinLulus.id Backend Specification — Analytics Module

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Specification

---

# 1. Overview

Analytics Module merupakan domain yang bertanggung jawab mengumpulkan, mengolah, menganalisis, dan menyajikan seluruh data akademik serta aktivitas pengguna pada platform YakinLulus.id.

Analytics tidak hanya menghasilkan laporan, tetapi juga menjadi sumber data utama bagi:

* Student Dashboard
* Teacher Dashboard
* School Dashboard
* AI Recommendation Engine
* Learning Progress
* Leaderboard
* Adaptive Learning
* Business Intelligence

Analytics menggunakan pendekatan **event-driven architecture**, sehingga setiap aktivitas penting pada sistem akan menghasilkan domain event yang diproses secara asynchronous untuk menghindari beban pada transaksi utama.

---

# 2. Module Responsibility

Analytics Module bertanggung jawab terhadap:

* Learning Analytics
* Exam Analytics
* Question Analytics
* Material Analytics
* User Analytics
* School Analytics
* Performance Analytics
* Progress Analytics
* Leaderboard
* KPI Dashboard
* Data Aggregation
* Report Generation

Module ini **tidak bertanggung jawab** terhadap:

* CBT Runtime
* Exam Configuration
* Question Authoring
* Authentication
* Notification

---

# 3. Architecture Position

```text
                 Domain Events
                      │
                      ▼
            ====================
            Analytics Module
            ====================
         │        │         │
         ▼        ▼         ▼
 Aggregation   Dashboard   AI Engine
         │
         ▼
     Reports & Insights
```

---

# 4. Business Objectives

Analytics dirancang untuk:

* Mengukur perkembangan belajar siswa.
* Mengukur kualitas soal.
* Mengukur efektivitas materi.
* Menampilkan dashboard akademik.
* Menyediakan data untuk AI.
* Mendukung adaptive learning.
* Menjadi sumber Business Intelligence.

---

# 5. Analytics Scope

Analytics terdiri dari:

* Student Analytics
* Teacher Analytics
* School Analytics
* Question Analytics
* Material Analytics
* Exam Analytics
* Learning Analytics
* AI Analytics
* Operational Analytics

---

# 6. Actors

* Student
* Teacher
* School Admin
* Academic Admin
* Platform Admin
* AI Service

---

# 7. RBAC

```text
analytics.read

analytics.export

analytics.dashboard

analytics.school

analytics.platform

analytics.question

analytics.material

analytics.ai
```

---

# 8. Business Rules

### BR-001

Analytics tidak mengubah business data.

---

### BR-002

Seluruh data analytics berasal dari Domain Event.

---

### BR-003

Perhitungan statistik dilakukan secara asynchronous.

---

### BR-004

Dashboard menggunakan data agregasi, bukan query langsung ke tabel transaksi.

---

### BR-005

Perhitungan ranking dilakukan berdasarkan konfigurasi sistem.

---

### BR-006

Analytics dapat di-refresh secara manual.

---

### BR-007

Data historis tidak boleh dihapus.

---

### BR-008

Semua agregasi harus bersifat idempotent.

---

# 9. Analytics Categories

## Student Analytics

* Learning Progress
* Study Duration
* Accuracy
* Completion Rate
* Daily Activity
* Weekly Activity
* Monthly Activity
* Weak Subject
* Strong Subject

---

## Exam Analytics

* Average Score
* Passing Rate
* Completion Rate
* Duration Distribution
* Retry Rate
* Question Distribution

---

## Question Analytics

* Difficulty Index
* Correct Answer Rate
* Wrong Answer Rate
* Skip Rate
* Average Response Time
* Question Popularity
* Discrimination Index (Roadmap)

---

## Material Analytics

* Total View
* Completion Rate
* Reading Time
* Video Watch Duration
* Download Count
* Bookmark Count

---

## School Analytics

* Active Students
* Active Teachers
* Total Exams
* Average Performance
* Learning Engagement

---

# 10. Data Model

Entity utama:

```text
analytics_events

student_analytics

exam_analytics

question_analytics

material_analytics

school_analytics

leaderboards

dashboard_cache

analytics_snapshots
```

---

# 11. Relationships

```text
CBT Runtime
Question Bank
Material
Authentication
School
        │
        ▼
 Domain Event
        │
        ▼
 Analytics
        │
 ┌──────┼───────────┐
 ▼      ▼           ▼
Dashboard AI Recommendation Reports
```

---

# 12. Student Analytics

Setiap siswa memiliki:

* Overall Score
* Overall Rank
* Subject Rank
* Study Time
* Total Exam
* Total Material Completed
* Daily Streak
* Learning Consistency
* AI Readiness Score

---

# 13. Question Analytics

Mengukur:

* Correct Ratio
* Wrong Ratio
* Skip Ratio
* Average Duration
* Difficulty Trend
* Review Count
* AI Quality Score (Future)

---

# 14. Leaderboard

Jenis leaderboard:

* Global
* School
* Class
* Subject
* Weekly
* Monthly
* Try Out
* UTBK Simulation

Konfigurasi leaderboard dapat diaktifkan atau dinonaktifkan melalui Setting Module.

---

# 15. Dashboard

Dashboard tersedia untuk:

Student

* Progress
* Rank
* Learning Time
* Subject Performance

Teacher

* Student Progress
* Class Performance
* Material Usage
* Exam Statistics

School

* Overall Performance
* Active User
* Academic KPI

Platform Admin

* System KPI
* User Growth
* Storage Usage
* AI Usage
* Infrastructure Metrics

---

# 16. Report

Laporan yang tersedia:

* Student Report
* School Report
* Exam Report
* Material Report
* Question Report
* Learning Progress Report
* AI Usage Report

Format:

* PDF
* Excel
* CSV

---

# 17. Functional Specification

Fitur:

* Dashboard
* KPI Monitoring
* Leaderboard
* Report Export
* Progress Tracking
* Trend Analysis
* Comparison
* Aggregation
* Snapshot
* Recommendation Data

---

# 18. DTO

## Dashboard Request

```json
{
  "dashboard": "student",
  "period": "monthly"
}
```

---

## Response

```json
{
  "overall_score": 87,
  "rank": 12,
  "study_time": 5400
}
```

---

# 19. Validation Rules

| Field         | Rule     |
| ------------- | -------- |
| Period        | Enum     |
| Dashboard     | Enum     |
| User          | Required |
| Date Range    | Optional |
| Export Format | Allowed  |

---

# 20. API Summary

```text
GET /api/v1/analytics/student

GET /api/v1/analytics/teacher

GET /api/v1/analytics/school

GET /api/v1/analytics/question

GET /api/v1/analytics/material

GET /api/v1/analytics/exam

GET /api/v1/leaderboard

GET /api/v1/reports

POST /api/v1/reports/export
```

---

# 21. Service Layer

```text
AnalyticsService

Aggregate()

Refresh()

GenerateReport()

GenerateLeaderboard()

CalculateProgress()

CalculateStatistics()

Compare()

Export()
```

---

# 22. Repository Layer

```text
AnalyticsRepository

DashboardRepository

LeaderboardRepository

ReportRepository

SnapshotRepository

EventRepository
```

---

# 23. Transaction Flow

```text
Business Event

↓

Event Queue

↓

Analytics Worker

↓

Aggregation

↓

Snapshot

↓

Dashboard Cache

↓

Response
```

---

# 24. Event Publishing

Analytics menerima event:

```text
exam.completed

question.answered

material.completed

user.login

student.registered

leaderboard.updated

exam.published

ai.generated

school.created
```

Analytics juga menghasilkan event:

```text
leaderboard.updated

student.progress.updated

analytics.snapshot.completed

report.generated
```

---

# 25. Background Job

Worker:

* Analytics Aggregation
* Leaderboard Calculation
* Daily Snapshot
* Weekly Snapshot
* Monthly Snapshot
* Report Generation
* Cache Refresh
* KPI Calculation

---

# 26. Cache Strategy

Redis menyimpan:

* Dashboard
* Leaderboard
* KPI
* Student Progress
* Report Metadata

TTL

```text
15 Minutes
```

---

# 27. Search Strategy

Filter:

* School
* Student
* Teacher
* Subject
* Exam
* Material
* Period

Sorting:

* Score
* Rank
* Growth
* Study Time

---

# 28. Storage Strategy

Operational Data:

* PostgreSQL (Supabase)

Cache:

* Redis

Future:

* Data Warehouse
* ClickHouse
* BigQuery

---

# 29. Security Rules

Implementasi keamanan:

* JWT Authentication
* RBAC Authorization
* Row Level Security
* Aggregated Data Access
* Audit Logging
* Report Access Validation

---

# 30. Audit Log

Audit mencatat:

* Report Export
* Dashboard Access
* Leaderboard Refresh
* Analytics Refresh
* Snapshot Generation

---

# 31. Error Handling

| Code                     | Description                    |
| ------------------------ | ------------------------------ |
| ANALYTICS_NOT_FOUND      | Data analytics tidak ditemukan |
| INVALID_PERIOD           | Periode tidak valid            |
| REPORT_GENERATION_FAILED | Gagal membuat laporan          |
| SNAPSHOT_NOT_READY       | Snapshot belum tersedia        |
| LEADERBOARD_NOT_FOUND    | Leaderboard tidak ditemukan    |

---

# 32. Sequence Diagram

```text
Domain Event

↓

Queue

↓

Analytics Worker

↓

Aggregation

↓

Snapshot

↓

Redis Cache

↓

Dashboard API

↓

Client
```

---

# 33. Integration

Analytics terintegrasi dengan:

* Authentication
* User Management
* School Management
* Curriculum
* Subject
* Chapter
* Question Bank
* Material
* Exam
* CBT Runtime
* AI Service
* Notification
* File Management

---

# 34. Performance Target

| Metric          | Target        |
| --------------- | ------------- |
| Dashboard Load  | < 200 ms      |
| Leaderboard     | < 300 ms      |
| Analytics Query | < 500 ms      |
| Report Export   | < 30 s        |
| Aggregation Job | < 5 min/batch |

---

# 35. Test Scenario

### Unit Test

* Progress Calculation
* Ranking
* Aggregation
* KPI Calculation
* Report Generation

### Integration Test

* Dashboard
* Leaderboard
* Analytics Aggregation
* Report Export
* Cache Refresh

### Load Test

* 100.000 analytics events/hour
* Dashboard concurrent access
* Leaderboard refresh
* Report generation

### Security Test

* Unauthorized Dashboard Access
* Invalid Export
* Cross-School Data Isolation
* Broken Access Control

---

# 36. Future Enhancement

* Predictive Analytics
* AI Learning Recommendation
* Learning Heatmap
* Real-Time Dashboard
* Behavioral Analytics
* Early Warning System
* Competency Mapping
* Data Warehouse Integration
* BI Connector (Power BI, Tableau)

---

# 37. Dependencies

Analytics bergantung pada:

* Authentication
* User Management
* Question Bank
* Material
* Exam
* CBT Runtime
* Redis
* Background Job
* Notification
* File Management

Analytics menjadi dependency bagi:

* AI Module
* Student Dashboard
* Teacher Dashboard
* School Dashboard
* Recommendation Engine
* Reporting

---

# 38. Acceptance Criteria

Module dinyatakan selesai apabila:

* Dashboard tersedia untuk seluruh role.
* Progress siswa dihitung dengan benar.
* Leaderboard dapat dihasilkan.
* Report dapat diekspor.
* Aggregation berjalan melalui background worker.
* Snapshot tersimpan.
* Redis cache digunakan untuk dashboard.
* Audit Log tersedia.
* Unit, Integration, Load, dan Security Test lulus.
* OpenAPI Specification tersedia.

---

# 39. Summary

Analytics Module merupakan pusat pengolahan data YakinLulus.id yang mengubah aktivitas pengguna menjadi insight akademik dan operasional. Dengan arsitektur berbasis event, proses agregasi asynchronous, dashboard yang dioptimalkan menggunakan Redis, serta integrasi erat dengan AI dan seluruh domain utama, modul ini menyediakan fondasi untuk pemantauan performa belajar, pengambilan keputusan berbasis data, dan pengembangan fitur adaptive learning pada skala besar.
