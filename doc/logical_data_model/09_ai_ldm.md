# 09_ai_ldm.md

# Logical Data Model
## Domain : Artificial Intelligence (AI)

Version : 1.0

---

# Tujuan

AI Domain mengelola seluruh layanan kecerdasan buatan yang digunakan pada platform YakinLulus.

Domain ini bertanggung jawab terhadap:

- AI Question Generator
- AI Content Generator
- AI Tutor
- AI Recommendation
- AI Analysis
- AI Evaluation
- AI Processing Pipeline
- Prompt Management
- Model Management
- AI Usage Tracking

AI Domain **bukan pemilik data akademik utama**.

AI hanya menggunakan data dari domain lain.

Contoh:

```
Question Bank
        |
        ▼
AI Generator
        |
        ▼
Generated Question
```

```
Learning Resource
        |
        ▼
AI Summary
        |
        ▼
Learning Assistant
```

---

# Prinsip Utama

AI Domain berfungsi sebagai **Intelligence Layer**.

Domain lain menyediakan:

```
Data
Knowledge
Context
Rules
```

AI menyediakan:

```
Generation
Prediction
Recommendation
Analysis
Automation
```

---

# Aggregate Root

```
AI Job
```

---

# Entity Hierarchy

```
AI Job
│
├── AI Task
├── AI Pipeline
├── AI Model
├── AI Provider
├── AI Prompt Template
├── AI Prompt Execution
├── AI Knowledge Source
├── AI Embedding
├── AI Vector Document
├── AI Generated Content
├── AI Evaluation
├── AI Recommendation
├── AI Feedback
├── AI Usage
├── AI Cost Tracking
├── AI History
└── AI Audit
```

---

# Logical Entity List

| Entity | Purpose |
|---|---|
| AI Job | Proses AI utama |
| AI Task | Unit pekerjaan AI |
| AI Pipeline | Workflow AI |
| AI Model | Model AI |
| AI Provider | Penyedia AI |
| AI Prompt Template | Template prompt |
| AI Prompt Execution | Eksekusi prompt |
| AI Knowledge Source | Sumber pengetahuan |
| AI Embedding | Vector embedding |
| AI Vector Document | Dokumen vector |
| AI Generated Content | Output AI |
| AI Evaluation | Evaluasi output |
| AI Recommendation | Rekomendasi |
| AI Feedback | Feedback pengguna |
| AI Usage | Statistik penggunaan |
| AI Cost Tracking | Biaya AI |
| AI History | Riwayat perubahan |
| AI Audit | Audit |

---

# Aggregate Root

# AI Job

## Business Purpose

Representasi satu proses AI.

Contoh:

```
Generate 1000 soal matematika kelas 9

Generate summary video IPA

Analyze student weakness
```

---

## Candidate Attribute

```
ID

Job Code

Job Type

Requested By

Status

Priority

Created At

Completed At
```

---

# Job Type

```
Question Generation

Content Generation

Content Summary

Recommendation

Evaluation

Classification

Analysis

Embedding Generation
```

---

# AI Task

## Business Purpose

Sub pekerjaan dari AI Job.

---

## Candidate Attribute

```
ID

AI Job ID

Task Type

Input Reference

Status

Started At

Completed At

Result Reference
```

---

Contoh:

```
AI Job

Generate Question Bank

|

├── Analyze Existing Question

├── Generate Question

├── Generate Answer

└── Generate Explanation
```

---

# AI Pipeline

## Business Purpose

Workflow proses AI.

---

## Candidate Attribute

```
ID

Pipeline Name

Description

Version

Status
```

---

Contoh:

```
Question Generation Pipeline

Step 1

Analyze Question Pattern


Step 2

Generate Question


Step 3

Validate


Step 4

Publish
```

---

# AI Model

## Business Purpose

Model AI yang digunakan.

---

## Candidate Attribute

```
ID

Model Name

Version

Provider ID

Capability

Status
```

---

Contoh:

```
GPT Model

Claude Model

Open Source LLM

Embedding Model
```

---

# AI Provider

## Business Purpose

Penyedia layanan AI.

---

## Candidate Attribute

```
ID

Provider Name

API Endpoint

Status

Configuration
```

---

Contoh:

```
OpenAI

Anthropic

Google

Local Model
```

---

# AI Prompt Template

## Business Purpose

Template instruksi AI.

---

## Candidate Attribute

```
ID

Name

Purpose

Template

Version

Created By

Status
```

---

Contoh:

```
Generate Mathematics Question

Analyze Difficulty Level

Create Explanation
```

---

# AI Prompt Execution

## Business Purpose

Log eksekusi prompt.

---

## Candidate Attribute

```
ID

Prompt Template ID

Model ID

Input Token

Output Token

Latency

Response

Executed At
```

---

# AI Knowledge Source

## Business Purpose

Sumber informasi AI.

---

## Candidate Attribute

```
ID

Source Type

Reference Domain

Reference ID

Status
```

---

Contoh:

```
Question Bank

Learning Resource

Document

Curriculum
```

---

# AI Embedding

## Business Purpose

Vector representation.

---

## Candidate Attribute

```
ID

Source Reference

Embedding Model

Vector Dimension

Created At
```

---

# AI Vector Document

## Business Purpose

Dokumen yang digunakan RAG.

---

## Candidate Attribute

```
ID

Document Name

Chunk Number

Content

Embedding ID

Metadata
```

---

Contoh:

```
Buku Matematika Kelas 9

↓

Chunk 001

↓

Vector
```

---

# AI Generated Content

## Business Purpose

Hasil generate AI.

---

## Candidate Attribute

