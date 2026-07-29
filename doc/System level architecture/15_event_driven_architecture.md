Melanjutkan ke file berikutnya:

# `11_implementation_architecture/15_event_driven_architecture.md`

```md id="event15yl"
# Event Driven Architecture
## YakinLulus.id Event Driven Architecture Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan Event Driven Architecture (EDA) pada platform YakinLulus.id.

Event Driven Architecture digunakan untuk membuat sistem:

- loosely coupled;
- scalable;
- asynchronous;
- mudah diintegrasikan;
- siap menuju microservice architecture.


Konsep utama:


```

A Domain Tidak Perlu Mengetahui Detail Domain B

Cukup Menghasilkan Event

```


---

# 2. Event Driven Architecture Principles


YakinLulus.id menggunakan prinsip:


```

Domain Event First

*

Loose Coupling

*

Async Communication

*

Event Auditability

*

Future Microservice Ready

```


---

# 3. Event Driven Architecture Overview


```

```
                     Domain Action


                          |

                          |

                    Domain Event


                          |

                          |

                 Event Dispatcher


                          |

          +---------------+---------------+

          |               |               |

      Analytics     Notification       AI Service


          |

          |

      Data Storage
```

```


---

# 4. Event Concept


Event adalah fakta yang sudah terjadi.


Contoh:


```

ExamCompleted

QuestionCreated

MaterialPublished

UserRegistered

```


Event menggunakan bentuk:


```

Past Tense

```


Contoh:


Benar:


```

ExamCompleted

```


Tidak:


```

CompleteExam

````


---

# 5. Domain Event Structure


Standard event:


```json
{
    "event_id":"uuid",
    "event_type":"ExamCompleted",
    "aggregate_id":"exam_session_id",
    "occurred_at":"timestamp",
    "payload":{}
}
````

---

# 6. Event Architecture Component

Komponen:

```
Domain Layer


 |

Event Publisher


 |

Message Broker


 |

Event Consumer


 |

Handler


```

---

# 7. Event Publisher

Publisher bertugas:

* membuat event;
* mengirim event;
* memastikan event valid.

Contoh:

```
Exam Service


 |

Exam Finished


 |

Publish ExamCompletedEvent

```

---

# 8. Message Broker

Message broker menjadi penghubung.

MVP:

```
Redis Pub/Sub

```

Production:

```
RabbitMQ

Apache Kafka

Google Pub/Sub

Amazon EventBridge

```

---

# 9. Event Consumer

Consumer menerima event.

Contoh:

```
ExamCompletedEvent


        |

        +----------------+

        |                |

Analytics Consumer


Notification Consumer

```

---

# 10. Event Flow Example

## Student Complete Exam

```
Student


 |

Finish Exam


 |

Exam Domain


 |

Generate ExamCompletedEvent


 |

Event Bus


 |

+---------------+---------------+

|                               |

Analytics                  Notification


```

---

# 11. Core Domain Events

YakinLulus memiliki event utama:

```
Identity Events


UserRegistered

UserActivated

UserRoleChanged


```

```
Question Events


QuestionCreated

QuestionUpdated

QuestionPublished


```

```
Exam Events


ExamCreated

ExamStarted

AnswerSubmitted

ExamCompleted


```

```
Learning Events


MaterialViewed

LessonCompleted

ExerciseCompleted


```

---

# 12. CBT Runtime Events

CBT adalah domain kritikal.

Event:

```
ExamSessionStarted


AnswerSubmitted


QuestionFlagged


ExamPaused


ExamCompleted


```

---

# 13. Event Payload Design

Payload hanya berisi informasi penting.

Contoh:

```json
{
 "student_id":"123",
 "exam_id":"456",
 "score":85
}
```

Hindari:

```
Full Object Dump

```

Alasan:

* event lebih kecil;
* mudah berubah;
* consumer lebih fleksibel.

---

# 14. Event Versioning

Event harus memiliki versi.

Contoh:

```
ExamCompleted.v1

