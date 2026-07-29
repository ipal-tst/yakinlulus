Saya setuju menggunakan lifecycle yang lebih lengkap. Dengan target YakinLulus.id (Bank Soal + CBT + AI + Analytics), lifecycle sebaiknya tidak hanya **Draft → Published**, tetapi mengikuti **quality assurance pipeline**. Berikut dokumen **`07_question_bank/04_question_lifecycle.md`**.

````markdown
# 04_question_lifecycle.md

# Question Lifecycle

Version : 1.0

---

# 1. Overview

Question Lifecycle mendefinisikan seluruh siklus hidup sebuah soal, mulai dari dibuat hingga dipensiunkan (deprecated).

Lifecycle ini memastikan:

- kualitas soal
- konsistensi data
- auditability
- version control
- AI validation
- academic review
- keamanan publikasi

Setiap perubahan status menghasilkan Audit Log dan Domain Event.

---

# 2. Lifecycle Diagram

```
                     Create
                        │
                        ▼
                  DRAFT
                        │
                        ▼
             PENDING_VALIDATION
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
   AI_VALIDATION               MANUAL_VALIDATION
          │                           │
          └─────────────┬─────────────┘
                        ▼
               ACADEMIC_REVIEW
                        │
      ┌─────────────────┼─────────────────┐
      ▼                 ▼                 ▼
NEED_REVISION      REJECTED         APPROVED
      │                                  │
      └──────────────┐                   │
                     ▼                   ▼
                 DRAFT VERSION      PUBLISHED
                                         │
             ┌─────────────┬─────────────┴───────────────┐
             ▼             ▼                             ▼
        UPDATED       SUSPENDED                     ARCHIVED
             │             │                             │
             └─────────────┴─────────────┐               │
                                         ▼               ▼
                                   PUBLISHED       RESTORED
                                                        │
                                                        ▼
                                                   PUBLISHED

```

---

# 3. State Definitions

## 3.1 Draft

Status awal setelah soal dibuat.

Karakteristik:

- dapat diedit
- belum dapat digunakan
- belum divalidasi
- belum memiliki approval

Allowed Action

- Edit
- Delete (Soft Delete)
- Submit Validation

---

## 3.2 Pending Validation

Menunggu proses validasi.

Validasi meliputi:

- struktur
- metadata
- attachment
- option
- answer
- explanation

Allowed Action

- Cancel
- Validate

---

## 3.3 AI Validation

AI melakukan pemeriksaan otomatis.

Meliputi:

- duplicate detection
- typo
- grammar
- metadata prediction
- bloom prediction
- difficulty prediction
- answer consistency
- embedding generation

AI tidak boleh mengubah status menjadi Published.

---

## 3.4 Manual Validation

Validasi teknis oleh Editor.

Checklist:

- gambar tampil
- latex valid
- option lengkap
- file tersedia
- metadata benar

---

## 3.5 Academic Review

Reviewer akademik melakukan pemeriksaan isi soal.

Review meliputi:

- konsep benar
- jawaban benar
- pembahasan benar
- tingkat kesulitan
- kurikulum
- bahasa

---

## 3.6 Need Revision

Reviewer meminta revisi.

Creator melakukan:

- edit
- submit ulang

Status kembali menjadi:

Pending Validation

---

## 3.7 Rejected

Soal ditolak.

Tidak dapat dipublish.

Pilihan:

- Archive
- Create New Version

---

## 3.8 Approved

Semua review selesai.

Question siap dipublish.

Belum dapat digunakan sampai Published.

---

## 3.9 Published

Status aktif.

Question dapat digunakan oleh:

- CBT
- Practice
- AI Tutor
- Analytics
- Recommendation
- Search

Published Question bersifat immutable.

---

## 3.10 Updated

Published Question tidak dapat diedit.

Perubahan menghasilkan:

New Version

Version lama tetap Published.

Version baru masuk Draft.

---

## 3.11 Suspended

Question dihentikan sementara.

Contoh:

- ditemukan kesalahan
- investigasi
- revisi besar

Tidak muncul pada Exam baru.

---

## 3.12 Archived

Question dipensiunkan.

Masih tersimpan.

Tidak muncul pada Search default.

Tidak digunakan CBT.

---

## 3.13 Restored

Question Archived dapat dipulihkan.

Status kembali Published.

---

# 4. State Transition Rules

