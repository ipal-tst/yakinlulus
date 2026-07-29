Saya setuju untuk melanjutkan ke **08_question_versioning.md**. Untuk platform seperti YakinLulus.id, versioning sebaiknya mengadopsi konsep **immutable content** seperti Git atau document management system, bukan sekadar menyimpan kolom `version_number`.

Versioning ini akan menjadi fondasi bagi AI, audit, CBT, analytics, dan review.

---

````markdown
# 08_question_versioning.md

# Question Versioning Specification

Version : 1.0

---

# 1. Overview

Question Versioning mengatur bagaimana perubahan soal dikelola sepanjang siklus hidupnya.

Tujuan utama:

- menjaga histori perubahan
- memungkinkan rollback
- menjaga konsistensi CBT
- mendukung audit
- mendukung AI training
- memastikan Published Question tidak berubah

Setiap perubahan substansial menghasilkan Version baru.

Version lama tidak pernah dihapus.

---

# 2. Design Principles

Question memiliki dua identitas:

Question

↓

Identity (Permanent)

↓

Version (Mutable)

Artinya:

Question UUID tetap sama.

Isi Question berada pada Version.

---

# 3. Identity Model

```
Question

question_id

↓

Version 1

↓

Version 2

↓

Version 3

↓

Version N
```

Question merupakan Aggregate Root.

Version merupakan child entity.

---

# 4. Immutable Principle

Version bersifat immutable.

Setelah dibuat:

Tidak dapat diedit.

Jika ingin mengubah isi:

Create New Version.

---

# 5. Version Numbering

Menggunakan integer.

Contoh

```
Version 1

↓

Version 2

↓

Version 3

↓

Version 4
```

Tidak boleh:

- duplicate
- skip
- reset

---

# 6. Current Version

Question hanya memiliki satu Current Version.

```
Question

↓

Current Version

↓

Version 5
```

Current Version berubah ketika Publish berhasil.

---

# 7. Published Version

Published Version bersifat read-only.

Tidak boleh:

- edit stem
- edit option
- edit answer
- edit explanation

Jika ada perubahan:

Version baru dibuat.

---

# 8. Draft Version

Question dapat memiliki satu Draft Version aktif.

Contoh

```
Question

Published

↓

Version 5

↓

Draft

↓

Version 6
```

Version 6 belum digunakan CBT.

---

# 9. Version Lifecycle

```
Create

↓

Draft

↓

Validation

↓

Review

↓

Approved

↓

Published

↓

Archived
```

---

# 10. Version Creation Rules

Version baru dibuat ketika:

- stem berubah
- option berubah
- answer berubah
- explanation berubah
- attachment berubah
- metadata akademik berubah
- formula berubah

Version baru tidak wajib ketika:

- tag internal
- catatan editor
- audit
- statistik
- cache
- embedding

berubah.

---

# 11. Version Comparison

Sistem dapat membandingkan dua version.

Perbandingan meliputi:

- Stem
- Option
- Answer
- Explanation
- Metadata
- Attachment
- Formula

Output:

```
Added

Removed

Modified

Unchanged
```

---

# 12. Version Status

Status setiap version.

```
Draft

Pending Validation

Review

Approved

Published

Rejected

Archived
```

Question dapat memiliki banyak Version.

Namun hanya satu Published Version aktif.

---

# 13. Version Ownership

Version menyimpan:

- created_by
- created_at
- review_cycle
- approval_id

Version lama tetap mempertahankan informasi historis.

---

# 14. Version Branching

MVP

Linear Version.

```
V1

↓

V2

↓

V3

↓

V4
```

Future

Branch Version.

```
V3

├── V4A

└── V4B
```

---

# 15. Rollback Strategy

Rollback tidak mengubah Version lama.

Sistem membuat Version baru.

Contoh

```
Version 5

↓

Rollback

↓

Version 6

(isi sama dengan Version 4)
```

Seluruh histori tetap terjaga.

---

# 16. CBT Compatibility

Exam Session selalu mengunci Version.

Contoh

```
Exam

↓

Question

↓

Version 3
```

Walaupun Version 4 sudah dipublish,

peserta ujian tetap menggunakan Version 3 sampai ujian selesai.

---

# 17. Search Behavior

Default Search

↓

Current Published Version

History Search

↓

All Version

Admin dapat melihat seluruh histori.

Student hanya melihat Current Version.

---

# 18. AI Version

AI juga memiliki histori.

Contoh

```
Prompt Version

↓

Model Version

↓

Embedding Version

↓

Explanation Version
```

Sehingga hasil AI dapat direproduksi.

---

# 19. Metadata Version

Metadata berikut menghasilkan Version baru.

- Subject
- Chapter
- Difficulty
- Bloom
- HOTS
- Learning Objective
- Correct Answer

Metadata administratif tidak menghasilkan Version baru.

---

# 20. Database Model

```
question

↓

question_version

↓

question_option

↓

question_attachment

↓

question_explanation
```

question hanya menyimpan:

- current_version_id
- published_version_id

---

# 21. Version Snapshot

Setiap Version merupakan snapshot lengkap.

Contoh

Version 3 berisi:

- Stem
- Option
- Answer
- Explanation
- Metadata
- Attachment

Tidak mengambil data dari Version sebelumnya.

---

# 22. Domain Events

VersionCreated

VersionUpdated

VersionReviewed

VersionApproved

VersionPublished

VersionArchived

VersionRollback

CurrentVersionChanged

---

# 23. Audit

Audit mencatat:

- old_version
- new_version
- actor
- reason
- timestamp

---

# 24. Performance

Target:

Create Version

< 100 ms

Load Current Version

< 50 ms

Compare Version

< 300 ms

Rollback

< 500 ms

---

# 25. Storage Strategy

Version lama tidak dihapus.

Retention:

Permanent

Compression dapat diterapkan untuk attachment lama.

---

# 26. Database Constraints

Harus selalu terpenuhi:

✓ Satu Current Version

✓ Maksimal satu Published Version

✓ Version Number unik per Question

✓ Version immutable

✓ Tidak ada orphan version

---

# 27. Future Enhancements

Roadmap:

- Git-style Diff Viewer
- Branch & Merge Version
- Parallel Authoring
- Collaborative Editing
- Conflict Resolution
- Semantic Diff
- AI Version Comparison
- AI Change Summary
- Auto Version Label
- Major/Minor Version
- Version Tag
- Release Notes
- Digital Signature
````

---

# Catatan Arsitektur (Penting)

Saya menyarankan **sedikit mengubah ERD** dibanding desain umum agar lebih skalabel.

Daripada:

```text
question
    ├── current_version_id
    └── published_version_id
```

Saya lebih merekomendasikan:

```text
question
    │
    └── question_version
           │
           ├── version_number
           ├── lifecycle_status
           ├── is_current
           ├── is_published
           └── published_at
```

Dengan **partial unique index PostgreSQL**, kita bisa menjamin:

```sql
UNIQUE (question_id)
WHERE is_current = true;
```

dan

```sql
UNIQUE (question_id)
WHERE is_published = true;
```

Keuntungan pendekatan ini:

* Tidak ada circular reference antara `question` dan `question_version`.
* Query histori version menjadi lebih sederhana.
* Migrasi skema lebih mudah.
* Cocok dengan event sourcing ringan.
* Lebih mudah diintegrasikan dengan background job, AI pipeline, dan replication.

Pendekatan ini juga lebih sejalan dengan praktik desain sistem enterprise pada aplikasi berbasis PostgreSQL.
