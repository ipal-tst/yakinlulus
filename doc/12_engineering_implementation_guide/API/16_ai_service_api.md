# AI Service API

**Document** : `api/16_ai_service_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan spesifikasi **AI Service API** pada YakinLulus.id.

AI Service merupakan lapisan (AI Layer) yang menyediakan seluruh kemampuan Artificial Intelligence pada platform tanpa mengganggu domain utama (Core Business).

Semua fitur AI bersifat **modular**, **optional**, dan dapat diaktifkan atau dinonaktifkan sesuai kebutuhan.

AI Service tidak menyimpan data bisnis utama.

AI Service hanya:

- menerima request
- melakukan reasoning
- mengakses Knowledge Base (RAG)
- menghasilkan response

---

# 2. AI Service Scope

MVP belum mewajibkan seluruh fitur AI aktif.

Roadmap AI:

- AI Tutor
- AI Explanation
- AI Question Generator
- AI Question Validation
- AI Difficulty Analysis
- AI Recommendation
- AI Learning Path
- AI Summarization
- AI Chat
- AI Content Moderation

---

# 3. Architecture Overview

```text
            Web / Mobile

                  │

                  ▼

            AI Gateway API

                  │

      ┌───────────┼────────────┐

      ▼           ▼            ▼

 AI Tutor    Question AI    AI Search

                  │

                  ▼

             AI Orchestrator

      ┌───────────┼────────────┐

      ▼           ▼            ▼

   LLM        RAG Engine   Embedding

                  │

                  ▼

      Vector Database (pgvector)

                  │

                  ▼

            PostgreSQL
```

---

# 4. AI Principles

AI Service harus memenuhi prinsip berikut:

- Stateless
- Asynchronous jika proses berat
- Model Agnostic
- Prompt Versioning
- Context Aware
- Secure by Design
- Human Verification (untuk proses tertentu)
- Cost Efficient

---

# 5. Endpoint Overview

| Method | Endpoint | Fungsi |
|---------|----------|--------|
| POST | /ai/chat | AI Tutor |
| POST | /ai/explanation | AI Penjelasan Soal |
| POST | /ai/question-generator | Generate Soal |
| POST | /ai/question-review | Review Soal |
| POST | /ai/recommendation | Rekomendasi Belajar |
| POST | /ai/summarize | Ringkasan Materi |
| POST | /ai/search | Semantic Search |
| GET | /ai/models | Daftar Model AI |

---

# 6. AI Chat API

```http
POST /api/v1/ai/chat
```

Request

```json
{
  "conversationId": "conv_001",
  "message": "Jelaskan Hukum Newton 2",
  "context": {
    "grade": "10",
    "subject": "Physics"
  }
}
```

Response

```json
{
  "success": true,
  "data": {
    "answer": "...",
    "references": [
      {
        "materialId": "mat_001"
      }
    ]
  }
}
```

---

# 7. AI Explanation API

```http
POST /api/v1/ai/explanation
```

Request

```json
{
  "questionId": "q_001"
}
```

AI akan:

- mengambil soal
- mengambil pembahasan resmi
- mengambil materi terkait
- menghasilkan penjelasan yang mudah dipahami

Jika tersedia pembahasan resmi, AI harus mengutamakan sumber tersebut.

---

# 8. AI Question Generator

```http
POST /api/v1/ai/question-generator
```

Request

```json
{
  "subject": "Matematika",
  "chapter": "Persamaan Linear",
  "difficulty": "medium",
  "amount": 20
}
```

Output:

- soal
- opsi jawaban
- jawaban benar
- pembahasan
- metadata

Hasil tidak langsung dipublikasikan dan harus melalui proses review.

---

# 9. AI Question Review

```http
POST /api/v1/ai/question-review
```

Fungsi:

- validasi grammar
- validasi logika
- validasi opsi jawaban
- analisis tingkat kesulitan
- deteksi duplikasi
- deteksi potensi bias

---

# 10. AI Recommendation

```http
POST /api/v1/ai/recommendation
```

Input:

- histori belajar
- hasil ujian
- kelemahan materi
- progres

Output:

```text
Materi berikutnya

↓

Soal latihan

↓

Target belajar

↓

Estimasi peningkatan
```

---

# 11. AI Summarization

```http
POST /api/v1/ai/summarize
```

Menghasilkan:

- Ringkasan materi
- Poin penting
- Rumus
- Kesimpulan
- Flash Card (Future)

---

# 12. Semantic Search

```http
POST /api/v1/ai/search
```

Request

```json
{
  "query": "Persamaan linear dua variabel"
}
```

Flow:

```text
Query

