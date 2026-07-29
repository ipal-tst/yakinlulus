Berikut **09_exam_database_schema / 08_erdiagram.md**.

Dokumen ini menjadi penutup modul **Exam Database Schema** dan menggambarkan hubungan antar entity secara lengkap.

---

````markdown id="ex08erd"
# 08_erdiagram.md

# YakinLulus.id Exam Entity Relationship Diagram

Module : Exam Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Dokumen ini menjelaskan ERD modul Exam.

ERD mencakup:

- Exam Definition
- Question Mapping
- CBT Runtime
- Answer Processing
- Scoring
- Ranking

---

# 2. High Level Architecture

```

                 QUESTION BANK
                       |
                       |
                       |
             question_versions
                       |
                       |
                       v


                  EXAM DOMAIN


        +-----------------------+
        |    exam_templates     |
        +-----------+-----------+
                    |
                    |
                    v

        +-----------------------+
        |        exams          |
        +-----------+-----------+
                    |
        +-----------+-------------+
        |                         |
        v                         v


 exam_sections             exam_settings


        |
        |
        v


 exam_questions

        |

        |

 question_version_id



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

# 3. Core Aggregate ERD

Entity utama:

```
Exam
```

---

Relationship:

```
Exam

1:N

Exam Section


Exam

1:1

Exam Settings


Exam

1:N

Exam Questions


Exam

1:N

Exam Sessions


Exam

1:N

Exam Results

```

---

# 4. Exam Definition ERD

```

exam_templates

        |

        | 1:N

        |

       exams

        |

        +----------------+

        |                |

        |                |

exam_sections     exam_settings


        |

        |

exam_schedules


```

---

## Description

### exam_templates

Reusable configuration.

---

### exams

Actual exam instance.

---

### exam_sections

Pembagian ujian.

Contoh:

```
TPS

Literasi

Numerasi

```

---

### exam_settings

Runtime configuration.

---

### exam_schedules

Exam availability period.

---

# 5. Question Mapping ERD

```

                question_bank

                     |

                     |

             question_versions


                     |

                     |

                     v


              exam_questions


                     ^

                     |

                     |

                exams


```

---

Relationship:

```
exam

1:N

exam_questions


exam_question

N:1

question_version

```

---

# 6. Dynamic Question Selection ERD

```

             exams

               |

               |

     exam_question_sets

               |

               |

     exam_question_rules


               |

               |

       Question Bank Filter


               |

               |

       Generated Questions

```

---

Rule example:

```
Subject:

Matematika


Grade:

12


Difficulty:

Medium


Count:

20

```

---

# 7. CBT Runtime ERD

```

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


```

---

## Relationship

```
Exam

1:N

Session


Session

1:N

Session Question


Session Question

1:1

Student Answer

```

---

# 8. Student Attempt Model

Satu siswa:

```
User

 |

 |

Exam Session

 |

 |

Attempt Number

```

---

Contoh:

```
User A

Exam X

Attempt 1


User A

Exam X

Attempt 2

```

---

# 9. Answer Flow ERD

```

session_questions

        |

        |

student_answers

        |

        |

answer_events


```

---

Perbedaan:

## student_answers

Current answer state.

---

## answer_events

History perubahan.

---

Contoh:

```
10:01

Select A


10:02

Change B


10:03

Change C

```

---

# 10. Scoring ERD

```

student_answers


        |

        |

 Scoring Engine


        |

        |

 exam_results


        |

        |

 exam_scores


```

---

Relationship:

```
Session

1:1

Result


Result

1:N

Score Detail

```

---

# 11. Ranking ERD

```

exam_results

        |

        |

exam_rankings


        |

        |

ranking_snapshot

```

---

Ranking dapat dihitung berdasarkan:

```
Score

Completion Time

Difficulty Weight

IRT Score

```

---

# 12. Complete Logical ERD

```

                 exam_templates

                        |

                        |

                      exams

                        |

        +---------------+----------------+

        |               |                |

        v               v                v


 exam_sections   exam_settings   exam_schedules



                        |

                        |

                 exam_questions

                        |

                        |

             question_versions



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

# 13. Cardinality Summary

| Relationship | Cardinality |
|-|-|
| Template → Exam | 1:N |
| Exam → Section | 1:N |
| Exam → Setting | 1:1 |
| Exam → Schedule | 1:N |
| Exam → Question | 1:N |
| Exam → Session | 1:N |
| Session → Session Question | 1:N |
| Session Question → Answer | 1:1 |
| Session → Result | 1:1 |
| Result → Score | 1:N |
| Exam → Ranking | 1:N |

---

# 14. Delete Dependency

## Protected Chain

Tidak boleh cascade:

```
Exam

 |

Session

 |

Answer

 |

Result

```

---

## Safe Cascade

Boleh:

```
Exam

 |

Sections


Exam

 |

Settings


Exam

 |

Question Rules

```

---

# 15. Immutable Data Boundary

Data immutable:

```
session_questions

student_answers

exam_results

```

---

Tujuan:

Menjamin:

```
Academic Integrity

Auditability

Reproducibility

```

---

# 16. Event Relationship

Exam menghasilkan event:

```
Exam Created

Exam Published

Session Started

Question Loaded

Answer Submitted

Exam Finished

Result Generated

Ranking Updated

```

---

Event digunakan oleh:

```
Analytics

Notification

AI Recommendation

```

---

# 17. Future Extension ERD

Siap ditambahkan:

```

              Adaptive Engine

                     |

                     |

                 Exam Session


             


              AI Generated Exam

                     |

                     |

                    Exam


             


              Proctoring

                     |

                     |

                Exam Session


```

---

# 18. Final Database Model

```
                EXAM DOMAIN


        Definition Layer

        |
        |
        v

        Runtime Layer

        |
        |
        v

        Answer Layer

        |
        |
        v

        Result Layer

        |
        |
        v

        Analytics Layer


```

---

# 19. Final Decision

Exam Database menggunakan:

```
Aggregate Root

+

Question Version Reference

+

Runtime Snapshot

+

Immutable Attempt Record

+

Separated Scoring Model

+

Event Ready Architecture

```

---

# 20. Conclusion

Dengan desain ERD ini:

- CBT dapat berjalan aman;
- soal tetap konsisten;
- attempt dapat diaudit;
- hasil dapat direproduksi;
- ranking dapat dihitung ulang;
- database siap scale ke platform EdTech besar.

````

---

## Status Modul 09_exam_database_schema

```text
09_exam_database_schema/

✅ 00_database_overview.md
✅ 01_schema_design.md
✅ 02_table_specification.md
✅ 03_index_strategy.md
✅ 04_constraint_strategy.md
✅ 05_migration_plan.md
✅ 06_seed_data.md
✅ 07_postgresql_ddl.sql
✅ 08_erdiagram.md
```

Modul **Exam Database Schema selesai**.

Tahap berikutnya yang paling sesuai dalam arsitektur YakinLulus.id:

```
10_cbt_runtime_database_schema
```

karena:

```
Question Bank
      |
      |
Exam
      |
      |
CBT Runtime
      |
      |
Analytics
```

Selanjutnya masuk ke **10_cbt_runtime_database_schema / 00_database_overview.md**.
