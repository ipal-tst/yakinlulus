# Implementation Status — 9 Halaman Siswa (Wireframes 01–09)

> **File:** `docs/frontend/IMPLEMENTASI-SISWA.md`
> **Tanggal:** 2026-08-10
> **Status:** DONE — semua 9 halaman siswa diimplementasikan sesuai wireframe, `tsc --noEmit` clean, `next build` sukses (58 route).

Dokumen ini memetakan setiap wireframe `docs/frontend/wireframes/01–09` ke route + file halaman,
service + endpoint yang dipakai, dan status endpoint (ACTIVE vs `[KONTRAK BARU]` DRAFT).

---

## Ringkasan Route → Wireframe → File

| Route | Wireframe | File halaman | Status |
|---|---|---|---|
| `/siswa` | 01 dashboard | `src/app/(siswa)/siswa/page.tsx` | DONE |
| `/materials` | 02 belajar | `materials/page.tsx`, `materials/[subjectId]/page.tsx`, `materials/[subjectId]/[chapterId]/page.tsx` | DONE (sudah ADA, diperiksa) |
| `/practice` | 03 latihan | `practice/page.tsx` (katalog hierarki) | DONE |
| `/practice/[sessionId]` | 03 | `practice/[sessionId]/page.tsx` (runner) | DONE (baru) |
| `/practice/[sessionId]/review` | 03 | `practice/[sessionId]/review/page.tsx` | DONE |
| `/exams` | 04 ujian | `exams/page.tsx` (katalog paket + summary) | DONE |
| `/exams/[id]` | 04 | `exams/[id]/page.tsx` (detail paket) | DONE |
| `/exams/[id]/instructions` | 04 | `exams/[id]/instructions/page.tsx` (petunjuk; Setuju → start → runner) | DONE (baru) |
| `/exams/[id]/cbt` | 04 | `exams/[id]/cbt/page.tsx` (runner CBT) | DONE |
| `/exams/[id]/cbt/review` | 04 | `exams/[id]/cbt/review/page.tsx` (hasil + pembahasan) | DONE |
| `/exams/[id]/result` | 04 | `exams/[id]/result/page.tsx` | DONE |
| `/results` | 05 hasil | `results/page.tsx` (analitik + riwayat) | DONE |
| `/results/[id]` | 05 | `results/[id]/page.tsx` | DONE |
| `/ranking` | 06 peringkat | `ranking/page.tsx` | DONE |
| `/targets` | 07 target | `targets/page.tsx` | DONE |
| `/membership` | 08 membership | `membership/page.tsx` | DONE |
| `/settings` | 09 konfigurasi | `settings/page.tsx` | DONE |

> Route group `(siswa)` dipakai untuk semua di atas (URL bersih tanpa `(siswa)`).

---

## Komponen bersama baru (`src/components/siswa/`)

| Komponen | Dipakai oleh | Keterangan |
|---|---|---|
| `EmptyState.tsx` | semua halaman | Ilustrasi sederhana + CTA (syarat design.md) |
| `SectionHeader.tsx` | semua halaman | Judul seksi + link aksi ("Lihat semua →") |
| `ProgressRing.tsx` | dashboard (goal hari ini), practice review | Ring % berbasis SVG, token CSS var |
| `MasteryBadge.tsx` | dashboard, results | badge MASTERED/GUARD/WEAK |
| `ThreatBadge.tsx` | dashboard target, targets | badge verdict (SAFE/NEAR/CRITICAL/BELOW/PENDING/PASSED) |
| `TargetChanceCard.tsx` | dashboard | kartu target BESAR + badge % diterima per band |
| `WeeklyExamCard.tsx` | dashboard | banner tryout mingguan (Header) |
| `SubjectMasteryChart.tsx` | dashboard | BarChart kuat/lemah per mapel (Recharts) |
| `SubjectStrengthCard.tsx` | dashboard | daftar Kuat ✅ / Lemah ❌ |
| `SubjectProgressGrid.tsx` | dashboard | progress berbasis soal `{benar}/{target}` |
| `WeeklyActivityChart.tsx` | dashboard | BarChart aktivitas 7 hari (Recharts) |

