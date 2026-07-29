Saya menyarankan **07_question_review_workflow.md** dibuat setara workflow editorial pada platform assessment profesional (ETS, Pearson, Cambridge, dsb.), bukan sekadar "review lalu publish". Mengingat YakinLulus.id akan memiliki AI Question Generation, bank soal besar, dan CBT, maka workflow harus mendukung **multi-stage review**, **quality assurance**, dan **auditability**.

---

````markdown
# 07_question_review_workflow.md

# Question Review Workflow

Version : 1.0

---

# 1. Overview

Question Review Workflow mendefinisikan proses Quality Assurance (QA) terhadap seluruh soal sebelum dipublikasikan.

Tujuan utama:

- Menjamin kualitas akademik
- Menjamin validitas jawaban
- Mencegah soal duplikat
- Menjaga konsistensi metadata
- Menjamin kesesuaian kurikulum
- Menyediakan audit trail lengkap

Tidak ada Question yang dapat dipublikasikan tanpa melalui workflow ini.

---

# 2. Review Architecture

```
Creator
    │
    ▼
Draft
    │
    ▼
Validation
    │
    ▼
AI Review
    │
    ▼
Editorial Review
    │
    ▼
Academic Review
    │
    ▼
Approval
    │
    ▼
Published
```

---

# 3. Review Stages

Workflow terdiri dari enam tahapan utama.

| Stage | Required | Actor |
|---------|----------|-------|
| Validation | ✓ | System |
| AI Review | ✓ | AI Service |
| Editorial Review | ✓ | Editor |
| Academic Review | ✓ | Reviewer |
| Approval | ✓ | Approver |
| Publish | ✓ | Publisher |

---

# 4. Validation Stage

Dilakukan otomatis oleh backend.

Pemeriksaan:

- Required Field
- Metadata
- Attachment
- Option
- Correct Answer
- Explanation
- Duplicate Option
- Invalid Formula
- Broken Media
- Invalid Foreign Key

Jika gagal:

Status

```
Validation Failed
```

---

# 5. AI Review Stage

AI melakukan pemeriksaan awal.

Meliputi:

- Duplicate Detection
- Similar Question
- Grammar
- Typo
- Readability
- Bloom Prediction
- Difficulty Prediction
- HOTS Prediction
- Metadata Recommendation
- Semantic Classification

Output AI:

```
Confidence

Similarity

Recommendation

Warning

Predicted Metadata

```

AI tidak dapat:

- Approve
- Reject
- Publish

---

# 6. Editorial Review

Editor memeriksa kualitas penyajian soal.

Checklist:

- Bahasa baku
- Typografi
- Tata letak
- Konsistensi istilah
- Penomoran
- Simbol
- Formula
- Gambar
- Tabel
- Media

Editor tidak mengubah konsep akademik.

---

# 7. Academic Review

Reviewer memeriksa substansi.

Checklist:

- Konsep benar
- Jawaban benar
- Pembahasan benar
- Tingkat kesulitan
- Bloom Level
- HOTS
- Kesesuaian kurikulum
- Kesesuaian indikator
- Validitas soal

Reviewer dapat memberikan komentar.

---

# 8. Approval Stage

Approver memastikan seluruh review selesai.

Approval hanya dapat dilakukan jika:

✓ Validation Passed

✓ AI Review Finished

✓ Editorial Passed

✓ Academic Passed

---

# 9. Publish Stage

Publisher melakukan publikasi.

Saat Publish sistem akan:

- Lock Current Version
- Update Search Index
- Generate Cache
- Notify CBT
- Publish Event
- Update Analytics

---

# 10. Review Decision

Reviewer memiliki empat keputusan.

| Decision | Description |
|------------|-------------|
| Approve | Layak publish |
| Minor Revision | Perbaikan kecil |
| Major Revision | Perbaikan substansial |
| Reject | Ditolak |

---

# 11. Revision Workflow

```
Review

↓

Need Revision

↓

Creator Edit

↓

New Version

↓

Validation

↓

Review Again
```

Version lama tetap tersimpan.

---

# 12. Multi Reviewer

Future.

Satu soal dapat memiliki beberapa reviewer.

Contoh

```
Matematika Reviewer

↓

Bahasa Reviewer

↓

Curriculum Reviewer

↓

Chief Reviewer
```

---

# 13. Role Responsibility

## Creator

Boleh:

- Create
- Edit Draft
- Submit Review

Tidak boleh:

- Approve
- Publish

---

## Editor

Boleh:

- Editorial Review

Tidak boleh:

- Publish

---

## Reviewer

Boleh:

- Academic Review

Tidak boleh:

- Publish

---

## Approver

Boleh:

- Approve

Tidak boleh:

- Mengubah isi soal

