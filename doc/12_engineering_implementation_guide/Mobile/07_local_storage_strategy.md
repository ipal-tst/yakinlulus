```markdown id="7s2v9m"
# 12_engineering_implementation_guide/mobile/07_local_storage_strategy.md

# Local Storage Strategy

## 1. Tujuan

Dokumen ini menjelaskan strategi penyimpanan data lokal pada aplikasi mobile YakinLulus.id.

Local storage menjadi komponen penting karena platform memiliki kebutuhan khusus:

- CBT offline examination;
- penyimpanan question package;
- penyimpanan jawaban sementara;
- caching materi pembelajaran;
- synchronization queue;
- penyimpanan user session.


Tujuan implementasi:

- aplikasi tetap berjalan tanpa koneksi internet;
- data penting tidak hilang;
- sinkronisasi dapat dilakukan secara reliable;
- performa aplikasi tetap cepat;
- data sensitif tetap aman.


---

# 2. Local Storage Architecture


Arsitektur:


```

Flutter Application

```
    |
```

Storage Abstraction Layer

```
    |
```

+-----------------------------+

|                             |

Secure Storage          Local Database

|                             |

Credential              SQLite

Token                   Exam Data

Keys                    Cache

+-----------------------------+

```
    |
```

Sync Engine

```id="2j6r2h"


---

# 3. Storage Category


Data dibagi menjadi beberapa kategori:


```

Application Data

```
    |
```

+----------------+

|                |

Secure Data   Business Data

|                |

Token         Exam

Secret        Material

```
          Cache

          Queue
```

```id="2g3v1k"


---

# 4. Storage Technology


## 4.1 Secure Storage


Digunakan:


```

Flutter Secure Storage

```id="g4k7qa"


Untuk:


- access token;
- refresh token;
- encryption key;
- device identifier.


Platform:


Android:


```

Android Keystore

```


iOS:


```

iOS Keychain

```


---

## 4.2 Local Database


Digunakan:


```

SQLite

```id="q6e6b9"


Dengan abstraction:


```

Drift / Floor

```id="a6a0s2"


Digunakan untuk:


- CBT runtime;
- offline question;
- answer storage;
- learning content metadata;
- synchronization queue.


---

# 5. Local Database Architecture


Diagram:


```

```
             SQLite


                |

    +-----------+-----------+

    |                       |

Exam Tables            Learning Tables


    |

Sync Tables


    |

Cache Tables
```

```id="3bh4ry"


---

# 6. Database Structure


Contoh:


```

local_database/

├── tables/

│

├── exam_session_table

├── question_table

├── answer_table

├── material_table

├── sync_queue_table

├── dao/

│

└── migrations/

```id="b7i9i4"


---

# 7. CBT Local Storage Design


CBT adalah penggunaan utama local storage.


Data:


```

Exam Session

Question Package

Question Order

Student Answer

Timer State

Sync Status

```id="35h6w3"


---

# 8. CBT Offline Data Flow


```

Download Exam

```
    |
```

Store Question Package

```
    |
```

Create Local Session

```
    |
```

Student Answer

```
    |
```

Save Local Answer

```
    |
```

Add Sync Queue

```
    |
```

Connection Available

```
    |
```

Upload To Server

```id="q5ok5y"


---

# 9. Answer Storage Strategy


Jawaban siswa harus disimpan:


```

Immediately

*

Locally

*

Transactionally

```id="5r7i6c"


Flow:


```

User Select Answer

```
    |
```

Validate

```
    |
```

Save SQLite

```
    |
```

Update UI

```
    |
```

Queue Sync

```id="k7g8v4"


---

# 10. Local Transaction Strategy


Operasi kritikal harus atomic.


Contoh:


Submit Answer:


```

BEGIN TRANSACTION

Save Answer

Update Session

Create Sync Task

COMMIT

```id="v4y9s3"


Jika gagal:


```

ROLLBACK

```id="8x0n4k"


---

# 11. Cache Strategy


Cache digunakan untuk data yang sering dibaca.


Contoh:


```

Subject List

Chapter List

Material Metadata

Question Metadata

User Profile

```id="z1f6gk"


---

# 12. Cache Policy


Menggunakan:


```

Cache First Strategy

*

Background Refresh