---

## Endpoint yang dipakai per halaman

> Base `http://localhost:8080/api/v1`, auth Bearer via `src/lib/api.ts`. Status sama seperti
> `docs/frontend/API-contract-siswa.md`: hash `[KONTRAK BARU]` = DRAFT (belum ada di backend) —
> halaman **degrade graciously** (empty state/placeholder) bila 404, tidak pernah memakai data palsu.

### `/siswa` — ACTIVE + [KONTRAK BARU]
- ACTIVE: `GET /dashboard/student` (greeting, today_goal, exam_stats, upcoming_exams, recent_activity, weekly_activity, continue_learning, learning_progress).
- `[KONTRAK BARU]`: `GET /dashboard/student/target`, `/subject-mastery`, `/subject-progress`, `/weekly-exam`, `/streak`, `GET /config/student-dashboard` (threshold/full config). Fetch paralel `Promise.allSettled` + skeleton.

### `/practice*` — [KONTRAK BARU §15.8] (ACTIVE prefix lama `/practice/sessions` ikut dipakai utk riwayat)
- `GET /practice/catalog` → hierarki mapel/bab/topik + status GREEN/AMBER/GREY (threshold dari `config.threshold`, default 85).
- `POST /practice/start` `{level, subject_id?, chapter_id?, topic_id?}` → `{session_id}`.
- `GET /practice/sessions/{id}` → soal; `POST /practice/sessions/{id}/submit` → hasil; `GET /practice/sessions/{id}/result` + `/review` → pembahasan.
- `GET /practice/sessions?page=&limit=` (riwayat, strip), `GET /practice/stats`.

### `/exams*`
- Alur wireframe 04: Detail `/exams/{id}` → Petunjuk `/exams/{id}/instructions` (Setuju → `POST /cbt/{exam_id}/start` → redirect `?session_id=`) → Runner `/exams/{id}/cbt` → `/exams/{id}/result` + `/exams/{id}/cbt/review`.
- ACTIVE: `POST /cbt/{exam_id}/start`, `GET /cbt/{session_id}/questions`, `POST /cbt/{session_id}/sync`, `POST /cbt/{session_id}/finish` → Result, `GET /cbt/{session_id}/review` (semua runner/hasil/pembahasan).
- `[KONTRAK BARU] §15.9`: `GET /exam-packages` (extended meta: attempts, subjects_count, duration, last_score), `GET /exams/summary`, `GET /exam-packages/{id}` (detail + `package_mode` SINGLE/PER_SUBTEST). DRAFT → fallback `getExamById`/empty (halaman petunjuk juga siapkan bentuk fallback untuk ujian legacy).
- Riwayat `/results` + `/results/{session_id}` dipakai untuk hasil lama.

### `/results*`
- ACTIVE: `GET /results` (paginated), `GET /results/{session_id}` (detail + `subject_breakdown`).
- `[KONTRAK BARU] §15.10`: `GET /results/analytics` (summary + per-mapel MASTERED/GUARD/WEAK + weakest_topic + recommended). Tidak tersedia → summary dihitung dari `/results` asli.

### `/ranking`
- ACTIVE: `GET /leaderboard?package_id=&month=&limit=` (mode Nilai Terbaik).
- `[KONTRAK BARU] §15.11`: `GET /leaderboard/aggregate` (rata-rata multi ujian; 404 → fallback mode terbaik + notice), filter `subject_id`, `GET /leaderboard/me` (Posisi Saya; 404 → derive lokal dari baris pengguna).

### `/targets`
- ACTIVE: `GET /profile/targets`, `PUT /profile/targets` (upsert 2 slot), `DELETE /profile/targets/{choice}` (usulan), `GET /target-schools` (katalog dasar).
- `[KONTRAK BARU] §15.12`: `GET /targets/catalog?level=&province=&city=&q=` (gap + peluang server-side). 404 → katalog empty state, panel "Target Saya" tetap berfungsi.

### `/membership`
- `[KONTRAK BARU] §15.13` (semua DRAFT): `GET /membership/me`, `GET /membership/plans`, `POST /membership/orders`, `PATCH /membership/me/auto-renew`, `GET /membership/orders`. Per-endpoint tolerance; empty state bila belum rilis.

