Untuk **YakinLulus.id**, saya tidak menyarankan hanya membuat tabel `files` atau `media`. Pada platform edutech berskala besar, aset digital mencakup jauh lebih banyak daripada sekadar file. Seluruh gambar soal, video materi, audio, dokumen PDF, thumbnail, avatar, sertifikat, hingga hasil ekspor harus dikelola secara terpusat.

Domain **Asset Management** sebaiknya menjadi layanan lintas modul yang digunakan oleh Bank Soal, Materi, CBT, AI Tutor, Membership, CMS, dan User.

## Ruang Lingkup Domain

```text
Asset Management
│
├── Asset
├── Asset Version
├── Asset Folder
├── Asset Category
├── Asset Tag
├── Asset Metadata
├── Asset Relation
├── Asset Permission
├── Asset Storage
├── Asset Conversion
├── Asset Thumbnail
├── Asset Preview
├── Asset Usage
├── Asset Download
├── Asset Share
├── Asset Archive
├── Asset Audit
├── CDN
└── Storage Provider
```

Total sekitar **28–35 tabel**, cukup untuk mendukung Digital Asset Management (DAM) tingkat enterprise.

---

# 1. asset

Master seluruh file.

```text
asset

id (uuid)

asset_code

original_name

display_name

description

asset_type_id

mime_type

extension

size

checksum_sha256

storage_id

current_version_id

visibility

PUBLIC

PRIVATE

PROTECTED

status

ACTIVE

ARCHIVED

DELETED

uploaded_by

uploaded_at

deleted_at
```

---

# 2. asset_version

Versioning.

```text
asset_version

id

asset_id

version

file_name

storage_path

file_size

checksum

uploaded_by

created_at

change_note
```

Setiap perubahan file tidak menghapus file lama.

---

# 3. asset_type

Jenis file.

```text
asset_type

id

code

IMAGE

VIDEO

AUDIO

PDF

DOCUMENT

SPREADSHEET

PRESENTATION

ZIP

FONT

MODEL

OTHER

name

icon
```

---

# 4. asset_category

Kategori.

```text
asset_category

id

parent_id

code

QUESTION

MATERIAL

PROFILE

CERTIFICATE

THUMBNAIL

AI

SYSTEM

EXPORT

BACKUP

name
```

---

# 5. asset_folder

Folder virtual.

```text
asset_folder

id

parent_id

organization_id

name

description

path

created_by
```

---

# 6. asset_folder_item

```text
asset_folder_item

id

folder_id

asset_id
```

---

# 7. asset_tag

```text
asset_tag

id

name

color
```

---

# 8. asset_tag_map

```text
asset_tag_map

id

asset_id

tag_id
```

---

# 9. asset_metadata

Metadata tambahan.

```text
asset_metadata

id

asset_id

width

height

duration

pages

dpi

language

camera

gps

json_metadata
```

Menggunakan JSONB.

---

# 10. asset_storage

Lokasi penyimpanan.

```text
asset_storage

id

provider_id

bucket

storage_path

public_url

cdn_url

region

status
```

---

# 11. storage_provider

```text
storage_provider

id

code

SUPABASE

S3

MINIO

AZURE

GCS

LOCAL

name

endpoint
```

---

# 12. asset_thumbnail

```text
asset_thumbnail

id

asset_id

size

path

width

height
```

---

# 13. asset_preview

Preview PDF/video.

```text
asset_preview

id

asset_id

preview_path

generated_at
```

---

# 14. asset_conversion

Konversi file.

```text
asset_conversion

id

asset_id

source_format

target_format

status

output_asset_id
```

Contoh

```text
DOCX

↓

PDF
```

atau

```text
MP4

↓

HLS
```

---

# 15. asset_relation

Relasi antar aset.

```text
asset_relation

id

parent_asset_id

child_asset_id

relation_type
```

Contoh

```text
Video

↓

Subtitle

↓

Thumbnail

↓

Transcript
```

---

# 16. asset_reference

Menghubungkan asset ke modul.

```text
asset_reference

id

asset_id

module

entity

entity_id
```

Contoh

```text
asset

↓

question

↓

question_id
```

atau

```text
asset

↓

material

↓

material_id
```

---

# 17. asset_permission

```text
asset_permission

id

asset_id

role_id

permission

READ

WRITE

DELETE

DOWNLOAD
```

---

# 18. asset_share

```text
asset_share

id

asset_id

token

expired_at

password_hash

max_download
```

---

# 19. asset_download

Riwayat download.

```text
asset_download

id

asset_id

user_id

download_time

ip

device
```

---

# 20. asset_usage

Dipakai dimana.

```text
asset_usage

id

asset_id

module

entity

entity_id

used_at
```

