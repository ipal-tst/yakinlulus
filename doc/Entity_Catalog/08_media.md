# YakinLulus.id

# Entity Catalog

## 08_media.md

Version : 1.0

Status : Draft

Domain : Media

---

# Domain Purpose

Media Domain bertanggung jawab mengelola seluruh aset digital (digital assets) yang digunakan pada platform YakinLulus.

Media bersifat reusable (dapat digunakan ulang) dan tidak dimiliki secara eksklusif oleh domain tertentu.

Seluruh domain menggunakan Media melalui relasi (mapping), bukan dengan menyimpan file secara langsung.

---

# Entity List

MED-001 Media Asset

MED-002 Media File

MED-003 Media Variant

MED-004 Media Folder

MED-005 Media Tag

MED-006 Media Owner Mapping

MED-007 Media Usage

MED-008 Media Version

MED-009 Media Metadata

MED-010 Media Processing Job

MED-011 Media Access Log

MED-012 Media Audit Log

---

====================================================
ENTITY : MEDIA ASSET
====================================================

Entity ID

MED-001

Purpose

Representasi utama sebuah aset digital.

Examples

Image

Video

Audio

PDF

Animation

SVG

ZIP

Business Rules

Media Asset tidak menyimpan binary file.

Candidate Table

media_assets

---

====================================================
ENTITY : MEDIA FILE
====================================================

Entity ID

MED-002

Purpose

Informasi file fisik.

Examples

Storage Provider

Bucket

Path

Filename

Extension

Mime Type

Checksum

Size

Candidate Table

media_files

---

====================================================
ENTITY : MEDIA VARIANT
====================================================

Entity ID

MED-003

Purpose

Versi hasil pemrosesan otomatis.

Examples

Thumbnail

Preview

Compressed

WebP

720p

1080p

Candidate Table

media_variants

---

====================================================
ENTITY : MEDIA FOLDER
====================================================

Entity ID

MED-004

Purpose

Organisasi folder logis.

Candidate Table

media_folders

---

====================================================
ENTITY : MEDIA TAG
====================================================

Entity ID

MED-005

Purpose

Tag media.

Examples

Matematika

Diagram

Bangun Ruang

Audio

Candidate Table

media_tags

---

====================================================
ENTITY : MEDIA OWNER MAPPING
====================================================

Entity ID

MED-006

Purpose

Menghubungkan Media Asset dengan entity pemilik logis.

Examples

Question

Learning Resource

User Profile

Organization

Business Rules

Satu Media dapat dipakai banyak entity.

Candidate Table

media_owner_mappings

---

====================================================
ENTITY : MEDIA USAGE
====================================================

Entity ID

MED-007

Purpose

Mencatat penggunaan media.

Examples

Question 100

Learning Resource 21

Avatar User

Candidate Table

media_usages

---

====================================================
ENTITY : MEDIA VERSION
====================================================

Entity ID

MED-008

Purpose

Riwayat versi media.

Candidate Table

media_versions

---

====================================================
ENTITY : MEDIA METADATA
====================================================

Entity ID

MED-009

Purpose

Metadata teknis media.

Examples

Width

Height

Duration

Frame Rate

Bitrate

Codec

Color Profile

Candidate Table

media_metadata

---

====================================================
ENTITY : MEDIA PROCESSING JOB
====================================================

Entity ID

MED-010

Purpose

Riwayat proses media.

Examples

Resize

Compression

OCR

Speech To Text

Thumbnail Generation

Transcoding

Candidate Table

media_processing_jobs

---

====================================================
ENTITY : MEDIA ACCESS LOG
====================================================

Entity ID

MED-011

Purpose

Riwayat akses media.

Examples

Download

Preview

Streaming

Candidate Table

media_access_logs

---

====================================================
ENTITY : MEDIA AUDIT LOG
====================================================

Entity ID

MED-012

Purpose

Audit seluruh perubahan Media Domain.

Candidate Table

media_audit_logs