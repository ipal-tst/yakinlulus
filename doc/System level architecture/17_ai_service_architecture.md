Melanjutkan ke file berikutnya:

# `11_implementation_architecture/17_ai_service_architecture.md`

```md
# AI Service Architecture
## YakinLulus.id AI Service Architecture Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan AI architecture pada platform YakinLulus.id.

AI layer merupakan future capability yang dibangun di atas platform edukasi untuk meningkatkan:

- otomatisasi pembuatan soal;
- kualitas pembahasan;
- personalisasi pembelajaran;
- AI tutor;
- rekomendasi belajar;
- knowledge retrieval berbasis RAG.


Target:


```

AI As Learning Intelligence Layer

*

Human Teacher Assistance

*

Student Personalized Learning

```


---

# 2. AI Architecture Principles


YakinLulus menggunakan prinsip:


```

AI Augmentation

bukan

AI Replacement

*

Human Verified Content

*

Data Privacy First

*

Modular AI Service

*

Provider Independent

```


AI tidak langsung menggantikan guru, tetapi membantu:

- guru membuat konten;
- siswa memahami materi;
- platform memberikan insight.


---

# 3. AI Architecture Overview


```

```
                     User


                       |

                       |

                 AI Request


                       |

                       |

                AI Gateway Layer


                       |

    +------------------+------------------+

    |                  |                  |
```

AI Question        AI Tutor            AI Analytics

Generator

```
    |                  |                  |


    +------------------+------------------+

                       |

                       |

                AI Service Layer


                       |

    +------------------+------------------+

    |                  |                  |

    LLM API        Vector DB        Knowledge Base


                       |

                       |

                PostgreSQL / Storage
```

```


---

# 4. AI Service Position


AI berada sebagai bounded context terpisah.


```

Core Platform

+----------------+

| Question       |

| Exam           |

| Learning       |

| Analytics      |

+----------------+

```
      |

      |

 AI Context
```

+----------------+

| Generation     |

| Recommendation |

| Tutor          |

| RAG            |

+----------------+

```


---

# 5. AI Capability Roadmap


## Phase 1


AI Assistant Internal:


```

Question Generator

Question Analyzer

Explanation Generator

```


---

## Phase 2


Teacher Assistant:


```

Lesson Generator

Exam Generator

Learning Recommendation

```


---

## Phase 3


Student AI:


```

AI Tutor

Personal Learning Coach

Adaptive Learning

```


---

# 6. AI Service Components


Architecture:


```

AI Platform

├── AI Gateway

├── Prompt Management

├── Model Adapter

├── Knowledge Retrieval

├── RAG Pipeline

├── AI Workflow Engine

├── AI Evaluation

└── AI Monitoring

```


---

# 7. AI Gateway


AI Gateway bertugas:


- menerima request;
- authentication;
- rate limiting;
- memilih model;
- logging.


Flow:


```

Application

|

AI Gateway

|

Model Selection

|

AI Provider

```


---

# 8. Model Adapter Layer


Tujuan:

Menghindari ketergantungan satu provider.


Architecture:


```

AI Service

```
    |
```

Model Interface

```
    |
```

+-------+-------+

|               |

OpenAI       Local Model

API          LLM

```


Contoh:


```

GenerateQuestion()

tidak langsung memanggil OpenAI API

```


Tetapi:


```

LLMProvider.Generate()

```


---

# 9. Supported AI Provider


Potential:


```

OpenAI

Anthropic

Google Gemini

Open Source LLM

Local Model

```


Provider dapat diganti tanpa mengubah business logic.


---

# 10. AI Question Generator Architecture


Use case:


Guru membuat soal otomatis.


Flow:


```

Teacher

|

Input:

Subject

Class

Difficulty

Topic

|

AI Generator

|

Prompt Builder

|

LLM

|

Generated Question

|

Validation

|

Human Review

|

Question Bank

```


---

# 11. Question Generation Pipeline


Pipeline:


```

Requirement

|

Prompt Construction

|

LLM Generation

|

Output Parsing

|

Quality Check

|

Save Draft

|

Approval

```


---

# 12. Prompt Management System


Prompt tidak hardcode.


Disimpan sebagai:


```

Prompt Template

id

name

version

template

variables

created_at

```


Contoh:


```

Generate Mathematics Question v1

Generate Physics Explanation v2

```


---

# 13. AI Explanation Generator


Flow:


```

