Berikut **23_error_catalog.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini mendefinisikan standard error handling CBT Runtime agar setiap kegagalan memiliki kode, kategori, severity, response behavior, dan mekanisme recovery yang konsisten.

```markdown id="err23catalog"
# 23_error_catalog.md

# YakinLulus.id CBT Error Catalog Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Error Catalog adalah standardisasi seluruh error yang terjadi pada CBT Runtime.

Tujuan:

- memberikan error code yang konsisten;
- memudahkan debugging;
- mempermudah monitoring;
- meningkatkan user experience;
- membantu incident response.

---

# 2. Error Handling Principle


Setiap error memiliki:


```

Error Code

*

Category

*

Severity

*

Message

*

Recovery Action

```


---

# 3. Error Architecture


```

```
          Application


              |

              |

         Error Handler


              |

    +---------+---------+

    |                   |

    v                   v


User Response       Error Logging


                        |

                        |

                   Monitoring
```

```

---

# 4. Error Code Format


Format:


```

MODULE_TYPE_NUMBER

```


Example:


```

CBT_SESSION_001

CBT_TIMER_002

CBT_SCORE_003

```


---

# 5. Error Categories


Kategori utama:


```

AUTH

SESSION

EXAM

QUESTION

ANSWER

SYNC

TIMER

SCORING

DATABASE

NETWORK

SECURITY

SYSTEM

```


---

# 6. Error Severity Level


## LOW


Tidak mengganggu proses utama.


Example:


```

Warning

Retry Available

```


---

## MEDIUM


Mengganggu sebagian fungsi.


Example:


```

Sync Delay

Temporary Failure

```


---

## HIGH


Menghentikan proses pengguna.


Example:


```

Cannot Submit Exam

```


---

## CRITICAL


Mengganggu integritas sistem.


Example:


```

Score Manipulation

Database Failure

```


---

# 7. Authentication Errors


## AUTH_001

Name:

```

INVALID_CREDENTIAL

```


Description:

Username/password salah.


Response:


```

Login Failed

```


Severity:

```

LOW

```


---

## AUTH_002

Name:


```

TOKEN_EXPIRED

```


Description:


Session token sudah expired.


Action:


```

Refresh Token

```


---

## AUTH_003


Name:


```

ACCESS_DENIED

```


Description:


User tidak memiliki permission.


Action:


```

Reject Request

Create Audit Event

```


---

# 8. Session Errors


## SESSION_001


Name:


```

SESSION_NOT_FOUND

```


Description:


CBT session tidak ditemukan.


Possible Cause:


```

Expired

Invalid ID

Deleted

```


---

## SESSION_002


Name:


```

SESSION_EXPIRED

```


Description:


Waktu ujian sudah habis.


Action:


```

Auto Submit

```


---

## SESSION_003


Name:


```

SESSION_ALREADY_COMPLETED

```


Description:


Session sudah selesai.


Action:


```

Reject Action

```


---

# 9. Exam Errors


## EXAM_001


Name:


```

EXAM_NOT_AVAILABLE

```


Description:


Ujian belum aktif.


---

## EXAM_002


Name:


```

EXAM_ATTEMPT_LIMIT

```


Description:


Batas percobaan sudah tercapai.


---

## EXAM_003


Name:


```

EXAM_ACCESS_BLOCKED

```


Description:


Peserta tidak memenuhi syarat.


---

# 10. Question Errors


## QUESTION_001


Name:


```

QUESTION_NOT_FOUND

```


Description:


Soal tidak ditemukan.


---

## QUESTION_002


Name:


```

QUESTION_INACTIVE

```


Description:


Soal tidak aktif.


---

## QUESTION_003


Name:


```

ANSWER_KEY_MISSING

```


Description:


Soal tidak memiliki answer key.


Severity:


```

HIGH

```


---

# 11. Answer Errors


## ANSWER_001


Name:


```

INVALID_OPTION

```


Description:


Pilihan jawaban tidak valid.


---

## ANSWER_002


Name:


```

ANSWER_LOCKED

```


Description:


Jawaban sudah dikunci.


---

## ANSWER_003


Name:


```

ANSWER_SUBMIT_FAILED

```


Description:


Gagal menyimpan jawaban.


Action:


```

Retry Sync

```


---

# 12. Timer Errors


## TIMER_001


Name:


```

TIMER_NOT_STARTED

```


Description:


Timer belum aktif.


---

## TIMER_002


Name:


```

TIMER_SYNC_FAILED

```


Description:


Gagal sinkronisasi waktu.


Action:


```

Use Server Time

```


---

## TIMER_003


Name:


```

INVALID_TIME_STATE

```


Description:


State timer tidak konsisten.


Severity:


```

CRITICAL

```


---

# 13. Synchronization Errors


## SYNC_001


Name:


```

SYNC_FAILED

```


Description:


Data offline gagal dikirim.


Action:


```

Retry Queue

