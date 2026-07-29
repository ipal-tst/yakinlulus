Berikut **09_exam_database_schema / 06_seed_data.md**.

Dokumen ini mendefinisikan data awal (bootstrap data) yang diperlukan agar modul **Exam** dapat berjalan setelah deployment.

Seed data bukan transactional data, tetapi **reference/master data**.

---

````markdown id="ex06seed"
# 06_seed_data.md

# YakinLulus.id Exam Seed Data Specification

Module : Exam Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Seed data adalah data awal yang diperlukan
oleh Exam Service.

Tujuan:

- menyediakan default configuration;
- menyediakan reference value;
- mempercepat setup environment;
- menjaga konsistensi antar environment.

---

# 2. Seed Data Principle

Seed data harus:

```
Deterministic

Idempotent

Environment Safe

Version Controlled
```

---

# 3. Seed Data Classification

```
Exam Type

Exam Status

Session Status

Question Selection Type

Navigation Mode

Result Visibility

Scoring Type
```

---

# 4. Migration Seed Location

Struktur:

```
database/

seeds/

├── exam_type.sql

├── exam_status.sql

├── session_status.sql

├── question_selection.sql

├── scoring_type.sql

└── default_templates.sql

```

---

# 5. Exam Type Seed

Table:

```
exam_types
```

---

Data:

| Code | Name | Description |
|-|-|-|
| PRACTICE | Practice Exam | Latihan mandiri |
| TRYOUT | Try Out | Simulasi ujian |
| SCHOOL_TEST | School Test | Ujian sekolah |
| UTBK_SIMULATION | UTBK Simulation | Simulasi UTBK |
| PLACEMENT_TEST | Placement Test | Tes kemampuan awal |

---

SQL:

```sql
INSERT INTO exam.exam_types
(
code,
name
)
VALUES
(
'PRACTICE',
'Practice Exam'
),
(
'TRYOUT',
'Try Out'
),
(
'SCHOOL_TEST',
'School Test'
),
(
'UTBK_SIMULATION',
'UTBK Simulation'
),
(
'PLACEMENT_TEST',
'Placement Test'
);
```

---

# 6. Exam Status Seed

Table:

```
exam_statuses
```

---

Values:

```
DRAFT

READY

PUBLISHED

ACTIVE

COMPLETED

ARCHIVED
```

---

SQL:

```sql
INSERT INTO exam.exam_statuses
(code)
VALUES

('DRAFT'),

('READY'),

('PUBLISHED'),

('ACTIVE'),

('COMPLETED'),

('ARCHIVED');
```

---

# 7. Session Status Seed

Table:

```
session_statuses
```

---

Values:

```
CREATED

STARTED

IN_PROGRESS

SUBMITTED

GRADED

COMPLETED

EXPIRED
```

---

SQL:

```sql
INSERT INTO exam.session_statuses
(code)
VALUES

('CREATED'),

('STARTED'),

('IN_PROGRESS'),

('SUBMITTED'),

('GRADED'),

('COMPLETED'),

('EXPIRED');
```

---

# 8. Question Selection Type Seed

Table:

```
question_selection_types
```

---

Values:

| Code | Description |
|-|-|
| MANUAL | Admin memilih soal |
| RANDOM | System memilih soal |
| HYBRID | Gabungan |

---

SQL:

```sql
INSERT INTO exam.question_selection_types
(code)
VALUES

('MANUAL'),

('RANDOM'),

('HYBRID');
```

---

# 9. Difficulty Distribution Seed

Digunakan untuk random selection.

Table:

```
difficulty_profiles
```

---

Example:

## Easy Profile

```
Easy

70%

Medium

20%

Hard

10%
```

---

## Normal Profile

```
Easy

30%

Medium

50%

Hard

20%
```

---

## Hard Profile

```
Easy

10%

Medium

40%

Hard

50%
```

---

# 10. Navigation Mode Seed

Table:

```
navigation_modes
```

---

Values:

```
FREE

SEQUENTIAL

SECTION_LOCKED
```

---

Description:

| Mode | Behavior |
|-|-|
| FREE | Bebas pindah soal |
| SEQUENTIAL | Tidak bisa kembali |
| SECTION_LOCKED | Terkunci per section |

---

# 11. Result Visibility Seed

Table:

```
result_visibility_modes
```

---

Values:

```
IMMEDIATE

AFTER_SUBMIT

SCHEDULED

MANUAL_RELEASE
```

---

Description:

```
IMMEDIATE

↓

langsung tampil


SCHEDULED

↓

tampil waktu tertentu

```

---

# 12. Scoring Type Seed

Table:

```
scoring_types
```

---

Values:

```
RAW_SCORE

PERCENTAGE

WEIGHTED_SCORE

IRT_SCORE
```

---

# 13. Default Exam Templates

Table:

```
exam_templates
```

---

## Template 1

Name:

```
Daily Practice
```

Configuration:

```json
{
 "duration_minutes":30,
 "navigation":"FREE",
 "random_question":true,
 "show_result":"IMMEDIATE"
}
```

---

## Template 2

Name:

```
Weekly Tryout
```

Configuration:

```json
{
 "duration_minutes":120,
 "navigation":"FREE",
 "random_question":true,
 "show_result":"AFTER_SUBMIT"
}
```

---

## Template 3

Name:

```
UTBK Simulation
```

Configuration:

```json
{
 "duration_minutes":180,
 "navigation":"SECTION_LOCKED",
 "random_question":true,
 "show_result":"SCHEDULED"
}
```

---

# 14. Default CBT Configuration

Table:

```
exam_settings
```

Default:

```json
{
"allow_review":true,
"random_option":true,
"prevent_multiple_session":true,
"auto_submit":true
}
```

---

# 15. Default Ranking Configuration

Table:

```
ranking_configs
```

---

Values:

```json
{
"ranking_scope":[
"GLOBAL",
"SCHOOL",
"CLASS"
],
"sort":[
"SCORE_DESC",
"TIME_ASC"
]
}
```

---

# 16. Development Seed Data

Development environment:

Tambahkan:

```
Demo User

Demo Exam

Demo Questions

Demo Session

Demo Result
```

---

Example:

```
Demo Exam:

Matematika Kelas 12

40 Questions

Duration 60 Minutes
```

---

# 17. Production Seed Restriction

Production tidak boleh memiliki:

```
Dummy Exam

Dummy Student

Fake Result
```

---

# 18. Seed Execution Order

Urutan:

```
1. Exam Type

2. Status

3. Selection Type

4. Navigation Mode

5. Result Mode

6. Scoring Type

7. Templates

8. Default Configuration
```

---

# 19. Seed Management

Seed menggunakan:

```
INSERT ... ON CONFLICT
```

agar idempotent.

---

Example:

```sql
INSERT INTO exam.exam_types
(code,name)

VALUES
(
'TRYOUT',
'Try Out'
)

ON CONFLICT(code)

DO UPDATE SET
name=EXCLUDED.name;
```

---

# 20. Environment Strategy

## Development

```
Full seed

+
demo data
```

---

## Staging

```
Reference seed only
```

---

## Production

```
Reference seed only
```

---

# 21. Future Seed Extension

Akan ditambahkan:

```
Adaptive Test Profile

IRT Configuration

AI Exam Template

Certification Template
```

---

# 22. Final Seed Architecture

```
Reference Data

        |

        |

Exam Service

        |

        |

CBT Runtime

        |

        |

Analytics

```

---

# 23. Conclusion

Seed strategy memastikan:

- environment konsisten;
- deployment repeatable;
- konfigurasi CBT standar;
- mudah onboarding developer baru.
````

---

Status:

```text
09_exam_database_schema/

✅ 00_database_overview.md
✅ 01_schema_design.md
✅ 02_table_specification.md
✅ 03_index_strategy.md
✅ 04_constraint_strategy.md
✅ 05_migration_plan.md
✅ 06_seed_data.md
⬜ 07_postgresql_ddl.sql
⬜ 08_erdiagram.md
```

Berikutnya:

**09_exam_database_schema / 07_postgresql_ddl.sql**.
