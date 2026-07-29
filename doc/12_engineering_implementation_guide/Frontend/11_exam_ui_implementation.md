# 11_exam_ui_implementation.md

# Exam UI Implementation

## 1. Tujuan

Dokumen ini menjelaskan implementasi Exam UI pada Frontend YakinLulus.id.

Exam UI merupakan bagian paling kritis karena menjadi interface utama untuk:

- CBT (Computer Based Test).
- Simulasi UTBK.
- Ujian sekolah.
- Tryout.
- Assessment.

Berbeda dengan halaman biasa, Exam UI memiliki kebutuhan khusus:

- Full focus mode.
- Timer real-time.
- Question navigation.
- Answer persistence.
- Flagging question.
- Offline capability.
- Auto save.
- Anti accidental navigation.
- Performance tinggi.

Tujuan implementasi:

- Memberikan pengalaman ujian seperti platform CBT profesional.
- Menjaga integritas proses ujian.
- Meminimalkan kehilangan jawaban.
- Mendukung koneksi tidak stabil.
- Siap digunakan dalam skala besar.

---

# 2. Konsep

CBT Runtime menggunakan pendekatan:

```
UI Layer

+

Exam State Engine

+

Local Persistence

+

Sync Layer

+

Backend Validation
```

---

## Exam UI Principle

Selama ujian:

```
Answer State

=

Critical State
```

Jawaban siswa tidak boleh hanya berada di memory browser.

Harus memiliki:

```
Memory State

+

Local Storage

+

Backend Sync
```

---

# Exam Component Architecture

```
Exam Page

    │

    ├── Exam Header

    │
    ├── Timer

    │
    ├── Question Viewer

    │
    ├── Answer Input

    │
    ├── Question Navigator

    │
    └── Submit Controller
```

---

# 3. Architecture Diagram (ASCII)

```
                    Exam Interface

                          │

                          ▼

                  Exam Runtime Engine

                          │

        ┌─────────────────┼─────────────────┐

        ▼                 ▼                 ▼

  Question State    Answer State      Timer State

        │                 │                 │

        └─────────────────┼─────────────────┘

                          │

                          ▼

                    Exam Store

                          │

        ┌─────────────────┼─────────────────┐

        ▼                                   ▼

 Local Persistence                   Sync Worker

        │                                   │

        ▼                                   ▼

 IndexedDB / SQLite                Backend API

                          │

                          ▼

                    Exam Result
```

---

# 4. Component Explanation

# 4.1 Exam Container

Exam Container adalah root component.

Tanggung jawab:

- Inisialisasi exam session.
- Load question.
- Setup timer.
- Handle lifecycle.

Tidak bertanggung jawab terhadap:

- Detail rendering question.
- Business calculation.

---

Struktur:

```
features/

exam/

components/

ExamContainer.tsx
```

---

# 4.2 Exam Header

Menampilkan informasi:

- Nama ujian.
- Mata pelajaran.
- Nomor peserta.
- Progress.

Contoh:

```
UTBK Simulation 2026

Question 25 / 100
```

---

# 4.3 Exam Timer

Timer adalah komponen kritis.

Fungsi:

- Countdown.
- Warning.
- Auto submit.

---

State:

```
remainingTime

startedAt

expiredAt
```

---

Flow:

```
Start Exam

     │

     ▼

Initialize Timer

     │

     ▼

Countdown

     │

     ▼

Time = 0

     │

     ▼

Auto Submit
```

---

# 4.4 Question Viewer

Menampilkan:

- Question text.
- Image.
- Diagram.
- Formula.
- Supporting media.

Mendukung:

- Rich content.
- Math equation.
- Image rendering.

---

Contoh:

```
Question

+

Image

+

Answer Option
```

---

# 4.5 Answer Component

Karena MVP menggunakan:

```
Multiple Choice
```

maka answer component menangani:

```
Option A

Option B

Option C

Option D

Option E
```

---

State:

```
selectedAnswer

answerStatus

savedStatus
```

---

# 4.6 Question Navigator

Digunakan untuk:

- Melompat antar soal.
- Melihat status pengerjaan.
- Menandai soal.

Contoh:

```
1  2  3  4  5

✓  ✓  ⚑  ○  ○
```

Status:

```
Answered

Not Answered

Flagged

Current
```

---

# 4.7 Submit Controller

Menangani:

- Manual submit.
- Auto submit.
- Confirmation dialog.

---

Sebelum submit:

```
Check:

Answered

Unanswered

Network Status
```

---

# 4.8 Fullscreen Mode

Untuk meningkatkan fokus.

Menggunakan:

Browser Fullscreen API.

Flow:

```
Start Exam

     │

     ▼

Request Fullscreen

     │

     ▼

Exam Mode
```

---

# 4.9 Anti Navigation Detection

Mendeteksi:

- Refresh.
- Close tab.
- Back navigation.

Contoh:

```
Before Leave

      │

      ▼

Warning Dialog
```

---

# 5. Implementation Detail

# 5.1 Folder Structure

```
features/

exam/

├── components/

│
├── ExamContainer.tsx

├── ExamTimer.tsx

├── QuestionViewer.tsx

├── AnswerOption.tsx

├── QuestionNavigator.tsx

├── SubmitDialog.tsx

│
├── hooks/

│
├── useExamRuntime.ts

├── useExamTimer.ts

│
├── store/

│
├── exam.store.ts

│
├── services/

│
├── exam.service.ts

│
├── sync/

│
└── exam-sync.ts
```

---

