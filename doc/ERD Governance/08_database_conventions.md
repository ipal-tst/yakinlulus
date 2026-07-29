# YakinLulus.id

# 08_database_conventions.md

Version : 1.0

Status : Draft

---

# Purpose

Dokumen ini mendefinisikan standar implementasi database PostgreSQL untuk seluruh platform YakinLulus.

Dokumen ini wajib menjadi acuan seluruh Developer, DBA, Backend Engineer, DevOps, dan Data Engineer.

Tujuan:

- Konsistensi
- Skalabilitas
- Maintainability
- Readability
- Performance
- Security

---

# Database Standard

Database

PostgreSQL 17+

Encoding

UTF-8

Timezone

UTC

Timestamp Display

Dikonversi di Application Layer.

---

# Naming Convention

Semua menggunakan

snake_case

Benar

question

question_option

learning_resource

exam_session

user_answer

Salah

Question

QuestionTable

tblQuestion

QUESTION

---

# Table Naming

Gunakan

Singular

Benar

question

question_option

learning_resource

exam

user

organization

Salah

questions

tbl_questions

question_master

---

# Column Naming

Gunakan

snake_case

Contoh

id

question_id

created_at

updated_at

deleted_at

created_by

updated_by

question_code

---

# Primary Key

Nama

id

Datatype

UUID v7

Contoh

id UUID PRIMARY KEY

---

# Foreign Key

Pattern

entity_id

Contoh

user_id

subject_id

grade_id

organization_id

exam_id

question_id

---

# Business Identifier

Pattern

entity_code

Contoh

question_code

exam_code

organization_code

subject_code

Semua wajib UNIQUE.

---

# Public Identifier

Pattern

public_id

Contoh

QST-8A4XH7K2

USR-JM4D81PQ

EXM-T92AK8LM

Digunakan pada API dan URL publik.

---

# Audit Columns

Seluruh tabel wajib memiliki:

id

created_at

updated_at

created_by

updated_by

version

deleted_at

Opsional:

deleted_by

remarks

---

# Timestamp Rules

Datatype

TIMESTAMPTZ

Semua waktu disimpan UTC.

Tidak menggunakan

TIMESTAMP WITHOUT TIME ZONE.

---

# Boolean Naming

Gunakan prefix

is_

has_

can_

Contoh

is_active

is_correct

has_attachment

can_retry

---

# ENUM Strategy

Gunakan Lookup Table untuk data yang:

- sering berubah
- dikelola admin
- memiliki atribut tambahan

Gunakan PostgreSQL ENUM untuk data yang:

- stabil
- jarang berubah
- bagian dari logika sistem

Contoh ENUM

question_state

exam_state

media_state

---

# JSONB Strategy

Gunakan JSONB hanya untuk data semi-terstruktur.

Contoh

metadata

ocr_result

ai_response

device_info

browser_info

render_setting

Jangan gunakan JSONB untuk:

- Subject
- Grade
- Organization
- Question Option

---

# Array Strategy

Gunakan PostgreSQL ARRAY hanya bila:

- jumlah elemen kecil
- tidak memerlukan relasi
- tidak digunakan untuk filtering kompleks

Contoh

supported_language

---

# File Storage

Database hanya menyimpan:

path

checksum

mime_type

size

width

height

duration

File fisik berada di:

Object Storage (S3 Compatible)

---

# Soft Delete

Gunakan

deleted_at

TIMESTAMPTZ

Jangan menggunakan

is_deleted

---

# Versioning

Entity yang mendukung versioning:

Question

Learning Resource

Prompt

Template

Menggunakan

version

current_version

---

# Constraint Naming

Primary Key

pk_table

Foreign Key

fk_table_reference

Unique

uq_table_column

Check

ck_table_name

Index

idx_table_column

Contoh

pk_question

fk_question_subject

uq_user_email

idx_question_subject

---

# Index Strategy

Semua FK

INDEX

Semua UNIQUE

UNIQUE INDEX

Search

BTREE

JSONB

GIN

Full Text

GIN

Vector

HNSW

pgvector

---

# Partition Strategy

Partition hanya digunakan bila:

> 10 juta record

Target

analytics_event

audit_log

user_answer

login_log

activity_log

Partition

Monthly

---

# Junction Table

Pattern

entity_entity

Contoh

question_tag

teacher_subject

student_classroom

Primary Key

UUID

UNIQUE

(entity_a_id,
 entity_b_id)

---

# Lookup Table

Pattern

lk_

Contoh

lk_question_type

lk_difficulty

lk_bloom_level

lk_language

lk_media_type

---

# Master Table

Pattern

master_

Hanya digunakan untuk Master Data lintas domain.

Contoh

master_subject

master_grade

master_topic

master_curriculum

---

# Reserved Keywords

Jangan gunakan

user

order

group

select

table

index

Jika diperlukan:

app_user

exam_order

user_group

---

# Cascade Rules

Composition

ON DELETE CASCADE

Reference

ON DELETE RESTRICT

Optional

ON DELETE SET NULL

Snapshot

Tidak boleh CASCADE

---

# Transaction Rules

Dalam satu Domain

ACID Transaction

Lintas Domain

Event Driven

---

# Migration Rules

Semua perubahan schema menggunakan migration.

Tidak boleh edit database langsung di production.

Migration harus:

- reversible
- versioned
- tested

---

# Seed Rules

Pisahkan:

master_seed

development_seed

testing_seed

dummy_seed

---

# Search Strategy

Gunakan:

PostgreSQL Full Text Search

Untuk:

Question

Learning Resource

Explanation

AI Knowledge

---

# Cache Strategy

Redis

Untuk

Session

OTP

Rate Limit

Leaderboard

Frequently Accessed Master Data

---

# UUID Rules

Gunakan UUID v7.

Tidak menggunakan UUID v4 kecuali ada alasan khusus.

Tidak menggunakan SERIAL atau BIGSERIAL sebagai Primary Key.

---

# Security Rules

PII dienkripsi bila diperlukan.

Password

bcrypt / Argon2id

API Key

Hash

Token

Tidak disimpan plaintext.

---

# Performance Rules

Hindari

SELECT *

Gunakan

Pagination

LIMIT

INDEX

Prepared Statement

Batch Insert

Connection Pool

---

# Logging Rules

Semua perubahan penting dicatat.

Audit Log

Application Log

Access Log

Security Log

Import Log

AI Log

---

# Documentation Rules

Setiap tabel wajib memiliki:

- deskripsi
- owner domain
- lifecycle
- state machine
- index
- FK
- business rule

---

# Database Design Principles

1. Satu tabel hanya memiliki satu tanggung jawab (Single Responsibility).
2. Seluruh nama menggunakan snake_case.
3. Primary Key menggunakan UUID v7.
4. Foreign Key selalu mengacu pada Primary Key.
5. Business Code dipisahkan dari Primary Key.
6. JSONB hanya untuk data semi-terstruktur.
7. Soft Delete menggunakan deleted_at.
8. Audit column menjadi standar seluruh tabel.
9. Junction Table memiliki UUID dan UNIQUE composite.
10. Semua perubahan schema melalui migration.
11. Semua FK memiliki index.
12. Hindari trigger database untuk business logic.
13. Business logic ditempatkan pada Service Layer.
14. Gunakan CHECK Constraint untuk validasi sederhana di tingkat database.
15. Dokumentasikan setiap perubahan schema dalam changelog.