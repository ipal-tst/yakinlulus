# Backend API Contract — Admin & Backoffice

> **Status:** v1.0 — Draft (greenfield; menyatukan endpoint eksisting + rencana baru)
> **Dasar:** `backend/list` (RegisterRoutes) + `docs/frontend/API-contract.md` + desain
> `docs/admin-design/00-01-02-03-*.md`.

Dokumen ini adalah **kontrak API utk seluruh area admin** (SUPER_ADMIN, STAFF, FINANCE, INVESTOR,
GURU). Basis `/api/v1`. Auth = Bearer JWT dari `POST /api/v1/auth/login`.

> **Tanda `[BARU]`** = endpoint yang belum ada di kode, diusulkan oleh desain grup Master Akademik.

---

## Konvensi

- Response: `{ "success": true, "data": <payload>, "message": "..." }`
- Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`
- Pagination (bila ada): `page` (1-based), `limit` (default 20).
- `:id` = uuid. `{ }` = object.

## Role Codes

`SUPER_ADMIN (SA)`, `STAFF (ST)`, `FINANCE (FI)`, `GURU (GU)`, `INVESTOR (IN)`, `SISWA (SW)`.
Siswa hanya `GET` pada area publik; area admin ditulis oleh SA/ST (konten juga oleh GU).

---

## 1. Autentikasi & Pengguna

| Method | Path | Role | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/login` | publik | `{email,password}` | token+user |
| POST | `/auth/refresh` | any | `{refresh_token}` | token |
| GET | `/auth/me` | any | - | current user |
| PUT | `/auth/profile` | any | `{full_name?,gender?,phone?,avatar_url?}` | user |
| POST | `/auth/change-password` | any | `{old_password,new_password}` | ack |
| GET | `/auth/users` | SA, ST | `?page=&limit=&q=&role=&status=` | `{items,total,page,limit}` |
| GET | `/auth/users/search` | SA, ST | `?q=` | match users |
| GET | `/auth/users/:id` | SA, ST | - | user |
| POST | `/auth/users` | SA, ST | `{email,password,full_name,role,phone?,school_name?,grade_id?}` | user |
| PUT | `/auth/users/:id` | SA, ST | `{full_name?,role?,phone?,school_name?,grade_id?}` | user |
| PATCH | `/auth/users/:id/activate` | SA, ST | `{active}` | user |
| DELETE | `/auth/users/:id` | SA, ST | - | ack |
| GET | `/auth/roles` | SA, ST | - | `[{code,name}]` |

> **Catatan implementasi:** `POST /auth/users` & `PUT /auth/users/:id` wajib menerapkan `req.role`,
> simpan `school_name`/`grade_id` (saat ini di-abaikan backend — perlu fix).
> `GET /auth/roles` — **[BARU]** sumber dropdown role.

---

## 2. Master Akademik

### 2.1 Jenjang / Kelas / Mapel / Kurikulum / Program

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/academic/levels` | any | list jenjang |
| POST/PUT/DELETE | `/academic/levels[/:id]` | SA,ST | CRUD |
| GET | `/academic/grades` | any | list kelas (`?level_id=`) |
| POST/PUT/DELETE | `/academic/grades[/:id]` | SA,ST | CRUD |
| GET | `/academic/subjects` | any | list mapel (`?level_id=&grade_id=`) |
| POST/PUT/DELETE | `/academic/subjects[/:id]` | SA,ST | CRUD mapel |
| GET | `/academic/chapters`, `/subjects/:id/chapters` | any | list bab |
| POST/PUT/DELETE | `/academic/chapters[/:id]` | SA,ST | CRUD bab |
| GET | `/academic/topics`, `/learning-outcomes` | any | list topik/CP |
| POST/PUT/DELETE | `/academic/topics[/:id]`, `/learning-outcomes[/:id]` | SA,ST | CRUD |
| GET | `/academic/curriculums`, `/programs` | any | list |
| POST/PUT/DELETE | `/academic/curriculums[/:id]`, `/programs[/:id]` | SA,ST | CRUD |

### 2.2 Import / Export / Bulk

| Method | Path | Role | Body | Fungsi |
|---|---|---|---|---|
| POST | `/academic/import/xlsx` | SA,ST | multipart `file` + `?kind=` | import per entitas |
| GET | `/academic/import/template` | SA,ST | `?kind=` | download template xlsx |
| POST | `/academic/export/xlsx` | SA,ST | `{kind, filters?, ids?}` | **`[BARU]`** export xlsx |
| GET | `/academic/export/xlsx` | SA,ST | `?kind=&filters=...` | **`[BARU]`** via query |
| POST | `/academic/bulk-delete` | SA,ST | `{kind, ids[]}` | **`[BARU]`** hapus massal |
| POST | `/academic/bulk-status` | SA,ST | `{kind, ids[], is_active}` | **`[BARU]`** nonaktif/aktif massal |

Import response: `{ job_id, created, skipped, failed, errors: [{row,message}] }`.

---

## 3. Sekolah (Kelola Sekolah)

### 3.1 Identitas Sekolah

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/schools` | SA,ST | list filter `?q=&type=&level=&province=&page=&limit=` |
| POST | `/schools` | SA,ST | create |
| GET | `/schools/:id` | any | detail |
| PUT | `/schools/:id` | SA,ST | update identitas |
| PATCH | `/schools/:id/status` | SA,ST | aktif/nonaktif |
| DELETE | `/schools/:id` | SA,ST | soft delete (blok bila ada siswa/score) |
| GET/PUT | `/schools/:id/settings` | any / SA,ST | settings |
| GET/PUT | `/schools/:id/branding` | any / SA,ST | branding |

