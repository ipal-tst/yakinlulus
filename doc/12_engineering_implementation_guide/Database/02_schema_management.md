```markdown id="k2v8mz"
# 12_engineering_implementation_guide/database/02_schema_management.md

# Database Schema Management

## 1. Tujuan

Dokumen ini menjelaskan strategi pengelolaan database schema YakinLulus.id.

Schema management bertujuan memastikan:

- perubahan database terkontrol;
- struktur database konsisten antara environment;
- development team dapat bekerja paralel;
- deployment database aman;
- rollback tersedia ketika terjadi kegagalan.


Database schema merupakan kontrak antara:

```

Backend Application

```
    |
```

Repository Layer

```
    |
```

Database Structure

```

Perubahan schema harus mengikuti engineering workflow yang jelas.

---

# 2. Schema Management Principle


YakinLulus menggunakan prinsip:


```

Database as Code

*

Version Controlled Schema

*

Migration Driven Development

```

Artinya:

database structure diperlakukan seperti source code.


Tidak diperbolehkan:

```

Manual ALTER TABLE Production

Manual CREATE TABLE

Direct Database Modification

```


---

# 3. Schema Architecture


High level:

```

```
            PostgreSQL Database


                   |

             Schema Layer


    +--------------+--------------+

    |              |              |

Domain Schema  Support Schema  System Schema


    |

    +----------------------------+

    |                            |
```

Academic Domain              Application Domain

```

---

# 4. PostgreSQL Schema Organization


YakinLulus menggunakan PostgreSQL namespace:


```

public

auth

academic

question_bank

learning

exam

cbt

analytics

notification

media

system

```

---

# 5. Schema Responsibility


## auth Schema


Mengelola:


```

users

roles

permissions

sessions

authentication_logs

```

---

## academic Schema


Mengelola:


```

education_level

grade

subject

chapter

curriculum

```

---

## question_bank Schema


Mengelola:


```

questions

question_options

question_versions

question_tags

question_reviews

```

---

## learning Schema


Mengelola:


```

materials

material_sections

resources

student_progress

```

---

## exam Schema


Mengelola:


```

exam_definition

exam_question_pool

exam_schedule

exam_configuration

```

---

## cbt Schema


Runtime:


```

exam_sessions

session_questions

student_answers

submission

score

```

---

# 6. Schema Naming Convention


## Schema Name


Format:


```

lowercase_snake_case

```


Contoh:


```

question_bank

learning_material

```

---

## Table Name


Format:


```

plural_snake_case

```


Contoh:


```

students

questions

exam_sessions

```

---

## Column Name


Format:


```

snake_case

```


Contoh:


```

created_at

question_id

difficulty_level

```

---

# 7. Table Classification


Setiap table dikategorikan:


## Master Table


Data referensi:


```

subject

grade

role

permission

```

Karakteristik:

- jarang berubah;
- digunakan banyak domain.


---

## Transaction Table


Data aktivitas:


```

exam_session

answer

learning_progress

```

Karakteristik:

- high write;
- memiliki lifecycle.


---

## Log Table


Audit dan tracking:


```

activity_log

notification_log

sync_log

```

Karakteristik:

- append only;
- growth tinggi.


---

# 8. Entity Ownership


Setiap domain memiliki owner.


Contoh:


```

Question Bank Domain

Owner:

question_bank schema

Owns:

questions

question_versions

question_metadata

```

---

CBT:


```

CBT Domain

Owner:

cbt schema

Owns:

sessions

answers

submission

```

---

# 9. Cross Domain Reference


Aturan:


Domain boleh reference:

```

Primary Key Reference

```

Tetapi tidak boleh:


```

Direct Business Logic Dependency

```

Contoh:


Benar:


```

cbt.exam_session

references

auth.users

```

Tidak benar:


```

CBT Query

langsung menghitung

Question Bank Business Rule

```

---

# 10. Migration Management


Semua perubahan menggunakan migration.


Flow:


```

Developer Change Schema

```
    |
```

Create Migration

```
    |
```

Code Review

```
    |
```

Test Environment

```
    |
```

Staging

```
    |
```

Production

```

---

# 11. Migration Naming Convention


Format:


```

YYYYMMDD_description.sql

```


Contoh:


```

20260726_create_question_table.sql

20260727_add_exam_duration.sql

```

---

# 12. Migration Structure


Contoh:


```

migration/

├── 001_initial_schema.sql

├── 002_create_users.sql

├── 003_create_question_bank.sql

├── 004_create_exam.sql

````

---

# 13. Migration Rules


## Rule 1

Migration tidak boleh menghapus data langsung.


Buruk:


```sql
DROP TABLE questions;

````

---

Lebih aman:

```sql
ALTER TABLE questions
ADD COLUMN archived BOOLEAN;

```

---

## Rule 2

Breaking change harus bertahap.

Contoh:

Versi lama:

```
full_name

```

Versi baru:

```
first_name

last_name

```

Strategi:

```
Add Column

Copy Data

Update Application

Remove Old Column

```

---

# 14. Schema Version Tracking

Database menyimpan:

```
schema_migrations

```

Contoh:

```
id

migration_name

executed_at

checksum

```

---

# 15. Development Workflow

Developer:

```
Modify Schema


        |

Generate Migration


        |

Run Local Database


        |

Run Test


        |

Commit

```

---

# 16. Environment Synchronization

Environment:

```
Development

        |

Testing

        |

Staging

        |

Production

```

Semua menggunakan migration yang sama.

---

# 17. Database Reset Strategy

Development:

```
Drop Database

        |

Run All Migration

        |

Run Seed

```

Digunakan untuk:

* testing;
* onboarding developer baru.

---

# 18. Seed Data Management

Seed dipisahkan:

```
seed/

├── roles.sql

├── academic_master.sql

├── permissions.sql

```

---

# 19. Production Schema Change

Production deployment:

```
Backup Database


        |

Apply Migration


        |

Verify Schema


        |

Monitor Application

```

---

# 20. Zero Downtime Schema Migration

Untuk perubahan besar:

```
Expand

        |

Migrate Data

        |

Switch Application

        |

Contract

```

---

Contoh:

Tambah kolom baru:

```
ALTER TABLE answers

ADD COLUMN answer_metadata JSONB;

```

Aplikasi lama tetap berjalan.

---

# 21. Schema Documentation

Setiap domain harus memiliki:

```
ERD

Table Specification

Column Description

Relationship

Index Information

```

---

# 22. Database Review Checklist

Sebelum merge:

```
✅ Naming Convention

✅ Foreign Key

✅ Index Required

✅ Migration Tested

✅ Rollback Plan

✅ Performance Impact

```

---

# 23. Schema Testing

Test:

## Migration Test

```
Fresh Database

Run Migration

Verify Structure

```

---

## Upgrade Test

```
Old Version Database

Apply Migration

Verify Data

```

---

## Rollback Test

```
Migration Failed

Rollback

Restore State

```

---

# 24. Future Scalability

## Phase 1

```
Single PostgreSQL

Multiple Schema

Migration Controlled

```

---

## Phase 2

```
Read Replica

Analytics Database Separation

```

---

## Phase 3

```
Domain Database Split

Question Service Database

CBT Runtime Database

AI Vector Database

```

---

# Summary

Schema management YakinLulus.id menggunakan:

```
Domain Based Schema

+

Migration Driven Development

+

Version Controlled Database

+

Controlled Production Change

+

Scalable Domain Separation

```

Dengan pendekatan ini database tetap mudah dikembangkan dari MVP hingga platform EdTech skala besar.

