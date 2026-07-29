# 07_organization_ldm.md

# Logical Data Model
## Domain : Organization

Version : 1.0

---

# Tujuan

Organization Domain mengelola struktur organisasi, institusi pendidikan, lembaga belajar, dan hubungan antar entitas pendidikan pada platform YakinLulus.

Domain ini menjadi dasar untuk mendukung:

- Sekolah
- Bimbingan belajar
- Universitas
- Lembaga kursus
- Corporate training
- Komunitas belajar
- Multi tenant education platform

Organization Domain **bukan pemilik user**.

User tetap dimiliki oleh User Management Domain.

Organization hanya mengelola hubungan user dengan organisasi.

---

# Aggregate Root

```
Organization
```

---

# Entity Hierarchy

```
Organization
│
├── Organization Type
├── Organization Profile
├── Organization Structure
├── Organization Branch
├── Organization Membership
├── Organization Role
├── Organization Setting
├── Organization Academic
├── Organization Class
├── Organization Subject
├── Organization Teacher Assignment
├── Organization Student Enrollment
├── Organization Invitation
├── Organization Subscription
├── Organization History
└── Organization Audit
```

---

# Logical Entity List

| Entity | Purpose |
|---------|----------|
| Organization | Institusi utama |
| Organization Type | Jenis organisasi |
| Organization Profile | Informasi organisasi |
| Organization Structure | Hierarki organisasi |
| Organization Branch | Cabang organisasi |
| Organization Membership | Anggota organisasi |
| Organization Role | Peran dalam organisasi |
| Organization Setting | Konfigurasi |
| Organization Academic | Pengaturan akademik |
| Organization Class | Kelas organisasi |
| Organization Subject | Mata pelajaran organisasi |
| Organization Teacher Assignment | Penugasan guru |
| Organization Student Enrollment | Siswa organisasi |
| Organization Invitation | Undangan anggota |
| Organization Subscription | Paket layanan |
| Organization History | Riwayat |
| Organization Audit | Audit |

---

# Aggregate Root

# Organization

## Business Purpose

Identitas utama sebuah institusi.

Contoh:

```
SMA Negeri 1 Yogyakarta

Bimbel XYZ

YakinLulus Academy
```

---

## Candidate Attribute

```
ID

Organization Code

Name

Legal Name

Organization Type ID

Status

Owner User ID

Created At

Updated At
```

---

## Business Rule

- Organization Code harus unik.
- Satu Organization dapat memiliki banyak Branch.
- Satu User dapat menjadi anggota banyak Organization.
- Organization tidak menyimpan detail User.

---

# Organization Type

## Business Purpose

Master jenis organisasi.

---

## Candidate Attribute

```
ID

Code

Name

Description

Status
```

---

Contoh:

```
School

University

Course

Training Center

Community

Corporate
```

---

# Organization Profile

## Business Purpose

Informasi detail organisasi.

---

## Candidate Attribute

```
ID

Organization ID

Address

City

Province

Country

Postal Code

Phone

Email

Website

Logo Media ID

Description
```

---

# Organization Structure

## Business Purpose

Hierarki organisasi.

---

## Candidate Attribute

```
ID

Organization ID

Parent Organization ID

Name

Code

Level

Sequence
```

---

Contoh:

```
YakinLulus

|

├── Cabang Jogja

|

├── Cabang Jakarta

|

└── Cabang Surabaya
```

---

# Organization Branch

## Business Purpose

Cabang organisasi.

---

## Candidate Attribute

```
ID

Organization ID

Branch Code

Name

Address

Manager User ID

Status
```

---

# Organization Membership

## Business Purpose

Relasi User dengan Organization.

---

## Candidate Attribute

```
ID

Organization ID

User ID

Membership Type

Status

Joined At

Expired At
```

---

Membership Type:

```
Owner

Admin

Teacher

Student

Parent

Staff
```

---

# Organization Role

## Business Purpose

Role khusus organisasi.

---

## Candidate Attribute

```
ID

Organization ID

Role Name

Permission Rule

Description
```

---

Contoh:

```
School Admin

Teacher

Homeroom Teacher

Operator
```

---

# Organization Setting

## Business Purpose

Konfigurasi organisasi.

---

## Candidate Attribute

```
ID

Organization ID

Setting Key

Setting Value

Updated At
```

---

Contoh:

```
allow_student_registration=true

exam_policy=school

timezone=Asia/Jakarta
```

---

# Organization Academic

## Business Purpose

Konfigurasi akademik organisasi.

---

## Candidate Attribute

```
ID

Organization ID

Academic Year

Curriculum ID

Start Date

End Date

Status
```

---

# Organization Class

## Business Purpose

Kelas yang dikelola organisasi.

---

## Candidate Attribute

```
ID

Organization ID

Grade ID

Class Name

Class Code

Academic Year

Homeroom Teacher ID
```

---

Contoh:

```
X IPA 1

XI IPA 2

Kelas 6A
```

---

# Organization Subject

## Business Purpose

Mata pelajaran yang aktif di organisasi.

---

## Candidate Attribute

```
ID

Organization ID

Subject ID

Teacher ID

Status
```

---

# Organization Teacher Assignment

