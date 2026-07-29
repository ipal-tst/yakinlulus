Berikut **16_scoring_pipeline.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini mendefinisikan bagaimana jawaban peserta diproses menjadi nilai akhir, termasuk raw score, weighting, normalization, grading, dan integrasi analytics.

```markdown id="sp16score"
# 16_scoring_pipeline.md

# YakinLulus.id CBT Scoring Pipeline Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Scoring Pipeline adalah komponen CBT Runtime yang bertanggung jawab mengubah jawaban peserta menjadi hasil ujian.

Tanggung jawab utama:

- mengambil jawaban peserta;
- melakukan validasi jawaban;
- mencocokkan dengan answer key;
- menghitung skor;
- menerapkan bobot;
- menghasilkan nilai akhir;
- menyimpan hasil;
- menyediakan data analytics.

---

# 2. Scoring Principle

Prinsip utama:

```

Answer

↓

Validation

↓

Evaluation

↓

Calculation

↓

Final Score

↓

Analytics

```

---

# 3. Scoring Architecture


```

```
            Student Answer


                  |

                  |

         Answer Processing Engine


                  |

                  |

          Scoring Pipeline


      +-----------+-----------+

      |                       |

      v                       v


Answer Key              Scoring Rule


      |

      |

  Score Result


      |

      |

   Analytics
```

```

---

# 4. Scoring Components

Scoring Pipeline terdiri dari:

```

Answer Evaluator

Score Calculator

Weight Processor

Normalization Engine

Grade Generator

Result Publisher

```

---

# 5. Scoring Lifecycle


```

EXAM_RUNNING

```
  |

  v
```

ANSWER_COLLECTED

```
  |

  v
```

ANSWER_VALIDATED

```
  |

  v
```

ANSWER_EVALUATED

```
  |

  v
```

SCORE_CALCULATED

```
  |

  v
```

RESULT_GENERATED

```
  |

  v
```

PUBLISHED

```

---

# 6. Answer Evaluation


Input:


```

Student Answer

*

Question Answer Key

```


Process:


```

Load Answer

```
  |
```

Compare Answer Key

```
  |
```

Determine Correctness

```
  |
```

Generate Point

```

---

# 7. Multiple Choice Scoring


Default:


Correct:

```

1 point

```


Wrong:

```

0 point

```


Empty:

```

0 point

```

---

Example:


```

Total Question:

100

Correct:

80

Score:

80

```

---

# 8. Negative Marking Support


CBT dapat mendukung:


```

Negative Score

```


Example:


```

Correct:

+4

Wrong:

-1

Empty:

0

```

---

Formula:


```

Final Raw Score

=

Correct Point

*

Wrong Penalty

```

---

# 9. Question Weighting


Tidak semua soal harus memiliki bobot sama.


Example:


```

Easy:

1 point

Medium:

2 point

Hard:

3 point

```

---

Calculation:


```

Score

=

Σ(question_point)

```

---

# 10. Difficulty Based Weighting


Example:


100 Questions:


```

Easy:

30 x 1

Medium:

50 x 2

Hard:

20 x 3

```

---

Maximum:


```

30 + 100 + 60

=

190

```

---

# 11. Topic Weighting


Support:


```

Subject Weight

Chapter Weight

Competency Weight

```

---

Example:


Mathematics:


```

Algebra:

40%

Geometry:

30%

Statistics:

30%

```

---

# 12. Blueprint Based Scoring


Exam Blueprint dapat menentukan:


```

Competency Weight

Difficulty Weight

Topic Weight

```

---

Flow:


```

Blueprint

```
  |
```

Scoring Rule

```
  |
```

Score Calculation

```

---

# 13. Score Calculation Pipeline


Detailed Flow:


```

Collect Answers

```
  |
```

Validate Submission

```
  |
```

Load Question Snapshot

```
  |
```

Load Answer Key

```
  |
```

Evaluate Each Question

```
  |
```

Calculate Raw Score

```
  |
```

Apply Weight

```
  |
```

Normalize Score

```
  |
```

Generate Result

```

---

# 14. Raw Score


Raw score adalah nilai sebelum normalisasi.


Formula:


```

Raw Score

=

Total Obtained Point

/

Maximum Point

```

---

Example:


Obtained:


```

150

```

Maximum:


```

200

```

Result:


```

75%

```

---

# 15. Normalization Engine


Digunakan ketika:


```

Exam Difficulty Different

```


Example:


Exam A:


```

Average 60

```

Exam B:


```

Average 80

```

---

Normalization membuat:

```

