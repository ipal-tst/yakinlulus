Berikut dokumen lengkap **13_timer_engine.md** dalam format yang siap disimpan ke project YakinLulus.id.

```markdown
# 13_timer_engine.md

# YakinLulus.id CBT Timer Engine Specification

Module : CBT Runtime Engine  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Timer Engine adalah komponen inti CBT Runtime yang bertanggung jawab terhadap seluruh mekanisme waktu ujian.

Fungsi utama:

- menghitung durasi ujian;
- menjaga sinkronisasi waktu;
- menampilkan countdown;
- mendeteksi waktu habis;
- melakukan auto submit;
- mendukung tambahan waktu;
- mendukung offline mode;
- mencegah manipulasi waktu.

Timer Engine harus menjamin bahwa waktu ujian bersifat:

```

Accurate

Consistent

Secure

Auditable

```

---

# 2. Design Principle

Prinsip utama:

```

Server is the Source of Truth

```

Artinya:

Client hanya bertugas:

```

Display Timer

Local Countdown

User Experience

```

Server bertanggung jawab:

```

Start Time

End Time

Remaining Time

Expiry Decision

Submission Trigger

```

---

# 3. Timer Architecture


```

```
              CBT Client

                  |

                  |

           Timer Display Layer

                  |

                  |

           Timer Engine Service

                  |

    +-------------+-------------+

    |                           |

    v                           v


  Redis                  PostgreSQL


    |

    |
```

Timer Event Stream

```


---

# 4. Timer Components

Timer Engine terdiri dari:

## 4.1 Timer Manager

Mengelola lifecycle timer:

```

Create

Start

Pause

Resume

Expire

Complete

```

---

## 4.2 Time Synchronization Service

Bertugas:

```

Client Time Sync

Server Time Validation

Clock Drift Detection

```

---

## 4.3 Expiration Handler

Bertugas:

```

Detect Timeout

Lock Session

Trigger Submission

```

---

## 4.4 Extension Manager

Mengelola:

```

Extra Time

Special Accommodation

Administrative Adjustment

```

---

# 5. Timer Lifecycle


```

CREATED

|

v

INITIALIZED

|

v

RUNNING

|

v

WARNING

|

v

EXPIRED

|

v

SUBMITTED

|

v

COMPLETED

```


---

# 6. Timer State Definition


## CREATED

Kondisi:

```

Exam sudah dibuat

Session belum dimulai

```

---

## INITIALIZED

Kondisi:

```

Session dibuat

Timer belum berjalan

```

---

## RUNNING

Kondisi:

```

Peserta sedang mengerjakan

```

---

## WARNING

Kondisi:

```

Remaining time melewati threshold

```

---

## EXPIRED

Kondisi:

```

Waktu habis

```

---

## SUBMITTED

Kondisi:

```

Jawaban dikunci

```

---

# 7. Timer Data Model


Entity:

```

cbt_session_timer

```

---

Fields:


| Field | Description |
|-|-|
| session_id | CBT session reference |
| start_time | Server start timestamp |
| end_time | Calculated expiry timestamp |
| duration_seconds | Exam duration |
| extension_seconds | Additional time |
| remaining_seconds | Remaining time |
| status | Timer state |
| last_sync | Last synchronization |


---

# 8. Timer Initialization Flow


Flow:


```

Student Click Start Exam

```
    |
```

Validate Session

```
    |
```

Create Timer Record

```
    |
```

Calculate End Time

```
    |
```

Store Timer State

```
    |
```

Start Countdown

```


---

# 9. Timer Calculation


Formula:


```

end_time =

start_time

*

exam_duration

*

extension_time

```


Remaining:


```

remaining_time =

end_time

*

server_current_time

```


Example:


```

Start:

08:00

Duration:

120 minutes

End:

10:00

```


---

# 10. Client Timer Behavior


Client melakukan:


```

Display countdown

Update UI

Notify warning

```


Client tidak boleh:


```

Modify duration

Extend time

Change end time

```


---

# 11. Server Synchronization


Client melakukan sync:


Default:


```

Every 10 seconds

```


Request:


```

GET /api/cbt/session/{id}/timer

