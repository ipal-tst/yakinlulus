Berikut **14_navigation_engine.md** siap dimasukkan ke dokumentasi **10_cbt_runtime**.

```markdown
# 14_navigation_engine.md

# YakinLulus.id CBT Navigation Engine Specification

Module : CBT Runtime Engine  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Navigation Engine adalah komponen CBT Runtime yang mengatur bagaimana peserta berpindah antar soal selama ujian berlangsung.

Tanggung jawab utama:

- perpindahan soal;
- tracking posisi peserta;
- menyimpan histori navigasi;
- fitur review;
- fitur flag soal;
- validasi akses soal;
- mendukung mode ujian berbeda.

Navigation Engine memastikan pengalaman ujian menyerupai platform assessment modern seperti UTBK.

---

# 2. Navigation Principle

Prinsip utama:

```

Server Controls State

Client Controls Interaction

```

Client:

```

Menampilkan soal

Mengirim request pindah soal

Menampilkan navigasi

```

Server:

```

Validasi akses

Menyimpan posisi

Mencatat histori

Menentukan aturan navigasi

```

---

# 3. Navigation Architecture


```

```
             CBT Client

                 |

                 |

         Navigation UI Layer

                 |

                 |

         Navigation Engine

                 |

   +-------------+-------------+

   |                           |

   v                           v
```

Redis State              PostgreSQL

```
   |

   |
```

Event Store

```

---

# 4. Navigation Components


## 4.1 Position Manager

Mengelola:

```

Current Question

Last Question

Question Sequence

```

---

## 4.2 Question Navigator

Mengatur:

```

Next

Previous

Jump To Question

```

---

## 4.3 Review Manager

Mengelola:

```

Visited Question

Unanswered Question

Flagged Question

```

---

## 4.4 Navigation Policy Engine

Menentukan:

```

Allowed Movement

Restricted Movement

Exam Mode Rules

```

---

# 5. Navigation State


Entity:

```

cbt_navigation_state

```

---

Fields:


| Field | Description |
|-|-|
| session_id | Exam session |
| current_question | Current position |
| last_question | Last visited |
| visited_count | Total visited |
| updated_at | Last update |


---

# 6. Question Sequence Model


Example:

Exam memiliki:

```

100 Questions

```

Sequence:

```

1

2

3

4

...

100

```

---

Sequence dapat berbeda setiap peserta karena randomization engine.

---

# 7. Navigation Mode


CBT mendukung beberapa mode:


## 7.1 Free Navigation

Peserta dapat:

```

Next

Previous

Jump

```

---

Use case:

```

Tryout

Latihan

Simulasi

```

---

## 7.2 Sequential Navigation

Peserta hanya:

```

Next

```

---

Tidak dapat:

```

Kembali

```

---

Use case:

```

Assessment tertentu

```

---

## 7.3 Locked Navigation

Peserta harus menyelesaikan:

```

Question 1

↓

Question 2

↓

Question 3

```

---

# 8. Navigation Flow


## Next Question


```

User Click Next

```
    |
```

Validate Answer State

```
    |
```

Validate Question Order

```
    |
```

Update Position

```
    |
```

Save Navigation Event

```
    |
```

Load Next Question

```

---

# 9. Previous Question Flow


```

User Click Previous

```
    |
```

Check Navigation Policy

```
    |
```

Update Current Position

```
    |
```

Create Event

```
    |
```

Return Question

```

---

# 10. Jump Question Flow


Example:

User klik:

```

Question 50

```

---

Process:


```

Receive Request

```
    |
```

Validate Question Exists

```
    |
```

Validate Accessible

```
    |
```

Update Position

```
    |
```

Log Event

```

---

# 11. Question Status Tracking


Setiap soal memiliki status:


```

NOT_VISITED

VISITED

ANSWERED

FLAGGED

ANSWERED_FLAGGED

```

---

Example:

```

Question 10

Status:

ANSWERED_FLAGGED

```

---

# 12. Flag Question Feature


Purpose:

Peserta menandai soal:

```

Belum yakin

Perlu review

```

---

Action:

```

Toggle Flag

```

---

Event:

```

QUESTION_FLAGGED

QUESTION_UNFLAGGED

```

---

# 13. Navigation Progress


Progress dihitung:


```

Answered Question

/

Total Question

x100

```

---

Example:


```

40 answered

/

100 question

=

40%

```

---

# 14. Navigation Persistence


Active State:


```

Redis

```

---

Permanent:


```

PostgreSQL

```

---

Data:

```

Current Position

Visited History

Flag Status

```

---

# 15. Redis Navigation Storage


Key:


```

cbt:navigation:{session_id}

````

---

Value:


```json
{
"current_question":25,

"visited":[
1,2,3,25
],

"flagged":[10,20]
}
````

---

TTL:

```
Session Duration + Buffer
```

---

# 16. Navigation Events

Events:

```
QUESTION_OPENED

QUESTION_VISITED

QUESTION_NEXT

QUESTION_PREVIOUS

QUESTION_JUMPED

QUESTION_FLAGGED

QUESTION_UNFLAGGED

```

---

# 17. Navigation History

Purpose:

```
Audit

Analytics

Behavior Analysis
```

---

Example:

```
10:01

Open Q1


10:05

Move Q2


10:10

Return Q1

```

---

# 18. Anti Cheat Consideration

Navigation Engine mendeteksi:

```
Rapid Question Switching

Unusual Navigation Pattern

Repeated Jumping
```

---

Generate:

```
SUSPICIOUS_NAVIGATION_PATTERN
```

---

# 19. Integration With Answer Engine

Flow:

```
Navigation

        |

Load Question

        |

Answer

        |

Save Answer

        |

Return Navigation State

```

---

# 20. Integration With Timer Engine

Ketika:

```
Timer Expired
```

Navigation:

```
LOCKED
```

---

Tidak dapat:

```
Open Question

Change Answer

Navigate
```

---

# 21. Offline Navigation

Saat offline:

Client menyimpan:

```
Current Position

Visited State

Flag State
```

---

Sync:

```
Navigation Events

```

ketika online.

---

# 22. Conflict Handling

Scenario:

Device A:

```
Question 10
```

Device B:

```
Question 20
```

---

Resolution:

```
Latest Valid State
```

---

# 23. Performance Requirement

Navigation Request:

```
<50ms
```

---

Question Transition:

```
<200ms
```

---

# 24. Monitoring Metrics

Monitor:

```
Question Navigation Count

Average Time Per Question

Flag Usage

Jump Frequency

Navigation Error
```

---

# 25. Security Requirement

Navigation Engine harus:

```
Validate Question Access

Prevent Unauthorized Jump

Maintain Audit Trail

Respect Exam Policy
```

---

# 26. Final Architecture

```

              CBT Session


                   |

                   |

          Navigation Engine


        +----------+----------+

        |                     |

        v                     v


     Redis              PostgreSQL


        |

        |

   Event History


        |

        |

   Analytics Engine


```

---

# 27. Conclusion

Navigation Engine menyediakan:

* navigasi fleksibel;
* pengalaman ujian modern;
* tracking aktivitas peserta;
* fitur review soal;
* integritas ujian;
* dukungan offline.

Navigation Engine menjadi penghubung utama antara:

```
Question Delivery

Answer Processing

Timer Engine

Analytics
```

dalam CBT Runtime YakinLulus.id.

```

Berikutnya:

**15_randomization_engine.md**.
```
