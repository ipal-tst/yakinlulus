Berikut **19_background_jobs.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini mendefinisikan proses asynchronous pada CBT Runtime untuk menangani pekerjaan berat seperti scoring, sync offline, report generation, analytics processing, dan maintenance.

```markdown id="bg19job"
# 19_background_jobs.md

# YakinLulus.id CBT Background Jobs Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Background Jobs adalah mekanisme untuk menjalankan proses yang tidak harus dieksekusi secara synchronous dengan request pengguna.

Tujuan:

- menjaga response time aplikasi;
- menangani proses berat;
- meningkatkan scalability;
- melakukan retry jika terjadi kegagalan;
- mendukung ujian dengan jumlah peserta besar.

---

# 2. Background Job Principle


Prinsip:


```

User Action

```
  |

  |
```

Create Job

```
  |

  |
```

Worker Process

```
  |

  |
```

Update Result

```


---

# 3. Background Job Architecture


```

```
             CBT Application


                   |

                   |

             Job Producer


                   |

                   |

             Job Queue


                   |

                   |

             Worker Service


                   |

    +--------------+--------------+

    |                             |

    v                             v
```

Database Update              Event Publish

```


---

# 4. Why Background Jobs


Tanpa background job:


```

Student Submit Exam

```
    |
```

Calculate Score

```
    |
```

Generate Report

```
    |
```

Return Response

```


Masalah:


```

Slow Response

Timeout

Resource Blocking

```


---

Dengan background job:


```

Student Submit Exam

```
    |
```

Create Job

```
    |
```

Return Success

```
    |
```

Worker Process

```


---

# 5. Job Processing Model


YakinLulus.id menggunakan:


```

Asynchronous Processing

```


Model:


```

Queue Based Worker

```


---

# 6. Job Components


## 6.1 Job Producer


Komponen yang membuat job:


```

Exam Engine

Scoring Engine

Sync Engine

Analytics Engine

Admin Panel

```


---

## 6.2 Job Queue


Tempat menunggu pekerjaan.


MVP:


```

PostgreSQL Queue

```


Scale:


```

Redis Queue

RabbitMQ

Kafka

```


---

## 6.3 Worker


Service yang menjalankan job.


Tugas:


```

Consume Job

Execute Task

Store Result

Handle Error

```


---

# 7. Job Lifecycle


```

CREATED

|

v

QUEUED

|

v

PROCESSING

|

v

COMPLETED

```


Failure:


```

PROCESSING

```
  |

  v
```

FAILED

```
  |

  v
```

RETRY

```


---

# 8. Job Status


Status:


```

PENDING

RUNNING

SUCCESS

FAILED

RETRYING

CANCELLED

```


---

# 9. Job Entity


Table:


```

background_jobs

```


---

Fields:


| Field | Description |
|-|-|
| id | Job ID |
| job_type | Task type |
| payload | JSON data |
| status | Current status |
| priority | Priority level |
| retry_count | Retry count |
| scheduled_at | Execution time |
| started_at | Start time |
| completed_at | Finish time |
| error_message | Error detail |

---

# 10. Job Priority


Level:


```

HIGH

MEDIUM

LOW

```


---

Example:


HIGH:


```

Exam Scoring

Answer Sync

```


MEDIUM:


```

Report Generation

Analytics Update

```


LOW:


```

Cleanup

Archive

```


---

# 11. Core CBT Background Jobs


## 11.1 Score Calculation Job


Trigger:


```

Student Submit Exam

```


Process:


```

Load Answers

```
    |
```

Evaluate Answers

```
    |
```

Calculate Score

```
    |
```

Generate Result

```


---

## 11.2 Offline Sync Job


Trigger:


```

Device Online

```


Process:


```

Receive Local Events

```
    |
```

Validate

```
    |
```

Merge State

```
    |
```

Store Data

```


---

## 11.3 Report Generation Job


Generate:


```

Exam Report

Student Report

Performance Report

```


---

## 11.4 Analytics Processing Job


Process:


```

