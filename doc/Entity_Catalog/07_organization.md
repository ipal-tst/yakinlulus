# YakinLulus.id

# Entity Catalog

## 07_organization.md

Version : 1.0

Status : Draft

Domain : Organization

---

# Domain Purpose

Organization Domain bertanggung jawab mengelola seluruh organisasi yang menggunakan platform YakinLulus, termasuk sekolah, bimbingan belajar, kelas, keanggotaan, penugasan guru, dan struktur organisasi.

Domain ini tidak mengelola autentikasi pengguna maupun aktivitas pembelajaran.

---

# Entity List

ORG-001 Organization

ORG-002 Organization Profile

ORG-003 Organization Member

ORG-004 Academic Year

ORG-005 Semester

ORG-006 Campus

ORG-007 Building

ORG-008 Classroom

ORG-009 Classroom Member

ORG-010 Subject Assignment

ORG-011 Homeroom Assignment

ORG-012 Teacher Assignment

ORG-013 Student Enrollment

ORG-014 Organization Invitation

ORG-015 Organization Role

ORG-016 Organization Setting

ORG-017 Academic Calendar

ORG-018 Holiday

ORG-019 Organization Audit Log

---

====================================================
ENTITY : ORGANIZATION
====================================================

Entity ID

ORG-001

Purpose

Representasi institusi yang menggunakan platform.

Examples

School

Tutoring Center

Course

Homeschool

University (Future)

Corporate Training (Future)

Owner

System

Life Cycle

Draft

↓

Active

↓

Suspended

↓

Archived

Child

Organization Profile

Organization Member

Academic Year

Business Rules

Satu Organization dapat memiliki banyak pengguna.

Satu pengguna dapat menjadi anggota lebih dari satu Organization.

Candidate Table

organizations

---

====================================================
ENTITY : ORGANIZATION PROFILE
====================================================

Entity ID

ORG-002

Purpose

Informasi profil organisasi.

Examples

Nama

Logo

Alamat

Website

Email

Telepon

Akreditasi

NPSN (Sekolah)

Candidate Table

organization_profiles

---

====================================================
ENTITY : ORGANIZATION MEMBER
====================================================

Entity ID

ORG-003

Purpose

Mapping Account dengan Organization.

Business Rules

Satu Account dapat menjadi anggota beberapa Organization.

Candidate Table

organization_members

---

====================================================
ENTITY : ACADEMIC YEAR
====================================================

Entity ID

ORG-004

Purpose

Tahun ajaran.

Examples

2026/2027

2027/2028

Candidate Table

academic_years

---

====================================================
ENTITY : SEMESTER
====================================================

Entity ID

ORG-005

Purpose

Semester akademik.

Examples

Ganjil

Genap

Pendek

Candidate Table

semesters

---

====================================================
ENTITY : CAMPUS
====================================================

Entity ID

ORG-006

Purpose

Cabang atau lokasi organisasi.

Future

Multi Campus

Candidate Table

campuses

---

====================================================
ENTITY : BUILDING
====================================================

Entity ID

ORG-007

Purpose

Gedung dalam organisasi.

Future

Manajemen ruang.

Candidate Table

buildings

---

====================================================
ENTITY : CLASSROOM
====================================================

Entity ID

ORG-008

Purpose

Rombongan belajar atau kelas.

Examples

Kelas 10 IPA 1

Kelas 9A

UTBK Batch 3

Candidate Table

classrooms

---

====================================================
ENTITY : CLASSROOM MEMBER
====================================================

Entity ID

ORG-009

Purpose

Mapping siswa ke Classroom.

Candidate Table

classroom_members

---

====================================================
ENTITY : SUBJECT ASSIGNMENT
====================================================

Entity ID

ORG-010

Purpose

Mapping mata pelajaran ke Classroom.

Candidate Table

subject_assignments

---

====================================================
ENTITY : HOMEROOM ASSIGNMENT
====================================================

Entity ID

ORG-011

Purpose

Penugasan wali kelas.

Candidate Table

homeroom_assignments

---

====================================================
ENTITY : TEACHER ASSIGNMENT
====================================================

Entity ID

ORG-012

Purpose

Penugasan guru mengajar.

Examples

Guru A

↓

Matematika

↓

Kelas X IPA 1

Candidate Table

teacher_assignments

---

====================================================
ENTITY : STUDENT ENROLLMENT
====================================================

Entity ID

ORG-013

Purpose

Riwayat siswa mengikuti organisasi atau kelas.

Business Rules

Tidak menghapus histori ketika siswa pindah sekolah.

Candidate Table

student_enrollments

---

====================================================
ENTITY : ORGANIZATION INVITATION
====================================================

Entity ID

ORG-014

Purpose

Undangan bergabung ke organisasi.

Candidate Table

organization_invitations

---

====================================================
ENTITY : ORGANIZATION ROLE
====================================================

Entity ID

ORG-015

Purpose

Role khusus dalam organisasi.

Examples

Principal

Vice Principal

Operator

Teacher

Student

Parent

Candidate Table

organization_roles

---

====================================================
ENTITY : ORGANIZATION SETTING
====================================================

Entity ID

ORG-016

Purpose

Konfigurasi organisasi.

Examples

Timezone

Theme

Academic Rule

Branding

Candidate Table

organization_settings

---

====================================================
ENTITY : ACADEMIC CALENDAR
====================================================

Entity ID

ORG-017

Purpose

Kalender akademik.

Examples

Awal Semester

PTS

PAS

Libur

Kelulusan

Candidate Table

academic_calendars

---

====================================================
ENTITY : HOLIDAY
====================================================

Entity ID

ORG-018

Purpose

Daftar hari libur.

Examples

Libur Nasional

Libur Sekolah

Libur Daerah

Candidate Table

holidays

---

====================================================
ENTITY : ORGANIZATION AUDIT LOG
====================================================

Entity ID

ORG-019

Purpose

Audit seluruh perubahan pada Organization Domain.

Candidate Table

organization_audit_logs