# Wireframe — Halaman Siswa Konfigurasi (Settings / Profil)

> **File:** `docs/frontend/wireframes/09-siswa-konfigurasi.md`
> **Route:** `/settings` (AppShell, role `SISWA` / `SUPER_SISWA`).
> **Status:** Dokumen acuan pembuatan mockup & implementasi.
> **Tanggal:** 2026-08-09

Dokumen ini adalah wireframe + struktur halaman **Konfigurasi Siswa** — tempat siswa mengelola
**profil lengkap yang bisa diedit**: nama (username), sekolah, foto profil, kata sandi, **jenjang** &
**kelas** (opsional), dan **nomor HP** (opsional).

Diselaraskan dengan backend (`internal/auth`, `internal/academic`, `internal/media`), DB
(`identity.user`, `identity.user_profile`, `academic.education_level`, `academic.grade`,
`academic.student_enrollment`), dan API kontrak (`docs/frontend/API-contract-siswa.md`
§2/§3/§15.14). Bagian yang datanya belum ada / ter-hak-akses belum sesuai ditandai `[KONTRAK BARU]`.

---

## 1. Konteks & Tujuan

- Halaman ini adalah **"Pengaturan" siswa** — tujuan tombol dropdown topbar (`/settings`), pengganti
  halaman `/profile` lama yang masih ada (lihat `SIDEBAR.md`).
- **Profil lengkap (susunan):**
  1. **Nama / username** — nama tampilan (`full_name`; opsional tambah field `username` `[BARU]`).
  2. **Sekolah asal** — `school_name`.
  3. **Foto profil** — upload avatar (URL dari media).
  4. **Jenjang** (SD/SMP/SMA) & **Kelas** *(opsional)* — dari `academic.education_level` + `academic.grade`.
  5. **Nomor HP** *(opsional)* — `phone`.
  6. **Kata sandi** — ganti password (verifikasi password lama).
- Entry yang belum dapat diubah siswa pada backend saat ini (sekolah & grade di-strip untuk
  non-admin) → diangkat ke `[KONTRAK BARU]` agar siswa bisa meng-edit mandiri.

**UX:** akses langsung dari topbar (≤2 klik), form ringkas, validasi inline, konfirmasi tersimpan.

---

## 2. Struktur Halaman / Route Map

```text
/(siswa)  → AppShell
│
├── Sidebar — SISWA_NAV
│       ...
│       Target    → /targets
│       Membership → /membership
│       Konfigurasi ● → /settings   (active)
│
├── Topbar (72px) — search, dark mode, lonceng, avatar dropdown → [Profil, Konfigurasi, Keluar]
│
└── Main (max-w 1440px)
      ├── ✦ /settings            → Halaman Konfigurasi (profil + sandi + target + preferensi, satu halaman)
      └── /settings (sub-*)      → (opsional) jangan buat sub-rute; gunakan nav anchor / komponen
```

**Rute yang disepakati:**

| Rute | Fungsi |
|---|---|
| `/settings` | Satu halaman: kartu sidebar navigasi + Kartu **Profil & Keamanan** (form profil + upload foto) + **Ubah Kata Sandi** + **Target** (CTA `/targets`) + **Preferensi** (notifikasi) |

> Sub-rute tidak wajib. Bagian bisa di-anchorkan (`#profil`, `#keamanan`, `#preferensi`).
> `/profile` (rangkaian lama) masih ada di dropdown — boleh disinkron saat halaman ini selesai.

**Auth:** Bearer JWT via `src/lib/api.ts`. Read + tulis.

---

## 3. Wireframe ASCII — `/settings` (Konfigurasi)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [MAIN] max-w 1440 · p-4/6/8 · grid md:grid-cols-3                          │
│                                                                             │
│ ┌ SIDEBAR PROFILE (col 1) ───────────────────────────────────────────┐   │
│ │      [ 🟦 Avatar foto / upload / ganti ]                              │   │
│ │      👤 Budi Hartono                                                  │   │
│ │      budi@mail.com · SISWA                                            │   │
│ │      [✏️ Ubah Foto]  (upload → upload media → `avatar_url`)            │   │
│ │  Nav:  ● Profil & Keamanan                                            │   │
│ │        ○ Target                                                       │   │
│ │        ○ Preferensi                                                   │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌ KOLOM 2 (col-span-2) ─────────────────────────────────────────────────┐ │
│ │  ✦ PROFIL (id=profil)                                                  │ │
│ │  Nama Lengkap     [ input: Budi Santoso ]                              │ │
│ │  Email            [ budi@mail.com ]  (readonly)                        │ │
│ │  Asal Sekolah     [ input: SMA N 1 Jakarta ]                           │ │
│ │  Jenjang          [▾ SMA ▾ (dari /academic/levels)]                     │ │
│ │  Kelas (opsional) [▾ XII IPA ▾ (dari /academic/grades filter jenjang)] │ │
│ │  No. HP (ops)     [ input: 08123456789 ]                              │ │
│ │  [Simpan Perubahan]  ✅ Profil tersimpan                               │ │
│ │                                                                         │ │
│ │ ┌ UBAH KATA SANDI (id=keamanan) ───────────────────────────────────┐   │
│ │ │  Sandi Lama    [••••••••]                                          │   │
│ │ │  Sandi Baru    [••••••••]  (min 10, kombinasi …)                    │   │
│ │ │  [Perbarui Kata Sandi]                                             │   │
│ │ └────────────────────────────────────────────────────────────────────┘ │ │
│ │ ┌ TARGET (id=target) — status singkat + CTA "Kelola Target" → /targets│ │
│ │ ┌ PREFERENSI (id=preferensi) — toggle notifikasi on/off               │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

