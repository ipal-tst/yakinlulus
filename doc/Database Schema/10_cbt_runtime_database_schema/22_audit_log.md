Berikut **22_audit_log.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini mendefinisikan sistem audit trail CBT Runtime untuk mencatat seluruh aktivitas penting, perubahan data, tindakan admin, keamanan, dan investigasi insiden.

```markdown
# 22_audit_log.md

# YakinLulus.id CBT Audit Log Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Audit Log adalah sistem pencatatan permanen seluruh aktivitas penting yang terjadi pada CBT Runtime.

Tujuan:

- menyediakan histori aktivitas;
- memastikan accountability;
- mendeteksi manipulasi;
- membantu debugging;
- mendukung compliance;
- menyediakan bukti ketika terjadi sengketa hasil ujian.

---

# 2. Audit Principle


Audit menggunakan prinsip:


```

Who

*

What

*

When

*

Where

*

Result

```


Setiap perubahan penting harus dapat dijawab:


```

Siapa yang melakukan?

Apa yang dilakukan?

Kapan dilakukan?

Dari mana dilakukan?

Apa hasilnya?

```

---

# 3. Audit Architecture


```

```
          Application


              |

              |

        Audit Middleware


              |

              |

         Audit Logger


              |

              |

         Audit Database


              |

              |

      Monitoring / Reporting
```

```

---

# 4. Audit Scope


Audit mencakup:


```

Authentication

Authorization

Exam Lifecycle

Question Management

Answer Activity

Scoring

Administration

Security Event

System Change

```

---

# 5. Audit Event Categories


## 5.1 User Activity


Contoh:


```

LOGIN_SUCCESS

LOGIN_FAILED

LOGOUT

PROFILE_UPDATED

```

---

## 5.2 Exam Activity


Contoh:


```

EXAM_STARTED

EXAM_PAUSED

EXAM_RESUMED

EXAM_SUBMITTED

EXAM_EXPIRED

```

---

## 5.3 Question Activity


Contoh:


```

QUESTION_CREATED

QUESTION_UPDATED

QUESTION_DELETED

QUESTION_PUBLISHED

QUESTION_ARCHIVED

```

---

## 5.4 Answer Activity


Contoh:


```

ANSWER_CREATED

ANSWER_UPDATED

ANSWER_SYNCED

ANSWER_LOCKED

```

---

## 5.5 Scoring Activity


Contoh:


```

SCORING_STARTED

SCORE_GENERATED

SCORE_CHANGED

RESULT_PUBLISHED

```

---

## 5.6 Security Activity


Contoh:


```

FAILED_LOGIN

TOKEN_INVALID

SESSION_HIJACK_ATTEMPT

PERMISSION_DENIED

```

---

# 6. Audit Data Structure


Table:


```

audit_logs

````

---

Fields:


| Field | Description |
|-|-|
| id | Audit ID |
| event_type | Activity type |
| actor_id | User performing action |
| actor_role | User role |
| entity_type | Object type |
| entity_id | Object ID |
| action | Action performed |
| old_value | Previous data |
| new_value | New data |
| metadata | Additional information |
| ip_address | Source IP |
| device_info | Device information |
| created_at | Timestamp |

---

# 7. Audit Record Example


Example:


```json
{
"event_type":"ANSWER_UPDATED",

"actor_id":"student_001",

"entity_type":"answer",

"entity_id":"ans_123",

"old_value":{
"option":"A"
},

"new_value":{
"option":"B"
},

"timestamp":"2026-07-26T10:15:20"
}
````

---

# 8. Audit Logging Strategy

YakinLulus menggunakan:

```
Immutable Audit Log

```

Artinya:

```
INSERT ONLY

NO UPDATE

NO DELETE

```

---

# 9. Audit Middleware

Semua request penting melewati:

```
Request

 |

Authentication

 |

Authorization

 |

Business Logic

 |

Audit Logger

 |

Response

```

---

# 10. Automatic Audit

System otomatis mencatat:

```
Create

Update

Delete

Login

Permission Change

Score Change

```

---

# 11. Manual Audit

Untuk proses tertentu:

Example:

Admin mengubah nilai:

```
Admin Action

+

Reason

+

Approval

```

---

# 12. Critical Audit Events

Event wajib:

```
ANSWER_CHANGE_AFTER_SUBMIT

SCORE_MANIPULATION

QUESTION_DELETE

ANSWER_KEY_CHANGE

ADMIN_PERMISSION_CHANGE

```

---

# 13. Exam Integrity Audit

Mencatat:

```
Start Time

End Time

Duration

Pause Count

Resume Count

Navigation Pattern

Answer Change

```

---

# 14. Student Behavior Audit

Data:

```
Question Time

Question Revisits

Rapid Answer

Skipped Question

Flag Usage

```

---

# 15. Score Audit

Setiap perubahan nilai:

Before:

```
Score:

70

```

After:

```
Score:

75

```

Disimpan:

```
Reason

Actor

Timestamp

```

---

# 16. Question Bank Audit

Mencatat:

```
Created By

Reviewed By

Approved By

Published Date

Version

```

---

# 17. Audit Versioning

Data penting menggunakan:

```
Version Number

```

Example:

Question:

```
Version 1

Initial


Version 2

Correction

```

---

# 18. Audit Retention

Policy:

MVP:

```
1 Year

```

Production:

```
3-5 Years

```

---

# 19. Audit Storage Strategy

MVP:

```
PostgreSQL

```

---

Scale:

```
Partitioned Table

Archive Database

Log Storage

```

---

# 20. Partition Strategy

Partition berdasarkan:

```
created_at

```

Example:

```
audit_logs_2026_01

audit_logs_2026_02

```

---

# 21. Audit Security

Audit log harus:

```
Immutable

Restricted Access

Encrypted Backup

Monitored

```

---

# 22. Access Control

Normal user:

```
NO ACCESS

```

Admin:

```
Limited Read

```

Security Admin:

```
Full Audit Access

```

---

# 23. Audit Query Example

Cari perubahan nilai:

```
WHERE

event_type='SCORE_CHANGED'

AND

entity_id=session_id

```

---

# 24. Integration

Audit terhubung dengan:

```
Authentication

Session Management

Event Architecture

Security Layer

Background Jobs

Scoring Pipeline

```

---

# 25. Monitoring

Metrics:

```
Audit Event Count

Failed Audit Write

Suspicious Activity

Admin Action Frequency

```

---

# 26. Failure Handling

Jika audit gagal:

Critical action:

```
BLOCK TRANSACTION

```

Non-critical:

```
Queue Retry

```

---

# 27. Performance Requirement

Audit Write:

```
<10ms

```

Tidak boleh:

```
Blocking Exam Flow

```

---

# 28. Future Enhancement

Support:

```
Blockchain Audit Trail

SIEM Integration

Advanced Fraud Detection

AI Anomaly Detection

```

---

# 29. Final Architecture

```
              CBT Runtime


                  |

                  |

            Audit Middleware


                  |

                  |

             Audit Logger


                  |

                  |

            Audit Storage


                  |

        +---------+---------+

        |                   |

        v                   v


    Security           Analytics


```

---

# 30. Conclusion

Audit Log memberikan:

* transparansi sistem;
* histori lengkap;
* keamanan ujian;
* investigasi perubahan;
* dukungan compliance.

Dengan desain ini YakinLulus.id memiliki fondasi audit yang siap untuk:

```
Family Learning Platform

        |

        v

School Examination System

        |

        v

National Assessment Platform

```
