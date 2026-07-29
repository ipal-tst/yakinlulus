```markdown id="t6x2pd"
# 12_engineering_implementation_guide/cbt_engine/10_cbt_testing_strategy.md

# CBT Engine Testing Strategy

## 1. Tujuan

Dokumen ini menjelaskan strategi pengujian untuk seluruh komponen CBT Engine YakinLulus.id.

CBT Engine merupakan sistem kritikal karena berhubungan langsung dengan:

- proses ujian;
- jawaban siswa;
- waktu ujian;
- scoring;
- integritas akademik;
- data hasil ujian.

Testing harus memastikan:


```

Functional Correctness

*

Data Integrity

*

Performance Stability

*

Security Reliability

*

High Concurrency Capability

```


---

# 2. Testing Scope


CBT Engine Testing mencakup:


```

Exam Lifecycle

Question Randomization

Timer Engine

Answer Engine

Scoring Engine

Offline Engine

Sync Engine

Security

Performance

```


---

# 3. Testing Pyramid


Strategi:


```

```
          E2E Testing

              ▲

              |

      Integration Testing

              ▲

              |

         Unit Testing
```

```


Komposisi:


```

70% Unit Test

20% Integration Test

10% End-to-End Test

```


---

# 4. Testing Architecture


```

Developer

|

|

Automated Test

|

+----------------+

|                |

Backend Test   Frontend Test

|                |

+----------------+

```
      |

      |

 Integration Test


      |

      |

   E2E Test


      |

      |

 Production Validation
```

```


---

# 5. Unit Testing


## Tujuan


Menguji komponen kecil secara terisolasi.


Target:


```

Business Logic

Algorithm

Validation

Calculation

State Transition

```


---

# 6. Unit Test: Randomization Engine


Test:


```

Question Selection

Difficulty Distribution

Random Seed

Duplicate Prevention

Question Constraint

```


Contoh:


Input:


```

1000 Questions

Requirement:

40 Questions

```


Expected:


```

40 Unique Questions

Correct Difficulty Ratio

```


---

# 7. Unit Test: Timer Engine


Test:


```

Timer Initialization

Remaining Time Calculation

Expiration Detection

Timezone Conversion

```


Example:


```

Duration:

120 minutes

Start:

08:00

Expected:

Expire 10:00

```


---

# 8. Unit Test: Answer Engine


Test:


```

Create Answer

Update Answer

Duplicate Request

Invalid Answer

Locked Session

```


---

# 9. Unit Test: Scoring Engine


Test:


```

Correct Answer

Wrong Answer

Empty Answer

Weighted Score

Negative Marking

Passing Grade

```


Example:


```

40 Questions

32 Correct

Expected:

80 Score

```


---

# 10. Integration Testing


## Tujuan


Memastikan antar module bekerja bersama.


Test:


```

Exam Service

*

Question Service

*

Answer Service

*

Scoring Service

```


---

# 11. Exam Flow Integration Test


Scenario:


```

Create Exam

```
    |
```

Student Start

```
    |
```

Generate Question

```
    |
```

Answer Question

```
    |
```

Submit Exam

```
    |
```

Generate Score

```


Expected:


```

Complete Successful Flow

```


---

# 12. API Testing


Menggunakan:


```

OpenAPI Specification

Postman Collection

Automated API Test

```


Test:


```

Authentication

Authorization

Request Validation

Response Format

Error Handling

```


---

# 13. CBT Runtime Testing


Test:


```

Start Exam

Navigate Question

Save Answer

Change Answer

Submit Exam

Auto Submit

```


---

# 14. Offline Testing


Scenario:


## Internet Disconnect


Flow:


```

Start Exam Online

```
    |
```

Disconnect Network

```
    |
```

Continue Answering

```
    |
```

Reconnect

```
    |
```

Sync

```


Expected:


```

No Data Loss

```


---

# 15. Sync Engine Testing


Test:


```

Queue Creation

Batch Upload

Retry

Duplicate Event

Conflict Resolution

Partial Failure

```


---

# 16. Performance Testing


Tujuan:


Mengetahui kemampuan sistem menghadapi beban besar.


Test:


```

Concurrent Student

Question Loading

