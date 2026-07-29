```markdown id="r8c2mw"
# 12_engineering_implementation_guide/question_bank/05_question_validation.md

# Question Validation Architecture

## 1. Tujuan

Dokumen ini menjelaskan arsitektur **Question Validation Engine** pada Question Bank YakinLulus.id.

Question Validation Engine bertugas memastikan setiap soal yang masuk ke sistem memenuhi standar:

- kualitas konten;
- kelengkapan data;
- validitas akademik;
- konsistensi struktur;
- kesiapan digunakan pada CBT Engine.


Tujuan utama:


```

High Quality Question Dataset

*

Prevent Invalid Question

*

Improve Exam Reliability

*

Maintain Academic Standard

```id="8xkqf1"

---

# 2. Validation Architecture


```

```
          Question Input


               |

               |

      Validation Pipeline


    +----------+----------+

    |                     |
```

Structural Validation   Academic Validation

```
    |                     |

    +----------+----------+

               |

      Quality Validation


               |

      Duplicate Detection


               |

      Validation Result


               |

      Question Repository
```

```id="1r9m3v"

---

# 3. Validation Layer


Question validation dibagi menjadi:


```

1. Schema Validation

2. Content Validation

3. Academic Validation

4. Business Rule Validation

5. Quality Validation

6. AI Validation

```id="z4m8hs"

---

# 4. Schema Validation


Memastikan struktur data benar.


Validasi:


```

Required Field

Data Type

Format

Reference ID

Enum Value

````id="4p8r3s"


Contoh:


Invalid:


```json
{
 "difficulty": "unknown"
}
````

Result:

```
FAILED

Invalid Difficulty Value

```

---

# 5. Required Field Validation

Field wajib:

````
Question Text

Question Type

Answer Key

Subject

Difficulty

Explanation

``` id="p6q9tw"


Jika kosong:


````

Question Status:

INVALID

```id="c5g2kz"

---

# 6. Content Validation


Memeriksa isi soal.


Rule:


```

Minimum Character Length

Maximum Length

Forbidden Content

Empty Content

Formatting Error

```id="v9t1rm"


Contoh:


```

Question:

"A?"

Result:

Warning

Question Too Short

```id="h3k7wd"

---

# 7. Option Validation


Untuk multiple choice:


Rule:


```

Minimum Options >= 2

Maximum Options <= 5

Unique Options

Correct Answer Exists

Only One Correct Answer

```id="z6k2mf"


Example:


```

A. Jakarta

B. Jakarta

C. Bandung

D. Surabaya

```


Result:


```

FAILED

Duplicate Option

```id="y0m4pv"

---

# 8. Answer Key Validation


Validation:


```

Answer Exists

Answer Match Option

Answer Format Correct

```id="q1v7na"


Example:


Question:


```

Options:

A

B

C

D

```


Answer:


```

E

```


Result:


```

INVALID

```id="h8f0pk"

---

# 9. Academic Validation


Memastikan soal sesuai kurikulum.


Check:


```

Education Level

Grade

Subject

Chapter

Topic

Curriculum Mapping

```id="m2c8zx"


Example:


```

Grade:

10

Subject:

Physics

Chapter:

Thermodynamic

```id="q7w4kc"

---

# 10. Difficulty Validation


Difficulty harus konsisten.


Level:


```

EASY

MEDIUM

HARD

```id="n4z5bx"


AI dapat membantu:


```

Analyze Question Complexity

Estimate Difficulty

Compare Historical Performance

```id="g8m2rq"

---

# 11. Duplicate Detection Validation


Tujuan:


Menghindari:


```

Same Question

Similar Question

Repeated Dataset

```id="s5w9pk"


Pipeline:


```

Question Text

|

Normalization

|

Hash Generation

|

Similarity Search

|

Duplicate Score

```id="k2d8mw"

---

# 12. Similarity Detection


Metode:


## Basic


```

Text Hash

