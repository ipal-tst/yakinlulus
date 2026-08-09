# Admin Target Sekolah — Design Document

> **Tanggal:** 2026-08-10
> **Status:** Approved (menunggu review user)
> **Cakupan:** Halaman `/admin/schools` (2 tab: Daftar Sekolah + Target Sekolah) dengan filter
> jenjang & provinsi, CRUD target sekolah berbasis katalog sekolah, min/max nilai diterima.
> **Termasuk perubahan backend + 1 migration DB.**

## 1. Tujuan

Admin (SUPER_ADMIN) membutuhkan halaman untuk mengelola **target sekolah/PT** sebagai acuan
motivasi siswa (katalog sekolah tujuan). Sekarang target-schools dikelola via `/staff/schools`
tab "Target PTN" dengan nama free-text tanpa nilai min/max. Tujuan: halaman admin khusus di
`/admin/schools` dengan filter (jenjang, provinsi), nama sekolah yang **diambil dari katalog
Kelola Sekolah**, dan kolom **nilai tertinggi/terendah diterima**.

## 2. Keputusan Kunci (hasil brainstorming)

| Area | Keputusan |
|---|---|
| Backend | Diperluas: list join `academic.school` → province/city, filter `?level=&province=&q=`, POST/PUT terima `school_id`, resolve nama dari katalog |
| Sumber nama | Katalog sekolah utk SEMUA jenjang incl. UNIVERSITY (create-in-form) |
| Jenjang | Tambah kolom `education_level` di `academic.school` (enum SMP/SMA/UNIVERSITY) |
| Skor | `min_score` = terendah diterima (skor ≥ min = lolos), `max_score` = tertinggi; skala via `max_total_score` (SMP/SMA 400, UNIVERSITY 700) |
| Lokasi | Tab di halaman `/admin/schools` BARU (Daftar Sekolah + Target Sekolah) |
| Provinsi filter | Derivasi dari unik data katalog (`academic.school.province`) |
| University | Create-in-form (insert katalog dulu) + seed PT umum |
| Prosedur | Migration + backend = 1 batch; seeder jalan setelah approval DB |

## 3. Data Model (DB)

**Migration baru** — `academic.school` tambah kolom jenjang:

```sql
ALTER TABLE academic.school
  ADD COLUMN education_level varchar(20) NOT NULL DEFAULT 'SMA'
    CHECK (education_level IN ('SMP','SMA','UNIVERSITY'));
```

Alasan string enum (bukan FK `academic.education_level`): tabel itu berisi SD/SMP/SMA tanpa
UNIVERSITY; target butuh SMP/SMA/UNIVERSITY. Satu enum dipakai bersama
(identik dgn CHECK di `academic.target_school.level`).

Semantik skor (konsisten `profile.go ResolveStudentScore`):
- `min_score` (int) = nilai terendah diterima; syarat lolos = skor siswa ≥ min_score
- `max_score` (int) = nilai tertinggi diterima
- `max_total_score` (int) = skala penuh; frontend default SMP/SMA=400, UNIVERSITY=700 bila kolom 0

## 4. Backend API (`internal/target_schools/target_schools.go`)

DTO diperluas (resolve dari join `academic.school`):
```
TargetSchool += { school_id, province, city, education_level }
```

Routes (tidak berubah path/role; write = SUPER_ADMIN, STAFF; GET list = auth):

| Method | Path | Perubahan |
|---|---|---|
| GET | `/target-schools` | + join school → province/city/education_level; + filter `?level=` `?province=` `?q=` |
| GET | `/target-schools/:id` | + resolve join |
| POST | `/target-schools` | terima `school_id` (wajib); nama/wilayah resolve dari katalog; validasi level konsisten |
| PUT | `/target-schools/:id` | terima `school_id`; sama |
| DELETE | `/target-schools/:id` | tidak berubah (hard delete) |

