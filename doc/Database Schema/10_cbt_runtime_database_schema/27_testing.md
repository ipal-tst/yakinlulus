Berikut **27_testing.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini mendefinisikan strategi testing CBT Runtime mulai dari unit test, integration test, simulation exam, load test, security test, hingga UAT.

```markdown
# 27_testing.md

# YakinLulus.id CBT Testing Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Testing Strategy memastikan CBT Runtime:

- berjalan sesuai business rule;
- memiliki data integrity;
- aman terhadap manipulasi;
- stabil pada beban tinggi;
- siap digunakan pada lingkungan produksi.

---

# 2. Testing Objective


Testing bertujuan memastikan:


```

Functional Correctness

*

Performance

*

Security

*

Reliability

*

Maintainability

```

---

# 3. Testing Scope


Testing mencakup:


```

1. Database Layer

2. Backend Service

3. CBT Runtime

4. Frontend Interaction

5. Offline Sync

6. Scoring Engine

7. Security Layer

8. Infrastructure

```

---

# 4. Testing Level


Piramida testing:


```

```
          E2E Test

             /\

            /  \

           /____\


      Integration Test


         /--------\


        Unit Test
```

```


---

# 5. Unit Testing


## Objective


Menghasilkan validasi fungsi terkecil.


Contoh:


```

Timer Calculation

Score Calculation

Random Selection

Answer Validation

State Transition

```

---

## Example Test Case


Function:


```

calculate_score()

```


Input:


```

Correct Answer = 30

Total Question = 40

```


Expected:


```

Score = 75

```

---

# 6. Database Testing


## Objective


Memastikan:


```

Schema Valid

Constraint Correct

Transaction Safe

Data Consistency

```

---

## Test:


### Constraint Test


Contoh:


Tidak boleh:


```

student_answer

without

exam_session

```


Expected:


```

Database Reject

```

---

# 7. Migration Testing


Setiap migration harus diuji:


```

Fresh Install

Upgrade Existing Database

Rollback

Data Preservation

```

---

# 8. API Testing


Testing:


```

Authentication API

Exam API

Question API

Answer API

Result API

```

---

## Example


Request:


```

POST /exam/start

```


Expected:


```

Session Created

Timer Started

Question Loaded

```

---

# 9. Integration Testing


Menggabungkan beberapa service.


Example:


```

CBT Runtime

*

Session Engine

*

Question Engine

*

Database

```

---

Scenario:


```

Student Start Exam

```
    |
```

Create Session

```
    |
```

Generate Question

```
    |
```

Return First Question

```

---

# 10. CBT Flow Testing


Full lifecycle:


```

Login

↓

Start Exam

↓

Answer Question

↓

Navigate

↓

Submit

↓

Grading

↓

Result

```

---

# 11. Timer Testing


Test:


```

Timer Start

Timer Pause

Timer Resume

Timer Expire

Auto Submit

```

---

Example:


Input:


```

Duration:

60 minutes

```

Expected:


```

After 60 minutes:

Session = EXPIRED

Submit Triggered

```

---

# 12. Randomization Testing


Testing:


```

Question Pool Selection

Difficulty Distribution

Student Variation

Duplicate Prevention

```

---

Example:


Pool:


```

100 Questions

```

Exam:


```

30 Questions

```

Expected:


```

Every student:

30 Questions

Different Order

Same Difficulty Pattern

```

---

# 13. Answer Sync Testing


Testing:


```

Online Save

Offline Save

Reconnect

Conflict Resolution

Duplicate Event

```

---

Scenario:


```

Student Answer Offline

```
    |
```

Connection Lost

```
    |
```

Connection Return

```
    |
```

Sync

```
    |
```

Database Updated

```

---

# 14. Scoring Testing


Testing:


```

Correct Answer

Wrong Answer

Empty Answer

Weighted Score

Bonus Rule

Penalty Rule

```

---

Example:


```

40 Questions

30 Correct

Expected:

75 Score

```

---

# 15. Auto Grading Testing


Test:


```

Answer Key Matching

Multiple Choice Evaluation

Invalid Answer

Missing Key

```

---

# 16. State Machine Testing


Tujuan:


Memastikan tidak ada invalid transition.


Example:


Allowed:


```

