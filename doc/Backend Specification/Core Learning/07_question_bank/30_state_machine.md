Dokumen berikutnya adalah **30_state_machine.md**. Ini adalah dokumen yang sangat penting karena menjadi **single source of truth** untuk lifecycle sebuah soal. Seluruh backend (service, API, worker, event, database, frontend) harus mengacu pada state machine ini.

Untuk **YakinLulus.id**, saya menyarankan menggunakan **finite state machine (FSM)** dengan transisi yang eksplisit. Jangan pernah menggunakan perubahan status bebas (`UPDATE status='published'`) tanpa validasi transisi.

---

````markdown
# 30_state_machine.md

# Question Bank State Machine

Version : 1.0

---

# 1. Overview

State Machine mendefinisikan seluruh
lifecycle Question Aggregate.

Setiap perubahan status
harus melalui validasi transisi.

State Machine menjadi acuan untuk.

- Backend
- API
- Database
- Workflow
- Event
- Frontend

---

# 2. Objectives

State Machine bertujuan untuk.

- menjaga konsistensi data
- mencegah transisi ilegal
- mendukung workflow review
- menjaga audit trail
- mempermudah automation

---

# 3. State Principles

Setiap Question hanya memiliki
satu state aktif.

Perubahan state harus.

- tervalidasi
- teraudit
- menghasilkan event
- dilakukan dalam transaction

---

# 4. Primary States

Question memiliki state.

DRAFT

READY_FOR_REVIEW

UNDER_REVIEW

REVISION_REQUIRED

APPROVED

PUBLISHED

ARCHIVED

DELETED

---

# 5. State Description

| State | Description |
|---------|-------------|
| DRAFT | Sedang dibuat |
| READY_FOR_REVIEW | Siap direview |
| UNDER_REVIEW | Reviewer sedang memeriksa |
| REVISION_REQUIRED | Perlu revisi |
| APPROVED | Lulus review |
| PUBLISHED | Dapat digunakan CBT |
| ARCHIVED | Tidak aktif |
| DELETED | Soft Delete |

---

# 6. Initial State

Question baru.

↓

DRAFT

---

# 7. Final State

Final.

ARCHIVED

atau

DELETED

---

# 8. State Diagram

```
DRAFT

↓

READY_FOR_REVIEW

↓

UNDER_REVIEW

↓

APPROVED

↓

PUBLISHED

↓

ARCHIVED

↓

DELETED
```

Jika gagal review.

```
UNDER_REVIEW

↓

REVISION_REQUIRED

↓

DRAFT
```

---

# 9. Allowed Transition

| From | To |
|--------|------|
| Draft | Ready For Review |
| Ready | Under Review |
| Under Review | Approved |
| Under Review | Revision Required |
| Revision Required | Draft |
| Approved | Published |
| Published | Archived |
| Archived | Published |
| Archived | Deleted |

---

# 10. Invalid Transition

Tidak diperbolehkan.

Draft

↓

Published

Draft

↓

Archived

Published

↓

Draft

Deleted

↓

Published

Deleted

↓

Draft

---

# 11. Publish Rule

Publish hanya diperbolehkan jika.

- Approved
- Metadata lengkap
- Attachment valid
- Tidak ada review terbuka

---

# 12. Archive Rule

Archive diperbolehkan jika.

Question tidak sedang direview.

---

# 13. Delete Rule

Delete menggunakan.

Soft Delete.

---

# 14. Restore Rule

Question dapat dipulihkan
dari ARCHIVED.

Question yang sudah DELETED
mengikuti kebijakan retensi.

---

# 15. Review Rule

Review hanya boleh dimulai
dari READY_FOR_REVIEW.

---

# 16. Revision Rule

Reviewer dapat mengembalikan.

↓

REVISION_REQUIRED

↓

DRAFT

---

# 17. Version Rule

Perubahan setelah Publish.

↓

New Version

↓

Workflow Baru

Version lama tetap immutable.

