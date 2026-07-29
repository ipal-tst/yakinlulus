```markdown id="58392"
# 13_testing/03_backend_testing.md

# Backend Testing Strategy
## YakinLulus.id Engineering Implementation Guide

---

# 1. Overview

Backend testing merupakan proses validasi terhadap seluruh komponen server-side YakinLulus.id untuk memastikan API, business logic, database interaction, authentication, authorization, dan background processing berjalan sesuai requirement.

Backend YakinLulus.id menggunakan:

```

Django
Django REST Framework
PostgreSQL
Redis
Celery
JWT Authentication

```

Backend bertanggung jawab terhadap:

- User management
- Role permission
- Question Bank
- Learning Material
- CBT Engine
- Exam Processing
- Scoring
- Analytics
- AI Integration
- Notification System

Karena backend merupakan core business engine, testing harus mencakup:

```

Functional Testing
+
Integration Testing
+
Security Testing
+
Performance Testing

```

---

# 2. Backend Testing Objectives

## 2.1 Validate API Behavior

Memastikan seluruh REST API:

```

Request

↓

Validation

↓

Business Logic

↓

Database Operation

↓

Response

```

berjalan sesuai kontrak.

---

## 2.2 Validate Business Rules

Memastikan aturan bisnis tidak berubah secara tidak sengaja.

Contoh:

```

Student tidak dapat membuat exam

Teacher hanya dapat mengelola materi miliknya

Admin memiliki full access

```

---

## 2.3 Validate Data Integrity

Memastikan database tetap konsisten.

Testing:

```

Foreign Key

Constraint

Transaction

Relationship

Data Validation

```

---

## 2.4 Validate Security Layer

Memastikan:

```

Authentication

Authorization

Permission

Token Handling

Sensitive Data Protection

```

berfungsi dengan benar.

---

# 3. Backend Testing Architecture

Architecture:

```

```
             Backend Application


                   |

    +--------------+--------------+

    |              |              |

    v              v              v


 API Layer    Service Layer   Database


    |              |              |

    +--------------+--------------+

                   |

                   v


          Automated Test Suite


                   |

                   v


            Test Report
```

```

---

# 4. Backend Testing Levels

Backend testing terdiri dari:

```

1. Unit Test

2. Service Test

3. API Test

4. Database Test

5. Integration Test

6. Security Test

7. Performance Test

```

---

# 5. Testing Environment

Backend testing menggunakan environment terpisah.

```

Development

```
  |

  v
```

Testing Environment

```
  |

  v
```

Staging Environment

```
  |

  v
```

Production

```

---

Database:

```

PostgreSQL Test Database

```

Redis:

```

Dedicated Test Redis Instance

```

Celery:

```

Test Worker Environment

```

---

# 6. Backend Test Stack

## Core Testing

```

pytest

pytest-django

coverage.py

```

---

## API Testing

```

DRF APITestCase

pytest API Client

Postman/Newman

```

---

## Mocking

```

pytest-mock

unittest.mock

```

---

## Factory Data

```

factory-boy

faker

```

---

# 7. Project Test Structure

Recommended structure:

```

backend/

├── apps/

│
├── users/

│   ├── models.py
│   ├── services.py
│   ├── views.py
│   └── tests/
│
│       ├── test_models.py
│       ├── test_services.py
│       ├── test_api.py
│       └── test_permissions.py

├── exams/

│   └── tests/

├── questions/

│   └── tests/

├── analytics/

│   └── tests/

└── conftest.py

```

---

# 8. Model Testing

Model testing memastikan struktur database benar.

Testing:

```

Field Validation

Default Value

Relationship

Constraint

Method Model

```

---

## Example

Student Model:

```

Student

|

User

|

Profile

```

Test:

```

Student harus memiliki user

Email harus unique

Role harus student

```

---

# 9. Serializer Testing

Serializer bertanggung jawab terhadap:

```

Input Validation

Data Transformation

Output Formatting

```

---

Testing:

## Valid Data

Input:

```

{
username:"student01",
email:"[student@test.com](mailto:student@test.com)"
}

```

Expected:

```

HTTP 201
User Created

```

---

## Invalid Data

Input:

```

email = invalid

```

Expected:

```

Validation Error

```

---

# 10. Service Layer Testing

Business logic harus berada pada service layer.

Contoh:

```

ExamService

QuestionService

ScoreService

RankingService

```

---

Testing:

```

Input

↓

Service Function

↓

Expected Output

```

---

Example:

Function:

```

calculate_exam_score()

```

Input:

```

correct_answer = 80
total_question = 100

```

Expected:

```

score = 80

```

---

# 11. Authentication Testing

Authentication menggunakan:

```

JWT Authentication

```

Testing:

---

## Login Success

Input:

```

Valid username/password

```

Expected:

```

Access Token Generated
Refresh Token Generated

```

---

## Login Failed

Input:

```

Wrong password

```

Expected:

```

401 Unauthorized

```

---

## Token Expired

Expected:

```

Token rejected
Require refresh

