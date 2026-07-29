# 04_cbt_engine_ldm.md

# Logical Data Model
## Domain : CBT Engine

Version : 1.0

---

# Tujuan

CBT Engine merupakan domain yang mengelola seluruh proses ujian berbasis komputer (Computer Based Test) pada platform YakinLulus.

Domain ini bertanggung jawab terhadap:

- Penyusunan ujian
- Distribusi soal
- Sesi ujian
- Pengerjaan ujian
- Jawaban peserta
- Penilaian
- Pengawasan ujian
- Sinkronisasi offline
- Hasil ujian

CBT Engine **bukan pemilik soal**.

Seluruh soal berasal dari **Question Bank Domain**.

---

# Aggregate Root

```
Exam
```

---

# Entity Hierarchy

```
Exam
│
├── Exam Blueprint
├── Exam Configuration
├── Exam Section
├── Exam Question Pool
├── Exam Publish
├── Exam Session
├── Exam Participant
├── Exam Attempt
├── Exam Question Snapshot
├── Exam Answer
├── Exam Navigation
├── Exam Timer
├── Exam Event
├── Exam Submission
├── Exam Result
├── Exam Review
├── Exam History
└── Exam Audit
```

---

# Logical Entity List

| Entity | Purpose |
|---------|----------|
| Exam | Ujian |
| Exam Blueprint | Blueprint penyusunan soal |
| Exam Configuration | Konfigurasi ujian |
| Exam Section | Bagian ujian |
| Exam Question Pool | Bank soal yang dipakai |
| Exam Publish | Publikasi ujian |
| Exam Session | Jadwal pelaksanaan |
| Exam Participant | Peserta |
| Exam Attempt | Percobaan ujian |
| Exam Question Snapshot | Snapshot soal |
| Exam Answer | Jawaban peserta |
| Exam Navigation | Navigasi soal |
| Exam Timer | Timer |
| Exam Event | Aktivitas peserta |
| Exam Submission | Pengumpulan ujian |
| Exam Result | Nilai akhir |
| Exam Review | Review hasil |
| Exam History | Riwayat |
| Exam Audit | Audit |

---

# Aggregate Root

## Exam

### Business Purpose

Identitas utama ujian.

### Candidate Attribute

```
ID

Exam Code

Title

Description

Exam Type

Status

Owner

Created At

Updated At
```

---

Exam Type

```
Practice

Quiz

Daily Test

Mid Test

Final Test

Simulation

UTBK

TO

Certification
```

---

# Exam Blueprint

### Business Purpose

Blueprint penyusunan soal.

### Candidate Attribute

```
ID

Exam ID

Education Level ID

Grade ID

Curriculum ID

Subject ID

Blueprint Rule

Passing Score
```

---

Blueprint Rule

Misal:

```
Bab 1 = 20%

Bab 2 = 30%

Bab 3 = 50%
```

---

# Exam Configuration

### Candidate Attribute

```
ID

Exam ID

Duration

Shuffle Question

Shuffle Option

Allow Review

Allow Skip

Allow Back

Auto Submit

Show Result

Show Explanation

Passing Score

Attempt Limit

Offline Enabled

Fullscreen Required

Safe Browser Required
```

---

# Exam Section

### Business Purpose

Bagian ujian.

### Candidate Attribute

```
ID

Exam ID

Section Name

Instruction

Duration

Sequence
```

---

Contoh

```
TPS

↓

PU

↓

PK

↓

PBM
```

---

# Exam Question Pool

### Business Purpose

Daftar soal yang dapat dipilih.

### Candidate Attribute

```
ID

Exam Section ID

Question ID

Weight

Mandatory

Sequence
```

---

Business Rule

Question berasal dari Question Bank.

---

# Exam Publish

### Business Purpose

Publikasi ujian.

### Candidate Attribute

```
ID

Exam ID

Publish Start

Publish End

Access Type

Access Code

Visibility
```

