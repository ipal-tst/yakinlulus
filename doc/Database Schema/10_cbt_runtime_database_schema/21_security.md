Berikut **21_security.md** sesuai struktur **10_cbt_runtime_database_schema/**.

Dokumen ini mendefinisikan keamanan CBT Runtime mencakup authentication, authorization, exam integrity, data protection, anti-cheating, database security, dan operational security.

```markdown id="sec21cbt"
# 21_security.md

# YakinLulus.id CBT Security Specification

Module : CBT Runtime Database Schema  
Version : 1.0  
Status : Design Specification

---

# 1. Overview

Security Layer adalah komponen yang memastikan integritas, kerahasiaan, dan ketersediaan sistem CBT.

Tujuan utama:

- melindungi soal ujian;
- mencegah manipulasi jawaban;
- menjaga keamanan hasil ujian;
- memastikan peserta yang benar dapat mengikuti ujian;
- menyediakan audit keamanan.

---

# 2. Security Principle


YakinLulus.id menerapkan:


```

Confidentiality

*

Integrity

*

Availability

*

Auditability

```


---

# 3. Security Architecture


```

```
             User


              |

              |

        Authentication


              |

              |

       Authorization Layer


              |

              |

         CBT Runtime


    +---------+---------+

    |                   |

    v                   v
```

Security Control     Audit Log

```
    |

    |

Monitoring System
```

```

---

# 4. Security Domains


Security dibagi menjadi:


```

1. Identity Security

2. Access Control

3. Exam Security

4. Data Security

5. Application Security

6. Infrastructure Security

7. Audit Security

```

---

# 5. Identity Security


## 5.1 Authentication


User wajib melakukan:


```

Login

↓

Verify Identity

↓

Create Session

```


---

Support:


MVP:


```

Username / Email

Password

```


Future:


```

OTP

Google Login

School SSO

```


---

# 6. Password Security


Password harus:


```

Hashed

Salted

Never Stored Plain Text

```


Recommended:


```

Argon2id

```


Alternative:


```

bcrypt

```


---

# 7. Session Security


CBT session memiliki:


```

session_id

user_id

device_id

token

expiration

```


---

Security:


```

Short Lifetime Token

Refresh Mechanism

Session Validation

```


---

# 8. Authorization Model


Menggunakan:


```

Role Based Access Control (RBAC)

```


Role:


```

SUPER_ADMIN

ADMIN

STAFF

TEACHER

STUDENT

```


---

# 9. Permission Control


Contoh:


Student:


```

Take Exam

View Result

View Explanation

```


Admin:


```

Create Exam

Manage Question

View Report

```


---

# 10. Exam Access Security


Sebelum exam:


Validasi:


```

User Permission

Exam Schedule

Exam Availability

Attempt Limit

```


---

Flow:


```

Student Request Exam

```
    |
```

Validate Access

```
    |
```

Create Session

```
    |
```

Allow Start

```

---

# 11. Question Security


Soal merupakan aset penting.


Protection:


```

No Direct Question Access

Encrypted Transfer

Authorization Check

Limited Exposure

```


---

Student hanya menerima:


```

Current Question

Allowed Metadata

```


---

Tidak menerima:


```

Full Question Bank

Answer Key

Future Questions

```


---

# 12. Answer Key Protection


Answer key:


```

Never Sent To Client

```


Disimpan:


```

Server Side Only

```


---

Saat grading:


```

Server Compare Answer

```


---

# 13. Exam Snapshot Security


Snapshot:


```

Immutable

```


Setelah exam dimulai:


Tidak boleh:


```

Change Question

Change Answer Key

Change Sequence

```


---

# 14. Token Security


CBT token:


Requirements:


```

Signed

Expired

Rotated

Validated

```


---

Protection:


```

JWT Signature Validation

Token Blacklist

Session Binding

```


---

# 15. Device Binding


Optional feature.


Session dapat dikaitkan:


```

User

*

Device

*

Browser

```


---

Purpose:


```

Prevent Account Sharing

```


---

# 16. Anti Cheat Protection


Security detection:


```

Multiple Login

Session Hijacking

Rapid Navigation

Unusual Answer Pattern

Browser Switching

```


---

# 17. Browser Security


Support:


```

Fullscreen Mode

Tab Visibility Detection

Copy Prevention

Paste Detection

```


---

Catatan:


Browser security hanya bersifat deterrent, bukan absolute protection.

---

# 18. Network Security


Communication:


```

HTTPS Only

TLS 1.3 Recommended

```


---

API Protection:


```

Rate Limiting

Request Validation

IP Monitoring

```


---

# 19. API Security


Setiap endpoint:


Validasi:


```

Authentication

Authorization

Input Validation

Permission

```


---

Example:


```

GET /exam/question/10

```


Tidak boleh tanpa:


```

Active Exam Session

```


---

# 20. Database Security


Database protection:


```

Least Privilege User

Encrypted Connection

Access Logging

Backup Protection

```


---

# 21. PostgreSQL Security


Implementation:


```

Separate Database User

Role Permission

Schema Permission

Row Level Security

```


---

# 22. Sensitive Data Protection


Sensitive:


```

Password

Answer Data

Exam Result

Personal Data

```


---

Protection:


```

Encryption At Rest

Encryption In Transit

Access Restriction

```


---

# 23. Data Isolation


Tenant ready:


Support:


```

School Isolation

Organization Isolation

```


Future:


```

Multi Tenant Architecture

```


---

# 24. File Security


Question assets:


```

Image

Video

Document

```


Protection:


```

Private Storage

Signed URL

Expiration

Access Validation

```


---

# 25. Audit Security


Semua aktivitas penting dicatat.


Example:


```

LOGIN_SUCCESS

QUESTION_ACCESS

ANSWER_CHANGE

SCORE_UPDATE

ADMIN_CHANGE

```


---

# 26. Security Event Monitoring


Monitor:


```

Failed Login

Suspicious Session

Permission Violation

Unusual Activity

```


---

# 27. Security Logging


Log:


```

Actor

Action

Timestamp

IP Address

Device

Result

```


---

# 28. Data Backup Security


Backup:


```

Encrypted

Access Controlled

Regular Tested

```


---

# 29. Disaster Security


Support:


```

Database Restore

Point In Time Recovery

Backup Verification

```


---

# 30. Security Headers


Application:


```

Content Security Policy

X-Frame-Options

HSTS

Secure Cookie

```


---

# 31. Vulnerability Prevention


Protection terhadap:


```

SQL Injection

XSS

CSRF

Broken Authentication

IDOR

```


---

# 32. Security Testing


Melakukan:


```

Penetration Testing

Dependency Scan

API Security Testing

Database Audit

```


---

# 33. Performance Security


Security tidak boleh menyebabkan:


```

High Latency

System Blocking

Database Overload

```


---

# 34. Incident Response


Jika terjadi insiden:


```

Detect

Contain

Investigate

Recover

Review

```


---

# 35. Integration


Security terhubung dengan:


```

Authentication Service

Session Management

Event Architecture

Audit Log

Background Jobs

Monitoring

```


---

# 36. Future Enhancement


Support:


```

AI Proctoring

Face Verification

Behavior Analysis

School SSO

Advanced Fraud Detection

```


---

# 37. Final Architecture


```

```
          User


           |

           |

    Authentication


           |

           |

    Authorization


           |

           |

      CBT Runtime


   +-------+-------+

   |               |

   v               v
```

Security Layer    Audit System

```
   |

   |
```

Monitoring

```

---

# 38. Conclusion


Security Layer memastikan CBT Runtime:

- soal terlindungi;
- jawaban aman;
- hasil ujian valid;
- akses terkontrol;
- aktivitas dapat diaudit.


Dengan desain ini YakinLulus.id siap mendukung:

```

Family CBT MVP

```
    |

    v
```

School Examination

```
    |

    v
```

Large Scale Assessment Platform

```
```
