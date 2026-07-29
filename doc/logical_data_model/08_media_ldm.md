# 08_media_ldm.md

# Logical Data Model
## Domain : Media Management

Version : 1.0

---

# Tujuan

Media Domain merupakan domain yang bertanggung jawab terhadap pengelolaan seluruh aset digital pada platform YakinLulus.

Domain ini menjadi **Single Source of Truth** untuk seluruh file dan media yang digunakan oleh:

- Question Bank
- Learning Resource
- CBT Engine
- User Management
- Organization
- Certificate
- AI Generated Content
- Analytics Report

Media Domain mengelola:

- Penyimpanan metadata file
- Versi file
- Lokasi penyimpanan
- Optimasi ukuran
- Hak akses
- Processing status
- Transcoding
- Thumbnail
- Distribution

---

# Prinsip Utama

Media Domain **tidak mengetahui bisnis yang menggunakan media**.

Contoh:

Media Domain mengetahui:

```
image_001.png
size 2 MB
type image/png
storage S3
```

Media Domain tidak mengetahui:

```
ini gambar soal matematika

ini thumbnail materi IPA

ini video pembelajaran kelas 9
```

Informasi penggunaan berada pada domain pemilik.

---

# Aggregate Root

```
Media Asset
```

---

# Entity Hierarchy

```
Media Asset
│
├── Media File
├── Media Version
├── Media Metadata
├── Media Type
├── Media Storage
├── Media Processing
├── Media Variant
├── Media Access Control
├── Media Reference
├── Media Collection
├── Media Tag
├── Media Transcoding
├── Media Thumbnail
├── Media History
└── Media Audit
```

---

# Logical Entity List

| Entity | Purpose |
|---|---|
| Media Asset | Identitas media |
| Media File | File fisik |
| Media Version | Versi file |
| Media Metadata | Informasi teknis |
| Media Type | Jenis media |
| Media Storage | Lokasi penyimpanan |
| Media Processing | Status proses |
| Media Variant | Turunan file |
| Media Access Control | Hak akses |
| Media Reference | Pemakai media |
| Media Collection | Pengelompokan |
| Media Tag | Label |
| Media Transcoding | Konversi media |
| Media Thumbnail | Preview |
| Media History | Riwayat |
| Media Audit | Audit |

---

# Aggregate Root

# Media Asset

## Business Purpose

Identitas utama sebuah aset media.

Contoh:

```
Video pembelajaran sistem persamaan linear

Gambar diagram fisika

Logo sekolah

Foto profil siswa
```

---

## Candidate Attribute

```
ID

Media Code

Title

Description

Media Type ID

Owner User ID

Status

Created At

Updated At
```

---

## Business Rule

- Media Asset tidak menyimpan binary file.
- File fisik berada di Media File.
- Satu Asset dapat memiliki banyak Version.
- Satu Asset dapat memiliki banyak Reference.

---

# Media File

## Business Purpose

Representasi file fisik.

---

## Candidate Attribute

```
ID

Media Asset ID

Storage ID

File Name

Original Name

File Extension

Mime Type

File Size

Checksum

Uploaded At
```

---

Contoh:

```
lesson-video.mp4

image-question.png

document.pdf
```

---

# Media Version

## Business Purpose

Menyimpan versi perubahan file.

---

## Candidate Attribute

```
ID

Media Asset ID

Version Number

Media File ID

Created By

Created At

Status
```

---

Contoh:

```
Video v1

Video v2

Video v3
```

---

# Media Metadata

## Business Purpose

Informasi teknis file.

---

## Candidate Attribute

```
ID

Media File ID

Width

Height

Duration

Frame Rate

Bit Rate

Codec

Resolution

Language
```

---

Contoh:

Video:

```
1920x1080

30 FPS

H264
```

---

# Media Type

## Business Purpose

Master jenis media.

---

## Candidate Attribute

```
ID

Code

Name

Category

Description
```

---

Contoh:

```
IMAGE

VIDEO

AUDIO

DOCUMENT

INTERACTIVE

ARCHIVE
```

---

# Media Storage

## Business Purpose

Lokasi penyimpanan file.

---

## Candidate Attribute

```
ID

Provider

Storage Type

Bucket

Region

Endpoint

Status
```

---

Contoh:

```
AWS S3

Cloudflare R2

Local Storage
```

---

# Media Processing

## Business Purpose

Status pemrosesan media.

---

## Candidate Attribute

```
ID

Media File ID

Process Type

Status

Started At

Completed At

Error Message
```

---

Process Type:

```
Upload

Compress

Resize

Transcode

Thumbnail

Virus Scan
```

---

Status:

```
Queued

Processing

Completed

Failed
```

---

# Media Variant

## Business Purpose

File turunan.

---

## Candidate Attribute

```
ID

Media Asset ID

Parent Media File ID

Variant Type

File ID
```

---

Contoh:

Video:

```
Original

720p

480p

Thumbnail
```

---

Image:

```
Original

Large

Medium

Small
```

---

# Media Access Control

## Business Purpose

Mengatur akses media.

---

## Candidate Attribute

```
ID

Media Asset ID

Access Type

Role

Organization ID

Expired At
```

---

Access Type:

```
Public

Private

Organization

Restricted
```

---

# Media Reference

## Business Purpose

Mengetahui siapa pengguna media.

