Berikut draft **`PRD/10_acceptance_criteria.md`**.

Dokumen ini menggunakan pendekatan **Behavior Driven Development (BDD)** dengan format **Given – When – Then** sehingga dapat langsung digunakan oleh **QA Engineer**, **Backend Engineer**, **Frontend Engineer**, **Product Owner**, dan **UAT (User Acceptance Test)**.

---

```md
# Product Requirement Document (PRD)

# YakinLulus.id

## Document: Acceptance Criteria

| Attribute | Value |
|---|---|
| Document | Acceptance Criteria |
| Version | 1.0 |
| Status | Draft |
| Product Stage | MVP Development |
| Related Document | Functional Requirement |
| Purpose | Define Feature Acceptance Criteria |

---

# 1. Introduction

## 1.1 Purpose

Dokumen ini mendefinisikan kriteria penerimaan (Acceptance Criteria) untuk setiap fitur pada YakinLulus.id.

Acceptance Criteria digunakan sebagai acuan untuk:

- QA Testing
- User Acceptance Test (UAT)
- Sprint Review
- Release Validation
- Definition of Done

Semua skenario menggunakan format BDD:

- Given
- When
- Then

---

# 2. Authentication Module

## AC-AUTH-001 Login Success

Related Requirement

FR-AUTH-001

Given

- User telah terdaftar
- Status user ACTIVE
- Password benar

When

User melakukan login

Then

- Login berhasil
- JWT Access Token diterbitkan
- Refresh Token diterbitkan
- Login History tercatat
- User diarahkan ke dashboard sesuai role

---

## AC-AUTH-002 Invalid Password

Given

Password salah

When

User login

Then

- Login ditolak
- Tidak membuat session
- Menampilkan pesan kesalahan

---

## AC-AUTH-003 Inactive User

Given

Status user INACTIVE

When

User login

Then

- Login ditolak
- Menampilkan informasi akun tidak aktif

---

## AC-AUTH-004 Logout

Given

User sedang login

When

Logout dipilih

Then

- Session berakhir
- Refresh token dicabut
- Login History diperbarui

---

# 3. User Management

## AC-USER-001 Create User

Given

Admin login

When

Mengisi seluruh data valid

Then

- User berhasil dibuat
- UUID dibuat
- Audit Log tercatat

---

## AC-USER-002 Duplicate Email

Given

Email telah digunakan

When

Admin membuat user

Then

- Penyimpanan ditolak
- Pesan email sudah digunakan ditampilkan

---

## AC-USER-003 Update User

Given

User tersedia

When

Admin memperbarui data

Then

- Data berubah
- Updated At diperbarui
- Audit Log tercatat

---

## AC-USER-004 Deactivate User

Given

User aktif

When

Admin memilih deactivate

Then

- Status menjadi INACTIVE
- User tidak dapat login

---

# 4. Question Bank

## AC-QB-001 Create Question

Given

User memiliki permission

When

Seluruh metadata wajib diisi

Then

- Soal tersimpan
- Status DRAFT

---

## AC-QB-002 Publish Question

Given

Status APPROVED

When

Publish dipilih

Then

- Status menjadi PUBLISHED
- Soal muncul pada pencarian

---

## AC-QB-003 Missing Metadata

Given

Metadata belum lengkap

When

Publish dilakukan

Then

- Publish ditolak
- Daftar metadata yang belum lengkap ditampilkan

---

## AC-QB-004 Versioning

Given

Soal pernah digunakan pada CBT

When

Editor melakukan perubahan

Then

- Sistem membuat versi baru
- Versi lama tetap tersedia

---

## AC-QB-005 Archive

Given

Soal dipilih

When

Archive dilakukan

Then

- Soft Delete diterapkan
- Soal tidak tampil pada pencarian umum

---

## AC-QB-006 Import Excel Success

Given

Template valid

When

File diunggah

Then

- Seluruh soal valid diimpor
- Ringkasan hasil import ditampilkan

---

## AC-QB-007 Import Validation Failed

Given

Template memiliki kesalahan

When

Import dilakukan

Then

- Import data invalid ditolak
- Error report tersedia

---

# 5. CBT Engine

## AC-CBT-001 Create Exam

Given

Admin atau Teacher login

When

Konfigurasi ujian lengkap

Then

- Exam berhasil dibuat
- Status DRAFT

---

## AC-CBT-002 Publish Exam

Given

Jumlah soal memenuhi syarat

When

Publish dilakukan

Then

- Status menjadi PUBLISHED

---

## AC-CBT-003 Start Exam

Given

Jadwal aktif

When

Student memulai ujian

Then

- Session dibuat
- Timer dimulai
- Soal diacak sesuai konfigurasi

---

## AC-CBT-004 Auto Save

Given

Student menjawab soal

When

Jawaban berubah

Then

- Jawaban otomatis disimpan

---

## AC-CBT-005 Resume Session

Given

Koneksi terputus

When

Student login kembali

Then

- Jawaban sebelumnya tersedia
- Timer tetap konsisten
- Ujian dapat dilanjutkan

---

## AC-CBT-006 Manual Submit

Given

Student selesai mengerjakan

When

Submit dipilih

Then

- Jawaban dikunci
- Nilai dihitung
- Hasil tersimpan

---

## AC-CBT-007 Auto Submit

Given

Waktu habis

When

Timer mencapai nol

Then

- Sistem submit otomatis
- Nilai dihitung

---

## AC-CBT-008 Result Visibility

Given

Konfigurasi hasil "Delayed"

When

Student selesai ujian

Then

- Nilai tidak langsung ditampilkan

---

# 6. Learning Material

## AC-MAT-001 Publish Material

Given

Materi lengkap

When

Publish dilakukan

Then

- Status menjadi PUBLISHED

---

## AC-MAT-002 Read Material

Given

Materi dipublikasikan

When

Student membuka materi

Then

- Progress belajar diperbarui

---

# 7. Student Dashboard

## AC-DASH-001 Dashboard Summary

Given

Student login

When

Dashboard dibuka

Then

Dashboard menampilkan:

- Total latihan
- Total CBT
- Nilai rata-rata
- Progress belajar

---

## AC-DASH-002 Exam History

Given

Student memiliki riwayat ujian

When

Menu History dibuka

Then

Seluruh histori ditampilkan secara kronologis

---

# 8. Learning Analytics

## AC-ANA-001 Performance Analysis

Given

Student memiliki histori latihan

When

Analytics dibuka

Then

Analisis berdasarkan:

- Mata pelajaran
- Bab
- Tingkat kesulitan

ditampilkan

---

## AC-ANA-002 Weak Topic

Given

Data cukup tersedia

When

Analisis dilakukan

Then

Topik dengan performa terendah ditampilkan

---

## AC-ANA-003 Recommendation

Given

Weak Topic ditemukan

When

Dashboard dimuat

Then

Sistem memberikan rekomendasi:

- Materi
- Latihan

---

# 9. Administration

## AC-ADM-001 Manage Configuration

Given

Admin login

When

Konfigurasi diubah

Then

- Konfigurasi tersimpan
- Audit Log tercatat

---

## AC-ADM-002 Audit Log

Given

Terjadi perubahan data

When

Transaksi selesai

Then

Audit Log menyimpan:

- User
- Waktu
- Modul
- Aktivitas

---

# 10. Authorization

## AC-RBAC-001 Access Validation

Given

User tanpa permission

When

Mengakses endpoint

Then

- HTTP 403
- Tidak ada perubahan data

---

## AC-RBAC-002 Student Isolation

Given

Student login

When

Membuka hasil ujian

Then

Student hanya dapat melihat miliknya sendiri

---

# 11. Validation

## AC-VAL-001 Required Field

Given

Field wajib kosong

When

Simpan dilakukan

Then

Validasi gagal

---

## AC-VAL-002 Invalid Format

Given

Format tidak sesuai

When

Submit dilakukan

Then

Error validasi ditampilkan

---

# 12. Security

## AC-SEC-001 Password Storage

Given

User dibuat

When

Password disimpan

Then

Password tersimpan dalam bentuk hash

---

## AC-SEC-002 HTTPS

Given

Client mengakses sistem

When

Data dikirim

Then

Seluruh komunikasi menggunakan HTTPS

---

# 13. File Upload

## AC-FILE-001 Upload Success

Given

Format valid

When

Upload dilakukan

Then

File berhasil disimpan

---

## AC-FILE-002 Invalid File

Given

Format tidak didukung

When

Upload dilakukan

Then

Upload ditolak

---

# 14. Error Handling

## AC-ERR-001 Business Validation

Given

Data tidak valid

When

Submit

Then

Pesan validasi ditampilkan

---

## AC-ERR-002 System Failure

Given

Terjadi kesalahan sistem

When

Request diproses

Then

- Transaksi di-rollback
- Error dicatat
- Pesan umum ditampilkan

---

# 15. Acceptance Criteria Traceability

| Requirement | Acceptance Criteria |
|-------------|---------------------|
| FR-AUTH | AC-AUTH |
| FR-USER | AC-USER |
| FR-QB | AC-QB |
| FR-CBT | AC-CBT |
| FR-MAT | AC-MAT |
| FR-DASH | AC-DASH |
| FR-ANA | AC-ANA |
| FR-ADM | AC-ADM |

---

# 16. Definition of Done

Sebuah fitur dinyatakan selesai apabila:

- Functional Requirement terpenuhi.
- Business Rule terpenuhi.
- Acceptance Criteria lulus 100%.
- Unit Test lulus.
- Integration Test lulus.
- API Test lulus.
- Regression Test lulus.
- Security Review selesai.
- Dokumentasi diperbarui.
- Product Owner menyetujui.

---

# 17. UAT Checklist

Setiap fitur wajib memenuhi:

- Fungsi sesuai kebutuhan bisnis.
- Tidak terdapat error kritis.
- Hak akses sesuai RBAC.
- Data tersimpan dengan benar.
- Audit Log tercatat.
- Performa memenuhi NFR.
- UI responsif.
- Tidak ada kehilangan data.

---

# 18. Acceptance Summary

Seluruh fitur MVP harus dapat diterima apabila:

- Seluruh skenario BDD berhasil.
- Tidak ada blocker.
- Tidak ada bug severity Critical.
- Tidak ada bug severity High yang belum disetujui Product Owner.
- Dokumentasi implementasi lengkap.
- Release Candidate dinyatakan siap produksi.

---