---

Access Type

```
Public

Private

Organization

Invitation
```

---

# Exam Session

### Business Purpose

Jadwal pelaksanaan.

### Candidate Attribute

```
ID

Exam ID

Start Time

End Time

Timezone

Session Status
```

---

# Exam Participant

### Business Purpose

Peserta ujian.

### Candidate Attribute

```
ID

Exam Session ID

User ID

Enrollment Status

Assigned At
```

---

Enrollment Status

```
Registered

Confirmed

Started

Finished

Absent
```

---

# Exam Attempt

### Business Purpose

Percobaan ujian.

### Candidate Attribute

```
ID

Participant ID

Attempt Number

Started At

Ended At

Current Status

Device

IPAddress
```

---

Current Status

```
Waiting

Running

Paused

Disconnected

Submitted

Expired

Cancelled
```

---

# Exam Question Snapshot

### Business Purpose

Snapshot soal saat ujian dimulai.

### Candidate Attribute

```
ID

Attempt ID

Question ID

Question Version ID

Question Order

Snapshot Data
```

---

Business Rule

Snapshot tidak berubah walaupun soal asli direvisi.

---

# Exam Answer

### Business Purpose

Jawaban peserta.

### Candidate Attribute

```
ID

Snapshot ID

Selected Option

Essay Answer

Answered At

IsMarked

Score
```

---

Business Rule

Jawaban tersimpan melalui auto-save.

---

# Exam Navigation

### Business Purpose

Riwayat navigasi.

### Candidate Attribute

```
ID

Attempt ID

Question Number

Visited

Answered

Marked

Time Spent
```

---

# Exam Timer

### Business Purpose

Sinkronisasi waktu.

### Candidate Attribute

```
ID

Attempt ID

Remaining Time

Last Sync

Pause Duration
```

---

# Exam Event

### Business Purpose

Mencatat aktivitas peserta.

### Candidate Attribute

```
ID

Attempt ID

Event Type

Event Time

Metadata
```

---

Event Type

```
Start

Open Question

Answer

Mark

Unmark

Navigate

Reconnect

Disconnect

Submit

Timeout

Fullscreen Exit

Window Blur
```

---

# Exam Submission

### Business Purpose

Pengumpulan ujian.

### Candidate Attribute

```
ID

Attempt ID

Submission Time

Submission Type

Checksum
```

---

Submission Type

```
Auto

Manual

Timeout

Admin
```

---

# Exam Result

### Business Purpose

Hasil ujian.

### Candidate Attribute

```
ID

Attempt ID

Raw Score

Scaled Score

Correct Count

Wrong Count

Blank Count

Passing Status

Rank

Grade
```

---

Business Rule

Result bersifat immutable setelah finalisasi.

---

# Exam Review

### Business Purpose

Review hasil.

### Candidate Attribute

```
ID

Result ID

Reviewed By

Comment

Decision
```

---

# Exam History

### Candidate Attribute

```
ID

Exam ID

Action

Old Value

New Value

Changed By

Changed At
```

---

# Exam Audit

### Candidate Attribute

```
ID

Exam ID

User

IP

Browser

Action

Timestamp
```

---

# Relationship

```
Exam

1

↓

1

Exam Blueprint

1

↓

1

Exam Configuration

1

↓

N

Exam Section

↓

N

Exam Question Pool

↓

Question Bank

↓

Exam Publish

↓

Exam Session

↓

Exam Participant

↓

Exam Attempt

↓

Exam Question Snapshot

↓

Exam Answer

↓

Exam Result
```

---

# Ownership

