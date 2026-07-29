```markdown id="d8x91p"
# 11_data_ownership_matrix.md

# Data Ownership Matrix

## YakinLulus Platform

Version : 1.0

---

# 1. Tujuan

Dokumen ini mendefinisikan kepemilikan data pada setiap domain YakinLulus.

Tujuan:

- Menentukan single source of truth.
- Menghindari duplikasi data.
- Menentukan siapa yang boleh membuat data.
- Menentukan siapa yang boleh membaca data.
- Menentukan batas perubahan data.
- Menjadi referensi database architecture.
- Menjadi referensi API ownership.
- Menjadi referensi pengembangan backend.

---

# 2. Prinsip Data Ownership

YakinLulus menggunakan prinsip:

```

Single Source of Truth

```

Artinya:

Satu data bisnis hanya memiliki satu pemilik.

---

Contoh:

```

Question

```

Owner:

```

Question Bank Domain

```

Bukan:

```

CBT Domain
AI Domain
Analytics Domain

```

---

# 3. Ownership Rule

Setiap entity memiliki:

```

Owner Domain

Creator

Modifier

Consumer

```

---

Contoh:

```

Question

Owner:
Question Bank

Consumer:
CBT
AI
Analytics

```

---

# 4. Ownership Classification

Kategori:

## Master Data

Data referensi utama.

Contoh:

```

Subject

Curriculum

Organization

```

---

## Transaction Data

Data aktivitas.

Contoh:

```

Exam Attempt

Learning Progress

```

---

## Content Data

Data pembelajaran.

Contoh:

```

Question

Material

Media

```

---

## Analytical Data

Data hasil olahan.

Contoh:

```

Metric

Report

Dashboard

```

---

# 5. Domain Ownership Overview

| Domain | Primary Responsibility | Data Ownership |
|-|-|-|
| Master Academic | Struktur akademik | Academic Master Data |
| Question Bank | Bank soal | Question Data |
| Learning Resource | Konten belajar | Learning Content |
| CBT Engine | Ujian | Assessment Transaction |
| User Management | Identitas | User Identity |
| Learning | Aktivitas belajar | Learning Progress |
| Organization | Institusi | Tenant Data |
| Media | File digital | Asset Data |
| AI | Artificial Intelligence | AI Process Data |
| Analytics | Insight | Analytical Data |
| System | Platform Support | System Data |

---

# 6. Master Academic Ownership

## Owner

```

Master Academic Domain

```

---

## Owned Entity

| Entity | Owner |
|-|-|
| Education Level | Master Academic |
| Grade | Master Academic |
| Subject | Master Academic |
| Curriculum | Master Academic |
| Chapter | Master Academic |
| Competency | Master Academic |
| Learning Objective | Master Academic |

---

## Consumer

```

Question Bank

Learning Resource

CBT

Learning

Analytics

```

---

## Modification Rule

Hanya:

```

Academic Admin

```

yang dapat mengubah.

---

# 7. Question Bank Ownership

## Owner

```

Question Bank Domain

```

---

## Owned Entity

| Entity | Owner |
|-|-|
| Question | Question Bank |
| Question Version | Question Bank |
| Answer Option | Question Bank |
| Explanation | Question Bank |
| Difficulty Level | Question Bank |
| Question Source | Question Bank |
| Question Review | Question Bank |

---

## Consumer

```

CBT

AI

Analytics

```

---

## Important Rule

CBT tidak boleh:

```

Create Question

```

CBT hanya:

```

Request Question

```

---

# 8. Learning Resource Ownership

## Owner

```

Learning Resource Domain

```

---

## Owned Entity

| Entity | Owner |
|-|-|
| Course | Learning Resource |
| Module | Learning Resource |
| Lesson | Learning Resource |
| Topic | Learning Resource |
| Learning Material | Learning Resource |

---

## Consumer

```

Learning

Student

Analytics

AI

```

---

# 9. CBT Engine Ownership

## Owner

```

CBT Engine Domain

```

---

## Owned Entity

| Entity | Owner |
|-|-|
| Exam | CBT |
| Exam Configuration | CBT |
| Exam Schedule | CBT |
| Exam Attempt | CBT |
| Answer Sheet | CBT |
| Exam Result | CBT |
| Score Calculation | CBT |

---

## Consumer

```

Analytics

Learning

AI

```

---

## Rule

CBT owns:

```

Exam Result

```

bukan Analytics.

---

# 10. User Management Ownership

## Owner

```

User Management Domain

```

---

## Owned Entity

| Entity | Owner |
|-|-|
| User | User Management |
| Credential | User Management |
| Role | User Management |
| Permission | User Management |
| Profile | User Management |

---

## Consumer

Semua domain.

---

## Security Rule

Credential tidak boleh keluar domain.

Contoh:

Tidak boleh:

```

AI membaca password

```

---

# 11. Learning Ownership

## Owner

```

Learning Domain