Keyword Matching

```


## Advanced


```

Embedding Vector

Semantic Similarity

Vector Database

```id="z7p1cv"

---

# 13. Quality Validation


Menilai kualitas soal.


Parameter:


```

Question Clarity

Difficulty Accuracy

Explanation Quality

Distractor Quality

Curriculum Relevance

```id="w4m9sq"

---

# 14. Explanation Validation


Pembahasan harus:


```

Exists

Relevant

Correct

Understandable

```id="d8q2mx"


Check:


```

Answer Explanation

=

Correct Answer Reason

```id="a3v7nk"

---

# 15. Distractor Validation


Pilihan salah harus:


```

Plausible

Different

Not Ambiguous

```id="t5y8qp"


Contoh buruk:


```

A. 2

B. Dua

C. 02

D. 20

```


Karena:


```

Multiple Interpretation

```id="r9m3vf"

---

# 16. AI Assisted Validation


AI digunakan untuk:


```

Grammar Checking

Difficulty Estimation

Duplicate Detection

Explanation Review

Content Improvement

```id="x5k7pd"


AI result:


```

confidence_score

```


---

# 17. Validation Result Model


Entity:


```

question_validation_results

```id="v8n2qm"


Field:


```

id

question_id

validation_type

status

message

score

created_at

```id="c3w6zt"

---

# 18. Validation Status


State:


```

PENDING

|

PROCESSING

|

PASSED

|

WARNING

|

FAILED

```id="m7q4zx"

---

# 19. Validation Flow


```

Question Created

```
    |
```

Run Validator

```
    |
```

Collect Result

```
    |
```

Generate Report

```
    |
```

Update Status

```
    |
```

Publish Decision

```id="q8v5mc"

---

# 20. Manual Review Integration


Jika:


```

AI Confidence Low

Duplicate Suspected

Academic Conflict

```


Maka:


```

Send To Reviewer

```id="n3x7wp"

---

# 21. Validation Rules Engine


Rule tidak hardcode.


Menggunakan:


```

validation_rules

````id="u6p2yk"


Example:


```json
{
 "rule":"minimum_options",
 "value":4,
 "enabled":true
}
````

---

# 22. Validation API

Run Validation:

````
POST

/api/v1/questions/{id}/validate

``` id="e5n8rx"


Response:


```json
{
 "status":"PASSED",
 "errors":[],
 "warnings":[]
}
````

---

# 23. Automated Validation Pipeline

Saat import:

```
Import Question


        |

Automatic Validation


        |

Pass


        |

Save


```

atau:

````
Fail


 |

Reject

``` id="x9k3mf"

---

# 24. Performance Requirement


Target:


| Operation | Target |
|-|-|
| Single Validation | <500ms |
| Batch Validation 10K | <5 minutes |
| Duplicate Check | <1 second |

---

# 25. Testing Strategy


Test:


````

Missing Field

Wrong Answer Key

Duplicate Question

Invalid Curriculum

Bad Formatting

AI Validation Error

```id="p2y7mq"

---

# 26. Implementation Recommendation


Backend:


```

Validation Service

Rule Engine

AI Validation Worker

Embedding Service

PostgreSQL

Vector Database

```id="k8w4nz"


Technology:


```

Go Service

PostgreSQL

pgvector

Redis Worker

```id="y6t2px"

---

# 27. Future Enhancement


Support:


```

Automatic Question Rating

IRT Parameter Validation

Human Review Workflow

AI Quality Scoring

Adaptive Difficulty Calibration

```id="m4q8sv"

---

# Summary


Question Validation Engine YakinLulus.id:


```

Structural Validation

*

Academic Validation

*

Quality Control

*

Duplicate Detection

*

AI Assisted Review

*

Audit Trail

```


Dengan validation engine ini, Question Bank dapat menjadi sumber soal berkualitas tinggi untuk CBT, latihan, analytics, dan AI Tutor.
```
