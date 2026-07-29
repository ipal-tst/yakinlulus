```markdown id="x2m8ql"
# 12_engineering_implementation_guide/mobile/06_api_integration.md

# Mobile API Integration Implementation

## 1. Tujuan

Dokumen ini menjelaskan standar implementasi komunikasi antara mobile application YakinLulus.id dengan backend API.

API integration menjadi komponen penting karena seluruh fitur utama bergantung pada komunikasi client-server:

- authentication;
- user management;
- learning material;
- question bank;
- CBT engine;
- answer submission;
- scoring;
- analytics;
- AI service.


Tujuan implementasi:

- membuat komunikasi API konsisten;
- aman;
- mudah dipelihara;
- mendukung offline-first architecture;
- mudah melakukan debugging;
- siap berkembang pada skala besar.


---

# 2. API Communication Architecture


Arsitektur:


```

Flutter Application

```
    |
```

API Client Layer

```
    |
```

Repository Layer

```
    |
```

Use Case Layer

```
    |
```

Application Feature

```
    |
```

Backend REST API

```


Detail flow:


```

User Action

```
  |
```

Presentation Layer

```
  |
```

Use Case

```
  |
```

Repository

```
  |
```

API Client

```
  |
```

HTTPS Request

```
  |
```

Backend API

```
  |
```

Response Mapping

```
  |
```

Domain Entity

```
  |
```

UI Update

```


---

# 3. HTTP Client Implementation


YakinLulus menggunakan:


```

Dio HTTP Client

```


Alasan:

- interceptor support;
- request customization;
- timeout management;
- retry mechanism;
- error handling;
- upload support.


---

# 4. Network Layer Structure


Lokasi:


```

core/network/

├── api_client.dart

├── api_interceptor.dart

├── api_exception.dart

├── api_response.dart

├── network_info.dart

└── endpoints.dart

```


---

# 5. API Client Responsibility


API client bertanggung jawab:

- membuat HTTP request;
- menambahkan header;
- mengirim authentication token;
- parsing response;
- menangani network error.


Contoh:


```

ApiClient

GET()

POST()

PUT()

DELETE()

UPLOAD()

```


---

# 6. API Request Flow


Contoh mengambil materi:


```

Learning Page

```
    |
```

LearningUseCase

```
    |
```

LearningRepository

```
    |
```

LearningRemoteDatasource

```
    |
```

ApiClient

```
    |
```

GET /api/v1/materials

```
    |
```

Backend

```
    |
```

JSON Response

```
    |
```

Mapper

```
    |
```

Material Entity

```


---

# 7. Base API Configuration


Configuration:


```

API Base URL

Timeout

Headers

Environment

Certificate

```


Contoh:


Development:


```