| From | To | Allowed |
|-------|----|----------|
| Draft | Pending Validation | Yes |
| Pending Validation | AI Validation | Yes |
| Pending Validation | Manual Validation | Yes |
| AI Validation | Academic Review | Yes |
| Manual Validation | Academic Review | Yes |
| Academic Review | Need Revision | Yes |
| Academic Review | Approved | Yes |
| Academic Review | Rejected | Yes |
| Need Revision | Draft | Yes |
| Approved | Published | Yes |
| Published | Updated | Yes |
| Published | Suspended | Yes |
| Suspended | Published | Yes |
| Published | Archived | Yes |
| Archived | Restored | Yes |
| Restored | Published | Yes |

---

# 5. Transition Permissions

| Role | Allowed |
|------|----------|
| Admin | All |
| Staff | Create, Edit |
| Teacher | Create |
| Reviewer | Review |
| Approver | Approve |
| AI Service | Validation Only |

---

# 6. Version Lifecycle

```
Question

Version 1

Published

↓

Need Update

↓

Version 2 Draft

↓

Validation

↓

Review

↓

Publish

↓

Current Version = 2

Version 1 tetap disimpan
```

---

# 7. Domain Events

Setiap perubahan status menghasilkan event.

```
QuestionCreated

QuestionSubmitted

QuestionValidationStarted

QuestionValidationCompleted

QuestionAIValidated

QuestionReviewed

QuestionApproved

QuestionRejected

QuestionRevisionRequested

QuestionPublished

QuestionSuspended

QuestionArchived

QuestionRestored

QuestionVersionCreated

QuestionDeleted
```

---

# 8. Background Jobs

State tertentu menjalankan background process.

Draft

↓

Generate Question Code

---

Validation

↓

Metadata Validation

↓

Embedding Generation

↓

Duplicate Detection

---

Published

↓

Update Search Index

↓

Invalidate Cache

↓

Notify CBT

↓

Analytics Sync

---

Archived

↓

Remove Search Index

↓

Refresh Cache

---

# 9. Audit Log

Seluruh perubahan wajib dicatat.

Audit menyimpan:

- timestamp
- actor
- old state
- new state
- reason
- IP Address
- Device
- Request ID

---

# 10. State Constraints

## Draft

Editable

---

## Validation

Tidak boleh diedit.

---

## Review

Reviewer tidak boleh mengubah isi soal.

---

## Approved

Menunggu Publish.

---

## Published

Read Only.

---

## Archived

Read Only.

---

## Suspended

Tidak dapat dipakai CBT.

---

# 11. Failure Recovery

Jika proses gagal:

Validation

↓

Rollback

↓

Status tetap Pending Validation

---

Jika Publish gagal:

Rollback

↓

Tetap Approved

---

Jika AI gagal:

Retry Job

Maksimal:

3 kali

---

# 12. Notification

Event tertentu mengirim notifikasi.

Draft Created

→ Creator

Review Requested

→ Reviewer

Revision Requested

→ Creator

Approved

→ Publisher

Published

→ Analytics

Archived

→ CBT Engine

---

# 13. Database Status Enum

```
DRAFT

PENDING_VALIDATION

AI_VALIDATION

MANUAL_VALIDATION

ACADEMIC_REVIEW

NEED_REVISION

REJECTED

APPROVED

PUBLISHED

SUSPENDED

ARCHIVED
```

Status `RESTORED` dan `UPDATED` merupakan **aksi/transisi**, bukan status permanen yang disimpan di database.

---

# 14. SLA Recommendation

| Process | Target |
|----------|---------|
| AI Validation | < 30 detik |
| Manual Validation | < 1 hari |
| Academic Review | < 3 hari |
| Publish | < 5 detik |
| Archive | < 2 detik |
| Restore | < 2 detik |

---

# 15. Future Lifecycle

Lifecycle telah dipersiapkan untuk:

- Collaborative Review
- Multi Reviewer Approval
- AI Auto Review
- AI Auto Difficulty Calibration
- AI Bias Detection
- Question Certification
- Content Moderation
- Legal Verification
- Copyright Validation
- Automatic Deprecation
- Continuous Quality Scoring
- IRT Calibration Workflow
- CAT Optimization Pipeline
````

## Catatan Arsitektur

Mulai dari dokumen berikutnya (**05_question_metadata.md**), kita akan masuk ke spesifikasi yang jauh lebih detail. Metadata akan menjadi salah satu komponen terpenting karena akan digunakan oleh:

* PostgreSQL indexing
* Full Text Search
* pgvector Semantic Search
* AI Question Generation
* AI Recommendation
* CBT Randomization Engine
* Analytics
* Adaptive Learning
* Knowledge Graph
* Future Computerized Adaptive Testing (CAT)

Dengan desain tersebut, metadata tidak hanya berfungsi sebagai atribut soal, tetapi juga menjadi fondasi untuk seluruh fitur AI dan personalisasi di YakinLulus.id.
