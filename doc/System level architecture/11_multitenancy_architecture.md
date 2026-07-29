Melanjutkan ke file berikutnya:

# `11_implementation_architecture/11_multitenancy_architecture.md`

```md id="mtarch11"
# Multitenancy Architecture
## YakinLulus.id Multi-Tenant Architecture Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan arsitektur multi-tenancy pada platform YakinLulus.id.

Multi-tenancy diperlukan karena target pengembangan YakinLulus.id adalah:

```

Phase 1:

Internal Testing

Phase 2:

School Platform

Phase 3:

Multi School SaaS Platform

```


Architecture harus mendukung:

- banyak sekolah dalam satu platform;
- isolasi data antar organisasi;
- custom configuration;
- subscription model;
- enterprise deployment.


---

# 2. Konsep Multi-Tenancy


Multi-tenancy adalah kemampuan satu aplikasi melayani beberapa organisasi (tenant) dengan data yang terisolasi.


Contoh:


```

YakinLulus Platform

```
    |

    |
```

+-------+-------+-------+

|       |       |       |

School A   School B   School C

```


Setiap sekolah memiliki:

- user sendiri;
- teacher sendiri;
- student sendiri;
- exam sendiri;
- analytics sendiri.


---

# 3. Multi-Tenant Architecture Principles


YakinLulus menggunakan prinsip:


```

Tenant Isolation

*

Security Boundary

*

Shared Infrastructure

*

Flexible Scaling

```


---

# 4. Tenant Definition


Tenant adalah organisasi pengguna platform.


Contoh:


```

Tenant:

* Sekolah
* Lembaga Pendidikan
* Bimbingan Belajar
* Corporate Learning

```


---

# 5. Tenant Entity Model


Konsep:


```

Tenant

|

+----------------+

|

id

name

domain

status

plan

created_at

```


---

# 6. Tenant Relationship Model


High level:


```

Tenant

|

+-------------+

|             |

Users       Content

|

Students

Teachers

Admins

```


---

# 7. Multi-Tenant Database Strategy


Ada beberapa pendekatan:


## Strategy 1
## Shared Database Shared Schema


```

Single Database

```
    |
```

Single Schema

```
    |
```

tenant_id column

```


Contoh:


```

users

id

tenant_id

name

```


---

## Strategy 2
## Shared Database Separate Schema


```

Database

|

+------+------+

|             |

Tenant A   Tenant B

Schema      Schema

```


---

## Strategy 3
## Separate Database


```

Tenant A

Database A

Tenant B

Database B

```


---

# 8. Strategy YakinLulus.id


Untuk MVP:


Menggunakan:


```

Shared Database

*

Shared Schema

*

tenant_id isolation

```


Alasan:


- development lebih cepat;
- biaya rendah;
- maintenance sederhana.


---

# 9. Database Isolation Pattern


Semua tabel tenant-aware memiliki:


```

tenant_id UUID

```


Contoh:


```

questions

id

tenant_id

subject_id

content

```


---

# 10. Tenant Data Boundary


Contoh:


Tenant A:


```

Student A

Exam A

Question A

```


Tidak boleh melihat:


```

Student B

Exam B

Question B

```


---

# 11. Tenant Context Architecture


Setiap request membawa tenant context.


Flow:


```

Request

|

Authentication

|

Extract User

|

Determine Tenant

|

Set Tenant Context

|

Execute Query

````


---

# 12. Tenant Resolution Strategy


Cara menentukan tenant:


## Method 1
## JWT Claim


Contoh:


```json
{
"user_id":"123",
"tenant_id":"school001"
}
````

---

## Method 2

## Subdomain

Contoh:

```
school-a.yakinlulus.id


school-b.yakinlulus.id

```

---

## Method 3

## Header

Contoh:

```
X-Tenant-ID:

school001

```

---

# 13. Recommended MVP Approach

Menggunakan:

```
JWT Tenant Claim


+

Database tenant_id filtering

