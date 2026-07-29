Selanjutnya adalah **24_pgvector_strategy.md**. Ini merupakan dokumen yang akan menjadi fondasi **Semantic Search, Duplicate Detection, AI Question Generation (RAG), Recommendation Engine, dan Adaptive Learning**. Karena YakinLulus.id sejak awal memang dirancang menggunakan AI, saya menyarankan **pgvector dijadikan komponen inti**, bukan fitur tambahan.

Saya juga **tidak menyarankan menggunakan vector database terpisah pada MVP**. PostgreSQL + pgvector sudah lebih dari cukup hingga jutaan embedding apabila didesain dengan benar.

---

````markdown
# 24_pgvector_strategy.md

# Question Bank PGVector Strategy

Version : 1.0

---

# 1. Overview

PGVector digunakan sebagai vector database
yang terintegrasi langsung dengan PostgreSQL.

Tujuan utama.

- Semantic Search
- Duplicate Detection
- AI Question Generation (RAG)
- Similar Question
- Recommendation
- Knowledge Retrieval
- Adaptive Learning

PostgreSQL tetap menjadi Source of Truth.

---

# 2. Architecture

```
Question

↓

Embedding Generator

↓

Embedding Vector

↓

PGVector

↓

Similarity Search

↓

Application
```

---

# 3. Objectives

PGVector digunakan untuk.

- mencari soal serupa
- mencari materi terkait
- membantu AI
- mendeteksi duplikasi
- rekomendasi soal
- adaptive learning

---

# 4. Embedding Sources

Embedding dibuat dari.

- Question Stem
- Story
- Explanation
- Keywords
- Learning Objective
- Metadata
- Tag

Semua dapat digabung menjadi satu context.

---

# 5. Embedding Pipeline

```
Question Published

↓

Embedding Job

↓

LLM Embedding Model

↓

Normalize

↓

Store Vector

↓

Ready
```

Embedding dibuat setelah soal dipublikasikan.

---

# 6. Database Objects

```
question_embedding

material_embedding

taxonomy_embedding

rag_document

embedding_job
```

---

# 7. Embedding Schema

Minimal field.

- embedding_id
- question_id
- model_name
- model_version
- embedding_dimension
- embedding_vector
- embedding_hash
- created_at

---

# 8. Embedding Dimension

Mengikuti model.

Contoh.

768

1024

1536

3072

Dimension tidak boleh dicampur
dalam satu index.

---

# 9. Model Versioning

Disimpan.

- Provider
- Model
- Version
- Created At

Agar re-index dapat dilakukan.

---

# 10. Similarity Metrics

Didukung.

Cosine Similarity

Inner Product

L2 Distance

Default.

Cosine Similarity.

---

# 11. Duplicate Detection

Pipeline.

```
Question

↓

Embedding

↓

Nearest Neighbor

↓

Similarity Score

↓

Need Review
```

Threshold dapat dikonfigurasi.

---

# 12. Semantic Search

Query.

↓

Embedding

↓

Nearest Neighbor

↓

Ranking

↓

Result

Tidak menggunakan keyword saja.

---

# 13. Hybrid Search

Menggabungkan.

Full Text Search

+

Metadata Filter

+

Vector Similarity

↓

Ranking

---

# 14. Recommendation

Menggunakan.

- Similar Question
- Related Topic
- Same Difficulty
- Learning Path
- Weak Topic

---

# 15. RAG Retrieval

Pipeline.

```
User Prompt

↓

Embedding

↓

Similarity Search

↓

Top K

↓

Prompt Builder

↓

LLM
```

PGVector menjadi sumber konteks utama.

---

# 16. Reindex Strategy

Reindex dilakukan jika.

- model berubah
- prompt berubah
- metadata berubah signifikan

Reindex berjalan sebagai background job.

---

# 17. Batch Embedding

Batch.

100–500 Question

↓

Embedding Worker

↓

Save Vector

---

# 18. Index Strategy

Menggunakan.

HNSW

atau

IVFFlat

Dipilih sesuai ukuran dataset.

---

# 19. Metadata Filtering

Vector Search selalu dapat dipadukan dengan.

- Subject
- Grade
- Chapter
- Topic
- Difficulty
- Bloom
- Status

---

# 20. Ranking Strategy

Ranking.

Similarity

+

Difficulty

+

Popularity

+

Quality Score

↓

