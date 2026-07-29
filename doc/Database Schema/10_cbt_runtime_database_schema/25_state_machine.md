Berikut **25_state_machine.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini mendefinisikan state machine pada CBT Runtime, terutama lifecycle exam session, question state, answer state, scoring state, dan synchronization state.

```markdown
# 25_state_machine.md

# YakinLulus.id CBT State Machine Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

State Machine mendefinisikan seluruh perubahan status yang terjadi selama lifecycle CBT.

Tujuan:

- memastikan transisi status konsisten;
- mencegah kondisi ilegal;
- mempermudah debugging;
- menjadi dasar implementasi backend;
- mendukung event-driven architecture.

---

# 2. State Machine Principle


Setiap entity memiliki:


```

Current State

*

Allowed Transition

*

Trigger Event

*

Next State

```


Contoh:


```

CREATED

|

START_EXAM

|

RUNNING

```

---

# 3. Core State Machines


CBT Runtime memiliki beberapa state machine:


```

1. Exam Session State

2. Question State

3. Answer State

4. Submission State

5. Scoring State

6. Synchronization State

7. Result State

```

---

# 4. Exam Session State Machine


Entity:


```

exam_session

```


---

## States


```

CREATED

READY

RUNNING

PAUSED

SUBMITTED

SCORING

COMPLETED

EXPIRED

CANCELLED

```


---

## State Diagram


```

```
         CREATED

            |

            |

          READY

            |

            |

         RUNNING

      /      |      \

     /       |       \

    v        v        v


 PAUSED   SUBMITTED  EXPIRED


    |

    |

 RUNNING


            |

            |

         SCORING

            |

            |

        COMPLETED
```

```


---

# 5. Exam Session Transition Rules


## CREATED → READY


Trigger:


```

Exam Preparation Complete

```


Validation:


```

Question Snapshot Exists

Configuration Valid

```


---

## READY → RUNNING


Trigger:


```

Student Start Exam

```


Process:


```

Create Runtime Session

Start Timer

Load Question

```


---

## RUNNING → PAUSED


Trigger:


```

Temporary Pause

```


Example:


```

Connection Lost

System Pause

```


---

## PAUSED → RUNNING


Trigger:


```

Resume Exam

```


Validation:


```

Session Still Valid

Time Remaining Available

```


---

## RUNNING → SUBMITTED


Trigger:


```

Student Submit

```


Process:


```

Lock Answer

Stop Timer

Create Scoring Job

```


---

## RUNNING → EXPIRED


Trigger:


```

Timer End

```


Process:


```

Auto Submit

```


---

## SUBMITTED → SCORING


Trigger:


```

Scoring Worker Started

```


---

## SCORING → COMPLETED


Trigger:


```

Result Generated

```


---

# 6. Question State Machine


Entity:


```

exam_question_instance

```


---

## States


```

NOT_VISITED

VISITED

ANSWERED

FLAGGED

REVIEWED

LOCKED

```


---

## Diagram


```

NOT_VISITED

```
  |

  |
```

QUESTION_OPENED

```
  |

  v
```

VISITED

```
  |

  |
```

ANSWER_SELECTED

```
  |

  v
```

ANSWERED

```
  |

  |
```

FLAG

```
  |

  v
```

FLAGGED

```
  |

  |
```

SUBMIT

```
  |

  v
```

LOCKED

```


---

# 7. Question Transition Rules


## NOT_VISITED → VISITED


Trigger:


```

Student Open Question

```


---

## VISITED → ANSWERED


Trigger:


```

Student Select Option

```


---

## ANSWERED → FLAGGED


Trigger:


```

Mark For Review

```


---

## FLAGGED → ANSWERED


Trigger:


```

Remove Flag

```


---

## ANSWERED → LOCKED


Trigger:


```

Exam Submit

```


---

# 8. Answer State Machine


Entity:


```

student_answer

```


---

## States


```

EMPTY

DRAFT

SAVED

SYNCED

FINAL

LOCKED

```


---

## Diagram


```

EMPTY

|

|

INPUT

|

v

DRAFT

|

|

SAVE

|

v

SAVED

|

|

SYNC

|

v

SYNCED

|

|

SUBMIT

|

v

FINAL

|

|

LOCK

|

v

LOCKED

```


---

# 9. Answer Transition Rules


## EMPTY → DRAFT


Trigger:


```

Student Select Answer

```


---

## DRAFT → SAVED


Trigger:


```

Autosave

