# YakinLulus.id

# Entity Catalog

## 11_system.md

Version : 1.0

Status : Draft

Domain : System

---

# Domain Purpose

System Domain bertanggung jawab mengelola konfigurasi global aplikasi, operasional sistem, audit, monitoring, scheduler, background process, feature management, serta komponen teknis lainnya.

Domain ini tidak mengelola data bisnis.

System Domain menjadi fondasi operasional seluruh platform.

---

# Entity List

SYS-001 System Configuration

SYS-002 Environment Configuration

SYS-003 Feature Flag

SYS-004 Application Setting

SYS-005 Background Job

SYS-006 Scheduled Job

SYS-007 Queue

SYS-008 Queue Message

SYS-009 Notification Template

SYS-010 Notification Queue

SYS-011 Notification Log

SYS-012 Audit Log

SYS-013 Activity Log

SYS-014 Error Log

SYS-015 System Event

SYS-016 API Client

SYS-017 API Key

SYS-018 Webhook

SYS-019 Webhook Delivery

SYS-020 Integration

SYS-021 Cache Configuration

SYS-022 Maintenance Window

SYS-023 Health Check

SYS-024 Backup History

SYS-025 Migration History

SYS-026 System Version

SYS-027 Release Note

SYS-028 License

SYS-029 Timezone

SYS-030 Localization

---

====================================================
ENTITY : SYSTEM CONFIGURATION
====================================================

Entity ID

SYS-001

Purpose

Konfigurasi global aplikasi.

Examples

App Name

Default Language

Default Timezone

Storage Provider

Candidate Table

system_configurations

---

====================================================
ENTITY : ENVIRONMENT CONFIGURATION
====================================================

Entity ID

SYS-002

Purpose

Konfigurasi environment.

Examples

Development

Staging

Production

Candidate Table

environment_configurations

---

====================================================
ENTITY : FEATURE FLAG
====================================================

Entity ID

SYS-003

Purpose

Mengaktifkan atau menonaktifkan fitur tanpa deployment.

Examples

AI Tutor

Dark Mode

Beta Feature

Candidate Table

feature_flags

---

====================================================
ENTITY : APPLICATION SETTING
====================================================

Entity ID

SYS-004

Purpose

Konfigurasi aplikasi yang dapat diubah melalui panel admin.

Candidate Table

application_settings

---

====================================================
ENTITY : BACKGROUND JOB
====================================================

Entity ID

SYS-005

Purpose

Riwayat proses asynchronous.

Examples

Import Excel

Generate Embedding

Video Transcoding

Generate Report

Candidate Table

background_jobs

---

====================================================
ENTITY : SCHEDULED JOB
====================================================

Entity ID

SYS-006

Purpose

Pekerjaan terjadwal.

Examples

Daily Summary

Cleanup Cache

Backup

Candidate Table

scheduled_jobs

---

====================================================
ENTITY : QUEUE
====================================================

Entity ID

SYS-007

Purpose

Definisi antrean pekerjaan.

Candidate Table

queues

---

====================================================
ENTITY : QUEUE MESSAGE
====================================================

Entity ID

SYS-008

Purpose

Pesan yang diproses dalam antrean.

Candidate Table

queue_messages

---

====================================================
ENTITY : NOTIFICATION TEMPLATE
====================================================

Entity ID

SYS-009

Purpose

Template notifikasi.

Examples

Email

Push Notification

In-App Notification

Candidate Table

notification_templates

---

====================================================
ENTITY : NOTIFICATION QUEUE
====================================================

Entity ID

SYS-010

Purpose

Antrean pengiriman notifikasi.

Candidate Table

notification_queues

---

====================================================
ENTITY : NOTIFICATION LOG
====================================================

Entity ID

SYS-011

Purpose

Riwayat pengiriman notifikasi.

Candidate Table

notification_logs

---

====================================================
ENTITY : AUDIT LOG
====================================================

Entity ID

SYS-012

Purpose

Audit seluruh perubahan data penting.

Business Rules

Immutable.

Tidak boleh diedit.

Candidate Table

audit_logs

---

====================================================
ENTITY : ACTIVITY LOG
====================================================

Entity ID

SYS-013

Purpose

Log aktivitas pengguna dan sistem.

Candidate Table

activity_logs

---

====================================================
ENTITY : ERROR LOG
====================================================

Entity ID

SYS-014

Purpose

Mencatat kesalahan aplikasi.

Candidate Table

error_logs

---

====================================================
ENTITY : SYSTEM EVENT
====================================================

Entity ID

SYS-015

Purpose

Event sistem.

Examples

Server Started

Deployment

Maintenance

Candidate Table

system_events

---

====================================================
ENTITY : API CLIENT
====================================================

Entity ID

SYS-016

Purpose

Daftar aplikasi yang terintegrasi.

Examples

Mobile App

Admin Panel

Partner API

Candidate Table

api_clients

---

====================================================
ENTITY : API KEY
====================================================

Entity ID

SYS-017

Purpose

Kredensial akses API.

Candidate Table

api_keys

---

====================================================
ENTITY : WEBHOOK
====================================================

Entity ID

SYS-018

Purpose

Konfigurasi webhook.

Candidate Table

webhooks

---

====================================================
ENTITY : WEBHOOK DELIVERY
====================================================

Entity ID

SYS-019

Purpose

Riwayat pengiriman webhook.

Candidate Table

webhook_deliveries

---

====================================================
ENTITY : INTEGRATION
====================================================

Entity ID

SYS-020

Purpose

Integrasi dengan layanan eksternal.

Examples

Google Drive

Cloud Storage

AI Provider

Payment Gateway (Future)

Candidate Table

integrations

---

====================================================
ENTITY : CACHE CONFIGURATION
====================================================

Entity ID

SYS-021

Purpose

Konfigurasi cache.

Examples

Redis

Memory Cache

TTL

Candidate Table

cache_configurations

---

====================================================
ENTITY : MAINTENANCE WINDOW
====================================================

Entity ID

SYS-022

Purpose

Jadwal maintenance sistem.

Candidate Table

maintenance_windows

---

====================================================
ENTITY : HEALTH CHECK
====================================================

Entity ID

SYS-023

Purpose

Monitoring kesehatan layanan.

Examples

Database

Storage

Queue

API

Candidate Table

health_checks

---

====================================================
ENTITY : BACKUP HISTORY
====================================================

Entity ID

SYS-024

Purpose

Riwayat backup sistem.

Candidate Table

backup_histories

---

====================================================
ENTITY : MIGRATION HISTORY
====================================================

Entity ID

SYS-025

Purpose

Riwayat migrasi database.

Candidate Table

migration_histories

---

====================================================
ENTITY : SYSTEM VERSION
====================================================

Entity ID

SYS-026

Purpose

Versi aplikasi yang sedang berjalan.

Candidate Table

system_versions

---

====================================================
ENTITY : RELEASE NOTE
====================================================

Entity ID

SYS-027

Purpose

Catatan perubahan setiap rilis.

Candidate Table

release_notes

---

====================================================
ENTITY : LICENSE
====================================================

Entity ID

SYS-028

Purpose

Informasi lisensi aplikasi atau modul.

Candidate Table

licenses

---

====================================================
ENTITY : TIMEZONE
====================================================

Entity ID

SYS-029

Purpose

Daftar timezone yang didukung sistem.

Candidate Table

timezones

---

====================================================
ENTITY : LOCALIZATION
====================================================

Entity ID

SYS-030

Purpose

Konfigurasi bahasa dan lokalisasi.

Examples

id-ID

en-US

Candidate Table

localizations