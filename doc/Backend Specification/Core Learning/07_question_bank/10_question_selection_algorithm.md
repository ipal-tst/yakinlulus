Saya juga menyarankan **10_question_selection_algorithm.md** dipisahkan dari **09_question_randomization.md**.

Perbedaannya adalah:

* **09_question_randomization.md** → menjelaskan *bagaimana soal diacak*.
* **10_question_selection_algorithm.md** → menjelaskan *bagaimana sistem memilih kandidat soal terbaik* sebelum proses randomisasi.

Ini merupakan pola yang digunakan pada engine CBT skala enterprise.

---

````markdown
# 10_question_selection_algorithm.md

# Question Selection Algorithm

Version : 1.0

---

# 1. Overview

Question Selection Algorithm bertanggung jawab memilih kumpulan soal terbaik
dari Question Bank sebelum proses randomisasi dilakukan.

Selection Engine memastikan:

- soal sesuai blueprint
- distribusi seimbang
- kualitas tinggi
- tidak duplikat
- tidak bias
- sesuai histori peserta
- siap untuk CBT

Selection dilakukan sebelum Randomization Engine.

---

# 2. High Level Flow

```
Exam Blueprint
        │
        ▼
Candidate Query
        │
        ▼
Eligibility Filter
        │
        ▼
Business Rule Filter
        │
        ▼
Quality Filter
        │
        ▼
Similarity Filter
        │
        ▼
Exposure Filter
        │
        ▼
Student History Filter
        │
        ▼
Weighted Selection
        │
        ▼
Selection Result
        │
        ▼
Randomization Engine
```

---

# 3. Selection Principles

Selection Engine harus memenuhi prinsip berikut.

- Fair
- Deterministic
- Explainable
- High Performance
- Extensible
- AI Ready
- Blueprint Driven

---

# 4. Candidate Pool

Selection dimulai dengan mengambil Candidate Pool.

Candidate Pool adalah seluruh Question yang memenuhi filter dasar.

Contoh

```
Subject

↓

Matematika

↓

Grade XII

↓

Published

↓

Question Pool
```

---

# 5. Eligibility Filter

Question harus memenuhi syarat berikut.

✓ Published

✓ Active

✓ Review Approved

✓ Metadata Complete

✓ Not Archived

✓ Not Suspended

✓ Current Version

---

# 6. Blueprint Matching

Question harus sesuai Blueprint.

Blueprint dapat menentukan:

- Subject
- Chapter
- Subchapter
- Difficulty
- Bloom Level
- HOTS
- Question Type
- Quantity

Contoh

| Subject | Chapter | Difficulty | Qty |
|----------|----------|------------|-----|
| Matematika | Integral | Easy | 5 |
| Matematika | Integral | Medium | 8 |
| Matematika | Integral | Hard | 7 |

---

# 7. Metadata Matching

Question dibandingkan dengan filter berikut.

- Curriculum
- Education Level
- Grade
- Semester
- Subject
- Chapter
- Topic
- Difficulty
- Bloom
- HOTS
- Language
- Tags

Question yang tidak sesuai dieliminasi.

---

# 8. Quality Filter

Question memiliki Quality Score.

Contoh faktor:

- Review Score
- Validation Score
- Error Rate
- Report Count
- Completeness
- AI Confidence

Question di bawah ambang batas tidak dipilih.

---

# 9. Similarity Filter

Question dengan tingkat kemiripan tinggi tidak dipilih bersamaan.

Contoh

```
Question A

Similarity

96%

Question B

↓

Pilih Salah Satu
```

Menggunakan pgvector.

---

# 10. Exposure Filter

Question yang terlalu sering muncul
akan memiliki prioritas lebih rendah.

Contoh

| Usage | Priority |
|---------|----------|
| 5 | High |
| 200 | Low |

---

# 11. Student History Filter

Question dapat difilter berdasarkan histori peserta.

Mode:

Never Repeat

Repeat After X Days

Wrong Answer Only

Allow Repeat

---

# 12. Cooldown Filter

Question yang baru digunakan
tidak langsung digunakan kembali.

Contoh

```
Last Used

↓

14 Hari

↓

Eligible
```

---

# 13. Weighted Score

