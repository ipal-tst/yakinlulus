Berikut **10_cbt_runtime_database_schema / 08_erdiagram.md**.

Dokumen ini menggambarkan hubungan antar entity pada **CBT Runtime Database Schema**.

Fokus:

* lifecycle session;
* runtime question snapshot;
* answer persistence;
* synchronization;
* event sourcing;
* security monitoring.

---

````markdown id="cbt08erd"
# 08_erdiagram.md

# YakinLulus.id CBT Runtime Entity Relationship Diagram

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

CBT Runtime ERD menggambarkan database
yang menjalankan proses ujian secara aktif.

Berbeda dengan:

```
Exam ERD

=
Definisi ujian


CBT Runtime ERD

=
Eksekusi ujian
```

---

# 2. High Level Architecture

```

                  EXAM DOMAIN

                       |

                       |

                 exam_id reference


                       |

                       v


              +----------------+

              | cbt_sessions   |

              +----------------+

                       |

        +--------------+---------------+

        |              |               |

        v              v               v


cbt_session_     cbt_timer_     cbt_navigation_

questions        states         states



        |

        |

        v


    cbt_answers


        |

        |

        v


    cbt_events



        |

        |

        +----------------+

        |                |

        v                v


 analytics        security_monitoring


```

---

# 3. Core Aggregate

Aggregate root:

```
CBT Session
```

---

Entity:

```
cbt_sessions
```

---

Semua runtime entity berada di bawah:

```
Session Boundary
```

---

# 4. Session ERD

```

                 cbt_sessions

                       |

       +---------------+---------------+

       |               |               |

       v               v               v


 cbt_session_     cbt_timer_    cbt_navigation_

 questions        states        states



```

---

Relationship:

```
Session

1 : N

Session Questions


Session

1 : 1

Timer State


Session

1 : 1

Navigation State

```

---

# 5. Question Snapshot ERD

```

               cbt_sessions

                     |

                     |

                     v


          cbt_session_questions


                     |

                     |

          question_version_id


                     |

                     |

              Question Bank


```

---

Important:

CBT Runtime tidak menyimpan:

```
Question Text

Question Option

Explanation
```

---

Hanya menyimpan:

```
question_version_id

sequence

runtime state
```

---

# 6. Answer ERD

```

       cbt_session_questions

                |

                |

                v


           cbt_answers


```

---

Cardinality:

```
Question Instance

1 : 1

Answer

```

---

Contoh:

```
Session Question:

No 10


Answer:

B

```

---

# 7. Timer ERD

```

            cbt_sessions

                  |

                  |

                  v


          cbt_timer_states


```

---

Purpose:

```
Resume

Offline Mode

Auto Submit

```

---

# 8. Navigation ERD

```

            cbt_sessions

                  |

                  |

                  v


       cbt_navigation_states


```

---

Menyimpan:

```
Current Position

Visited Question

Flagged Question

```

---

Example:

```json
{
"current":25,

"visited":[1,2,3],

"flagged":[7,10]
}
```

---

# 9. Offline Synchronization ERD

```

             Device


               |

               |

               v


        cbt_sync_queue


               |

               |

               v


        CBT Runtime API


               |

               |

               v


        PostgreSQL


```

---

Entity:

```
cbt_sync_queue
```

---

Function:

```
Store offline event

Retry failed sync

Resolve conflict

```

---

# 10. Event Store ERD

```

             cbt_sessions

                    |

                    |

                    v


              cbt_events


```

---

Relationship:

```
Session

1 : N

Events
```

---

Example:

```
SESSION_STARTED

QUESTION_OPENED

ANSWER_UPDATED

SESSION_SUBMITTED

```

---

# 11. Security Monitoring ERD

```

             cbt_sessions

                    |

                    |

                    v


          cbt_security_logs


```

---

Events:

```
TAB_SWITCH

FULLSCREEN_EXIT

MULTIPLE_DEVICE

CLOCK_CHANGED

```

---

# 12. Device Tracking ERD

```

             cbt_sessions

                    |

                    |

                    v


        cbt_session_devices


```

---

Purpose:

```
Device fingerprint

Browser detection

IP tracking

```

---

# 13. Progress Tracking ERD

```

             cbt_sessions

                    |

                    |

                    v


        cbt_progress_states


```

---

Stores:

```
Total Question

Answered

Remaining

Percentage

```

---

# 14. Complete Logical ERD

```

                         EXAM


                          |

                          |

                    cbt_sessions


                          |

        +-----------------+------------------+

        |                 |                  |

        v                 v                  v


cbt_session_        cbt_timer_       cbt_navigation_

questions           states           states


        |

        |

        v


cbt_answers


        |

        |

        +----------------+

        |                |

        v                v


cbt_events       cbt_security_logs



        |

        |

        v


cbt_sync_queue



        |

        |

        v


cbt_session_devices


```

---

# 15. Cardinality Summary

| Relationship | Cardinality |
|-|-|
| Exam → CBT Session | 1:N |
| User → CBT Session | 1:N |
| Session → Session Question | 1:N |
| Session → Timer State | 1:1 |
| Session → Navigation State | 1:1 |
| Session Question → Answer | 1:1 |
| Session → Event | 1:N |
| Session → Security Log | 1:N |
| Session → Device | 1:N |
| Session → Sync Queue | 1:N |
| Session → Progress State | 1:1 |

---

# 16. Data Flow ERD

```

Student

  |

  |

Start Exam

  |

  v


Create Session


  |

  |

Generate Question Snapshot


  |

  |

Run Timer


  |

  |

Answer Question


  |

  |

Save Answer


  |

  |

Generate Event


  |

  |

Submit


  |

  |

Scoring Pipeline


```

---

# 17. Immutable Boundary

Setelah:

```
SUBMITTED
```

Data menjadi immutable:

```
cbt_session_questions

cbt_answers

cbt_events

```

---

Tujuan:

```
Academic Integrity

Audit

Result Recalculation

```

---

# 18. Scaling Boundary

Future:

```
CBT Runtime

        |

        +----------------+

        |                |

        v                v


Runtime Database    Event Stream


        |

        |

Analytics Cluster

```

---

# 19. Future Extension

Siap menambahkan:

```
cbt_proctoring_events

cbt_ai_monitoring

cbt_behavior_tracking

cbt_adaptive_question_state

```

---

# 20. Final Architecture Decision

CBT Runtime menggunakan:

```
Session Aggregate

+

Question Snapshot

+

Answer Persistence

+

Event Logging

+

Security Tracking

+

Offline Synchronization

```

---

# 21. Conclusion

ERD CBT Runtime menyediakan fondasi:

- ujian real-time;
- offline capable;
- secure assessment;
- scalable execution;
- audit akademik.

Desain ini siap dikembangkan dari:

```
10 pengguna MVP

hingga

massive online examination platform.
```

````

---

