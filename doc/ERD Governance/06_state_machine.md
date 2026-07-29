# YakinLulus.id

# 05_state_machine.md

Version : 1.0

Status : Draft

---

# Purpose

Dokumen ini mendefinisikan seluruh lifecycle (state machine) setiap entity utama pada platform YakinLulus.

State Machine bertujuan untuk:

- Menjaga konsistensi data
- Mengontrol perubahan data
- Mendukung audit trail
- Menentukan validasi bisnis
- Menjadi acuan implementasi Service Layer

State Machine berada di level Business Logic, bukan Database.

Database hanya menyimpan current_state.

---

# General Principles

## Rule 1

Setiap Entity hanya memiliki SATU Current State.

---

## Rule 2

Perubahan state hanya boleh melalui Business Service.

Tidak boleh diubah langsung menggunakan SQL.

---

## Rule 3

Setiap perubahan state harus dicatat pada Audit Log.

---

## Rule 4

State bersifat domain-specific.

Tidak menggunakan kolom status generik.

Contoh:

question_state

exam_state

user_state

media_state

resource_state

---

# State Legend

Draft

Entity baru dibuat.

↓

Review

Sedang diperiksa.

↓

Approved

Lolos validasi.

↓

Published

Sudah digunakan.

↓

Archived

Tidak aktif.

↓

Deleted

Soft Delete.

---

====================================================

QUESTION

====================================================

Column

question_state

Possible States

Draft

Review

Revision

Approved

Published

Archived

Deleted

Workflow

Draft

↓

Review

↓

Revision

↓

Review

↓

Approved

↓

Published

↓

Archived

↓

Deleted

Business Rules

Draft

Boleh diedit.

Review

Tidak boleh diedit oleh Author.

Revision

Kembali ke Author.

Approved

Menunggu Publish.

Published

Tidak boleh diubah isi.

Jika ingin mengubah harus membuat Version baru.

Archived

Tidak muncul pada pencarian normal.

Deleted

Soft Delete.

---

====================================================

QUESTION VERSION

====================================================

State

Draft

Approved

Published

Archived

Business Rules

Satu Question hanya boleh memiliki satu Published Version.

---

====================================================

LEARNING RESOURCE

====================================================

Column

resource_state

States

Draft

Review

Revision

Approved

Published

Archived

Deleted

Business Rules

Published tidak boleh diubah.

Perubahan menghasilkan Version baru.

---

====================================================

MEDIA

====================================================

Column

media_state

States

Uploading

Uploaded

Processing

Ready

Failed

Archived

Deleted

Workflow

Uploading

↓

Uploaded

↓

Processing

↓

Ready

↓

Archived

↓

Deleted

Jika gagal

↓

Failed

↓

Retry

↓

Processing

---

====================================================

EXAM

====================================================

Column

exam_state

States

Draft

Scheduled

Published

Running

Paused

Completed

Archived

Cancelled

Workflow

Draft

↓

Scheduled

↓

Published

↓

Running

↓

Paused

↓

Running

↓

Completed

↓

Archived

Cancelled dapat dilakukan sebelum Running.

Business Rules

Running

Tidak boleh mengubah soal.

Completed

Tidak boleh mengubah blueprint.

Archived

Read Only.

---

====================================================

EXAM SESSION

====================================================

Column

session_state

States

Waiting

Started

Running

Submitted

Finished

Expired

Cancelled

Business Rules

Submitted tidak dapat dibuka kembali.

Expired otomatis dihitung sistem.

---

====================================================

ATTEMPT

====================================================

Column

attempt_state

States

Started

In Progress

Submitted

Scoring

Finished

Invalid

Business Rules

Submitted tidak boleh diedit.

---

====================================================

LEARNING SESSION

====================================================

Column

learning_state

States

Started

Paused

Completed

Abandoned

Business Rules

Completed menghasilkan Progress.

---

====================================================

USER

====================================================

Column

user_state

States

Pending

Active

Suspended

Locked

Archived

Deleted

Workflow

Pending

↓

Active

↓

Suspended

↓

Active

↓

Locked

↓

Archived

↓

Deleted

Business Rules

Locked

Login ditolak.

Suspended

Masih tersimpan.

Deleted

Soft Delete.

---

====================================================

ORGANIZATION

====================================================

Column

organization_state

States

Draft

Active

Inactive

Archived

Deleted

---

====================================================

CLASSROOM

====================================================

States

Planning

Open

Running

Closed

Archived

---

====================================================

AI JOB

====================================================

Column

job_state

States

Queued

Running

Completed

Failed

Cancelled

Retrying

Workflow

Queued

↓

Running

↓

Completed

atau

↓

Failed

↓

Retrying

↓

Running

---

====================================================

IMPORT JOB

====================================================

Column

import_state

States

Queued

Validating

Importing

Completed

Partial Success

Failed

Cancelled

Business Rules

Partial Success berarti sebagian data berhasil diproses.

---

====================================================

EXPORT JOB

====================================================

States

Queued

Generating

Completed

Failed

Expired

---

====================================================

ANALYTICS REPORT

====================================================

States

Pending

Generating

Ready

Expired

Deleted

---

====================================================

NOTIFICATION

====================================================

States

Queued

Sending

Delivered

Read

Failed

Cancelled

---

====================================================

BACKGROUND JOB

====================================================

States

Queued

Running

Completed

Retry

Failed

Cancelled

---

# Common Transition Rules

1. Draft hanya dapat berpindah ke Review atau Deleted.

2. Review dapat berpindah ke Revision atau Approved.

3. Published tidak boleh kembali ke Draft.

4. Archived tidak boleh kembali menjadi Published.

5. Deleted adalah terminal state.

6. Running tidak boleh dihapus.

7. Completed bersifat immutable.

8. Failed dapat di-Retry jika diizinkan.

---

# State Transition Authorization

| Entity | Transition | Allowed Role |
|---------|------------|--------------|
| Question | Draft → Review | Author |
| Question | Review → Approved | Reviewer |
| Question | Approved → Published | Admin / Publisher |
| Question | Published → Archived | Admin |
| Learning Resource | Draft → Review | Author |
| Learning Resource | Review → Approved | Reviewer |
| Learning Resource | Approved → Published | Admin |
| Exam | Draft → Scheduled | Guru / Admin |
| Exam | Scheduled → Published | Guru / Admin |
| Exam | Published → Running | System |
| Exam | Running → Completed | System |
| User | Pending → Active | System / Admin |
| User | Active → Suspended | Admin |

---

# Audit Requirements

Setiap perubahan state wajib mencatat:

- entity_id
- entity_type
- previous_state
- new_state
- changed_by
- changed_at
- reason (optional)
- ip_address (optional)
- user_agent (optional)

---

# Design Principles

1. Setiap entity memiliki state machine sendiri.

2. State tidak dibagikan antar domain.

3. State berubah melalui Service Layer.

4. State transition harus tervalidasi.

5. Setiap transisi wajib diaudit.

6. Terminal state tidak boleh berubah kembali kecuali melalui proses khusus yang terdokumentasi.

7. State machine harus independen dari implementasi UI.

8. Workflow dapat diotomatisasi oleh scheduler atau background job tanpa melanggar aturan transisi.