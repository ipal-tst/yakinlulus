# YakinLulus.id

# Entity Catalog

## 06_learning.md

Version : 1.0

Status : Draft

Domain : Learning

---

# Domain Purpose

Learning Domain bertanggung jawab mengelola seluruh aktivitas pembelajaran siswa, termasuk progress belajar, riwayat belajar, pencapaian, rekomendasi pembelajaran, target belajar, dan statistik perkembangan.

Domain ini tidak mengelola konten pembelajaran maupun ujian.

Learning Domain hanya mencatat bagaimana siswa belajar.

---

# Entity List

LE-001 Learning Progress

LE-002 Learning Activity

LE-003 Learning Session

LE-004 Learning History

LE-005 Learning Bookmark

LE-006 Learning Note

LE-007 Learning Target

LE-008 Learning Recommendation

LE-009 Weak Topic

LE-010 Strong Topic

LE-011 Learning Streak

LE-012 Achievement

LE-013 Badge

LE-014 Leaderboard

LE-015 XP Transaction

LE-016 Level

LE-017 Daily Learning Summary

LE-018 Learning Analytics Snapshot

LE-019 Study Plan

LE-020 Study Plan Item

LE-021 Reminder

LE-022 Favorite Resource

LE-023 Recently Viewed

LE-024 Learning Audit Log

---

====================================================
ENTITY : LEARNING PROGRESS
====================================================

Entity ID

LE-001

Purpose

Progress penyelesaian Learning Resource.

Business Rules

Satu Student memiliki satu Progress untuk setiap Learning Resource.

Candidate Table

learning_progress

---

====================================================
ENTITY : LEARNING ACTIVITY
====================================================

Entity ID

LE-002

Purpose

Log aktivitas belajar.

Examples

Open Resource

Complete Resource

Watch Video

Read Article

Download PDF

Candidate Table

learning_activities

---

====================================================
ENTITY : LEARNING SESSION
====================================================

Entity ID

LE-003

Purpose

Satu sesi belajar.

Examples

Start Time

End Time

Duration

Device

Candidate Table

learning_sessions

---

====================================================
ENTITY : LEARNING HISTORY
====================================================

Entity ID

LE-004

Purpose

Riwayat seluruh aktivitas belajar.

Candidate Table

learning_histories

---

====================================================
ENTITY : LEARNING BOOKMARK
====================================================

Entity ID

LE-005

Purpose

Bookmark Learning Resource.

Candidate Table

learning_bookmarks

---

====================================================
ENTITY : LEARNING NOTE
====================================================

Entity ID

LE-006

Purpose

Catatan pribadi siswa.

Candidate Table

learning_notes

---

====================================================
ENTITY : LEARNING TARGET
====================================================

Entity ID

LE-007

Purpose

Target belajar siswa.

Examples

30 Menit/Hari

5 Resource/Hari

50 Soal/Minggu

Candidate Table

learning_targets

---

====================================================
ENTITY : LEARNING RECOMMENDATION
====================================================

Entity ID

LE-008

Purpose

Rekomendasi materi berikutnya.

Future

AI Recommendation

Adaptive Learning

Candidate Table

learning_recommendations

---

====================================================
ENTITY : WEAK TOPIC
====================================================

Entity ID

LE-009

Purpose

Topik yang masih lemah berdasarkan hasil belajar dan CBT.

Candidate Table

weak_topics

---

====================================================
ENTITY : STRONG TOPIC
====================================================

Entity ID

LE-010

Purpose

Topik yang telah dikuasai.

Candidate Table

strong_topics

---

====================================================
ENTITY : LEARNING STREAK
====================================================

Entity ID

LE-011

Purpose

Catatan belajar beruntun.

Candidate Table

learning_streaks

---

====================================================
ENTITY : ACHIEVEMENT
====================================================

Entity ID

LE-012

Purpose

Pencapaian siswa.

Examples

100 Soal Selesai

7 Hari Belajar

Top Rank

Candidate Table

achievements

---

====================================================
ENTITY : BADGE
====================================================

Entity ID

LE-013

Purpose

Badge yang diperoleh pengguna.

Candidate Table

badges

---

====================================================
ENTITY : LEADERBOARD
====================================================

Entity ID

LE-014

Purpose

Peringkat pengguna berdasarkan skor, XP, atau aktivitas.

Candidate Table

leaderboards

---

====================================================
ENTITY : XP TRANSACTION
====================================================

Entity ID

LE-015

Purpose

Riwayat perolehan dan penggunaan Experience Point.

Candidate Table

xp_transactions

---

====================================================
ENTITY : LEVEL
====================================================

Entity ID

LE-016

Purpose

Level pengguna berdasarkan XP.

Candidate Table

levels

---

====================================================
ENTITY : DAILY LEARNING SUMMARY
====================================================

Entity ID

LE-017

Purpose

Ringkasan aktivitas belajar harian.

Candidate Table

daily_learning_summaries

---

====================================================
ENTITY : LEARNING ANALYTICS SNAPSHOT
====================================================

Entity ID

LE-018

Purpose

Snapshot statistik belajar untuk dashboard.

Candidate Table

learning_analytics_snapshots

---

====================================================
ENTITY : STUDY PLAN
====================================================

Entity ID

LE-019

Purpose

Rencana belajar yang dimiliki siswa.

Examples

Persiapan PAS

Persiapan UTBK

Target Naik Kelas

Candidate Table

study_plans

---

====================================================
ENTITY : STUDY PLAN ITEM
====================================================

Entity ID

LE-020

Purpose

Daftar aktivitas dalam suatu Study Plan.

Candidate Table

study_plan_items

---

====================================================
ENTITY : REMINDER
====================================================

Entity ID

LE-021

Purpose

Pengingat belajar.

Examples

Belajar Matematika

Latihan CBT

Review Materi

Candidate Table

learning_reminders

---

====================================================
ENTITY : FAVORITE RESOURCE
====================================================

Entity ID

LE-022

Purpose

Daftar Learning Resource favorit.

Candidate Table

favorite_resources

---

====================================================
ENTITY : RECENTLY VIEWED
====================================================

Entity ID

LE-023

Purpose

Riwayat Learning Resource terakhir yang diakses.

Candidate Table

recently_viewed_resources

---

====================================================
ENTITY : LEARNING AUDIT LOG
====================================================

Entity ID

LE-024

Purpose

Audit perubahan data Learning Domain.

Candidate Table

learning_audit_logs