↓

Embedding

↓

Vector Search

↓

Top-K Result

↓

LLM

↓

Response
```

---

# 13. AI Model Registry

```http
GET /api/v1/ai/models
```

Contoh response

```json
[
  {
    "name": "GPT-5",
    "purpose": "Tutor"
  },
  {
    "name": "Embedding Model",
    "purpose": "Vector Search"
  }
]
```

Model registry memudahkan pergantian model tanpa mengubah API.

---

# 14. Prompt Management

Prompt tidak ditulis langsung di source code.

Struktur:

```text
Prompt Template

↓

Prompt Version

↓

Prompt Repository

↓

AI Gateway
```

Keuntungan:

- versioning
- audit
- A/B testing
- rollback

---

# 15. RAG Integration

Seluruh AI Tutor menggunakan RAG.

```text
Question

↓

Embedding

↓

Vector Search

↓

Knowledge Context

↓

LLM

↓

Answer
```

Knowledge Source:

- Learning Material
- Official Explanation
- Question Bank
- Kurikulum
- Dokumentasi internal

---

# 16. AI Processing Mode

Mode proses:

```text
Synchronous

↓

Chat

↓

Explanation
```

```text
Asynchronous

↓

Question Generation

↓

Mass Review

↓

Bulk Summarization
```

Proses asynchronous menggunakan Queue Worker.

---

# 17. Authorization

| Role | Hak Akses |
|------|-----------|
| Student | AI Tutor, AI Explanation, Recommendation |
| Teacher | AI Tutor, Review, Generate Soal |
| Staff | Generate, Review |
| Admin | Seluruh layanan AI |
| Super Admin | Full Access |

---

# 18. Rate Limiting

Contoh kebijakan:

| Endpoint | Limit |
|----------|-------|
| AI Chat | 60 request/jam |
| Explanation | 120 request/jam |
| Recommendation | 30 request/jam |
| Question Generator | 10 request/jam |

Nilai limit dapat dikonfigurasi sesuai kapasitas infrastruktur.

---

# 19. Error Code

```text
MODEL_UNAVAILABLE

PROMPT_NOT_FOUND

RAG_NOT_READY

VECTOR_SEARCH_FAILED

TOKEN_LIMIT_EXCEEDED

RATE_LIMIT_EXCEEDED

CONTENT_BLOCKED
```

---

# 20. Security Consideration

AI Service wajib menerapkan:

- JWT Authentication
- RBAC Authorization
- Prompt Injection Protection
- Input Sanitization
- Output Filtering
- PII Masking
- Audit Logging
- Rate Limiting
- Model Timeout
- Content Moderation

Prompt sistem tidak boleh diekspos ke client.

---

# 21. Performance Strategy

Optimasi:

- Response Cache
- Embedding Cache
- Prompt Cache
- Streaming Response
- Queue Worker
- Model Routing
- Parallel Retrieval
- Connection Pool

Target:

| Endpoint | Target P95 |
|----------|------------|
| AI Chat | < 3 detik |
| AI Explanation | < 2 detik |
| AI Recommendation | < 2 detik |
| Semantic Search | < 1 detik |

---

# 22. Scalability Consideration

AI Layer dirancang untuk:

- Multi Model
- Multi Provider
- Horizontal Scaling
- GPU Worker (Future)
- Distributed Queue
- Prompt Registry
- Model Registry
- Multi Region Deployment

Perubahan provider LLM tidak memerlukan perubahan pada kontrak API.

---

# 23. Future Evolution

Roadmap:

- Multi-Agent Architecture
- Voice Tutor
- AI Speaking Assessment
- AI Essay Grading
- AI Curriculum Builder
- AI Personalized Learning Path
- AI Study Planner
- AI Classroom Assistant
- Fine-tuned Domain Model
- On-premise LLM Support

---

# Summary

AI Service API menjadi gerbang tunggal untuk seluruh kemampuan Artificial Intelligence di YakinLulus.id.

Karakteristik utama:

- Terpisah dari domain bisnis utama.
- Mendukung AI Tutor, RAG, Recommendation, dan Question Generation.
- Menggunakan AI Gateway, Prompt Registry, dan Model Registry agar fleksibel terhadap perubahan model.
- Mengintegrasikan Vector Database (pgvector) untuk semantic search.
- Mendukung proses synchronous dan asynchronous.
- Siap berkembang menjadi platform AI Education berskala enterprise tanpa mengubah kontrak API.