```

Karena:

* simple;
* aman;
* mudah dikembangkan.

---

# 14. Application Layer Tenant Handling

Architecture:

```
HTTP Request


      |

Tenant Middleware


      |

Context Injection


      |

Use Case


      |

Repository


      |

Database Query


```

---

# 15. Repository Tenant Isolation

Repository harus otomatis filter tenant.

Contoh:

Salah:

```
SELECT *

FROM exams;

```

Benar:

```
SELECT *

FROM exams

WHERE tenant_id = ?

```

---

# 16. ORM Pattern

Repository:

```
ExamRepository


+

TenantContext


```

Query:

```
repository.FindAll()

```

Internal:

```
WHERE tenant_id=currentTenant

```

---

# 17. Tenant Aware Entity

Entity:

```
Exam


{

id

tenant_id

title

duration

}

```

---

# 18. User Multi Tenant Membership

Future:

Satu user dapat berada pada beberapa tenant.

Model:

```
User


 |

Membership


 |

Tenant


```

Contoh:

```
Teacher


School A

School B

```

---

# 19. Tenant Role Management

Role dapat berbeda tiap tenant.

Contoh:

```
User:


Tenant A

Teacher


Tenant B

Admin

```

Model:

```
User


 |

Tenant Membership


 |

Tenant Role

```

---

# 20. Tenant Configuration

Setiap tenant dapat memiliki konfigurasi:

```
Tenant Setting


|

Theme

Logo

Exam Rule

Feature Flag

Language

```

---

# 21. Custom Branding

Future SaaS:

Tenant memiliki:

```
Logo

Color Theme

Domain

Email Template

```

Contoh:

```
app.sekolahku.id

```

---

# 22. Tenant Subscription Model

Future:

```
Tenant


 |

Subscription


 |

Plan


```

Plan:

```
Free

Basic

Premium

Enterprise

```

---

# 23. Tenant Resource Limitation

Contoh:

Free:

```
100 Students

1000 Questions

```

Premium:

```
Unlimited

Advanced Analytics

```

---

# 24. Security Architecture

Multi tenant security:

```
Authentication


        |

Tenant Validation


        |

Authorization


        |

Data Access

```

---

# 25. Preventing Tenant Leakage

Risiko:

```
Bug Query


        |

Expose Data Tenant Lain

```

Pencegahan:

* automatic tenant filter;
* integration test;
* database policy;
* audit.

---

# 26. PostgreSQL Row Level Security Future

Untuk enterprise:

```
PostgreSQL RLS


+

tenant_id policy

```

Contoh:

```
CREATE POLICY tenant_isolation

ON exams

USING

(tenant_id=current_tenant);

```

---

# 27. Tenant Migration Strategy

Jika tenant besar:

Awal:

```
Shared Database

```

Migrasi:

```
Dedicated Database


for Large Tenant

```

Tanpa perubahan besar.

---

# 28. Scaling Strategy

Phase 1:

```
Single Database


Single Backend

```

---

Phase 2:

```
Database Optimization


Read Replica


Caching

```

---

Phase 3:

```
Tenant Based Scaling


Dedicated Infrastructure

```

---

# 29. Microservice Evolution

Future:

```
Tenant Service


        |

Identity Service


        |

Exam Service


        |

Learning Service

```

Tenant context menjadi:

```
Global Request Context

```

---

# 30. Testing Strategy

Testing:

## Isolation Test

```
Tenant A cannot access Tenant B

```

---

## Permission Test

```
Tenant Admin limitation

```

---

## Migration Test

```
Move tenant database

```

---

# 31. Summary

Multi-Tenancy Architecture YakinLulus.id:

```
Shared Database

+

Tenant Isolation

+

Tenant Context

+

RBAC Integration

+

Future SaaS Ready

```

Memberikan:

* keamanan antar sekolah;
* biaya operasional rendah;
* mudah scale;
* siap menjadi platform EdTech SaaS enterprise.

````
