Berikut **09_exam_database_schema / 01_schema_design.md**.

Dokumen ini mendefinisikan rancangan logical schema untuk domain **Exam**. Desain ini menjadi penghubung antara:

* Question Bank;
* CBT Runtime;
* Scoring Engine;
* Analytics;
* Ranking.

Fokus utama desain:

* immutable exam attempt;
* snapshot question;
* mendukung randomization;
* mendukung offline CBT;
* siap scaling.

---

````markdown id="exs01sd"
# 01_schema_design.md

# YakinLulus.id Exam Schema Design

Module : Exam Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan desain schema
database untuk modul Exam.

Exam schema bertanggung jawab terhadap:

- definisi ujian;
- konfigurasi ujian;
- pemilihan soal;
- distribusi soal;
- sesi peserta;
- jawaban;
- hasil.

---

# 2. Schema Boundary

Exam menggunakan schema:

```
exam
```

---

Dependency:

```
public

    |

    users

    organizations


question_bank

    |

    questions

    question_versions


analytics

audit

```

---

# 3. Schema Structure

```
exam

├── exam_templates

├── exams

├── exam_sections

├── exam_settings

├── exam_schedules

├── exam_question_sets

├── exam_questions

├── exam_question_rules

├── exam_sessions

├── session_questions

├── student_answers

├── exam_results

├── exam_scores

└── exam_rankings

```

---

# 4. Core Design Pattern

Exam menggunakan pattern:

```
Aggregate Root

+

Snapshot Pattern

+

Immutable Attempt
```

---

# 5. Aggregate Root

Entity utama:

```
Exam
```

---

Relationship:

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

# 6. Exam Template Design

Template digunakan untuk reusable exam configuration.

Contoh:

```
UTBK Simulation Template

Weekly Tryout Template

School Exam Template
```

---

Relationship:

```
exam_template

        |

        |

        N

        |

        exam

```

---

# 7. Exam Entity Design

Exam menyimpan:

```
identity

metadata

lifecycle

ownership

visibility
```

---

Contoh attribute:

```
id

template_id

title

exam_type

status

created_by

published_at
```

---

# 8. Exam Lifecycle Model

State machine:

```
DRAFT

 |

READY

 |

PUBLISHED

 |

ACTIVE

 |

COMPLETED

 |

ARCHIVED

```

---

# 9. Exam Section Design

Section digunakan untuk ujian multi bagian.

Contoh:

UTBK:

```
TPS

|

Literasi

|

Numerasi

```

---

Relationship:

```
exam

1:N

sections

```

---

# 10. Exam Settings Design

Konfigurasi ujian.

Menyimpan:

```
duration

passing_score

attempt_limit

navigation_mode

show_result

randomization
```

---

Example:

```
duration = 120 minutes

random_question = true

allow_review = true

```

---

# 11. Question Mapping Design

Exam tidak menyimpan soal.

Menggunakan mapping:

```
exam_questions
```

---

Relationship:

```
exam

|

exam_questions

|

question_version

```

---

# 12. Question Snapshot Strategy

Saat exam dipublish:

System membuat snapshot.

```
question_version_id

+

question_order

+

answer_option_order

```

---

Tujuan:

Jika bank soal berubah:

```
Question Version 1

tetap digunakan
```

---

# 13. Question Selection Rule

Mendukung dua mode.

---

## Manual Selection

Admin memilih:

```
Question A

Question B

Question C

```

---

## Dynamic Selection

System memilih:

Rule:

```
subject

grade

difficulty

chapter

topic

count

```

---

# 14. Exam Question Rule Design

Entity:

```
exam_question_rules
```

---

Example:

```
Subject:

Matematika


Grade:

12


Difficulty:

MEDIUM


Count:

20

```

---

# 15. Session Design

Exam Session merepresentasikan attempt user.

---

Relationship:

```
Exam

 |

Exam Session

 |

Student

```

---

Session menyimpan:

```
start_time

end_time

status

device

sync_state
```

---

# 16. Session Lifecycle

```
CREATED

↓

STARTED

↓

IN_PROGRESS

↓

SUBMITTED

↓

GRADED

↓

COMPLETED
```

---

# 17. Session Question Design

Saat user mulai ujian:

System generate:

```
session_questions
```

---

Menyimpan:

```
question_version_id

sequence_number

random_order
```

---

# 18. Student Answer Design

Answer adalah immutable event.

---

Relationship:

```
session_question

        |

        |

student_answer

```

---

Menyimpan:

```
selected_option

answer_time

answered_at

confidence_level
```

---

# 19. Result Design

Result tidak dihitung langsung dari question.

Flow:

```
Answer

↓

Scoring Engine

↓

Result

```

---

# 20. Score Design

Memisahkan:

```
Raw Score

Final Score

Normalized Score
```

---

Contoh:

```
Correct Answer

+

Difficulty Weight

+

IRT Score

```

---

# 21. Ranking Design

Ranking dipisahkan.

Karena:

```
Score

!=

Ranking

```

---

Ranking dapat dihitung:

```
Per Exam

Per Class

Per School

Global
```

---

# 22. Offline Support Design

Session menyimpan:

```
offline_session_token

last_sync_at

sync_version

device_identifier

```

---

# 23. Multi Attempt Support

User dapat memiliki:

```
Attempt 1

Attempt 2

Attempt 3
```

---

Constraint:

```
Exam

+

User

+

Attempt Number

```

---

# 24. Security Model

Exam membutuhkan:

```
Access Control

Question Encryption

Session Validation

Attempt Verification

```

---

# 25. Audit Integration

Event penting:

```
EXAM_CREATED

EXAM_PUBLISHED

SESSION_STARTED

ANSWER_SUBMITTED

EXAM_FINISHED

RESULT_RELEASED
```

---

# 26. Analytics Integration

Event:

```
Exam Attempt

Question Response

Time Spent

Difficulty Performance
```

---

# 27. Future Ready Extension

Schema siap mendukung:

```
Adaptive Exam

AI Generated Test

Proctoring

Live Competition

Certification Exam
```

---

# 28. Final Schema Decision

Exam Database menggunakan:

```
Exam Aggregate

        +

Question Version Snapshot

        +

Immutable Student Attempt

        +

Separated Scoring

        +

Event Driven Analytics
```

---

# 29. Final Relationship

```
exam_templates

        |

        |

exams

        |

        +-------------+

        |             |

 sections       question_sets

                       |

                       |

                exam_questions

                       |

                       |

              question_version


exams

        |

        |

exam_sessions

        |

        |

session_questions

        |

        |

student_answers

        |

        |

exam_results

        |

        |

exam_scores

        |

        |

exam_rankings

```

---

# 30. Conclusion

Schema ini memastikan Exam module:

- aman terhadap perubahan soal;
- mendukung CBT skala besar;
- mendukung randomization;
- mendukung offline mode;
- siap integrasi analytics dan AI.
````

---

Status:

```text
09_exam_database_schema/

✅ 00_database_overview.md
✅ 01_schema_design.md
⬜ 02_table_specification.md
⬜ 03_index_strategy.md
⬜ 04_constraint_strategy.md
⬜ 05_migration_plan.md
⬜ 06_seed_data.md
⬜ 07_postgresql_ddl.sql
⬜ 08_erdiagram.md
```

Berikutnya:

**09_exam_database_schema / 02_table_specification.md**.