```


---

## SAVED → SYNCED


Trigger:


```

Server Receive Data

```


---

## SYNCED → FINAL


Trigger:


```

Exam Submit

```


---

# 10. Submission State Machine


Entity:


```

exam_submission

```


---

States:


```

PENDING

VALIDATING

ACCEPTED

REJECTED

PROCESSING

COMPLETED

```


---

Diagram:


```

PENDING

|

|

VALIDATING

|

+------------+

|            |

v            v

ACCEPTED     REJECTED

|

|

PROCESSING

|

|

COMPLETED

```


---

# 11. Scoring State Machine


Entity:


```

score_result

```


---

States:


```

WAITING

PROCESSING

CALCULATED

VERIFIED

PUBLISHED

RECALCULATED

```


---

Diagram:


```

WAITING

|

|

PROCESSING

|

|

CALCULATED

|

|

VERIFIED

|

|

PUBLISHED

```


---

Recalculation:


```

PUBLISHED

```
|

|
```

RECALCULATED

```
|

|
```

PUBLISHED

```


---

# 12. Synchronization State Machine


Entity:


```

sync_event

```


---

States:


```

LOCAL

QUEUED

SENDING

RECEIVED

VALIDATED

APPLIED

FAILED

```


---

Diagram:


```

LOCAL

|

|

QUEUED

|

|

SENDING

|

|

RECEIVED

|

|

VALIDATED

|

|

APPLIED

```


Failure:


```

SENDING

|

|

FAILED

|

|

RETRY

```


---

# 13. Timer State Machine


Entity:


```

exam_timer

```


---

States:


```

INITIALIZED

RUNNING

WARNING

PAUSED

EXPIRED

STOPPED

```


---

Diagram:


```

INITIALIZED

```
  |

  |
```

RUNNING

```
  |

  |
```

WARNING

```
  |

  |
```

EXPIRED

```


---

# 14. Randomization State Machine


Entity:


```

exam_snapshot

```


---

States:


```

CREATED

GENERATING

GENERATED

LOCKED

ARCHIVED

```


---

Diagram:


```

CREATED

|

|

GENERATING

|

|

GENERATED

|

|

LOCKED

|

|

ARCHIVED

```


---

# 15. Event State Machine


Entity:


```

event_log

```


---

States:


```

CREATED

STORED

PUBLISHED

CONSUMED

PROCESSED

FAILED

```


---

# 16. Invalid Transition Handling


Contoh:


Tidak boleh:


```

COMPLETED

```
  |

  |
```

RUNNING

```


Action:


```

Reject Request

Create Error Log

Create Security Event

```


---

# 17. State Validation Layer


Setiap perubahan state harus melewati:


```

State Validator

```


Flow:


```

Request

|

Current State Check

|

Allowed Transition?

|

Update State

|

Create Event

```


---

# 18. Database Implementation


Setiap tabel memiliki:


```

status

created_at

updated_at

```


Untuk critical entity:


tambahkan:


```

state_history

```


---

# 19. State History


Table:


```

state_transitions

```


Fields:


| Field | Description |
|-|-|
| entity_type | Object |
| entity_id | Object ID |
| from_state | Previous |
| to_state | New |
| trigger | Event |
| actor_id | User |
| timestamp | Time |

---

# 20. State Machine Integration


Terhubung dengan:


```

Event Architecture

Audit Log

Error Handling

Background Jobs

Security Layer

```


---

# 21. Benefits


State Machine memberikan:


```

Predictable Flow

Data Integrity

Easier Testing

Clear Business Rules

Better Debugging

```


---

# 22. Future Enhancement


Support:


```

Workflow Engine

Visual State Designer

Formal Verification

AI Anomaly Detection

```


---

# 23. Final Architecture


```

```
          CBT Runtime


               |

               |

        State Controller


               |

   +-----------+-----------+

   |           |           |

   v           v           v


Session    Answer     Scoring


   |           |           |

   +-----------+-----------+

               |

               v


          Event System


               |

               v


          Audit System
```

```


---

# 24. Conclusion


State Machine memastikan CBT Runtime YakinLulus.id:

- memiliki lifecycle yang jelas;
- mencegah perubahan status ilegal;
- mudah dikembangkan;
- mudah diaudit;
- siap untuk sistem ujian skala besar.


Dengan desain ini:

```

Simple CBT

```
  |

  v
```

School Assessment

```
  |

  v
```

Large Scale Examination Platform

```
```