[https://dev-api.yakinlulus.id](https://dev-api.yakinlulus.id)

```


Staging:


```

[https://staging-api.yakinlulus.id](https://staging-api.yakinlulus.id)

```


Production:


```

[https://api.yakinlulus.id](https://api.yakinlulus.id)

```


---

# 8. Authentication Integration


Authentication menggunakan:


```

JWT Access Token

*

Refresh Token

```


Flow:


```

Login

|

Backend Validation

|

Receive Token

|

Store Securely

|

Attach Token

|

API Request

```


---

# 9. Token Management


Token disimpan pada:


```

Flutter Secure Storage

```


Tidak menggunakan:


```

SharedPreferences

Plain File

Memory Only

```


---

# 10. HTTP Interceptor


Interceptor bertugas:


```

Request

|

Add Authorization Header

|

Send Request

|

Receive Response

|

Handle Error

```


Contoh header:


```

Authorization:

Bearer <access_token>

Content-Type:

application/json

```


---

# 11. Automatic Token Refresh


Ketika token expired:


```

API Request

```
  |
```

401 Unauthorized

```
  |
```

Refresh Token Request

```
  |
```

Receive New Token

```
  |
```

Retry Original Request

```


Jika gagal:


```

Logout User

Clear Session

Redirect Login

````


---

# 12. API Response Standard


Semua response mengikuti format:


```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "meta": {}
}
````

---

# 13. Data Mapping Strategy

Response API tidak langsung digunakan UI.

Flow:

```
JSON Response


      |

DTO Model


      |

Mapper


      |

Domain Entity


      |

UI

```

Contoh:

```
QuestionResponseModel


        ↓


QuestionEntity


        ↓


QuestionWidget

```

---

# 14. Repository Integration

Repository menjadi abstraction layer.

Contoh:

```
ExamRepository


(interface)


        ↑


ExamRepositoryImpl


        |

ExamApiDatasource


        |

API

```

Keuntungan:

* mudah testing;
* mudah mengganti API;
* mendukung offline.

---

# 15. Offline API Strategy

Mobile tidak selalu bergantung API.

Architecture:

```
Application


      |

Repository


      |

+----------------+

|                |

Local Database  API

|                |

+----------------+


      |

Sync Manager

```

---

# 16. Request Priority

Tidak semua request memiliki prioritas sama.

## High Priority

Contoh:

```
Submit Answer

Authentication

Exam Completion

```

Harus segera dikirim.

---

## Medium Priority

```
Learning Progress

Bookmark

History

```

---

## Low Priority

```
Analytics Event

Usage Tracking

```

---

# 17. Retry Strategy

Network error:

```
Request Failed


      |

Check Error Type


      |

Retry

      |

Success

      |

Continue

```

Contoh:

Retry hanya untuk:

* timeout;
* temporary network failure.

Tidak retry:

* invalid credential;
* validation error.

---

# 18. Upload Handling

Untuk:

* profile image;
* learning media;
* answer attachment.

Flow:

```
File


 |

Compression


 |

Multipart Request


 |

Upload API


 |

Storage URL

```

---

# 19. Large File Handling

Untuk multimedia:

Tidak:

```
Download Semua File Sekaligus

```

Gunakan:

```
Streaming

Chunk Download

Background Download

Cache

```

---

# 20. API Error Handling

Mapping:

```
HTTP Error


      |

API Exception


      |

Failure Object


      |

State Error


      |

UI Message

```

Kategori:

```
NetworkFailure

AuthenticationFailure

ValidationFailure

ServerFailure

TimeoutFailure

```

---

# 21. API Logging

Development:

```
Request

Response

Headers

Timing

```

Production:

```
Error Only

No Sensitive Data

```

Tidak boleh log:

* token;
* password;
* personal data.

---

# 22. Security Consideration

Implementasi:

## HTTPS

Mandatory:

```
TLS 1.2+
```

---

## Certificate Validation

Untuk mencegah:

```
Man In The Middle Attack
```

---

## Data Protection

Sensitive response:

* tidak disimpan plaintext;
* menggunakan encryption.

---

# 23. Testing Strategy

API integration testing:

## Unit Test

Test:

```
Repository

Mapper

Datasource

```

---

## Mock API Test

Menggunakan:

```
Mock Server

Fake Repository

```

---

## Integration Test

Flow:

```
Mobile

↓

API

↓

Backend

```

---

# 24. Performance Optimization

Strategi:

## Pagination

Untuk:

```
Question Bank

Material List

Ranking

```

---

## Caching

Untuk:

```
Subject

Chapter

Material Metadata

```

---

## Compression

Gunakan:

```
GZIP

Image Compression

Response Optimization

```

---

# 25. Future Scalability

Architecture mendukung:

## API Gateway

Future:

```
Mobile

 |

API Gateway

 |

Multiple Services

```

---

## Real Time Communication

Future:

```
WebSocket

Push Notification

Live Exam Monitoring

```

---

# Summary

Mobile API integration YakinLulus.id menggunakan:

```
Dio Client

+

Repository Pattern

+

JWT Authentication

+

Secure Storage

+

Offline First Support

+

Error Standardization

+

Testing Ready

```

Architecture ini memastikan mobile application dapat berkomunikasi dengan backend secara:

* aman;
* reliable;
* scalable;
* mudah dikembangkan.
