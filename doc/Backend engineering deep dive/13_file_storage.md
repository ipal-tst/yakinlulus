# 13_file_storage.md

# YakinLulus.id File Storage Architecture

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur **File Storage** pada backend YakinLulus.id.

File Storage bertanggung jawab mengelola seluruh aset digital yang digunakan platform, seperti:

* Gambar soal
* Gambar materi
* Video pembelajaran
* Audio
* Dokumen PDF
* Lampiran
* Avatar pengguna
* Thumbnail
* AI Generated Assets

Seluruh penyimpanan file menggunakan **Supabase Storage** sebagai object storage utama.

---

# 2. Objectives

Arsitektur File Storage dirancang untuk:

* Mendukung jutaan file.
* Aman.
* Mudah di-scale.
* Mendukung CDN.
* Mendukung signed URL.
* Mendukung private/public bucket.
* Tidak bergantung langsung pada vendor.

---

# 3. Design Principles

Seluruh implementasi mengikuti prinsip:

* Object Storage First
* Metadata in Database
* Immutable File
* Secure by Default
* Versionable
* CDN Ready
* Adapter Pattern
* Vendor Agnostic

---

# 4. High Level Architecture

```text id="4x7mqa"
Client

↓

API

↓

Media Service

↓

Storage Adapter

↓

Supabase Storage

↓

CDN
```

Database hanya menyimpan metadata, sedangkan file fisik berada di Object Storage.

---

# 5. Storage Components

Storage terdiri dari:

* Storage Adapter
* Upload Service
* Download Service
* Metadata Repository
* Thumbnail Generator
* Media Validator
* Signed URL Generator

---

# 6. Directory Structure

```text id="7f3rzu"
internal/

platform/

storage/

adapter.go

supabase.go

service.go

signed_url.go

validator.go

thumbnail.go
```

---

# 7. Storage Adapter

Seluruh akses storage menggunakan interface.

```go id="8p1gjt"
type Storage interface {
    Upload(...)
    Download(...)
    Delete(...)
    Exists(...)
    GetSignedURL(...)
}
```

Business layer tidak mengetahui implementasi Supabase.

---

# 8. Storage Flow

```text id="gj3p2h"
Upload Request

↓

Validation

↓

Storage Adapter

↓

Supabase Storage

↓

Metadata Save

↓

Response
```

Metadata hanya disimpan apabila upload berhasil.

---

# 9. Bucket Strategy

Bucket dipisahkan berdasarkan domain.

| Bucket     | Visibility |
| ---------- | ---------- |
| avatars    | Public     |
| questions  | Private    |
| materials  | Private    |
| videos     | Private    |
| thumbnails | Public     |
| documents  | Private    |
| exports    | Private    |
| ai-assets  | Private    |

Bucket dapat berkembang tanpa mengubah arsitektur.

---

# 10. Folder Structure

Contoh struktur object:

```text id="n5t1cv"
questions/

2026/

07/

question-id/

image.png
```

Video:

```text id="j0m4wb"
materials/

physics/

video.mp4
```

Avatar:

```text id="g8x2fd"
avatars/

user-id/avatar.webp
```

Folder digunakan untuk organisasi, bukan sebagai sumber identitas data.

---

# 11. Metadata Storage

Metadata disimpan di PostgreSQL.

Contoh tabel:

```text id="y2r9sk"
media_files
```

Kolom utama:

* id
* bucket
* object_key
* original_name
* mime_type
* extension
* size
* checksum
* uploaded_by
* created_at

---

# 12. Object Naming Strategy

Nama object tidak menggunakan nama asli file.

Contoh:

```text id="e6q3nw"
UUID.extension
```

Contoh:

```text id="a4l7uv"
4d0b65d8.webp
```

Hal ini menghindari konflik nama dan meningkatkan keamanan.

---

# 13. Upload Flow

```text id="r3p8zg"
Receive File

↓

Validate

↓

Generate Object Name

↓

Upload

↓

Save Metadata

↓

Return Response
```

---

# 14. Download Flow

```text id="k1m5xr"
Request

↓

Authorization

↓

Generate Signed URL

↓

Client Download
```

Backend tidak menjadi proxy file kecuali diperlukan.

---

# 15. Public vs Private Files

Public:

* Avatar
* Thumbnail
* Logo

Private:

* Soal
* PDF
* Video Premium
* Audio
* Export
* Lampiran CBT

Default seluruh bucket bersifat private.

---

# 16. Signed URL Strategy

Private file diakses menggunakan Signed URL.

Contoh:

```text id="q9v2cy"
Expiration

↓

5 minutes
```

Durasi dapat dikonfigurasi sesuai kebutuhan.

---

# 17. Upload Validation

Sebelum upload:

* MIME Type
* File Extension
* File Size
* Empty File
* Filename
* Virus Scan (Future)

File yang gagal validasi langsung ditolak.

---

# 18. Supported File Types

Image:

```text id="m2g6ph"
jpg

jpeg

png

webp
```

Video:

```text id="u8d1qa"
mp4
```

Audio:

```text id="p5f9zx"
mp3

wav
```

Document:

```text id="b1h4kt"
pdf
```

Format tambahan dapat ditambahkan melalui konfigurasi.

---

# 19. Maximum File Size

Rekomendasi MVP:

| Type           | Max Size |
| -------------- | -------- |
| Avatar         | 2 MB     |
| Question Image | 5 MB     |
| Material Image | 10 MB    |
| PDF            | 30 MB    |
| Audio          | 50 MB    |
| Video          | 500 MB   |

Nilai dapat diubah melalui konfigurasi.

---

# 20. Image Optimization

Upload gambar:

```text id="z6r3ln"
Upload

↓

Resize (opsional)

↓

Compress

↓

Convert WEBP

↓

Store
```

Original file dapat disimpan jika dibutuhkan.

---

# 21. Thumbnail Generation

Video:

```text id="t9p4wy"
Upload

↓

Extract Thumbnail

↓

Store Thumbnail
```

Thumbnail disimpan pada bucket `thumbnails`.

---

# 22. File Versioning

File penting dapat memiliki versi.

Contoh:

```text id="w4m1eu"
Material PDF

v1

v2

v3
```

Metadata menyimpan versi aktif.

---

# 23. Duplicate Detection

Gunakan checksum:

```text id="h8n5gj"
SHA-256
```

Manfaat:

* Menghindari upload duplikat.
* Validasi integritas file.
* Optimasi penyimpanan.

---

# 24. Delete Strategy

Soft Delete:

* Metadata diberi status terhapus.

Hard Delete:

* Object Storage dihapus.
* Metadata dihapus sesuai kebijakan retensi.

Untuk file yang masih direferensikan entity lain, penghapusan ditolak.

---

# 25. Orphan File Cleanup

Background Job:

```text id="x3b7kf"
Find Metadata Missing

↓

Delete Object

↓

Report
```

Atau:

```text id="v6k0mz"
Find Object Without Metadata

↓

Delete Object
```

Pembersihan dilakukan secara terjadwal.

---

# 26. Security

File upload wajib:

* Authentication
* Authorization
* Validation
* Signed URL

Tidak boleh mengizinkan akses langsung ke bucket private.

---

# 27. Access Control

Contoh:

Student:

* Avatar
* Materi yang dimiliki
* File soal saat sesi CBT

Teacher:

* Materi miliknya
* Soal yang dibuat

Admin:

* Seluruh file

Hak akses dievaluasi sebelum Signed URL dibuat.

---

# 28. CDN Integration

Future:

```text id="f2j8qs"
Client

↓

CDN

↓

Supabase Storage
```

CDN meningkatkan performa distribusi file statis.

---

# 29. Caching

Cache metadata:

* Object Key
* Bucket
* MIME Type
* Size

File tetap diambil melalui Object Storage/CDN.

---

# 30. Logging

Setiap operasi dicatat:

* Upload
* Delete
* Download
* Generate Signed URL
* Validation Failure

Log tidak mencatat isi file.

---

# 31. Monitoring

Metric:

* Upload Count
* Download Count
* Storage Usage
* Upload Failure
* Delete Failure
* Signed URL Generation
* Average Upload Time

---

# 32. Backup Strategy

Database metadata dibackup bersama PostgreSQL.

Object Storage mengikuti kebijakan backup dan redundansi yang disediakan Supabase atau infrastruktur object storage yang digunakan.

Untuk aset yang sangat penting, pertimbangkan replikasi lintas wilayah (future).

---

# 33. Future Scalability

Storage Adapter memungkinkan migrasi ke:

* Amazon S3
* Cloudflare R2
* Google Cloud Storage
* Azure Blob Storage
* MinIO

Tanpa mengubah business logic.

---

# 34. Testing Strategy

Pengujian mencakup:

* Upload berhasil.
* Upload gagal.
* MIME Validation.
* Size Validation.
* Signed URL.
* Delete.
* Duplicate Detection.
* Permission.

---

# 35. Anti-Patterns

Tidak diperbolehkan:

* Menyimpan file di database.
* Menyimpan file pada filesystem lokal production.
* Menggunakan nama file asli sebagai object key.
* Menyimpan file tanpa metadata.
* Mengekspos bucket private secara publik.
* Mengizinkan upload tanpa validasi.

---

# 36. Recommended Metadata Schema

```text id="c5z8nr"
id

bucket

object_key

original_name

mime_type

extension

size

checksum

visibility

version

uploaded_by

created_at

deleted_at
```

Relasi ke entity bisnis (misalnya `question`, `material`, `user`) dilakukan melalui foreign key atau tabel relasi sesuai domain model.

---

# 37. Storage Checklist

Sebelum implementasi selesai:

* Menggunakan Storage Adapter.
* Bucket dipisahkan berdasarkan domain.
* Metadata disimpan di PostgreSQL.
* Private file menggunakan Signed URL.
* Validasi upload aktif.
* Checksum dibuat.
* Logging aktif.
* Monitoring aktif.
* Unit dan integration test tersedia.

---

# 38. Summary

YakinLulus.id menggunakan **Supabase Storage** sebagai object storage utama dengan pendekatan **Adapter Pattern** dan **Metadata in Database**. Arsitektur ini memberikan:

* Skalabilitas tinggi untuk penyimpanan aset.
* Keamanan melalui private bucket dan Signed URL.
* Integrasi yang baik dengan CDN.
* Kemudahan migrasi ke penyedia object storage lain.
* Fondasi yang siap mendukung pertumbuhan platform hingga jutaan file tanpa perubahan pada business logic.
