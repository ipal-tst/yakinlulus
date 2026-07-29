```markdown id="m4x8ps"
# 12_engineering_implementation_guide/ai/07_ai_question_generator.md

# AI Question Generator Architecture

## 1. Tujuan

Dokumen ini menjelaskan desain dan implementasi **AI Question Generator System** pada platform YakinLulus.id.

AI Question Generator digunakan untuk melakukan otomatisasi pembuatan soal berdasarkan:

- kurikulum;
- kompetensi pembelajaran;
- materi pembelajaran;
- contoh soal;
- tingkat kesulitan;
- blueprint ujian.


Tujuan utama:


```

Human Teacher Knowledge

*

AI Generation Capability

*

Educational Quality Control

=

Automated Question Production

```

---

# 2. Problem Statement


Pembuatan soal secara manual memiliki kendala:


```

Membutuhkan waktu lama

Konsistensi kualitas berbeda

Sulit membuat variasi soal

Sulit membuat soal dalam jumlah besar

Sulit melakukan klasifikasi tingkat kesulitan

```


AI Question Generator menyelesaikan:


```

Generate

Validate

Review

Publish

```

---

# 3. Position In AI Architecture


```

```
             Academic Domain


                   |

                   |

            Question Bank


                   |

                   |

         AI Question Generator


                   |

    +--------------+--------------+

    |                             |
```

Knowledge Retrieval            LLM Generation

```
    |                             |

    +--------------+--------------+

                   |

                   |

          Question Validation


                   |

                   |

          Question Repository
```

```

---

# 4. Generator Components


## 4.1 Curriculum Analyzer


Memahami:


```

Jenjang

Kelas

Mata Pelajaran

Bab

Kompetensi Dasar

Learning Objective

```

---

## 4.2 Example Question Analyzer


Menganalisa contoh soal:


```

Question Pattern

Question Type

Difficulty

Cognitive Level

Answer Pattern

Explanation Style

```

---

## 4.3 Knowledge Retrieval


Mengambil referensi:


```

Learning Material

Previous Questions

Curriculum Mapping

Exam Blueprint

```

---

## 4.4 Question Generation Engine


Menghasilkan:


```

Question

Options

Correct Answer

Explanation

Difficulty

Metadata

```

---

## 4.5 Validation Engine


Melakukan:


```

Structure Validation

Answer Validation

Difficulty Validation

Similarity Check

Quality Check

```

---

# 5. Complete Generation Flow


```

Teacher/Admin Request

```
    |

    |
```

Select Subject

```
    |

    |
```

Select Chapter

```
    |

    |
```

Retrieve Knowledge

```
    |

    |
```

Build Prompt

```
    |

    |
```

LLM Generation

```
    |

    |
```

Validation Pipeline

```
    |

    |
```

Human Review

```
    |

    |
```

Question Bank

````

---

# 6. Input Parameters


Generator menerima:


```json
{
 "grade":"10",
 "subject":"Physics",
 "chapter":"Newton Law",
 "difficulty":"medium",
 "question_count":20,
 "question_type":"multiple_choice"
}
````

---

# 7. Question Generation Types

## Multiple Choice Question

Format:

```
Question

A. Option

B. Option

C. Option

D. Option

Answer

Explanation

```

---

## Numerical Question

Format:

```
Problem

Formula

Calculation

Answer

Explanation

```

---

## Concept Question

Format:

```
Concept

Scenario

Analysis

Conclusion

```

---

# 8. Cognitive Level Support

Menggunakan konsep:

```
Bloom Taxonomy

```

Level:

| Level | Description |
| ----- | ----------- |
| C1    | Remember    |
| C2    | Understand  |
| C3    | Apply       |
| C4    | Analyze     |
| C5    | Evaluate    |
| C6    | Create      |

---

# 9. Difficulty Generation

Difficulty berdasarkan:

```
Concept Complexity

Calculation Complexity

Reasoning Depth

Distractor Quality

```

---

Example:

Easy:

```
Recall formula

```

Medium:

```
Apply concept

```

Hard:

```
Analyze complex scenario

```

---

# 10. Prompt Architecture

Generator Prompt:

```
SYSTEM

You are an expert educational question writer.


CONTEXT

Curriculum + Material + Example Questions


TASK

Generate questions based on specification.


RULES

Follow curriculum.

