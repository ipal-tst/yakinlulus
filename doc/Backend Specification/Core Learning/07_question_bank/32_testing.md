Berikut **32_testing.md**. Dokumen ini menjadi fondasi QA Engineering untuk modul **Question Bank**. Karena YakinLulus.id dirancang sebagai platform edukasi dengan data kritikal (bank soal, CBT, AI generation, histori ujian), testing tidak cukup hanya unit test. Harus mencakup **functional testing, domain testing, integration testing, security testing, performance testing, dan AI quality testing**.

---

````markdown
# 32_testing.md

# Question Bank Testing Specification

Version : 1.0

---

# 1. Overview

Dokumen ini mendefinisikan strategi testing
untuk modul Question Bank.

Tujuan.

- Menjamin kualitas fitur
- Memastikan business rule berjalan
- Mencegah regression
- Menjamin keamanan data
- Memastikan performa sistem
- Mendukung production readiness

---

# 2. Testing Principles

Testing mengikuti prinsip.

- Automated First
- Test Early
- Test Business Rules
- Test Failure Scenario
- Test Security Boundary
- Test Performance

---

# 3. Testing Scope

Testing mencakup.

```
Question Management

Question Workflow

Versioning

Review

Search

Import Export

AI Generation

Storage

Cache

Event

Audit

Security

Performance
```

---

# 4. Testing Level

Level testing.

```
Unit Test

↓

Integration Test

↓

Contract Test

↓

End To End Test

↓

Performance Test

↓

Security Test

↓

UAT
```

---

# 5. Unit Testing

Unit test menguji
komponen terkecil.

Target.

- Domain Entity
- Value Object
- Service
- Validator
- Algorithm

---

# 6. Domain Unit Test

Contoh.

Question Entity.

Test.

✓ Create Question

✓ Update Draft

✓ Publish Rule

✓ Version Creation

✓ Status Transition

---

# 7. Business Rule Testing

Rule yang diuji.

```
Question Published
harus Approved

Question Archived
tidak boleh dipakai CBT

Published Version
tidak boleh diedit
```

---

# 8. Repository Testing

Repository diuji terhadap.

- Query
- Insert
- Update
- Transaction
- Constraint

Menggunakan.

Test Database

---

# 9. Database Testing

Meliputi.

✓ Migration

✓ Schema

✓ Index

✓ Foreign Key

✓ Constraint

✓ Trigger

---

# 10. API Testing

Setiap endpoint diuji.

Meliputi.

- Request Validation
- Response
- Status Code
- Authentication
- Authorization
- Error Response

---

# 11. API Test Scenario

Contoh.

Create Question.

Positive.

```
Valid Payload

↓

201 Created
```

Negative.

```
Missing Subject

↓

400 Validation Error
```

Unauthorized.

```
No Token

↓

401 Unauthorized
```

---

# 12. Integration Testing

Menggunakan komponen nyata.

Contoh.

```
API

↓

Service

↓

Repository

↓

PostgreSQL
```

---

# 13. External Integration Testing

Meliputi.

Object Storage

AI Provider

Message Broker

Email Notification

Search Engine

---

# 14. Event Testing

Testing.

- Event Created
- Event Published
- Consumer Processing
- Retry
- Failure Handling

---

# 15. Background Job Testing

Testing.

Import Job.

Embedding Job.

Export Job.

Thumbnail Job.

Scenario.

```
Success

Failed

Retry

Timeout

Cancelled
```

---

# 16. Workflow Testing

State Machine harus diuji.

Valid.

```
Draft

↓

Review

↓

Approved

↓

Published
```

Invalid.

```
Draft

↓

Published
```

Harus gagal.

---

# 17. Versioning Testing

Test.

✓ Create Version

✓ Compare Version

✓ Restore Version

✓ Published Immutable

---

# 18. Search Testing

Meliputi.

Keyword Search

Metadata Filter

Full Text Search

Semantic Search

Hybrid Search

---

# 19. Vector Search Testing

Testing.

- Embedding Created
- Similarity Result
- Duplicate Detection
- Ranking

---

# 20. Import Testing

Test file.

```
Valid Excel

Invalid Format

Duplicate Question

Missing Field

Large File
```

---

# 21. Export Testing

Test.

```
Small Dataset

Large Dataset

Permission

Expired URL

Cancelled Job
```

---

# 22. Storage Testing

Testing.

Upload.

Download.

Delete.

Replace.

Signed URL.

---

# 23. Cache Testing

Testing.

Cache Hit

Cache Miss

Invalidation

Expiration