Answer Submission

Mass Scoring

```


---

# 17. Load Testing Scenario


Example:


Simulation:


```

10.000 Students

Start Exam Together

Submit Answer Simultaneously

```


Measure:


```

Response Time

CPU Usage

Memory Usage

Database Load

Error Rate

```


---

# 18. Stress Testing


Tujuan:


Mengetahui batas maksimum.


Example:


```

Normal:

10.000 Users

Stress:

50.000 Users

```


Observe:


```

System Degradation

Failure Point

Recovery

```


---

# 19. Database Testing


Test:


```

Transaction Integrity

Migration

Rollback

Index Performance

Query Optimization

```


---

# 20. Security Testing


## Authentication


Test:


```

JWT Validation

Token Expiration

Refresh Token

```


---

## Authorization


Test:


```

Student Cannot Access Admin API

Teacher Cannot Modify Result

```


---

## Data Protection


Test:


```

Answer Key Protection

Sensitive Data Exposure

SQL Injection

```


---

# 21. Anti Cheat Testing


Test:


```

Multiple Login

Session Hijacking

Timer Manipulation

Question Extraction

Answer Modification

```


---

# 22. Browser Testing


Platform:


```

Chrome

Firefox

Edge

Safari

```


Test:


```

Exam UI

Timer

Navigation

Offline Mode

```


---

# 23. Mobile Testing


Platform:


```

Android

iOS

```


Test:


```

Screen Size

Rotation

Network Switching

App Restart

Background Process

```


---

# 24. Regression Testing


Setiap perubahan harus memastikan:


```

Existing Feature Still Works

```


Regression suite:


```

Login

Exam Start

Answer Save

Submit

Score

Ranking

```


---

# 25. CI/CD Testing Pipeline


Flow:


```

Git Push

|

Build

|

Unit Test

|

Integration Test

|

Security Scan

|

Deploy Staging

|

E2E Test

|

Production Deploy

```


---

# 26. Test Environment


Environment:


```

Development

Testing

Staging

Production

```


---

# 27. Test Data Strategy


Gunakan:


```

Synthetic Student

Dummy Exam

Generated Question

Mock Answer

```


Tidak menggunakan:


```

Real Student Data

```


---

# 28. Monitoring After Release


Production monitoring:


```

Exam Failure Rate

Answer Loss Rate

API Latency

Sync Error

Scoring Error

```


---

# 29. Acceptance Criteria


CBT Engine dianggap siap jika:


```

✅ All Critical Flow Tested

✅ No Data Loss Scenario

✅ Scoring Accuracy Verified

✅ Offline Sync Stable

✅ Security Test Passed

✅ Load Test Passed

```


---

# 30. Implementation Recommendation


MVP Testing Stack:


Backend:


```

Go Test

Testcontainers

Postman/Newman

```


Frontend:


```

Vitest

Playwright

```


Mobile:


```

Flutter Test

Integration Test

```


Performance:


```

k6

JMeter

```


---

# Summary


CBT Engine Testing Strategy YakinLulus.id menggunakan:


```

Automated Testing

*

Integration Validation

*

Performance Testing

*

Security Testing

*

Production Monitoring

```


Dengan strategi ini CBT Engine siap digunakan mulai dari:

```

School Level

```
    |
```

Regional Try Out

```
    |
```

National Scale Examination

```
```

````

---

## Progress Checklist

```text
12_engineering_implementation_guide/

cbt_engine/

✅ 01_cbt_engine_overview.md
✅ 02_exam_lifecycle.md
✅ 03_exam_session_flow.md
✅ 04_question_randomization.md
✅ 05_timer_engine.md
✅ 06_answer_engine.md
✅ 07_scoring_engine.md
✅ 08_offline_exam_engine.md
✅ 09_sync_engine.md
✅ 10_cbt_testing_strategy.md


CBT ENGINE SECTION COMPLETED ✅
````

Tahap berikutnya yang bisa dilanjutkan:

```
question_bank/
:contentReference[oaicite:0]{index=0}
```

atau

```
learning_material/
:contentReference[oaicite:1]{index=1}
```

karena CBT Engine sudah lengkap dan selanjutnya masuk ke domain implementation lain.
