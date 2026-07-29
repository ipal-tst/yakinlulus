# YakinLulus.id

# Entity Catalog

## 10_analytics.md

Version : 1.0

Status : Draft

Domain : Analytics

---

# Domain Purpose

Analytics Domain bertanggung jawab mengumpulkan, mengolah, mengagregasi, dan menyajikan data analitik dari seluruh domain bisnis pada platform YakinLulus.

Analytics Domain tidak menjadi sumber data utama (Source of Truth). Data utama tetap berada pada domain asal.

Analytics Domain menghasilkan insight untuk dashboard, laporan, monitoring, dan pengambilan keputusan.

---

# Entity List

AN-001 Analytics Event

AN-002 Analytics Dimension

AN-003 Analytics Metric

AN-004 Analytics Fact

AN-005 Analytics Summary

AN-006 Dashboard Widget

AN-007 Dashboard Layout

AN-008 Report Template

AN-009 Generated Report

AN-010 Scheduled Report

AN-011 KPI Definition

AN-012 KPI Snapshot

AN-013 Leaderboard Snapshot

AN-014 Trend Snapshot

AN-015 Organization Analytics

AN-016 Student Analytics

AN-017 Teacher Analytics

AN-018 Resource Analytics

AN-019 Exam Analytics

AN-020 Analytics Audit Log

---

====================================================
ENTITY : ANALYTICS EVENT
====================================================

Entity ID

AN-001

Purpose

Menyimpan event mentah dari seluruh domain.

Examples

Login

Open Resource

Complete Resource

Start Exam

Submit Exam

Download Material

Candidate Table

analytics_events

---

====================================================
ENTITY : ANALYTICS DIMENSION
====================================================

Entity ID

AN-002

Purpose

Dimensi analitik.

Examples

Date

Subject

Grade

Organization

Student

Teacher

Candidate Table

analytics_dimensions

---

====================================================
ENTITY : ANALYTICS METRIC
====================================================

Entity ID

AN-003

Purpose

Definisi metrik.

Examples

Total User

Average Score

Completion Rate

Average Study Time

Candidate Table

analytics_metrics

---

====================================================
ENTITY : ANALYTICS FACT
====================================================

Entity ID

AN-004

Purpose

Fakta hasil agregasi yang menjadi dasar analisis multidimensi.

Examples

Jumlah Attempt

Total Durasi Belajar

Jumlah Resource Dibuka

Candidate Table

analytics_facts

---

====================================================
ENTITY : ANALYTICS SUMMARY
====================================================

Entity ID

AN-005

Purpose

Ringkasan hasil agregasi untuk dashboard.

Candidate Table

analytics_summaries

---

====================================================
ENTITY : DASHBOARD WIDGET
====================================================

Entity ID

AN-006

Purpose

Definisi widget dashboard.

Candidate Table

dashboard_widgets

---

====================================================
ENTITY : DASHBOARD LAYOUT
====================================================

Entity ID

AN-007

Purpose

Konfigurasi tata letak dashboard.

Candidate Table

dashboard_layouts

---

====================================================
ENTITY : REPORT TEMPLATE
====================================================

Entity ID

AN-008

Purpose

Template laporan.

Examples

Laporan Sekolah

Laporan Guru

Laporan Siswa

Laporan CBT

Candidate Table

report_templates

---

====================================================
ENTITY : GENERATED REPORT
====================================================

Entity ID

AN-009

Purpose

Laporan yang dihasilkan sistem.

Candidate Table

generated_reports

---

====================================================
ENTITY : SCHEDULED REPORT
====================================================

Entity ID

AN-010

Purpose

Jadwal pembuatan laporan otomatis.

Candidate Table

scheduled_reports

---

====================================================
ENTITY : KPI DEFINITION
====================================================

Entity ID

AN-011

Purpose

Definisi indikator kinerja.

Examples

Average Score

Completion Rate

Daily Active User

Candidate Table

kpi_definitions

---

====================================================
ENTITY : KPI SNAPSHOT
====================================================

Entity ID

AN-012

Purpose

Snapshot nilai KPI pada waktu tertentu.

Candidate Table

kpi_snapshots

---

====================================================
ENTITY : LEADERBOARD SNAPSHOT
====================================================

Entity ID

AN-013

Purpose

Snapshot peringkat pada periode tertentu.

Candidate Table

leaderboard_snapshots

---

====================================================
ENTITY : TREND SNAPSHOT
====================================================

Entity ID

AN-014

Purpose

Data tren untuk analisis historis.

Examples

Harian

Mingguan

Bulanan

Tahunan

Candidate Table

trend_snapshots

---

====================================================
ENTITY : ORGANIZATION ANALYTICS
====================================================

Entity ID

AN-015

Purpose

Ringkasan analitik organisasi.

Candidate Table

organization_analytics

---

====================================================
ENTITY : STUDENT ANALYTICS
====================================================

Entity ID

AN-016

Purpose

Ringkasan analitik per siswa.

Candidate Table

student_analytics

---

====================================================
ENTITY : TEACHER ANALYTICS
====================================================

Entity ID

AN-017

Purpose

Ringkasan analitik per guru.

Candidate Table

teacher_analytics

---

====================================================
ENTITY : RESOURCE ANALYTICS
====================================================

Entity ID

AN-018

Purpose

Ringkasan analitik Learning Resource.

Candidate Table

resource_analytics

---

====================================================
ENTITY : EXAM ANALYTICS
====================================================

Entity ID

AN-019

Purpose

Ringkasan analitik CBT.

Candidate Table

exam_analytics

---

====================================================
ENTITY : ANALYTICS AUDIT LOG
====================================================

Entity ID

AN-020

Purpose

Audit perubahan konfigurasi Analytics Domain.

Candidate Table

analytics_audit_logs