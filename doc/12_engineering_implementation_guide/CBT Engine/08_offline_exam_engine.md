```markdown id="n8w4qc"
# 12_engineering_implementation_guide/cbt_engine/08_offline_exam_engine.md

# Offline Exam Engine Architecture

## 1. Tujuan

Dokumen ini menjelaskan arsitektur **Offline Exam Engine** pada CBT Engine YakinLulus.id.

Offline Exam Engine memungkinkan siswa tetap mengikuti ujian ketika koneksi internet tidak stabil atau terputus.

Target:

```

Continue Exam Without Internet

*

Prevent Data Loss

*

Secure Synchronization

*

Maintain Exam Integrity

```


---

# 2. Konsep Offline First CBT


CBT tradisional:

```

Client

|

Internet

|

Server

|

Database

```


Masalah:

- koneksi putus = ujian terganggu;
- jawaban gagal tersimpan;
- user harus login ulang.


Offline First:


```

```
         Server


            |

            |


      Sync Engine


            |

            |


    Local Exam Runtime


            |

            |


        Student
```

```


---

# 3. Offline Exam Responsibility


Offline Exam Engine menangani:


```

Local Exam Session

Local Question Storage

Local Answer Storage

Offline Timer

Sync Queue

Conflict Resolution

Recovery

```


---

# 4. Offline Architecture


```

```
            CBT Application


                   |

                   |

          Offline Runtime Layer


    +--------------+--------------+

    |                             |
```

Local Database              Sync Queue

```
    |                             |

    +--------------+--------------+

                   |

              Sync Engine


                   |

                   |

               CBT API


                   |

                   |

            PostgreSQL Server
```

```


---

# 5. Offline Capability Scope


Tidak semua data harus offline.


Offline allowed:


```

Exam Question

Question Metadata

Exam Configuration

Answer Draft

Timer State

Session State

```


Tidak offline:


```

Answer Key

Final Score

Ranking

Analytics

```


---

# 6. Offline Session Preparation


Sebelum exam:


```

Student Start Exam

```
    |
```

Validate Online

```
    |
```

Download Exam Package

```
    |
```

Encrypt Local Data

```
    |
```

Create Offline Session

```
    |
```

Start Exam

```


---

# 7. Exam Package


Exam package berisi:


```

Session ID

Exam ID

Question Set

Question Media

Metadata

Security Token

Expiration Time

````


Contoh:


```json
{
 "exam_id":"UTBK001",
 "questions":40,
 "duration":120,
 "expires":"2026-07-26T12:00:00Z"
}
````

---

# 8. Local Storage Strategy

Platform:

## Web

Menggunakan:

```
IndexedDB

Service Worker

Cache API

```

---

## Mobile

Menggunakan:

```
SQLite

Secure Storage

Local File System

```

---

# 9. Local Database Model

Contoh:

## local_exam_session

```
id

server_session_id

status

start_time

end_time

sync_status

```

---

## local_answers

```
id

question_id

selected_answer

updated_at

sync_status

```

---

# 10. Offline Timer Strategy

Timer tetap mengikuti server.

Saat online:

```
Server Time

+

Expiration Time

```

Disimpan:

```
Local Timer State

```

Saat offline:

```
Local Countdown

```

Saat reconnect:

```
Validate With Server

```

---

# 11. Offline Answer Flow

```
Student Select Answer


        |

Save Local Database


        |

Mark Pending Sync


        |

Continue Exam


        |

Internet Available


        |

Sync To Server

```

---

# 12. Sync Queue

Setiap perubahan dibuat sebagai event:

Contoh:

```json
{
 "type":"ANSWER_UPDATE",
 "question_id":10,
 "answer":"B",
 "timestamp":"2026-07-26T10:00:00"
}
```

Queue:

```
Pending

 |

Syncing

 |

Synced

 |

Failed

```

---

# 13. Synchronization Process

```
Connection Restored


        |

Authenticate Session


        |

Upload Pending Events


        |

Server Validation


        |

Update Database


        |

Return Confirmation

```

---

# 14. Conflict Resolution

Kemungkinan:

```
Local Answer

vs

Server Answer

```

Rule:

```
Latest Valid Timestamp Wins

```

Tetapi:

Semua perubahan disimpan:

```
Audit History

```

---

# 15. Offline Security

Karena soal berada di device:

Protection:

```
Encrypted Storage

Encrypted Question Package

Session Token

Expiration Validation

Device Binding

```

---

# 16. Question Package Encryption

Flow:

```
Server


 |

Generate Package


 |

Encrypt


 |

Send To Device


 |

Decrypt Runtime Only

```

Tujuan:

* mencegah ekstraksi soal;
* mengurangi cheating.

---

# 17. Device Binding

Session dapat dikunci:

```
User

+

Device ID

+

Session Token

```

Jika pindah device:

```
Require Validation

```

---

# 18. Offline Submission

Jika waktu habis offline:

```
Timer Expired


        |

Lock Exam


        |

Store Final Answer


        |

Wait Sync

```

Saat online:

```
Upload Submission

```

---

# 19. Failure Recovery

Scenario:

## App Crash

Flow:

```
Open App


 |

Restore Local Session


 |

Continue Exam

```

---

## Device Restart

```
Launch Application


 |

Validate Local Storage


 |

Recover State

```

---

# 20. Offline Limitation

Offline mode memiliki batas:

```
No Real Time Ranking

No Immediate Result

No Server Validation Until Sync

```

---

# 21. Event Architecture

Event:

```
OfflineSessionCreated

AnswerStoredLocal

SyncStarted

SyncCompleted

SyncFailed

OfflineSubmissionCreated

```

---

# 22. Performance Requirement

Target:

| Operation             | Target |
| --------------------- | ------ |
| Load Local Question   | <100ms |
| Save Local Answer     | <50ms  |
| Sync Batch 100 Answer | <2s    |

---

# 23. Testing Strategy

Test:

```
Internet Disconnect

Airplane Mode

Device Restart

Large Question Package

Sync Conflict

Partial Upload

```

---

# 24. Scalability Strategy

## Phase 1

```
Mobile Offline Support

SQLite

Basic Sync Queue

```

---

## Phase 2

```
Advanced Conflict Engine

Encrypted Package

Large Exam Support

```

---

## Phase 3

```
Offline Exam Distribution

School Local Server

Hybrid CBT Network

```

---

# 25. Implementation Recommendation

MVP:

```
Flutter Local Database

SQLite

Secure Storage

REST Sync API

Background Sync Worker

```

Tidak perlu:

```
Full Offline Server Infrastructure

Complex P2P Sync

```

---

# Summary

Offline Exam Engine YakinLulus.id menggunakan:

```
Offline First Architecture

+

Local Persistence

+

Encrypted Exam Package

+

Sync Queue

+

Conflict Resolution

+

Secure Recovery

```

Dengan desain ini, YakinLulus.id dapat digunakan di sekolah dengan koneksi internet terbatas sekaligus tetap menjaga integritas ujian.
