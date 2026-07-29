# Logical Data Model Principles

Project : YakinLulus.id

Version : 1.0

---

# Tujuan

Dokumen ini menjadi standar perancangan seluruh Logical Data Model pada platform YakinLulus.

Seluruh domain wajib mengikuti aturan yang sama agar database konsisten, mudah dikembangkan, dan mudah dipelihara.

---

# 1. Setiap Entity Memiliki Satu Tanggung Jawab

Satu entity hanya memiliki satu tanggung jawab bisnis (Single Responsibility Principle).

Contoh:

Question
✔ menyimpan identitas soal

Question Option
✔ menyimpan pilihan jawaban

Question Review
✔ menyimpan proses review

Jangan mencampur seluruh data ke satu tabel.

---

# 2. Aggregate Root

Setiap domain memiliki Aggregate Root.

Contoh

Question
Learning Resource
Exam
Organization
User

Semua entity lain berada di bawah Aggregate tersebut.

---

# 3. Setiap Entity Memiliki Primary Key

Semua entity memiliki Primary Key.

Tidak ada tabel tanpa Primary Key.

---

# 4. Business Key

Selain Primary Key, entity dapat memiliki Business Key.

Contoh

Question Code

Exam Code

Curriculum Code

Organization Code

Business Key digunakan oleh manusia.

Primary Key digunakan sistem.

---

# 5. Foreign Key

Semua relasi menggunakan Foreign Key.

Tidak boleh menggunakan nama text sebagai relasi.

SALAH

question.subject_name

BENAR

question.subject_id

---

# 6. Nullable

Field hanya dibuat Nullable apabila memang diperlukan oleh aturan bisnis.

Default:

NOT NULL

---

# 7. Normalisasi

Target minimal:

Third Normal Form (3NF)

Target ideal:

Boyce-Codd Normal Form (BCNF)

Denormalisasi hanya dilakukan pada Physical Model jika dibutuhkan untuk performa.

---

# 8. Lookup Table

Data referensi dipisahkan.

Contoh

Difficulty

Question Type

Language

Role

Permission

Status

Tidak menggunakan ENUM database untuk data yang berpotensi berubah.

---

# 9. Soft Delete

Semua entity bisnis menggunakan Soft Delete.

deleted_at

deleted_by

Tidak langsung DELETE.

---

# 10. Audit Field

Semua entity bisnis minimal memiliki:

created_at

created_by

updated_at

updated_by

deleted_at

deleted_by

---

# 11. History

History dipisahkan dari tabel utama.

History hanya menyimpan perubahan bisnis.

---

# 12. Audit Log

Audit Log dipisahkan dari History.

Audit menyimpan aktivitas pengguna.

History menyimpan perubahan data.

---

# 13. Media

Semua file menggunakan Media Domain.

Tidak boleh menyimpan path file langsung pada entity bisnis.

---

# 14. AI

AI bukan pemilik data.

AI hanya menghasilkan output.

Output harus melalui workflow bisnis sebelum menjadi data resmi.

---

# 15. Analytics

Analytics adalah Read Model.

Tidak menjadi sumber data utama (Source of Truth).

---

# 16. Versioning

Entity yang membutuhkan histori menggunakan Version Entity.

Contoh

Question Version

Learning Version

Prompt Version

---

# 17. Ownership

Setiap entity hanya dimiliki satu domain.

Question hanya dimiliki Question Domain.

Media hanya dimiliki Media Domain.

Analytics tidak memiliki data Question.

Analytics hanya membaca.

---

# 18. Cross Domain

Relasi antar domain hanya melalui Foreign Key.

Tidak boleh membuat duplicate entity.

---

# 19. Scalability

Semua desain harus mampu berkembang hingga:

100.000+ user

10.000+ concurrent user

10 juta+ record

tanpa perubahan struktur besar.

---

# 20. Database Independence

Logical Model tidak bergantung pada PostgreSQL.

Logical Model harus tetap valid apabila database diganti.