Selection menggunakan skor.

Contoh

```
Final Score

=

Quality Score

+

Freshness Score

+

AI Confidence

-

Exposure Score

-

Similarity Penalty
```

Semakin tinggi nilai akhir,
semakin besar peluang dipilih.

---

# 14. Selection Priority

Prioritas seleksi.

1.

Blueprint Match

↓

2.

Quality

↓

3.

Difficulty Balance

↓

4.

Exposure

↓

5.

Student History

↓

6.

Similarity

↓

7.

Weighted Score

---

# 15. Difficulty Balancing

Selection memastikan distribusi sesuai target.

Misal

```
40 Question

↓

12 Easy

↓

16 Medium

↓

12 Hard
```

---

# 16. Bloom Distribution

Selection menjaga proporsi Bloom.

Contoh

| Bloom | Qty |
|---------|-----|
| C1 | 5 |
| C2 | 8 |
| C3 | 10 |
| C4 | 9 |
| C5 | 5 |
| C6 | 3 |

---

# 17. Topic Balancing

Tidak boleh seluruh soal berasal dari satu topik.

Contoh

```
Integral

↓

8

Turunan

↓

6

Limit

↓

6
```

---

# 18. Adaptive Selection (Future)

Future CAT.

Selection mempertimbangkan:

- kemampuan siswa
- histori
- probabilitas benar
- target difficulty

---

# 19. AI Assisted Selection

AI dapat membantu.

Contoh

- mendeteksi bias
- mendeteksi soal usang
- memilih soal representatif
- memprediksi kualitas

AI hanya memberi rekomendasi.

---

# 20. Selection Output

Output berupa daftar Question Version.

```
Question

↓

Version

↓

Order

↓

Metadata

↓

Score
```

Randomization Engine menggunakan hasil ini.

---

# 21. Failure Strategy

Jika pool tidak cukup.

Strategi:

- gunakan fallback blueprint
- longgarkan difficulty
- longgarkan bloom
- gunakan chapter terdekat

Seluruh fallback dicatat.

---

# 22. Performance

Target.

Candidate Query

< 200 ms

Selection

< 300 ms

100 Question

< 500 ms

---

# 23. Database Objects

Selection menggunakan:

```
question

question_version

question_metadata

question_statistics

question_usage

question_similarity

student_question_history

exam_blueprint

exam_blueprint_detail
```

---

# 24. Domain Events

```
CandidatePoolLoaded

BlueprintMatched

QuestionFiltered

QuestionSelected

SelectionCompleted

SelectionFailed
```

---

# 25. Logging

Selection mencatat.

- Blueprint
- Candidate Count
- Selected Count
- Filter Result
- Execution Time
- Random Seed
- Fallback Rule

---

# 26. Future Algorithm

Roadmap.

- Constraint Satisfaction Solver
- Genetic Algorithm
- Simulated Annealing
- Integer Programming
- Shadow Test Assembly
- Computerized Adaptive Testing
- Item Response Theory
- Reinforcement Learning
- AI Selection Optimizer
````

---

# Rekomendasi Arsitektur

Saya menyarankan Selection Engine dibangun sebagai **pipeline bertingkat**, bukan satu fungsi besar.

```text
Exam Request
      │
      ▼
Blueprint Service
      │
      ▼
Candidate Loader
      │
      ▼
Eligibility Filter
      │
      ▼
Metadata Filter
      │
      ▼
Quality Filter
      │
      ▼
Similarity Filter
      │
      ▼
Exposure Filter
      │
      ▼
Weighted Scoring
      │
      ▼
Selection Result
      │
      ▼
Randomization Engine
      │
      ▼
CBT Runtime
```

### Struktur package Go yang disarankan

```text
internal/questionbank/
    selection/
        blueprint_selector.go
        eligibility_filter.go
        metadata_filter.go
        quality_filter.go
        similarity_filter.go
        exposure_filter.go
        history_filter.go
        weighted_selector.go
        fallback_strategy.go
        pipeline.go
```

