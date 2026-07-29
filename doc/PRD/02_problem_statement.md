Berikut draft **`PRD/02_problem_statement.md`** untuk YakinLulus.id.

```md
# Product Requirement Document (PRD)

# YakinLulus.id

## Document: Problem Statement

| Attribute | Value |
|---|---|
| Document | Problem Statement |
| Version | 1.0 |
| Status | Draft |
| Product Stage | MVP Development |
| Related Document | Product Vision |

---

# 1. Introduction

## 1.1 Purpose

Dokumen Problem Statement mendefinisikan masalah utama yang ingin diselesaikan oleh YakinLulus.id.

Dokumen ini menjelaskan:

- kondisi saat ini
- permasalahan pengguna
- akar masalah
- dampak masalah
- peluang solusi produk

Problem Statement menjadi dasar dalam menentukan fitur dan prioritas pengembangan.

---

# 2. Current Education Challenge

## 2.1 Learning Preparation Problem

Persiapan akademik siswa masih banyak dilakukan secara tidak terstruktur.

Kondisi umum:

```

Siswa belajar

```
    ↓
```

Mengerjakan beberapa soal

```
    ↓
```

Mendapat nilai

```
    ↓
```

Tidak mengetahui penyebab kesalahan

```
    ↓
```

Mengulang kesalahan yang sama

```

Masalah utama:

- tidak mengetahui materi yang lemah
- tidak memiliki target belajar
- tidak memiliki evaluasi perkembangan
- latihan tidak konsisten

---

# 3. Student Problem Statement

## Problem 1: Limited Access to Quality Question Bank

### Situation

Siswa membutuhkan banyak latihan soal untuk meningkatkan kemampuan.

Namun:

- sumber soal tersebar
- kualitas soal tidak konsisten
- sulit mencari soal sesuai kebutuhan


### Impact

Siswa:

- membuang waktu mencari soal
- mendapatkan latihan yang tidak relevan
- sulit melakukan evaluasi kemampuan


### Root Cause

```

Tidak ada repository soal terstruktur

*

Metadata soal tidak lengkap

*

Tidak ada sistem rekomendasi soal

```

---

# Problem 2: Lack of Structured Learning Path

## Situation

Banyak siswa belajar berdasarkan:

- tugas sekolah
- materi yang sedang populer
- perkiraan sendiri


Tanpa mengetahui:

- urutan materi
- tingkat penguasaan
- prioritas perbaikan


## Impact

Siswa:

- belajar tidak efektif
- fokus pada materi yang sudah dikuasai
- mengabaikan materi yang lemah


## Root Cause

```

Tidak ada hubungan antara:

Materi

↓

Soal

↓

Hasil Evaluasi

↓

Rekomendasi Belajar

```

---

# Problem 3: Lack of Exam Simulation Experience

## Situation

Banyak siswa hanya mengerjakan soal biasa.

Mereka belum terbiasa dengan kondisi:

- batas waktu
- jumlah soal besar
- tekanan ujian
- strategi pengerjaan


## Impact

Saat ujian sebenarnya:

- manajemen waktu buruk
- panik
- tidak memahami strategi pengerjaan


## Root Cause

```

Latihan tidak menyerupai kondisi ujian sebenarnya

```

---

# Problem 4: No Personal Performance Analysis

## Situation

Setelah mengerjakan soal, siswa biasanya hanya mengetahui:

```

Benar : 70
Salah : 30
Nilai : 70

```

Tetapi tidak mengetahui:

- bab mana yang lemah
- tipe soal yang sulit
- perkembangan dibanding sebelumnya


## Impact

Siswa tidak mengetahui:

"Bagian mana yang harus diperbaiki?"

---

## Root Cause

Tidak adanya:

- learning analytics
- topic performance tracking
- historical progress


---

# 4. Teacher Problem Statement

# Problem 1: Difficulty Creating Assessment

## Situation

Guru membutuhkan soal untuk:

- latihan
- tugas
- ujian


Namun proses membuat soal:

- memakan waktu
- membutuhkan dokumentasi
- sulit melakukan kategorisasi


## Impact

Guru menghabiskan waktu administratif lebih banyak.


## Root Cause

Belum tersedia:

- centralized question bank
- question management system
- reusable assessment component


---

# Problem 2: Limited Student Performance Insight

## Situation

Guru biasanya melihat:

```

Nilai Ujian

↓

Ranking

```

Namun kurang mendapatkan:

- analisis kelemahan materi
- pola kesalahan siswa
- perkembangan individu


## Impact

Intervensi pembelajaran menjadi kurang tepat.


---

# 5. School / Institution Problem Statement

## Problem 1: Lack of Digital Assessment Infrastructure

Sekolah membutuhkan:

- sistem ujian digital
- pengelolaan soal
- monitoring hasil


Namun membangun sendiri membutuhkan:

- biaya besar
- tenaga teknis
- maintenance


---

## Problem 2: Fragmented Academic Data

Data akademik sering tersebar:

```

Spreadsheet

*

Dokumen

*

Aplikasi berbeda

```

Akibat:

- sulit dianalisa
- sulit membuat keputusan
- histori belajar hilang


---

# 6. Root Cause Analysis

## Problem Tree

```

```
                Low Academic Improvement

                          |
                          |

    --------------------------------------------

    |                  |                       |
```

Lack of Practice    Lack of Analysis       Lack of Simulation

```
    |                  |                       |
```

Question Bank       Learning Analytics       CBT System

```
    |                  |                       |

    --------------------------------------------

                    

                YakinLulus.id Solution
```

```

---

# 7. Opportunity Statement

## Opportunity

Terdapat peluang membangun platform yang menggabungkan:

```

Quality Content

*

Question Bank

*

CBT Engine

*

Learning Analytics

```

untuk menghasilkan pengalaman belajar yang lebih efektif.

---

# 8. Product Solution Direction

## Before YakinLulus.id

```

Siswa

↓

Cari soal

↓

Kerjakan

↓

Lihat nilai

↓

Selesai

```

---

## After YakinLulus.id

```

Siswa

↓

Pilih target belajar

↓

Latihan soal sesuai kebutuhan

↓

Analisis kemampuan

↓

Identifikasi kelemahan

↓

Belajar materi terkait

↓

Ujian simulasi

↓

Evaluasi perkembangan

```

---

# 9. Problem Prioritization

| Problem | Impact | Priority |
|-|-|-|
| Tidak tersedia bank soal terstruktur | High | P0 |
| Tidak ada CBT simulation | High | P0 |
| Tidak ada analisis perkembangan | High | P0 |
| Materi belajar tidak terstruktur | Medium | P1 |
| AI tutor | Medium | P2 |
| Social learning | Low | P3 |

---

# 10. MVP Problem Focus

MVP YakinLulus.id fokus menyelesaikan tiga masalah terbesar:

## 1. Access Problem

Solusi:

```

Centralized Question Bank

```

---

## 2. Practice Problem

Solusi:

```

CBT Examination Engine

```

---

## 3. Improvement Problem

Solusi:

```

Learning Progress Analytics

```

---

# 11. Problem Statement Summary

YakinLulus.id dibangun untuk menyelesaikan masalah:

> Siswa membutuhkan cara belajar yang lebih terstruktur, terukur, dan menyerupai kondisi ujian sebenarnya. Guru membutuhkan alat untuk membuat evaluasi dan memahami perkembangan siswa. Sekolah membutuhkan infrastruktur digital untuk mengelola proses assessment secara efektif.

---

# Document Status

Current:

```

Completed - Problem Definition

