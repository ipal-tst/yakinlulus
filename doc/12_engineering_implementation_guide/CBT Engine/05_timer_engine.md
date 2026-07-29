```markdown id="p6k9vz"
# 12_engineering_implementation_guide/cbt_engine/05_timer_engine.md

# Timer Engine Architecture

## 1. Tujuan

Dokumen ini menjelaskan arsitektur **Timer Engine** pada CBT Engine YakinLulus.id.

Timer Engine bertanggung jawab mengelola waktu ujian secara akurat, aman, dan konsisten antara:

- server;
- web application;
- mobile application;
- offline runtime.


Timer Engine harus memastikan:

```

Accurate Timing

*

No Client Manipulation

*

Auto Submission

*

Recovery Support

*

Audit Capability

```

---

# 2. Prinsip Dasar Timer Engine

Timer tidak boleh bergantung kepada client.


Bad architecture:

```

Browser Timer

```
  |
```

JavaScript Countdown

```
  |
```

Submit

```

Masalah:

- user dapat manipulasi waktu;
- browser refresh menyebabkan reset;
- device clock dapat berbeda.


---

Recommended architecture:


```

```
          Server Time


              |

              |

      Timer Engine


              |

    +---------+---------+

    |                   |

 Web Client        Mobile Client
```

```

Server menjadi source of truth.

---

# 3. Timer Engine Responsibility


Timer Engine menangani:


```

Initialize Timer

Calculate Remaining Time

Synchronize Time

Detect Expiration

Trigger Auto Submit

Recover Session

Audit Timing Event

```

---

# 4. Timer Architecture


```

```
            Exam Session


                 |

                 |

            Timer Engine


    +------------+------------+

    |                         |
```

Redis Runtime              PostgreSQL

Timer State                History

```
    |

    |

Background Worker


    |

    |
```

Auto Submit Process

```

---

# 5. Timer Lifecycle


Timer memiliki lifecycle:


```

NOT_STARTED

```
  |
```

INITIALIZED

```
  |
```

RUNNING

```
  |
```

WARNING

```
  |
```

EXPIRED

```
  |
```

COMPLETED

```

---

# 6. Timer State Definition


## NOT_STARTED


Kondisi:


```

Exam Session Created

Timer Not Active

```

---

## INITIALIZED


Saat student memulai exam:


System membuat:


```

start_time

duration

end_time

```

Contoh:


```

Start:

08:00:00

Duration:

120 minutes

End:

10:00:00

```

---

## RUNNING


Timer aktif:


```

Current Time < End Time

```

Client menerima:


```

Remaining Seconds

```

---

## WARNING


Optional state.


Contoh:


```

Remaining Time < 10 Minutes

```

Action:

```

Show Warning

Trigger Notification

```

---

## EXPIRED


Ketika:


```

Current Time >= End Time

```

Action:


```

Lock Answer

Submit Automatically

Trigger Scoring

```

---

# 7. Timer Calculation


Formula:


```

Remaining Time

=

End Time

*

Current Server Time

```

Contoh:


```

End Time:

10:00

Current:

09:35

Remaining:

25 minutes

```

---

# 8. Timer Storage Strategy


## PostgreSQL


Untuk permanent data.


Table:


```

exam_sessions

```

Column:


```

started_at

ended_at

duration_seconds

status

```

---

## Redis


Untuk runtime.


Example:


```

exam_timer:{session_id}

{

end_time:

"2026-07-26 10:00:00"

}

```

---

# 9. Timer Synchronization


Client tidak menghitung waktu sendiri.


Flow:


```

Client

|

Request Timer

|

Server Calculate

|

Return Remaining Time

|

Client Display

```

---

# 10. Synchronization Interval


Recommended:


```

Web:

30 - 60 seconds

Mobile:

30 - 60 seconds

```

Tidak perlu setiap detik karena:

- boros network;
- tidak efisien.


Client hanya melakukan countdown visual.

---

# 11. Auto Submit Architecture


Ketika waktu habis:


```

Timer Worker

```
   |
```

Detect Expired Session

```
   |
```

Lock Session

```
   |
```

Save Final Answer

```
   |
```

Create Submission

```
   |
```

Send Scoring Event

```

---

# 12. Background Worker


Worker menjalankan:


```

Timer Scanner Job

```

Interval:


```

Every 5-10 seconds

````

Query:


```sql
SELECT *

FROM exam_sessions

WHERE

status='RUNNING'

AND

end_time <= NOW();

````

---

# 13. Timer Accuracy

Problem:

```
Client Time

!=

Server Time

```

Solution:

Gunakan:

```
Database Timestamp

+

Server Clock

+

UTC Standard

```

---

# 14. Timezone Strategy

Database:

```
UTC

```

Application:

```
Convert Based On User Locale

```

Contoh:

Database:

```
08:00 UTC

```

Indonesia:

```
15:00 WIB

```

---

# 15. Multiple Device Protection

Timer tetap sama.

Contoh:

Device A:

```
Remaining:

45 minutes

```

Device B login:

```
Remaining:

45 minutes

```

Tidak membuat timer baru.

---

# 16. Network Failure Handling

Scenario:

Internet disconnect:

```
Client Lost Connection


        |

Continue Local Countdown


        |

Reconnect


        |

Sync Server Time


```

---

# 17. Offline Timer Strategy

Offline mode:

Client menyimpan:

```
last_server_time

remaining_time

expiration_time

```

Tetapi:

```
Server Validation Required

```

saat sync.

---

# 18. Timer Event

Event:

```
TimerStarted

TimerWarning

TimerExpired

AutoSubmitted

```

Digunakan untuk:

* analytics;
* notification;
* audit.

---

# 19. Security Consideration

Protection:

```
Server Side Calculation

Signed Session Token

Timer Validation

Audit Log

No Client Authority

```

---

# 20. Performance Consideration

Target:

| Operation           | Target |
| ------------------- | ------ |
| Timer Check         | <100ms |
| Sync Request        | <200ms |
| Auto Submit Trigger | <5s    |

---

# 21. Failure Handling

Jika worker gagal:

```
Worker Crash


      |

Restart


      |

Scan Expired Session


      |

Process Auto Submit

```

---

# 22. Testing Strategy

Test:

```
Timer Accuracy

Timezone

Network Disconnect

Session Recovery

Mass Concurrent Exam

Auto Submit

```

---

# 23. Scalability Strategy

## Phase 1

```
Single Timer Worker

Redis

PostgreSQL

```

---

## Phase 2

```
Distributed Worker

Queue System

Multiple CBT Instance

```

---

## Phase 3

```
Dedicated Timer Service

Event Streaming

High Concurrency Runtime

```

---

# 24. Implementation Recommendation

Untuk MVP:

Gunakan:

```
Go Backend Timer Module

Redis Runtime State

PostgreSQL Persistence

Background Worker

Event Queue

```

Tidak perlu membuat service terpisah terlebih dahulu.

---

# Summary

Timer Engine YakinLulus.id menggunakan:

```
Server Controlled Timer

+

Redis Runtime State

+

Background Worker

+

Auto Submission

+

Offline Recovery

+

Audit Trail

```

Dengan desain ini, CBT dapat menangani ujian berskala kecil sampai ribuan peserta secara konsisten dan aman.

