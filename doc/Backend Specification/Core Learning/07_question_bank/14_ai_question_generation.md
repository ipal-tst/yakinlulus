Saya justru menganggap **14_ai_question_generation.md** sebagai salah satu dokumen inti seluruh platform YakinLulus.id. Berdasarkan seluruh PRD dan arsitektur yang telah kita susun, AI bukan sekadar "generate soal", tetapi menjadi **Question Generation Pipeline** yang terintegrasi dengan Question Bank, Review Workflow, Metadata, Search, dan CBT.

Dokumen ini saya sarankan didesain agar siap mendukung berbagai model LLM di masa depan (OpenAI, Gemini, Claude, DeepSeek, Qwen, Llama, model lokal, dsb.) tanpa mengubah business logic.

---

````markdown
# 14_ai_question_generation.md

# AI Question Generation Specification

Version : 1.0

---

# 1. Overview

AI Question Generation bertanggung jawab menghasilkan soal baru berdasarkan
kurikulum, metadata, referensi resmi, dan contoh soal yang tersedia.

AI bukan pengganti editor.

Seluruh hasil AI wajib melalui proses Review Workflow.

---

# 2. Objectives

AI digunakan untuk:

- Generate Question
- Generate Distractor
- Generate Explanation
- Generate Metadata
- Generate Tags
- Generate Bloom Classification
- Generate Difficulty Prediction
- Generate Similar Questions
- Generate Variations
- Generate Story Questions

---

# 3. High Level Architecture

```
Source Material
       │
       ▼
Knowledge Extraction
       │
       ▼
Prompt Builder
       │
       ▼
LLM Provider
       │
       ▼
AI Validation
       │
       ▼
Metadata Generator
       │
       ▼
Duplicate Detection
       │
       ▼
Question Draft
       │
       ▼
Review Workflow
       │
       ▼
Question Bank
```

---

# 4. Supported Generation Types

## Generate New Question

Membuat soal baru berdasarkan materi.

---

## Rewrite Question

Menghasilkan soal ekuivalen.

---

## Difficulty Adjustment

Mengubah soal menjadi:

- Easy
- Medium
- Hard

---

## Bloom Adjustment

Mengubah level Bloom.

Contoh

C2

↓

C4

---

## Distractor Generation

Menghasilkan pilihan jawaban yang realistis.

---

## Explanation Generation

Menghasilkan pembahasan lengkap.

---

## Story Generation

Menghasilkan stimulus yang digunakan oleh beberapa soal.

---

## Question Expansion

Menghasilkan beberapa variasi soal dari satu konsep.

---

# 5. AI Input

Input AI dapat berupa.

- Kurikulum
- Mata Pelajaran
- Bab
- Kompetensi
- Learning Objective
- Tingkat Kesulitan
- Bloom Level
- HOTS
- Bahasa
- Referensi Materi
- Contoh Soal
- Blueprint

---

# 6. Knowledge Sources

AI menggunakan sumber berikut.

- Materi Pelajaran
- Buku
- Modul
- Soal Resmi
- Soal Internal
- Pembahasan
- Knowledge Base
- RAG Repository

AI tidak mengambil data langsung dari internet saat proses produksi.

---

# 7. Prompt Builder

Prompt dibangun secara terstruktur.

Komponen.

- System Prompt
- Academic Rules
- Curriculum Rules
- Output Format
- Constraints
- Few-shot Examples

Prompt bersifat versioned.

---

# 8. Output Structure

AI menghasilkan.

- Stem
- Story
- Options
- Correct Answer
- Explanation
- Metadata
- Bloom
- Difficulty
- Tags
- References
- Confidence Score

Output wajib dalam format JSON terstruktur.

---

# 9. Validation Pipeline

Output AI divalidasi.

- JSON Schema
- Required Fields
- Option Count
- Answer Exists
- Duplicate Option
- Metadata Completeness
- Language Validation

Jika gagal.

↓

Reject

---

# 10. Duplicate Detection

Question dibandingkan dengan bank soal.

Metode.

- Exact Match
- FTS Similarity
- Embedding Similarity
- AI Semantic Similarity

Jika similarity melebihi threshold.

↓

Need Review

---

# 11. Metadata Generation

AI menghasilkan.

- Subject
- Chapter
- Topic
- Difficulty
- Bloom
- HOTS
- Estimated Time
- Tags
- Keywords

Metadata dapat dioverride oleh reviewer.

---

# 12. Difficulty Calibration

Difficulty ditentukan berdasarkan.

- Prompt
- AI Prediction
- Historical Statistics (jika tersedia)
- Reviewer Assessment

Final difficulty ditetapkan setelah review.

---

# 13. Explanation Generation

AI menghasilkan pembahasan.

Minimal.

- Langkah Penyelesaian
- Alasan Jawaban Benar
- Alasan Pilihan Lain Salah
- Ringkasan Konsep

---

# 14. Distractor Generation

Distractor harus.

- masuk akal
- tidak ambigu
- tidak identik
- tidak terlalu mudah ditebak

AI menghindari pola.

```
A

B

C

Semua Benar
```

kecuali memang diperbolehkan.

---

# 15. Review Requirement

Seluruh hasil AI masuk ke.

Draft

↓

Validation

↓

AI Review

↓

Editorial Review

↓

Academic Review

↓

Publish

Tidak ada hasil AI yang langsung dipublikasikan.