Question

|

AI Explanation Service

|

Generate:

* Answer Explanation
* Concept Explanation
* Learning Tip

|

Save Result

```


---

# 14. AI Tutor Architecture


AI Tutor membantu siswa.


Architecture:


```

Student Question

|

Conversation Service

|

Context Retrieval

|

AI Model

|

Response

```


---

# 15. RAG Architecture


AI Tutor menggunakan Retrieval Augmented Generation.


Flow:


```

Knowledge Source

```
    |

    |
```

Document Processing

```
    |

    |
```

Chunking

```
    |

    |
```

Embedding

```
    |

    |
```

Vector Database

```
    |

    |
```

Retriever

```
    |

    |
```

LLM

```
    |

    |
```

Answer

```


---

# 16. Knowledge Base Source


Sumber:


```

Learning Material

Question Explanation

Curriculum

Teacher Content

Reference Document

```


---

# 17. Document Processing Pipeline


```

Upload Document

```
    |
```

Parser

```
    |
```

Text Extraction

```
    |
```

Chunking

```
    |
```

Embedding

```
    |
```

Vector Storage

```


---

# 18. Vector Database Architecture


Future:


```

AI Query

|

Embedding

|

Vector Search

|

Relevant Context

|

LLM

```


Potential:


```

pgvector

Qdrant

Milvus

Pinecone

```


---

# 19. AI Recommendation System


Tujuan:


Memberikan rekomendasi:


```

Materi Berikutnya

Latihan Soal

Topik Lemah

Strategi Belajar

```


Input:


```

Exam Result

Learning History

Difficulty Pattern

Time Spent

```


---

# 20. AI Analytics


AI dapat menganalisa:


```

Student Performance

Question Difficulty

Learning Pattern

Common Mistake

```


---

# 21. AI Workflow Architecture


AI task menggunakan queue.


```

User Request

|

Create AI Job

|

AI Queue

|

AI Worker

|

LLM Processing

|

Save Result

|

Notification

```


---

# 22. AI Cost Management


AI memiliki cost tinggi.


Strategy:


```

Model Routing

*

Caching

*

Token Optimization

*

Batch Processing

```


---

# 23. AI Response Cache


Cache untuk:


```

Repeated Explanation

Common Question

FAQ

```


Tidak cache:


```

Personal Student Data

Private Conversation

```


---

# 24. AI Security


Protection:


```

Prompt Injection Prevention

Input Validation

Output Filtering

Data Privacy

Access Control

```


---

# 25. Prompt Injection Defense


Risiko:


```

User:

Ignore previous instruction

```


Protection:


```

System Prompt Isolation

Input Sanitization

Context Filtering

```


---

# 26. AI Data Privacy


Tidak boleh:


```

Mengirim Data Sensitif Student

ke External Model

tanpa kontrol

```


Strategy:


```

Data Masking

Tenant Isolation

Permission Check

```


---

# 27. AI Evaluation System


AI output harus diukur.


Metrics:


```

Accuracy

Relevance

Hallucination Rate

User Feedback

Teacher Approval Rate

```


---

# 28. Human In The Loop


Untuk konten pendidikan:


```

AI Generate

```
  |
```

Teacher Review

```
  |
```

Publish

```


Terutama:

- soal ujian;
- pembahasan;
- materi.


---

# 29. AI Monitoring


Monitor:


```

Request Count

Token Usage

Latency

Error Rate

Model Performance

```


---

# 30. MVP Implementation


MVP:


```

AI Module

*

Queue Worker

*

External LLM API

*

PostgreSQL Storage

```


Belum:


```

Dedicated AI Cluster

Vector Database

Fine Tuning Pipeline

```


---

# 31. Future AI Platform


Evolution:


```

Phase 1

AI Assistant

```
    |
```

Phase 2

RAG System

```
    |
```

Phase 3

Adaptive Learning AI

```
    |
```

Phase 4

AI Education Platform

```


---

# 32. Summary


AI Service Architecture YakinLulus.id:


```

AI Gateway

*

Model Adapter

*

Prompt Management

*

RAG Ready

*

Human Verification

*

Scalable AI Service

```


Memberikan:

- otomatisasi pembuatan konten;
- AI tutor;
- rekomendasi belajar;
- fondasi adaptive learning;
- kesiapan menuju intelligent EdTech platform.
```
