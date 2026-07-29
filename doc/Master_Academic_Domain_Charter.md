# Master Academic Domain Charter

Version : 1.0

Status : Draft

Domain : Master Academic

Owner : Academic Management

Priority : Critical (Core Domain)

---

# 1. Purpose

Master Academic Domain merupakan Domain inti (Core Domain) yang bertanggung jawab mengelola seluruh struktur akademik pada platform YakinLulus.

Seluruh Domain lain wajib menggunakan data akademik dari Domain ini sebagai referensi tunggal (Single Source of Truth).

Domain ini tidak menyimpan data soal, materi, ujian, maupun aktivitas belajar.

Domain ini hanya bertanggung jawab terhadap struktur akademik.

---

# 2. Objectives

Menyediakan struktur akademik yang konsisten untuk seluruh sistem.

Menghindari duplikasi data akademik.

Memudahkan penambahan kurikulum baru.

Memudahkan pengelompokan soal dan materi.

Menjadi fondasi AI Recommendation, CBT Blueprint, Learning Analytics, dan RAG.

---

# 3. Scope

Domain ini mencakup seluruh metadata akademik.

Termasuk:

• Jenjang Pendidikan

• Tingkat / Kelas

• Kurikulum

• Mata Pelajaran

• Semester

• Bab

• Sub Bab

• Topik

• Sub Topik

• Kompetensi

• Learning Objective

• Standar Penilaian

• Tingkat Kesulitan

• Taksonomi Bloom

• Tag Akademik

---

Tidak termasuk:

Question

Material

Exam

User

Progress

Analytics

AI

Media

---

# 4. Responsibilities

Domain ini bertanggung jawab untuk:

Mengelola struktur pendidikan.

Mengelola hubungan antar jenjang.

Mengelola hubungan antar mata pelajaran.

Mengelola kurikulum.

Mengelola struktur bab.

Mengelola struktur topik.

Mengelola kompetensi.

Mengelola learning objective.

Menjadi referensi seluruh domain lain.

---

# 5. Business Rules

## Rule 1

Satu Kurikulum dapat memiliki banyak Jenjang.

---

## Rule 2

Satu Jenjang memiliki banyak Kelas.

---

## Rule 3

Satu Kelas memiliki banyak Mata Pelajaran.

---

## Rule 4

Satu Mata Pelajaran memiliki banyak Bab.

---

## Rule 5

Satu Bab memiliki banyak Topik.

---

## Rule 6

Satu Topik dapat digunakan oleh banyak Soal.

---

## Rule 7

Satu Topik dapat digunakan oleh banyak Materi.

---

## Rule 8

Perubahan struktur akademik tidak boleh mengubah data Soal maupun Materi.

---

## Rule 9

Setiap Question harus memiliki referensi akademik yang valid.

---

## Rule 10

Setiap Material harus memiliki referensi akademik yang valid.

---

# 6. Domain Owner

Academic Management

Domain ini merupakan satu-satunya pihak yang berhak membuat maupun mengubah struktur akademik.

---

# 7. Public Services

Domain ini menyediakan data:

Jenjang

Kelas

Mapel

Bab

Topik

Kompetensi

Learning Objective

Kurikulum

Semester

untuk digunakan Domain lain.

Domain lain tidak diperbolehkan mengubah data tersebut.

---

# 8. Consumers

Question Bank Domain

Learning Material Domain

CBT Engine Domain

Learning Domain

Analytics Domain

AI Domain

Organization Domain

---

# 9. Domain Events

Curriculum Created

Curriculum Updated

Grade Created

Subject Created

Chapter Created

Topic Created

Learning Objective Updated

Competency Updated

---

# 10. Dependencies

Tidak memiliki ketergantungan terhadap Domain lain.

Master Academic merupakan Root Domain.

---

# 11. Future Expansion

Multi Curriculum

International Curriculum

Custom School Curriculum

National Curriculum Versioning

Competency Mapping

Cross Subject Mapping

Knowledge Graph

Learning Path Graph

---

# 12. Success Metrics

Seluruh Soal mempunyai referensi akademik.

Seluruh Materi mempunyai referensi akademik.

Seluruh CBT Blueprint berasal dari struktur akademik.

Tidak terdapat duplikasi struktur akademik.

Seluruh Domain menggunakan referensi yang sama.
