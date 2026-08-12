# Halaman Admin — Kelola Pengguna (Dokumen Desain)

> **Status:** Draft desain (greenfield — halaman eksisting hanya referensi)
> **Modul:** Manajemen Pengguna (User Management) & Manajemen Role (Role Management)
> **Tergantung pada:** Master Akademik (jenjang/kelas), Kelola Sekolah.

---

## 1. Tujuan & Sifat Halaman

Halaman **Kelola Pengguna** adalah pusat administrasi identitas & akses platform. Sifat wajib:

1. **CRUD User penuh** — username/email/password, profil lengkap (nama, gender, phone, avatar),
   data akademik (jenjang, kelas, sekolah, jurusan), status aktif, role.
2. **Manajemen Role (RBAC)** — daftar role, permission matrix, assign role ke user, custom permission override.
3. **Import/Export + checkbox + tabel rapi + filter detil** — permintaan eksplisit.

---

## 2. Model Data

### 2.1 `identity.user` (base user)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | PK |
| username | varchar(100) | unique, NOT NULL |
| email | varchar(255) | unique |
| phone | varchar(30) | |
| password_hash | text | NOT NULL |
| status | text | `ACTIVE`/`INACTIVE`/`LOCKED`/`PENDING` |
| avatar_url | text | |
| last_login_at | timestamptz | |
| email_verified / phone_verified | boolean | |
| timestamps + deleted_at | | |

### 2.2 `identity.user_profile` (profil lengkap)
| Kolom | Tipe |
|---|---|
| id, user_id (FK) | uuid |
| full_name, gender, photo, bio, language  | |
| timestamps | |

### 2.3 `identity.user_role` (role assignment)
| Kolom | Tipe |
|---|---|
| id, user_id, role_id | uuid |
| organization_id, scope_id | uuid (nullable) |
| start_date, end_date, is_primary | date, bool |

### 2.4 `identity.role` (role master)
| Kolom | Tipe |
|---|---|
| id, code, name, description, priority, is_system | |

**Role codes (seed):** `SUPER_ADMIN`, `STAFF`, `FINANCE`, `GURU`, `SISWA`, `SUPER_SISWA`, `INVESTOR`.

### 2.3 `identity.role_permission` (RBAC matrix)
| Kolom | Tipe |
|---|---|
| role_id, permission_id, allow, created_at | |

### 2.4 `academic.student_enrollment` (data akademik siswa)
| Kolom | Tipe |
|---|---|
| student_id, school_id, school_class_id, grade_id, major_id, academic_year_id, status | |

---

## 3. Logic & Aturan Bisnis

1. **Role assignment** — setiap user minimal 1 role (primary). Multi-role via `user_role` (is_primary = true hanya 1).
2. **Role hierarchy** (priority): SUPER_ADMIN > STAFF > FINANCE > GURU > INVESTOR > SUPER_SISWA > SISWA.
3. **Gate** — `RequireRole("SUPER_ADMIN","STAFF")` utk write user; `SUPER_ADMIN` saja utk assign role `SUPER_ADMIN`.
3. **Grade/School/Major** — disimpan di `academic.student_enrollment` (FK ke grade, school, major, academic_year). **Bukan** di `identity.user`.
4. **Create User** — `POST /auth/users` body: `{email, password, full_name, role}`; role diambil dari body (bukan hardcode).
4. **Update User** — `PUT /auth/users/:id` body: `{full_name?, role?, is_active?}` + **tambahan** `grade_id`, `school_id`, `major_id` → update `student_enrollment` (create/upsert).
5. **UpdateProfile (self)** — hanya `full_name, gender, phone, avatar_url`. Field akademik **tidak** diubah di sini.
5. **Delete** — soft delete (`deleted_at`); blokir bila masih punya enrollment/attempt aktif.
6. **Import/Export** — CSV/XLSX dengan kolom: `email, password, full_name, role, gender, phone, school_name, education_level, grade, major, membership_status`.

---

