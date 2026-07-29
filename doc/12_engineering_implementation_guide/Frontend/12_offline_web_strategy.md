# 12_offline_web_strategy.md

# Offline Web Strategy

## 1. Tujuan

Dokumen ini menjelaskan strategi implementasi Offline Web pada Frontend YakinLulus.id.

Offline capability merupakan kebutuhan penting karena platform digunakan oleh pengguna dengan kondisi jaringan yang beragam:

- Siswa di area koneksi terbatas.
- Sekolah dengan bandwidth rendah.
- Simulasi CBT dengan koneksi tidak stabil.
- Penggunaan mobile device.

Tujuan Offline Web Strategy:

- Aplikasi tetap dapat digunakan ketika koneksi hilang.
- Data penting tersimpan sementara secara lokal.
- Jawaban ujian tidak hilang.
- Sinkronisasi otomatis ketika koneksi kembali.
- Memberikan pengalaman seperti native application.

---

# 2. Konsep

YakinLulus.id menggunakan pendekatan:

```
Offline First Architecture
```

Prinsip utama:

```
Local Data First

        ↓

Background Sync

        ↓

Backend Reconciliation
```

---

## Offline First Principle

Aplikasi tidak bergantung sepenuhnya pada koneksi internet.

Contoh:

Saat CBT:

```
Student Answer

       ↓

Local Storage

       ↓

Sync Backend
```

bukan:

```
Student Answer

       ↓

Wait API Response

       ↓

Save
```

---

# Offline Capability Scope

Tidak semua fitur harus offline.

Pembagian:

## Full Offline

Fitur yang harus tetap berjalan:

- CBT Answering.
- Timer Display.
- Question Navigation.

---

## Partial Offline

Fitur dengan cache:

- Material Reading.
- Question Preview.
- Profile.

---

## Online Required

Fitur yang membutuhkan server:

- Login pertama.
- Payment.
- Admin Management.
- Result Finalization.

---

# 3. Architecture Diagram (ASCII)

```
                         Frontend Application

                                  │

                                  ▼

                         Offline Strategy Layer

                                  │

        ┌─────────────────────────┼─────────────────────────┐

        ▼                         ▼                         ▼

 Service Worker            Local Database             Sync Engine

        │                         │                         │

        ▼                         ▼                         ▼

 Cache Storage             IndexedDB               Sync Queue

                                  │

                                  ▼

                              API Layer

                                  │

                                  ▼

                           Backend Go API

                                  │

                                  ▼

                         PostgreSQL Database
```

---

# 4. Component Explanation

# 4.1 Progressive Web App (PWA)

YakinLulus.id Web menggunakan konsep:

```
Progressive Web Application
```

Kemampuan:

- Installable.
- Offline cache.
- App-like experience.
- Background processing.

---

Komponen utama:

```
Manifest

Service Worker

Cache Strategy

Offline Storage
```

---

# 4.2 Service Worker

Service Worker berjalan di background browser.

Tanggung jawab:

- Cache asset.
- Intercept request.
- Handle offline response.
- Background sync.

---

Flow:

```
Browser Request

        │

        ▼

Service Worker

        │

        ├── Cache Available

        │          │

        │          ▼

        │       Return Cache

        │

        └── No Cache

                   │

                   ▼

               Network Request
```

---

# 4.3 Cache Storage

Digunakan untuk:

- JavaScript bundle.
- CSS.
- Image.
- Static asset.
- Application shell.

---

Contoh:

```
Application Shell

↓

Cache

↓

Available Offline
```

---

# 4.4 IndexedDB

IndexedDB digunakan untuk data offline yang lebih kompleks.

Digunakan untuk:

- Question Data.
- Exam Session.
- Student Answer.
- Sync Queue.

---

Contoh:

```
IndexedDB

├── exams

├── questions

├── answers

└── sync_queue
```

---

# 4.5 Offline Store

Menggunakan Zustand untuk state runtime.

Contoh:

```
offline.store.ts
```

Menyimpan:

```
networkStatus

pendingSync

lastSyncTime

syncState
```

---

# 4.6 Sync Engine

Sync Engine bertugas melakukan:

- Queue management.
- Retry.
- Conflict handling.
- Upload pending data.

---

Flow:

```
Local Change

      │

      ▼

Sync Queue

      │

      ▼

Network Available

      │

      ▼

Send API

      │

      ▼

Remove Queue Item
```

---

# 4.7 Network Detection

Menggunakan:

```
Navigator Online API
```

dan tambahan health check API.

---

Status:

```
Online

Offline

Syncing

Error
```

---

# 5. Implementation Detail

# 5.1 Folder Structure

```
lib/

offline/

├── service-worker.ts

├── cache.ts

├── storage.ts

├── sync-engine.ts

├── network.ts

└── types.ts
```

---

Feature:

```
features/

exam/

offline/

├── answer-storage.ts

├── exam-sync.ts

└── recovery.ts
```

---

# 5.2 PWA Configuration

Komponen:

```
Manifest

Service Worker

Icons

Install Prompt
```

---

Manifest berisi:

```
name

short_name

theme_color

display

icons
```

---

# 5.3 Cache Strategy

Menggunakan strategi berbeda berdasarkan resource.

---

