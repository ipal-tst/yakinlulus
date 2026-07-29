Berikut draft **`PRD/07_business_rule.md`**.

Dokumen ini merupakan salah satu dokumen terpenting dalam PRD karena menjadi kontrak antara **Business**, **Product**, **Backend**, **Database**, **QA**, dan **DevOps**. Seluruh business rule di bawah disusun agar konsisten dengan **Domain Modeling, Entity Catalog, ERD, LDM, Constraint Strategy, Database Security, dan Database Operation** yang telah kita buat sebelumnya.

````md id="f7d4q1"
# Product Requirement Document (PRD)

# YakinLulus.id

## Document: Business Rule

| Attribute | Value |
|---|---|
| Document | Business Rule |
| Version | 1.0 |
| Status | Draft |
| Product Stage | MVP Development |
| Related Document | User Flow |
| Purpose | Define Business Rules & Operational Policies |

---

# 1. Introduction

## 1.1 Purpose

Dokumen ini mendefinisikan aturan bisnis yang mengatur perilaku sistem YakinLulus.id.

Business Rule digunakan sebagai referensi untuk:

- Backend Service
- Database Constraint
- Validation Logic
- API Behavior
- QA Test Case
- Acceptance Criteria

---

# 2. General Principles

Seluruh modul harus mengikuti prinsip berikut:

- Data harus konsisten.
- Seluruh transaksi harus dapat diaudit.
- Hak akses dikontrol menggunakan RBAC.
- Soft Delete digunakan untuk seluruh data master.
- Seluruh perubahan penting dicatat pada Audit Log.
- Seluruh data memiliki UUID sebagai Primary Key.
- Validasi dilakukan pada sisi client dan server.

---

# 3. Identity & Access Rules

## BR-001 User Identity

Setiap akun hanya boleh memiliki satu identitas unik.

Constraint:

- email harus unik
- username harus unik (jika digunakan)
- satu akun tidak boleh memiliki role ganda pada saat yang sama (MVP)

---

## BR-002 User Status

Status user:

```
ACTIVE

INACTIVE

SUSPENDED
```

Rule:

ACTIVE

- dapat login

INACTIVE

- tidak dapat login

SUSPENDED

- seluruh akses ditolak

---

## BR-003 Authentication

Login hanya berhasil apabila:

- akun aktif
- password benar
- akun tidak terkunci

---

## BR-004 Authorization

Setiap request API wajib melalui:

```
Authentication

↓

Permission Validation

↓

Business Validation

↓

Process
```

---

# 4. Education Structure Rules

## BR-005 Education Hierarchy

Hierarchy wajib mengikuti:

```
Education Level

↓

Class

↓

Subject

↓

Chapter

↓

Sub Chapter
```

Tidak diperbolehkan:

Chapter tanpa Subject.

Subject tanpa Education Level.

---

## BR-006 Subject Mapping

Satu Subject dapat digunakan oleh beberapa Class.

Contoh:

```
Matematika

↓

Kelas 10

↓

Kelas 11

↓

Kelas 12
```

Implementasi menggunakan mapping table.

---

# 5. Question Bank Rules

## BR-007 Mandatory Question Metadata

Soal tidak boleh dipublikasikan apabila metadata belum lengkap.

Minimal:

- Education Level
- Class
- Subject
- Chapter
- Difficulty
- Source
- Correct Answer

---

## BR-008 Question Status

Status soal:

```
DRAFT

REVIEW

APPROVED

PUBLISHED

ARCHIVED
```

---

## BR-009 Published Question

Hanya soal dengan status:

```
PUBLISHED
```

yang dapat digunakan untuk:

- latihan
- CBT
- pencarian siswa

---

## BR-010 Question Modification

Soal yang sudah pernah digunakan pada CBT yang telah selesai tidak boleh diubah secara langsung.

Rule:

```
Old Version

↓

Create New Version

↓

Publish New Version
```

Menggunakan mekanisme versioning.

---

## BR-011 Question Deletion

Soal yang pernah digunakan pada ujian tidak boleh dihapus permanen.

Rule:

Soft Delete + Archive.

---

## BR-012 Difficulty Level

Difficulty:

```
EASY

MEDIUM

HARD
```

Tidak boleh bernilai selain tiga level tersebut pada MVP.

---

## BR-013 Multiple Choice

Setiap soal Multiple Choice wajib memiliki:

- minimal 4 opsi
- maksimal 5 opsi (MVP)
- tepat 1 jawaban benar

---

## BR-014 Explanation

Seluruh soal wajib memiliki pembahasan.

Pembahasan dapat berupa:

- teks
- gambar
- kombinasi

Video merupakan fitur Phase 2.

---

# 6. Excel Import Rules

## BR-015 Import Validation

Sebelum import:

System melakukan validasi:

- format file
- mandatory field
- duplicate
- metadata
- answer consistency

---

## BR-016 Partial Import

Jika terdapat data tidak valid:

System:

- mengimpor data valid
- menolak data invalid
- menghasilkan error report

---

## BR-017 Duplicate Question

Duplicate ditentukan berdasarkan kombinasi:

- Question Text
- Subject
- Chapter
- Difficulty

Duplicate tidak boleh dipublikasikan.

---

# 7. CBT Rules

## BR-018 Exam Creation

Exam minimal memiliki:

