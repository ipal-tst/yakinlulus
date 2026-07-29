# YakinLulus.id

# Entity Catalog

## 04_cbt_engine.md

Version : 1.0

Status : Draft

Domain : CBT Engine

---

# Domain Purpose

CBT Engine Domain bertanggung jawab mengelola seluruh proses Computer Based Test (CBT), mulai dari pembuatan ujian, blueprint, pelaksanaan, penilaian, hingga publikasi hasil.

Domain ini **tidak menyimpan master soal**. Master soal tetap berada pada Question Bank Domain.

Saat ujian dipublikasikan, sistem membuat snapshot soal yang digunakan sehingga perubahan pada Bank Soal tidak mempengaruhi hasil ujian yang telah berlangsung.

---

# Entity List

CBT-001 Exam

CBT-002 Exam Blueprint

CBT-003 Exam Rule

CBT-004 Exam Schedule

CBT-005 Exam Session

CBT-006 Exam Participant

CBT-007 Exam Item

CBT-008 Exam Item Option

CBT-009 User Attempt

CBT-010 User Answer

CBT-011 Answer Review

CBT-012 Scoring

CBT-013 Result

CBT-014 Ranking

CBT-015 Certificate

CBT-016 Exam Token

CBT-017 Device Verification

CBT-018 Auto Save

CBT-019 Time Extension

CBT-020 Exam Incident

CBT-021 Submission Log

CBT-022 CBT Configuration

CBT-023 CBT Analytics

CBT-024 Proctoring Metadata

CBT-025 Exam Audit Log

---

====================================================
ENTITY : EXAM
====================================================

Entity ID

CBT-001

Purpose

Representasi utama sebuah ujian.

Examples

UTBK Try Out

PTS Semester

PAS

Quiz

Daily Test

Simulation

Owner

Teacher

Admin

Life Cycle

Draft

↓

Review

↓

Published

↓

Running

↓

Finished

↓

Archived

Parent

-

Child

Exam Blueprint

Exam Rule

Exam Schedule

Exam Session

Business Rules

Satu Exam dapat memiliki banyak Session.

Satu Exam menggunakan satu Blueprint.

Question diambil dari Question Bank saat Publish.

Candidate Table

exams

---

====================================================
ENTITY : EXAM BLUEPRINT
====================================================

Entity ID

CBT-002

Purpose

Menyimpan komposisi soal.

Examples

40 Soal

30 Easy

7 Medium

3 Hard

Mapping Topic

Candidate Table

exam_blueprints

---

====================================================
ENTITY : EXAM RULE
====================================================

Entity ID

CBT-003

Purpose

Konfigurasi aturan ujian.

Examples

Duration

Shuffle Question

Shuffle Option

Passing Grade

Fullscreen

Calculator Allowed

Navigation Mode

Auto Submit

Candidate Table

exam_rules

---

====================================================
ENTITY : EXAM SCHEDULE
====================================================

Entity ID

CBT-004

Purpose

Jadwal pelaksanaan.

Examples

Start Time

End Time

Registration Deadline

Candidate Table

exam_schedules

---

====================================================
ENTITY : EXAM SESSION
====================================================

Entity ID

CBT-005

Purpose

Pelaksanaan ujian pada waktu tertentu.

Candidate Table

exam_sessions

---

====================================================
ENTITY : EXAM PARTICIPANT
====================================================

Entity ID

CBT-006

Purpose

Peserta yang mengikuti suatu Session.

Candidate Table

exam_participants

---

====================================================
ENTITY : EXAM ITEM
====================================================

Entity ID

CBT-007

Purpose

Snapshot Question yang digunakan pada ujian.

Business Rules

Dibuat ketika Exam dipublish.

Tidak berubah walaupun master Question berubah.

Candidate Table

exam_items

---

====================================================
ENTITY : EXAM ITEM OPTION
====================================================

Entity ID

CBT-008

Purpose

Snapshot pilihan jawaban.

Candidate Table

exam_item_options

---

====================================================
ENTITY : USER ATTEMPT
====================================================

Entity ID

CBT-009

Purpose

Satu percobaan ujian oleh peserta.

Candidate Table

user_attempts

---

====================================================
ENTITY : USER ANSWER
====================================================

Entity ID

CBT-010

Purpose

Jawaban peserta.

Candidate Table

user_answers

---

====================================================
ENTITY : ANSWER REVIEW
====================================================

Entity ID

CBT-011

Purpose

Review jawaban manual.

Future

Essay

Candidate Table

answer_reviews

---

====================================================
ENTITY : SCORING
====================================================

Entity ID

CBT-012

Purpose

Perhitungan nilai.

Candidate Table

scorings

---

====================================================
ENTITY : RESULT
====================================================

Entity ID

CBT-013

Purpose

Hasil akhir peserta.

Candidate Table

results

---

====================================================
ENTITY : RANKING
====================================================

Entity ID

CBT-014

Purpose

Peringkat peserta.

Candidate Table

rankings

---

====================================================
ENTITY : CERTIFICATE
====================================================

Entity ID

CBT-015

Purpose

Sertifikat digital.

Future

Candidate Table

certificates

---

====================================================
ENTITY : EXAM TOKEN
====================================================

Entity ID

CBT-016

Purpose

Token masuk ujian.

Candidate Table

exam_tokens

---

====================================================
ENTITY : DEVICE VERIFICATION
====================================================

Entity ID

CBT-017

Purpose

Validasi perangkat peserta.

Candidate Table

device_verifications

---

====================================================
ENTITY : AUTO SAVE
====================================================

Entity ID

CBT-018

Purpose

Penyimpanan otomatis jawaban.

Candidate Table

autosaves

---

====================================================
ENTITY : TIME EXTENSION
====================================================

Entity ID

CBT-019

Purpose

Perpanjangan waktu ujian.

Candidate Table

time_extensions

---

====================================================
ENTITY : EXAM INCIDENT
====================================================

Entity ID

CBT-020

Purpose

Mencatat gangguan ujian.

Examples

Disconnect

Browser Closed

Token Expired

Candidate Table

exam_incidents

---

====================================================
ENTITY : SUBMISSION LOG
====================================================

Entity ID

CBT-021

Purpose

Riwayat submit.

Candidate Table

submission_logs

---

====================================================
ENTITY : CBT CONFIGURATION
====================================================

Entity ID

CBT-022

Purpose

Konfigurasi global engine CBT.

Candidate Table

cbt_configurations

---

====================================================
ENTITY : CBT ANALYTICS
====================================================

Entity ID

CBT-023

Purpose

Statistik ujian.

Examples

Average Score

Completion Rate

Average Time

Difficulty Distribution

Candidate Table

cbt_analytics

---

====================================================
ENTITY : PROCTORING METADATA
====================================================

Entity ID

CBT-024

Purpose

Metadata pengawasan ujian.

Future

Face Detection

Tab Switching

Copy Paste Detection

Multiple Device Detection

Candidate Table

proctoring_metadata

---

====================================================
ENTITY : EXAM AUDIT LOG
====================================================

Entity ID

CBT-025

Purpose

Audit seluruh perubahan ujian.

Candidate Table

exam_audit_logs