# 18_ai_service_architecture.md

# YakinLulus.id AI Service Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **AI Service** pada platform YakinLulus.id.

AI merupakan salah satu komponen utama platform yang bertugas membantu proses:

* AI Question Generation
* AI Question Validation
* AI Question Classification
* AI Explanation Generation
* AI Learning Recommendation
* AI Content Analysis
* AI Difficulty Prediction
* AI Quality Assurance

Seluruh layanan AI dirancang sebagai **independent service** sehingga dapat berkembang tanpa memengaruhi backend utama.

---

# 2. Objectives

AI Service Architecture dirancang untuk:

* Modular
* Provider Agnostic
* Scalable
* Asynchronous
* Observable
* Secure
* Cost Efficient
* Easily Replaceable

---

# 3. AI Design Principles

Seluruh implementasi mengikuti prinsip:

* AI is Infrastructure
* Human Approval First
* Prompt Versioning
* Provider Independent
* Async Processing
* Event Driven
* Idempotent
* Explainable

AI **tidak** boleh langsung mengubah data produksi tanpa proses validasi yang sesuai.

---

# 4. High Level Architecture

```text id="z8m4xt"
User

↓

Backend API

↓

AI Service

↓

Queue

↓

Worker

↓

LLM Provider

↓

Result

↓

Validation

↓

Database
```

Semua proses AI yang memerlukan waktu lebih dari beberapa detik diproses secara asynchronous.

---

# 5. AI Service Position

```text id="g7k2pl"
Frontend

↓

Backend API

↓

Business Service

↓

AI Adapter

↓

LLM Provider
```

Business Service hanya mengenal AI Adapter, bukan provider tertentu.

---

# 6. Service Components

Komponen utama:

* AI Adapter
* Prompt Manager
* AI Worker
* AI Queue
* AI Repository
* AI Validator
* AI Parser
* AI Quality Checker
* AI Audit Logger

---

# 7. Directory Structure

```text id="k3w9rx"
internal/

modules/

ai/

controller/

service/

repository/

adapter/

prompt/

validator/

parser/

worker/

dto/
```

---

# 8. AI Adapter Pattern

Seluruh provider menggunakan interface.

```go id="m2v5ah"
type AIProvider interface {
    Generate(...)
    Embedding(...)
    Moderation(...)
}
```

Implementasi:

* OpenAI
* Anthropic
* Google Gemini
* DeepSeek
* Local LLM

Backend tidak bergantung langsung pada vendor tertentu.

---

# 9. AI Provider Strategy

MVP:

* OpenAI GPT
* Google Gemini

Future:

* Anthropic Claude
* DeepSeek
* Azure OpenAI
* Ollama
* Local LLM (Llama, Mistral, Qwen)

Provider dipilih melalui konfigurasi.

---

# 10. AI Request Flow

```text id="r4x6np"
Business Event

↓

Create AI Task

↓

Queue

↓

Worker

↓

Prompt Builder

↓

LLM

↓

Response Parser

↓

Validator

↓

Save Result
```

---

# 11. AI Job Types

Jenis pekerjaan AI:

* Generate Question
* Generate Explanation
* Generate Hint
* Rewrite Question
* Difficulty Prediction
* Bloom Taxonomy Classification
* Subject Classification
* OCR Post Processing
* Metadata Extraction

---

# 12. AI Question Generation

Flow:

```text id="y5p1lu"
Question Blueprint

↓

Prompt Builder

↓

LLM

↓

Question JSON

↓

Validation

↓

Save Draft
```

Hasil AI masuk ke status **Draft** dan menunggu review oleh Admin atau Guru.

---

# 13. AI Explanation Generation

Input:

* Question
* Answer
* Difficulty
* Subject
* Grade

Output:

* Step-by-step explanation
* Common mistakes
* Learning tips
* Related concepts

---

# 14. AI Classification

AI mengklasifikasikan:

* Jenjang
* Kelas
* Mata Pelajaran
* Bab
* Sub Bab
* Difficulty
* Cognitive Level (Bloom)
* Tags

Hasil klasifikasi dapat dikoreksi oleh editor.

---

# 15. AI Recommendation

Future:

* Personalized Material
* Personalized Question
* Weak Topic Detection
* Learning Path
* Exam Recommendation

Rekomendasi memanfaatkan histori belajar dan hasil CBT.

---

# 16. Prompt Management

Prompt dipisahkan dari kode aplikasi.

```text id="b9n7eq"
prompts/

question_generation.md

explanation.md

classification.md

recommendation.md
```

Prompt tidak di-hardcode di Service.

---

# 17. Prompt Versioning

Setiap prompt memiliki:

* Version
* Author
* Created At
* Description
* Active Status

Perubahan prompt dapat diaudit dan di-roll back.

---

# 18. Prompt Builder

Prompt dibangun dari:

```text id="u6f2ky"
Template

↓

Context

↓

Variables

↓

Final Prompt
```

Variabel meliputi jenjang, mata pelajaran, kurikulum, tingkat kesulitan, dan gaya soal.

---

# 19. Structured Output

Seluruh output AI menggunakan JSON Schema.

Contoh:

```json id="q3d8mw"
{
  "question": "...",
  "options": [],
  "answer": "A",
  "difficulty": "medium",
  "explanation": "...",
  "tags": []
}
```

Response parser melakukan validasi sebelum data diproses lebih lanjut.

---

# 20. Response Validation

Validator memeriksa:

* JSON Valid
* Required Field
* Duplicate Option
* Empty Explanation
* Invalid Answer
* Invalid Difficulty
* Invalid Subject

Output yang tidak valid akan ditolak atau dikirim ulang.

---

# 21. Human Review Workflow

