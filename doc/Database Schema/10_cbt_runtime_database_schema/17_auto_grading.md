Berikut **17_auto_grading.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini menjelaskan sistem penilaian otomatis CBT, termasuk multiple choice, future support untuk essay, AI grading, validation, dan integrasi scoring pipeline.

```markdown id="ag17auto"
# 17_auto_grading.md

# YakinLulus.id CBT Auto Grading Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Auto Grading Engine adalah komponen yang melakukan evaluasi jawaban peserta secara otomatis.

Tujuan:

- menghitung benar/salah secara otomatis;
- mengurangi human error;
- mempercepat hasil ujian;
- mendukung berbagai tipe soal;
- menyediakan feedback pembelajaran.

---

# 2. Auto Grading Principle

Prinsip utama:


```

Student Answer

↓

Answer Evaluation

↓

Score Generation

↓

Result Update

```


---

# 3. Auto Grading Architecture


```

```
          Student Answer


                |

                |

         Auto Grading Engine


    +-----------+-----------+

    |                       |

    v                       v


Answer Key            Grading Rule


    |

    |

Evaluation Result


    |

    |

Scoring Pipeline
```

```


---

# 4. Supported Question Types


## Phase 1 (MVP)


Support:


```

Multiple Choice Single Answer

```


---

## Phase 2


Support:


```

Multiple Choice Multiple Answer

True / False

Matching

Numeric Answer

```


---

## Phase 3


Support:


```

Essay

Short Answer

AI Evaluation

```


---

# 5. Auto Grading Lifecycle


```

ANSWER_SUBMITTED

```
    |

    v
```

LOAD QUESTION SNAPSHOT

```
    |

    v
```

LOAD ANSWER KEY

```
    |

    v
```

EVALUATE ANSWER

```
    |

    v
```

GENERATE SCORE

```
    |

    v
```

SEND RESULT

```


---

# 6. Multiple Choice Grading


Input:


```

Student Selected Option

*

Correct Option

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


Answer Key:


```

B

```


Student:


```

B

```


Result:


```

CORRECT

Point:

1

```


---

# 7. Option Mapping Handling


Karena option dapat diacak oleh Randomization Engine:


Original:


```

Correct:

B

```


Displayed:


```

A = D

B = A

C = C

D = B

```


Auto Grading menggunakan:


```

Option Mapping

```


untuk mendapatkan jawaban sebenarnya.


---

# 8. Grading Rule


Entity:


```

grading_rules

````


Contoh:


```json
{
"correct_point":1,
"wrong_point":0,
"empty_point":0
}
````

---

# 9. Correct Answer Evaluation

Logic:

```
IF student_answer
=
correct_answer

THEN

correct


ELSE

wrong

```

---

# 10. Empty Answer Handling

Jika peserta tidak menjawab:

Status:

```
UNANSWERED

```

Default:

```
Point = 0

```

---

# 11. Negative Marking

Support:

Example:

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

+

Wrong Penalty

```

---

# 12. Difficulty Based Scoring

Integrasi dengan Question Metadata.

Example:

```
Easy:

1 point


Medium:

2 point


Hard:

3 point

```

Auto Grading mengambil:

```
Question Difficulty

+

Scoring Rule

```

---

# 13. Batch Auto Grading

Untuk ujian besar:

```
100.000 peserta

```

Tidak dilakukan:

```
Synchronous Request

```

Tetapi:

```
Background Worker

```

Flow:

```
Exam Submitted

        |

Create Grading Job

        |

Worker Execute

        |

Generate Result

        |

Publish Result


```

---

# 14. Real Time Auto Grading

Digunakan untuk:

```
Practice Mode

Learning Mode

Tryout

```

Flow:

```
Answer Submitted

        |

Immediate Evaluation

        |

Show Explanation


```

---

# 15. Explanation Integration

Setelah grading:

System dapat memberikan:

```
Correct Answer

Explanation

Learning Material

Related Topic

```

Example:

```
Jawaban:

B


Pembahasan:

...

Materi:

Aljabar Dasar

```

---

# 16. Question Validation

Sebelum grading:

System memastikan:

```
Question Active

Answer Key Exists

Question Snapshot Valid

```

---

# 17. Invalid Question Handling

Scenario:

Jawaban ditemukan salah.

Action:

```
Mark Question Invalid

Notify Admin

Recalculate Score

Create Audit Event

```

---

# 18. Essay Auto Grading (Future)

Untuk essay:

Input:

```
Student Text Answer

```

Evaluation:

```
Keyword Matching

Semantic Similarity

AI Evaluation

Human Review

```

---

# 19. AI Grading Architecture

Future:

```
Student Answer

        |

        |

AI Grader

        |

        +-------------+

        |             |

        v             v


Similarity       Rubric Evaluation


        |

        |

Score Recommendation


```

---

# 20. AI Grading Safety

AI tidak langsung menentukan:

```
Final Score

```

Tetapi:

```
Recommendation Score

+

Confidence Level

```

Human override tetap tersedia.

---

# 21. Auto Grading Result Storage

Table:

```
cbt_answer_evaluation

```

Fields:

| Field             | Description    |
| ----------------- | -------------- |
| session_id        | Exam session   |
| question_id       | Question       |
| answer_id         | Student answer |
| evaluation_status | Correct/Wrong  |
| earned_point      | Score          |
| graded_at         | Timestamp      |

---

# 22. Grading Status

State:

```
PENDING

PROCESSING

COMPLETED

FAILED

RECALCULATED

```

---

# 23. Retry Mechanism

Jika gagal:

```
Retry Job

Maximum Retry

Error Logging

```

---

# 24. Integration

Auto Grading terhubung dengan:

```
Answer Processing

Randomization Engine

Scoring Pipeline

Question Bank

Analytics

AI System

```

---

# 25. Performance Requirement

Single Answer:

```
<50ms

```

100 Questions:

```
<1 second

```

Large Exam:

```
Async Processing

```

---

# 26. Monitoring Metrics

Monitor:

```
Grading Success Rate

Average Processing Time

Failed Evaluation

Recalculation Count

AI Confidence Score

```

---

# 27. Security Requirement

Auto Grading harus:

```
Protect Answer Key

Prevent Score Manipulation

Audit Changes

Restrict Access

```

---

# 28. Final Architecture

```

              Student Answer


                    |

                    |

             Auto Grading Engine


                    |

        +-----------+-----------+

        |                       |

        v                       v


    Answer Key            Grading Rule


        |

        |

    Evaluation Result


        |

        |

    Scoring Pipeline


        |

        |

      Analytics


```

---

# 29. Conclusion

Auto Grading Engine memberikan:

* penilaian cepat;
* hasil akurat;
* scalable untuk ujian besar;
* mendukung pembelajaran;
* siap untuk AI grading.

Dengan desain ini YakinLulus.id dapat mendukung:

```
Practice

Tryout

School Exam

UTBK Simulation

AI Assisted Assessment
