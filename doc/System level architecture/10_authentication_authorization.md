Melanjutkan ke file berikutnya:

# `11_implementation_architecture/10_authentication_authorization.md`

```md id="auth10yl"
# Authentication & Authorization Architecture
## YakinLulus.id Authentication and Authorization Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan sistem authentication dan authorization pada platform YakinLulus.id.

Sistem keamanan identity bertanggung jawab terhadap:

- identifikasi pengguna;
- validasi akses;
- pengelolaan session;
- role management;
- permission control;
- audit keamanan.


Target:

```

Secure by Design

*

RBAC Based Access Control

*

Future Enterprise Identity Ready

```

---

# 2. Security Architecture Principles


Authentication menggunakan prinsip:


```

Identity First

*

Least Privilege

*

Zero Trust Approach

*

Secure Token Management

*

Audit Everything

```


---

# 3. Authentication vs Authorization


## Authentication

Menjawab:


```

"Siapa pengguna ini?"

```


Contoh:

```

Username

Email

Password

OAuth Provider

```


---

## Authorization

Menjawab:


```

"Apa yang boleh dilakukan pengguna ini?"

```


Contoh:

```

Student:

Mengikuti ujian

Teacher:

Membuat soal

Admin:

Mengelola pengguna

```


---

# 4. Authentication Architecture Overview


```

```
              User


               |

               |

         Login Request


               |

               |

        Authentication API


               |

    +----------+----------+

    |                     |
```

Password Verification    MFA Future

```
    |

    |

   JWT Token


    |

    |
```

Authenticated Session

```


---

# 5. Authentication Component


Komponen utama:


```

Identity Module

├── User Management

├── Credential Management

├── Token Service

├── Session Management

├── Password Policy

└── Audit Logging

```


---

# 6. User Identity Model


User entity:


```

User

|

+----------------+

|

ID

Email

Phone

Password Hash

Status

Created At

Updated At

```


---

# 7. Password Security


Password tidak pernah disimpan plain text.


Flow:


```

User Password

```
    |

    |
```

Hash Algorithm

```
    |

    |
```

Password Hash

```
    |

    |
```

Database

```


Rekomendasi:


```

Argon2id

atau

bcrypt

```


---

# 8. Password Policy


Minimum:


```

Length >= 8 characters

Combination:

Uppercase

Lowercase

Number

Optional:

Special Character

```


Future:


```

Passwordless Authentication

SSO

OAuth

```


---

# 9. JWT Authentication Architecture


YakinLulus.id menggunakan:


```

Access Token

*

Refresh Token

```


Flow:


```

Login

|

Verify Credential

|

Generate Token

|

Return Token

|

Client Store Securely

|

API Request

````


---

# 10. Token Structure


Access Token:


```json
{
 "sub":"user_id",
 "role":"student",
 "exp":123456789
}
````

Berisi:

```
User Identity

Role

Expiration

Permission Scope

```

---

# 11. Access Token Strategy

Karakteristik:

```
Short Lifetime

15 - 30 minutes

```

Tujuan:

* mengurangi risiko token theft;
* membatasi session exposure.

---

# 12. Refresh Token Strategy

Refresh token:

```
Longer Lifetime

7 - 30 days

```

Digunakan:

```
Generate New Access Token

```

---

# 13. Token Storage Strategy

## Web Application

Rekomendasi:

```
HttpOnly Cookie

+

Secure Flag

+

SameSite Policy

```

Hindari:

```
LocalStorage

untuk token sensitif

```

---

## Mobile Application

Menggunakan:

```
Secure Storage


Android:

Keystore


iOS:

Keychain

```

---

# 14. Session Management

Session menyimpan:

```
User ID

Device Information

Login Time

Last Activity

Token Status

```

Diagram:

```
User


 |

Login


 |

Create Session


 |

Session Store


 |

Redis / Database

```

---

# 15. RBAC Architecture

YakinLulus.id menggunakan:

```
Role Based Access Control

```

Model:

```
User


 |

Role


 |

Permission


 |

Resource

```

---

# 16. Role Definition

Role utama:

```
SUPER_ADMIN

ADMIN

STAFF

TEACHER

STUDENT

```

---

# 17. Permission Model

Permission menggunakan:

```
resource.action

```

Contoh:

```
question.create

question.update

question.delete

exam.create

exam.publish

analytics.view

```

---

# 18. RBAC Database Model

```
users


 |

user_roles


 |

roles


 |

role_permissions


 |

permissions

```

---

# 19. Authorization Flow

```
Request


 |

JWT Validation


 |

Extract User Identity


 |

Load Permission


 |

Permission Check


 |

Allow / Reject

```

---

# 20. Middleware Architecture

API Middleware:

```
HTTP Request


      |

Authentication Middleware


      |

Authorization Middleware


      |

Handler


```

---

# 21. Resource Level Authorization

Tidak cukup hanya role.

Contoh:

Teacher:

```
Boleh edit soal miliknya sendiri

```

Tetapi:

```
Tidak boleh edit soal teacher lain

```

Menggunakan:

```
Ownership Check

+

Permission Check

```

---

# 22. Multi Role Support

User dapat memiliki beberapa role.

Contoh:

```
Teacher

+

School Admin

```

Model:

```
User


 |

Many To Many


 |

Role

```

---

# 23. School Organization Access

Future multi tenant:

```
User


 |

Organization Membership


 |

Organization Role

```

Contoh:

```
Teacher A

School Jakarta


Teacher B

School Bandung

```

---

# 24. Audit Security Logging

Semua aktivitas penting dicatat.

Event:

```
Login Success

Login Failed

Password Changed

Permission Changed

Role Changed

```

Format:

```
AuditLog


User

Action

IP Address

Device

Timestamp

```

---

# 25. Account Security

Protection:

## Login Attempt Control

```
Maximum Failed Attempt


Temporary Lock

```

---

## Suspicious Activity

Future:

```
New Device Detection

Location Detection

Risk Scoring

```

---

# 26. MFA Future Architecture

Future enterprise:

```
User


 |

Password


 |

OTP / Authenticator


 |

Access Granted

```

Support:

```
TOTP

Email OTP

SMS OTP

```

---

# 27. API Security Integration

Authentication diterapkan pada:

```
API Gateway


        |

        |

Service Middleware


        |

        |

Domain Authorization

```

---

# 28. Service To Service Authentication

Future microservice:

```
Service A


 |

Service Token


 |

Service B

```

Menggunakan:

```
JWT Service Token

atau

mTLS

```

---

# 29. Security Testing

Testing:

## Authentication Test

```
Invalid Password

Expired Token

Token Replay

```

---

## Authorization Test

```
Student Access Admin API

Teacher Access Other Data

```

---

# 30. Scalability Strategy

Phase MVP:

```
JWT

+

RBAC

+

Single Identity Module

```

---

Phase Growth:

```
Dedicated Identity Service

+

SSO

+

MFA

```

---

Enterprise:

```
OAuth2

OIDC

SAML

Enterprise IAM

```

---

# 31. Summary

Authentication & Authorization Architecture YakinLulus.id:

```
JWT Authentication

+

Refresh Token

+

RBAC

+

Permission System

+

Audit Logging

+

Future IAM Ready
```

Memberikan:

* keamanan identity;
* kontrol akses granular;
* mendukung multi role;
* siap multi school;
* siap enterprise platform.

````

-