```

---

# 12. Authorization Testing

Testing RBAC.

Role:

```

Admin

Staff

Teacher

Student

```

---

Matrix:

| Action | Admin | Staff | Teacher | Student |
|-|-|-|-|-|
| Manage User | Yes | Limited | No | No |
| Create Question | Yes | Yes | Yes | No |
| Create Exam | Yes | Yes | Yes | No |
| Take Exam | No | No | No | Yes |

---

Test:

```

Student mencoba akses admin API

Expected:

403 Forbidden

```

---

# 13. API Endpoint Testing

Semua endpoint harus memiliki test.

Contoh:

```

GET /api/questions/

POST /api/exams/

POST /api/exams/{id}/submit/

GET /api/results/

```

---

Testing:

```

HTTP Status

Response Schema

Validation

Authentication

Permission

```

---

# 14. CBT Backend Testing

CBT merupakan modul kritis.

Testing meliputi:

---

## 14.1 Exam Creation

Test:

```

Teacher create exam

Question selected

Configuration saved

```

Expected:

```

Exam created

```

---

## 14.2 Question Randomization

Input:

```

Question Pool = 500

Selected = 50

```

Expected:

```

50 unique questions returned

```

Validation:

```

No duplicate

Correct difficulty

Correct subject

```

---

## 14.3 Answer Submission

Flow:

```

Student Answer

↓

Validate Exam Session

↓

Save Answer

↓

Update Progress

```

Test:

```

Duplicate submission

Invalid question

Expired exam

```

---

## 14.4 Score Processing

Test:

```

Answer evaluation

Score calculation

Result generation

```

---

# 15. Database Integration Testing

Testing database interaction.

Meliputi:

```

Create

Read

Update

Delete

```

---

Example:

Create Exam:

```

Exam

|

Exam Question

|

Question Bank

```

Validation:

```

Relationship created correctly

```

---

# 16. Celery Task Testing

Background task:

```

Email Notification

AI Processing

Analytics Calculation

Report Generation

```

---

Testing:

```

Task triggered

Input accepted

Result generated

Failure handled

```

---

Example:

AI Question Generator:

```

Prompt Submitted

↓

Celery Task

↓

AI Response Saved

```

---

# 17. External Service Mock Testing

External dependency tidak dipanggil saat test.

Contoh:

```

AI API

Email Provider

Storage Service

```

Architecture:

```

Application

```
 |

 v
```

Mock Service

```
 |

 v
```

Test Result

```

---

# 18. Error Handling Testing

Backend harus menangani error dengan standar.

Test:

```

Invalid Request

Missing Field

Permission Error

Database Error

External API Failure

````

---

Response standard:

```json
{
 "success":false,
 "message":"Validation failed",
 "error_code":"VALIDATION_ERROR"
}
````

---

# 19. API Contract Testing

Memastikan frontend dan backend memiliki kontrak stabil.

Testing:

```
Request Schema

Response Schema

Field Name

Data Type

Status Code
```

---

Tools:

```
OpenAPI Schema

Swagger Validation

Postman Collection
```

---

# 20. Backend Performance Testing

Target:

```
API Response < 500ms

Database Query Optimized

No Memory Leak
```

---

Testing:

```
Concurrent Login

Concurrent Exam Access

Mass Submission

Report Generation
```

---

Tools:

```
k6

Locust

JMeter
```

---

# 21. Continuous Integration

Pipeline:

```
Git Push

↓

Install Dependency

↓

Run Migration

↓

Run Unit Test

↓

Run API Test

↓

Generate Coverage

↓

Build Docker Image

↓

Deploy
```

---

# 22. Backend Quality Gate

Release minimum:

```
Test Coverage >= 80%

Critical API Tested

Security Test Passed

Migration Tested

No Critical Bug
```

---

# 23. Implementation Checklist

## Framework

* [ ] pytest installed
* [ ] pytest-django configured
* [ ] Test database configured

## API

* [ ] Endpoint tests created
* [ ] Authentication tested
* [ ] Permission tested

## Business Logic

* [ ] Service tested
* [ ] CBT logic tested
* [ ] Analytics tested

## Database

* [ ] Model tested
* [ ] Relationship tested
* [ ] Migration tested

## Background Process

* [ ] Celery tested
* [ ] External service mocked

## CI/CD

* [ ] Automated test execution
* [ ] Coverage reporting
* [ ] Quality gate enabled

---

# 24. Roadmap

## Phase 1 - Backend Testing Foundation

```
Setup pytest

Create test structure

Test core modules
```

---

## Phase 2 - Coverage Expansion

```
Complete API testing

Increase coverage

Add regression suite
```

---

## Phase 3 - Advanced Testing

```
Performance automation

Security automation

Chaos testing
```

---

# Conclusion

Backend Testing Strategy YakinLulus.id memastikan seluruh server-side component memiliki kualitas production-grade.

Dengan coverage menyeluruh terhadap:

```
API

Business Logic

Database

Authentication

CBT Engine

Background Processing
```

backend dapat berkembang secara aman, scalable, dan maintainable.

```
```