## Business Purpose

Penugasan guru.

---

## Candidate Attribute

```
ID

Organization ID

Teacher User ID

Subject ID

Class ID

Academic Year
```

---

Contoh:

```
Budi

↓

Matematika

↓

Kelas 9A
```

---

# Organization Student Enrollment

## Business Purpose

Pendaftaran siswa dalam organisasi.

---

## Candidate Attribute

```
ID

Organization ID

Student User ID

Class ID

Academic Year

Status
```

---

Status:

```
Active

Graduated

Transferred

Dropped
```

---

# Organization Invitation

## Business Purpose

Undangan anggota.

---

## Candidate Attribute

```
ID

Organization ID

Email

Role

Invitation Code

Expired At

Status
```

---

Status:

```
Pending

Accepted

Expired

Cancelled
```

---

# Organization Subscription

## Business Purpose

Informasi paket layanan organisasi.

---

## Candidate Attribute

```
ID

Organization ID

Plan

Start Date

End Date

Quota

Status
```

---

Contoh:

```
Free

School

Enterprise
```

---

# Organization History

## Candidate Attribute

```
ID

Organization ID

Action

Old Value

New Value

Changed By

Changed At
```

---

# Organization Audit

## Candidate Attribute

```
ID

Organization ID

User ID

Action

IPAddress

Browser

Timestamp
```

---

# Relationship

```
Organization

1

↓

1

Organization Profile


Organization

1

↓

N

Organization Branch


Organization

1

↓

N

Organization Membership


Organization

1

↓

N

Organization Structure


Organization

1

↓

N

Organization Class


Organization

1

↓

N

Organization Subject


Organization

1

↓

N

Organization Teacher Assignment


Organization

1

↓

N

Organization Student Enrollment


Organization

1

↓

N

Organization Invitation


Organization

1

↓

1

Organization Subscription
```

---

# Ownership

| Entity | Owner |
|---|---|
| Organization | Organization Domain |
| Organization Type | Organization Domain |
| Organization Profile | Organization Domain |
| Organization Structure | Organization Domain |
| Organization Branch | Organization Domain |
| Organization Membership | Organization Domain |
| Organization Role | Organization Domain |
| Organization Setting | Organization Domain |
| Organization Academic | Organization Domain |
| Organization Class | Organization Domain |
| Organization Subject | Organization Domain |
| Organization Teacher Assignment | Organization Domain |
| Organization Student Enrollment | Organization Domain |
| Organization Invitation | Organization Domain |
| Organization Subscription | Organization Domain |
| Organization History | Organization Domain |
| Organization Audit | System Domain |

---

# Cross Domain Reference

Organization menggunakan:

- User Management
- Master Academic
- Media Domain

Organization digunakan oleh:

- CBT Engine
- Learning
- Analytics
- AI
- Subscription/Billing

---

# Business Constraint

- Organization wajib memiliki Organization Type.
- Organization Code harus unique.
- User harus terdaftar pada User Domain sebelum menjadi member.
- Class harus memiliki Grade dari Master Academic.
- Teacher Assignment harus memiliki Subject valid.
- Student Enrollment harus memiliki Class valid.
- Academic Year tidak boleh overlap dalam satu Organization.
- Invitation memiliki masa berlaku.
- Subscription menentukan batas penggunaan.
- Audit tidak boleh dihapus.

---

# Normalization

Target:

```
BCNF
```

Tidak diperbolehkan:

```
Organization

teacher_name

student_name

class_name

subject_name
```

Semua menggunakan Foreign Key.

---

# Lifecycle

## Organization

```
Created

↓

Verified

↓

Active

↓

Suspended

↓

Closed

↓

Archived
```

---

## Membership

```
Invited

↓

Active

↓

Suspended

↓

Removed
```

---

# Design Notes

## 1. Multi Tenant Ready

Organization dirancang sebagai batas isolasi data.

Contoh:

```
School A

tidak dapat melihat

School B
```

---

## 2. User Tidak Terikat Langsung

Jangan membuat:

```
user.organization_id
```

Karena satu user dapat:

- mengajar beberapa sekolah,
- menjadi siswa beberapa program,
- memiliki akses organisasi berbeda.

Gunakan:

```
Organization Membership
```

---

## 3. Organization Sebagai Tenant Boundary

Hampir semua transaksi dapat memiliki konteks:

```
organization_id
```

untuk kebutuhan:

- filtering data,
- security,
- reporting,
- billing.

---

## 4. Academic Context

Sekolah dapat memiliki:

- kurikulum berbeda,
- tahun ajaran berbeda,
- struktur kelas berbeda.

Karena itu data akademik organisasi dipisahkan dari Master Academic.

---

## 5. Subscription Ready

Walaupun MVP belum menggunakan billing, struktur sudah disiapkan untuk:

- Free Plan
- School Plan
- Enterprise Plan
- Usage Limit
- Feature Flag

---

## 6. Future Ready

Model ini mendukung:

- Multi School
- Franchise Bimbel
- Corporate Training
- University LMS
- Parent Account
- School Dashboard
- Teacher Portal
- Student Portal
- Organization Analytics
- Multi Tenant SaaS
- Enterprise Deployment