# 5.2 Exam Runtime State

Menggunakan Zustand.

Contoh:

```typescript
interface ExamState {

examId:string;

currentQuestion:number;

answers:Answer[];

remainingTime:number;

flagged:number[];

status:
"running"
|"finished";

}
```

---

# 5.3 Answer Persistence

Jawaban disimpan bertahap.

Flow:

```
Student Select Answer

        │

        ▼

Update Memory State

        │

        ▼

Save Local Database

        │

        ▼

Sync Backend
```

---

# 5.4 Auto Save Mechanism

Menggunakan debounce.

Contoh:

```
Answer Changed

      │

      ▼

Wait 1-3 seconds

      │

      ▼

Save
```

---

# 5.5 Offline Handling

Jika koneksi putus:

```
Online

   │

   ▼

API Sync


Offline

   │

   ▼

Local Save

   │

   ▼

Queue

   │

   ▼

Sync When Online
```

---

# 5.6 Question Loading Strategy

Tidak selalu load seluruh soal.

Strategi:

```
Exam Metadata

        ↓

Question Pool

        ↓

Load Batch

        ↓

Render
```

---

Untuk exam besar:

```
100 - 200 questions
```

gunakan:

- Pagination.
- Virtual rendering.
- Prefetch.

---

# 5.7 Keyboard Navigation

Untuk efisiensi:

Shortcut:

```
Arrow Left

Previous Question


Arrow Right

Next Question


Number Key

Select Option
```

---

# 5.8 Responsive Layout

Desktop:

```
Question

      +

Navigator
```

Mobile:

```
Question

      ↓

Answer

      ↓

Navigator Drawer
```

---

# 6. Flow / Example

# Starting Exam

```
Student Click Start

        │

        ▼

Create Exam Session

        │

        ▼

Load Question Set

        │

        ▼

Initialize Timer

        │

        ▼

Enter Fullscreen

        │

        ▼

Exam Running
```

---

# Answering Question

```
Student Select Answer

        │

        ▼

Update State

        │

        ▼

Save Local

        │

        ▼

Sync API

        │

        ▼

Update Navigator
```

---

# Time Expired

```
Timer = 0

     │

     ▼

Lock Input

     │

     ▼

Collect Answer

     │

     ▼

Submit

     │

     ▼

Result Processing
```

---

# 7. Best Practice

## Jangan Simpan Jawaban Hanya Di React State

Salah:

```
useState()

↓

Answer
```

Jika browser crash:

```
Data Lost
```

---

Benar:

```
Memory

+

Local Persistence

+

Backend Sync
```

---

## Timer Tidak Dipercaya Dari Client

Client timer hanya visual.

Server menentukan:

- Start time.
- End time.
- Valid duration.

---

## Jangan Render Semua Soal Besar Sekaligus

Gunakan:

- Virtualization.
- Lazy loading.
- Prefetch.

---

## Separate Runtime Logic

Jangan memasukkan seluruh logic CBT ke component.

Gunakan:

```
Exam Runtime Engine
```

---

## Semua Event Harus Tercatat

Contoh:

```
Exam Started

Answer Changed

Question Viewed

Submitted
```

---

# 8. Security Consideration

## Exam Integrity

Frontend melakukan:

- Fullscreen.
- Detect leave.
- Prevent accidental navigation.

Backend melakukan:

- Session validation.
- Time validation.
- Answer validation.

---

## Prevent Answer Manipulation

Frontend tidak boleh menjadi sumber kebenaran.

Backend menghitung:

- Score.
- Duration.
- Result.

---

## Anti Cheat Monitoring

Future:

- Tab switching detection.
- Screenshot detection.
- Browser activity monitoring.

Tetap mengikuti aturan privasi.

---

## Data Protection

Jawaban siswa:

- Tidak boleh exposed.
- Tidak disimpan permanent di browser tanpa proteksi.
- Harus memiliki lifecycle.

---

# 9. Performance Consideration

CBT membutuhkan performa tinggi.

Optimasi:

- Component memoization.
- Virtual rendering.
- Minimal re-render.
- Local caching.
- Background sync.

---

Critical component:

```
QuestionViewer

AnswerOption

Timer
```

harus sangat ringan.

---

# 10. Scalability Consideration

Arsitektur mendukung:

- Ribuan concurrent exam.
- Large question bank.
- Offline exam.
- School assessment.
- National simulation.

---

Future:

```
Single Exam UI

        ↓

Exam Runtime Platform
```

yang dapat digunakan berbagai jenis ujian.

---

# 11. Future Evolution

## Advanced CBT Engine

Tambahan:

- Adaptive Testing.
- AI Generated Question.
- Difficulty Adjustment.
- Item Response Theory.

---

## Proctoring Integration

Future:

- Webcam monitoring.
- Behavior analysis.
- AI supervision.

---

## Real Time Monitoring

Teacher/Admin:

```
Live Exam Dashboard

        ↓

WebSocket

        ↓

Exam Events
```

---

## Multi Platform Runtime

Engine dapat digunakan:

```
Web

Flutter

Desktop Client
```

---

# Summary

Exam UI Implementation YakinLulus.id menggunakan arsitektur CBT Runtime yang memisahkan UI, state engine, persistence, dan synchronization layer. Sistem mendukung timer real-time, question navigation, answer persistence, offline capability, fullscreen mode, dan scalable exam workflow. Dengan desain ini, frontend mampu memberikan pengalaman ujian setara platform CBT profesional sekaligus menjaga integritas data melalui validasi backend.