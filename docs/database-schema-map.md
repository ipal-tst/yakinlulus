# Database Schema Map (Supabase)

Panduan mencari tabel di database YakinLulus.id.

> **Kenapa Table Editor hanya menampilkan "tabel migrasi"?**
> Database memakai **multi-schema** (bukan `public`). Semua tabel bisnis berada di schema per-domain.
> `public` hanya berisi satu tabel `_migrations` (penanda versi migrasi).
> Di Supabase Dashboard → **Table Editor**, pilih dropdown schema di kiri atas untuk melihat tabel.

## Cara melihat tabel

**Supabase Dashboard (Table Editor):**
1. Buka https://supabase.com/dashboard → project → **Table Editor**
2. Dropdown schema di kiri atas, default `public` → pilih schema (mis. `identity`, `academic`)
3. Semua tabel schema tersebut muncul

**SQL Editor:**
```sql
-- Daftar schema + jumlah tabel
SELECT table_schema, count(*) FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog','information_schema')
GROUP BY table_schema ORDER BY table_schema;

-- Daftar tabel dalam satu schema
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'identity' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Cari tabel berdasarkan nama (bagian dari nama)
SELECT table_schema, table_name FROM information_schema.tables
WHERE table_name ILIKE '%user%' ORDER BY table_schema;
```

## Ringkasan (26 schema, 694 tabel)

| Schema | Jumlah | Peran |
|---|---|---|
| `identity` | 35 | User, role, RBAC, login session, profile |
| `academic` | 24 | Jenjang, kelas, mapel, bab, topik, sekolah |
| `question` | 38 | Soal & bank soal (termasuk IRT) |
| `content` | 48 | Materi & progres belajar |
| `cbt` | 55 | Ujian (paket ujian), proctoring, anti-cheat |
| `ranking` | 25 | Leaderboard & peringkat |
| `analytics` | 20 | Laporan & metrik |
| `report` | 24 | Laporan & ekspor |
| `finance` | 24 | Pembayaran, membership, invoice |
| `ai` | 26 | Chat AI, tutor, RAG, credit |
| `media` | 30 | Asset & storage |
| `cms` | 31 | Banner, berita, halaman, SEO |
| `notification` | 20 | Notifikasi |
| `search` | 22 | Pencarian |
| `config` | 52 | Konfigurasi & feature flag |
| `audit` | 62 | Log aktivitas & audit |
| `integration` | 28 | Webhook & integrasi API |
| `monitoring` | 28 | Monitoring & alerting |
| `queue` | 35 | Job queue & scheduler |
| `ocr` | 28 | Parsing dokumen soal |
| `auth` | 23 | **Milik Supabase Auth** (jangan diubah) |
| `storage` | 8 | **Milik Supabase Storage** (jangan diubah) |
| `realtime` | 3 | **Milik Supabase Realtime** (jangan diubah) |
| `extensions` | 2 | **Milik Supabase** (jangan diubah) |
| `public` | 1 | Hanya `_migrations` |

## Panduan cepat per fitur

### Autentikasi & User
Schema **`identity`** (jangan pakai `auth.users` untuk logika bisnis):
- `user` — akun utama (email, password_hash, status `ACTIVE`, avatar, phone)
- `user_profile` — profil 1:1 (full_name, gender)
- `user_role` — relasi user ↔ role (is_primary)
- `role` — kode role v2: `SUPER_ADMIN`, `STAFF`, `FINANCE`, `GURU`, `SISWA`, `INVESTOR`
- `login_session` — refresh token & sesi
- `password_reset`, `email_verification`, `otp_request`
- `user_status_history`, `login_history`, `security_log`, `activity_log`

### Struktur belajar (jenjang → topik)
Schema **`academic`**:
```
education_level (SD/SMP/SMA/GAPYEAR)
  └─ grade (kelas)
      └─ curriculum ── curriculum_subject ── subject (mapel)
          └─ chapter (bab)
              └─ subchapter
                  └─ topic (topik)
                      └─ competency
                          └─ learning_outcome
```
- `school`, `school_class` — sekolah & kelas
- `student_enrollment` — relasi siswa ↔ kelas & tahun ajaran
- `academic_year`, `semester`
- `major` — penjurusan
- `teacher_subject`, `teacher_homeroom` — relasi guru