ExamCompleted.v2

```

Tujuan:

* backward compatibility;
* migrasi aman.

---

# 15. Event Reliability

Problem:

```
Event Lost

```

Solusi:

```
Persistent Event Storage

+

Retry

+

Dead Letter Queue

```

---

# 16. Outbox Pattern

Untuk menjaga consistency:

Tanpa outbox:

```
Save Database


        |

Crash


        |

Event Tidak Terkirim

```

Dengan outbox:

```
Database Transaction


        |

Save Data


        |

Save Event


        |

Event Publisher


```

---

# 17. Outbox Architecture

```
Application


    |

    |

Transaction


    |

+-----------+-----------+

|                       |

Business Table      Outbox Table


                        |

                        |

                  Event Publisher


                        |

                        |

                  Message Broker

```

---

# 18. Event Processing Strategy

Consumer harus:

* idempotent;
* dapat retry;
* menyimpan processing state.

Contoh:

```
Event ID


 |

Check Already Processed?


 |

Execute

```

---

# 19. Analytics Event Processing

Analytics membutuhkan banyak event.

Flow:

```
ExamCompletedEvent


 |

Analytics Consumer


 |

Calculate


 |

Update Dashboard


```

---

# 20. Notification Event Processing

Contoh:

```
ExamCompletedEvent


 |

Notification Service


 |

Send Result Notification

```

---

# 21. AI Event Processing

Future:

```
QuestionCreated


 |

AI Analyzer


 |

Generate Metadata


 |

Store AI Result

```

---

# 22. Event Storage

Untuk audit:

```
event_logs


id

event_type

payload

created_at

processed_at

```

Digunakan untuk:

* debugging;
* replay;
* audit.

---

# 23. Event Replay Strategy

Jika analytics rusak:

```
Historical Events


 |

Replay Event


 |

Rebuild Analytics

```

---

# 24. Event Security

Proteksi:

```
Event Authentication

Payload Validation

Encryption

Access Control

```

---

# 25. Event Naming Convention

Format:

```
Domain.Entity.Action

```

Contoh:

```
Exam.Session.Completed

Question.Bank.Published

User.Account.Created

```

---

# 26. Internal vs External Event

## Internal Event

Komunikasi antar module.

Contoh:

```
ExamCompleted

```

---

## External Event

Integrasi partner.

Contoh:

```
StudentCertificateIssued

```

---

# 27. Event Driven dalam Modular Monolith

MVP:

```
Single Backend


      |

Internal Event Bus


      |

Domain Modules

```

Belum perlu:

```
Kafka Cluster

```

---

# 28. Evolusi Menuju Microservice

Future:

MVP:

```
Exam Module


      |

Internal Event

```

Evolution:

```
Exam Service


      |

Kafka


      |

Analytics Service

```

---

# 29. Event Monitoring

Metrics:

```
Event Published

Event Consumed

Processing Time

Failed Event

Retry Count

```

---

# 30. Testing Strategy

## Event Test

```
Event Created Correctly


```

## Consumer Test

```
Event Received


Handler Executed

```

## Reliability Test

```
Retry

Duplicate Event

Failure Recovery

```

---

# 31. Implementation MVP

Stack:

```
Go Backend

+

Internal Event Bus

+

Redis Queue

+

PostgreSQL Outbox

```

---

# 32. Production Evolution

Phase Growth:

```
RabbitMQ

+

Dedicated Consumers

```

Enterprise:

```
Kafka

+

Event Streaming Platform

+

Multiple Services

```

---

# 33. Summary

Event Driven Architecture YakinLulus.id:

```
Domain Events

+

Event Bus

+

Outbox Pattern

+

Async Processing

+

Future Microservice Ready

```

Memberikan:

* coupling rendah;
* proses lebih scalable;
* integrasi mudah;
* analytics dan AI siap berkembang.