---

# 16. AI Confidence

Setiap output memiliki confidence score.

Contoh.

| Score | Action |
|--------|--------|
| ≥ 0.95 | Minor Review |
| 0.80–0.94 | Standard Review |
| < 0.80 | Intensive Review |

Confidence tidak menggantikan review manusia.

---

# 17. AI Versioning

Disimpan.

- Provider
- Model
- Model Version
- Prompt Version
- Temperature
- Top P
- Max Tokens
- Generated At

Agar hasil dapat direproduksi.

---

# 18. Provider Abstraction

AI diakses melalui interface.

```
QuestionGenerator
      │
      ├── OpenAI
      ├── Gemini
      ├── Claude
      ├── DeepSeek
      ├── Qwen
      ├── Local LLM
      └── Future Provider
```

Business logic tidak bergantung pada vendor tertentu.

---

# 19. RAG Integration

Sebelum memanggil LLM.

```
Query

↓

Embedding Search

↓

Relevant Material

↓

Prompt Builder

↓

LLM
```

RAG menjadi sumber referensi utama.

---

# 20. Background Jobs

Job.

- Generate Question
- Generate Explanation
- Generate Distractor
- Generate Embedding
- Duplicate Detection
- Metadata Prediction

Semua dijalankan asynchronous.

---

# 21. Database Objects

```
ai_generation_job

ai_prompt

ai_model

question_generation_log

question_version

question_embedding

question_metadata
```

---

# 22. Domain Events

```
QuestionGenerationRequested

PromptBuilt

QuestionGenerated

ValidationPassed

ValidationFailed

DuplicateDetected

QuestionDraftCreated

AIReviewCompleted
```

---

# 23. Security

AI tidak boleh.

- langsung publish
- menghapus soal
- mengubah soal published
- mengakses data sensitif
- mengakses prompt rahasia provider lain

Seluruh prompt dan hasil dicatat untuk audit sesuai kebijakan retensi.

---

# 24. Performance Target

| Process | Target |
|----------|---------|
| Prompt Builder | < 200 ms |
| RAG Retrieval | < 500 ms |
| LLM Response | < 30 detik |
| Validation | < 2 detik |
| Draft Creation | < 1 detik |

---

# 25. Monitoring

Dipantau.

- Success Rate
- Failure Rate
- Average Response Time
- Cost per Generation
- Token Usage
- Duplicate Rate
- Review Acceptance Rate

---

# 26. Future Roadmap

- Multi-Agent Generation
- Self-Critique Pipeline
- Automatic Fact Checking
- Automatic Bias Detection
- Automatic Curriculum Alignment
- Automatic Difficulty Calibration (IRT)
- Image-Based Question Generation
- Diagram Generation
- Formula Rendering
- Adaptive Prompt Optimization
- Human Feedback Reinforcement
````

---

# Rekomendasi Arsitektur (Sangat Direkomendasikan)

Untuk YakinLulus.id, saya menyarankan AI dibangun sebagai **pipeline modular**, bukan satu service yang langsung memanggil LLM.

```text
                   AI API
                     │
                     ▼
             Generation Service
                     │
     ┌───────────────┼────────────────┐
     ▼               ▼                ▼
 RAG Retriever   Prompt Builder   Model Router
     │               │                │
     └───────────────┼────────────────┘
                     ▼
               LLM Provider
                     │
                     ▼
             Output Validator
                     │
                     ▼
            Metadata Generator
                     │
                     ▼
          Duplicate Detection
                     │
                     ▼
             Draft Repository
                     │
                     ▼
            Review Workflow
```

## Struktur package Go yang direkomendasikan

```text
internal/questionbank/ai/
│
├── provider/
│   ├── provider.go          // interface
│   ├── openai.go
│   ├── gemini.go
│   ├── claude.go
│   ├── deepseek.go
│   ├── qwen.go
│   └── local.go
│
├── prompt/
│   ├── builder.go
│   ├── template.go
│   └── version.go
│
├── rag/
│   ├── retriever.go
│   ├── reranker.go
│   └── context_builder.go
│
├── validator/
│   ├── schema_validator.go
│   ├── business_validator.go
│   └── duplicate_checker.go
│
├── metadata/
│   └── predictor.go
│
├── pipeline/
│   ├── generator.go
│   ├── workflow.go
│   └── orchestrator.go
│
└── service.go
```

## Rekomendasi Penyempurnaan Khusus YakinLulus.id

Berdasarkan keseluruhan roadmap proyek, saya menyarankan AI Question Generation dibagi menjadi **empat tahap yang independen**:

1. **Knowledge Layer** — mengambil konteks melalui RAG dari materi, kurikulum, dan bank soal.
2. **Generation Layer** — menghasilkan soal, pilihan jawaban, pembahasan, dan metadata menggunakan LLM.
3. **Evaluation Layer** — memvalidasi struktur, mendeteksi duplikasi, memeriksa konsistensi jawaban, serta memberi skor kualitas dan confidence.
4. **Publishing Layer** — membuat `question_version` baru berstatus **Draft** dan meneruskannya ke workflow review.

Pemisahan ini membuat setiap tahap dapat dikembangkan, diuji, dan diganti secara independen, sehingga ketika Anda ingin mengganti model LLM atau meningkatkan pipeline AI di masa depan, perubahan tidak akan memengaruhi modul Question Bank maupun CBT Engine.
