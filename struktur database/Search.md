Untuk **YakinLulus.id**, saya **tidak menyarankan menggunakan query SQL `LIKE`** untuk fitur pencarian. Dengan target **100.000+ user**, **jutaan soal**, **ratusan ribu materi**, dan **puluhan juta event**, Search sebaiknya dibuat sebagai **domain tersendiri (Search Domain)** yang menggunakan **Full-Text Search + Search Index + AI Semantic Search (pgvector/OpenSearch/Elasticsearch)**.

Search harus mampu melakukan pencarian terhadap:

* Soal
* Materi
* Video
* Guru
* Sekolah
* Blog
* FAQ
* CBT
* Paket Membership
* AI Knowledge Base
* Dokumen
* Tag
* File
* Halaman CMS
* Pengumuman
* Semua entitas utama (Global Search)

---

# Search Domain Architecture

```text
Search

├── Search Index
├── Search Document
├── Search Category
├── Search Keyword
├── Search Suggestion
├── Search Synonym
├── Search Stopword
├── Search Query Log
├── Search Click Log
├── Search History
├── Saved Search
├── Trending Search
├── Popular Search
├── Search Filter
├── Search Facet
├── Search Ranking
├── Search Analytics
├── Search Cache
├── Search Vector
├── Search Collection
├── Search Configuration
└── Search Audit
```

---

# Search Flow

```text
          User

            │

            ▼

      Search API

            │

            ▼

Query Parser

            │

   ┌────────┴────────┐

   ▼                 ▼

Full Text       AI Vector Search

   ▼                 ▼

Ranking Engine

            │

            ▼

Result

            │

            ▼

Analytics + History
```

---

# High Level ERD

```text
search_documents

      │

      ├──── search_vectors

      ├──── search_keywords

      ├──── search_tags

      ├──── search_categories

      ├──── search_filters

      ├──── search_rankings

      ├──── search_cache

      └──── search_index_logs


users

│

├──── search_histories

├──── search_saved

└──── search_click_logs


search_queries

search_synonyms

search_stopwords

search_suggestions

search_trending

search_settings
```

---

# 1 search_documents

Master seluruh dokumen yang dapat dicari.

```text
id UUID PK

document_type

reference_table

reference_id

title

subtitle

description

content

summary

language

slug

thumbnail

cover_image

status

visibility

published_at

updated_at

created_at
```

---

Jenis Dokumen

```text
QUESTION

MATERIAL

VIDEO

BLOG

FAQ

NEWS

EVENT

PAGE

TEACHER

SCHOOL

MEMBERSHIP

ANNOUNCEMENT

AI_DOCUMENT
```

---

# 2 search_vectors

Embedding AI.

```text
id

document_id

embedding VECTOR

embedding_model

dimension

created_at
```

Contoh model

* OpenAI
* BGE
* E5
* Instructor
* Gemini
* Nomic

Disarankan menggunakan **pgvector** pada PostgreSQL (Supabase).

---

# 3 search_categories

Kategori pencarian.

```text
id

parent_id

name

slug

sort_order

active
```

---

# 4 search_keywords

Keyword index.

```text
id

document_id

keyword

weight

frequency

created_at
```

---

# 5 search_tags

Tag.

```text
id

document_id

tag

weight
```

---

# 6 search_filters

Konfigurasi filter.

```text
id

document_type

filter_name

filter_key

filter_type

sort_order
```

Contoh

```text
Jenjang

Kelas

Mapel

Bab

Difficulty

Tahun

Author

Publisher
```

---

# 7 search_rankings

Skor ranking.

```text
id

document_id

popularity_score

view_score

click_score

ai_score

manual_score

final_score

updated_at
```

---

# 8 search_queries

Semua query user.

```text
id

user_id

keyword

normalized_keyword

language

search_type

result_count

duration_ms

created_at
```

---

# 9 search_click_logs

Klik hasil.

```text
id

query_id

document_id

position

clicked_at
```

---

# 10 search_histories

Riwayat user.

```text
id

user_id

keyword

searched_at
```

---

# 11 search_saved

Pencarian favorit.

```text
id

user_id

keyword

created_at
```

---

# 12 search_suggestions

Auto complete.

```text
id

keyword

popularity

language

active
```

---

# 13 search_synonyms

Sinonim.

```text
id

word

synonym

language
```

Contoh

```text
Matematika

Math

MTK

```

---

# 14 search_stopwords

Stopword.

```text
id

word

language
```

---

# 15 search_trending

Trending keyword.

```text
id

date

keyword

total_search

ranking
```

---

# 16 search_cache

Cache hasil.

```text
id

cache_key

query_hash

response JSONB

expired_at

created_at
```

---

# 17 search_index_logs

Log indexing.

```text
id

document_id

operation

status

duration

created_at
```

Operation

```text
INSERT

UPDATE

DELETE

REINDEX

```

---

