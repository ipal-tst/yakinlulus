Berikut **18_event_architecture.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini mendefinisikan arsitektur event pada CBT Runtime untuk tracking aktivitas, audit, analytics, offline sync, dan komunikasi antar service.

```markdown id="ev18arch"
# 18_event_architecture.md

# YakinLulus.id CBT Event Architecture Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Event Architecture adalah mekanisme pencatatan dan distribusi perubahan aktivitas yang terjadi selama lifecycle CBT.

Event digunakan untuk:

- audit aktivitas peserta;
- sinkronisasi offline;
- analytics behavior;
- monitoring sistem;
- komunikasi antar service;
- troubleshooting.

---

# 2. Event Driven Principle


YakinLulus.id menggunakan pendekatan:

```

Event Driven Architecture

```

dengan prinsip:


```

Action Happens

```
    |

    v
```

Event Created

```
    |

    v
```

Event Stored

```
    |

    v
```

Event Processed

```


---

# 3. Event Architecture Overview


```

```
             CBT Runtime


                 |

                 |

          Event Publisher


                 |

                 |

          Event Bus / Queue


      +----------+----------+

      |                     |

      v                     v


Analytics Service     Audit Service


      |

      |
```

Notification Service

```


---

# 4. Event Components


## 4.1 Event Producer


Komponen yang menghasilkan event:


```

Session Engine

Timer Engine

Navigation Engine

Answer Engine

Scoring Engine

Auto Grading

```


---

## 4.2 Event Store


Tempat menyimpan event:


```

PostgreSQL

event_logs table

```


---

## 4.3 Event Consumer


Service yang membaca event:


```

Analytics

Audit

Monitoring

AI Engine

Reporting

```


---

# 5. Event Lifecycle


```

EVENT_TRIGGERED

```
    |

    v
```

EVENT_CREATED

```
    |

    v
```

EVENT_STORED

```
    |

    v
```

EVENT_PUBLISHED

```
    |

    v
```

EVENT_CONSUMED

```
    |

    v
```

EVENT_PROCESSED

````


---

# 6. Event Data Structure


Standard event:


```json
{
 "event_id":"uuid",

 "event_type":"QUESTION_OPENED",

 "aggregate_id":"session_id",

 "actor_id":"student_id",

 "timestamp":"2026-07-26T10:00:00",

 "payload":{}
}
````

---

# 7. Event Naming Convention

Format:

```
ENTITY_ACTION
```

Example:

```
SESSION_STARTED

QUESTION_OPENED

ANSWER_SUBMITTED

EXAM_FINISHED

SCORE_GENERATED

```

---

# 8. CBT Core Events

## Session Events

```
SESSION_CREATED

SESSION_STARTED

SESSION_PAUSED

SESSION_RESUMED

SESSION_COMPLETED

SESSION_EXPIRED

```

---

## Question Events

```
QUESTION_SELECTED

QUESTION_OPENED

QUESTION_VIEWED

QUESTION_FLAGGED

QUESTION_UNFLAGGED

```

---

## Answer Events

```
ANSWER_STARTED

ANSWER_UPDATED

ANSWER_SUBMITTED

ANSWER_SYNCED

ANSWER_LOCKED

```

---

## Timer Events

```
TIMER_STARTED

TIMER_WARNING

TIMER_PAUSED

TIMER_EXPIRED

```

---

## Scoring Events

```
SCORING_STARTED

ANSWER_EVALUATED

SCORE_GENERATED

RESULT_PUBLISHED

```

---

# 9. Event Storage

Table:

```
event_logs
```

---

Fields:

| Field          | Description |
| -------------- | ----------- |
| id             | Event ID    |
| event_type     | Event name  |
| aggregate_type | Object type |
| aggregate_id   | Object ID   |
| actor_id       | User        |
| payload        | JSON data   |
| created_at     | Timestamp   |

---

# 10. Event Payload Design

Payload menggunakan JSONB.

Example:

```json
{
"question_id":"Q1001",

"previous_state":"NOT_VISITED",

"new_state":"ANSWERED"
}
```

---

# 11. Event Sourcing Usage

CBT tidak menggunakan full event sourcing.

Menggunakan:

```
Hybrid Event Architecture
```

Artinya:

Current State:

```
Database Table
```

History:

```
Event Log
```

---

# 12. Why Hybrid

Keuntungan:

```
Fast Query

Simple Database

Complete Audit Trail

Easy Analytics

```

---

# 13. Offline Event Handling

Saat offline:

Client menyimpan:

```
Local Event Queue

```

Example:

```
ANSWER_SUBMITTED

QUESTION_FLAGGED

NAVIGATION_CHANGED

```

---

Saat online:

```
Sync Event Queue

        |

        v

Server Validation

        |

        v

Store Event

```

---

# 14. Event Ordering

Setiap event memiliki:

```
sequence_number
```

Contoh:

```
1 SESSION_STARTED

2 QUESTION_OPENED

3 ANSWER_SUBMITTED

4 QUESTION_CHANGED

```

---

# 15. Duplicate Event Handling

Karena offline sync dapat mengirim ulang:

System menggunakan:

```
event_id uniqueness
```

Jika sama:

```
Ignore Duplicate

```

---

# 16. Event Reliability

Guarantee:

```
At Least Once Delivery
```

Jika gagal:

```
Retry

Dead Letter Queue

Error Logging

```

---

# 17. Event Queue Architecture

Production:

```
Application


    |

    |

Message Queue


    |

    |

Consumers


```

Technology:

MVP:

```
PostgreSQL Queue

```

Scale:

```
Redis Stream

RabbitMQ

Kafka

```

---

# 18. Event Example

Student membuka soal:

Action:

```
Open Question 15
```

Generated Event:

```json
{
"type":"QUESTION_OPENED",

"session_id":"abc123",

"question_id":"15",

"time":"10:15:22"
}
```

---

# 19. Analytics Usage

Event digunakan untuk:

```
Average Question Time

Difficult Question Detection

Learning Behavior

Exam Pattern

Cheating Detection

```

---

# 20. AI Usage

Event dapat menjadi input:

```
Student Behavior Model

Difficulty Recommendation

Learning Recommendation

```

---

# 21. Audit Usage

Contoh:

Admin bertanya:

```
Mengapa nilai berubah?
```

System:

```
Score recalculated

Event:

SCORE_RECALCULATED

Actor:

Admin

Timestamp:

10:30

```

---

# 22. Security

Event harus:

```
Immutable

Timestamped

Access Controlled

Audited

```

---

# 23. Performance Requirement

Event Write:

```
<10ms
```

Read:

```
Indexed Query

```

---

# 24. Index Strategy

Required index:

```
event_type

aggregate_id

actor_id

created_at

```

---

# 25. Monitoring Metrics

Monitor:

```
Event Throughput

Failed Events

Queue Length

Processing Delay

Duplicate Events

```

---

# 26. Future Enhancement

Support:

```
Kafka Streaming

Real Time Analytics

Complex Event Processing

AI Behavior Detection

```

---

# 27. Final Architecture

```

                CBT Runtime


                     |

                     |

              Event Publisher


                     |

                     |

              Event Storage


                     |

                     |

              Event Processor


          +----------+----------+

          |                     |

          v                     v


     Analytics              Audit


          |

          |

        AI Engine


```

---

# 28. Conclusion

Event Architecture memberikan:

* audit lengkap;
* tracking aktivitas;
* offline synchronization;
* analytics real-time;
* fondasi AI recommendation.

Dengan desain ini CBT Runtime YakinLulus.id siap berkembang dari:

```
Simple CBT

        |

        v

Analytics Platform

        |

        v

AI Learning Platform