Exam Behavior

Question Statistics

Student Progress

```


---

## 11.5 Notification Job


Send:


```

Exam Finished Notification

Result Available

Reminder

```


---

# 12. Scoring Job Flow


```

Exam Submitted

```
  |

  |
```

Create Scoring Job

```
  |

  |
```

Queue

```
  |

  |
```

Worker

```
  |

  |
```

Scoring Pipeline

```
  |

  |
```

Result Saved

```
  |

  |
```

Publish Event

```


---

# 13. Retry Strategy


Jika gagal:


```

Attempt 1

Wait

Attempt 2

Wait

Attempt 3

Fail

```


---

Default:


```

Maximum Retry:

3

```


---

# 14. Retry Backoff


Menggunakan:


```

Exponential Backoff

```


Example:


```

Retry 1:

10 seconds

Retry 2:

60 seconds

Retry 3:

5 minutes

```


---

# 15. Failed Job Handling


Jika gagal permanen:


```

Dead Letter Queue

```


Data disimpan:


```

Error

Payload

Stack Trace

Timestamp

```


---

# 16. Scheduled Jobs


Support:


```

Cron Based Job

```


Example:


Daily:


```

Update Analytics

Cleanup Logs

Generate Reports

```


---

# 17. Job Idempotency


Penting untuk mencegah:


```

Duplicate Processing

```


Setiap job memiliki:


```

unique_job_key

```


Example:


```

score_exam_session_123

```


Jika sudah selesai:


```

Ignore Duplicate

```


---

# 18. Transaction Handling


Job harus menggunakan:


```

Database Transaction

```


Example:


Scoring:


```

BEGIN

Calculate Score

Save Result

Update Status

COMMIT

```


Jika gagal:


```

ROLLBACK

```


---

# 19. Worker Scaling


MVP:


```

1 Worker

```


Production:


```

Multiple Workers

```


Example:


```

Worker 1:

Scoring

Worker 2:

Notification

Worker 3:

Analytics

```


---

# 20. Queue Isolation


Untuk skala besar:


Pisahkan queue:


```

score_queue

sync_queue

analytics_queue

notification_queue

```


---

# 21. Monitoring


Metrics:


```

Queue Length

Processing Time

Failed Jobs

Retry Count

Worker Health

```


---

# 22. Security


Background Job harus:


```

Validate Payload

Restrict Permission

Secure Sensitive Data

Audit Execution

```


---

# 23. Integration


Background Jobs terhubung dengan:


```

Session Management

Answer Sync

Scoring Pipeline

Auto Grading

Event Architecture

Analytics

Notification

AI Engine

```


---

# 24. Performance Requirement


Job Creation:


```

<50ms

```


Worker Response:


```

Near Real Time

```


Large Processing:


```

Horizontal Scaling

```


---

# 25. Database Index


Required:


```

job_type

status

priority

scheduled_at

created_at

```


---

# 26. Example Jobs


## Exam Submit


```

JOB:

CALCULATE_SCORE

Payload:

{
session_id:"123"
}

```


---

## Generate Report


```

JOB:

GENERATE_RESULT_REPORT

Payload:

{
exam_id:"456"
}

```


---

# 27. Future Enhancement


Support:


```

Distributed Worker

Kubernetes Job

Serverless Worker

Real Time Stream Processing

AI Processing Pipeline

```


---

# 28. Final Architecture


```

```
         CBT Runtime


              |

              |

        Job Producer


              |

              |

         Job Queue


              |

              |

          Workers


    +---------+---------+

    |                   |

    v                   v
```

Database            Event System

```
    |

    |

Analytics
```

```


---

# 29. Conclusion


Background Jobs memberikan:

- performa stabil;
- proses scalable;
- retry mechanism;
- asynchronous processing;
- support ujian massal.


Dengan desain ini CBT Runtime YakinLulus.id siap menangani:

```

10 Users MVP

```
    |

    v
```

School CBT

```
    |

    v
```

Large Scale Assessment

```
```