### `/settings`
- ACTIVE: `GET /auth/me`, `PUT /auth/profile` (extended fields), `POST /auth/change-password` (`current_password` sesuai kontrak §15.14 & backend), `GET /academic/levels`, `GET /academic/grades?level_id=`.
- Upload avatar: `POST /media/upload` multipart (DRAFT untuk role SISWA) → try/catch, avatar_url fallback text.

### `/materials*`
- Sudah terimplementasi sebelumnya: `GET /materials/catalog`, `GET /materials/{subjectId}/chapters`, `GET /materials/{subjectId}/{chapterId}`, progress `/materials/{id}/progress` via `@/hooks/use-learn.ts` (TanStack Query). Tidak ada perubahan di task ini (hanya verifikasi).

---

## Service & types baru/diperluas

- `src/types/siswa.ts` (BARU): semua tipe siswa (Dashboard, Practice, Exam, Results, Ranking, Targets, Membership, config) + helper `bandForPct`, `masteryForPct`, `chanceBand`, `formatIDR`, `formatDuration`, `DEFAULT_DASHBOARD_CONFIG`.
- `src/services/dashboard.service.ts`: + widget `[KONTRAK BARU]` (target, subject-mastery, subject-progress, weekly-exam, streak, config).
- `src/services/academic.service.ts`: + practice hierarki/runner/review, exam paket meta/detail/summary, results paginated + by-session + analytics, leaderboard + aggregate + me, CBT runtime (`startCBTExam`, `getCBTQuestions`, `syncCBTAnswers`, `finishCBTExam`, `getCBTReview`) dengan tipe `CBT*` lokal.
- `src/services/membership.service.ts` (BARU): namespace `/membership/*`.
- `src/services/target-school.service.ts`: + `/targets/catalog`, `GET/PUT /profile/targets`, `DELETE /profile/targets/{choice}`.
- `src/services/auth.service.ts`: `changePassword` body dikoreksi ke `{current_password, new_password}`; + picker jenjang/kelas.

---

## Catatan teknis

- Semua halaman: `"use client"`, wrapped `<AppShell>`, fetch `useEffect`/`useState` + `Skeleton` (bukan spinner), empty state = `EmptyState` + CTA, responsif + dark mode (token CSS var), font Inter/PJS dari design.md.
- Halaman runner (`practice/[sessionId]`, `exams/[id]/cbt`) mode fokus — tanpa popup/animasi besar; dialog konfirmasi hanya pada submit.
- Validasi: `npx.cmd tsc --noEmit` clean; `npx.cmd next build` sukses (58 route); `eslint` pada file-file halaman siswa clean (0 error). Lint global repo masih mengandung 2 error `any` lama di `academic.service.ts` (fungsi `normalizeExam` pra-eksisting, di luar ruang lingkup) + error `any`/`prefer-const` pra-eksisting lain di file non-siswa.

## Endpoint `[KONTRAK BARU]` yang perlu diimplementasikan backend menyusul
1. Dashboard: `/dashboard/student/target`, `subject-mastery`, `subject-progress`, `weekly-exam`, `streak`, `/config/student-dashboard`.
2. Latihan hierarki: `/practice/catalog`, `/practice/start`, `/practice/sessions/{id}/submit|result|review`.
3. Ujian: `/exam-packages` extended meta, `/exams/summary`, `/exam-packages/{id}` detail.
4. Hasil: `/results/analytics`.
5. Peringkat: `/leaderboard/aggregate`, `/leaderboard/me`, filter `subject_id`.
6. Target: `/targets/catalog`, `DELETE /profile/targets/{choice}`.
7. Membership: seluruh namespace `/membership/*`.
8. Konfigurasi: `PUT /auth/profile` (hapus strip grade/school utk SISWA), `POST /media/upload` (role SISWA, avatar).

Setelah endpoint DRAFT rilis di backend: frontend **tanpa perubahan struktural** akan otomatis terisi (semua service sudah dipanggil; hanya perbaiki test manual per wireframe).