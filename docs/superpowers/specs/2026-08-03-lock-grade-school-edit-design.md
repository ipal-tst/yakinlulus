# Desain: Kunci Kelas & Sekolah di Edit Profil (Hanya Admin/Staff)

Tanggal: 2026-08-03
Status: Approved (brainstorming)

## Ringkasan

Siswa **tidak boleh** mengubah **kelas** (`grade_id`) dan **sekolah** (`school_name`) sendiri dari halaman edit profil. Kedua field hanya dapat diubah oleh **ADMIN** dan **STAFF**. Guru tidak memiliki hak ini.

Enforcement dilakukan di **dua lapis**: backend (pemisahan role di service — sumber kebenaran) dan frontend (field `disabled` untuk non-admin/staff).

## Latar Belakang

Fitur edit data diri lengkap siswa (spec `2026-08-03-student-profile-edit-design.md`) memperbolehkan siswa mengubah semua field termasuk kelas & sekolah melalui `EditProfileDialog`. Ini berisiko:

- Siswa bisa mengubah kelasnya sendiri → mengubah akses grade (RBAC grade-based, view `user_accessible_grades`), target sekolah, dan paket ujian.
- Sekolah tidak bisa diverifikasi → manipulasi data institusi.

Keputusan bisnis: kelas & sekolah adalah data yang dikelola institusi/admin, bukan data pribadi siswa.

## Aturan Akses

| Role | Ubah `grade_id` | Ubah `school_name` |
|---|---|---|
| ADMIN | ✅ | ✅ |
| STAFF | ✅ | ✅ |
| TEACHER | ❌ | ❌ |
| STUDENT | ❌ | ❌ |

## Ruang Lingkup

### Backend — `internal/auth/auth.go`

1. **Service `UpdateProfile`**: tambah parameter `role string`.
   - Jika `role` bukan `"ADMIN"` dan bukan `"STAFF"` → set `req.GradeID = nil` dan `req.SchoolName = nil` (field di-ignore, nilai DB tetap).
   - Alasan `nil` (bukan error 403): payload frontend selalu mengirim `grade_id` & `school_name`; memblokir seluruh request akan merusak penyimpanan field lain (nama, HP, gender, jurusan, foto). Nilai yang di-ignore tidak mengubah DB.
2. **Handler `UpdateProfile`**: ekstrak `role` dari `c.Locals("role")` dan teruskan ke service.

### Backend — Admin update user (melengkapi "kecuali oleh admin/staff")

3. **`AdminUpdateUserReq`**: tambah field `SchoolName *string json:"school_name,omitempty"`.
4. **Repo `UpdateUser`** (line ~293): tambah kolom `school_name` ke query `SET`.
5. **Handler `AdminUpdateUser`**: petakan `req.SchoolName` ke user sebelum `UpdateUser`.

Catatan: `grade_id` sudah bisa diubah via admin (`PUT /auth/users/:id`, guarded `RequireRole("ADMIN","STAFF")`). Penambahan `school_name` melengkapi akses admin.

### Frontend — `frontend/app/(portal)/student/profile/page.tsx`

6. **`EditProfileDialog`**: ambil `role` dari `useAuth()`. Field **Kelas** dan **Sekolah**:
   - `disabled` bila role bukan `ADMIN`/`STAFF`
   - nilai tetap tampil (read-only)
   - teks bantu kecil "Hanya dapat diubah oleh admin" di bawah field saat terkunci
7. **Payload submit**: field `grade_id`/`school_name` tetap dikirim apa adanya (backend yang memutuskan). Tidak perlu logika kondisional frontend tambahan.

## Di Luar Lingkup

- Tidak menambah mekanisme edit grade/school untuk TEACHER.
- Tidak mengubah RBAC middleware.
- Tidak mengubah tabel DB (tidak ada migrasi).
- Tidak mengubah halaman admin users (sudah ada `PUT /auth/users/:id`).

## Arsitektur & Alur Data

```
EditProfileDialog (frontend)
  ├─ role ∈ {ADMIN, STAFF}  → field Kelas/Sekolah editable
  └─ role ∉ {ADMIN, STAFF}  → field Kelas/Sekolah disabled (read-only)

PUT /auth/profile  → Handler.UpdateProfile
  └─ svc.UpdateProfile(ctx, userID, role, req)
       └─ if role ∉ {ADMIN, STAFF} → req.GradeID = nil; req.SchoolName = nil
       └─ validateProfileRequest(req)
       └─ GradeExists(req.GradeID)
       └─ repo.UpdateProfile(...)  // field nil → tidak di-update
```

## Error Handling

- Tidak ada error baru; field yang diblokir hanya di-ignore (tidak mengubah DB).
- Admin/Staff dengan `grade_id` tidak valid tetap mendapat 400 dari `GradeExists` (perilaku existing dipertahankan).

## Testing (TDD)

Unit test di `backend/internal/auth/auth_test.go` (repo mock/fake `UpdateProfile`):

1. `TestUpdateProfileNonAdminIgnoresGradeAndSchool` — role `"STUDENT"` mengirim `grade_id` & `school_name` baru → request ke repo **tanpa** `GradeID` & `SchoolName`.
2. `TestUpdateProfileAdminUpdatesGradeAndSchool` — role `"ADMIN"` mengirim keduanya → request ke repo **dengan** `GradeID` & `SchoolName`.
3. `TestUpdateProfileStaffUpdatesGradeAndSchool` — role `"STAFF"` mengirim keduanya → disimpan.
4. `TestUpdateProfileTeacherIgnoresGradeAndSchool` — role `"TEACHER"` → di-ignore.

Verifikasi tambahan (live):
- Login `murid@yakinlulus.id` → PUT `/auth/profile` kirim `grade_id` baru → `grade_id` di response tetap lama.
- Login `admin@yakinlulus.id` → PUT `/auth/profile` (atau `PUT /auth/users/:id`) → `grade_id`/`school_name` berubah.