Pendekatan ini menjaga setiap algoritma tetap **single responsibility**, mudah diuji (unit test), mudah diganti, dan memungkinkan penambahan algoritma baru (misalnya IRT atau CAT) tanpa mengubah keseluruhan Selection Engine.
Saya juga menyarankan **10_question_selection_algorithm.md** dipisahkan dari **09_question_randomization.md**.

Perbedaannya adalah:

* **09_question_randomization.md** → menjelaskan *bagaimana soal diacak*.
* **10_question_selection_algorithm.md** → menjelaskan *bagaimana sistem memilih kandidat soal terbaik* sebelum proses randomisasi.

Ini merupakan pola yang digunakan pada engine CBT skala enterprise.

---

````markdown
# 10_question_selection_algorithm.md

# Question Selection Algorithm

Version : 1.0

---

# 1. Overview

Question Selection Algorithm bertanggung jawab memilih kumpulan soal terbaik
dari Question Bank sebelum proses randomisasi dilakukan.

Selection Engine memastikan:

- soal sesuai blueprint
- distribusi seimbang
- kualitas tinggi
- tidak duplikat
- tidak bias
- sesuai histori peserta
- siap untuk CBT

Selection dilakukan sebelum Randomization Engine.

---

# 2. High Level Flow

```
Exam Blueprint
        │
        ▼
Candidate Query
        │
        ▼
Eligibility Filter
        │
        ▼
Business Rule Filter
        │
        ▼
Quality Filter
        │
        ▼
Similarity Filter
        │
        ▼
Exposure Filter
        │
        ▼
Student History Filter
        │
        ▼
Weighted Selection
        │
        ▼
Selection Result
        │
        ▼
Randomization Engine
```

---

# 3. Selection Principles

Selection Engine harus memenuhi prinsip berikut.

- Fair
- Deterministic
- Explainable
- High Performance
- Extensible
- AI Ready
- Blueprint Driven

---

# 4. Candidate Pool

Selection dimulai dengan mengambil Candidate Pool.

Candidate Pool adalah seluruh Question yang memenuhi filter dasar.

Contoh

```
Subject

↓

Matematika

↓

Grade XII

↓

Published

↓

Question Pool
```

---

# 5. Eligibility Filter

Question harus memenuhi syarat berikut.

✓ Published

✓ Active

✓ Review Approved

✓ Metadata Complete

✓ Not Archived

✓ Not Suspended

✓ Current Version

---

# 6. Blueprint Matching

Question harus sesuai Blueprint.

Blueprint dapat menentukan:

- Subject
- Chapter
- Subchapter
- Difficulty
- Bloom Level
- HOTS
- Question Type
- Quantity

Contoh

| Subject | Chapter | Difficulty | Qty |
|----------|----------|------------|-----|
| Matematika | Integral | Easy | 5 |
| Matematika | Integral | Medium | 8 |
| Matematika | Integral | Hard | 7 |

---

# 7. Metadata Matching

Question dibandingkan dengan filter berikut.

- Curriculum
- Education Level
- Grade
- Semester
- Subject
- Chapter
- Topic
- Difficulty
- Bloom
- HOTS
- Language
- Tags

Question yang tidak sesuai dieliminasi.

---

# 8. Quality Filter

Question memiliki Quality Score.

Contoh faktor:

- Review Score
- Validation Score
- Error Rate
- Report Count
- Completeness
- AI Confidence

Question di bawah ambang batas tidak dipilih.

---

# 9. Similarity Filter

Question dengan tingkat kemiripan tinggi tidak dipilih bersamaan.

Contoh

```
Question A

Similarity

96%

Question B

↓

Pilih Salah Satu
```

Menggunakan pgvector.

---

# 10. Exposure Filter

Question yang terlalu sering muncul
akan memiliki prioritas lebih rendah.

Contoh

| Usage | Priority |
|---------|----------|
| 5 | High |
| 200 | Low |

---

# 11. Student History Filter

Question dapat difilter berdasarkan histori peserta.

Mode:

Never Repeat

Repeat After X Days

Wrong Answer Only

Allow Repeat

---

# 12. Cooldown Filter

Question yang baru digunakan
tidak langsung digunakan kembali.

Contoh

```
Last Used

↓

14 Hari

↓

Eligible
```

---

# 13. Weighted Score

Selection menggunakan skor.

Contoh