```


---

## SYNC_002


Name:


```

DUPLICATE_EVENT

```


Description:


Event sudah pernah diproses.


Action:


```

Ignore

```


---

## SYNC_003


Name:


```

CONFLICT_DETECTED

```


Description:


Terjadi konflik data.


Action:


```

Conflict Resolution

```


---

# 14. Scoring Errors


## SCORE_001


Name:


```

SCORING_FAILED

```


Description:


Perhitungan nilai gagal.


Action:


```

Retry Background Job

```


---

## SCORE_002


Name:


```

RESULT_NOT_GENERATED

```


Description:


Hasil belum tersedia.


---

## SCORE_003


Name:


```

INVALID_SCORE_STATE

```


Description:


Data nilai tidak konsisten.


Severity:


```

CRITICAL

```


---

# 15. Auto Grading Errors


## GRADING_001


Name:


```

EVALUATION_FAILED

```


Description:


Jawaban gagal dievaluasi.


---

## GRADING_002


Name:


```

INVALID_RULE

```


Description:


Aturan grading tidak valid.


---

## GRADING_003


Name:


```

ANSWER_KEY_CHANGED

```


Description:


Answer key berubah setelah exam berjalan.


Action:


```

Audit

Recalculate

```


---

# 16. Database Errors


## DB_001


Name:


```

CONNECTION_FAILED

```


Description:


Database tidak dapat diakses.


Severity:


```

CRITICAL

```


---

## DB_002


Name:


```

TRANSACTION_FAILED

```


Description:


Transaction rollback.


---

## DB_003


Name:


```

CONSTRAINT_ERROR

```


Description:


Violation database constraint.


---

# 17. Network Errors


## NET_001


Name:


```

NETWORK_TIMEOUT

```


Description:


Request timeout.


---

## NET_002


Name:


```

CONNECTION_LOST

```


Description:


Koneksi terputus.


Action:


```

Enable Offline Mode

```


---

# 18. Security Errors


## SEC_001


Name:


```

UNAUTHORIZED_ACCESS

```


Description:


Percobaan akses ilegal.


Action:


```

Block

Audit

```


---

## SEC_002


Name:


```

SUSPICIOUS_ACTIVITY

```


Description:


Aktivitas mencurigakan.


---

## SEC_003


Name:


```

SESSION_HIJACK_ATTEMPT

```


Description:


Percobaan mengambil session.


Severity:


```

CRITICAL

```


---

# 19. System Errors


## SYS_001


Name:


```

SERVICE_UNAVAILABLE

```


Description:


Service tidak tersedia.


---

## SYS_002


Name:


```

INTERNAL_ERROR

````


Description:


Kesalahan internal sistem.


---

# 20. Error Response Format


API Response:


```json
{
"success":false,

"error_code":"SESSION_001",

"message":"Session not found",

"timestamp":"2026-07-26T10:00:00",

"request_id":"abc123"
}
````

---

# 21. Error Logging

Setiap error dicatat:

```
error_logs
```

Fields:

| Field       | Description   |
| ----------- | ------------- |
| id          | Error ID      |
| code        | Error Code    |
| message     | Error Message |
| severity    | Level         |
| stack_trace | Debug Info    |
| user_id     | Actor         |
| request_id  | Request       |
| created_at  | Timestamp     |

---

# 22. Retry Policy

Retry untuk:

```
Network Error

Sync Error

Background Job Error

Temporary Database Error

```

Tidak retry:

```
Authorization Error

Invalid Data

Permission Error

```

---

# 23. User Friendly Message

Internal:

```
DB_CONNECTION_FAILED
```

User:

```
Sistem sedang mengalami gangguan.
Silakan coba kembali.
```

---

# 24. Monitoring Integration

Error dikirim ke:

```
Monitoring System

Log Aggregator

Alert System

```

---

# 25. Alert Rule

Critical error:

```
Immediate Alert

```

Example:

```
Database Down

Score Failure

Security Breach

```

---

# 26. Error Recovery Flow

```
Error Occurs

      |

Capture Error

      |

Classify Severity

      |

Execute Recovery

      |

Log Event

      |

Notify If Needed

```

---

# 27. Future Enhancement

Support:

```
Distributed Tracing

AI Error Prediction

Automatic Recovery

SRE Monitoring

```

---

# 28. Final Architecture

```
              CBT Runtime


                   |

                   |

             Error Handler


                   |

        +----------+----------+

        |                     |

        v                     v


   Error Logger          Recovery Engine


        |

        |

 Monitoring System

```

---

# 29. Conclusion

Error Catalog memastikan:

* error konsisten;
* debugging lebih cepat;
* recovery terstruktur;
* monitoring mudah;
* sistem lebih reliable.

Dengan desain ini CBT Runtime YakinLulus.id siap untuk:

```
MVP CBT

        |

        v

School Platform

        |

        v

Enterprise Assessment System

```

````

