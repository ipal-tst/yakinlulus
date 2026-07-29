# YakinLulus.id
## Business Domain Charter
Version : 1.0
Status  : Draft
Author  : Architecture Team

---

# 1. Purpose

Tujuan dokumen ini adalah mendefinisikan seluruh Business Domain pada platform
YakinLulus sebagai fondasi perancangan:

- Database
- Backend
- API
- Frontend
- AI
- Integrasi
- Future Scaling

Dokumen ini bukan ERD dan bukan Database Schema.

Dokumen ini menjadi acuan seluruh pengembangan sistem.

---

# 2. Architecture Principles

## 2.1 Single Source of Truth

Setiap data hanya mempunyai satu pemilik.

Contoh

Question dimiliki oleh Question Domain.

CBT tidak boleh menyimpan salinan Question.

---

## 2.2 Separation of Concerns

Setiap Domain hanya mempunyai satu tanggung jawab.

---

## 2.3 Loose Coupling

Domain tidak boleh bergantung secara langsung terhadap implementasi Domain lain.

Interaksi dilakukan melalui Service atau API.

---

## 2.4 High Cohesion

Semua Entity di dalam Domain harus saling berkaitan.

---

## 2.5 Domain Independence

Perubahan di satu domain seminimal mungkin tidak memengaruhi domain lain.

---

## 2.6 Normalized Data

Target minimal database adalah Third Normal Form (3NF).

BCNF diterapkan jika memberikan manfaat tanpa meningkatkan kompleksitas yang tidak perlu.

---

## 2.7 Scalability First

Arsitektur harus mampu berkembang hingga:

- 100.000+ registered users
- 10.000+ concurrent users
- 10 juta+ question attempts
- jutaan learning records

tanpa perlu melakukan redesign database.

---

# 3. Domain Overview

01 Master Academic Domain

02 Question Bank Domain

03 Learning Material Domain

04 CBT Engine Domain

05 User Management Domain

06 Learning Domain

07 Organization Domain

08 Media Domain

09 AI Domain

10 Analytics Domain

11 System Domain

---

# 4. Domain Dependency Map

(diagram)

---

# 5. Domain Charter

Untuk setiap domain digunakan template berikut.

# Domain Name

## 1. Purpose

Mengapa domain ini ada.

---

## 2. Scope

Apa saja yang termasuk domain.

Apa yang tidak termasuk.

---

## 3. Responsibilities

Daftar tanggung jawab domain.

---

## 4. Business Rules

Aturan bisnis.

Misalnya:

- Soal tidak boleh dihapus jika dipakai CBT.
- Materi hanya memiliki satu versi aktif.
- dll.

---

## 5. Owner

Siapa pemilik data.

Misalnya

Academic Team

Content Team

Assessment Team

---

## 6. Primary Entities

Daftar calon Entity.

Belum menjadi tabel.

Misalnya

Question

Question Option

Question Media

Question Review

---

## 7. Public Data

Data apa yang boleh dipakai Domain lain.

---

## 8. Dependencies

Domain apa saja yang digunakan.

---

## 9. Consumers

Domain mana yang memakai data ini.

---

## 10. Events

Business Event.

Misalnya

Question Created

Question Updated

Question Published

Question Archived

---

## 11. Future Expansion

Roadmap domain.

---

## 12. Database Impact

Nanti diisi setelah ERD.
