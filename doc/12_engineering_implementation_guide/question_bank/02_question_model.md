```markdown id="m3k8qx"
# 12_engineering_implementation_guide/question_bank/02_question_model.md

# Question Model Architecture

## 1. Tujuan

Dokumen ini menjelaskan desain model data dan struktur entity **Question Bank** pada YakinLulus.id.

Question Model menjadi representasi utama untuk menyimpan:

- isi soal;
- pilihan jawaban;
- kunci jawaban;
- pembahasan;
- metadata akademik;
- tingkat kesulitan;
- histori perubahan;
- penggunaan soal.


Tujuan desain:


```

Reusable Question Entity

*

Curriculum Mapping

*

Version Control

*

AI Processing Ready

*

Analytics Ready

```

---

# 2. Konsep Question Entity


Question tidak hanya berupa teks soal.


Model:


```

Question

```
|

+-- Content

|

+-- Options

|

+-- Answer

|

+-- Explanation

|

+-- Metadata

|

+-- Media

|

+-- Version
```

```

---

# 3. High Level Entity Relationship


```

```
            Question


                |

    +-----------+------------+

    |                        |
```

Question Option          Question Metadata

```
    |

    |
```

Answer Key

```
    |

    |
```

Explanation

```
    |

    |
```

Question Media

```
    |

    |
```

Question Version

```

---

# 4. Question Entity


Entity utama:


```

questions

```


Field:


| Field | Type | Description |
|-|-|-|
| id | UUID | Primary Key |
| code | VARCHAR | Question Identifier |
| content | TEXT | Question Text |
| type | ENUM | Question Type |
| status | ENUM | Lifecycle Status |
| difficulty | ENUM | Difficulty Level |
| explanation | TEXT | Answer Explanation |
| created_by | UUID | Author |
| created_at | TIMESTAMP | Creation Time |
| updated_at | TIMESTAMP | Last Update |

---

# 5. Question Content


Menyimpan isi pertanyaan.


Contoh:


```

Berapakah hasil dari 2 + 5?

```

atau:


```

Perhatikan gambar berikut:

[IMAGE]

Berdasarkan grafik tersebut...

```

Support:


```

Plain Text

Rich Text

Markdown

HTML

LaTeX Formula

Image Reference

````

---

# 6. Question Type Model


MVP:


```text
MULTIPLE_CHOICE

````

Future:

```text
MULTIPLE_SELECT

TRUE_FALSE

ESSAY

MATCHING

NUMERIC

INTERACTIVE

```

---

# 7. Difficulty Model

Level:

```text
EASY

MEDIUM

HARD

```

Mapping:

| Level  | Description                    |
| ------ | ------------------------------ |
| Easy   | Konsep dasar                   |
| Medium | Pemahaman dan penerapan        |
| Hard   | Analisis dan pemecahan masalah |

---

# 8. Question Option Model

Entity:

```
question_options

```

Field:

| Field        | Type    |
| ------------ | ------- |
| id           | UUID    |
| question_id  | UUID    |
| option_label | VARCHAR |
| option_text  | TEXT    |
| order_number | INTEGER |
| is_correct   | BOOLEAN |

---

Example:

```
Question:

Ibukota Indonesia?


Options:


A. Bandung

B. Jakarta

C. Surabaya

D. Medan


Correct:

B

```

---

# 9. Answer Key Model

Kunci jawaban dipisahkan.

Entity:

```
question_answers

```

Field:

```
id

question_id

answer_type

correct_value

created_at

```

Tujuan:

```
Security Isolation

+

Easy Evaluation

```

---

# 10. Explanation Model

Pembahasan soal:

Entity:

```
question_explanations

```

Support:

```
Text Explanation

Image Explanation

Video Explanation

Step By Step Solution

AI Generated Explanation

```

---

# 11. Question Metadata Model

Metadata:

```
question_metadata

```

Field:

| Field           | Description    |
| --------------- | -------------- |
| education_level | SD/SMP/SMA     |
| grade           | Kelas          |
| subject_id      | Mata pelajaran |
| chapter_id      | Bab            |
| topic           | Topik          |
| curriculum      | Kurikulum      |
| source          | Sumber         |

---

# 12. Academic Mapping

Relationship:

```
Question

   |

Subject

   |

Chapter

   |

Topic

```

Contoh:

```
Matematika

 |

Aljabar

 |

Persamaan Linear

```

---

# 13. Question Media Model

Entity:

```
question_media

```

Menyimpan:

```
Image

Audio

Video

Document

Formula

```

Field:

```
id

question_id

file_id

media_type

position

```

---

# 14. Question Status Model

Lifecycle:

```
DRAFT

 |

REVIEW

 |

APPROVED

 |

PUBLISHED

 |

ARCHIVED

```

Database:

```
status ENUM

```

---

# 15. Question Ownership

Setiap soal memiliki:

```
Owner

Creator

Reviewer

Publisher

```

Contoh:

```
Created By:

Teacher A


Reviewed By:

Teacher B


Published By:

Admin

```

---

# 16. Question Version Model

Entity:

```
question_versions

```

Menyimpan:

```
Previous Content

Previous Answer

Previous Explanation

Changed By

Change Reason

Timestamp

```

---

# 17. Question Analytics Reference

Question menyimpan:

```
usage_count

correct_rate

average_time

difficulty_score

quality_score

```

---

# 18. AI Metadata

Untuk AI pipeline:

Field tambahan:

```
embedding_vector

generated_by_ai

ai_model

prompt_reference

confidence_score

```

---

# 19. Database Design

Simplified:

```
questions

    |

    +---- question_options

    |

    +---- question_answers

    |

    +---- question_metadata

    |

    +---- question_media

    |

    +---- question_versions

    |

    +---- question_reviews

```

---

# 20. Validation Rule

Question valid jika:

```
Content Exists

Minimum Options >= 2

Correct Answer Exists

Subject Assigned

Difficulty Assigned

Status Valid

```

---

# 21. Example JSON Representation

```json
{
 "id":"q001",
 "type":"MULTIPLE_CHOICE",
 "content":"2 + 2 = ?",
 "difficulty":"EASY",
 "options":[
   {
    "label":"A",
    "text":"3",
    "correct":false
   },
   {
    "label":"B",
    "text":"4",
    "correct":true
   }
 ],
 "metadata":{
   "subject":"Matematika",
   "grade":4
 }
}
```

---

# 22. Implementation Consideration

Database:

```
PostgreSQL

JSONB Metadata

UUID Primary Key

Foreign Key Constraint

Index Optimization

```

---

# 23. Performance Strategy

Index:

```
subject_id

chapter_id

difficulty

status

created_at

```

---

# 24. Security Strategy

Protection:

```
Answer Key Separation

Permission Based Access

Audit History

Encryption For Sensitive Data

```

---

# 25. Future Extension

Model siap mendukung:

```
AI Generated Question

Adaptive Learning

IRT Analysis

Question Recommendation

Knowledge Graph

```

---

# Summary

Question Model YakinLulus.id menggunakan:

```
Rich Question Entity

+

Academic Metadata

+

Version Management

+

Media Support

+

AI Ready Structure

+

Analytics Integration

```

Model ini menjadi fondasi untuk:

```
Question Bank

CBT Engine

Learning Material

AI Tutor

Analytics System