## 4. API (Existing + `[BARU]`)

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/auth/users` | SA,ST | list (`?page=&limit=&q=&role=&status=`) |
| GET | `/auth/users/search` | SA,ST | `?q=` |
| GET | `/auth/users/:id` | SA,ST | detail |
| POST | `/auth/users` | SA,ST | create |
| PUT | `/auth/users/:id` | SA,ST | update |
| PATCH | `/auth/users/:id/activate` | SA,ST | `{active}` |
| DELETE | `/auth/users/:id` | SA,ST | soft delete |
| **GET** | **`/auth/roles`** | **SA,ST** | **`[BARU]`** list role utk dropdown |
| **POST** | **`/auth/roles`** | **SA** | **`[BARU]`** create role |
| **PUT** | **`/auth/roles/:id`** | **SA** | **`[BARU]`** update role |
| **DELETE** | **`/auth/roles/:id`** | **SA** | **`[BARU]`** delete role |
| **POST** | **`/auth/users/import/xlsx`** | **SA,ST** | **`[BARU]`** import |
| **GET** | **`/auth/users/export/xlsx`** | **SA,ST** | **`[BARU]`** export |
| **POST** | **`/auth/users/bulk-delete`** | **SA,ST** | **`[BARU]`** |

---

## 5. UI/UX — Wireframe

### 5.1 Halaman Utama (`/admin/users`)
```
┌─ Manajemen Pengguna ────────────────────────────────────────────────┐
│ [Cari email/nama ______] [Role ▾] [Status ▾] [Import ▾][Export ▾] [+Tambah] │
├──────────────────────────────────────────────────────────────────────┤
│ ☐ │ Username │ Email             │ Nama Lengkap │ Role        │ Status │ Aksi  │
│ ☐ │ ahmad    │ ahmad@...         │ Ahmad Rizki  │ GURU        │ ✓ Aktif │ ✏️ 🗑 ▾ │
│ ☐ │ siti     │ siti@...          │ Siti Aminah  │ SISWA       │ ✓ Aktif │ ...   │
├────────────────────────────────────────────────────────────────────┤
│ ☑ 2 terpilih [Aktifkan] [Nonaktifkan] [Hapus]       [◀ 1/3 ▶]     │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 Dialog Form User (Create/Edit)
```
┌─ Tambah Pengguna ─────────────────────────────────────────────┐
│ [Tab 1: Identitas] [Tab 2: Akademik] [Tab 3: Akses]          │
├────────────────────────────────────────────────────────────────┤
│ Username *  [__________]    Email * [____________]             │
│ Password *  [__________]    Konfirmasi [__________]            │
│ Nama Lengkap * [____________]  Gender [Laki/Perempuan ▾]      │
│ Telepon [____________]  Avatar [Upload]                       │
├────────────────────────────────────────────────────────────────┤
│ [Tab 2: Akademik]                                              │
│ Jenjang ▾ [SD/SMP/SMA/SMK]  Kelas ▾ [1..12]  Sekolah ▾       │
│ Jurusan ▾  Status Keanggotaan [AKTIF/TIDAK/TRIAL]             │
├────────────────────────────────────────────────────────────────┤
│ [Tab 3: Akses]                                                 │
│ Role ▾ [SUPER_ADMIN|STAFF|FINANCE|GURU|SISWA|INVESTOR]        │
│ Status [AKTIF ▾]  [Simpan] [Batal]                            │
└────────────────────────────────────────────────────────────────┘
```

> **Catatan:** Tab Akademik hanya tampil bila role = SISWA / SUPER_SISWA.

---

## 3. Logic & Aturan Bisnis

1. **Create User** — body wajib: `username, email, password, full_name, role`.
   - Role **bukan** hardcode `SISWA`; diambil dari body (fix bug).
   - Password hash via bcrypt/argon2.
   - Default `status = 'PENDING'` (harus verifikasi email) atau `ACTIVE` bila admin.

2. **Update User** — `PUT /auth/users/:id` body: `{full_name?, role?, is_active?, grade_id?, school_id?, major_id?}`.
   - `role` → update `identity.user_role` (delete old, insert new primary).
   - `grade_id/school_id/major_id` → upsert `academic.student_enrollment`.

3. **Role Assignment** — hanya `SUPER_ADMIN` boleh assign `SUPER_ADMIN`.
   Validasi: tidak boleh assign role lebih tinggi dari role actor.

3. **Password** — hash bcrypt/argon2; change-password endpoint terpisah.

4. **Delete** — soft delete (`deleted_at`); blokir bila punya `student_enrollment` aktif / attempt ujian.

5. **Import/Export** — CSV/XLSX dengan kolom: `username,email,password,full_name,role,gender,phone,school_name,education_level,grade,major,membership_status`.

3. **Bulk Actions** — activate/deactivate/delete massal (checkbox + bulk bar).

---

