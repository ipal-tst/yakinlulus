```markdown id="48291"
# 13_testing/02_unit_testing.md

# Unit Testing Strategy
## YakinLulus.id Engineering Implementation Guide

---

# 1. Overview

Unit Testing merupakan level pengujian paling dasar dalam software testing yang bertujuan memastikan setiap unit terkecil dari aplikasi berjalan sesuai desain.

Dalam YakinLulus.id, unit testing menjadi fondasi utama sebelum melakukan integration testing dan end-to-end testing.

Unit yang diuji meliputi:

- Backend service
- Business logic
- Utility function
- Data validation
- Permission logic
- Score calculation
- CBT engine logic
- Analytics calculation
- AI processing helper


Architecture:

```

```
            Application Code

                   |
                   |

    +--------------+--------------+
    |              |              |
    v              v              v

Backend        Frontend       Mobile

Unit Test      Unit Test      Unit Test

    |              |              |

    +--------------+--------------+

                   |

             Test Result
```

```

---

# 2. Objective

Tujuan unit testing:

## 2.1 Validate Business Logic

Memastikan aturan bisnis berjalan benar.

Contoh:

```

Exam scoring

Question randomization

Ranking calculation

Learning progress calculation

```

---

## 2.2 Prevent Regression

Perubahan kode baru tidak merusak fitur lama.

Contoh:

Developer mengubah:

```

CBT Score Engine

```

maka test memastikan:

```

Previous scoring behavior
tetap berjalan

```

---

## 2.3 Improve Code Quality

Unit testing mendorong:

```

Clean code

Modular architecture

Low coupling

High maintainability

```

---

# 3. Unit Testing Principle

YakinLulus.id menggunakan prinsip:

```

FIRST Principle

```

---

## Fast

Test harus cepat.

Target:

```

Single test < 100ms
Full unit suite < 5 minutes

```

---

## Independent

Setiap test berdiri sendiri.

Tidak bergantung pada:

```

Database production

External API

Other test result

```

---

## Repeatable

Hasil konsisten.

```

Same input

*

Same environment

=

Same output

```

---

## Self Validating

Test menentukan:

```

PASS

atau

FAIL

```

tanpa pengecekan manual.

---

## Timely

Test dibuat bersamaan dengan implementasi fitur.

---

# 4. Testing Architecture

Architecture:

```

+--------------------------------+

```
      Application Layer
```

+--------------------------------+

```
          |

          v
```

+--------------------------------+

```
      Unit Test Layer
```

+--------------------------------+

```
          |

          v
```

+--------------------------------+

```
      Test Runner
```

+--------------------------------+

```
          |

          v

      Test Report
```

```

---

# 5. Backend Unit Testing

Backend menggunakan:

```

Python

Django

Django REST Framework

pytest

pytest-django

```

---

# 6. Backend Testing Structure

Struktur folder:

```

backend/

├── apps/

│   ├── users/

│   │
│   ├── tests/

│   │   ├── test_models.py
│   │   ├── test_services.py
│   │   ├── test_permissions.py
│   │   └── test_utils.py

│
├── exams/

│   └── tests/

│
└── analytics/

```
└── tests/
```

```

---

# 7. Unit Testing Scope Backend

## 7.1 Model Testing

Testing:

```

Database model

Field validation

Default value

Relationship

```

Contoh:

User model:

```

Student

Teacher

Admin

Staff

```

Test:

```

Role assignment

Unique email

Password validation

```

---

## 7.2 Service Layer Testing

Business logic utama diuji pada service.

Contoh:

```

ExamService

QuestionService

RankingService

AnalyticsService

```

---

Example:

```

create_exam()

↓

validate questions

↓

generate exam

↓

return exam object

```

---

## 7.3 Utility Testing

Testing fungsi helper.

Contoh:

```

calculate_percentage()

format_score()

generate_exam_code()

randomize_questions()

```

---

# 8. CBT Engine Unit Testing

CBT adalah critical module.

Unit test harus mencakup:

---

## 8.1 Question Randomization

Input:

```

Question Pool = 100

Required Question = 40

Student = A

```

Expected:

```

Return 40 unique questions

```

Test:

```

Tidak ada duplicate

Jumlah sesuai konfigurasi

Random seed bekerja

```

---

## 8.2 Score Calculation

Example:

Input:

```

Total Question = 50

Correct Answer = 40