Avoid duplicate questions.

Provide explanation.


OUTPUT FORMAT

JSON Schema

```

---

# 11. RAG Integration

AI Generator menggunakan RAG:

```
Generation Request


        |

Retrieve Material


        |

Retrieve Similar Questions


        |

Build Context


        |

LLM Generate

```

---

# 12. Question Similarity Check

Tujuan:

```
Prevent Duplicate Question

Maintain Question Diversity

```

Flow:

```
New Question


        |

Generate Embedding


        |

Vector Search


        |

Similarity Score


        |

Accept / Reject

```

---

# 13. Validation Pipeline

```
Generated Question


        |

Schema Validation


        |

Answer Validation


        |

Content Validation


        |

Similarity Check


        |

Quality Score


        |

Approved

```

---

# 14. Answer Validation

Check:

```
Correct Option Exists

Explanation Matches Answer

Calculation Correct

No Contradiction

```

---

# 15. Quality Scoring

Example:

```json
{
 "accuracy":0.95,
 "difficulty":0.85,
 "originality":0.90,
 "quality_score":0.91
}
```

---

# 16. Human Review Workflow

AI Generated:

```
Draft

```

Teacher:

```
Review

Edit

Approve

Reject

```

---

State:

```
GENERATED

        |

REVIEW

        |

APPROVED

        |

PUBLISHED

```

---

# 17. Database Design

Entities:

```
ai_question_jobs

ai_generated_questions

ai_question_reviews

ai_generation_logs

```

---

# 18. Generation Job Model

```sql
ai_question_jobs

id

requested_by

subject

chapter

quantity

status

created_at

```

---

# 19. Generated Question Model

```sql
ai_generated_questions


id

job_id

question_text

options

answer

explanation

difficulty

metadata

status

```

---

# 20. AI Generation Logging

Store:

```
Prompt Version

Model

Input Token

Output Token

Latency

Cost

Result Quality

```

---

# 21. Batch Generation

Untuk kebutuhan besar:

Example:

```
Generate 10.000 UTBK Questions

```

Flow:

```
Create Job


 |

Queue


 |

Worker


 |

Generate Batch


 |

Validate


 |

Store

```

---

# 22. API Design

Generate:

```
POST

/api/v1/ai/question-generator/generate

```

---

Request:

```json
{
 "subject":"Mathematics",
 "chapter":"Integral",
 "count":50,
 "difficulty":"hard"
}
```

---

Response:

```json
{
 "job_id":"JOB001",
 "status":"processing"
}
```

---

# 23. Background Worker

Heavy process:

```
Generation Request


        |

Queue


        |

AI Worker


        |

Validation Worker


        |

Storage

```

---

# 24. Integration With Question Bank

Flow:

```
AI Generated Question


        |

Review


        |

Question Bank


        |

CBT Exam

```

---

# 25. AI Generated Explanation

Generator membuat:

```
Answer Explanation

Step By Step Solution

Learning Concept

Common Mistake

```

---

# 26. Safety Rules

AI tidak boleh:

```
Generate outside curriculum

Create invalid answer

Produce misleading explanation

Copy protected content

```

---

# 27. Monitoring Metrics

Track:

```
Generated Quantity

Approval Rate

Correction Rate

Quality Score

Generation Cost

```

---

# 28. Testing Strategy

Test:

```
Question Accuracy

Difficulty Classification

Duplicate Detection

Explanation Quality

Curriculum Alignment

```

---

# 29. Implementation Recommendation

Services:

```
Question Generation Service

Prompt Service

RAG Retrieval Service

Validation Service

Review Service

```

Technology:

```
Python FastAPI

LLM API

PostgreSQL

pgvector

Redis Queue

n8n Automation

```

---

# 30. Future Enhancement

Advanced:

```
Adaptive Question Generator

Exam Blueprint Generator

AI Difficulty Calibration

Automatic Curriculum Mapping

Teacher AI Assistant

```

---

# Summary

AI Question Generator Architecture YakinLulus.id:

```
Curriculum

+

Learning Material

+

Example Question

+

RAG

+

LLM

+

Validation

+

Human Review

=

High Quality Question Bank

```

AI Question Generator menjadi mesin otomatisasi utama untuk mempercepat pembangunan bank soal berskala besar tanpa menghilangkan kontrol kualitas akademik.
