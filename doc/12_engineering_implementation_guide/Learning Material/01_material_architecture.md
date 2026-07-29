```markdown id="k8v4mz"
# 12_engineering_implementation_guide/learning_material/01_material_architecture.md

# Learning Material Architecture

## 1. Tujuan

Dokumen ini menjelaskan arsitektur implementasi **Learning Material System** pada YakinLulus.id.

Learning Material System bertanggung jawab mengelola seluruh konten pembelajaran yang digunakan siswa untuk:

- belajar mandiri;
- memahami konsep pelajaran;
- persiapan ujian;
- mendukung CBT;
- menjadi sumber pengetahuan AI Tutor.


Tujuan utama:


```

Structured Learning Content

*

Interactive Learning Experience

*

Progress Tracking

*

AI Ready Knowledge Base

*

Multi Platform Delivery

```

---

# 2. Konsep Learning Material


Learning Material bukan hanya file dokumen.


Struktur:


```

Learning Material

```
    |

    +---- Subject

    |

    +---- Chapter

    |

    +---- Topic

    |

    +---- Learning Content

    |

    +---- Multimedia

    |

    +---- Exercise

    |

    +---- Assessment
```

```

---

# 3. Learning Material Architecture


High Level:


```

```
             Learning Material System


                     |

    +----------------+----------------+

    |                                 |
```

Content Management              Content Delivery

```
    |                                 |

    |                                 |
```

Material Repository             Student Application

```
    |

    |
```

Multimedia Service

```
    |

    |
```

Analytics Engine

```
    |

    |
```

AI Knowledge Base

```

---

# 4. Content Hierarchy


Struktur pembelajaran:


```

Education Level

```
|
```

Grade

```
|
```

Subject

```
|
```

Chapter

```
|
```

Sub Chapter

```
|
```

Topic

```
|
```

Lesson

```

Contoh:


```

SMA

|

Kelas 10

|

Matematika

|

Aljabar

|

Persamaan Linear

|

Metode Eliminasi

```

---

# 5. Material Domain Model


Entity utama:


```

learning_materials

```

Relationship:


```

Material

```
|

+---- Chapter

|

+---- Topic

|

+---- Content Block

|

+---- Media

|

+---- Exercise
```

```

---

# 6. Material Entity


Table:


```

learning_materials

```


Field:


| Field | Type | Description |
|-|-|-|
| id | UUID | Primary Key |
| title | VARCHAR | Material Title |
| description | TEXT | Description |
| material_type | ENUM | Type |
| status | ENUM | Lifecycle |
| subject_id | UUID | Subject Reference |
| chapter_id | UUID | Chapter Reference |
| created_by | UUID | Author |
| created_at | TIMESTAMP | Created Time |

---

# 7. Material Type


MVP:


```

TEXT

VIDEO

AUDIO

IMAGE

INTERACTIVE

DOCUMENT

```

Future:


```

SIMULATION

VIRTUAL LAB

3D CONTENT

AI GENERATED LESSON

```

---

# 8. Content Block Architecture


Material menggunakan konsep block.


```

Lesson

|

Content Block

|

+---------+---------+---------+

|         |         |         |

Text    Image    Video   Exercise

```

---

# 9. Content Block Model


Entity:


```

material_content_blocks

```


Field:


```

id

material_id

block_type

content

order_number

created_at

```

---

# 10. Block Type


Supported:


```

TEXT_BLOCK

IMAGE_BLOCK

VIDEO_BLOCK

AUDIO_BLOCK

FORMULA_BLOCK

CODE_BLOCK

QUIZ_BLOCK

```

---

# 11. Rich Content Support


Content dapat mendukung:


```

Markdown

HTML

LaTeX Formula

Image Embed

Video Embed

Interactive Component

```

---

# 12. Multimedia Integration


Learning Material terhubung dengan:


```

File Management Service

```
    |

    |
```

Object Storage

```
    |

    |
```

CDN Delivery

```

---

# 13. Material Lifecycle


Status:


```

DRAFT

|

REVIEW

|

PUBLISHED

|

UPDATED

|

ARCHIVED

```

---

# 14. Authoring Workflow


Flow:


```

Teacher / Content Team

```
    |
```

Create Material

```
    |
```

Add Content

```
    |
```

Attach Media

```
    |
```

Review

```
    |
```

Publish

```
    |
```

Student Access

```

---

# 15. Material Access Control


Role:


| Role | Permission |
|-|-|
| Admin | Full Access |
| Staff | Manage Content |
| Teacher | Create Material |
| Student | Read Material |

---

# 16. Learning Path Integration


Material dapat menjadi:


```

Learning Path

```
    |
```

Chapter Sequence

```
    |
```

Lesson Order

```
    |
```

Student Progress

```

---

# 17. Student Learning Flow


```

Student

|

Select Subject

|

Open Chapter

|

Read Material

|

Watch Video

|

Complete Exercise

|

Take Assessment

|

Update Progress

```

---

# 18. Offline Learning Strategy


Material mendukung:


```

Download Content

Cache Local

Offline Reading

Sync Progress

```

---

# 19. AI Knowledge Integration


Material menjadi sumber:


```

RAG Knowledge Base

```
    |
```

Embedding

```
    |
```

Vector Database

```
    |
```

AI Tutor Context

```

---

# 20. Material Search


Support:


```

Keyword Search

Subject Filter

Chapter Filter

Topic Filter

Semantic Search

```

---

# 21. Material Analytics


Data yang dikumpulkan:


```

View Count

Completion Rate

Reading Time

Video Watch Time

Exercise Result

```

---

# 22. Database Relationship


Simplified:


```

subjects

|

chapters

|

learning_materials

|

material_content_blocks

|

material_media

```

---

# 23. API Integration


Example:


Get Material:


```

GET

/api/v1/materials/{id}

````

Response:


```json
{
 "id":"mat001",
 "title":"Persamaan Linear",
 "blocks":[
  {
   "type":"TEXT",
   "content":"..."
  },
  {
   "type":"VIDEO",
   "url":"..."
  }
 ]
}
````

---

# 24. Performance Strategy

Optimization:

```
CDN Delivery

Lazy Loading

Content Pagination

Media Compression

Caching

```

---

# 25. Security

Protection:

```
Access Permission

Copyright Control

Signed URL

Download Restriction

Audit Log

```

---

# 26. Testing Strategy

Test:

```
Material Creation

Content Rendering

Media Loading

Permission

Offline Cache

Progress Tracking

```

---

# 27. Implementation Recommendation

Backend:

```
Learning Material Service

Content Management Service

File Service

Search Service

Analytics Service

```

Frontend:

```
Material Viewer

Content Renderer

Media Player

Progress Tracker

```

Technology:

```
Go Backend

PostgreSQL

Object Storage

CDN

Redis Cache

```

---

# 28. Future Enhancement

Support:

```
Adaptive Learning Path

AI Generated Lesson

Interactive Simulation

Gamification

Personalized Recommendation

```

---

# Summary

Learning Material Architecture YakinLulus.id:

```
Structured Content

+

Multimedia Learning

+

Progress Tracking

+

Offline Support

+

AI Knowledge Source

```

Learning Material System menjadi fondasi pembelajaran mandiri dan sumber utama AI Tutor dalam ekosistem YakinLulus.id.
