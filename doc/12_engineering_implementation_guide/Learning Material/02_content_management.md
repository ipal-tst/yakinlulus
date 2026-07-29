```markdown id="d7k4qm"
# 12_engineering_implementation_guide/learning_material/02_content_management.md

# Content Management Architecture

## 1. Tujuan

Dokumen ini menjelaskan implementasi **Content Management System (CMS)** untuk Learning Material YakinLulus.id.

Content Management bertanggung jawab untuk:

- membuat materi pembelajaran;
- mengatur struktur konten;
- melakukan review;
- publishing;
- mengelola perubahan materi;
- menjaga kualitas konten akademik.


Tujuan utama:


```

Efficient Content Authoring

*

Structured Curriculum Management

*

Controlled Publishing Workflow

*

Reusable Learning Content

*

Multi Platform Delivery

```

---

# 2. Content Management Concept


Learning Material menggunakan pendekatan **structured content**.


Bukan:


```

Single Document File

```


Tetapi:


```

Learning Module

```
  |

  +---- Lesson


          |

          +---- Content Block


                   |

                   +---- Text

                   +---- Image

                   +---- Video

                   +---- Exercise

                   +---- Quiz
```

```

---

# 3. CMS Architecture


```

```
             Content Management System


                      |

    +-----------------+-----------------+

    |                                   |
```

Content Authoring                  Publishing System

```
    |                                   |

    |                                   |
```

Content Repository                 Student Platform

```
    |

    |
```

Review Workflow

```
    |

    |
```

Version Management

```

---

# 4. Content Author Role


Role yang dapat membuat konten:


| Role | Responsibility |
|-|-|
| Admin | Full Control |
| Content Manager | Manage Content |
| Teacher | Create Academic Content |
| Reviewer | Quality Check |
| Student | Consume Content |

---

# 5. Content Creation Flow


```

Author

|

Create Material

|

Create Lesson

|

Add Content Block

|

Attach Media

|

Save Draft

|

Submit Review

|

Publish

```

---

# 6. Content Structure Model


Hierarchy:


```

Course

|

Module

|

Chapter

|

Lesson

|

Content Block

|

Activity

```

Contoh:


```

Matematika SMA

|

Aljabar

|

Persamaan Linear

|

Metode Substitusi

|

Video Explanation

|

Exercise

```

---

# 7. Course Entity


Entity:


```

courses

```


Field:


| Field | Description |
|-|-|
| id | UUID |
| title | Course Name |
| description | Description |
| education_level | Level |
| status | Lifecycle |
| created_by | Owner |

---

# 8. Module Entity


Entity:


```

learning_modules

```


Field:


```

id

course_id

title

description

order_number

status

```

---

# 9. Lesson Entity


Entity:


```

lessons

```


Field:


```

id

module_id

title

summary

estimated_duration

order_number

status

```

---

# 10. Content Block Management


Content disimpan sebagai blok.


Contoh:


```

Lesson:

Block 1:

Introduction Text

Block 2:

Image Diagram

Block 3:

Video Explanation

Block 4:

Practice Question

```

---

# 11. Content Block Ordering


Setiap block memiliki:


```

order_number

```

Contoh:


| Order | Type |
|-|-|
|1|Text|
|2|Image|
|3|Video|
|4|Exercise|

---

# 12. Content Editor Architecture


Editor mendukung:


```

Rich Text Editor

Drag and Drop Block

Media Upload

Formula Editor

Preview Mode

```

---

# 13. Rich Text Content


Support:


```

Markdown

HTML

LaTeX

Code Block

Table

Image Embed

```

---

# 14. Media Attachment Flow


```

Upload Media

|

File Service

|

Object Storage

|

Generate URL

|

Attach To Content Block

```

---

# 15. Draft Management


Setiap konten dapat disimpan:


```

DRAFT

```

Draft memiliki:


```

Author

Last Modified

Change History

```

---

# 16. Review Workflow


Flow:


```

Draft

|

Submit Review

|

Reviewer Check

|

Approved

|

Published

```

---

# 17. Review Status


State:


```

DRAFT

|

IN_REVIEW

|

APPROVED

|

PUBLISHED

|

REJECTED

|

ARCHIVED

```

---

# 18. Content Versioning


Perubahan konten:


```

Version 1

|

Edit

|

Version 2

|

Review

|

Publish

```

---

# 19. Content Approval Rules


Konten harus lolos:


```

Academic Accuracy

Grammar Check

Media Validation

Curriculum Alignment

```

---

# 20. Publishing System


Publishing process:


```

Approved Content

|

Generate Published Snapshot

|

Cache Content

|

Expose API

|

Student Access

```

---

# 21. Content Visibility


Visibility:


```

PRIVATE

SCHOOL_ONLY

PUBLIC

PREMIUM

```

---

# 22. Content Access Rule


Contoh:


```

Student

|

Check Enrollment

|

Check Permission

|

Return Material

```

---

# 23. Content Search Indexing


Saat publish:


```

Material Published

|

Generate Search Document

|

Index

|

Available Search

```

---

# 24. AI Knowledge Processing


Saat konten publish:


```

Published Material

|

Text Extraction

|

Chunking

|

Embedding

|

Vector Database

|

AI Tutor Knowledge

```

---

# 25. Content Analytics Integration


Tracking:


```

Material Viewed

Lesson Completed

Video Watched

Exercise Completed

```

---

# 26. Database Design


Relationship:


```

courses

|

learning_modules

|

lessons

|

content_blocks

|

content_media

|

content_versions

```

---

# 27. API Design


Create Material:


```

POST

/api/v1/materials

```


Update Material:


```

PUT

/api/v1/materials/{id}

```


Publish:


```

POST

/api/v1/materials/{id}/publish

```

---

# 28. Performance Strategy


Optimization:


```

Content Cache

CDN

Lazy Loading

Pagination

Compressed Media

```

---

# 29. Security


Protection:


```

Role Permission

Content Ownership

Audit Log

Signed Media URL

Copyright Control

```

---

# 30. Testing Strategy


Test:


```

Create Content

Edit Content

Review Workflow

Publish Content

Permission Validation

Search Index

AI Processing

```

---

# 31. Implementation Recommendation


Backend:


```

Content Service

CMS Service

Workflow Service

Search Service

File Service

```

Frontend:


```

Content Editor

Lesson Viewer

Media Component

Admin CMS Dashboard

```

Technology:


```

Go Backend

PostgreSQL

Object Storage

Redis Cache

Search Engine

```

---

# 32. Future Enhancement


Support:


```

Collaborative Editing

AI Content Assistant

Automatic Translation

Interactive Learning Object

SCORM Support

LTI Integration

```

---

# Summary


Content Management Architecture YakinLulus.id:


```

Structured Authoring

*

Review Workflow

*

Version Control

*

Publishing Pipeline

*

AI Knowledge Integration

