Melanjutkan ke file berikutnya:

# `11_implementation_architecture/04_frontend_architecture.md`

```md id="r8v4kc"
# Frontend Architecture
## YakinLulus.id Frontend Architecture Specification

Version: 1.0  
Document Type: Technical Architecture Specification  
Phase: Implementation Architecture


---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan rancangan arsitektur frontend YakinLulus.id.

Frontend bertanggung jawab terhadap:

- user interface;
- user experience;
- client-side state management;
- API communication;
- offline capability;
- responsive design;
- accessibility.


Target platform:

```

Web Application

*

Admin Dashboard

*

Teacher Dashboard

*

Student Portal

```id="m2f7qp"


---

# 2. Frontend Architecture Principles


Frontend menggunakan prinsip:


```

Component Based Architecture

*

Feature Driven Development

*

Type Safety

*

Reusable Design System

*

Responsive First

*

API Driven Application

```id="c4z8ma"


---

# 3. Technology Stack


## Core Technology


```

Framework:

React

Language:

TypeScript

Build Tool:

Vite

Package Manager:

pnpm / npm

Runtime:

Modern Browser

```id="v9x2kd"


---

# 4. Frontend High Level Architecture


```

```
                User


                 |

                 |

          React Application


                 |

    +------------+------------+

    |                         |
```

Presentation Layer       State Layer

```
    |                         |

    +------------+------------+

                 |

          API Client Layer


                 |

                 |

          Backend REST API
```

```id="x5m7cq"


---

# 5. Application Structure


Frontend repository:


```

frontend/

├── src/

│
├── app/

│
├── features/

│
├── components/

│
├── layouts/

│
├── hooks/

│
├── services/

│
├── stores/

│
├── utils/

│
├── types/

│
├── assets/

│
└── routes/

```id="k7p3vm"


---

# 6. Feature Based Architecture


Frontend menggunakan feature-oriented structure.


Contoh:


```

features/

├── auth/

├── question-bank/

├── exam/

├── cbt/

├── learning/

├── analytics/

├── profile/

└── administration/

```id="s4h9nk"


Setiap feature memiliki:


```

feature/

├── pages/

├── components/

├── hooks/

├── api/

├── types/

├── validation/

└── store/

```id="w2c6px"


---

# 7. Component Architecture


Component dibagi menjadi:


## 7.1 Shared Components


Komponen reusable:


Contoh:


```

Button

Modal

Table

Form

Card

Pagination

Loading State

Error Display

```id="n7p4yd"


Lokasi:


```

src/components/

```id="8h3qaz"


---

## 7.2 Feature Components


Komponen khusus domain.


Contoh:


CBT:


```

QuestionViewer

AnswerOption

TimerDisplay

ExamNavigation

FlagButton

```id="t9k2mx"


Learning:


```

MaterialViewer

VideoPlayer

ProgressCard

```id="g6r4pw"


---

# 8. Frontend Layer Architecture


```

+--------------------------------+

```
        Pages
```

+--------------------------------+

```
        Components
```

+--------------------------------+

```
        Hooks
```

+--------------------------------+

```
        Services
```

+--------------------------------+

```
        State Management
```

+--------------------------------+

```
        API Client
```

+--------------------------------+

```
        Backend API
```

+--------------------------------+

```id="q2f5nv"


---

# 9. Routing Architecture


Menggunakan:


```

React Router

```id="p8x4wk"


Struktur:


```

routes/

├── public.routes.ts

├── student.routes.ts

├── teacher.routes.ts

├── admin.routes.ts

└── superadmin.routes.ts

```id="z4h8mq"


---

# 10. Role Based UI Architecture


Frontend mendukung RBAC.


```

User Login

```
  |

  |
```

Load Permission

```
  |

  |
```

Render Available Feature

```id="a6v3tp"


Contoh:


Student:


```

Question Bank

Exam

Learning

Progress

```id="j9m4fx"


Admin:


```

User Management

Content Management

Analytics

```id="v3q8hs"


---

# 11. State Management Architecture


State dibagi menjadi:


## Server State


Menggunakan:


```

React Query

```id="y8k3sd"


Untuk:


- API data;
- caching;
- synchronization.


Contoh:


```

Question List

Exam Detail

Student Progress

```id="h4x7mz"


---

## Client State


Menggunakan:


```

Zustand

atau

Redux Toolkit

```id="w5r8qp"


Untuk:


```

Theme

Sidebar

User Preference

Temporary UI State

```id="g3m7vn"


---

# 12. API Communication Architecture


Frontend menggunakan API abstraction.


```

Component

|

Hook

|

Service Layer

|

API Client

|

REST API

```id="u8q2kc"


Contoh:


```

examService.startExam()

examService.submitAnswer()

