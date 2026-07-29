Berikut **10_cbt_runtime_database_schema / 03_index_strategy.md**.

Dokumen ini mendefinisikan strategi indexing PostgreSQL untuk **CBT Runtime Database**.

Berbeda dengan Exam Database yang dominan read/query management, CBT Runtime memiliki karakteristik:

* write intensive;
* latency sensitive;
* concurrent session tinggi;
* transaksi jawaban real-time.

---

````markdown id="cbt03index"
# 03_index_strategy.md

# YakinLulus.id CBT Runtime Index Strategy

Module : CBT Runtime Database Schema  
Version : 1.0  
Database : PostgreSQL 16+

---

# 1. Overview

Index strategy CBT Runtime dirancang untuk:

- mempercepat loading session;
- mempercepat delivery soal;
- mempercepat autosave jawaban;
- mendukung offline synchronization;
- menjaga latency rendah saat ujian berlangsung.

---

# 2. Index Design Principle

CBT Runtime menggunakan prinsip:

```
Read Optimization

+

Write Efficiency

+

Low Latency

+

High Concurrency
```

---

# 3. Critical Query Pattern

Query paling sering:

```
1. Find active session

2. Load questions

3. Load timer

4. Save answer

5. Sync offline data

6. Submit exam

7. Audit activity
```

---

# 4. cbt_sessions Index

Table:

```
cbt_runtime.cbt_sessions
```

---

# 4.1 User Active Session

Query:

```sql
SELECT *
FROM cbt_sessions
WHERE user_id=?
AND status='RUNNING';
```

Index:

```sql
CREATE INDEX idx_cbt_session_user_status
ON cbt_runtime.cbt_sessions
(
    user_id,
    status
);
```

---

# 4.2 Exam Session Lookup

Query:

```
Find all participants
```

Index:

```sql
CREATE INDEX idx_cbt_session_exam
ON cbt_runtime.cbt_sessions
(
    exam_id
);
```

---

# 4.3 Session Token Lookup

Digunakan ketika request API.

```sql
CREATE UNIQUE INDEX idx_cbt_session_token
ON cbt_runtime.cbt_sessions
(
    session_token
);
```

---

# 4.4 Active Session Partial Index

Untuk query runtime.