> **Alur profil:** semua field dari `GET /auth/me`; namun jenjang, `.grade`, dan `.school_name`
> diisi dari tabel akademik + enrollment. Submit via `PUT /auth/profile` (extend `[BARU]`).

---

## 3.1 Cutaway — Upload Foto Profil (dialog kecil)

```
┌ DIALOG (popup, glass, animation 200ms) ──────────────────────────────────┐
│  Ganti Foto Profil                        [✕]                            │
│                                                                          │
│  [   🟦 pratinjau foto   ]                                                │
│  [Drag & drop / klik pilih gambar (jpg, png, maks 2MB)]                   │
│                                                                          │
│  [Batal]                           [Upload & Simpan]                     │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Spesifikasi per-seksi

### 4.1 Profil Lengkap (field yang bisa diedit)

| Field | Backing (existing) | Catatan |
|---|---|---|
| **Nama / username** | `full_name` (wajib); `username` `[KONTRAK BARU]` bila ingin terpisah dari email | dijadikan username jika tidak ada field sendiri |
| **Asal Sekolah** | `school_name` (existing) — **saat ini di-strip untuk SISWA** | `[KONTRAK BARU]` izinkan siswa |
| **Foto profil** | `avatar_url` (existing) | upload `[KONTRAK BARU]` student–capable |
| **Jenjang** | `education_level` (existing read dari profil/enrollment) | `[KONTRAK BARU]` update siswa |
| **Kelas** *(opsional)* | `grade_id` (existing) | perlu keberadaan grade valid; kendali siswa `[KONTRAK BARU]` |
| **Nomor HP** *(opsional)* | `phone` (existing) | ≤ 20 karakter |
| **Kata sandi** | `POST /auth/change-password` (existing) | verifikasi `current_password` |

### 4.2 Validasi (server + client)

| Field | Aturan |
|---|---|
| Nama | non-empty; max 200 |
| Sekolah | string bebas (bukan harus dari daftar akademik) |
| Jenjang | harus salah satu `academic.education_level` |
| Kelas | harus `academic.grade` ber-jenjang sesuai |
| HP | numerik 10–13 digit (client) / ≤20 string (server) |
| Sandi | min 10 char, huruf besar/kecil, angka, simbol |

### 4.3 Ubah Kata Sandi

- Endpoint existing `POST /auth/change-password` body `{current_password, new_password}` (backend
  `ChangePasswordRequest`). **Frontend saat ini mengirim `old_password`** → sertakan koreksi
  (`align` ke kontrak) `[CATATAN]`.
- UX: field `Password lama`, `Password baru`, `Konfirmasi` • tombol `Perbarui`.
- Sukses → pesan hijau; salah-sandi lama → error merah `401`.

### 4.4 Preferensi & Target (secondary)

- **Target**: kartu ringkas (target aktif dari `GET /profile/targets`) + CTA `[Kelola Target → /targets]`.
- **Preferensi**: toggle notifikasi (client state; backend `PUT /notifications/preferences` opsional).

---

## 5. Mapping Data → API → DB (ringkasan)

| Isi | Endpoint | Tabel sumber |
|---|---|---|
| Data profil | `GET /auth/me` (existing) | `identity.user`, `identity.user_profile`, `academic.student_enrollment`, `academic.grade`, `academic.education_level`, `academic.school` |
| Simpan profil (nama,sekolah,jenjang,kelas,hp,foto) | `PUT /auth/profile` (extend) `[KONTRAK BARU]` | `identity.user`, `user_profile`, `academic.student_enrollment` |
| Ubah sandi | `POST /auth/change-password` (existing) | `identity.user` |
| Jenjang (picker) | `GET /academic/levels` (existing §4) | `academic.education_level` |
| Kelas (picker) | `GET /academic/grades?level_id=` (existing §5) | `academic.grade` |
| Upload foto | `POST /media/upload` (extend role SISWA) `[KONTRAK BARU]` | `media`, `identity.user_profile.avatar_url` |

> **Status terkini backend (`auth.go`):** `restrictGradeSchoolForRole` membersihkan `grade_id` &
> `school_name` untuk role non `SUPER_ADMIN/STAFF/GURU` → **siswa tidak bisa ubah** jenjang/sekolah
> lewat endpoint profil. Di-usul `[KONTRAK BARU]` agar siswa bisa (via enrollment). Fase lain: admin
> tetap mengelola melalui `/staff/users`.

---

## 6. Penanda / Asumsi

- **"Username"** disepakati = **nama tampilan**/`full_name`; bila ingin username unik terpisah dari
  email → field baru `username` `[KONTRAK BARU]` (migrasi + login tetap via email).
- **Jenjang/Kelas**: sumber utama dari `academic.student_enrollment`; bila siswa belum ter-enroll,
  tampilkan dropdown `pilih jenjang/kelas` dan simpan via `PUT /auth/profile` (extend).
- **Foto**: hanya URL string di profil; upload & CDN di belakang `[KONTRAK BARU]` / `media`.
- **Mobile**: sidebar profil jadi stack di atas; form full-bleed.
- Mockup presentasi: fallback ke `GET /auth/me` + data mockup foto default.

---

## 6. Daftar API Kontrak yang HARUS DIBUAT `[KONTRAK BARU]`

| # | Method | Endpoint | Role | Response (usulan) |
|---|---|---|---|---|
| 1 | PUT | `/auth/profile` (extend) | SISWA | terima `school_name`, `grade_id`, `education_level_id`, `phone`, `full_name`, `avatar_url`, `username?` — **hapus strip untuk SISWA** (buat enrollment otomatis jika beda kelas) |
| 2 | POST | `/media/upload` (extend) | SISWA | upload hanya untuk avatar (size/jenis dibatasi) → `{url}` |
| 3 | GET | `/academic/grades?level_id=` (existing, reuse §5) | SISWA | daftar kelas per jenjang (picker) |
| 4 | GET | `/academic/levels` (existing, reuse §4) | SISWA | daftar jenjang (picker) |
| 5 | POST | `/auth/change-password` (existing) | SISWA | pastikan body `{current_password, new_password}` (koreksi frontend yang saat ini `old_password`) |

> **Backend action nanti (setelah disetujui):** ubah `restrictGradeSchoolForRole` atau tambah
> perubahan field; tambah `education_level` key; check ownership. Update `openapi.yaml`.

---

## 7. Catatan Implementasi

- **Service:** perluas `auth.service.ts`: `useProfile()` (GET `/auth/me`), `useUpdateProfile()`
  (PUT `/auth/profile`), `useChangePassword()`, `useUploadAvatar()` (`POST /media/upload` siswa).
- **Type:** perluas `User` di `src/types/index.ts`: `education_level_id?`, `grade_name?`,
  `school_name?` (sudah ada), `phone` (sudah). Tambah `AvatarUploadResult`.
- **UI:** komponen `ProfileForm`, `AvatarUploadDialog`, `ChangePasswordForm`, `NotificationsToggle`.
- **Rules:** validasi server-side tetap ditegakkan; jangan kirim `grade_id`/`school_name` bila
  `restrictGradeSchoolForRole` masih aktif.
- **Label UI:** level (SD/SMP/SMA) → "Jenjang"; grade → "Kelas".
- **Rule #4 AGENTS:** izin edit siswa untuk `sekolah/jenjang/kelas` mesti disetujui user (backend
  saat ini menolak).

### Checklist Verifikasi
- [ ] GET `/auth/me` memuat nama, email, sekolah, jenjang, kelas, HP, avatar.
- [ ] Submit profil menyimpan & menampilkan "Tersimpan" (PUT `/auth/profile`).
- [ ] Upload foto → avatar berubah setelah upload (state).
- [ ] Ganti sandi (verifikasi lama) benar → sukses / error sesuai.
- [ ] Picker jenjang → kelas cascade (fetch grades by level).
- [ ] `npx tsc --noEmit` clean; lint clean.

---

## 8. Revisi

| Tanggal | Perubahan |
|---|---|
| 2026-08-09 | Wireframe Konfigurasi v1: `/settings` (profil lengkap editable: username, sekolah, foto, kata sandi, jenjang, kelas opsional, no HP opsional) + `PUT /auth/profile` extend `[KONTRAK BARU]` + upload avatar siswa + koreksi body `change-password` + catatan `restrictGradeSchoolForRole` saat ini memblokir sekolah/kelas siswa. |