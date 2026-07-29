```markdown id="h4q9vn"
# 12_engineering_implementation_guide/cbt_engine/07_scoring_engine.md

# Scoring Engine Architecture

## 1. Tujuan

Dokumen ini menjelaskan arsitektur **Scoring Engine** pada CBT Engine YakinLulus.id.

Scoring Engine bertanggung jawab melakukan proses:

- membaca jawaban siswa;
- melakukan evaluasi jawaban;
- menghitung nilai;
- menerapkan aturan scoring;
- menghasilkan hasil ujian;
- menyediakan data untuk analytics.


Tujuan utama:


```

Accurate Scoring

*

Fast Processing

*

Consistent Result

*

Audit Capability

*

Extensible Evaluation Rule

```


---

# 2. Konsep Dasar


Scoring Engine memisahkan:

```

Answer Data

```
    |
```

Evaluation Process

```
    |
```

Score Result

```


Jawaban mentah tidak langsung menjadi nilai.


Contoh:


```

Student Answer:

Question 1 = B

Answer Key:

Question 1 = B

Evaluation:

Correct

Score:

2.5

```


---

# 3. Scoring Architecture


```

```
             Exam Submission


                    |

                    |

            Scoring Engine


    +---------------+---------------+

    |               |               |
```

Answer Evaluator   Rule Engine   Score Calculator

```
    |               |               |

    +---------------+---------------+

                    |

                    |

             Result Generator


                    |

                    |

              Analytics System
```

```


---

# 4. Responsibility


Scoring Engine menangani:


```

Answer Evaluation

Correctness Checking

Score Calculation

Weighted Scoring

Passing Criteria

Result Generation

Score History

```


---

# 5. Scoring Lifecycle


```

SUBMITTED

```
|
```

PROCESSING

```
|
```

EVALUATED

```
|
```

CALCULATED

```
|
```

PUBLISHED

```
|
```

ARCHIVED

```


---

# 6. Scoring Flow


```

Exam Submitted

```
    |
```

Create Scoring Job

```
    |
```

Load Student Answers

```
    |
```

Load Answer Key

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

Store Result

```
    |
```

Publish Result

```


---

# 7. Answer Evaluation


Basic evaluation:


```

Student Answer

```
    |
```

Compare

```
    |
```

Answer Key

```
    |
```

Correct / Wrong

```


Example:


Question:


```

2 + 2 = ?

A. 3

B. 4

C. 5

D. 6

```


Student:


```

B

```


Key:


```

B

```


Result:


```

Correct

```


---

# 8. Multiple Choice Scoring


Default:


```

Correct:

*

Score

Wrong:

0

Empty:

0

```


Example:


```

40 Questions

Each Question:

2.5 point

Maximum:

100

```


---

# 9. Weighted Scoring


Beberapa exam membutuhkan bobot.


Contoh:


```

Easy Question:

1 point

Medium:

2 point

Hard:

3 point

```


Formula:


```

Final Score

=

Total Earned Point

/

Maximum Point

x

100

```


---

# 10. Negative Marking Support


Untuk ujian tertentu:


```

Correct:

+4

Wrong:

-1

Empty:

0

```


Formula:


```

Score

=

Correct Point

*

Wrong Penalty

```


---

# 11. Scoring Rule Engine


Scoring tidak hardcode.


Menggunakan konfigurasi:


```

scoring_rules

````


Contoh:


```json
{
 "correct_score":2,
 "wrong_score":0,
 "empty_score":0
}
````

Keuntungan:

* fleksibel;
* dapat digunakan berbagai jenis ujian;
* mudah dikembangkan.

---

# 12. Result Calculation

Input:

```
Total Question

Correct Answer

Wrong Answer

Empty Answer

Scoring Rule

```

Output:

```
Total Score

Percentage

Grade

Status

```

---

# 13. Result Example

Input:

```
Total:

40


Correct:

32


Wrong:

8

```

Calculation:

```
32 / 40 x 100


=

80

```

Result:

```
Score:

80


Status:

PASS

```

---

# 14. Passing Grade System

Exam dapat memiliki:

```
Minimum Score

```

Contoh:

```
Passing Grade:

75


Student Score:

80


Result:

PASS

```

---

# 15. Score Storage

Entity:

```
exam_results

```

Data:

```
id

session_id

student_id

exam_id

total_score

correct_count

wrong_count

empty_count

grade

status

created_at

```

---

# 16. Asynchronous Scoring

Untuk exam besar:

Tidak langsung:

```
Submit

 |

Calculate

 |

Wait

```

Tetapi:

```
Submit


 |

Create Scoring Job


 |

Queue


 |

Worker


 |

Calculate


 |

Save Result

```

---

# 17. Queue Architecture

```
Exam Submission


        |

Message Queue


        |

Scoring Worker


        |

Result Database

```

Contoh:

```
RabbitMQ

Redis Queue

Kafka

```

---

# 18. Result Publishing

Setelah scoring selesai:

Event:

```
ExamScoreCalculated

```

Consumer:

```
Analytics

Ranking

Notification

AI Analysis

```

---

# 19. Ranking Integration

Scoring Engine menghasilkan:

```
Score Event


        |

Ranking Service


        |

Leaderboard Update

```

---

# 20. Analytics Integration

Data yang dikirim:

```
Score

Accuracy

Difficulty Performance

Time Usage

Topic Mastery

```

---

# 21. AI Integration

AI dapat menggunakan:

```
Student Result

+

Question Analysis

+

Learning History

```

Untuk:

* rekomendasi belajar;
* analisa kelemahan;
* personal learning path.

---

# 22. Security Consideration

Protection:

```
Answer Key Protection

Role Based Access

Result Audit

Immutable Score Record

```

---

# 23. Score Modification Policy

Nilai tidak boleh diedit langsung.

Flow:

```
Request Correction


        |

Approval


        |

Create Adjustment Record


        |

Update Result

```

---

# 24. Performance Requirement

Target:

| Operation          | Target    |
| ------------------ | --------- |
| 1 Student Scoring  | <1s       |
| 1000 Student Batch | <1 minute |
| Result Query       | <300ms    |

---

# 25. Testing Strategy

Test:

```
Calculation Accuracy

Boundary Score

Negative Marking

Large Batch Processing

Duplicate Submission

```

---

# 26. Scalability Strategy

## Phase 1

```
Embedded Scoring Module

PostgreSQL

Background Worker

```

---

## Phase 2

```
Dedicated Scoring Worker

Queue Processing

Distributed Calculation

```

---

## Phase 3

```
Scoring Service

Event Streaming

Large Scale Exam Processing

```

---

# 27. Implementation Recommendation

MVP:

```
Go Scoring Module

PostgreSQL Result Storage

Redis Queue

Background Worker

Event Publishing

```

Tidak perlu:

```
Separate Microservice

Complex ML Scoring

```

---

# Summary

Scoring Engine YakinLulus.id menggunakan:

```
Rule Based Evaluation

+

Configurable Scoring

+

Async Processing

+

Immutable Result

+

Analytics Integration

+

AI Ready Data Pipeline

```

Desain ini memungkinkan YakinLulus.id mendukung berbagai jenis ujian mulai dari latihan harian, try out sekolah, sampai simulasi UTBK skala besar.