RUNNING

↓

SUBMITTED

```

Forbidden:


```

COMPLETED

↓

RUNNING

```

Expected:


```

Rejected

```

---

# 17. Event Testing


Testing:


```

Event Created

Event Published

Consumer Receive

Retry Mechanism

Failure Handling

```

---

# 18. Background Job Testing


Testing:


```

Scoring Worker

Notification Worker

Analytics Worker

Sync Worker

```

---

Scenario:


```

1000 Submission

↓

Queue

↓

Worker Processing

↓

All Completed

```

---

# 19. Performance Testing


## Load Test


Simulasi:


```

1000 Concurrent Student

```

---

## Stress Test


Mencari batas:


```

5000

10000

20000 Users

```

---

## Spike Test


Simulasi:


```

Traffic Sudden Increase

```

---

## Endurance Test


Simulasi:


```

Long Exam Duration

4 Hours+

```

---

# 20. Database Performance Test


Test:


```

Large Question Bank

Million Answer Records

Concurrent Write

Report Query

```

---

# 21. Security Testing


Testing:


```

Authentication

Authorization

Session Security

API Security

Data Exposure

```

---

# 22. Penetration Testing


Scenario:


```

SQL Injection

XSS

CSRF

IDOR

Token Manipulation

```

---

# 23. Anti Cheat Testing


Testing:


```

Tab Switching

Multiple Login

Session Sharing

Answer Manipulation

Clock Manipulation

```

---

# 24. Offline Mode Testing


Scenario:


```

Start Online

Disconnect Network

Continue Exam

Answer Locally

Reconnect

Sync

Submit

```

---

Expected:


```

No Data Loss

No Duplicate Answer

Correct Result

```

---

# 25. Browser Compatibility Testing


Support:


```

Chrome

Firefox

Edge

Safari

Mobile Browser

```

---

# 26. Device Testing


Testing:


```

Desktop

Laptop

Tablet

Mobile Phone

```

---

# 27. UAT (User Acceptance Test)


Performed by:


```

Admin

Teacher

Student

```

---

## Student UAT


Validate:


```

Login

Exam Start

Answer

Navigation

Submit

Result

```

---

## Teacher UAT


Validate:


```

Create Exam

Select Question

Review Result

```

---

## Admin UAT


Validate:


```

User Management

Question Management

System Monitoring

```

---

# 28. Test Environment


Environment:


```

Development

Testing

Staging

Production

```

---

# 29. Test Data Management


Data:


```

Dummy User

Dummy Exam

Dummy Question

Simulation Answer

```

---

# 30. Automated Testing Pipeline


CI/CD:


```

Code Commit

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

# 31. Test Reporting


Report:


```

Test Case

Result

Bug

Severity

Resolution

```

---

# 32. Bug Classification


Severity:


## Critical


```

System Down

Data Loss

Wrong Score

```

---

## High


```

Exam Cannot Submit

Timer Failure

```

---

## Medium


```

UI Problem

Minor Workflow Issue

```

---

## Low


```

Cosmetic Issue

```

---

# 33. Regression Testing


Setiap perubahan harus menjalankan:


```

CBT Flow Test

Scoring Test

Security Test

Database Test

```

---

# 34. Production Verification


Setelah deployment:


```

Health Check

Login Test

Create Exam Test

Sample Exam

Monitoring Check

```

---

# 35. Future Enhancement


Support:


```

AI Generated Test Scenario

Chaos Engineering

Synthetic Student Simulation

Automated Proctor Testing

```

---

# 36. Final Testing Architecture


```

```
             Developer


                 |

                 |

            CI Pipeline


                 |

   +-------------+-------------+

   |             |             |

   v             v             v
```

Unit Test   Integration    Security

```
                 |

                 |

          Performance Test


                 |

                 |

                UAT


                 |

                 |

           Production
```

```

---

# 37. Conclusion


Testing Strategy memastikan CBT Runtime YakinLulus.id:

- reliable;
- secure;
- scalable;
- predictable;
- siap digunakan untuk ujian real.


Evolution:


```

Family CBT

```
  |

  v
```

School CBT

```
  |

  v
```

Large Assessment Platform

```
```

