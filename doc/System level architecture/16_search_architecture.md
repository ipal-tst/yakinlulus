Melanjutkan ke file berikutnya:

# `11_implementation_architecture/16_search_architecture.md`

```md
# Search Architecture
## YakinLulus.id Search Architecture Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan search architecture pada platform YakinLulus.id.

Search system diperlukan karena platform memiliki jumlah data besar:

- question bank;
- learning materials;
- chapter;
- subject;
- exam;
- student activity;
- AI knowledge base.


Tujuan:


```

Fast Information Retrieval

*

Relevant Search Result

*

Scalable Search Engine

*

AI Ready Search

```


---

# 2. Search Architecture Principles


YakinLulus menggunakan prinsip:


```

Database Search First

*

Dedicated Search Engine When Needed

*

Index Based Retrieval

*

Domain Specific Search

*

Semantic Search Future Ready

```


---

# 3. Search Requirement


## Question Bank Search


Mendukung:


```

Search Question

Filter Subject

Filter Class

Filter Chapter

Filter Difficulty

Filter Source

Filter Type

```


---

## Learning Material Search


Mendukung:


```

Course Search

Material Search

Keyword Search

Chapter Search

Content Search

```


---

## AI Knowledge Search


Future:


```

Semantic Search

Vector Search

RAG Retrieval

```


---

# 4. Search High Level Architecture


```

```
                 User


                  |

                  |

            Search Request


                  |

                  |

            Search API


                  |

      +-----------+-----------+

      |                       |

Application Search       Search Engine


      |                       |

      |                       |

  PostgreSQL              Index


                              |

                              |

                      Ranking Algorithm
```

```


---

# 5. Search Evolution Strategy


YakinLulus menggunakan pendekatan bertahap.


## Phase 1 MVP


Gunakan:


```

PostgreSQL Full Text Search

*

Database Index

```


Alasan:


- sederhana;
- biaya rendah;
- cukup untuk <100 user;
- maintenance mudah.


---

## Phase 2


Gunakan:


```

Dedicated Search Engine

```


Pilihan:


```

Elasticsearch

OpenSearch

Meilisearch

```


---

## Phase 3


Tambahkan:


```

Vector Database

*

Semantic Search

*

RAG Retrieval

```


---

# 6. Search Component Architecture


```

Search Module

├── Query Builder

├── Search Service

├── Index Manager

├── Ranking Engine

├── Filter Engine

└── Search Analytics

```


---

# 7. Search Service Responsibility


Search Service bertugas:


- menerima query;
- menentukan strategi pencarian;
- melakukan filtering;
- ranking result;
- return response.


Flow:


```

User Query

|

Search Service

|

Search Strategy

|

Retrieve Data

|

Ranking

|

Response

```


---

# 8. Database Search Strategy


Untuk MVP:


PostgreSQL menggunakan:


```

Full Text Search

*

GIN Index

```


Contoh:


```

Question Content

Explanation

Material Content

```


---

# 9. PostgreSQL Search Index


Contoh:


Table:


```

questions

id

content

search_vector

```


Index:


```

GIN(search_vector)

```


Tujuan:


- mempercepat pencarian;
- mengurangi full table scan.


---

# 10. Question Bank Search Architecture


Data:


```

Question

|

Metadata

|

Search Index

```


Search:


```

"Persamaan Linear"

```
    |
```

Search Engine

```
    |
```

Question Result

```


---

# 11. Filtering Architecture


Search tidak hanya keyword.


Filter:


```

Jenjang

Class

Subject

Chapter

Difficulty

Source

```


Flow:


```

Keyword

*

Filter

*

Ranking

=

Result

```


---

# 12. Search Ranking Strategy


Ranking menentukan urutan hasil.


Faktor:


```

Keyword Match

*

Popularity

*

Relevance

*

Recency

*

Difficulty Match

````


---

# 13. Search Result Model


Standard response:


```json
{
 "query":"matematika",
 "total":100,
 "results":[
    {
      "id":"123",
      "title":"Persamaan Linear",
      "score":0.95
    }
 ]
}
````

---

# 14. Search Index Architecture

Future:

```
Database


 |

Indexer Worker


 |

Search Engine


 |

Search API

```

---

# 15. Index Synchronization

Problem:

```
Database Changed

but

Index Not Updated

```

Solution:

```
Domain Event


 |

Index Update Event


 |

Search Index Refresh

```

---

# 16. Event Driven Search Update

Example:

Question Published:

```
QuestionPublishedEvent


        |

        |

Search Index Worker


        |

        |

Update Index

```

---

# 17. Search Cache Strategy

Search result dapat menggunakan cache.

Contoh:

```
search:

question:

matematika-kelas10

```

TTL:

```
5 - 15 minutes

```

Tidak cache:

```
Personal Result

Sensitive Exam Data

```

---

# 18. Search Security

Search harus mengikuti:

```
Authentication

+

Authorization

+

Tenant Isolation

```

Contoh:

Student School A:

```
Tidak boleh mencari

Question Bank Private School B

```

---

# 19. Multi Tenant Search

Index harus memiliki:

```
tenant_id

```

Contoh:

```
question_index


id

tenant_id

content

```

Query:

```
WHERE tenant_id=currentTenant

```

---

# 20. Search Analytics

Dikumpulkan:

```
Search Keyword

Result Click

No Result Query

Popular Search

```

Digunakan untuk:

* improve content;
* AI recommendation;
* curriculum analysis.

---

# 21. AI Semantic Search Architecture

Future:

```
User Query


 |

Embedding Model


 |

Vector Database


 |

Similarity Search


 |

Relevant Context


 |

AI Response

```

---

# 22. RAG Integration

Search menjadi bagian RAG pipeline.

Architecture:

```
Learning Material


 |

Chunking


 |

Embedding


 |

Vector Database


 |

Retriever


 |

LLM


 |

AI Tutor

```

---

# 23. Search Engine Selection

Comparison:

| Engine         | Use Case           |
| -------------- | ------------------ |
| PostgreSQL FTS | MVP                |
| Meilisearch    | Simple SaaS Search |
| OpenSearch     | Large Scale Search |
| Elasticsearch  | Enterprise Search  |
| Vector DB      | AI Semantic Search |

---

# 24. Recommended Technology Roadmap

## MVP

```
PostgreSQL

+

GIN Index

+

Basic Ranking

```

---

## Growth

```
OpenSearch

+

Search Worker

+

Advanced Ranking

```

---

## AI Platform

```
Vector Database

+

Embedding Pipeline

+

RAG

```

---

# 25. Search API Example

Endpoint:

```
GET /api/v1/search

```

Parameter:

```
q=persamaan

type=question

subject=math

class=10

```

Response:

```json
{
 "results":[]
}
```

---

# 26. Search Performance Strategy

Optimasi:

```
Index Optimization

Query Optimization

Caching

Pagination

Async Indexing

```

---

# 27. Search Testing Strategy

## Functional Test

```
Keyword Search

Filter Search

Empty Result

```

---

## Performance Test

```
10000+

Documents

Concurrent Search

```

---

## Security Test

```
Tenant Isolation

Permission Filtering

```

---

# 28. Implementation MVP

Stack:

```
Go Backend

+

PostgreSQL FTS

+

Redis Cache

```

Tidak menggunakan:

```
Elasticsearch

Kafka

Vector DB

```

Karena belum diperlukan.

---

# 29. Future Evolution

Architecture evolution:

```
MVP


PostgreSQL Search


        |


Growth


OpenSearch


        |


AI Platform


Vector Search + RAG

```

---

# 30. Summary

Search Architecture YakinLulus.id:

```
Progressive Search Architecture

+

Database First

+

Dedicated Search Ready

+

Semantic Search Future

+

RAG Compatible

```

Memberikan:

* pencarian cepat;
* bank soal mudah ditemukan;
* materi mudah diakses;
* fondasi AI tutor dan RAG.

````