Redis Failure

---

# 24. Security Testing

Meliputi.

Authentication.

Authorization.

Injection.

XSS.

CSRF.

File Upload.

Rate Limit.

---

# 25. Penetration Testing

Scenario.

- Unauthorized Access
- Privilege Escalation
- API Abuse
- Data Leakage
- Token Abuse

---

# 26. Performance Testing

Jenis.

## Load Test

Normal Load.

## Stress Test

Maximum Capacity.

## Spike Test

Traffic Sudden Increase.

## Soak Test

Long Running.

---

# 27. Performance Scenario

Example.

Search.

```
1000 concurrent users

100 requests/sec

Response < 500ms
```

---

# 28. Database Performance Test

Testing.

- Query Plan
- Index Usage
- Slow Query
- Lock
- Deadlock

---

# 29. AI Quality Testing

AI Feature membutuhkan testing tambahan.

Meliputi.

- Output Validity
- Hallucination Check
- Duplicate Rate
- Difficulty Accuracy
- Explanation Quality

---

# 30. AI Evaluation Metric

Metric.

```
Accuracy

Consistency

Relevance

Difficulty Match

Curriculum Match
```

---

# 31. Regression Testing

Setiap release.

Harus menjalankan.

- Core Feature Test
- Workflow Test
- API Test
- Security Test

---

# 32. Test Automation

Tools.

Backend.

- Go Testing
- Testify

API.

- Postman/Newman
- REST Client

Database.

- Testcontainers

Performance.

- k6
- JMeter

Security.

- OWASP ZAP

---

# 33. Test Environment

Environment.

```
Local

↓

Development

↓

Staging

↓

Production
```

---

# 34. Test Data

Menggunakan.

Synthetic Data

Sample Question

Large Dataset

Production-like Dataset

---

# 35. Test Coverage Target

Target minimum.

Unit Test.

80%

Domain Logic.

90%

Critical Workflow.

100%

API.

80%

---

# 36. CI/CD Testing Pipeline

Flow.

```
Commit

↓

Build

↓

Unit Test

↓

Integration Test

↓

Security Scan

↓

Deploy Staging

↓

UAT

↓

Production
```

---

# 37. Defect Management

Setiap defect memiliki.

- ID
- Severity
- Priority
- Environment
- Evidence
- Resolution

---

# 38. Severity Level

Critical.

System tidak dapat digunakan.

High.

Fitur utama gagal.

Medium.

Fitur terganggu.

Low.

Minor Issue.

---

# 39. Production Validation

Sebelum release.

Checklist.

✓ Test Passed

✓ Migration Tested

✓ Backup Available

✓ Rollback Tested

✓ Monitoring Ready

---

# 40. Future Roadmap

- Automated AI Evaluation
- Chaos Testing
- Mutation Testing
- Security Automation
- Continuous Testing
````

---

## Rekomendasi Testing Architecture YakinLulus.id

Untuk backend Go yang dirancang sebelumnya:

```text
                CI Pipeline

                     |
                     v

              Automated Testing

                     |
        +------------+-------------+
        |            |             |
        v            v             v

   Unit Test   Integration   E2E Test

        |            |             |

        v            v             v

   Domain      PostgreSQL     Full System

```

---

## Struktur Folder Testing yang Disarankan

```text
tests/

├── unit/
│   ├── domain/
│   ├── service/
│   └── validator/
│
├── integration/
│   ├── repository/
│   ├── database/
│   └── storage/
│
├── api/
│   ├── question_test.go
│   ├── review_test.go
│   └── import_test.go
│
├── e2e/
│   └── question_workflow_test.go
│
├── performance/
│   ├── search.js
│   └── import.js
│
└── security/
    └── authorization_test.go
```

---

## Acceptance Testing Matrix

| Modul            | Coverage Wajib      |
| ---------------- | ------------------- |
| Question CRUD    | 100%                |
| State Machine    | 100%                |
| Publish Workflow | 100%                |
| Versioning       | 100%                |
| Import           | 90%                 |
| Search           | 90%                 |
| AI Generation    | 80%                 |
| Storage          | 90%                 |
| Security         | 100%                |
| Performance      | Semua critical path |

---

Dengan dokumen ini, modul **Question Bank** sudah memiliki siklus lengkap:

```
01 Domain Model
        ↓
02 Business Rules
        ↓
...
31 Performance
        ↓
32 Testing
        ↓
33 Acceptance Criteria
        ↓
34 Future Roadmap
```

Sehingga siap masuk tahap berikutnya: **34_future_roadmap.md**.
