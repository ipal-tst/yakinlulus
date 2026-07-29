Saya juga menyarankan dokumen berikutnya (**09_question_randomization.md**) menjadi salah satu modul inti, bukan sekadar `ORDER BY RANDOM()`. Untuk platform CBT seperti UTBK, randomisasi harus mempertimbangkan **fairness**, **difficulty distribution**, **topic distribution**, **question exposure**, dan **anti-cheating**.

---

````markdown
# 09_question_randomization.md

# Question Randomization Specification

Version : 1.0

---

# 1. Overview

Question Randomization bertanggung jawab memilih kumpulan soal yang akan digunakan dalam suatu ujian.

Tujuan utama:

- menghasilkan paket soal yang adil
- menjaga distribusi tingkat kesulitan
- menjaga distribusi materi
- mengurangi kemungkinan kecurangan
- menghindari soal berulang
- menjaga kualitas asesmen

Randomization tidak hanya mengacak urutan soal, tetapi juga melakukan proses seleksi berdasarkan aturan akademik.

---

# 2. Design Principles

Randomization harus memenuhi prinsip berikut.

- Fair
- Deterministic (optional)
- Configurable
- Repeatable
- Auditable
- High Performance
- Scalable
- Curriculum Driven

---

# 3. Randomization Pipeline

```
Question Pool
      │
      ▼
Eligibility Filter
      │
      ▼
Metadata Filter
      │
      ▼
Business Rule Validation
      │
      ▼
Distribution Engine
      │
      ▼
Random Selection
      │
      ▼
Exposure Validation
      │
      ▼
Package Builder
      │
      ▼
CBT Session
```

---

# 4. Eligible Question

Question hanya dapat dipilih apabila memenuhi seluruh syarat berikut.

✓ Published

✓ Active

✓ Tidak Archived

✓ Tidak Suspended

✓ Metadata lengkap

✓ Review Approved

✓ Memiliki Explanation

✓ Tidak sedang dikunci administrasi

---

# 5. Question Pool

Randomization bekerja dari Question Pool.

Pool dibentuk berdasarkan filter.

Contoh

Subject

↓

Matematika

↓

Grade 12

↓

Chapter Integral

↓

Published

↓

Question Pool

---

# 6. Metadata Filter

Filter dapat menggunakan:

- Curriculum
- Education Level
- Grade
- Semester
- Subject
- Chapter
- Subchapter
- Topic
- Difficulty
- Bloom Level
- HOTS
- Language
- Source
- Question Type
- Tag

---

# 7. Distribution Rules

Distribusi soal dapat dikonfigurasi.

Contoh

```
40%

Easy

30%

Medium

30%

Hard
```

atau

```
30%

C1

20%

C2

20%

C3

20%

C4

10%

C5-C6
```

---

# 8. Chapter Distribution

Contoh

```
Integral

20 soal

Limit

10 soal

Turunan

10 soal
```

Distribusi ditentukan oleh Blueprint Ujian.

---

# 9. Blueprint Driven Selection

Blueprint menentukan komposisi soal.

Contoh

| Subject | Chapter | Difficulty | Qty |
|----------|----------|------------|-----|
| Matematika | Integral | Easy | 5 |
| Matematika | Integral | Medium | 8 |
| Matematika | Integral | Hard | 7 |

Blueprint bersifat fleksibel.

---

# 10. Random Seed

Sistem mendukung Random Seed.

```
Exam ID

↓

Random Seed

↓

Repeatable Selection
```

Digunakan untuk audit dan reproduksi hasil.

---

# 11. Question Order Randomization

Setelah soal dipilih.

Urutan soal diacak.

Contoh

```
Question

5

↓

17

↓

2

↓

20

↓

11
```

---

# 12. Option Randomization

Pilihan jawaban juga dapat diacak.

Contoh

Sebelum

A

B

C

D

Sesudah

C

A

D

B

Jawaban benar tetap dipertahankan melalui mapping.

---

# 13. Story Group Protection

Question yang menggunakan Story bersama tidak boleh dipisahkan.

```
Story A

↓

Question 1

Question 2

Question 3
```

Urutan internal dapat diatur, tetapi kelompok tetap utuh.

---

# 14. Duplicate Prevention

Dalam satu paket ujian:

Question tidak boleh muncul dua kali.

Rule:

Unique Question ID

Unique Current Version

---

# 15. Exposure Control

Question memiliki Exposure Score.

Semakin sering digunakan,

semakin kecil probabilitas dipilih.

Contoh

```
Usage

↓

Probability

↓

Selection
```

