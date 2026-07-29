```markdown id="h7m3qx"
# 12_engineering_implementation_guide/cbt_engine/02_exam_lifecycle.md

# Exam Lifecycle Architecture

## 1. Tujuan

Dokumen ini menjelaskan lifecycle management pada CBT Engine YakinLulus.id.

Exam lifecycle mendefinisikan seluruh perjalanan sebuah ujian mulai dari:

- pembuatan exam;
- konfigurasi;
- publikasi;
- pelaksanaan;
- evaluasi;
- penyimpanan hasil;
- pengarsipan.


Lifecycle yang jelas diperlukan agar:

- status ujian konsisten;
- business rule mudah diterapkan;
- audit trail tersedia;
- integritas ujian terjaga.


---

# 2. Exam Lifecycle Concept


Setiap exam memiliki state machine.


```

Draft

|

Configured

|

Published

|

Scheduled

|

Running

|

Completed

|

Archived

```id="a8j4mp"


Tidak semua state dapat dilewati secara bebas.


---

# 3. Exam Lifecycle Architecture


```

```
          Exam Management


                |

          Exam Definition


                |

          Lifecycle Engine


                |

    +-----------+------------+

    |                        |
```

CBT Runtime              Analytics

```
    |

Result Storage
```

```id="m7x2kd"


---

# 4. Exam State Machine


Diagram:


```

```
                +-------+
                | DRAFT |
                +-------+
                    |
                    |
              Configure Exam
                    |
                    v

            +---------------+
            | CONFIGURED    |
            +---------------+

                    |
                    |
               Publish
                    |
                    v

            +---------------+
            | PUBLISHED     |
            +---------------+

                    |
                    |
              Schedule Time
                    |
                    v

            +---------------+
            | SCHEDULED     |
            +---------------+

                    |
                    |
             Start Exam
                    |
                    v

            +---------------+
            | RUNNING       |
            +---------------+

                    |
                    |
            End / Submit
                    |
                    v

            +---------------+
            | COMPLETED     |
            +---------------+

                    |
                    |
              Archive
                    |
                    v

            +---------------+
            | ARCHIVED      |
            +---------------+
```

```id="q8k2vz"


---

# 5. Exam State Definition


## DRAFT


Kondisi:


```

Exam Created

Configuration Not Complete

Not Visible

```id="p9q3wf"


Action:


Allowed:

```

Edit

Delete

Configure

```id="w2y7mt"


---

## CONFIGURED


Kondisi:


```

Exam Rule Completed

Question Pool Ready

Duration Defined

```id="d4q9xs"


Validation:


```

Question Count

Duration

Scoring Rule

Access Rule

```id="r5n8kh"


---

## PUBLISHED


Kondisi:


```

Exam Available

Student Can See

Registration Allowed

```id="x1k7pv"


Tidak boleh:


```

Change Critical Configuration

Remove Questions

```id="w9p2zc"


---

## SCHEDULED


Kondisi:


```

Exam Has Start Time

Exam Has End Time

```id="b6m4yt"


Contoh:


```

Start:

08:00

End:

10:00

```id="e4j8qm"


---

## RUNNING


Kondisi:


```

Exam Session Active

Student Taking Exam

```id="n2q7vx"


Critical:


```

Timer Active

Question Locked

Answer Accepted

```id="k8m5sd"


---

## COMPLETED


Kondisi:


```

Exam Finished

Submission Closed

Scoring Completed

```id="v7x3mp"


---

## ARCHIVED


Kondisi:


```

Exam No Longer Active

Historical Data Preserved

```id="c4m8qz"


---

# 6. Exam Lifecycle Actor


Actor:


```

Super Admin

Admin

Teacher

Student

System Worker

