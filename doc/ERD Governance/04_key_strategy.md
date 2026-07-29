# YakinLulus.id

# 04_key_strategy.md

Version : 1.0

Status : Draft

---

# Purpose

Dokumen ini mendefinisikan standar penggunaan seluruh jenis Key pada database YakinLulus.

Tujuan:

- Konsistensi Database
- Skalabilitas
- Integrasi API
- Kemudahan Migrasi
- High Performance PostgreSQL
- Multi Service Ready

Dokumen ini menjadi acuan seluruh desain ERD dan implementasi PostgreSQL.

---

# Key Principles

## Rule 1

Semua tabel wajib memiliki Primary Key.

Tidak ada tabel tanpa Primary Key.

---

## Rule 2

Primary Key tidak boleh memiliki arti bisnis.

Primary Key hanya sebagai identifier internal.

---

## Rule 3

Business Identifier dipisahkan dari Primary Key.

---

## Rule 4

Foreign Key selalu mengacu pada Primary Key.

Bukan Business Key.

---

## Rule 5

Business Code boleh berubah.

Primary Key tidak boleh berubah.

---

# Key Types

Platform menggunakan lima jenis Key.

---

=================================================

1. Primary Key

=================================================

Purpose

Identifier internal.

Datatype

UUID

Example

id

UUID

Example Value

550e8400-e29b-41d4-a716-446655440000

Business Rules

Immutable

Unique

Not Null

Tidak memiliki arti bisnis.

Digunakan oleh seluruh FK.

---

=================================================

2. Foreign Key

=================================================

Purpose

Menghubungkan Entity.

Naming

table_name_id

Examples

question_id

subject_id

organization_id

user_id

Datatype

UUID

Business Rules

Mengacu ke Primary Key.

---

=================================================

3. Business Key

=================================================

Purpose

Identifier yang dipahami manusia.

Examples

Question Code

Exam Code

Organization Code

Subject Code

Candidate Column

question_code

exam_code

organization_code

Business Rules

Unique

Boleh berubah.

Tidak digunakan sebagai FK.

---

=================================================

4. Public ID

=================================================

Purpose

Identifier yang aman untuk API dan URL.

Examples

QST-A7X9M3K2

USR-Z81PQ7L5

EXM-N2W8C6D1

Business Rules

Tidak berurutan.

Sulit ditebak.

Boleh diregenerasi sesuai kebijakan.

---

=================================================

5. External ID

=================================================

Purpose

Identifier dari sistem luar.

Examples

Legacy System

Excel Import

Kemendikbud

LMS Lama

Business Rules

Optional.

Tidak Unique secara global.

---

# UUID Strategy

Semua Primary Key menggunakan

UUID Version 7

Alasan

- Time Ordered
- Lebih cepat di Index PostgreSQL
- Mengurangi Fragmentasi B-Tree
- Cocok untuk Distributed System
- Mendukung Offline Insert
- Skalabel untuk Multi Region

Contoh

0197d6ef-a2ab-73c4-b0ef-4e8fd66d7d6f

---

# Naming Convention

Primary Key

id

Foreign Key

entity_id

Examples

user_id

question_id

subject_id

chapter_id

organization_id

Tidak menggunakan

userid

UserID

questionID

tblQuestionID

---

# Composite Key

Default

Tidak digunakan sebagai Primary Key.

Composite hanya digunakan untuk:

Unique Constraint

Examples

student_id

classroom_id

academic_year_id

UNIQUE

(student_id,
classroom_id,
academic_year_id)

---

# Natural Key

Natural Key tidak digunakan sebagai Primary Key.

Examples

NIS

NISN

NPSN

Email

Username

Semua hanya menjadi Candidate Key.

---

# Candidate Key

Contoh

Email

Username

NISN

Organization Code

Subject Code

Question Code

Semua menggunakan

UNIQUE INDEX

---

# Surrogate Key

Semua tabel menggunakan

UUID

Sebagai Surrogate Key.

---

# Junction Table Strategy

Primary Key

UUID

Ditambah

Unique Composite

Contoh

question_tags

id

question_id

tag_id

UNIQUE

(question_id, tag_id)

---

# Public API Strategy

Semua endpoint API menggunakan:

Public ID

atau

UUID

Tidak menggunakan Auto Increment.

---

# Import Strategy

Saat import Excel.

Sistem menggunakan:

External ID

↓

Mapping

↓

UUID Internal

Dengan demikian data lama tetap dapat ditelusuri.

---

# Index Strategy

Primary Key

PRIMARY INDEX

Business Code

UNIQUE INDEX

Email

UNIQUE INDEX

Username

UNIQUE INDEX

Foreign Key

INDEX

Search Column

BTREE INDEX

JSONB

GIN INDEX

Full Text

GIN INDEX

Vector

HNSW / IVFFLAT

(PostgreSQL pgvector)

---

# Constraint Rules

Primary Key

NOT NULL

UNIQUE

Foreign Key

REFERENCES

Unique Code

UNIQUE

Business Code

CHECK Constraint bila diperlukan.

---

# Reserved Columns

Seluruh tabel wajib memiliki:

id

created_at

updated_at

created_by

updated_by

deleted_at

version

status

remarks

---

# Audit Strategy

created_by

↓

User.id

updated_by

↓

User.id

deleted_by

↓

User.id

Semua menggunakan UUID.

---

# Soft Delete

Menggunakan:

deleted_at

TIMESTAMP

Tidak menggunakan:

is_deleted

Alasan:

- Menyimpan waktu penghapusan.
- Memudahkan pemulihan data.
- Mempermudah audit.

---

# Versioning

Entity yang mendukung versioning memiliki:

version

INTEGER

current_version

BOOLEAN

Contoh

Question

Learning Resource

Prompt AI

---

# Key Design Principles

1. Semua tabel menggunakan UUIDv7 sebagai Primary Key.

2. Semua FK mengacu ke UUID Primary Key.

3. Business Code dipisahkan dari Primary Key.

4. Public ID digunakan untuk URL dan API eksternal.

5. External ID digunakan hanya untuk integrasi dan migrasi.

6. Composite Key hanya untuk UNIQUE Constraint, bukan Primary Key.

7. Natural Key tidak dijadikan Primary Key.

8. Semua FK wajib diberi index.

9. Semua tabel wajib memiliki audit column.

10. Semua identifier menggunakan snake_case.