---

# 16. Cooldown Period

Question yang baru digunakan dapat diberi masa jeda.

Contoh

```
Last Used

↓

30 Hari

↓

Eligible Again
```

Nilai cooldown dapat dikonfigurasi.

---

# 17. Student History Filter

Question yang pernah dikerjakan siswa dapat dikecualikan.

Mode:

- Never Repeat
- Allow Repeat
- Repeat After X Days
- Repeat Wrong Answer Only

---

# 18. Difficulty Balancing

Random Engine memastikan distribusi kesulitan tetap sesuai blueprint.

Jika target:

Easy : 10

Medium : 15

Hard : 15

Hasil akhir harus tetap mendekati komposisi tersebut.

---

# 19. Semantic Similarity Filter

Question dengan Similarity tinggi tidak boleh muncul bersamaan.

Contoh

Similarity

95%

↓

Pilih salah satu.

Menggunakan pgvector.

---

# 20. AI Assisted Selection

AI dapat membantu:

- menentukan variasi soal
- mengurangi bias
- memilih soal representatif
- menghindari pola berulang

AI hanya memberikan rekomendasi.

---

# 21. Randomization Algorithm

Urutan proses:

```
Load Pool

↓

Apply Filter

↓

Apply Blueprint

↓

Apply Exposure Rule

↓

Apply Similarity Rule

↓

Weighted Random

↓

Validate

↓

Build Package
```

---

# 22. Weighted Random

Bobot dapat dihitung berdasarkan:

- Exposure Score
- Quality Score
- Difficulty Accuracy
- Usage Count
- Review Score
- AI Confidence

Semakin tinggi kualitas dan semakin rendah exposure, semakin besar peluang dipilih.

---

# 23. Performance Target

Target sistem.

| Process | Target |
|----------|---------|
| Build Pool | < 200 ms |
| Random 100 Question | < 500 ms |
| Validate Package | < 200 ms |
| Build Final Package | < 100 ms |

---

# 24. Failure Handling

Jika soal tidak mencukupi.

Contoh

Target

20 Hard Question

Pool tersedia

15

Strategi:

- gunakan fallback rule
- turunkan difficulty sesuai konfigurasi
- atau batalkan pembuatan paket

Semua keputusan dicatat pada audit log.

---

# 25. Database Objects

Randomization menggunakan:

```
question

question_version

question_metadata

question_statistics

question_usage

question_similarity

exam_blueprint

exam_blueprint_detail

student_question_history
```

---

# 26. Domain Events

```
QuestionPoolCreated

QuestionSelected

QuestionRejected

RandomizationCompleted

PackageCreated

PackageValidated

BlueprintApplied
```

---

# 27. Security Rules

- Random Seed tidak boleh diketahui peserta.
- Paket soal tidak boleh dapat diprediksi.
- Seluruh proses dicatat pada Audit Log.
- Hanya service CBT yang dapat meminta paket soal final.

---

# 28. Future Enhancements

Roadmap:

- Computerized Adaptive Testing (CAT)
- Item Response Theory (IRT)
- Multi-stage Testing (MST)
- Exposure Control Algorithm
- Shadow Test Assembly
- Constraint Satisfaction Solver
- Genetic Algorithm Optimization
- Reinforcement Learning Selection
- AI Blueprint Optimizer
- Dynamic Difficulty Adjustment
````

---

# Rekomendasi Arsitektur

Untuk YakinLulus.id, saya **tidak merekomendasikan** melakukan randomisasi langsung di query SQL seperti:

```sql
ORDER BY RANDOM()
LIMIT 40;
```

Pendekatan tersebut tidak skalabel pada bank soal besar.

Sebagai gantinya, gunakan pipeline berikut:

```text
PostgreSQL
      │
      ▼
Candidate Pool Query
      │
      ▼
Go Randomization Engine
      │
      ├── Blueprint Validator
      ├── Distribution Engine
      ├── Similarity Filter
      ├── Exposure Filter
      ├── Weighted Random
      └── Package Validator
      │
      ▼
Exam Package
```

Dengan arsitektur ini:

* PostgreSQL berperan sebagai penyedia **candidate pool** melalui query yang sudah dioptimalkan menggunakan indeks.
* Backend Go menangani seluruh logika randomisasi yang kompleks.
* `pgvector` hanya digunakan untuk memfilter soal yang terlalu mirip, bukan untuk proses randomisasi utama.
* Desain ini tetap efisien meskipun bank soal berkembang hingga jutaan soal dan ribuan peserta mengakses sistem secara bersamaan.