---

## Candidate Attribute

```
ID

Media Asset ID

Domain Name

Entity Name

Entity ID

Reference Type

Created At
```

---

Contoh:

```
Media Asset

↓

Question

↓

Question ID 10001
```

---

Penting:

Media Domain tidak membuat Foreign Key ke semua domain.

Menggunakan Generic Reference.

---

# Media Collection

## Business Purpose

Pengelompokan media.

---

## Candidate Attribute

```
ID

Name

Description

Owner User ID
```

---

Contoh:

```
Materi Matematika Kelas 9

Bank Soal UTBK

Logo Sekolah
```

---

# Media Tag

## Business Purpose

Label media.

---

## Candidate Attribute

```
ID

Media Asset ID

Tag
```

---

Contoh:

```
Physics

Mathematics

UTBK

Video
```

---

# Media Transcoding

## Business Purpose

Konversi media.

---

## Candidate Attribute

```
ID

Media Asset ID

Source File

Target Format

Status

Completed At
```

---

Contoh:

```
MP4

↓

HLS Streaming
```

---

# Media Thumbnail

## Business Purpose

Preview media.

---

## Candidate Attribute

```
ID

Media Asset ID

Media File ID

Size

Generated At
```

---

# Media History

## Candidate Attribute

```
ID

Media Asset ID

Action

Old Value

New Value

Changed By

Changed At
```

---

# Media Audit

## Candidate Attribute

```
ID

Media Asset ID

User ID

Action

IPAddress

Timestamp
```

---

# Relationship

```
Media Asset

1

↓

N

Media File

1

↓

N

Media Version


Media File

1

↓

1

Media Metadata


Media File

1

↓

N

Media Processing


Media Asset

1

↓

N

Media Variant


Media Asset

1

↓

N

Media Reference


Media Asset

1

↓

N

Media Tag


Media Asset

1

↓

N

Media History
```

---

# Ownership

| Entity | Owner |
|---|---|
| Media Asset | Media Domain |
| Media File | Media Domain |
| Media Version | Media Domain |
| Media Metadata | Media Domain |
| Media Type | Media Domain |
| Media Storage | Media Domain |
| Media Processing | Media Domain |
| Media Variant | Media Domain |
| Media Access Control | Media Domain |
| Media Reference | Media Domain |
| Media Collection | Media Domain |
| Media Tag | Media Domain |
| Media Transcoding | Media Domain |
| Media Thumbnail | Media Domain |
| Media History | Media Domain |
| Media Audit | System Domain |

---

# Cross Domain Reference

Media digunakan oleh:

- Question Bank
- Learning Resource
- User Management
- Organization
- CBT Engine
- AI Domain
- Analytics

---

# Business Constraint

- Media Code harus unik.
- File binary tidak disimpan di database.
- Media harus memiliki Storage.
- File harus memiliki checksum.
- Media Published tidak boleh berubah tanpa membuat Version.
- Media yang digunakan transaksi tidak boleh langsung dihapus.
- Access Control wajib untuk media private.
- Processing harus melalui workflow.
- Audit tidak boleh dihapus.

---

# Normalization

Target:

```
BCNF
```

Tidak diperbolehkan:

```
Question

image_url


Learning Resource

video_url


User

photo_path
```

Semua menggunakan:

```
Media Asset ID
```

---

# Lifecycle

## Media Asset

```
Uploaded

↓

Processing

↓

Ready

↓

Published

↓

Deprecated

↓

Archived
```

---

## Media Processing

```
Queued

↓

Running

↓

Completed

↓

Failed
```

---

# Design Notes

## 1. Media Sebagai Shared Service

Media bukan bagian dari Question atau Learning.

Semua domain menggunakan Media Domain.

Contoh:

```
Question
    |
    |
Media Asset


Learning
    |
    |
Media Asset
```

---

## 2. Generic Reference Pattern

Media Reference menggunakan:

```
domain_name

entity_name

entity_id
```

bukan Foreign Key langsung.

Alasan:

Jika menggunakan FK langsung:

```
media_question_id

media_learning_id

media_user_id
```

maka Media Domain menjadi tergantung pada seluruh domain.

Hal ini melanggar prinsip bounded context.

---

## 3. Object Storage Ready

Database hanya menyimpan metadata.

File berada di:

```
Object Storage

↓

S3 Compatible Storage
```

Contoh:

- AWS S3
- Cloudflare R2
- MinIO

---

## 4. CDN Ready

Media dirancang agar mudah menggunakan CDN.

Flow:

```
User

↓

CDN

↓

Object Storage

↓

Media Metadata Database
```

---

## 5. Video Learning Ready

Struktur mendukung:

- adaptive streaming
- HLS
- DASH
- subtitle
- multiple resolution
- thumbnail generation

---

## 6. AI Ready

Media dapat menjadi input AI:

```
Video

↓

Speech To Text

↓

Transcript

↓

AI Summary

↓

Learning Resource
```

---

## 7. Future Ready

Model ini mendukung:

- Video Streaming
- Audio Learning
- Interactive Simulation
- Digital Whiteboard
- File Sharing
- Content Delivery Network
- DRM
- Watermark
- Copyright Management
- AI Processing Pipeline
- Automatic Subtitle
- OCR
- Image Recognition
- Malware Scanning
- Large File Upload
- Resumable Upload