- Title
- Subject
- Question Source
- Duration
- Question Count

---

## BR-019 Question Selection

Question Count tidak boleh melebihi jumlah soal tersedia.

Jika:

Question Pool = 80

Maka:

Exam 100 soal → ditolak.

---

## BR-020 Randomization

Jika Randomization aktif:

System melakukan random:

- urutan soal
- urutan opsi

Randomization dilakukan per peserta.

---

## BR-021 Exam Session

Satu siswa hanya boleh memiliki satu sesi aktif untuk satu ujian.

---

## BR-022 Auto Save

Jawaban disimpan:

- setiap perubahan
- maksimal setiap beberapa detik sebagai fallback

---

## BR-023 Time Expired

Saat timer habis:

System wajib:

- auto submit
- lock exam
- hitung nilai

---

## BR-024 Manual Submit

Setelah submit:

Student tidak dapat mengubah jawaban.

---

## BR-025 Exam Result

Nilai dihitung setelah:

- seluruh jawaban diproses
- aturan penilaian diterapkan

---

## BR-026 Result Visibility

Result mengikuti konfigurasi ujian.

Pilihan:

- langsung tampil
- ditampilkan setelah ujian selesai
- ditampilkan pada tanggal tertentu

---

# 8. Learning Material Rules

## BR-027 Material Publication

Materi hanya dapat diakses apabila:

Status:

```
PUBLISHED
```

---

## BR-028 Learning Progress

Progress diperbarui ketika:

- membuka materi
- menyelesaikan materi
- menyelesaikan latihan

---

# 9. Analytics Rules

## BR-029 Score History

Seluruh histori nilai disimpan.

Histori tidak boleh ditimpa.

---

## BR-030 Performance Analysis

Analisis dilakukan berdasarkan:

- Subject
- Chapter
- Difficulty
- Time Period

---

## BR-031 Ranking

Ranking hanya dihitung pada scope yang sama.

Contoh:

- kelas
- sekolah
- event

Tidak boleh mencampur scope berbeda.

---

# 10. User Management Rules

## BR-032 Role Assignment

Hanya Admin yang dapat:

- membuat user
- mengubah role
- menonaktifkan user

---

## BR-033 User Deletion

User tidak boleh dihapus permanen.

Menggunakan:

Soft Delete.

---

# 11. Audit Rules

## BR-034 Audit Trail

Aktivitas berikut wajib dicatat:

- Login
- Logout
- User CRUD
- Question CRUD
- Exam CRUD
- Import
- Export
- Role Change
- Configuration Change

---

## BR-035 Immutable Audit

Audit Log tidak boleh diubah melalui aplikasi.

---

# 12. Security Rules

## BR-036 Permission Validation

Seluruh endpoint harus melakukan:

```
Authentication

↓

Authorization

↓

Business Validation
```

---

## BR-037 Data Isolation

Student hanya dapat melihat:

- data miliknya
- hasil miliknya
- progress miliknya

---

## BR-038 Admin Privilege

Admin dapat mengakses seluruh data sesuai kebijakan organisasi.

---

# 13. Soft Delete Rules

## BR-039 Soft Delete

Entity berikut menggunakan Soft Delete:

- User
- Question
- Material
- Subject
- Chapter
- Exam (jika belum digunakan)

---

## BR-040 Restore

Data yang dihapus dapat dipulihkan apabila belum melewati kebijakan retensi.

---

# 14. Versioning Rules

## BR-041 Question Version

Perubahan soal yang telah dipublikasikan menghasilkan versi baru.

Riwayat versi tetap tersimpan.

---

## BR-042 Material Version

Materi pembelajaran memiliki histori revisi.

---

# 15. Notification Rules

System memberikan notifikasi pada:

- login berhasil
- password berubah
- import selesai
- import gagal
- ujian dipublikasikan
- ujian dimulai
- ujian selesai
- soal disetujui
- soal ditolak

---

# 16. Data Integrity Rules

Seluruh foreign key harus valid.

Referential Integrity tidak boleh dilanggar.

Contoh:

Question tidak boleh memiliki Subject yang tidak ada.

---

# 17. Error Handling Rules

Business Error:

```
Validation Failed

↓

Return Validation Message
```

System Error:

```
Unexpected Error

↓

Rollback Transaction

↓

Write Audit

↓

Return Generic Error
```

---

# 18. Business Rule Matrix

| ID | Module | Rule |
|----|--------|------|
| BR-001 | Identity | Unique User |
| BR-007 | Question | Mandatory Metadata |
| BR-010 | Question | Versioning |
| BR-015 | Import | Validation |
| BR-020 | CBT | Randomization |
| BR-023 | CBT | Auto Submit |
| BR-029 | Analytics | Score History |
| BR-034 | Audit | Activity Logging |
| BR-039 | Database | Soft Delete |

---

# 19. Rule Change Policy

Perubahan Business Rule harus:

1. Disetujui Product Owner.
2. Dianalisis dampaknya terhadap Database.
3. Dianalisis dampaknya terhadap API.
4. Diperbarui pada PRD.
5. Diuji melalui Regression Test.

---

# 20. Business Rule Summary

Prinsip utama:

- Security by Default
- Auditability
- Data Integrity
- Immutable History
- Role-Based Access Control
- Version Controlled Content
- Soft Delete over Hard Delete
- Consistent Learning Records

---