| Entity | Owner |
|----------|--------|
| Exam | CBT Domain |
| Exam Blueprint | CBT Domain |
| Exam Configuration | CBT Domain |
| Exam Section | CBT Domain |
| Exam Question Pool | CBT Domain |
| Exam Publish | CBT Domain |
| Exam Session | CBT Domain |
| Exam Participant | CBT Domain |
| Exam Attempt | CBT Domain |
| Exam Question Snapshot | CBT Domain |
| Exam Answer | CBT Domain |
| Exam Navigation | CBT Domain |
| Exam Timer | CBT Domain |
| Exam Event | CBT Domain |
| Exam Submission | CBT Domain |
| Exam Result | CBT Domain |
| Exam Review | CBT Domain |
| Exam History | CBT Domain |
| Exam Audit | System Domain |

---

# Cross Domain Reference

CBT menggunakan:

- Question Bank
- User Management
- Organization
- Master Academic
- Analytics
- Media (instruksi/lampiran)

---

# Business Constraint

- Exam wajib memiliki Blueprint.
- Exam wajib memiliki Configuration.
- Minimal satu Section.
- Minimal satu Question Pool.
- Snapshot dibuat saat Attempt dimulai.
- Snapshot tidak boleh berubah.
- Result tidak boleh dihitung ulang setelah final.
- Attempt yang Submitted tidak boleh diubah.
- Auto Save wajib aktif.
- Offline Sync menggunakan Event Queue.
- Soft Delete hanya berlaku untuk konfigurasi, bukan data hasil ujian.

---

# Normalization

Target

```
BCNF
```

Tidak diperbolehkan menyimpan:

- isi soal
- pilihan jawaban
- nama mata pelajaran

di tabel Exam.

Seluruhnya menggunakan Foreign Key atau Snapshot.

---

# Lifecycle

## Exam

```
Draft

↓

Configured

↓

Published

↓

Scheduled

↓

Running

↓

Closed

↓

Archived
```

---

## Attempt

```
Waiting

↓

Started

↓

Running

↓

Paused

↓

Disconnected

↓

Submitted

↓

Graded

↓

Finalized
```

---

# Design Notes

## 1. Snapshot adalah Wajib

Saat peserta mulai ujian, seluruh soal disalin menjadi **Exam Question Snapshot**.

Dengan demikian:

- revisi soal tidak memengaruhi ujian yang sedang berjalan,
- audit lebih mudah,
- hasil ujian selalu konsisten.

---

## 2. Blueprint Terpisah

Blueprint dipisahkan dari Exam sehingga satu pola penyusunan soal dapat digunakan kembali untuk banyak ujian.

---

## 3. Auto Save

Jawaban peserta tidak menunggu tombol Submit.

Setiap perubahan jawaban menghasilkan proses auto-save dan event sinkronisasi.

---

## 4. Event Driven

Seluruh aktivitas penting dicatat pada **Exam Event**.

Contoh:

- pindah soal,
- keluar fullscreen,
- kehilangan koneksi,
- reconnect,
- submit.

Data ini digunakan oleh Analytics dan Anti-Cheat Engine.

---

## 5. Offline First

Apabila koneksi internet terputus:

```
Exam Answer
        │
        ▼
Local Queue
        │
        ▼
Sync Service
        │
        ▼
Server
```

Peserta dapat tetap mengerjakan ujian dan data akan disinkronkan ketika koneksi kembali tersedia.

---

## 6. Immutable Result

Setelah status **Finalized**, nilai tidak boleh diubah.

Jika diperlukan koreksi, gunakan proses **Result Adjustment** atau **Regrading** yang menghasilkan rekam jejak baru, bukan mengubah data asli.

---

## 7. Future Ready

Model ini telah disiapkan untuk mendukung:

- Computer Adaptive Test (CAT)
- Multi Section Exam
- Essay Scoring
- AI Assisted Scoring
- Negative Marking
- Partial Score
- Random Question Generation
- Random Option Generation
- Proctoring
- Safe Exam Browser
- Webcam Monitoring
- Face Verification
- Multi Device Restriction
- Offline CBT
- Distributed Exam Server
- Regrading
- Exam Template
- Exam Cloning
- Massive Concurrent Exam (10.000+ peserta)