Final Ranking

---

# 21. Cache Strategy

Vector tidak di-cache.

Yang di-cache.

Search Result

Recommendation

Projection

---

# 22. Background Jobs

Job.

Generate Embedding

Reindex

Duplicate Detection

Recommendation Refresh

---

# 23. Performance Target

| Metric | Target |
|----------|---------|
| Embedding Insert | < 100 ms |
| Similar Search | < 200 ms |
| Top 20 Result | < 300 ms |
| Duplicate Detection | < 500 ms |

---

# 24. Monitoring

Dipantau.

- Embedding Count
- Index Size
- Query Time
- Similarity Score
- Recall
- Reindex Time

---

# 25. Security

Embedding tidak boleh
mengandung.

- Password
- Token
- Secret Prompt
- Internal Note
- Private Review

---

# 26. Backup

Embedding ikut
dibackup bersama PostgreSQL.

Tidak menggunakan storage terpisah.

---

# 27. Integration

Digunakan oleh.

- AI Generation
- Search
- Recommendation
- Duplicate Detection
- Adaptive Learning
- Analytics

---

# 28. Future Roadmap

- Multi Embedding Model
- Cross Encoder Reranker
- Hybrid Retrieval
- Knowledge Graph
- Multi Vector Search
- Personalized Embedding
- Online Embedding Update
````

---

# Rekomendasi Arsitektur

Saya menyarankan memisahkan **Embedding Generation** dari **Vector Search** agar tanggung jawab masing-masing jelas.

```text
                    Question Published
                            │
                            ▼
                  Embedding Job Queue
                            │
                     Embedding Worker
                            │
                            ▼
                     Embedding Provider
                            │
                            ▼
                question_embedding (pgvector)
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 Semantic Search     Duplicate Check      AI RAG Retrieval
                            │
                            ▼
                   Recommendation Engine
```

## Struktur package Go yang direkomendasikan

```text
internal/questionbank/vector/
│
├── embedding/
│   ├── generator.go
│   ├── provider.go
│   ├── normalizer.go
│   └── batch.go
│
├── search/
│   ├── semantic_search.go
│   ├── hybrid_search.go
│   ├── duplicate.go
│   └── recommendation.go
│
├── repository/
│   ├── embedding_repository.go
│   └── vector_query.go
│
├── jobs/
│   ├── generate_embedding.go
│   └── reindex.go
│
└── service.go
```

# Penyempurnaan Khusus untuk YakinLulus.id

Agar siap berkembang menjadi platform AI-native, saya merekomendasikan beberapa tambahan berikut:

### 1. Pisahkan embedding berdasarkan jenis objek

Jangan hanya menyimpan embedding soal. Gunakan tabel atau kategori terpisah untuk:

* `question_embedding`
* `material_embedding`
* `chapter_embedding`
* `curriculum_embedding`
* `learning_objective_embedding`
* `explanation_embedding`

Dengan demikian, AI dapat mengambil konteks yang paling relevan untuk RAG tanpa mencampur semua jenis data.

### 2. Simpan metadata model embedding

Setiap embedding harus menyimpan:

* `provider`
* `model_name`
* `model_version`
* `dimension`
* `generated_at`

Hal ini memungkinkan migrasi ke model embedding baru tanpa harus menghentikan sistem.

### 3. Gunakan Hybrid Retrieval

Jangan hanya mengandalkan vector similarity. Ranking akhir sebaiknya menggabungkan:

* PostgreSQL Full Text Search (`tsvector`)
* Filter akademik (kelas, mapel, bab, status)
* Skor cosine similarity (`pgvector`)
* Quality score soal
* Popularity/usage score

Pendekatan hybrid ini menghasilkan pencarian yang lebih akurat dan relevan dibandingkan hanya menggunakan keyword atau embedding saja.

### 4. Siapkan untuk Adaptive Learning

Ke depan, embedding tidak hanya dipakai untuk pencarian, tetapi juga untuk:

* rekomendasi soal berikutnya berdasarkan kelemahan siswa;
* pencarian materi yang paling relevan terhadap kesalahan siswa;
* pembentukan learning path otomatis;
* penyusunan paket CBT adaptif.

Dengan desain ini, modul `pgvector` tidak hanya menjadi fitur AI tambahan, tetapi menjadi fondasi bagi seluruh kemampuan semantik YakinLulus.id di masa depan.