## 4. API (Existing + `[BARU]`)

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/auth/users` | SA,ST | list (`?page=&limit=&q=&role=&status=`) |
| POST | `/auth/users` | SA,ST | create |
| GET | `/auth/users/:id` | SA,ST | detail |
| PUT | `/auth/users/:id` | SA,ST | update |
| PATCH | `/auth/users/:id/activate` | SA,ST | `{active}` |
| DELETE | `/auth/users/:id` | SA,ST | delete |
| **GET** | **`/auth/roles`** | **SA,ST** | **`[BARU]`** list role utk dropdown |
| **POST** | **`/auth/roles`** | **SA** | **`[BARU]`** create role |
| **PUT** | **`/auth/roles/:id`** | **SA** | **`[BARU]`** update role |
| **DELETE** | **`/auth/roles/:id`** | **SA** | **`[BARU]`** delete role |
| **POST** | **`/auth/users/import/xlsx`** | **SA,ST** | **`[BARU]`** import |
| **GET** | **`/auth/users/export/xlsx`** | **SA,ST** | **`[BARU]`** export |
| **POST** | **`/auth/users/bulk-delete`** | **SA,ST** | **`[BARU]`** |

---

## 4. UI/UX — Wireframe

### 5.1 Halaman Utama (`/admin/users`)
```
┌─ Manajemen Pengguna ────────────────────────────────────────────────┐
│ [Cari email/nama ______] [Role ▾] [Status ▾] [Import ▾][Export ▾] [+Tambah] │
├────────────────────────────────────────────────────────────────────┤
│ ☐ │ Username │ Email             │ Nama Lengkap │ Role        │ Status │ Aksi  │
│ ☐ │ ahmad    │ ahmad@...         │ Ahmad Rizki  │ GURU        │ ✓ Aktif │ ✏️ 🗑 ▾ │
│ ☐ │ siti     │ siti@...          │ Siti Aminah  │ SISWA       │ ✓ Aktif │ ...   │
├────────────────────────────────────────────────────────────────────┤
│ ☑ 2 terpilih [Aktifkan] [Nonaktifkan] [Hapus]       [◀ 1/3 ▶]     │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 Dialog Form User (Create/Edit)
```
┌─ Tambah Pengguna ─────────────────────────────────────────────────┐
│ [Tab 1: Identitas] [Tab 2: Akademik] [Tab 3: Akses]              │
├────────────────────────────────────────────────────────────────────┤
│ Username * [__________]    Email * [____________]                 │
│ Password * [__________]    Konfirmasi [__________]                │
│ Nama Lengkap * [____________]  Gender [Laki/Perempuan ▾]         │
│ Telepon [____________]  Avatar [Upload]                          │
├────────────────────────────────────────────────────────────────────┤
│ [Tab 2: Akademik] — tampil bila role SISWA/SUPER_SISWA           │
│ Jenjang ▾ [SD/SMP/SMA/SMK]  Kelas ▾ [1..12]  Sekolah ▾ [cari]   │
│ Jurusan ▾ [IPA/IPS/Bahasa/Kejujuran]  Status [AKTIF/TIDAK/TRIAL]│
├────────────────────────────────────────────────────────────────────┤
│ [Tab 3: Akses]                                                   │
│ Role ▾ [SUPER_ADMIN|STAFF|FINANCE|GURU|SISWA|INVESTOR]          │
│ Status [AKTIF ▾]                                                 │
│                                      [Batal]  [Simpan]           │
└──────────────────────────────────────────────────────────────────┘
```
> Tab Akademik hanya tampil bila `role ∈ {SISWA, SUPER_SISWA}`.

### 5.3 Import Wizard
```
Upload (.xlsx) → Preview (validasi per baris) → Submit → Report (created/skipped/failed)
```

---

## 6. Filter (lengkap)

| Filter | Sumber | Param |
|---|---|---|
| Search | username/email/nama | `q` |
| Role | enum | `role` |
| Status | enum | `status` |
| Jenjang | akademik | `education_level` |
| Mapel | akademik | `subject_id` |
| Kelas | akademik | `grade_id` |

---

## 7. Komponen yang Dipakai

- Primitives: `Button, Input, Textarea, Select, Dialog, AlertDialog, Card, Badge, Tabs, Skeleton, Switch, Checkbox, DropdownMenu, Pagination, Tooltip, Breadcrumb`.
- Komponen: `PageHeader`, `StatsCard`, `DataTable`, `ConfirmDialog`, `EmptyState`, `ImportResultCard`, `FilterBar`.
- Form: `react-hook-form` + `zodResolver`.

---

## 7. State & Error Handling

| State | UI |
|---|---|
| Loading | skeleton rows |
| Error | banner merah + Coba Lagi |
| Empty | EmptyState + "Buat Pengguna" |
| Import | ImportResultCard |
| Duplikat email/username | error inline di form |
| Hapus dgn enrollment aktif | AlertDialog peringatan |

---

## 9. Keselarasan Design System

Sama dengan dokumen lain: radius 12/16/20, primary Blue, accent Orange badge, hijau sukses, skeleton, empty state ilustrasi+CTA, Bahasa Indonesia, wizard stepper minimal.