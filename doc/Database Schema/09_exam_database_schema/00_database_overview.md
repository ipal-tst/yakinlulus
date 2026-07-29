Kita mulai modul berikutnya:

# 09_exam_database_schema

## 00_database_overview.md

Dokumen ini mendefinisikan **database architecture untuk Exam Domain** YakinLulus.id.

Modul Exam merupakan layer yang menghubungkan:

```
Question Bank

        ↓

Exam Builder

        ↓

CBT Runtime

        ↓

Exam Session

        ↓

Scoring

        ↓

Analytics
```

Exam tidak menyimpan konten soal secara langsung. Exam hanya melakukan **referencing dan snapshot terhadap question version** agar hasil ujian tetap immutable.

---

````markdown id="e09ov1"
# 00_database_overview.md

# YakinLulus.id Exam Database Overview

Module : Exam Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan desain database
untuk modul Exam YakinLulus.id.

Exam module bertanggung jawab terhadap:

- pembuatan ujian;
- konfigurasi ujian;
- pemilihan soal;
- distribusi soal;
- sesi peserta;
- jawaban peserta;
- scoring;
- hasil ujian.

---

# 2. Domain Position

Exam berada di antara.

```
Question Bank

        |

        |

Exam System

        |

        |

CBT Runtime

        |

        |

Analytics

```

---

# 3. Design Principle

Database Exam menggunakan prinsip:

```
Reference

+

Snapshot

+

Immutable Result

+

Auditability
```

---

# 4. Important Design Decision

## Exam tidak menyimpan question content langsung.

Relasi:

```
Exam

 |

 |

Exam Questions

 |

 |

Question Version

```

---

Alasan:

Jika soal berubah:

```
Question Version 1

↓

Question Version 2
```

Exam lama tetap menggunakan:

```
Version 1
```

---

# 5. Database Responsibility

Exam Database menangani:

## Exam Definition

Menyimpan definisi ujian.

Contoh:

```
UTBK Simulation 2026

Matematika Kelas 12

Try Out Mingguan
```

---

## Exam Configuration

Mengatur:

```
Duration

Passing Score

Question Count

Randomization

Result Visibility
```

---

## Question Selection

Mengatur:

```
Manual Selection

Random Selection

Difficulty Distribution

Taxonomy Filter
```

---

## Exam Session

Runtime peserta:

```
Start Time

End Time

Status

Device

Progress
```

---

## Answer Storage

Menyimpan:

```
Selected Answer

Answer Time

Review Flag

Confidence
```

---

## Result

Menghasilkan:

```
Score

Ranking

Analysis

Recommendation
```

---

# 6. Schema Structure

Database menggunakan schema:

```
exam
```

---

Tambahan dependency:

```
question_bank

public

analytics

audit
```

---

# 7. High Level Table Group

## Exam Definition

```
exams

exam_templates

exam_sections

```

---

## Question Mapping

```
exam_question_sets

exam_questions

exam_question_rules
```

---

## Runtime

```
exam_sessions

session_questions

student_answers
```

---

## Result

```
exam_results

exam_scores

exam_rankings
```

---

## Configuration

```
exam_settings

exam_schedules
```

---

# 8. Entity Overview

## Exam

Aggregate root.

```
Exam

|

+-- Sections

|

+-- Question Set

|

+-- Sessions

|

+-- Results

```

---

# 9. Exam Lifecycle

State:

```
DRAFT

↓

READY

↓

PUBLISHED

↓

ONGOING

↓

FINISHED

↓

ARCHIVED

```

---

# 10. Exam Types

Support:

```
PRACTICE

TRYOUT

SCHOOL_TEST

UTBK_SIMULATION

PLACEMENT_TEST
```

---

# 11. Question Selection Model

Exam mendukung.

## Fixed Question

Admin menentukan soal.

```
Exam

+

Question IDs
```

---

## Random Question

System memilih.

Contoh:

```
Matematika

Class 12

40 Questions

Difficulty:

10 Easy

20 Medium

10 Hard

```

---

# 12. CBT Runtime Relationship

```
Exam

 |

Exam Session

 |

Session Question

 |

Student Answer

```

---

# 13. Result Integrity

Result menyimpan reference.

```
student_answer

        |

question_version

```

Bukan:

```
question
```

---

# 14. Multi Platform Support

Database mendukung:

```
Web CBT

Mobile CBT

Tablet CBT

Offline CBT Sync

```

---

# 15. Offline Exam Support

Session harus menyimpan:

```
last_sync_time

sync_status

device_id

offline_token
```

---

# 16. Performance Consideration

High traffic table:

```
exam_sessions

student_answers

session_questions
```

---

Strategi:

```
Index

Partition

Caching

Async Processing
```

---

# 17. Security Consideration

Exam membutuhkan:

```
Access Control

Question Protection

Attempt Validation

Anti Duplicate Session

Audit Trail
```

---

# 18. Data Retention

Operational:

```
Active Exam

1 year
```

Historical:

```
Archived Exam

5+ years
```

---

# 19. Future Extension

Disiapkan untuk:

```
Adaptive Testing

AI Generated Exam

Proctoring

Live Competition

Certification

```

---

# 20. Integration

Exam terhubung dengan:

## Question Bank

Untuk sumber soal.

---

## User Management

Untuk peserta.

---

## Notification

Untuk reminder.

---

## Analytics

Untuk performance analysis.

---

## AI

Untuk recommendation.

---

# 21. Final Architecture Decision

Exam Database menggunakan:

```
Normalized Relational Model

        +

Question Version Reference

        +

Immutable Attempt Data

        +

Event Ready Design

```

---

# 22. Target Scale

MVP:

```
Users       : 10-100

Questions   : 10.000

Exam/month  : 100
```

---

Production:

```
Users       : 1.000.000+

Questions   : 10.000.000+

Exam/month  : 1.000.000+
```

---

# 23. Summary

Exam Database menjadi fondasi:

- CBT Engine;
- Try Out;
- UTBK Simulation;
- School Exam;
- Ranking System;
- Learning Analytics.

Database harus menjaga:

```
Accuracy

Consistency

Security

Scalability
```
````

---

Status:

```
09_exam_database_schema/

✅ 00_database_overview.md
⬜ 01_schema_design.md
⬜ 02_table_specification.md
⬜ 03_index_strategy.md
⬜ 04_constraint_strategy.md
⬜ 05_migration_plan.md
⬜ 06_seed_data.md
⬜ 07_postgresql_ddl.sql
⬜ 08_erdiagram.md
```

Selanjutnya:

**09_exam_database_schema / 01_schema_design.md**.
