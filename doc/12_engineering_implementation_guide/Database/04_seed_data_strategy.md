```markdown id="r8n4vz"
# 12_engineering_implementation_guide/database/04_seed_data_strategy.md

# Database Seed Data Strategy

## 1. Tujuan

Dokumen ini menjelaskan strategi pengelolaan seed data database YakinLulus.id.

Seed data digunakan untuk menyediakan data awal yang diperlukan sistem agar dapat berjalan dengan benar pada setiap environment.

Target:

- development environment siap digunakan;
- testing environment memiliki data konsisten;
- staging memiliki representasi production;
- onboarding developer lebih cepat;
- deployment database reproducible.


---

# 2. Seed Data Principle


YakinLulus menggunakan prinsip:


```

Infrastructure as Code

*

Reproducible Environment

*

Controlled Initial Data

```


Artinya:

Database baru harus dapat dibuat dari kondisi kosong menjadi sistem siap digunakan hanya dengan:


```

Migration

*

Seed

```


---

# 3. Seed Data Architecture


Diagram:


```

```
             Database Setup


                   |

              Migration


                   |

          Database Structure


                   |

                Seed


                   |

          Initial Application Data


                   |

          Ready Environment
```

```


---

# 4. Seed Data Category


Seed data dibagi menjadi beberapa kategori:


```

Seed Data

|

+-- System Seed

|

+-- Security Seed

|

+-- Academic Seed

|

+-- Demo Seed

|

+-- Testing Seed

```


---

# 5. System Seed


System seed berisi konfigurasi dasar aplikasi.


Contoh:


```

Application Configuration

Feature Flag

System Parameter

Default Setting

````


Contoh:


```sql
system_config

id

key

value

description

````

---

# 6. Security Seed

Berisi:

```
Roles

Permissions

Role Permission Mapping

Default Policy

```

---

## Default Role

YakinLulus memiliki:

```
SUPER_ADMIN

ADMIN

STAFF

TEACHER

STUDENT

```

---

Contoh:

```sql
INSERT INTO roles
(
id,
name
)
VALUES
(
'uuid',
'SUPER_ADMIN'
);

```

---

# 7. Academic Master Seed

Data akademik dasar:

```
Education Level

Grade

Subject

Chapter

Curriculum

```

---

Contoh:

Education Level:

```
SD

SMP

SMA

SMK

UTBK

```

---

Grade:

```
Kelas 4

Kelas 5

Kelas 6

Kelas 7

...

Kelas 12

```

---

# 8. Subject Seed

Contoh:

SD:

```
Matematika

Bahasa Indonesia

IPA

IPS

```

SMA:

```
Matematika

Fisika

Kimia

Biologi

Bahasa Inggris

```

---

# 9. Question Bank Seed

Untuk development:

```
Sample Question

Question Category

Difficulty Level

Question Type

```

Contoh:

Difficulty:

```
EASY

MEDIUM

HARD

```

---

# 10. CBT Seed

Seed untuk testing CBT.

Berisi:

```
Sample Exam

Exam Configuration

Exam Rule

Question Pool

```

Contoh:

```
UTBK Simulation

Duration:

120 Minutes

Question:

50

```

---

# 11. Demo User Seed

Digunakan untuk development.

Contoh:

```
admin@yakinlulus.id

teacher@yakinlulus.id

student@yakinlulus.id

```

---

# 12. Password Seed Strategy

Tidak menggunakan password asli.

Gunakan:

```
Development Only Password

Environment Variable

Generated Hash

```

Contoh:

```
DEV_PASSWORD_HASH

```

---

# 13. Seed File Structure

Recommended:

```
database/


├── seeds/


│

├── system/

│   └── system_config.sql


├── security/

│   ├── roles.sql

│   └── permissions.sql


├── academic/

│   ├── education_level.sql

│   ├── grade.sql

│   └── subject.sql


├── demo/

│   ├── users.sql

│   └── questions.sql


└── test/

    └── exam_data.sql

```

---

# 14. Seed Execution Order

Urutan:

```
1. System Seed


        |


2. Security Seed


        |


3. Academic Seed


        |


4. User Seed


        |


5. Domain Seed


        |


6. Demo Data

```

---

# 15. Seed Dependency Management

Contoh:

```
Question


depends on


Subject


depends on


Education Level

```

Maka:

```
Education Level

        ↓

Subject

        ↓

Question

```

---

# 16. Development Seed Workflow

Developer:

```
Create Database


        |

Run Migration


        |

Run Seed


        |

Start Application

```

---

# 17. Environment Based Seed

Tidak semua seed masuk semua environment.

Matrix:

| Data            | Dev | Test | Staging  | Production |
| --------------- | --- | ---- | -------- | ---------- |
| Role            | ✅   | ✅    | ✅        | ✅          |
| Permission      | ✅   | ✅    | ✅        | ✅          |
| Academic Master | ✅   | ✅    | ✅        | ✅          |
| Demo User       | ✅   | ✅    | Optional | ❌          |
| Sample Question | ✅   | ✅    | Optional | ❌          |

---

# 18. Production Seed Strategy

Production hanya menerima:

```
Mandatory Master Data

System Configuration

Security Configuration

```

Tidak:

```
Demo User

Dummy Question

Testing Data

```

---

# 19. Seed Versioning

Seed juga harus version controlled.

Contoh:

```
seed_version


001_initial_roles

002_academic_master

003_exam_template

```

---

# 20. Idempotent Seed

Seed harus aman dijalankan ulang.

Buruk:

```sql
INSERT INTO roles VALUES(...);

```

Karena menyebabkan duplicate.

---

Lebih baik:

```sql
INSERT INTO roles
ON CONFLICT(name)
DO NOTHING;

```

---

# 21. Large Seed Data

Untuk data besar:

Contoh:

```
100.000 Questions

Millions Learning Material

```

Tidak menggunakan:

```
SQL Insert Manual

```

Gunakan:

```
Bulk Import

CSV Loader

ETL Pipeline

```

---

# 22. Question Bank Initial Import

Pipeline:

```
Excel Question Bank


        |

Validation


        |

Transformation


        |

Import Script


        |

Question Database

```

---

# 23. Seed Testing

Validasi:

## Structure Test

```
Migration

+

Seed

=

Valid Database

```

---

## Data Integrity Test

Check:

```
Foreign Key

Duplicate Data

Missing Reference

```

---

# 24. CI/CD Integration

Pipeline:

```
CI Start


 |

Create Database


 |

Run Migration


 |

Run Seed


 |

Execute Test


```

---

# 25. Backup Before Production Seed

Untuk perubahan besar:

```
Backup


        |

Seed Execution


        |

Validation


        |

Release

```

---

# 26. Future Scalability

## Phase 1

```
SQL Seed File

Manual Execution

```

---

## Phase 2

```
Automated Seed Pipeline

Environment Management

```

---

## Phase 3

```
Master Data Service

Dynamic Configuration Management

```

---

# Summary

Seed data strategy YakinLulus.id:

```
Version Controlled Seed

+

Environment Aware

+

Dependency Managed

+

Idempotent

+

Production Safe

```

Dengan strategi ini, setiap environment dapat dibuat secara konsisten dan siap digunakan oleh development, testing, maupun production.

