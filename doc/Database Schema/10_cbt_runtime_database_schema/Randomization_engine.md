Berikut revisi penuh **15_randomization_engine.md** dengan arsitektur **Question Pool + Two Stage Randomization**.

Dokumen ini menggantikan versi sebelumnya.

```markdown
# 15_randomization_engine.md

# YakinLulus.id CBT Randomization Engine Specification

Module : CBT Runtime Database Schema  
Version : 1.1  
Status : Design Specification

---

# 1. Overview

Randomization Engine adalah komponen CBT Runtime yang bertanggung jawab menghasilkan variasi ujian untuk setiap peserta berdasarkan:

- Question Pool;
- Exam Blueprint;
- Difficulty Distribution;
- Topic Distribution;
- Random Seed;
- Student Session.

Tujuan utama:

- setiap peserta mendapatkan soal berbeda;
- tingkat kesulitan tetap terkontrol;
- cakupan materi tetap sama;
- ujian dapat diaudit;
- mencegah pola cheating.

---

# 2. Randomization Architecture Principle

YakinLulus.id menggunakan:

```

Two Stage Randomization Architecture

```

Terdiri dari:

```

Stage 1:
Exam Pool Generation

Stage 2:
Student Question Randomization

```

---

# 3. High Level Architecture


```

```
             Question Bank


                  |

                  |

          Exam Blueprint


                  |

                  |

      Question Pool Generator


                  |

                  |

         Exam Question Pool


                  |

                  |

    Student Randomization Engine


                  |

                  |

    Student Question Snapshot


                  |

                  |

          CBT Runtime
```

```

---

# 4. Why Question Pool Architecture

Random langsung dari seluruh bank soal memiliki risiko:

```

Tidak seimbang

Distribusi sulit dikontrol

Materi tidak merata

Kesulitan tidak konsisten

```

---

Dengan Question Pool:

```

Admin menentukan kualitas pool

Random hanya memilih variasi

```

---

# 5. Example Scenario


Exam:

```

UTBK Matematika Dasar

```

Target:

```

Jumlah soal:
30

```

---

Admin membuat pool:

```

Total Pool:
100 soal

```

Komposisi:


```

Easy:

30 soal

Medium:

50 soal

Hard:

20 soal

```

---

Setiap siswa mengambil:

```

30 soal

dari pool 100 soal

```

---

# 6. Randomization Stage 1

# Question Pool Generation


Dilakukan saat:

```

Exam Creation

```

---

Input:


```

Question Bank

*

Exam Blueprint

*

Difficulty Rule

*

Topic Rule

```

---

Output:


```

Exam Question Pool

```

---

# 7. Exam Blueprint


Blueprint menentukan:

```

Subject

Grade

Chapter

Competency

Difficulty Distribution

Question Count

```

---

Example:


```

Mathematics SMA

Total:

30 questions

Difficulty:

Easy 30%

Medium 50%

Hard 20%

```

---

# 8. Pool Generation Flow


```

Create Exam

```
  |
```

Define Blueprint

```
  |
```

Filter Question Bank

```
  |
```

Validate Question Quality

```
  |
```

Select Pool Questions

```
  |
```

Save Exam Pool

```

---

# 9. Question Pool Entity


Table:

```

exam_question_pool

```

---

Purpose:

Menyimpan kumpulan soal yang tersedia untuk ujian.

---

Fields:


| Field | Description |
|-|-|
| id | Pool ID |
| exam_id | Exam reference |
| pool_size | Total pool question |
| status | Draft/Active |
| created_by | Creator |
| created_at | Timestamp |

---

# 10. Question Pool Detail


Table:

```

exam_question_pool_items

```

---

Fields:


| Field | Description |
|-|-|
| pool_id | Pool reference |
| question_id | Question reference |
| difficulty | Difficulty level |
| topic_id | Topic |
| weight | Selection weight |
| created_at | Timestamp |

---

# 11. Randomization Stage 2

# Student Question Selection


Dilakukan ketika:


```

Student Start Exam

```

---

Input:


```

Exam Pool

*

Student Session

*

Random Seed

*

Exam Rule

```

---

Output:


```

Student Question Snapshot

```

---

# 12. Student Randomization Example


Pool:

```

100 Questions

```

---

Student A:

```

30 Questions

Q1
Q8
Q15
Q40
Q77

...

```

---

Student B:

```

30 Questions

Q3
Q10
Q21
Q55
Q90

...

```

---

Tetap:


```

Same Pool

Same Difficulty

Different Questions

```

---

# 13. Difficulty Distribution


Example:

Exam:

```

30 Questions

```

Rule:


```

Easy:

10

Medium:

15

Hard:

5

```

---

Engine memastikan:


```

Student A:

10 Easy
15 Medium
5 Hard

Student B:

10 Easy
15 Medium
5 Hard

```

---

# 14. Topic Distribution


Contoh:


```

Algebra:

40%

Geometry:

30%

Statistics:

30%

```

---

Randomization tetap mengikuti:


```

Topic Coverage

```

---

# 15. Random Seed Management


Setiap proses random menggunakan:


```

random_seed

```

---

Tujuan:


```

Reproducibility

Audit

Debugging

```

---

Contoh:


```

Seed:

827361928

```

---

Seed yang sama menghasilkan:


```

Question Selection Sama

```

---

# 16. Student Question Snapshot


Table:


```

cbt_session_questions

```

---

Berisi:


```

session_id

question_id

sequence_number

pool_id

option_mapping

created_at

```

---

Snapshot bersifat:


```

Immutable

```

---

Setelah ujian dimulai:

```

Tidak boleh berubah

```

---

# 17. Question Ordering Randomization


Selain pemilihan soal:


```

Question Order

```

juga diacak.


Example:


Original:


```

Q1
Q2
Q3

```


Student:


```

Q55

Q10

Q2

```

---

# 18. Option Randomization


Pilihan jawaban juga dapat diacak.


Original:


```

A Jakarta

B Bandung

C Surabaya

D Medan

```

---

Student:


```

A Medan

B Jakarta

C Surabaya

D Bandung

```

---

Mapping disimpan:


```

option_mapping

```

---

# 19. Answer Mapping


Karena opsi berubah:

Engine harus menyimpan:


```

Original Answer

*

Displayed Answer

```

---

Example:


Database:


```

Correct Option:

A

```

---

Display:


```

B

```

---

System tetap mengetahui:


```

B = Correct

```

---

# 20. Duplicate Prevention


Validation:


```

Question ID Unique

```

---

Before snapshot:


```

COUNT(question_id)

=

COUNT(DISTINCT question_id)

```

---

# 21. Pool Quality Validation


Sebelum pool aktif:


Check:


```

Question Status

Difficulty Distribution

Topic Coverage

Duplicate

Missing Explanation

```

---

# 22. Pool Lifecycle


```

DRAFT

|

v

GENERATED

|

v

REVIEWED

|

v

ACTIVE

|

v

ARCHIVED

```

---

# 23. Randomization Security


Protection:


```

Seed Protection

Snapshot Lock

Pool Access Control

```

---

Student tidak boleh mengetahui:


```

Pool Size

Available Questions

Random Algorithm

```

---

# 24. Integration


Randomization Engine terhubung:


```

Question Bank

Exam Management

Session Engine

Navigation Engine

Answer Processing

Scoring Pipeline

Analytics

Audit System

```

---

# 25. Database Relationship


```

question_bank

```
  |

  |
```

exam_question_pool_items

```
  |

  |
```

exam_question_pool

```
  |

  |
```

cbt_session_questions

```
  |

  |
```

cbt_session

```

---

# 26. Performance Requirement


Pool Generation:


```

< 5 seconds

```

---

Student Snapshot:


```

< 2 seconds

```

---

Question Load:


```

< 100 ms

```

---

# 27. Monitoring Metrics


Monitor:


```

Pool Generation Time

Pool Size

Selection Success Rate

Difficulty Accuracy

Duplicate Rate

Snapshot Creation Time

```

---

# 28. Future Enhancement


Support:


```

Adaptive Testing

AI Question Recommendation

IRT Calibration

Personalized Difficulty

Knowledge Graph Based Selection

```

---

# 29. Final Architecture


```

```
                Question Bank


                     |

                     |

             Pool Generator


                     |

                     |

            Exam Question Pool


                     |

                     |

      Student Randomization Engine


                     |

                     |

      Student Question Snapshot


                     |

                     |

                CBT Engine


                     |

                     |

            Scoring Pipeline
```

```

---

# 30. Conclusion


Question Pool based Randomization memberikan:

- ujian lebih adil;
- variasi soal antar siswa;
- kontrol tingkat kesulitan;
- distribusi materi konsisten;
- audit yang mudah;
- scalable untuk ujian besar.


Arsitektur ini memungkinkan YakinLulus.id berkembang dari:

```

Family MVP

```
    |

    v
```

School CBT

```
    |

    v
```

National Assessment Platform

```
```

---

Dengan revisi ini, **15_randomization_engine.md sudah selaras dengan visi awal YakinLulus.id**:

```text
Question Bank
      |
      |
AI Generated Questions
      |
      |
Curated Exam Pool
      |
      |
Randomized CBT Exam
      |
      |
Analytics & Learning Intelligence
```

Berikutnya lanjut ke:

**16_scoring_pipeline.md**.