Aturan:
- `school_id` wajib; validasi sekolah ada & `is_active`; level target harus sama dgn `education_level` sekolah → bila beda, `400`.
- `name` di-override dari katalog saat `school_id` diberikan (tidak percaya input nama bebas).
- Keamanan: parameterized query, validasi level enum server-side, tidak ada interpolasi SQL.

## 5. Frontend

### 5.1 File baru / modifikasi
```
frontend/src/app/(admin)/admin/schools/
├── page.tsx                    ◄── BARU: Tabs "Daftar Sekolah" + "Target Sekolah"
├── schools-tab.tsx             ◄── BARU: wrap SchoolTable existing
└── target-schools-tab.tsx      ◄── BARU: filter bar + tabel + dialog
frontend/src/components/admin/schools/
├── target-school-table.tsx     ◄── UPGRADE dari components/admin/target-schools/
├── target-school-form-dialog.tsx ◄── UPGRADE (pilih sekolah + min/max score)
└── school-select.tsx           ◄── BARU: dropdown search sekolah + tombol "+ Baru"
frontend/src/services/
├── school.service.ts           ◄── EXTEND: listProvinces()
└── target-school.service.ts    ◄── EXTEND: list({level,province,q})
frontend/src/lib/target-school-mappers.ts ◄── BARU (pure, testable)
```

### 5.2 Tabel Target Sekolah — kolom
| Kolom | Sumber |
|---|---|
| Nama Sekolah/PT | `name` + badge jenjang |
| Provinsi · Kota | `province`/`city` (join) |
| Nilai Terendah Diterima | `min_score` (skala max_total_score) |
| Nilai Tertinggi Diterima | `max_score` |
| Tahun Akademik | `academic_year` |
| Status / Aksi | is_active toggle, edit, hapus |

### 5.3 Form dialog (create/edit)
- Dropdown `school-select` (search katalog + `+ Baru` → modal/create-in-form insert ke `academic.school`, education_level sesuai mode)
- Input `min_score`, `max_score` (required, keduanya ≤ `max_total_score`, max ≥ min)
- `academic_year`, `subjects` (label chips)

### 5.4 Filter
- **Jenjang** (`?level=`) — Select SMP/SMA/UNIVERSITY
- **Provinsi** (`?province=`) — Select dari `listProvinces()` (dedup+sort dari katalog)
- Search (`?q=`) client-side di DataTable

## 6. Error & Edge Cases

- `school_id` invalid/nonaktif → 400 pesan jelas
- Level tak konsisten → 400 + pesan form
- Duplikat NPSN/nama saat create-in-form → pesan inline di dialog
- Filter kosong → empty state dengan CTA
- `max_score < min_score` → validasi form & server
- Loading = skeleton (bukan spinner); error = banner + "Coba Lagi"

## 7. Testing

Frontend (Vitest, env node, `.test.ts`):
- `target-school.service.test.ts` — `list({level,province,q})` kirim query params
- `school.service.test.ts` — `listProvinces()` dedup + sort
- `lib/target-school-mappers.test.ts` — `dumpTargetRow`, `formatScoreRange` (→ "320–380 / 400"), `sortedProvinces`

Backend: `go test ./internal/target_schools/...` — join list, filter, validasi level (pola `subscription_repository_test.go`).

## 8. Scope (non-goals)

- Tidak mengubah modul siswa `/profile/targets` / `identity.student_target`
- Tidak menyentuh `internal/school` legacy write-path bug (flag terpisah)
- Tidak merombak `/staff/schools` (komponen di-share; admin pakai page baru)

## 9. Prosedur Eksekusi

1. Migration (`academic.school.education_level`) + kode backend → 1 commit
2. `go build ./...` + `go vet ./...` + `go test ./internal/target_schools/...`
3. Seeder PT umum → approval DB dulu, lalu jalankan
4. Frontend TDD per komponen (`target-school-mappers` → service → komponen → halaman)
5. `npx tsc --noEmit` + `npm run lint` (file baru) + `npm test`