```id="3x7h3p"


Flow:


```

Request Data

```
    |
```

Check Local Cache

```
    |
```

Available?

/          \

Yes            No

|              |

Show Data      API Request

|

Background Update

```id="5d9m7p"


---

# 13. Cache Expiration


Setiap data memiliki TTL.


Contoh:


```

User Profile

TTL:

24 Hours

Subject Data

TTL:

7 Days

Material Metadata

TTL:

3 Days

```id="9w4m0s"


---

# 14. Storage Synchronization


Local data memiliki status:


```

SYNC_STATUS

PENDING

SYNCING

SUCCESS

FAILED

CONFLICT

```id="m3q1x8"


---

# 15. Sync Queue Design


Table:


```

sync_queue

id

entity_type

entity_id

operation

payload

retry_count

status

created_at

```id="h6r5vk"


---

# 16. Offline First Principle


Rule:


```

Write Local First

```
    ↓
```

Sync Later

```
    ↓
```

Resolve Conflict

```id="4d0h6r"


Digunakan pada:


- exam answer;
- progress belajar;
- bookmark;
- notes.


---

# 17. Data Encryption


Data sensitif:


```

Exam Answer

User Information

Authentication Token

```id="4g8w8h"


Tidak disimpan plaintext.


Strategi:


```

Encryption Layer

```
    |
```

Encrypted SQLite Field

```
    |
```

Secure Key Storage

```id="7q6z2v"


---

# 18. Storage Migration Strategy


Database harus memiliki version.


Contoh:


```

Version 1

```
    |
```

Migration

```
    |
```

Version 2

```
    |
```

Migration

```
    |
```

Version 3

```id="3h4v7p"


---

# 19. Data Cleanup Strategy


Storage tidak boleh unlimited.


Cleanup:


```

Expired Cache

```
    |
```

Remove

Old Exam Package

```
    |
```

Archive/Delete

Temporary File

```
    |
```

Cleanup

```id="9v1j8b"


---

# 20. File Storage Local


File besar:


```

Video

Audio

Image

PDF

```id="k8p1zd"


Tidak disimpan langsung database.


Strategy:


```

Database

```
|
```

File Reference

```
|
```

Local File System

```id="2m4x8f"


---

# 21. Performance Consideration


Optimasi:


## Database Index


Untuk:


- exam session;
- question lookup;
- sync queue.


---

## Batch Operation


Gunakan:


```

Bulk Insert

Bulk Update

```id="d5f9wp"


---

## Lazy Loading


Jangan load:


```

1000 Questions

```

sekaligus.


Gunakan:

```

Pagination

Chunk Loading

```id="n7q4k1"


---

# 22. Error Handling


Storage error:


```

SQLite Error

```
    |
```

Storage Exception

```
    |
```

Recovery Strategy

```
    |
```

User Notification

```id="p9m3vx"


---

# 23. Testing Strategy


Test:


## Database Test


```

CRUD

Migration

Transaction

```id="q1f6bx"


---

## Offline Scenario Test


```

No Internet

Answer Exam

Restart App

Reconnect

Sync

```id="y5k9qp"


---

## Recovery Test


```

Application Crash

Battery Lost

Network Interrupted

```id="t4x7nz"


---

# 24. Security Consideration


Implementasi:


- encrypted storage;
- secure key management;
- no sensitive logging;
- database integrity check.


---

# 25. Scalability Consideration


Architecture mendukung:


## Large Question Bank


Future:


```

Million Questions

Local Indexed Storage

Incremental Download

```id="f8k2vb"


---

## Multi Device


Future:


```

Phone

Tablet

Desktop

```id="u6m3zy"


---

# 26. Future Evolution


Pengembangan:


Phase 1:

```

SQLite Offline Cache

```


Phase 2:

```

Advanced Sync Engine

Conflict Resolution

```


Phase 3:

```

Distributed Local Learning Cache

```


---

# Summary


Local storage architecture YakinLulus.id menggunakan:


```

SQLite

*

Secure Storage

*

Offline First Strategy

*

Sync Queue

*

Encryption

*

Migration Management

```


Tujuan utama:

- CBT tetap berjalan offline;
- data siswa aman;
- sinkronisasi reliable;
- aplikasi cepat;
- siap scale.
```