```id="p5n7yx"


---

# 7. Lifecycle Permission Matrix


| Action | Admin | Teacher | Student |
|-|-|-|-|
| Create Exam | ✅ | ✅ | ❌ |
| Edit Draft | ✅ | ✅ | ❌ |
| Publish | ✅ | Optional | ❌ |
| Start Exam | System | System | Join |
| Submit | ❌ | ❌ | ✅ |
| Archive | ✅ | ❌ | ❌ |


---

# 8. Exam Creation Flow


```

Teacher/Admin

```
  |
```

Create Exam

```
  |
```

Set Metadata

```
  |
```

Configure Rules

```
  |
```

Select Question Pool

```
  |
```

Validate

```
  |
```

Save Draft

```id="z4p7nw"


---

# 9. Exam Configuration


Configuration:


```

Exam Duration

Question Count

Passing Score

Randomization Rule

Navigation Rule

Attempt Limit

Result Visibility

```id="y3m9vx"


---

# 10. Publish Validation


Sebelum publish:


System melakukan:


```

Check Question Availability

```
    |
```

Check Configuration

```
    |
```

Check Schedule

```
    |
```

Check Permission

```
    |
```

Publish

```id="j6x2mq"


---

# 11. Exam Execution Lifecycle


Saat waktu mulai:


```

Scheduler

|

Activate Exam

|

Allow Student Access

|

Create Session

|

Start Runtime

```id="k9m4pw"


---

# 12. Student Exam Lifecycle


Student:


```

Open Exam

|

Authentication

|

Eligibility Check

|

Create Session

|

Generate Questions

|

Start Timer

|

Answer

|

Submit

|

Receive Result

```id="x8v2qn"


---

# 13. Session Relationship


Satu exam:


```

Exam

|

has many

|

Exam Sessions

```id="q3m7vx"


Contoh:


```

UTBK Simulation

|

* Student A Session

* Student B Session

* Student C Session

```id="n5k9qw"


---

# 14. Lifecycle Event


Setiap perubahan state menghasilkan event.


Contoh:


```

ExamCreated

ExamPublished

ExamStarted

ExamCompleted

ExamArchived

```id="h2p8mv"


Event digunakan untuk:


- notification;
- analytics;
- audit;
- automation.


---

# 15. Audit Trail


Semua perubahan dicatat:


```

exam_id

old_status

new_status

changed_by

timestamp

reason

```id="j7q4mz"


---

# 16. Invalid Transition Handling


Contoh:


Tidak boleh:


```

DRAFT

langsung

COMPLETED

```id="w6m8xp"


System:


```

Reject Request

Return Error

Log Attempt

```id="s3k9vx"


---

# 17. Database Implementation


Contoh:


Table:


```

exam.exams

````id="z5m7qp"


Column:


```sql
status VARCHAR(20)
````

Enum:

````
DRAFT

CONFIGURED

PUBLISHED

SCHEDULED

RUNNING

COMPLETED

ARCHIVED

``` id="v8n3ky"


---

# 18. Background Worker Integration


Worker menangani:


````

Schedule Checker

```
    |
```

Activate Exam

```
    |
```

Close Exam

```
    |
```

Trigger Scoring

```id="x9p5mb"


---

# 19. Failure Handling


Jika worker gagal:


```

Retry Job

|

Check State

|

Resume Lifecycle

```id="c7m2qx"


---

# 20. Scalability Strategy


## Phase 1


```

Single Lifecycle Service

Database State Machine

Background Worker

```id="m8q4nz"


---

## Phase 2


```

Dedicated Scheduler

Event Queue

Distributed Worker

```id="q5x8pv"


---

## Phase 3


```

CBT Runtime Service

Event Driven Lifecycle

Independent Exam Domain

```id="t4m9xz"


---

# Summary


Exam lifecycle YakinLulus.id menggunakan:


```

Explicit State Machine

*

Controlled Transition

*

Event Driven Action

*

Audit Trail

*

Automation Worker

```


Dengan lifecycle architecture ini, proses ujian dapat berjalan konsisten dari pembuatan sampai evaluasi tanpa state conflict.
```