```sql
CREATE INDEX idx_active_cbt_session
ON cbt_runtime.cbt_sessions
(
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

# 5. Session Question Index

Table:

```
cbt_session_questions
```

---

Critical table CBT.

---

# 5.1 Load Question Sequence

Query:

```sql
SELECT *
FROM cbt_session_questions
WHERE session_id=?
ORDER BY sequence_number;
```

Index:

```sql
CREATE INDEX idx_cbt_question_sequence
ON cbt_runtime.cbt_session_questions
(
    session_id,
    sequence_number
);
```

---

# 5.2 Question Status

Untuk progress:

```sql
CREATE INDEX idx_cbt_question_status
ON cbt_runtime.cbt_session_questions
(
    session_id,
    question_status
);
```

---

# 6. Answer Index

Table:

```
cbt_answers
```

---

Tabel dengan write paling tinggi.

---

# 6.1 Answer Lookup

Query:

```
Get answer by question
```

Index:

```sql
CREATE UNIQUE INDEX idx_answer_question
ON cbt_runtime.cbt_answers
(
    session_question_id
);
```

---

# 6.2 Session Answer Summary

Query:

```
Calculate progress
```

Index:

```sql
CREATE INDEX idx_answer_session
ON cbt_runtime.cbt_answers
(
    session_id
);
```

---

# 6.3 Sync Pending Answer

Query:

```
WHERE is_synced=false
```

Index:

```sql
CREATE INDEX idx_unsynced_answer
ON cbt_runtime.cbt_answers
(
    is_synced
)
WHERE is_synced=false;
```

---

# 7. Timer State Index

Table:

```
cbt_timer_states
```

---

Karena one session one timer.

Index:

```sql
CREATE UNIQUE INDEX idx_timer_session
ON cbt_runtime.cbt_timer_states
(
    session_id
);
```

---

# 8. Navigation State Index

Table:

```
cbt_navigation_states
```

---

Index:

```sql
CREATE UNIQUE INDEX idx_navigation_session
ON cbt_runtime.cbt_navigation_states
(
    session_id
);
```

---

# 9. Sync Queue Index

Table:

```
cbt_sync_queue
```

---

High volume table.

---

# 9.1 Processing Queue

Worker query:

```sql
SELECT *
FROM cbt_sync_queue
WHERE sync_status='PENDING';
```

Index:

```sql
CREATE INDEX idx_sync_pending
ON cbt_runtime.cbt_sync_queue
(
    sync_status,
    created_at
);
```

---

# 9.2 Session Sync

```sql
CREATE INDEX idx_sync_session
ON cbt_runtime.cbt_sync_queue
(
    session_id,
    created_at
);
```

---

# 10. Event Index

Table:

```
cbt_events
```

---

High growth.

---

# 10.1 Session Timeline

Query:

```
Show activity history
```

Index:

```sql
CREATE INDEX idx_cbt_event_session_time
ON cbt_runtime.cbt_events
(
    session_id,
    created_at
);
```

---

# 10.2 Event Analytics

```sql
CREATE INDEX idx_cbt_event_type
ON cbt_runtime.cbt_events
(
    event_type,
    created_at
);
```

---

# 11. Security Log Index

Table:

```
cbt_security_logs
```

---

# 11.1 Fraud Monitoring

```sql
CREATE INDEX idx_security_session
ON cbt_runtime.cbt_security_logs
(
    session_id,
    created_at
);
```

---

# 11.2 Severity Monitoring

```sql
CREATE INDEX idx_security_severity
ON cbt_runtime.cbt_security_logs
(
    severity
);
```

---

# 12. Device Tracking Index

Table:

```
cbt_session_devices
```

---

```sql
CREATE INDEX idx_device_session
ON cbt_runtime.cbt_session_devices
(
    session_id
);
```

---

# 13. Progress State Index

Table:

```
cbt_progress_states
```

---

```sql
CREATE UNIQUE INDEX idx_progress_session
ON cbt_runtime.cbt_progress_states
(
    session_id
);
```

---

# 14. JSONB Index Strategy

Kolom:

```
payload

metadata

option_order

visited_questions
```

---

Gunakan:

```sql
GIN INDEX
```

---

Example:

```sql
CREATE INDEX idx_event_payload
ON cbt_runtime.cbt_events
USING GIN(payload);
```

---

# 15. Partition Index Strategy

Candidate:

```
cbt_answers

cbt_events

cbt_security_logs
```

---

Partition key:

```
created_at
```

---

Index:

```
(session_id, created_at)
```

---

# 16. Hot Data Optimization

Hot tables:

```
cbt_sessions

cbt_timer_states

cbt_navigation_states
```

---

Recommended:

```
Keep in memory cache

+

PostgreSQL persistence
```

---

# 17. Redis Complement

Redis menyimpan:

```
active session

timer countdown

current question

progress
```

---

PostgreSQL menyimpan:

```
source of truth
```

---

# 18. Index Maintenance

Monitoring:

```sql
pg_stat_user_indexes
```

---

Check:

```
index usage

unused index

index size

bloat
```

---

# 19. Performance Target

## Find Session

```
<50ms
```

---

## Load Questions

```
<100ms
```

---

## Save Answer

```
<50ms
```

---

## Sync Queue Processing

```
batch processing
```

---

# 20. Final Index Architecture

```
cbt_sessions

 ├── user_id,status
 ├── exam_id
 └── session_token


cbt_session_questions

 └── session_id,sequence_number


cbt_answers

 ├── session_question_id
 └── session_id


cbt_events

 └── session_id,created_at


cbt_sync_queue

 └── sync_status,created_at

```

---

# 21. Conclusion

Index strategy CBT Runtime difokuskan pada:

```
Ultra Low Latency

+

Concurrent Exam Execution

+

Reliable Answer Storage

+

Fast Synchronization

```

Dengan strategi ini CBT Runtime siap berkembang dari:

```
10 pengguna MVP

hingga

ribuan concurrent peserta ujian.
```

````

---

