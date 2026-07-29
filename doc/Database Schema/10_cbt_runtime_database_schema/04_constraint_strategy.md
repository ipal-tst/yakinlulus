Berikut **10_cbt_runtime_database_schema / 04_constraint_strategy.md**.

Dokumen ini mendefinisikan aturan integritas database untuk CBT Runtime.

Fokus constraint:

* menjaga session state;
* mencegah manipulasi jawaban;
* menjaga konsistensi offline sync;
* memastikan data ujian immutable;
* melindungi audit trail.

---

````markdown id="cbt04constraint"
# 04_constraint_strategy.md

# YakinLulus.id CBT Runtime Constraint Strategy

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Constraint strategy CBT Runtime memastikan:

- session valid;
- question snapshot konsisten;
- answer tidak corrupt;
- sync tidak duplicate;
- event audit dapat dipercaya.

---

# 2. Constraint Category

Constraint dibagi menjadi:

```
Primary Key

Foreign Key

Unique Constraint

Check Constraint

Trigger Constraint

Immutable Constraint

State Transition Constraint
```

---

# 3. Primary Key Strategy

Semua tabel menggunakan:

```
UUID
```

---

Example:

```sql
id UUID PRIMARY KEY
DEFAULT uuid_generate_v4()
```

---

Alasan:

- aman untuk distributed system;
- mendukung offline generation;
- tidak expose sequence database.

---

# 4. Foreign Key Strategy

CBT Runtime memiliki reference:

```
exam_id

user_id

session_id

question_version_id
```

---

Namun tidak semua dibuat FK.

---

# 5. Cross Domain Reference Policy

Tidak membuat FK langsung ke:

```
exam.exams

question_bank.question_versions

users.users
```

---

Alasan:

CBT Runtime merupakan bounded context.

Validasi dilakukan:

```
API Layer

+

Service Layer

+

Event Validation
```

---

# 6. cbt_sessions Constraint

Table:

```
cbt_sessions
```

---

## Required Fields

Wajib:

```
exam_id

user_id

session_token

status
```

---

## Attempt Validation

```sql
CHECK(
attempt_number > 0
)
```

---

## Session Status

Allowed:

```
CREATED

INITIALIZED

RUNNING

PAUSED

SUBMITTED

COMPLETED

EXPIRED
```

---

## Duplicate Active Session Prevention

User tidak boleh memiliki:

```
2 active session
```

untuk exam yang sama.

---

Partial Unique Index:

```sql
CREATE UNIQUE INDEX uq_active_session
ON cbt_runtime.cbt_sessions
(
exam_id,
user_id
)
WHERE status IN
(
'INITIALIZED',
'RUNNING',
'PAUSED'
);
```

---

# 7. Session Time Constraint

Rule:

```
finished_at >= started_at
```

---

SQL:

```sql
CHECK
(
finished_at IS NULL

OR

finished_at >= started_at
)
```

---

# 8. Session Token Constraint

Session token harus unik.

---

```sql
UNIQUE(session_token)
```

---

Tujuan:

Mencegah:

```
Session Hijacking

Token Collision
```

---

# 9. Session Question Constraint

Table:

```
cbt_session_questions
```

---

## Required

```
session_id

question_version_id

sequence_number
```

---

## Sequence Unique

Satu session:

```
Question number
```

tidak boleh duplicate.

---

```sql
UNIQUE
(
session_id,
sequence_number
)
```

---

# 10. Question Order Validation

Sequence harus positif.

---

```sql
CHECK(
sequence_number > 0
)
```

---

# 11. Answer Constraint

Table:

```
cbt_answers
```

---

## One Answer Per Question

Current state:

```sql
UNIQUE
(
session_question_id
)
```

---

Artinya:

```
1 question

=

1 current answer
```

---

History perubahan:

disimpan pada:

```
cbt_events
```

---

# 12. Answer Value Validation

Untuk multiple choice:

Allowed:

```
A

B

C

D

E
```

---

Constraint:

```sql
CHECK
(
answer_value IN
(
'A',
'B',
'C',
'D',
'E'
)
)
```

---

Untuk future essay:

validation pindah ke:

```
Application Layer
```

---

# 13. Timer Constraint

Table:

```
cbt_timer_states
```

---