```text id="v1r5zh"
AI Generated

↓

Draft

↓

Teacher Review

↓

Approved

↓

Published
```

AI tidak mempublikasikan soal secara otomatis.

---

# 22. AI Audit

Seluruh proses AI dicatat.

Audit mencakup:

* Prompt Version
* Provider
* Model
* Token Usage
* Duration
* User
* Generated Result ID

Audit mendukung evaluasi kualitas dan biaya.

---

# 23. Token Usage

Setiap request mencatat:

* Prompt Tokens
* Completion Tokens
* Total Tokens
* Estimated Cost

Informasi ini digunakan untuk monitoring dan optimasi penggunaan model.

---

# 24. Retry Strategy

Retry dilakukan untuk:

* Timeout
* Rate Limit
* Temporary Network Error

Retry tidak dilakukan untuk:

* Prompt Validation Error
* Invalid Input
* Unsupported Model

---

# 25. Rate Limiting

AI Service memiliki pembatasan:

* Request per Minute
* Concurrent Request
* Daily Quota
* Monthly Budget

Limit dikonfigurasi berdasarkan provider dan paket langganan.

---

# 26. AI Queue

Semua pekerjaan AI menggunakan queue khusus.

```text id="t7j3vb"
ai

↓

Worker

↓

LLM
```

Queue AI dipisahkan dari notification dan analytics.

---

# 27. Worker Scaling

```text id="m4h8sp"
Redis Queue

↓

AI Worker A

AI Worker B

AI Worker C
```

Jumlah worker dapat disesuaikan dengan beban.

---

# 28. AI Cache

Cache digunakan untuk:

* Prompt Template
* Embedding (Future)
* Metadata Model
* Frequently Used Classification

Response generatif tidak di-cache secara umum karena sifatnya dinamis.

---

# 29. Security

Data berikut tidak boleh dikirim ke provider AI:

* Password
* JWT
* API Key
* Session Token
* Internal Secret
* Data pribadi yang tidak diperlukan

Lakukan minimisasi data sebelum membangun prompt.

---

# 30. Privacy

Prompt hanya berisi informasi yang relevan.

Untuk data pengguna:

* Gunakan ID internal bila memungkinkan.
* Hindari pengiriman identitas lengkap.
* Terapkan masking jika diperlukan.

Kebijakan ini membantu memenuhi prinsip perlindungan data.

---

# 31. Logging

Log AI mencatat:

* Request ID
* Job ID
* Provider
* Model
* Duration
* Token Usage
* Status

Konten prompt dan output lengkap tidak dicatat pada level INFO untuk menghindari kebocoran data.

---

# 32. Monitoring

Metric:

* AI Request Count
* Success Rate
* Failure Rate
* Average Duration
* Token Usage
* Estimated Cost
* Queue Length
* Retry Count

Dashboard observability menampilkan metrik per provider dan per model.

---

# 33. Failure Handling

Jika provider gagal:

```text id="p8v4yn"
Retry

↓

Fallback Provider

↓

Failed Queue
```

Fallback provider bersifat opsional dan dapat diaktifkan melalui konfigurasi.

---

# 34. AI Model Registry

Konfigurasi model:

```text id="j5w9ef"
Provider

Model

Max Tokens

Temperature

Top P

Timeout

Status
```

Perubahan model tidak memerlukan perubahan kode business logic.

---

# 35. Future AI Services

Roadmap:

* OCR Service
* Speech-to-Text
* Text-to-Speech
* Image Generation
* Diagram Generation
* AI Tutor
* AI Essay Evaluation
* AI Adaptive Learning Engine
* Vector Search
* Retrieval-Augmented Generation (RAG)

---

# 36. Integration with Question Pipeline

Pipeline otomatis:

```text id="e2q7ka"
Official Question Dataset

↓

OCR

↓

Parsing

↓

Classification

↓

AI Analysis

↓

Question Generation

↓

Validation

↓

Teacher Review

↓

Publish
```

Pipeline ini mendukung visi otomatisasi Bank Soal YakinLulus.id.

---

# 37. Testing Strategy

Pengujian mencakup:

* Prompt Builder
* Response Parser
* JSON Validation
* Retry
* Timeout
* Provider Failure
* Fallback Provider
* Queue Processing
* Human Review Flow

Gunakan mock provider untuk unit test agar tidak bergantung pada layanan eksternal.

---

# 38. Anti-Patterns

Tidak diperbolehkan:

* Memanggil LLM langsung dari Controller.
* Hardcode prompt di source code.
* Menyimpan API Key di repository.
* Mengabaikan validasi output AI.
* Memublikasikan hasil AI tanpa review.
* Mengirim seluruh database ke model.
* Menggabungkan business logic dengan adapter provider.

---

# 39. AI Architecture Checklist

Sebelum implementasi:

* AI Adapter tersedia.
* Queue digunakan.
* Prompt terpisah.
* Prompt versioning aktif.
* JSON Schema diterapkan.
* Human Review tersedia.
* Logging aktif.
* Monitoring aktif.
* Token usage dicatat.
* Unit & integration test tersedia.

---

# 40. Summary

AI Service Architecture YakinLulus.id dibangun sebagai **independent, asynchronous, provider-agnostic service** yang terintegrasi dengan Background Job dan Business Layer melalui Adapter Pattern.

Arsitektur ini memberikan:

* Fleksibilitas mengganti provider AI tanpa mengubah business logic.
* Skalabilitas melalui worker dan queue.
* Kontrol kualitas melalui validasi dan human review.
* Monitoring biaya melalui token usage.
* Fondasi untuk roadmap AI jangka panjang, termasuk otomatisasi bank soal, AI tutor, adaptive learning, dan RAG.
