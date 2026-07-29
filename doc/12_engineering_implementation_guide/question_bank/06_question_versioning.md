```markdown id="q6t9vz"
# 12_engineering_implementation_guide/question_bank/06_question_versioning.md

# Question Versioning Architecture

## 1. Tujuan

Dokumen ini menjelaskan desain **Question Versioning System** pada Question Bank YakinLulus.id.

Question Versioning digunakan untuk mengelola perubahan soal secara aman tanpa kehilangan histori.

Sistem harus mampu menyimpan:

- perubahan isi soal;
- perubahan pilihan jawaban;
- perubahan pembahasan;
- perubahan metadata;
- histori reviewer;
- alasan perubahan.


Tujuan utama:


```

Data Integrity

*

Auditability

*

Content Evolution

*

Exam Consistency

*

Rollback Capability

```

---

# 2. Masalah Tanpa Versioning


Tanpa versioning:


```

Question Updated

```
  |
```

Old Data Lost

```
  |
```

Cannot Track Change

```
  |
```

Cannot Audit Exam History

```

Contoh:


Soal awal:


```

2 + 2 = ?

A. 3
B. 4
C. 5
D. 6

```

Kemudian diubah:


```

2 x 2 = ?

A. 2
B. 4
C. 6
D. 8

```

Tanpa versioning:

- histori hilang;
- laporan ujian lama menjadi tidak valid;
- sulit melakukan audit.

---

# 3. Versioning Concept


Setiap perubahan membuat versi baru.


```

Question

|

Version 1

|

Version 2

|

Version 3

```

Question utama selalu menunjuk versi aktif.


---

# 4. Version Architecture


```

```
          Question


              |

              |

      Question Version


              |

   +----------+----------+

   |                     |
```

Question Content       Question Metadata

```
   |

   |
```

Question Options

```
   |

   |
```

Explanation

```

---

# 5. Version Entity


Table:


```

question_versions

```


Field:


| Field | Type | Description |
|-|-|-|
| id | UUID | Primary Key |
| question_id | UUID | Parent Question |
| version_number | INTEGER | Version Number |
| status | ENUM | Version Status |
| content_snapshot | JSONB | Full Snapshot |
| created_by | UUID | Creator |
| change_reason | TEXT | Reason |
| created_at | TIMESTAMP | Timestamp |

---

# 6. Version Numbering


Format:


```

Major.Minor

```


Example:


```

1.0

1.1

1.2

2.0

```

---

# 7. Version Type


## Minor Update


Perubahan kecil:


```

Typo Fix

Grammar Fix

Explanation Improvement

```


Example:


```

1.0

becomes

1.1

```

---

## Major Update


Perubahan substansi:


```

Question Logic Change

Answer Change

Question Replacement

```


Example:


```

1.2

becomes

2.0

```

---

# 8. Change Classification


Setiap perubahan dikategorikan:


```

CONTENT_CHANGE

ANSWER_CHANGE

EXPLANATION_CHANGE

METADATA_CHANGE

MEDIA_CHANGE

```


---

# 9. Version Lifecycle


Flow:


```

CURRENT VERSION

```
    |
```

Edit Request

```
    |
```

Create New Version

```
    |
```

Review

```
    |
```

Approve

```
    |
```

Activate Version

```

---

# 10. Version Status


State:


```

DRAFT

|

REVIEW

|

APPROVED

|

ACTIVE

|

RETIRED

````

---

# 11. Snapshot Strategy


Setiap versi menyimpan snapshot:


```json
{
 "question_text":
 "2 + 2 = ?",

 "options":[
  "3",
  "4",
  "5",
  "6"
 ],

 "answer":"B",

 "explanation":
 "2 ditambah 2 menghasilkan 4"
}
````

---

# 12. Why Snapshot?

Keuntungan:

```
Fast Retrieval

Simple Audit

Easy Rollback

Historical Accuracy

```

---

# 13. Exam Version Locking

Saat soal digunakan pada ujian:

Sistem menyimpan:

```
Question ID

Question Version ID

Exam ID

Usage Time

```

---

Contoh:

CBT Exam 001:

```
Question:

Q100


Version:

3

```

Walaupun soal berubah:

```
Q100 Version 4

```

Ujian lama tetap menggunakan:

```
Q100 Version 3

```

---

# 14. Version Comparison

Sistem menyediakan:

```
Version Diff

```

Contoh:

Before:

```
2 + 2 = ?

```

After:

```
3 + 3 = ?

```

Diff:

```
Question Content Changed

```

---

# 15. Rollback Strategy

Jika versi baru bermasalah:

```
Version 5 ACTIVE


        |


Rollback


        |


Version 4 ACTIVE

```

---

# 16. Approval Workflow

Perubahan penting:

```
Teacher Edit


 |

Reviewer Check


 |

Admin Approval


 |

Publish

```

---

# 17. Permission Rule

| Role     | Action              |
| -------- | ------------------- |
| Teacher  | Create Version      |
| Reviewer | Review              |
| Admin    | Approve             |
| Student  | Read Active Version |

---

# 18. Version Audit Log

Table:

```
question_version_logs

```

Field:

```
id

question_id

version_id

action

user_id

timestamp

description

```

---

# 19. Database Relationship

```
questions


    |

    |

question_versions


    |

    |

question_version_logs


```

---

# 20. API Design

Get Versions:

```
GET

/api/v1/questions/{id}/versions

```

Response:

```json
{
 "question_id":"Q001",
 "versions":[
  {
   "version":1,
   "status":"ACTIVE"
  },
  {
   "version":2,
   "status":"RETIRED"
  }
 ]
}
```

---

Compare Version:

```
GET

/api/v1/questions/{id}/versions/compare?v1=1&v2=2

```

---

Restore Version:

```
POST

/api/v1/questions/{id}/versions/{version}/restore

```

---

# 21. Versioning Rules

Rule:

```
Never Delete Version

Never Modify Published Version

Always Create New Version

Keep Exam Historical Reference

```

---

# 22. Integration With CBT Engine

Flow:

```
Exam Created


 |

Select Question


 |

Lock Question Version


 |

Generate Exam Package


 |

Execute CBT

```

---

# 23. Integration With AI System

AI dapat menggunakan:

```
Historical Versions

Change Pattern

Question Evolution

Improvement History

```

---

# 24. Storage Strategy

Recommended:

```
PostgreSQL JSONB Snapshot

+

Normalized Question Tables

```

---

# 25. Performance Strategy

Index:

```
question_id

version_number

status

created_at

```

---

# 26. Testing Strategy

Test:

```
Create New Version

Compare Versions

Rollback

Exam Historical Access

Permission Check

Audit Logging

```

---

# 27. Implementation Recommendation

Backend:

```
Question Version Service

Audit Service

Approval Workflow

Snapshot Manager

```

Database:

```
PostgreSQL

JSONB

Transaction Support

```

---

# 28. Future Enhancement

Support:

```
Git Like Content Versioning

AI Suggested Revision

Automatic Quality Improvement

Collaborative Editing

```

---

# Summary

Question Versioning System YakinLulus.id:

```
Immutable History

+

Controlled Changes

+

Exam Consistency

+

Audit Trail

+

Rollback Support

```

Dengan versioning, seluruh perubahan soal dapat dilacak, diaudit, dan tetap menjaga validitas hasil ujian yang sudah berjalan.