School payload (diperluas) `[BARU]`:
```json
{
  "school_name": "...", "npsn": "20100001",
  "institution_type": "SEKOLAH|PT",
  "education_level": "SD|SMP|SMA|SMK|UNIVERSITY",
  "school_status": "NEGERI|SWASTA", "yayasan_name": "...",
  "province": "...", "city": "...", "district": "...", "village": "...",
  "address": "...", "postal_code": "...",
  "phone": "...", "email": "...", "website": "...",
  "curriculum_code": "...", "is_active": true
}
```

### 3.2 Data Siswa & Akademik per Tahun `[BARU]`

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/school-demographics` | SA,ST | list `?school_id=&academic_year=` |
| GET | `/school-demographics/:id` | SA,ST | detail |
| POST | `/school-demographics` | SA,ST | create/upsert `(school_id,academic_year)` |
| PUT | `/school-demographics/:id` | SA,ST | update |
| DELETE | `/school-demographics/:id` | SA,ST | delete |

Payload:
```json
{
  "school_id": "uuid", "academic_year": "2025/2026",
  "total_students": 348, "total_rombel": 12,
  "grade_breakdown": { "10": 120, "11": 118, "12": 110 }
}
```

### 3.3 Import / Export / Bulk

| Method | Path | Role | Fungsi |
|---|---|---|---|
| POST | `/schools/import/xlsx` | SA,ST | import (identitas + demo) |
| GET | `/schools/import/template` | SA,ST | template |
| POST | `/schools/export/xlsx` | SA,ST | **`[BARU]`** export |
| POST | `/schools/bulk-delete` | SA,ST | **`[BARU]`** |
| POST | `/schools/bulk-status` | SA,ST | **`[BARU]`** |

---

## 4. Target Sekolah (Nilai Penerimaan)

### 4.1 Payung (entitas target)

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/target-schools` | any | list (`?level=&province=&q=`) |
| GET | `/target-schools/:id` | SA,ST | detail |
| POST | `/target-schools` | SA,ST | create (school_id wajib; nama/region dari katalog) |
| PUT | `/target-schools/:id` | SA,ST | update |
| DELETE | `/target-schools/:id` | SA,ST | hapus payung (cascade values) |

