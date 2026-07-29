# YakinLulus.id

# Entity Catalog

## 05_user_management.md

Version : 1.0

Status : Draft

Domain : User Management

---

# Domain Purpose

User Management Domain bertanggung jawab mengelola identitas, autentikasi, otorisasi, profil pengguna, role, permission, session, dan keamanan akun.

Domain ini menjadi fondasi seluruh sistem YakinLulus.

Domain ini tidak mengelola data akademik maupun aktivitas belajar.

---

# Entity List

UM-001 Identity

UM-002 Account

UM-003 User Profile

UM-004 Student Profile

UM-005 Teacher Profile

UM-006 Parent Profile

UM-007 Staff Profile

UM-008 Role

UM-009 Permission

UM-010 Role Permission

UM-011 User Role

UM-012 Session

UM-013 Device

UM-014 Authentication Provider

UM-015 Login History

UM-016 Password History

UM-017 Email Verification

UM-018 Phone Verification

UM-019 Password Reset

UM-020 Multi Factor Authentication

UM-021 API Token

UM-022 Notification Preference

UM-023 Privacy Setting

UM-024 User Preference

UM-025 User Audit Log

---

====================================================
ENTITY : IDENTITY
====================================================

Entity ID

UM-001

Purpose

Identitas utama untuk proses autentikasi.

Examples

Email

Phone Number

Google Login

Apple Login

Microsoft Login

Username

Business Rules

Satu Identity hanya boleh dimiliki satu Account.

Candidate Table

identities

---

====================================================
ENTITY : ACCOUNT
====================================================

Entity ID

UM-002

Purpose

Representasi akun sistem.

Life Cycle

Pending

↓

Active

↓

Suspended

↓

Locked

↓

Archived

Parent

Identity

Child

User Profile

Session

Business Rules

Satu Account dapat memiliki banyak Role.

Candidate Table

accounts

---

====================================================
ENTITY : USER PROFILE
====================================================

Entity ID

UM-003

Purpose

Informasi umum pengguna.

Examples

Nama

Foto

Tanggal Lahir

Jenis Kelamin

Alamat

Bahasa

Timezone

Candidate Table

user_profiles

---

====================================================
ENTITY : STUDENT PROFILE
====================================================

Entity ID

UM-004

Purpose

Data khusus siswa.

Examples

NIS

NISN

Jenjang

Kelas

Sekolah

Angkatan

Candidate Table

student_profiles

---

====================================================
ENTITY : TEACHER PROFILE
====================================================

Entity ID

UM-005

Purpose

Data khusus guru.

Examples

NUPTK

Mata Pelajaran

Sekolah

Keahlian

Candidate Table

teacher_profiles

---

====================================================
ENTITY : PARENT PROFILE
====================================================

Entity ID

UM-006

Purpose

Data orang tua/wali.

Candidate Table

parent_profiles

---

====================================================
ENTITY : STAFF PROFILE
====================================================

Entity ID

UM-007

Purpose

Data admin/operator.

Candidate Table

staff_profiles

---

====================================================
ENTITY : ROLE
====================================================

Entity ID

UM-008

Purpose

Role sistem.

Examples

Super Admin

Admin

Teacher

Student

Parent

Staff

Candidate Table

roles

---

====================================================
ENTITY : PERMISSION
====================================================

Entity ID

UM-009

Purpose

Hak akses granular.

Candidate Table

permissions

---

====================================================
ENTITY : ROLE PERMISSION
====================================================

Entity ID

UM-010

Purpose

Mapping Role ke Permission.

Candidate Table

role_permissions

---

====================================================
ENTITY : USER ROLE
====================================================

Entity ID

UM-011

Purpose

Mapping Account ke Role.

Business Rules

Satu Account dapat memiliki lebih dari satu Role.

Candidate Table

user_roles

---

====================================================
ENTITY : SESSION
====================================================

Entity ID

UM-012

Purpose

Session login aktif.

Candidate Table

sessions

---

====================================================
ENTITY : DEVICE
====================================================

Entity ID

UM-013

Purpose

Perangkat yang pernah digunakan login.

Examples

Windows

Android

iPhone

Mac

Candidate Table

devices

---

====================================================
ENTITY : AUTHENTICATION PROVIDER
====================================================

Entity ID

UM-014

Purpose

Penyedia autentikasi.

Examples

Local

Google

Apple

Microsoft

Candidate Table

authentication_providers

---

====================================================
ENTITY : LOGIN HISTORY
====================================================

Entity ID

UM-015

Purpose

Riwayat login pengguna.

Candidate Table

login_histories

---

====================================================
ENTITY : PASSWORD HISTORY
====================================================

Entity ID

UM-016

Purpose

Riwayat password untuk mencegah penggunaan ulang.

Candidate Table

password_histories

---

====================================================
ENTITY : EMAIL VERIFICATION
====================================================

Entity ID

UM-017

Purpose

Verifikasi email.

Candidate Table

email_verifications

---

====================================================
ENTITY : PHONE VERIFICATION
====================================================

Entity ID

UM-018

Purpose

Verifikasi nomor telepon.

Candidate Table

phone_verifications

---

====================================================
ENTITY : PASSWORD RESET
====================================================

Entity ID

UM-019

Purpose

Reset password.

Candidate Table

password_resets

---

====================================================
ENTITY : MULTI FACTOR AUTHENTICATION
====================================================

Entity ID

UM-020

Purpose

Konfigurasi MFA.

Future

Authenticator App

TOTP

Passkey

Candidate Table

multi_factor_authentications

---

====================================================
ENTITY : API TOKEN
====================================================

Entity ID

UM-021

Purpose

Token API untuk integrasi.

Candidate Table

api_tokens

---

====================================================
ENTITY : NOTIFICATION PREFERENCE
====================================================

Entity ID

UM-022

Purpose

Preferensi notifikasi.

Examples

Email

Push Notification

SMS

WhatsApp (Future)

Candidate Table

notification_preferences

---

====================================================
ENTITY : PRIVACY SETTING
====================================================

Entity ID

UM-023

Purpose

Pengaturan privasi akun.

Candidate Table

privacy_settings

---

====================================================
ENTITY : USER PREFERENCE
====================================================

Entity ID

UM-024

Purpose

Preferensi aplikasi.

Examples

Theme

Language

Timezone

Dashboard Layout

Candidate Table

user_preferences

---

====================================================
ENTITY : USER AUDIT LOG
====================================================

Entity ID

UM-025

Purpose

Audit seluruh aktivitas administrasi akun.

Candidate Table

user_audit_logs