---

## Publisher

Boleh:

- Publish
- Archive
- Suspend

---

# 14. Review Checklist

Validation

```
Required Field

Metadata

Attachment

Option

Answer

Explanation

```

Editorial

```
Grammar

Typography

Image

Formula

Formatting

```

Academic

```
Concept

Answer

Difficulty

Bloom

HOTS

Curriculum

```

---

# 15. AI Recommendation

AI dapat memberikan rekomendasi.

Contoh

```
Difficulty

Medium

↓

Recommended

Hard

```

atau

```
Bloom

Apply

↓

Recommended

Analyze

```

Reviewer bebas menerima atau menolak rekomendasi AI.

---

# 16. SLA

| Process | Target |
|-----------|---------|
| Validation | < 5 detik |
| AI Review | < 30 detik |
| Editorial | < 1 hari |
| Academic | < 3 hari |
| Approval | < 1 hari |
| Publish | < 5 detik |

---

# 17. Review History

Setiap review disimpan.

Field:

- reviewer_id
- role
- action
- decision
- comment
- created_at

Review history bersifat immutable.

---

# 18. Escalation

Jika review melebihi SLA.

```
Pending

↓

Reminder

↓

Escalation

↓

Admin Notification
```

---

# 19. Notifications

Event

↓

Recipient

Draft Submitted

→ Editor

Editorial Completed

→ Reviewer

Review Approved

→ Approver

Revision Requested

→ Creator

Published

→ Analytics

Archived

→ CBT

---

# 20. Database Mapping

Workflow menggunakan tabel berikut.

```
question_review

question_review_history

question_review_comment

question_version

question_audit_log

notification_queue

background_job

```

---

# 21. Domain Events

```
QuestionSubmitted

ValidationPassed

ValidationFailed

AIReviewCompleted

EditorialCompleted

AcademicApproved

AcademicRejected

RevisionRequested

QuestionApproved

QuestionPublished

QuestionArchived

```

---

# 22. Failure Recovery

Jika salah satu proses gagal.

Validation

↓

Rollback

↓

Draft

AI Review gagal

↓

Retry Background Job

Editorial gagal

↓

Need Revision

Academic gagal

↓

Rejected

Publish gagal

↓

Rollback

↓

Approved

---

# 23. Security Rules

Creator tidak boleh mereview soal miliknya sendiri.

Reviewer tidak boleh menjadi Approver untuk review yang sama.

Approver tidak boleh mengubah isi soal.

Publisher tidak boleh melewati Approval.

Seluruh perubahan wajib menghasilkan Audit Log.

---

# 24. Audit Trail

Seluruh aktivitas dicatat.

Contoh:

Create

↓

Submit

↓

Validation

↓

AI Review

↓

Editorial

↓

Academic

↓

Approval

↓

Publish

↓

Archive

Tidak ada aktivitas yang boleh dihapus dari riwayat.

---

# 25. Future Workflow

Roadmap:

- Multi-Level Approval
- Blind Review
- Double Blind Review
- Collaborative Review
- AI Auto Review
- AI Bias Detection
- AI Fact Checking
- Copyright Verification
- Curriculum Verification
- Reviewer Scoring
- Reviewer Performance Dashboard
- Auto Assignment Reviewer
- Review Load Balancing
- Question Certification
````

---

# Rekomendasi Penyempurnaan

Setelah menyelesaikan beberapa dokumen pertama, mulai terlihat satu pola yang bisa membuat arsitektur YakinLulus.id jauh lebih kuat.

Saat ini kita memiliki:

* `Question`
* `QuestionVersion`
* `Review`
* `Metadata`
* `Attachment`
* `Embedding`

Saya menyarankan **jangan jadikan `QuestionReview` sebagai satu tabel sederhana**.

Lebih baik gunakan pola berikut:

```text
Question
    │
    ├── QuestionReview
    │      (1 record per review cycle)
    │
    ├── QuestionReviewStep
    │      (Validation, AI, Editorial, Academic, Approval)
    │
    ├── QuestionReviewComment
    │
    ├── QuestionReviewAttachment
    │
    └── QuestionReviewHistory
```

Dengan pendekatan ini:

* satu soal dapat melalui beberapa siklus review tanpa kehilangan riwayat;
* setiap tahap review memiliki status, komentar, dan SLA sendiri;
* dashboard reviewer, metrik kualitas, dan audit menjadi jauh lebih mudah dibuat;
* lebih mudah mendukung fitur masa depan seperti **parallel review**, **blind review**, atau **multi-reviewer consensus** tanpa mengubah model data inti.

Saya sangat merekomendasikan struktur ini sebelum kita masuk ke **08_question_versioning.md**, karena versioning dan review akan saling berkaitan erat.
