# 12_engineering_implementation_guide/question_bank/01_question_bank_flow.md

# Question Bank Flow Architecture

## 1. Tujuan

Dokumen ini menjelaskan implementasi alur kerja Question Bank Engine YakinLulus.id.

Question Bank merupakan pusat pengelolaan seluruh soal yang digunakan untuk:

- latihan siswa;
- try out;
- simulasi ujian;
- CBT examination;
- analisis kemampuan siswa;
- AI question generation.


Tujuan utama:


Centralized Question Management

Quality Controlled Question Lifecycle

Reusable Question Resource

AI Ready Question Dataset


---

# 2. Question Bank Lifecycle


Siklus hidup soal:



CREATE

|

DRAFT

|

REVIEW

|

APPROVED

|

PUBLISHED

|

USED IN EXAM

|

ARCHIVED


---

# 3. High Level Architecture


             Question Bank Module


                     |

    +----------------+----------------+

    |                |                |

Question Management Validation Review Workflow

    |                |                |

    +----------------+----------------+

                     |

              Question Repository


                     |

    +----------------+----------------+

    |                |                |

    CBT Engine   Learning System   AI Engine

---

# 4. Question Source


Sumber soal:



Official Source

Teacher Created

Imported Dataset

AI Generated

Student Contribution


---

# 5. Question Creation Flow



Author

|

Create Question

|

Save Draft

|

Validation

|

Review

|

Approval

|

Publish


---

# 6. Question Authoring


Role yang dapat membuat soal:


| Role | Permission |
|-|-|
| Admin | Full Access |
| Staff | Manage Content |
| Teacher | Create Question |
| AI Service | Generate Draft |

---

# 7. Question Classification Flow


Setiap soal harus memiliki metadata:



Jenjang

Kelas

Mata Pelajaran

Bab

Sub Bab

Topic

Difficulty

Question Type

Source


Contoh:



Jenjang:
SMA

Kelas:
10

Subject:
Matematika

Chapter:
Persamaan Linear

Difficulty:
Medium


---

# 8. Question Storage Flow



Question Input

  |

Question Entity

  |

Metadata Classification

  |

Media Attachment

  |

Validation

  |

Database


---

# 9. Question Type


MVP:



Multiple Choice


Future:



Multiple Answer

Essay

Matching

True False

Interactive Question

Simulation


---

# 10. Question Structure


Basic:



Question

Options

Answer Key

Explanation

Metadata

Media


---

# 11. Question Review Workflow


Flow:



Created

|

Waiting Review

|

Reviewer Check

|

Approved / Rejected

|

Published


---

# 12. Quality Control


Validasi:



Answer Exists

Explanation Exists

Difficulty Assigned

Curriculum Mapping Valid

No Duplicate Question

Media Valid


---

# 13. Duplicate Detection


Sistem melakukan:



Question Similarity Check

    |

Embedding Comparison

    |

Duplicate Score

    |

Review


---

# 14. Question Usage Flow


Saat CBT dibuat:



Exam Builder

|

Question Filter

|

Question Selection Engine

|

Randomization Engine

|

CBT Runtime


---

# 15. Question Search


Support:



Keyword Search

Subject Filter

Chapter Filter

Difficulty Filter

Source Filter

Usage History


---

# 16. Question Analytics


Data yang dikumpulkan:



Times Used

Correct Rate

Wrong Rate

Difficulty Accuracy

Average Completion Time


---

# 17. Question Quality Score


Formula:



Question Quality

=

Difficulty Accuracy

Discrimination Index

Usage Performance


---

# 18. AI Integration


Question Bank menyediakan:



Training Dataset

RAG Knowledge Source

Question Generation Reference

Difficulty Calibration


---

# 19. Event Architecture


Event:



QuestionCreated

QuestionUpdated

QuestionApproved

QuestionPublished

QuestionUsed

QuestionArchived


---

# 20. Database Interaction


Entity utama:



questions

question_options

question_metadata

question_versions

question_reviews

question_usage

question_media


---

# 21. Security


Protection:



Answer Key Restricted

Audit Trail

Role Permission

Content Ownership


---

# 22. Performance Requirement


Target:


| Operation | Target |
|-|-|
| Question Search | <300ms |
| Load Question Detail | <200ms |
| Import 10.000 Questions | <5 minutes |

---

# 23. Implementation Recommendation


MVP:


Backend:


Question Service

PostgreSQL

Object Storage

Search Index


Frontend:


Question Management Dashboard

Question Editor

Review Interface


---

# Summary


Question Bank Engine YakinLulus.id menggunakan:



Structured Question Lifecycle

Metadata Driven Classification

Review Workflow

Analytics Ready

AI Ready Dataset


Question Bank menjadi fondasi utama CBT, Learning Material, Analytics, dan AI System.