Sangat penting untuk mengetahui apakah file masih dipakai.

---

# 21. asset_archive

```text
asset_archive

id

asset_id

archive_reason

archived_by

archived_at
```

---

# 22. asset_delete_queue

Soft delete.

```text
asset_delete_queue

id

asset_id

scheduled_delete

status
```

---

# 23. asset_scan

Hasil antivirus.

```text
asset_scan

id

asset_id

engine

status

scan_result

scanned_at
```

---

# 24. asset_ai_analysis

Untuk AI Vision.

```text
asset_ai_analysis

id

asset_id

provider

analysis_type

OCR

QUESTION_PARSE

IMAGE_CLASSIFY

result_json

created_at
```

JSONB.

---

# 25. asset_processing_job

Background worker.

```text
asset_processing_job

id

asset_id

job_type

OCR

TRANSCODE

THUMBNAIL

INDEX

status

started_at

finished_at
```

---

# 26. asset_audit_log

Audit.

```text
asset_audit_log

id

asset_id

user_id

action

UPLOAD

UPDATE

DELETE

DOWNLOAD

RESTORE

created_at
```

---

# 27. cdn_provider

```text
cdn_provider

id

name

endpoint

region

enabled
```

---

# 28. asset_cache

```text
asset_cache

id

asset_id

cache_key

expired_at
```

---

# 29. asset_favorite

```text
asset_favorite

id

asset_id

user_id
```

---

# 30. asset_comment

Untuk reviewer.

```text
asset_comment

id

asset_id

user_id

comment

created_at
```

---

# Relasi Besar

```text
Asset Type
      │
      └──────── Asset
                     │
                     ├──────── Asset Version
                     ├──────── Asset Metadata
                     ├──────── Thumbnail
                     ├──────── Preview
                     ├──────── Conversion
                     ├──────── Processing Job
                     ├──────── AI Analysis
                     ├──────── Scan
                     ├──────── Download
                     ├──────── Usage
                     ├──────── Audit
                     ├──────── Archive
                     ├──────── Delete Queue
                     ├──────── Favorite
                     ├──────── Comment
                     ├──────── Share
                     ├──────── Asset Relation
                     ├──────── Asset Reference
                     ├──────── Asset Permission
                     └──────── Asset Folder Item
                                   │
                                   └──────── Asset Folder

Storage Provider
      │
      └──────── Asset Storage
                     │
                     └──────── CDN Provider
```

# Integrasi dengan Domain Lain

| Domain              | Penggunaan Asset Management                               |
| ------------------- | --------------------------------------------------------- |
| User & RBAC         | Avatar pengguna, dokumen verifikasi, foto profil          |
| Master Akademik     | Ikon mata pelajaran, logo sekolah, banner akademik        |
| Bank Soal           | Gambar soal, grafik, rumus, lampiran PDF, audio listening |
| Materi Pembelajaran | Video, PDF, presentasi, gambar, audio, subtitle           |
| CBT/Ujian           | Lampiran soal, media interaktif, file pendukung ujian     |
| AI Tutor            | OCR, parsing soal, analisis gambar, transkrip audio       |
| Membership          | Banner paket, materi premium, sertifikat                  |
| CMS                 | Banner, artikel, ilustrasi, media promosi                 |
| Notification        | Lampiran notifikasi dan email                             |
| Reporting           | File ekspor PDF, Excel, CSV, arsip laporan                |

# Struktur Penyimpanan Objek (Supabase Storage)

Untuk menjaga konsistensi dan kemudahan pengelolaan, bucket dapat dipisahkan sebagai berikut:

```text
avatars/
schools/
subjects/
questions/
materials/
videos/
audio/
documents/
certificates/
exports/
imports/
ai/
system/
backups/
temp/
```

# Praktik Implementasi yang Direkomendasikan

* Gunakan **UUID v7** sebagai primary key di seluruh tabel.
* Simpan checksum **SHA-256** untuk deduplikasi dan verifikasi integritas file.
* Terapkan **soft delete** dan **versioning**, sehingga file yang diperbarui atau dihapus dapat dipulihkan.
* Metadata fleksibel seperti hasil OCR, EXIF, atau analisis AI disimpan dalam **JSONB**.
* File biner disimpan di **Supabase Storage**, sedangkan PostgreSQL hanya menyimpan metadata dan relasinya.
* Seluruh proses berat (OCR, thumbnail, transcoding video, indexing, AI parsing) dijalankan melalui **background worker** agar tidak menghambat proses unggah.
* Seluruh referensi ke file pada domain lain sebaiknya menggunakan `asset_reference` atau foreign key `asset_id`, sehingga aset dapat dilacak, diaudit, dan dikelola secara terpusat di seluruh ekosistem YakinLulus.id.