```
ID

Job ID

Content Type

Source Reference

Generated Data

Status

Created At
```

---

Content Type:

```
Question

Explanation

Summary

Recommendation

Assessment
```

---

# AI Evaluation

## Business Purpose

Validasi hasil AI.

---

## Candidate Attribute

```
ID

Generated Content ID

Evaluator

Score

Validation Result

Comment
```

---

Validation Result:

```
Approved

Rejected

Need Review
```

---

# AI Recommendation

## Business Purpose

Rekomendasi personal.

---

## Candidate Attribute

```
ID

User ID

Recommendation Type

Reference ID

Reason

Confidence Score

Generated At
```

---

Contoh:

```
Siswa lemah aljabar

↓

Rekomendasi materi aljabar
```

---

# AI Feedback

## Business Purpose

Feedback pengguna.

---

## Candidate Attribute

```
ID

Generated Content ID

User ID

Rating

Feedback

Created At
```

---

# AI Usage

## Business Purpose

Monitoring penggunaan AI.

---

## Candidate Attribute

```
ID

User ID

Model ID

Token Input

Token Output

Request Count

Date
```

---

# AI Cost Tracking

## Business Purpose

Perhitungan biaya AI.

---

## Candidate Attribute

```
ID

AI Usage ID

Provider

Input Cost

Output Cost

Total Cost
```

---

# AI History

## Candidate Attribute

```
ID

Entity Name

Entity ID

Action

Old Value

New Value

Changed By

Changed At
```

---

# AI Audit

## Candidate Attribute

```
ID

User ID

Action

IPAddress

Timestamp
```

---

# Relationship

```
AI Job

1

↓

N

AI Task


AI Pipeline

1

↓

N

AI Job


AI Provider

1

↓

N

AI Model


AI Model

1

↓

N

AI Prompt Execution


AI Prompt Template

1

↓

N

AI Prompt Execution


AI Job

1

↓

N

AI Generated Content


AI Generated Content

1

↓

N

AI Evaluation


AI Knowledge Source

1

↓

N

AI Embedding


AI Embedding

1

↓

N

AI Vector Document
```

---

# Ownership

| Entity | Owner |
|---|---|
| AI Job | AI Domain |
| AI Task | AI Domain |
| AI Pipeline | AI Domain |
| AI Model | AI Domain |
| AI Provider | AI Domain |
| AI Prompt Template | AI Domain |
| AI Prompt Execution | AI Domain |
| AI Knowledge Source | AI Domain |
| AI Embedding | AI Domain |
| AI Vector Document | AI Domain |
| AI Generated Content | AI Domain |
| AI Evaluation | AI Domain |
| AI Recommendation | AI Domain |
| AI Feedback | AI Domain |
| AI Usage | AI Domain |
| AI Cost Tracking | AI Domain |
| AI History | AI Domain |
| AI Audit | System Domain |

---

# Cross Domain Reference

AI menggunakan:

- Question Bank
- Learning Resource
- User Management
- Learning
- Analytics
- Media
- Master Academic

---

# Business Constraint

- AI output tidak langsung menjadi data production.
- Semua hasil AI harus melalui validation workflow.
- Prompt harus memiliki version.
- Model harus tercatat.
- Semua penggunaan AI harus tercatat.
- AI tidak boleh mengubah data domain lain secara langsung.
- Generated content harus memiliki source reference.
- Embedding harus memiliki model reference.
- Audit AI tidak boleh dihapus.

---

# Normalization

Target:

```
BCNF
```

Tidak diperbolehkan:

```
Question

generated_by_ai

prompt

model
```

langsung pada Question.

Gunakan:

```
AI Generated Content

AI Job

AI Model
```

---

# Lifecycle

## AI Job

```
Created

↓

Queued

↓

Processing

↓

Completed

↓

Validated

↓

Published

↓

Archived
```

---

## AI Generated Content

```
Generated

↓

Review

↓

Approved

↓

Published

↓

Deprecated
```

---

# Design Notes

## 1. AI Sebagai Bounded Context

AI tidak boleh menjadi pusat database.

Kesalahan umum:

```
AI Question Table
AI Material Table
AI Student Analysis Table
```

Ini membuat AI mengambil alih domain bisnis.

Desain yang benar:

```
Question Bank
        |
        |
        ▼
      AI
        |
        ▼
Question Bank
```

---

# 2. RAG Ready Architecture

Model mendukung Retrieval Augmented Generation.

Flow:

```
Learning Resource

↓

Document Processing

↓

Chunking

↓

Embedding

↓

Vector Database

↓

Retriever

↓

LLM

↓

Response
```

---

# 3. Human In The Loop

AI Generated Content harus memiliki proses:

```
AI Generate

↓

Teacher Review

↓

Approve

↓

Publish
```

---

# 4. AI Question Generation

Mendukung pipeline:

```
Existing Question

↓

Pattern Analysis

↓

Difficulty Detection

↓

AI Generation

↓

Validation

↓

Question Bank
```

---

# 5. AI Tutor Ready

Struktur dapat mendukung:

```
Student

↓

AI Tutor

↓

Learning Context

↓

Question History

↓

Personalized Answer
```

---

# 6. Future Ready

Model ini mendukung:

- RAG System
- AI Tutor
- AI Question Generator
- AI Content Creator
- AI Grading
- AI Feedback
- AI Learning Recommendation
- Knowledge Graph
- Vector Search
- Fine Tuning Pipeline
- Model Evaluation
- Multi LLM Provider
- Local LLM Deployment
- AI Cost Optimization
- AI Governance
- Prompt Version Control
- AI Safety Filtering