### 4.2 Nilai per Tahun `[BARU]`

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/target-school-scores` | SA,ST | list `?target_school_id=&academic_year=&page=&limit=` |
| GET | `/target-school-scores/:id` | SA,ST | detail |
| POST | `/target-school-scores` | SA,ST | upsert `(target_school_id,academic_year)` |
| PUT | `/target-school-scores/:id` | SA,ST | update |
| DELETE | `/target-school-scores/:id` | SA,ST | delete baris nilai |
| GET | `/target-school-scores/trend/:id` | SA,ST | **`[BARU]`** tren semua tahun `{items:[{year,min,max,delta_min,delta_max}]}` |
| POST | `/target-school-scores/import/xlsx` | SA,ST | **`[BARU]`** import |
| GET | `/target-school-scores/import/template` | SA,ST | **`[BARU]`** template |
| POST | `/target-school-scores/export/xlsx` | SA,ST | **`[BARU]`** export |
| POST | `/target-school-scores/bulk-delete` | SA,ST | **`[BARU]`** |

Payload nilai:
```json
{
  "target_school_id": "uuid", "academic_year": "2025/2026",
  "min_score": 340, "max_score": 380, "max_total_score": 400
}
```
Rule: `0 ≤ min ≤ max ≤ max_total`; skala default 400 (SMP/SMA) / 700 (PT).

---

## 5. Konten & Ujian

### 5.1 Bank Soal

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/questions` | any | list `?subject_id=&grade_id=&chapter_id=&topic_id=&difficulty=&type=&status=&is_hots=&blooms_level=&created_by=&q=&page=&limit=` |
| POST | `/questions` | SA,ST,GU | create |
| GET | `/questions/:id` | any | detail |
| PUT | `/questions/:id` | SA,ST,GU | update (version bump) |
| DELETE | `/questions/:id` | SA,ST,GU | delete |
| POST | `/questions/:id/publish` `/archive` `/restore` `/unpublish` `/clone` | SA,ST,GU | state |
| GET | `/questions/:id/revisions` | any | riwayat revisi |
| POST | `/questions/check-duplicates` | SA,ST,GU | cek duplikat |
| POST | `/questions/bulk-publish` `/bulk-status` `/bulk-update` `/bulk-delete` | SA,ST,GU | bulk |
| GET | `/questions/export` | SA,ST,GU | CSV |
| GET | `/questions/export/xlsx` | SA,ST,GU | **`[BARU]`** XLSX sesuai filter |
| POST | `/questions/import` `/import/xlsx` | SA,ST,GU | import |
| GET | `/questions/import/template` | SA,ST,GU | template |

### 5.2 Materi

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/materials` | any | list, filter (subject/grade/bab/topik/kategori/status/media) |
| POST | `/materials` | SA,ST,GU | create (dengan blok terstruktur + junction) |
| GET | `/materials/:id` | any | detail (materi + blok + metadata + attachments) |
| PUT | `/materials/:id` | SA,ST,GU | update (full blok replace) |
| DELETE | `/materials/:id` | SA,ST,GU | soft delete |
| PATCH | `/materials/:id/publish` `/archive` | SA,ST,GU | state change |
| GET | `/materials/:id/blocks` | any | **`[BARU]`** list blok versi aktif |
| POST | `/materials/:id/blocks` | SA,ST,GU | **`[BARU]`** simpan blok |
| PUT | `/materials/:id/blocks/:blockId` | SA,ST,GU | **`[BARU]`** update blok |
| DELETE | `/materials/:id/blocks/:blockId` | SA,ST,GU | **`[BARU]`** hapus blok |
| GET | `/materials/:id/revisions` | any | **`[BARU]`** riwayat versi |
| POST | `/materials/import/xlsx` | SA,ST,GU | import |
| GET | `/materials/import/template` | SA,ST,GU | template |
| POST | `/materials/export/xlsx` | SA,ST,GU | **`[BARU]`** export |
| POST | `/materials/bulk-delete` | SA,ST,GU | **`[BARU]`** |
| POST | `/materials/bulk-publish` | SA,ST,GU | **`[BARU]`** |
| POST | `/media/upload` | SA,ST,GU | upload aset |
| GET | `/media/entity/:type/:id` | any | list media per entity |

### 5.3 Ujian & Paket

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET/POST | `/exams` | any / SA,ST,GU | list/create |
| GET/PUT/DELETE | `/exams/:id` | any / SA,ST,GU | detail/update/delete |
| GET/POST | `/exams/:id/blueprint` | any / SA,ST,GU | blueprint |
| GET/POST | `/exams/:id/subject-blueprints` | any / SA,ST,GU | per-mapel |
| GET/POST/DELETE | `/exams/:id/participants` | any / SA,ST,GU | peserta |
| GET | `/exams/:id/analytics` | any | analitik ujian |
| POST | `/exams/:id/schedule` | SA,ST,GU | **`[BARU]`** set jadwal start/end/tz |
| POST | `/exams/:id/clone` | SA,ST,GU | **`[BARU]`** duplikasi ujian |
| POST | `/exams/import/xlsx` | SA,ST,GU | **`[BARU]`** import xlsx (info+subtes+jadwal) |
| GET | `/exams/import/template` | SA,ST,GU | **`[BARU]`** template |
| POST | `/exams/export/xlsx` | SA,ST,GU | **`[BARU]`** export |
| POST | `/exams/bulk-delete` | SA,ST,GU | **`[BARU]`** |
| POST | `/exams/bulk-status` | SA,ST,GU | **`[BARU]`** terbitkan/arsip massal |
| GET/POST/PUT/DELETE | `/exam-packages[...]` | SA,ST,GU | paket ujian |

---

## 6. Media `[BARU menu, endpoint existing]`

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/media` | SA,ST,GU | list galeri |
| POST | `/media/upload` | SA,ST,GU | upload |
| GET | `/media/:id` | any | detail |
| DELETE | `/media/:id` | SA,ST,GU | delete |

