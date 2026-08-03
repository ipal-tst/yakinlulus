# Desain: Edit Data Diri Lengkap Siswa

Tanggal: 2026-08-03
Status: Approved (brainstorming)

## Ringkasan

Perluas halaman profil siswa (dan endpoint `PUT /auth/profile`) agar siswa bisa mengedit data diri lengkap: nama, jenis kelamin, kelas (grade), No HP, sekolah, foto profil, dan jurusan khusus siswa SMA/SMK.

## Latar Belakang

Halaman profil siswa saat ini hanya mengizinkan edit `full_name`, `school_name`, dan `avatar_url` melalui `EditProfileDialog`. Tabel `users` sudah memiliki `grade_id` (FK ke `grades`) dan `school_name`, tetapi belum punya kolom untuk jenis kelamin, No HP, dan jurusan. Fitur ini melengkapi data diri siswa agar informasi lebih lengkap (dan dibutuhkan untuk peringkat nilai serta target PTN).

## Ruang Lingkup

### Field yang bisa diedit siswa (dari halaman profil)

| Field | Sumber | Wajib | Keterangan |
|---|---|---|---|
| Nama Lengkap | `full_name` | Ya | Sudah ada |
| Sekolah | `school_name` | Opsional | Sudah ada |
| Foto Profil | `avatar_url` | Opsional | Sudah ada |
| No HP | `phone` (baru) | Opsional | Maks 20 char |
| Jenis Kelamin | `gender` (baru) | Opsional | `L` / `P` |
| Kelas | `grade_id` | Opsional | Dropdown dari tabel `grades` |
| Jurusan | `major` (baru) | Opsional | `IPA` / `IPS` / `BAHASA` / `OLAHRAGA`; hanya relevan untuk grade SMA/SMK |

### Di luar lingkup

- Tidak ada kolom tanggal lahir / umur (diganti No HP per keputusan).
- Tidak ada validasi format No HP yang ketat (hanya panjang maksimum).
- Tidak mengubah halaman profil admin.
- Tidak menambah kolom pada `student_targets`.

## Arsitektur

Pendekatan: **A — perluas endpoint `PUT /auth/profile` yang sudah ada** (bukan modul baru, bukan tabel terpisah). Konsisten dengan pola existing (`UpdateProfile` dynamic SET dan kolom `school_name` di `users`).

### Backend (internal/auth/auth.go)

**`UpdateProfileRequest` diperluas:**
```go
type UpdateProfileRequest struct {
    FullName   *string `json:"full_name,omitempty"`
    AvatarURL  *string `json:"avatar_url,omitempty"`
    SchoolName *string `json:"school_name,omitempty"`
    Gender     *string `json:"gender,omitempty"`
    Phone      *string `json:"phone,omitempty"`
    Major      *string `json:"major,omitempty"`
    GradeID    *string `json:"grade_id,omitempty"` // UUID string
}
```

**`UpdateProfile` repo (dynamic SET, pola existing):** tambahkan `gender`, `phone`, `major` ke query dinamis. Untuk `grade_id`: validasi UUID dan konversi ke `uuid.UUID` sebelum diset.

**Validasi di Service (`UpdateProfile` handler):**
- `gender` bila diisi harus `L` atau `P`.
- `major` bila diisi harus `IPA`, `IPS`, `BAHASA`, atau `OLAHRAGA`.
- `phone` maksimum 20 karakter.
- `grade_id` bila diisi harus UUID valid dan merujuk ke baris `grades` yang ada (cek via query exists).
- Nilai kosong string (`""`) untuk field opsional diperlakukan sebagai "hapus" → diset `NULL`.
- Email tidak bisa diubah dari endpoint ini.

**`User` struct + `FindByEmail`/`FindByID`:** tambah field `Gender`, `Phone`, `Major` ke struct dan SELECT/Scan. `GET /auth/me` otomatis ikut berubah karena memakai `FindByID`.

### Database (migration 043_student_profile_fields.up.sql)

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('L','P'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS major VARCHAR(30) CHECK (major IN ('IPA','IPS','BAHASA','OLAHRAGA'));
```

- Semua kolom nullable.
- `.down.sql` menghapus ketiga kolom (dan constraint terkait).

### Frontend

**`AuthProvider` `User` interface:** tambah `gender?`, `phone?`, `major?`, `grade_id?`.

**`EditProfileDialog`** (`frontend/app/(portal)/student/profile/page.tsx`) diperluas:
- Nama Lengkap (input)
- No HP (input, opsional)
- Jenis Kelamin (dropdown: `L` / `P` / kosong)
- Kelas (dropdown dari `/grades` API; opsional)
- Jurusan (dropdown: `IPA` / `IPS` / `BAHASA` / `OLAHRAGA`) — **hanya tampil saat grade terpilih termasuk SMA atau SMK**
- Sekolah (input, opsional)
- Foto Profil URL (input, opsional)
- Email (disabled)

**Data identitas di card utama profil:** tampilkan nilai `gender`, `phone`, `major`, dan kelas (label grade) di kartu identitas, bukan hanya di dialog.

**Dropdown grade:** gunakan hook `useGrades` (sudah ada di `frontend/lib/api.ts`, query `['academic', 'grades']` → `GET /academic/grades`). Response grade berisi `id`, `name`, `education_level_id`, dan `code` (hasil join `education_levels`). Pilihan menampilkan `name`; nilai yang disimpan adalah `grade_id` UUID. Untuk menentukan "apakah SMA/SMK", cek `code` grade terpilih ∈ `{SMA, SMK}` (kode level dari join yang sudah tersedia di response).

**Hook `useUpdateProfile`:** perpanjang type payload di `frontend/lib/api.ts` agar menerima field baru.

## Alur Data

1. Siswa membuka halaman profil → `GET /auth/me` mengembalikan `full_name`, `school_name`, `avatar_url`, `gender`, `phone`, `major`, `grade_id`.
2. Siswa klik Pengaturan → dialog edit menampilkan nilai saat ini.
3. Siswa ubah field (jurusan muncul hanya jika grade SMA/SMK).
4. Submit → `PUT /auth/profile` dengan field yang berubah.
5. Backend validasi → `UPDATE users` → response `user` terbaru.
6. Frontend `refetch()` → UI menampilkan data baru.

## Penanganan Error

- `gender`/`major` invalid → 400 dengan pesan jelas.
- `grade_id` tidak valid / tidak ada → 400.
- `phone` > 20 char → 400.
- Failure umum → pesan "Gagal menyimpan profil" (pola existing).

## Testing

- **Backend unit test** (`internal/auth`): validasi `gender`/`major` invalid → 400; `phone` terlalu panjang → 400; `grade_id` UUID valid diterima.
- **Verifikasi:** `go build ./...`, `go vet ./...`, `go test ./...`.
- **Frontend:** `npx tsc --noEmit`, `npm test` (36 existing tetap lulus), `npm run build`.
- **Smoke test live** (manual, sama pola sesi sebelumnya): login murid, update profil via API, verifikasi `/auth/me` mengembalikan field baru, cleanup.

## Keputusan yang Sudah Diambil

- Umur dihapus dari scope → diganti No HP.
- Jenis kelamin hanya `L`/`P`.
- Jurusan disimpan sebagai kolom `major` di `users`, dropdown hanya muncul untuk grade SMA/SMK.
- Semua field baru opsional (nullable) — tidak menghambat akses siswa.