---

# 18. State Validation

Validasi dilakukan pada.

Application Service.

Database tidak boleh
mengatur workflow.

---

# 19. Event Generation

Setiap perubahan state
menghasilkan Domain Event.

Contoh.

QuestionSubmitted

QuestionApproved

QuestionPublished

QuestionArchived

---

# 20. Audit

Semua transisi
ditulis ke Audit Log.

---

# 21. Notification

State tertentu
menghasilkan notifikasi.

Ready For Review

↓

Reviewer

Approved

↓

Author

Published

↓

Administrator

---

# 22. Timeout

Review dapat memiliki timeout.

Jika habis.

↓

Back To Ready

atau

↓

Escalation

---

# 23. Retry

Publish gagal.

↓

Rollback Transaction

↓

Retry Manual

---

# 24. Monitoring

Dipantau.

- State Distribution
- Average Review Time
- Publish Success
- Revision Count

---

# 25. Database Objects

Menggunakan.

question

question_version

question_review

audit_log

---

# 26. Performance

State Transition.

< 100 ms

---

# 27. Security

Publish hanya.

Admin

Reviewer sesuai kebijakan

Super Admin

---

# 28. Future Roadmap

- Workflow Engine
- BPMN Integration
- Multi Stage Review
- AI Assisted Review
- Approval Matrix
````

---

# State Machine yang Direkomendasikan

```text
                         +----------------+
                         |     DRAFT      |
                         +----------------+
                                  │
                                  ▼
                  +-------------------------------+
                  |   READY_FOR_REVIEW            |
                  +-------------------------------+
                                  │
                                  ▼
                     +-------------------------+
                     |     UNDER_REVIEW        |
                     +-------------------------+
                        │                 │
              approved  │                 │ revision
                        ▼                 ▼
               +----------------+   +----------------------+
               |    APPROVED    |   | REVISION_REQUIRED    |
               +----------------+   +----------------------+
                        │                     │
                        ▼                     ▼
                +----------------+      +-------------+
                |   PUBLISHED    |─────▶|    DRAFT    |
                +----------------+
                        │
                        ▼
                +----------------+
                |   ARCHIVED     |
                +----------------+
                        │
                        ▼
                +----------------+
                |    DELETED     |
                +----------------+
```

---

# Penyempurnaan Khusus untuk YakinLulus.id

## 1. Pisahkan Workflow dan State

Status menggambarkan kondisi saat ini, sedangkan workflow menggambarkan proses.

Contoh:

* **State:** `UNDER_REVIEW`
* **Workflow:** Review Akademik → Review Bahasa → Review Final

Dengan pemisahan ini, di masa depan Anda dapat menambah tahapan review tanpa mengubah state utama.

---

## 2. Gunakan Transition Object

Daripada langsung mengubah status, gunakan objek transisi.

Contoh:

```text
QuestionTransition
│
├── from_state
├── to_state
├── action
├── actor
├── reason
├── occurred_at
└── metadata
```

Keuntungan:

* audit lebih lengkap;
* mudah membuat timeline;
* mendukung analytics workflow.

---

## 3. Seluruh Transisi Menghasilkan Event

Contoh:

* `QuestionSubmittedForReview`
* `QuestionReviewStarted`
* `QuestionApproved`
* `QuestionPublished`
* `QuestionArchived`

Event ini akan dikonsumsi oleh modul lain seperti Search Projection, AI Embedding, Notification, Analytics, dan Audit.

---

## 4. Immutable Published Version

Setelah sebuah versi mencapai `PUBLISHED`:

* isi soal tidak boleh diubah;
* perubahan apa pun menghasilkan **question_version** baru;
* versi baru kembali ke `DRAFT` dan menjalani seluruh workflow review.

Pendekatan ini menjaga integritas soal yang sudah pernah digunakan dalam CBT, sehingga hasil ujian tetap dapat direproduksi dan diaudit kapan pun diperlukan.
