```markdown id="m5x8qd"
# 12_engineering_implementation_guide/cbt_engine/04_question_randomization.md

# Question Randomization Engine Architecture

## 1. Tujuan

Dokumen ini menjelaskan arsitektur **Question Randomization Engine** pada CBT Engine YakinLulus.id.

Question Randomization Engine bertanggung jawab menentukan:

- soal yang diberikan kepada setiap peserta;
- urutan soal;
- urutan pilihan jawaban;
- tingkat variasi antar peserta;
- keseimbangan tingkat kesulitan;
- validitas distribusi soal.


Tujuan utama:


```

Fair Exam

*

Reduce Cheating

*

Maintain Difficulty Balance

*

High Performance Runtime

```


---

# 2. Konsep Dasar


Dalam CBT YakinLulus.id, exam tidak langsung menyimpan daftar soal final.

Menggunakan konsep:


```

Question Bank

```
    |
```

Question Pool

```
    |
```

Randomization Engine

```
    |
```

Student Exam Question Set

```


---

# 3. Architecture Overview


```

```
             Exam Configuration


                     |

                     |

             Question Pool Builder


                     |

                     |

          Randomization Engine


    +----------------+----------------+

    |                |                |
```

Question          Difficulty       Ordering

Selection         Balancer         Engine

```
    |

    |
```

Session Question Snapshot

```
    |

    |
```

Student Runtime

```


---

# 4. Problem yang Diselesaikan


Tanpa randomization:


```

Student A

Q1 Q2 Q3 Q4 Q5

Student B

Q1 Q2 Q3 Q4 Q5

```


Risiko:


- mudah berbagi jawaban;
- pola soal sama;
- kebocoran soal.


Dengan randomization:


```

Student A

Q7 Q3 Q15 Q1 Q9

Student B

Q4 Q11 Q2 Q18 Q6

````


---

# 5. Randomization Principle


Randomization tidak boleh menggunakan random sederhana.


Tidak cukup:


```go
random(question)
````

Karena dapat menyebabkan:

* semua soal mudah;
* distribusi tidak seimbang;
* topik tertentu hilang.

---

# 6. Randomization Pipeline

```
Exam Request


      |

Load Question Pool


      |

Apply Filter


      |

Apply Constraint


      |

Select Questions


      |

Shuffle Order


      |

Generate Snapshot


      |

Store Session Questions


```

---

# 7. Question Pool Concept

Question Pool adalah kumpulan kandidat soal.

Contoh:

Exam:

```
UTBK Simulation Mathematics

```

Pool:

```
Total Question:

5000


Requirement:

40 questions

```

Engine mengambil:

```
5000

        |

Filtering

        |

Candidate Pool

        |

40 Selected Questions

```

---

# 8. Question Filtering

Filter berdasarkan:

```
Subject

Grade

Chapter

Difficulty

Question Type

Source

Status

```

Contoh:

```sql
SELECT *

FROM questions

WHERE

subject_id='MAT'

AND difficulty='MEDIUM'

AND status='ACTIVE';

```

---

# 9. Difficulty Distribution

Exam harus memiliki blueprint.

Contoh:

```
Total Question: 40


Easy:

30%


Medium:

50%


Hard:

20%

```

Calculation:

```
40 x 30%

= 12 Easy


40 x 50%

= 20 Medium


40 x 20%

= 8 Hard

```

---

# 10. Blueprint Based Randomization

Architecture:

```
Exam Blueprint


        |

Difficulty Rule


        |

Topic Distribution


        |

Random Selection


```

Contoh:

```
Algebra

10 Questions


Geometry

10 Questions


Calculus

20 Questions

```

---

# 11. Selection Algorithm

Basic algorithm:

```
Input:

Question Pool

Exam Blueprint


Process:

1. Filter Candidate

2. Group By Category

3. Select Random Item

4. Validate Constraint

5. Generate Result


Output:

Question Set

```

---

# 12. Random Selection Strategy

MVP:

Menggunakan:

```
Random Sampling

+

Seed

```

Contoh:

```
Exam ID

+

Student ID

+

Timestamp


=

Random Seed

```

Keuntungan:

* reproducible;
* audit friendly.

---

# 13. Question Ordering

Setelah soal dipilih:

```
Selected Questions


        |

Shuffle


        |

Session Question Order


```

Contoh:

Original:

```
1
2
3
4
5

```

Student:

```
3
5
1
4
2

```

---

# 14. Answer Option Randomization

Pilihan jawaban juga dapat diacak.

Original:

```
A. Jakarta

B. Bandung

C. Surabaya

D. Medan

```

Student:

```
A. Medan

B. Jakarta

C. Surabaya

D. Bandung

```

Mapping harus disimpan.

Contoh:

```
original_answer = B


display_position = D

```

---

# 15. Snapshot Strategy

Setelah randomization:

System membuat snapshot:

```
session_questions


```

Berisi:

```
session_id

question_id

order_number

answer_mapping

```

Tujuan:

* soal tidak berubah saat ujian;
* audit mudah;
* scoring konsisten.

---

# 16. Database Design

Table:

```
exam_session_questions

```

Contoh:

```
id

session_id

question_id

sequence_number

option_mapping

created_at

```

---

# 17. Randomization Timing

Ada dua pendekatan.

## Generate Before Exam

```
Student Start


        |

Generate Question Set


        |

Start Exam

```

Kelebihan:

* predictable;
* cepat runtime.

---

## Generate During Runtime

```
Request Question


        |

Generate Random

```

Kekurangan:

* latency;
* sulit audit.

Rekomendasi YakinLulus:

```
Generate Before Exam

```

---

# 18. Performance Strategy

Untuk exam besar:

Gunakan:

```
Pre Generate Session


+

Redis Cache


+

Batch Processing

```

---

# 19. Anti Cheating Strategy

Randomization membantu:

```
Different Question Order

Different Option Order

Different Question Set

```

Tetapi bukan satu-satunya mekanisme.

Tambahan:

```
Timer Control

Audit Log

Device Tracking

Behavior Analysis

```

---

# 20. Failure Handling

Jika randomization gagal:

```
Randomization Error


        |

Retry


        |

Fallback Strategy


        |

Log Error

```

Fallback:

```
Use Predefined Question Set

```

---

# 21. Event Integration

Event:

```
QuestionSetGenerated

QuestionRandomized

QuestionSnapshotCreated

```

Digunakan oleh:

* analytics;
* audit;
* monitoring.

---

# 22. Scalability Strategy

## Phase 1

```
Generate On Demand

PostgreSQL

Redis Cache

```

---

## Phase 2

```
Background Question Generation

Queue Worker

Pre Generated Session

```

---

## Phase 3

```
Dedicated Randomization Service

Distributed Processing

```

---

# 23. Testing Requirement

Test:

```
Distribution Accuracy

Randomness Quality

Performance

Reproducibility

Edge Case

```

---

# 24. Acceptance Criteria

Engine dianggap selesai jika:

```
✅ Different Student Gets Different Set

✅ Difficulty Distribution Correct

✅ Question Snapshot Stored

✅ Answer Mapping Valid

✅ Randomization Reproducible

✅ Performance Stable

```

---

# Summary

Question Randomization Engine YakinLulus.id menggunakan:

```
Blueprint Based Selection

+

Controlled Random Sampling

+

Question Snapshot

+

Difficulty Balancing

+

Audit Friendly Design

```

Desain ini memungkinkan sistem CBT menghasilkan ujian yang adil, aman, dan scalable dari skala sekolah sampai platform nasional.
