```markdown id="a8m2kd"
# 12_engineering_implementation_guide/security/02_authentication_security.md

# Authentication Security Architecture

## 1. Tujuan

Dokumen ini menjelaskan strategi keamanan authentication pada platform YakinLulus.id.

Authentication bertanggung jawab memastikan:

```

User Identity Verification

*

Credential Protection

*

Session Security

*

Access Control Foundation

```

Authentication harus melindungi:

```

Student Account

Teacher Account

Staff Account

Administrator Account

System Service Account

```

---

# 2. Authentication Architecture


```

User

|

|

Login Request

|

|

Authentication Service

|

|

Credential Verification

|

|

Token Generation

|

|

Session Management

|

|

Authorized Access

```

---

# 3. Authentication Principle


Menggunakan prinsip:


```

Strong Identity Verification

*

Secure Credential Storage

*

Short-Lived Token

*

Session Protection

*

Attack Prevention

```

---

# 4. Authentication Components


Komponen:


```

Identity Provider

Password Management

Token Service

Session Manager

MFA Service

Audit Logger

```

---

# 5. Supported Authentication Method


MVP:


```

Email + Password

Username + Password

```

Future:


```

Google OAuth

Microsoft Login

School SSO

Phone Authentication

Multi Factor Authentication

```

---

# 6. User Credential Storage


Password tidak boleh disimpan:


```

Plain Text

```

Wajib:


```

Password Hash

*

Salt

*

Strong Hash Algorithm

```

---

# 7. Password Hashing Strategy


Recommended:


```

Argon2id

```

Alternative:


```

bcrypt

PBKDF2

```

---

Example:


```

Input Password

```
    |

    |
```

Hash Algorithm

```
    |

    |
```

Stored Hash

```

---

# 8. Password Policy


Minimum:


```

Minimum 8 Character

Combination Required

No Common Password

Password History

```

---

Recommended:


```

12+ Character

Password Strength Meter

Breach Password Check

```

---

# 9. Login Flow


```

User Input Credential

```
    |

    |
```

Validate Input

```
    |

    |
```

Find User

```
    |

    |
```

Verify Password Hash

```
    |

    |
```

Generate Token

```
    |

    |
```

Create Session

```
    |

    |
```

Login Success

```

---

# 10. Failed Login Protection


Protection:


```

Login Attempt Tracking

Rate Limiting

Temporary Lock

Suspicious Detection

```

---

Example:


```

5 Failed Login

```
    |
```

Account Temporarily Locked

```
    |
```

Security Event Created

```

---

# 11. JWT Authentication Strategy


YakinLulus.id menggunakan:


```

Access Token

*

Refresh Token

```

---

# 12. Access Token


Karakteristik:


```

Short Lifetime

Used For API Request

Limited Exposure

```

Recommended:


```

15 - 30 Minutes

```

---

# 13. Refresh Token


Karakteristik:


```

Longer Lifetime

Generate New Access Token

Stored Securely

```

Recommended:


```

7 - 30 Days

```

---

# 14. JWT Flow


```

Login

|

Generate Access Token

|

Generate Refresh Token

|

Client Store Token

|

API Request

|

Validate Token

|

Allow Access

```

---

# 15. Token Security


Protection:


```

Strong Secret Key

Token Expiration

Token Rotation

Token Revocation

HTTPS Only

```

---

# 16. Refresh Token Rotation


Flow:


```

Refresh Token Used

```
    |

    |
```

Invalidate Old Token

```
    |

    |
```

Generate New Token

```
    |

    |
```

Store New Token

```

---

# 17. Token Storage


Web:


Recommended:


```

HttpOnly Cookie

Secure Cookie

SameSite Policy

```

---

Avoid:


```

localStorage Token

```

untuk token sensitif.

---

# 18. Session Management


Session menyimpan:


```

User ID

Device Information

Login Time

IP Address

Token Status

```

---

# 19. Session Security


Protection:


```

Session Expiration

Logout Invalidation

Concurrent Session Control

Device Tracking

```

---

# 20. Logout Flow


```

User Logout

|

Invalidate Refresh Token

|

Destroy Session

|

Clear Cookie

|

Audit Event

```

---

# 21. Multi Device Session


Contoh:


User login:


```

Laptop

*

Mobile Phone

```

Sistem menyimpan:


```

Device A Session

Device B Session

```

---

User dapat:


```

View Active Session

Logout Specific Device

Logout All Device

```

---

# 22. Multi Factor Authentication Ready


Architecture harus mendukung:


```

Password

*

Second Factor

```

Future:


```

OTP

Authenticator App

Security Key

Email Verification

```

---

# 23. Email Verification


Flow:


```

Register

|

Generate Verification Token

|

Send Email

|

User Confirm

|

Activate Account

```

---

# 24. Account Recovery


Forgot Password:


```

Request Reset

|

Generate Secure Token

|

Send Reset Link

|

Verify Token

|

Create New Password

```

---

# 25. Password Reset Security


Protection:


```

Short Expiry Token

Single Usage Token

Rate Limit

Audit Logging

```

---

# 26. Brute Force Protection


Strategy:


```

IP Rate Limit

Account Rate Limit

Progressive Delay

Captcha Trigger

```

---

# 27. Suspicious Login Detection


Detect:


```

New Device

New Location

Multiple Failed Login

Unusual Time

```

---

# 28. Authentication Audit Event


Log:


```

Login Success

Login Failed

Logout

Password Change

Password Reset

Token Refresh

MFA Change

````

---

Example:


```json
{
 "event":"LOGIN_SUCCESS",
 "user_id":"123",
 "device":"Chrome",
 "timestamp":"2026-07-26T10:00:00"
}
````

---

# 29. Service Account Authentication

Internal service:

```
Backend Service

Worker Service

AI Service

Notification Service

```

menggunakan:

```
Service Token

API Credential

Certificate

```

---

# 30. API Authentication Middleware

Flow:

```
Incoming Request


 |

Extract Token


 |

Validate Signature


 |

Check Expiration


 |

Load User Identity


 |

Continue Request

```

---

# 31. Authentication Error Response

Tidak memberikan informasi sensitif.

Bad:

```
Email exists but password wrong

```

Good:

```
Invalid credential

```

---

# 32. Security Headers

Authentication response wajib:

```
Strict-Transport-Security

X-Frame-Options

Content-Security-Policy

Secure Cookie Flag

```

---

# 33. Production Authentication Checklist

```
☑ Password Hashing Enabled

☑ JWT Secure Configuration

☑ Refresh Token Rotation

☑ HTTPS Only

☑ Rate Limiting Enabled

☑ Session Management

☑ Audit Logging

☑ Password Recovery Secure

☑ MFA Ready

```

---

# 34. Authentication Evolution Roadmap

## MVP

```
Email Password Login

JWT Authentication

Refresh Token

RBAC Integration

Audit Log

```

---

## Growth

```
OAuth Provider

MFA

Device Management

Risk Based Authentication

```

---

## Enterprise

```
SSO

Identity Provider

Zero Trust Authentication

Adaptive Authentication

```

---

# Summary

Authentication Security Architecture YakinLulus.id:

```
Secure Credential

+

Token Management

+

Session Protection

+

Attack Prevention

+

Audit Tracking

=

Trusted User Identity System

```

Authentication menjadi fondasi keamanan karena seluruh fitur seperti CBT, bank soal, analytics, AI tutor, dan learning progress bergantung pada identitas pengguna yang valid.