### Soal (bank soal)
Schema **`question`**:
- `question` — soal utama
- `question_block`, `option_block`, `explanation`, `hint`, `solution_step` — format blok (TEXT/IMAGE/STIMULUS)
- `question_option` — opsi jawaban
- `question_status`, `question_version`, `question_history`, `question_approval` — workflow
- `question_irt` — parameter IRT 3-PL (khusus UTBK, engine di luar MVP)
- `question_statistics`, `question_answer_distribution`
- Relasi: `question_subject`, `question_topic`, `question_chapter`, `question_competency`, `question_grade`, `question_curriculum`, `question_skill`, `question_tag`

### Materi & progres belajar
Schema **`content`**:
- `material` — materi utama
- `material_block`, `material_section`, `material_section_block` — isi blok
- `material_chapter`, `material_topic`, `material_subject` — relasi struktur
- `learning_progress` — progres siswa
- `material_version`, `material_approval`, `material_status`
- `practice_set`, `practice_set_question` — latihan
- `student_certificate`

### Ujian & proctoring (CBT)
Schema **`cbt`**:
- `exam`, `exam_package`, `exam_package_question`, `exam_question_pool`
- `exam_session`, `exam_attempt`, `exam_participant`
- `student_answer`, `answer_history`
- Proctoring: `browser_log`, `camera_log`, `microphone_detection`, `cheating_log`, `navigation_log`, `face_detection`, `live_monitor`, `heartbeat`
- `exam_randomization`, `exam_random_log`, `exam_timer`, `timer_history`
- `exam_schedule`, `exam_statistics`

### Ranking
Schema **`ranking`**:
- `leaderboard`, `leaderboard_entry`
- `school_ranking`, `class_ranking`, `subject_ranking`, `province_ranking`, `city_ranking`, `exam_ranking`
- `user_rank_summary`, `ranking_history`, `ranking_score`
- `ranking_badge`, `ranking_reward`, `ranking_achievement`

### Keuangan & membership
Schema **`finance`**:
- `invoice`, `payment`, `payment_transaction`, `payment_method`, `refund`
- `subscription`, `membership_package`, `user_membership`, `package_feature`
- `voucher`, `user_voucher`, `coupon_usage`, `promotion`
- `wallet`, `wallet_transaction`, `commission`, `tax`
- `revenue_summary`, `financial_report`

### Pencarian
Schema **`search`**:
- `search_document`, `search_collection`, `search_collection_document`
- `search_query`, `search_history`, `search_suggestion`, `search_synonym`, `search_trending`, `search_analytics`
- `search_vector` — vektor embedding

### Notifikasi
Schema **`notification`**:
- `user_notification`, `notification_channel`, `notification_template`
- `notification_queue`, `notification_delivery`, `notification_statistics`
- `notification_device` — FCM/APNs token

### AI
Schema **`ai`**:
- `ai_conversation`, `ai_message`, `ai_conversation_participant`
- `ai_tutor_session`, `ai_feedback`, `ai_recommendation`
- `ai_credit`, `ai_credit_package`, `ai_credit_transaction`
- `ai_rag_chunk`, `embedding`, `ai_knowledge_base`
- `ai_model`, `ai_provider`, `ai_model_pricing`, `ai_usage`

## Tabel yang JANGAN diubah

- `auth.*`, `storage.*`, `realtime.*`, `extensions.*` — dikelola otomatis oleh Supabase
- `public._migrations` — penanda versi migrasi (dikelola `go run ./cmd/migrate/main.go`)

## Migrasi database

- Semua schema dibuat oleh migrasi di `backend/migrations/*.sql` (format `NNN_<nama>.up.sql` / `.down.sql`)
- Counter saat ini: **188 migrasi** (mulai nomor baru dari `027` ke atas untuk batch berikutnya)
- Menjalankan: dari `backend/`, `go run ./cmd/migrate/main.go up`
- Konvensi penomoran: `010-015` = identity, `020-026` = academic, `08x` = finance, `09x` = analytics, `14x` = report, dst.