## Static Asset

Strategi:

```
Cache First
```

Contoh:

- JS.
- CSS.
- Icons.

---

## API Data

Strategi:

```
Network First

Fallback Cache
```

---

## CBT Data

Strategi:

```
Local First

Sync Later
```

---

# 5.4 Exam Offline Storage

Saat ujian dimulai:

```
Download Question Set

        │

        ▼

Store Locally

        │

        ▼

Start Exam
```

---

Local Data:

```
Exam ID

Question

Options

Metadata

Start Time
```

---

# 5.5 Answer Sync Queue

Setiap jawaban:

```
Answer Event
```

disimpan.

Contoh:

```
{
 examId,
 questionId,
 answer,
 timestamp
}
```

---

Kemudian:

```
Queue

↓

Sync Worker

↓

Backend
```

---

# 5.6 Conflict Resolution

Kemungkinan conflict:

```
Local Answer

        vs

Server Answer
```

---

Rule:

```
Latest Valid Timestamp Wins
```

dengan validasi backend.

---

Untuk CBT:

Server tetap menjadi sumber kebenaran.

---

# 5.7 Recovery Mechanism

Jika browser crash:

```
Open Exam Again

        │

        ▼

Detect Existing Session

        │

        ▼

Recover Local State

        │

        ▼

Continue Exam
```

---

# 5.8 Background Sync

Ketika internet kembali:

```
Offline

   │

   ▼

Connection Restored

   │

   ▼

Sync Worker Trigger

   │

   ▼

Upload Queue

   │

   ▼

Update Status
```

---

# 6. Flow / Example

# Offline CBT Flow

```
Student Start Exam

        │

        ▼

Download Questions

        │

        ▼

Save Local Database

        │

        ▼

Internet Lost

        │

        ▼

Continue Exam

        │

        ▼

Save Answers Locally

        │

        ▼

Internet Return

        │

        ▼

Sync Answers

        │

        ▼

Finalize Exam
```

---

# Material Offline Flow

```
Student Open Material

        │

        ▼

Download Content

        │

        ▼

Cache Local

        │

        ▼

Read Offline
```

---

# 7. Best Practice

## Jangan Offline-kan Semua Data

Offline harus berdasarkan kebutuhan.

Prioritas:

```
Critical Data

↓

Frequently Used Data

↓

Optional Data
```

---

## Local Storage Bukan Database Utama

Browser storage hanya:

```
Temporary Persistence
```

Database utama tetap:

```
PostgreSQL
```

---

## Selalu Berikan Sync Status

User harus mengetahui:

```
Saved

Syncing

Offline

Failed
```

---

## Design Untuk Failure

Asumsikan:

- Internet putus.
- Browser crash.
- Device restart.

---

## Jangan Percaya Client Time

Timer dan result harus divalidasi backend.

---

# 8. Security Consideration

## Local Data Protection

Data offline dapat berisi:

- Soal.
- Jawaban.
- Informasi ujian.

Perlindungan:

- Minimize stored data.
- Encryption jika diperlukan.
- Clear data setelah selesai.

---

## Exam Content Protection

Question bank tidak boleh mudah diekstrak.

Strategi:

- Encrypted payload.
- Short-lived access.
- Server validation.

---

## Device Security

Future:

- Device registration.
- Trusted device.
- Session binding.

---

## Sync Security

Semua sync request harus:

- Authenticated.
- Validated.
- Timestamp checked.

---

# 9. Performance Consideration

Optimasi:

- Lazy cache.
- IndexedDB indexing.
- Batch synchronization.
- Compression.
- Background processing.

---

Contoh:

Jangan:

```
Sync 1 answer

Sync 1 answer

Sync 1 answer
```

Gunakan:

```
Batch Sync

[
answer1,
answer2,
answer3
]
```

---

# 10. Scalability Consideration

Strategi ini mendukung:

- Ribuan siswa ujian bersamaan.
- Sekolah dengan internet terbatas.
- Mobile-first usage.
- Large content delivery.

---

Future:

```
Offline Engine

        ↓

Distributed Learning Platform
```

---

# 11. Future Evolution

## Advanced Offline Database

Menggunakan:

- RxDB.
- SQLite WASM.
- IndexedDB abstraction layer.

---

## Edge Synchronization

Future:

```
Student Device

        ↓

School Local Server

        ↓

Cloud Backend
```

---

## Offline Classroom Mode

Sekolah dapat menjalankan:

- Local CBT server.
- Local material cache.
- Local exam distribution.

---

## Secure Exam Package

Exam dapat dikirim sebagai:

```
Encrypted Exam Package

        ↓

Offline Runtime

        ↓

Secure Submission
```

---

# Summary

Offline Web Strategy YakinLulus.id menggunakan pendekatan Offline First dengan kombinasi PWA, Service Worker, IndexedDB, Local Persistence, dan Sync Engine. Strategi ini memungkinkan fitur kritis seperti CBT tetap berjalan pada koneksi tidak stabil tanpa kehilangan data. Backend tetap menjadi sumber kebenaran melalui validasi, reconciliation, dan secure synchronization. Arsitektur ini mempersiapkan YakinLulus.id untuk penggunaan skala sekolah hingga platform pendidikan nasional.