# 18 search_collections

Grouping.

```text
id

name

description

active
```

Contoh

```text
Question

Learning

CMS

Membership

AI

```

---

# 19 search_collection_documents

Many to many.

```text
collection_id

document_id
```

---

# 20 search_settings

Konfigurasi.

```text
id

setting_key

setting_value
```

Contoh

```text
enable_vector

enable_fuzzy

min_keyword

max_result

cache_time

```

---

# 21 search_analytics

Agregasi.

```text
id

date

total_query

unique_user

average_time

cache_hit

cache_miss

no_result

created_at
```

---

# 22 search_audit_logs

Audit.

```text
id

actor

action

table_name

record_id

old_data JSONB

new_data JSONB

created_at
```

---

# Jenis Search

## Global Search

```text
Semua Domain
```

---

## Soal

```text
Mapel

Bab

Kesulitan

Tahun

```

---

## Materi

```text
Jenjang

Video

PDF

Topik

```

---

## Blog

```text
Kategori

Tag

```

---

## Membership

```text
Paket

Promo

```

---

## AI Knowledge

```text
Semantic Search

```

---

# Ranking Formula

```text
Final Score

=

Text Score

+

Popularity

+

AI Similarity

+

Manual Weight

+

Freshness
```

---

# Index Strategy

## search_documents

```text
slug UNIQUE

document_type

status

published_at DESC
```

Gunakan **GIN Full-Text Index** pada kolom `title`, `summary`, dan `content`.

## search_vectors

```text
HNSW Index

atau

IVFFLAT Index
```

Menggunakan **pgvector** untuk pencarian semantik.

## search_queries

```text
user_id

created_at DESC

keyword
```

## search_keywords

```text
keyword

weight DESC
```

---

# Partisi

| Tabel             | Strategi |
| ----------------- | -------- |
| search_queries    | Monthly  |
| search_click_logs | Monthly  |
| search_histories  | Monthly  |
| search_index_logs | Monthly  |
| search_analytics  | Yearly   |
| search_trending   | Yearly   |

---

# Search Engine yang Direkomendasikan

| Komponen         | Teknologi                                       |
| ---------------- | ----------------------------------------------- |
| Full-text search | PostgreSQL Full-Text Search                     |
| Semantic search  | pgvector                                        |
| Cache            | Redis                                           |
| Index queue      | Asynq / Redis                                   |
| Spell correction | Custom + trigram (`pg_trgm`)                    |
| Autocomplete     | Redis + `search_suggestions`                    |
| Ranking          | Hybrid BM25 + Vector Similarity + Manual Weight |

---

# Integrasi dengan Domain Lain

Search menjadi **lapisan pencarian terpadu (Unified Search Layer)** yang mengindeks data dari seluruh domain tanpa menyimpan data bisnis sebagai sumber utama.

### User & RBAC

* Menyaring hasil berdasarkan hak akses (gratis, premium, guru, admin, siswa).

### Bank Soal

* Indeks soal berdasarkan mapel, bab, tingkat kesulitan, kurikulum, dan tag.

### Learning Material

* Pencarian materi, video, PDF, latihan, dan pembelajaran interaktif.

### CBT Engine

* Pencarian ujian, paket latihan, dan riwayat ujian (sesuai izin akses).

### CMS

* Halaman, artikel, FAQ, pengumuman, event, dan berita.

### Finance & Membership

* Paket membership, promo, voucher, dan halaman pricing.

### AI Tutor / RAG

* Menggunakan `search_vectors` untuk semantic search terhadap materi, bank soal, FAQ, dan knowledge base sehingga AI dapat mengambil konteks yang relevan.

### Analytics

* Seluruh aktivitas pencarian dicatat untuk menghasilkan metrik seperti keyword populer, zero-result search, CTR hasil pencarian, waktu respons, dan efektivitas ranking.

---

# Rekomendasi Enterprise

Untuk target **100.000+ pengguna**, **>1 juta soal**, dan **jutaan dokumen**, arsitektur pencarian yang paling seimbang adalah:

* **PostgreSQL Full-Text Search** sebagai pencarian utama.
* **pgvector** untuk semantic search dan integrasi RAG.
* **GIN Index + pg_trgm** untuk pencarian cepat, fuzzy search, dan toleransi typo.
* **Redis** untuk cache hasil pencarian, autocomplete, dan trending keywords.
* **Background Indexer** (misalnya Asynq) yang memperbarui indeks setiap ada perubahan data pada domain lain.
* **Hybrid Ranking Engine** yang menggabungkan BM25/full-text score, vector similarity, popularitas, dan bobot manual sehingga hasil pencarian tetap relevan dan skalabel tanpa harus bergantung pada Elasticsearch pada tahap awal. Pendekatan ini sangat cocok dengan stack YakinLulus.id yang telah menggunakan PostgreSQL (Supabase) sebagai database utama.