---

## 7. Analitik

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/analytics/admin/overview` | SA,ST | ringkasan admin |
| GET | `/analytics/admin/reports/exams` | SA,ST | rekap ujian |
| GET | `/analytics/admin/reports/exams/:id` | SA,ST | detail rekap |
| GET | `/analytics/school/stats` | SA | statistik per sekolah |
| GET | `/analytics/students/:id` | SA,ST,GU | analitik siswa |
| GET | `/analytics/students/:id/timeline` | SA,ST,GU | timeline siswa |
| GET | `/analytics/exams/:id/difficulty` | SA,ST,GU | distribusi tingkat |

---

## 8. Keuangan (Finance)

| Method | Path | Role | Fungsi |
|---|---|---|---|
| GET | `/subscriptions/stats` | SA,ST,FI,IN | `{mrr,active_subs,total_plans}` |
| GET/POST | `/subscriptions/plans` | SA,ST,FI | CRUD paket |
| PUT/DELETE | `/subscriptions/plans/:id` | SA,ST,FI | |
| GET | `/subscriptions/users` | SA,ST,FI,IN | daftar pelanggan |
| GET | `/finance/transactions` | SA,ST,FI | paginated transaksi |
| GET | `/finance/payouts` | SA,ST,FI | daftar payout `?status=` |
| POST | `/finance/payouts/:id/approve` | SA,ST,FI | approve `PENDING→PAID` |

> **Gap untuk halaman finance lengkap (plans/subscribers/payments/reports):** perlu endpoint
> payment/invoice/wallet/refund (tabel DB ada, route nol) — yg akan dikembangkan terpisah.
> `GET /membership/*` (dipakai frontend siswa) saat ini **404** — harus dibuat.

---

## 9. Notifikasi, Audit, Monitoring, AI, CMS

### Notifikasi
| Method | Path | Role |
|---|---|---|
| POST | `/notifications/send`, `/broadcast` | SA,ST |
| GET | `/notifications/` | any |
| GET/POST/PUT/DELETE | `/notifications/templates[...]` | SA,ST |

### Audit
| Method | Path | Role |
|---|---|---|
| GET | `/audit-logs`, `/audit-logs/stats` | SA,ST |

### Monitoring
| Method | Path | Role |
|---|---|---|
| GET | `/health` | publik |
| GET | `/admin/health`, `/admin/logs` | SA |
| GET | `/config/student-dashboard` / `PUT` | any / SA,ST **`[BARU untuk PUT]`** |
| GET/PUT | `/ai/config`, `POST /ai/test-connection` | SA,ST |

### CMS
| Method | Path | Role |
|---|---|---|
| GET | `/cms/pages|posts|categories|tags|settings|faqs|banners|news` | any (slug publik) |
| POST/PUT/DELETE | `/cms/*[...]` | SA,ST,GU (owner) |

---

## 10. Dashboard

| Method | Path | Role |
|---|---|---|
| GET | `/dashboard/admin` | SA |
| GET | `/dashboard/teacher` | GU,ST |
| GET | `/dashboard/student` | SW |

---

## Lampiran A — Renvoi dengan Dokumen `docs/admin-design/*`

| Fitur Desain | Endpoint Kunci | Dokumen |
|---|---|---|
| Master Akademik CRUD+bulk+import/export | §2 | `01-master-akademik.md` |
| Kelola Sekolah (identitas+demografi) | §3 | `02-kelola-sekolah.md` |
| Target Sekolah (nilai per tahun+tren) | §4 | `03-target-sekolah.md` |
| Migration & enum | `00-ringkasan-backend-migration.md` | |

## Lampiran B — Checklist Sinkron

- [ ] Re-sync `api_list.md` & `openapi.yaml` dengan kode (banyak endpoint tercatat tidak ada).
- [ ] Fix `POST /auth/users` agar menerapkan `req.role` + simpan school_name/grade_id.
- [ ] Tambah `GET /auth/roles`.
- [ ] Implementasi `[BARU]` di §2.2, §3.2, §3.3, §4.2.
- [ ] Buat endpoint `GET /membership/*` (frontend siswa 404).