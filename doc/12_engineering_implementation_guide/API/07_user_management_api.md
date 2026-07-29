# User Management API

**Document** : `api/07_user_management_api.md`  
**Version** : 1.0  
**Category** : Engineering Implementation Guide

---

# 1. Tujuan

Dokumen ini mendefinisikan spesifikasi **User Management API** pada YakinLulus.id.

Modul ini bertanggung jawab terhadap seluruh siklus hidup (lifecycle) pengguna, mulai dari pembuatan akun, pengelolaan profil, pengaturan Role Based Access Control (RBAC), hingga pengelolaan status akun.

API ini digunakan oleh:

- Web Admin
- Web Teacher
- Flutter Mobile
- Future School Portal
- Future Public API

---

# 2. User Domain

Seluruh pengguna direpresentasikan oleh satu entitas **User**.

Role didapatkan melalui sistem RBAC.

```text
User

├── Super Admin
├── Admin
├── Staff
├── Teacher
└── Student
```

---

# 3. User Lifecycle

```text
Create User

↓

Verify Email

↓

Active

↓

Update Profile

↓

Suspend (Optional)

↓

Reactivate

↓

Soft Delete

↓

Archive
```

Seluruh perubahan status dicatat pada Audit Log.

---

# 4. API Architecture

```text
Client

↓

HTTP API

↓

Authentication

↓

Authorization (RBAC)

↓

Validation

↓

Application Layer

↓

Repository

↓

PostgreSQL
```

---

# 5. Endpoint Overview

| Method | Endpoint | Fungsi |
|----------|----------|--------|
| GET | /users | List User |
| POST | /users | Create User |
| GET | /users/{id} | Detail User |
| PATCH | /users/{id} | Update User |
| DELETE | /users/{id} | Soft Delete |
| GET | /users/profile | Current Profile |
| PATCH | /users/profile | Update Profile |
| POST | /users/{id}/activate | Activate User |
| POST | /users/{id}/suspend | Suspend User |
| POST | /users/{id}/roles | Assign Role |

---

# 6. Create User

```http
POST /api/v1/users
```

Request

```json
{
  "fullName": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "081234567890",
  "roleId": "student",
  "schoolId": "school_001"
}
```

Response

```json
{
  "success": true,
  "data": {
    "id": "usr_001"
  }
}
```

Password awal dapat:

- dibuat otomatis
- dikirim melalui email
- atau menggunakan activation link

---

# 7. Get User Detail

```http
GET /api/v1/users/{id}
```

Response

```json
{
  "success": true,
  "data": {
    "id": "usr_001",
    "fullName": "Budi Santoso",
    "email": "budi@example.com",
    "role": "student",
    "status": "active"
  }
}
```

---

# 8. List User

```http
GET /api/v1/users
```

Parameter

```text
?page=1

&pageSize=20

&search=budi

&role=student

&status=active

&schoolId=school_001
```

Response menggunakan Pagination Standard.

---

# 9. Update User

```http
PATCH /api/v1/users/{id}
```

Request

```json
{
  "fullName": "Budi Pratama",
  "phone": "081212121212"
}
```

Response

```http
200 OK
```

Hanya field yang dikirim yang diperbarui.

---

# 10. Delete User

Menggunakan Soft Delete.

```http
DELETE /api/v1/users/{id}
```

Response

```http
204 No Content
```

Data historis tetap dipertahankan.

---

# 11. Current Profile

```http
GET /api/v1/users/profile
```

Mengembalikan profil pengguna yang sedang login.

---

# 12. Update Current Profile

```http
PATCH /api/v1/users/profile
```

User hanya dapat mengubah field yang diizinkan.

Contoh:

- photo
- fullName
- phone
- timezone
- language

Tidak dapat mengubah:

- role
- email (melalui endpoint khusus)
- status

---

# 13. User Status

Status yang didukung:

```text
Pending

Active

Suspended

Archived

Deleted
```

Perubahan status menggunakan endpoint khusus.

---

# 14. Activate User

```http
POST /api/v1/users/{id}/activate
```

Mengubah status menjadi:

```text
Active
```

---

# 15. Suspend User

```http
POST /api/v1/users/{id}/suspend
```

Request

```json
{
  "reason": "Academic violation"
}
```

Suspend tidak menghapus data.

User tidak dapat login.

---

# 16. Assign Role

```http
POST /api/v1/users/{id}/roles
```

Request

```json
{
  "roleId": "teacher"
}
```

RBAC akan memperbarui hak akses secara otomatis.

---

# 17. Search

Search dilakukan terhadap:

- Full Name
- Email
- Username (future)
- Phone

Case insensitive.

---

# 18. Filtering

Contoh:

```text
role

status

schoolId

gradeId

createdAt
```

Filtering dapat dikombinasikan.

---

# 19. Sorting

Contoh:

```text
sort=createdAt

order=desc
```

Field yang didukung:

- createdAt
- updatedAt
- fullName
- lastLogin

---

# 20. Avatar Upload

```http
POST /api/v1/users/profile/avatar
```

Menggunakan:

```text
multipart/form-data
```

Response

```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://..."
  }
}
```

---

# 21. User Import

Bulk Import

```http
POST /api/v1/users/import
```

Menggunakan file Excel.

Response

```http
202 Accepted
```

Diproses melalui Background Worker.

---

# 22. User Export

```http
GET /api/v1/users/export
```

Mendukung:

- Excel
- CSV

Diproses asynchronous jika jumlah data besar.

---

# 23. Authorization Matrix

| Role | Hak Akses |
|------|-----------|
| Super Admin | Semua User |
| Admin | Seluruh user dalam tenant/sekolah |
| Staff | Sesuai kebijakan |
| Teacher | Melihat profil sendiri dan siswa yang diampu |
| Student | Profil sendiri |

Seluruh akses divalidasi melalui RBAC Middleware.

---

# 24. Validation Rules

Minimal validasi:

- Email unik
- Phone unik (opsional)
- Role harus valid
- School harus ada
- Nama minimal 3 karakter

---

# 25. Audit Logging

Seluruh aktivitas dicatat.

Contoh:

- Create User
- Update User
- Delete User
- Suspend User
- Activate User
- Assign Role
- Import User
- Export User

---

# 26. Security Consideration

API wajib menerapkan:

- JWT Authentication
- RBAC Authorization
- Soft Delete
- Input Validation
- Audit Logging
- Rate Limiting
- File Validation
- Request Size Limit

Password tidak pernah dikirim kembali melalui response.

---

# 27. Scalability Consideration

Desain ini mendukung:

- Multi School
- Multi Tenant
- Horizontal Scaling
- Bulk Import
- Background Worker
- API Gateway
- Future Identity Service

---

# 28. Future Evolution

User Management API siap dikembangkan menuju:

- Parent Account
- Guardian Relationship
- Organization Management
- School Management
- Multi-Tenant Identity
- LDAP Integration
- OAuth Identity Provider
- SCIM Provisioning

---

# Summary

User Management API menyediakan layanan terpusat untuk mengelola seluruh pengguna YakinLulus.id.

Karakteristik utama:

- Mendukung seluruh role melalui RBAC.
- Soft Delete untuk menjaga integritas data.
- Mendukung import dan export massal.
- Endpoint konsisten dengan standar API platform.
- Audit Logging untuk seluruh perubahan.
- Siap berkembang menjadi Identity Service pada arsitektur microservices di masa depan.