## One Timer Per Session

```sql
UNIQUE(session_id)
```

---

## Remaining Time

Tidak boleh negatif.

```sql
CHECK(
remaining_seconds >=0
)
```

---

## Duration

```sql
CHECK(
duration_seconds >0
)
```

---

# 14. Navigation Constraint

Table:

```
cbt_navigation_states
```

---

## One Navigation State

```sql
UNIQUE(session_id)
```

---

## Question Number

```sql
CHECK(
current_question_number >=1
)
```

---

# 15. Sync Queue Constraint

Table:

```
cbt_sync_queue
```

---

## Sync Status

Allowed:

```
PENDING

PROCESSING

SUCCESS

FAILED
```

---

## Version Validation

```sql
CHECK(
version >0
)
```

---

# 16. Prevent Duplicate Sync Event

Constraint:

```sql
UNIQUE
(
session_id,
event_type,
version
)
```

---

Tujuan:

Mencegah:

```
duplicate offline replay
```

---

# 17. Event Constraint

Table:

```
cbt_events
```

---

## Event Type Required

```sql
NOT NULL
```

---

## Event Timestamp

Tidak boleh:

```
future timestamp
```

---

Validation:

Application layer.

---

# 18. Security Log Constraint

Table:

```
cbt_security_logs
```

---

## Severity

Allowed:

```
LOW

MEDIUM

HIGH

CRITICAL
```

---

Constraint:

```sql
CHECK
(
severity IN
(
'LOW',
'MEDIUM',
'HIGH',
'CRITICAL'
)
)
```

---

# 19. Device Constraint

Table:

```
cbt_session_devices
```

---

## Unique Device Session

```sql
UNIQUE
(
session_id,
device_fingerprint
)
```

---

Tujuan:

Mendeteksi:

```
Multiple Device Login
```

---

# 20. Immutable Data Rule

Setelah:

```
SESSION SUBMITTED
```

Data berikut tidak boleh berubah:

```
cbt_session_questions

cbt_answers

cbt_events
```

---

Implementasi:

Trigger:

```
prevent_runtime_update_after_submit()
```

---

# 21. State Transition Constraint

Status tidak boleh berubah sembarangan.

---

Valid flow:

```
CREATED

↓

INITIALIZED

↓

RUNNING

↓

PAUSED

↓

RUNNING

↓

SUBMITTED

↓

COMPLETED
```

---

Invalid:

```
COMPLETED

↓

RUNNING
```

---

Implementasi:

Trigger:

```
validate_cbt_state_transition()
```

---

# 22. Submission Protection

Jika:

```
status='SUBMITTED'
```

maka:

Tidak boleh:

```
INSERT answer

UPDATE answer

DELETE answer
```

---

# 23. Offline Conflict Constraint

Sync harus memiliki:

```
higher version
```

---

Rule:

```
incoming_version >

stored_version
```

---

Jika tidak:

```
REJECT
```

---

# 24. Delete Policy

## Tidak boleh cascade:

```
cbt_sessions

cbt_answers

cbt_events
```

---

Karena:

```
Academic Record
```

---

## Boleh cascade:

```
temporary sync data
```

---

# 25. Trigger List

Required trigger:

```
validate_session_transition

prevent_submitted_update

validate_sync_version

generate_runtime_event

detect_duplicate_device
```

---

# 26. Constraint Layer Architecture

```
Client Validation

        |

API Validation

        |

Service Rule

        |

Database Constraint

        |

Audit Trigger

```

---

# 27. Performance Consideration

Constraint tidak boleh menyebabkan:

```
Full Table Scan

Heavy Lock

Blocking Transaction
```

---

Untuk tabel besar:

```
cbt_answers

cbt_events
```

gunakan:

```
partition aware constraint
```

---

# 28. Final Constraint Model

```
Session Integrity

        +

Question Integrity

        +

Answer Integrity

        +

Sync Integrity

        +

Audit Integrity

```

---

# 29. Conclusion

Constraint strategy CBT Runtime memastikan:

- ujian tidak dapat dimanipulasi;
- jawaban konsisten;
- offline sync aman;
- session lifecycle terkendali;
- audit akademik dapat dipercaya.

CBT Runtime siap digunakan sebagai engine
ujian berskala besar.
````

---