questionService.getQuestions()

```id="f5n9wx"


---

# 13. HTTP Client Architecture


Menggunakan:


```

Axios

atau

Fetch Wrapper

```id="d6p3my"


Fitur:


- interceptors;
- token handling;
- error handling;
- request retry.


---

# 14. Authentication Flow


```

User

|

Login Form

|

Auth Service

|

Backend API

|

Receive JWT

|

Store Session

|

Access Protected Page

```id="m7v2kp"


Storage:


Preferred:


```

HttpOnly Secure Cookie

```id="x4z9ba"


Alternative:


```

Secure Storage

```id="h6c8tr"


---

# 15. CBT Frontend Architecture


CBT membutuhkan performa khusus.


Architecture:


```

```
             CBT Screen


                 |

    +------------+------------+

    |                         |
```

Question Renderer          Timer Engine

```
    |                         |
```

Answer State             Session Sync

```
    |                         |

    +------------+------------+

                 |

           CBT API
```

```id="p9w3kd"


---

# 16. CBT Client Features


Frontend CBT mendukung:


## Question Navigation


```

Previous

Next

Jump Question

Flag Question

```id="r4k7mt"


---

## Timer Management


Client memiliki:


```

Local Timer

*

Server Time Validation

```id="q6v8sm"


Tujuan:


- mencegah manipulasi waktu;
- mendukung offline.


---

## Answer Persistence


Setiap jawaban:


```

User Select Answer

```
    |
```

Save Local State

```
    |
```

Sync API

```id="m5q8xz"


---

# 17. Offline Capability Architecture


Untuk CBT offline:


```

Browser / Mobile

```
   |
```

Local Storage

```
   |
```

Offline Queue

```
   |
```

Sync Engine

```
   |
```

Backend API

```id="c8m2vr"


Teknologi:


Web:

```

IndexedDB

Service Worker

```id="j5p8qn"


---

# 18. Design System Architecture


YakinLulus menggunakan design system.


Komponen:


```

Typography

Color System

Spacing

Buttons

Forms

Cards

Navigation

Charts

```id="v7x3mw"


Theme:


```

Light Mode

Dark Mode

```id="n6r2kp"


---

# 19. Responsive Architecture


Target:


```

Desktop

Tablet

Mobile

```id="k4m9ws"


Pendekatan:


```

Mobile First

Responsive Layout

Adaptive Component

```id="x2q7zn"


---

# 20. Frontend Security


Implementasi:


## Input Security


```

Validation

Sanitization

XSS Protection

```id="p7v5mk"


---

## Authentication Security


```

Token Protection

Route Guard

Permission Check

```id="q3m8sd"


---

## Content Security


```

CSP

Secure Asset Loading

```id="r9w4yx"


---

# 21. Performance Optimization


Teknik:


## Code Splitting


```

Load Feature When Needed

```id="z6n2pk"


---

## Lazy Loading


Contoh:


```

Admin Module

Analytics Module

```id="y5v8mq"


---

## Caching


```

React Query Cache

Browser Cache

Asset Cache

```id="m4k7ws"


---

# 22. Error Handling Architecture


Global handling:


```

API Error

```
  |
```

Error Boundary

```
  |
```

User Friendly Message

```id="b8q5nx"


Kategori:


```

Network Error

Validation Error

Permission Error

System Error

```id="s7m3kd"


---

# 23. Testing Strategy


Testing:


## Unit Test


```

Component

Hooks

Utility

```id="d5p9vx"


---

## Integration Test


```

Feature Flow

API Integration

```id="w8m2qc"


---

## E2E Test


Menggunakan:


```

Playwright

Cypress

```id="n4x7kb"


Scenario:


```

Login

Start Exam

Submit Answer

View Result

```id="u3m6qp"


---

# 24. Build & Deployment


Build:


```

npm run build

```id="g5k8rz"


Output:


```

Static Assets

```id="p2x6mv"


Deployment:


```

Nginx

CDN

Cloud Storage

```id="z8r4nm"


---

# 25. Future Scalability


## Micro Frontend Ready


Jika scale besar:


```

Main Application

```
  |
```

+-----+------+------+

Exam   AI   Analytics

App    App    App

```id="y9k5vw"


---

## Multiple Client Support


Architecture siap:


```

Web

Mobile

Tablet

Smart Device

```id="h3q7mp"


---

# 26. Summary


Frontend Architecture YakinLulus.id:


```

React

*

TypeScript

*

Feature Driven Architecture

*

Reusable Component

*

Strong Type Safety

*

Offline Ready

*

Responsive Design

```id="r6m8px"


Memberikan:

- UI konsisten;
- development cepat;
- mudah maintenance;
- performa tinggi;
- siap berkembang.
```