````


Response:


```json
{
 "session_id":"uuid",
 "remaining_seconds":3200,
 "server_time":"2026-07-26T10:20:00Z",
 "status":"RUNNING"
}
````

---

# 12. Clock Drift Detection

Masalah:

Device menggunakan waktu palsu.

Contoh:

```
Server:

10:00


Client:

09:30

```

Detection:

```
client_timestamp

vs

server_timestamp
```

Jika perbedaan:

```
> allowed threshold
```

Generate:

```
CLOCK_DRIFT_DETECTED
```

---

# 13. Warning System

Default warning:

```
30 minutes

15 minutes

10 minutes

5 minutes

1 minute
```

Configurable:

```
exam_timer_warning_rules
```

---

# 14. Auto Submit Mechanism

Ketika:

```
remaining_seconds <= 0
```

Process:

```
Timer Expired

        |

Lock Session

        |

Save Pending Answer

        |

Generate Submit Event

        |

Send To Scoring Pipeline

```

---

# 15. Timer Extension

Support:

```
Additional Time
```

Use case:

* kebutuhan khusus peserta;
* gangguan teknis;
* keputusan administrator.

---

Extension flow:

```
Admin Approve

        |

Create Extension

        |

Update End Time

        |

Generate Event

```

---

# 16. Offline Timer Support

Saat offline:

Client menyimpan:

```
local_timer_state
```

Berisi:

```
last_server_time

local_timestamp

remaining_seconds
```

---

Saat reconnect:

```
Sync Request

        |

Compare Time

        |

Adjust Timer

```

---

# 17. Offline Timer Security

Protection:

```
Clock Change Detection

Session Token Validation

Server Reconciliation
```

---

# 18. Timer Persistence Strategy

Active session:

```
Redis
```

untuk:

```
Fast Access
```

---

Permanent record:

```
PostgreSQL
```

untuk:

```
Audit

Recovery

Reporting
```

---

# 19. Redis Timer Storage

Key:

```
cbt:timer:{session_id}
```

Value:

```json
{
"end_time":
"2026-07-26T12:00:00",

"status":
"RUNNING"
}
```

TTL:

```
Exam Duration + Buffer
```

---

# 20. Timer Events

Event yang dibuat:

```
TIMER_CREATED

TIMER_STARTED

TIMER_SYNCED

TIMER_WARNING

TIMER_EXTENDED

TIMER_EXPIRED

TIMER_COMPLETED

```

---

# 21. Failure Handling

## Redis Failure

Fallback:

```
PostgreSQL Timer State
```

---

## Network Failure

Action:

```
Continue Local Timer

Queue Sync

```

---

## Application Crash

Recovery:

```
Restore Session

Reload Timer

Continue Exam

```

---

# 22. Performance Requirement

Target:

Timer Read:

```
<50 ms
```

Timer Sync:

```
<100 ms
```

Expiration Detection:

```
Near real-time
```

---

# 23. Monitoring Metrics

Monitor:

```
Active Timers

Timer Sync Count

Clock Drift Count

Expired Sessions

Auto Submit Success

```

---

# 24. Security Requirement

Timer Engine harus:

```
Prevent Client Manipulation

Maintain Audit Trail

Validate Server Time

Lock Expired Session

```

---

# 25. Integration

Timer Engine terhubung dengan:

```
Session Engine

Answer Processing

Navigation Engine

Scoring Pipeline

Event System

Analytics

```

---

# 26. Final Architecture

```

                 CBT Session


                      |

                      |

                Timer Engine


          +-----------+-----------+

          |                       |

          v                       v


        Redis               PostgreSQL


          |

          |

     Event Processing


          |

          |

    Analytics / Audit


```

---

# 27. Conclusion

Timer Engine memastikan:

* waktu ujian akurat;
* tidak dapat dimanipulasi peserta;
* mendukung offline examination;
* mendukung tambahan waktu;
* memiliki audit trail;
* siap digunakan untuk ujian berskala besar.

Timer Engine menjadi fondasi utama validitas CBT Runtime YakinLulus.id.

```

Berikutnya sesuai urutan:

**14_navigation_engine.md**.
```
