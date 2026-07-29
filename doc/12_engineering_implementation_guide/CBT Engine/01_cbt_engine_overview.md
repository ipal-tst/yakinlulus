cbt_engine/01_cbt_engine_overview.md

# 12_engineering_implementation_guide/cbt_engine/01_cbt_engine_overview.md

# CBT Engine Overview

## 1. Tujuan

Dokumen ini menjelaskan arsitektur dan konsep utama CBT (Computer Based Test) Engine pada platform YakinLulus.id.

CBT Engine merupakan core system yang menangani seluruh lifecycle ujian digital:

- pembuatan ujian;
- konfigurasi ujian;
- pemilihan soal;
- distribusi soal;
- exam session;
- timer;
- navigation;
- penyimpanan jawaban;
- scoring;
- grading;
- analytics.


CBT Engine harus memiliki karakteristik:



High Reliability

Low Latency

Data Consistency

Offline Capability

Anti Cheating Support



---

# 2. Peran CBT Engine dalam Sistem


Architecture:


            Student


              |

        Frontend / Mobile


              |

          CBT API Layer


              |

          CBT Engine


  +-----------+------------+

  |           |            |

Session Question Scoring

Engine Engine Engine

  |

Database + Cache + Queue



---

# 3. CBT Engine Responsibility


CBT Engine bertanggung jawab:


## Exam Runtime


Mengelola:



Exam Session

Question Delivery

Answer State

Timer

Navigation

Submission



---

## Question Runtime


Mengelola:



Question Pool

Question Selection

Randomization

Question Ordering

Question Version



---

## Answer Processing


Mengelola:



Answer Storage

Answer Validation

Answer Synchronization

Answer Recovery



---

## Result Processing


Mengelola:



Auto Grading

Score Calculation

Ranking Data

Analytics Event



---

# 4. CBT Engine Architecture


High Level:


                CBT ENGINE


                     |

    +----------------+----------------+

    |                |                |

Session Engine Question Engine Answer Engine

    |                |                |

    +----------------+----------------+

                     |

              Scoring Engine


                     |

             Analytics Pipeline


---

# 5. Core Components


## 5.1 Exam Session Engine


Purpose:


Membuat dan mengelola sesi ujian.


Mengelola:



session creation

session state

session timeout

session completion

session recovery



Entity utama:



exam_sessions



State:



CREATED

STARTED

PAUSED

SUBMITTED

COMPLETED

EXPIRED



---

# 5.2 Question Engine


Purpose:


Menyediakan soal kepada peserta.


Tanggung jawab:



Load Question Pool

Apply Randomization

Generate Question Order

Serve Question



Entity:



questions

exam_question_pool

session_questions



---

# 5.3 Timer Engine


Purpose:


Mengontrol waktu ujian.


Fitur:



Exam Duration

Remaining Time

Auto Submit

Time Synchronization



Tidak menyimpan timer hanya di client.


Source of truth:



Server Time



---

# 5.4 Navigation Engine


Mengatur:



Next Question

Previous Question

Flag Question

Review Question

Question Status



Status:



NOT_VISITED

VISITED

ANSWERED

MARKED



---

# 5.5 Answer Engine


Mengelola jawaban:



Save Answer

Update Answer

Validate Answer

Sync Answer

Submit Answer



Karakteristik:



Fast Write

Idempotent

Recoverable



---

# 5.6 Scoring Engine


Menghitung:



Correct Answer

Score

Weighted Score

Final Result

Ranking Data



Pipeline:



Submission

|

Answer Validation

|

Auto Grading

|

Score Calculation

|

Result Storage



---

# 6. CBT Data Flow


Normal Exam Flow:



Student Login

  |

Start Exam

  |

Create Session

  |

Generate Question Set

  |

Begin Timer

  |

Answer Questions

  |

Submit Exam

  |

Scoring

  |

Result Generated



---

# 7. CBT Runtime Data Model


Core entities:



Exam

|

Exam Configuration

|

Question Pool

|

Exam Session

|

Session Question

|

Student Answer

|

Submission

|

Score



Relationship:



Exam

|

many

|

Exam Session

|

many

|

Student Answer



---

# 8. Real Time Requirement


CBT membutuhkan:


| Component | Requirement |
|-|-|
| Answer Save | <100ms target |
| Question Load | <300ms target |
| Timer Sync | periodic |
| Submission | reliable transaction |


---

# 9. Cache Strategy


Redis digunakan untuk:



Active Session State

Timer State

Question Session Cache

Temporary Answer



Contoh:



redis:

exam_session:{id}

remaining_time

current_question



---

# 10. Queue Usage


Background processing:



Submission Event

    |

Queue

    |

Worker

    |

Scoring

Analytics

Notification



---

# 11. Offline CBT Support


CBT Engine mendukung offline mode.


Architecture:



Client Storage

  |

Offline Exam Runtime

  |

Sync Engine

  |

Server Validation



Digunakan untuk:


- sekolah dengan koneksi tidak stabil;
- simulasi ujian lokal.


---

# 12. Security Consideration


CBT Engine harus melindungi:



Question Leakage

Answer Manipulation

Session Hijacking

Time Manipulation

Multiple Login



Implementasi:



JWT Authentication

Session Token

Server Timer

Audit Log

Device Tracking



---

# 13. Scalability Strategy


## Phase 1


Target:


<100 Student

Single CBT Service

Single Database



---

## Phase 2


Target:



Thousands Student

Optimization:

Redis Cache

Queue Worker

Read Replica



---

## Phase 3


Target:



Hundreds Thousands Concurrent Exam

Architecture:

Dedicated CBT Runtime Service

Event Streaming

Distributed Session Management



---

# 14. Future Microservice Extraction


CBT Engine dapat dipisahkan:



Main Platform

    |

    |

CBT Runtime Service

    |

    +-- Session Service

    +-- Question Delivery Service

    +-- Scoring Service

    +-- Sync Service


---

# 15. Implementation Guideline


MVP:


Gunakan:



Modular Monolith

Single Backend Repository

Separate CBT Module

PostgreSQL

Redis

Queue Worker



Jangan:



Microservice terlalu awal

Complex Distributed System



---

# Summary


CBT Engine YakinLulus.id dirancang sebagai:



Reliable Exam Runtime System

Offline Capable

Scalable Architecture

Secure by Design

Ready for Future Separation



CBT Engine menjadi salah satu domain paling kritis karena berhubungan langsung dengan pengalaman ujian siswa dan integritas hasil evaluasi.