Score Comparable

```

---

# 16. Score Scaling


Support:


```

0-100 Scale

0-1000 Scale

Percentile

```

---

Default YakinLulus:


```

0-100

```

---

# 17. Grade Generation


Example:


```

90-100

A

80-89

B

70-79

C

<70

D

```

---

Grade Rule configurable:


```

grading_rule

```

---

# 18. Pass / Fail Evaluation


Rule:


```

Passing Score

```

Example:


```

Minimum:

75

```

---

Result:


```

PASS

FAIL

```

---

# 19. Result Storage


Table:


```

cbt_results

```

---

Fields:


| Field | Description |
|-|-|
| session_id | Exam session |
| raw_score | Original score |
| final_score | Final score |
| grade | Grade |
| percentile | Ranking |
| status | Pass/Fail |
| calculated_at | Timestamp |

---

# 20. Per Question Score


Table:


```

cbt_answer_scores

```

---

Purpose:


```

Detailed Analysis

```

---

Contains:


```

session_id

question_id

is_correct

point

difficulty

topic

```

---

# 21. Real Time Scoring


Support:


```

Practice Mode

Learning Mode

```

---

Flow:


```

Answer Submitted

```
  |
```

Immediate Evaluation

```
  |
```

Update Score

```

---

# 22. Final Exam Scoring


For formal exam:


```

Scoring After Submit

```

---

Flow:


```

Submit Exam

```
  |
```

Lock Session

```
  |
```

Run Scoring Pipeline

```
  |
```

Generate Result

```

---

# 23. Score Recalculation


Support:


```

Recalculate Result

```

Use case:


- answer key correction;
- question invalidation;
- admin adjustment.

---

Process:


```

Create New Calculation Version

Store Previous Result

Audit Change

```

---

# 24. Question Invalid Handling


Example:


Question ditemukan salah.


Action:


```

Invalidate Question

Remove From Calculation

Recalculate Score

```

---

# 25. Score Versioning


Result memiliki:


```

score_version

```

---

Example:


```

Version 1

Initial Result

Version 2

After Correction

```

---

# 26. Integration


Scoring Pipeline terhubung dengan:


```

Answer Processing

Randomization Engine

Question Bank

Analytics Engine

Ranking System

AI Recommendation

```

---

# 27. Performance Requirement


100 Questions:


```

<1 second

```

---

100.000 Participants:


```

Batch Processing

```

---

# 28. Background Processing


Large exam:


gunakan:


```

Worker Queue

```

---

Flow:


```

Submit Exam

```
  |
```

Create Scoring Job

```
  |
```

Worker Process

```
  |
```

Generate Result

```

---

# 29. Monitoring Metrics


Monitor:


```

Scoring Duration

Failed Calculation

Result Generation

Recalculation Count

```

---

# 30. Security Requirement


Scoring Engine harus:


```

Protect Answer Key

Prevent Manipulation

Audit Score Changes

Restrict Access

```

---

# 31. Final Architecture


```

```
          Student Answer


                |

                |

      Answer Processing


                |

                |

        Scoring Pipeline


      +---------+---------+

      |                   |

      v                   v


Answer Key          Scoring Rule


      |

      |

   Final Score


      |

      |

   Analytics
```

```

---

# 32. Conclusion


Scoring Pipeline memastikan:

- nilai dihitung secara akurat;
- aturan scoring fleksibel;
- hasil dapat diaudit;
- mendukung berbagai tipe ujian;
- siap untuk skala besar.


Dengan desain ini CBT Runtime YakinLulus.id dapat mendukung:

```

Latihan

Tryout

School Exam

UTBK Simulation

National Assessment

```
```

---

Progress:

```text
10_cbt_runtime_database_schema/

✅ 00_database_overview.md
✅ 01_schema_design.md
✅ 02_table_specification.md
✅ 03_index_strategy.md
✅ 04_constraint_strategy.md
✅ 05_migration_plan.md
✅ 06_seed_data.md
✅ 07_postgresql_ddl.sql
✅ 08_erdiagram.md
✅ 09_session_management.md
✅ 10_exam_execution_flow.md
✅ 11_answer_sync_strategy.md
✅ 12_offline_mode_architecture.md
✅ 13_timer_engine.md
✅ 14_navigation_engine.md
✅ 15_randomization_engine.md
✅ 16_scoring_pipeline.md

⬜ 17_auto_grading.md
⬜ 18_event_architecture.md
⬜ 19_background_jobs.md
...
```

Berikutnya:

**17_auto_grading.md**.