```

Expected:

```

Score = 80

```

Test:

```

Correct calculation

Boundary case

Empty answer handling

```

---

## 8.3 Exam Timer

Testing:

```

Start time

End time

Expired status

Extra submission handling

```

---

## 8.4 Answer Persistence

Test:

```

Save answer

Update answer

Retrieve answer

```

---

# 9. Database Unit Testing

Database test menggunakan:

```

Temporary Database

Transaction Rollback

Factory Data

```

---

Testing:

```

Foreign key

Constraint

Validation

Query result

```

---

Example:

```

Student

|

Enrollment

|

Exam

|

Result

```

Test:

```

Cannot create result
without exam

```

---

# 10. Frontend Unit Testing

Technology:

```

React

Next.js

TypeScript

Jest

React Testing Library

```

---

# 11. Frontend Testing Scope

## Component Testing

Test:

```

Button

Form

Modal

Card

Table

```

---

Example:

Login Component:

Input:

```

email

password

```

Expected:

```

Submit button enabled

Validation appears

Error handled

```

---

# 12. State Management Testing

Testing:

```

Authentication state

Exam state

Timer state

Learning progress state

```

---

Example:

CBT State:

```

Question 1

↓

Answer selected

↓

Move Question 2

↓

State preserved

```

---

# 13. Mobile Unit Testing

Flutter:

```

Flutter Test Framework

```

Testing:

```

Widget

Provider

Bloc

Repository

```

---

Example:

Exam Screen:

```

Load question

Select answer

Save state

```

---

# 14. Mocking Strategy

External dependency harus menggunakan mock.

Contoh:

AI Service:

```

Real AI API

```
    X
```

Mock AI Response

```

---

Library:

Backend:

```

pytest-mock

unittest.mock

```

Frontend:

```

Jest Mock

```

Flutter:

```

Mockito

```

---

# 15. Test Data Management

Menggunakan:

```

Factory Pattern

```

Example:

```

StudentFactory

QuestionFactory

ExamFactory

```

---

Example:

Generate:

```

100 Student

1000 Question

50 Exam

```

untuk testing.

---

# 16. Code Coverage Strategy

Target:

```

Overall Coverage >= 80%

```

Critical module:

```

CBT Engine >= 90%

Authentication >= 90%

Payment/Future Module >= 90%

```

---

Coverage:

```

Line Coverage

Branch Coverage

Function Coverage

```

---

# 17. Continuous Integration Integration

Pipeline:

```

Developer Commit

```
    |

    v
```

Install Dependency

```
    |

    v
```

Run Unit Test

```
    |

    v
```

Generate Coverage

```
    |

    v
```

Quality Gate

```
    |

    v
```

Merge

```

---

# 18. Unit Test Naming Convention

Format:

```

test_<function>*<condition>*<expected_result>

```

Example:

```

test_calculate_score_with_valid_answer_returns_correct_score

test_create_exam_without_question_returns_error

```

---

# 19. Best Practice

## DO

```

Test one behavior

Use meaningful name

Keep test simple

Mock external service

Maintain test coverage

```

---

## DON'T

```

Test implementation detail

Depend on execution order

Use production database

Create huge complex test

```

---

# 20. Implementation Checklist

## Backend

- [ ] pytest installed
- [ ] pytest-django configured
- [ ] Test structure created
- [ ] Model tests created
- [ ] Service tests created
- [ ] CBT logic tested


## Frontend

- [ ] Jest configured
- [ ] Component tests created
- [ ] State tests created


## Mobile

- [ ] Flutter test configured
- [ ] Widget tests created


## CI/CD

- [ ] Unit test executed automatically
- [ ] Coverage generated
- [ ] Quality gate configured

---

# 21. Roadmap

## Phase 1

Foundation:

```

Setup testing framework

Create basic test suite

Implement critical module tests

```

---

## Phase 2

Expansion:

```

Increase coverage

Add frontend tests

Add mobile tests

```

---

## Phase 3

Advanced:

```

Mutation testing

AI generated test case

Automated coverage monitoring

```

---

# Conclusion

Unit Testing menjadi lapisan pertama quality assurance YakinLulus.id.

Dengan coverage tinggi pada:

```

Business Logic

CBT Engine

Authentication

Analytics

Learning System

```

platform memiliki fondasi kode yang stabil, mudah dikembangkan, dan siap menuju skala enterprise.
```