```

---

## Owned Entity

| Entity | Owner |
|-|-|
| Enrollment | Learning |
| Learning Progress | Learning |
| Study History | Learning |
| Achievement | Learning |
| Learning Goal | Learning |

---

## Consumer

```

Analytics

AI

Teacher Dashboard

```

---

# 12. Organization Ownership

## Owner

```

Organization Domain

```

---

## Owned Entity

| Entity | Owner |
|-|-|
| Organization | Organization |
| School | Organization |
| Class Group | Organization |
| Membership | Organization |
| Teacher Assignment | Organization |

---

## Consumer

```

User

CBT

Learning

Analytics

```

---

# 13. Media Ownership

## Owner

```

Media Domain

```

---

## Owned Entity

| Entity | Owner |
|-|-|
| Media Asset | Media |
| File Metadata | Media |
| Storage Object | Media |
| Processing Status | Media |

---

## Consumer

```

Question Bank

Learning Resource

AI

```

---

# 14. AI Ownership

## Owner

```

AI Domain

```

---

## Owned Entity

| Entity | Owner |
|-|-|
| AI Request | AI |
| AI Job | AI |
| AI Model | AI |
| Prompt Template | AI |
| Generation Result | AI |
| Embedding | AI |

---

## Consumer

```

Question Bank

Learning Resource

Analytics

```

---

## Rule

AI output bukan otomatis menjadi data bisnis.

Contoh:

AI membuat soal:

```

AI Generation Result

```

harus melalui:

```

Review

Approval

Publish

```

oleh Question Bank.

---

# 15. Analytics Ownership

## Owner

```

Analytics Domain

```

---

## Owned Entity

| Entity | Owner |
|-|-|
| Event | Analytics |
| Metric | Analytics |
| Dashboard | Analytics |
| Report | Analytics |
| Snapshot | Analytics |

---

## Consumer

```

Admin

Teacher

Organization

```

---

## Rule

Analytics:

```

Read Transaction

Generate Insight

Never Modify Source

```

---

# 16. System Ownership

## Owner

```

System Domain

```

---

## Owned Entity

| Entity | Owner |
|-|-|
| Audit Log | System |
| Notification | System |
| Configuration | System |
| Job Queue | System |
| Feature Flag | System |
| Security Log | System |

---

# 17. Complete Ownership Matrix

| Entity | Owner | Read By | Write By |
|-|-|-|-|
| User | User Management | All | User Management |
| Organization | Organization | All | Organization |
| Subject | Academic | All Academic Domain | Academic |
| Question | Question Bank | CBT, AI, Analytics | Question Bank |
| Material | Learning Resource | Learning, AI | Learning Resource |
| Exam | CBT | Learning, Analytics | CBT |
| Exam Result | CBT | Analytics, Learning | CBT |
| Learning Progress | Learning | Analytics, AI | Learning |
| Media File | Media | All Content Domain | Media |
| AI Result | AI | Question Bank, Analytics | AI |
| Metric | Analytics | Dashboard | Analytics |
| Audit | System | Admin | System |

---

# 18. Data Access Pattern

## Create

Hanya owner:

```

Owner Domain

```

---

## Read

Melalui:

```

API

Event Projection

Read Model

```

---

## Update

Hanya owner:

```

Original Domain

```

---

## Delete

Menggunakan:

```

Soft Delete

```

---

# 19. Duplicate Data Policy

Duplikasi hanya diperbolehkan untuk:

## Cache

Contoh:

```

Question Title Cache

```

---

## Read Model

Contoh:

```

Student Dashboard View

```

---

## Analytics Warehouse

Contoh:

```

Fact Exam Result

```

---

Tidak diperbolehkan:

```

CBT Question Copy

AI Question Copy

Learning Question Copy

```

sebagai source data.

---

# 20. Data Lifecycle Ownership

| Lifecycle | Responsible Domain |
|-|-|
| Creation | Owner |
| Validation | Owner |
| Publication | Owner |
| Modification | Owner |
| Archive | Owner |
| Deletion | Owner |

---

# 21. Ownership Conflict Resolution

Jika terjadi konflik:

Contoh:

AI membuat soal.

Question Bank ingin mengubah.

Keputusan:

```

Question Bank owns Question.

```

AI hanya:

```

Generator

```

---

# 22. Future Microservice Mapping

Ownership ini dapat langsung dipetakan:

```

Academic Service

Question Service

Learning Content Service

CBT Service

Identity Service

Organization Service

Media Service

AI Service

Analytics Service

System Service

```

---

# 23. Final Rule

Aturan utama YakinLulus:

```

Every important data has one owner.

Owner controls lifecycle.

Other domains consume through contract.

No shared ownership.

No uncontrolled duplication.

```

---

# Status

Document:

```

APPROVED

```

Role:

```

Architecture Governance Document

```

Digunakan untuk:

- Database Architecture
- API Contract
- Backend Development
- Security Review
- Future Microservice Migration
```