```
Final Score

=

Quality Score

+

Freshness Score

+

AI Confidence

-

Exposure Score

-

Similarity Penalty
```

Semakin tinggi nilai akhir,
semakin besar peluang dipilih.

---

# 14. Selection Priority

Prioritas seleksi.

1.

Blueprint Match

↓

2.

Quality

↓

3.

Difficulty Balance

↓

4.

Exposure

↓

5.

Student History

↓

6.

Similarity

↓

7.

Weighted Score

---

# 15. Difficulty Balancing

Selection memastikan distribusi sesuai target.

Misal

```
40 Question

↓

12 Easy

↓

16 Medium

↓

12 Hard
```

---

# 16. Bloom Distribution

Selection menjaga proporsi Bloom.

Contoh

| Bloom | Qty |
|---------|-----|
| C1 | 5 |
| C2 | 8 |
| C3 | 10 |
| C4 | 9 |
| C5 | 5 |
| C6 | 3 |

---

# 17. Topic Balancing

Tidak boleh seluruh soal berasal dari satu topik.

Contoh

```
Integral

↓

8

Turunan

↓

6

Limit

↓

6
```

---

# 18. Adaptive Selection (Future)

Future CAT.

Selection mempertimbangkan:

- kemampuan siswa
- histori
- probabilitas benar
- target difficulty

---

# 19. AI Assisted Selection

AI dapat membantu.

Contoh

- mendeteksi bias
- mendeteksi soal usang
- memilih soal representatif
- memprediksi kualitas

AI hanya memberi rekomendasi.

---

# 20. Selection Output

Output berupa daftar Question Version.

```
Question

↓

Version

↓

Order

↓

Metadata

↓

Score
```

Randomization Engine menggunakan hasil ini.

---

# 21. Failure Strategy

Jika pool tidak cukup.

Strategi:

- gunakan fallback blueprint
- longgarkan difficulty
- longgarkan bloom
- gunakan chapter terdekat

Seluruh fallback dicatat.

---

# 22. Performance

Target.

Candidate Query

< 200 ms

Selection

< 300 ms

100 Question

< 500 ms

---

# 23. Database Objects

Selection menggunakan:

```
question

question_version

question_metadata

question_statistics

question_usage

question_similarity

student_question_history

exam_blueprint

exam_blueprint_detail
```

---

# 24. Domain Events

```
CandidatePoolLoaded

BlueprintMatched

QuestionFiltered

QuestionSelected

SelectionCompleted

SelectionFailed
```

---

# 25. Logging

Selection mencatat.

- Blueprint
- Candidate Count
- Selected Count
- Filter Result
- Execution Time
- Random Seed
- Fallback Rule

---

# 26. Future Algorithm

Roadmap.

- Constraint Satisfaction Solver
- Genetic Algorithm
- Simulated Annealing
- Integer Programming
- Shadow Test Assembly
- Computerized Adaptive Testing
- Item Response Theory
- Reinforcement Learning
- AI Selection Optimizer
````

---

# Rekomendasi Arsitektur

Saya menyarankan Selection Engine dibangun sebagai **pipeline bertingkat**, bukan satu fungsi besar.

```text
Exam Request
      │
      ▼
Blueprint Service
      │
      ▼
Candidate Loader
      │
      ▼
Eligibility Filter
      │
      ▼
Metadata Filter
      │
      ▼
Quality Filter
      │
      ▼
Similarity Filter
      │
      ▼
Exposure Filter
      │
      ▼
Weighted Scoring
      │
      ▼
Selection Result
      │
      ▼
Randomization Engine
      │
      ▼
CBT Runtime
```

### Struktur package Go yang disarankan

```text
internal/questionbank/
    selection/
        blueprint_selector.go
        eligibility_filter.go
        metadata_filter.go
        quality_filter.go
        similarity_filter.go
        exposure_filter.go
        history_filter.go
        weighted_selector.go
        fallback_strategy.go
        pipeline.go
```

Pendekatan ini menjaga setiap algoritma tetap **single responsibility**, mudah diuji (unit test), mudah diganti, dan memungkinkan penambahan algoritma baru (misalnya IRT atau CAT) tanpa mengubah keseluruhan Selection Engine.
