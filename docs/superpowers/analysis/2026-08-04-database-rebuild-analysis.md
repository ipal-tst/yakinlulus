# Analisis Database YakinLulus.id — Laporan & Strategi Implementasi

- Tanggal: 2026-08-04
- Scope: **Database saja** (schema Postgres + migrasi), tanpa perubahan aplikasi/backend code.
- Sumber analisis: folder `struktur database/` (20 dokumen visi target) vs `backend/migrations/` (63 file, skema aktual) + `doc/Database Schema`, `doc/physical_database_design`, `doc/logical_data_model`.

---

## 1. Ringkasan Eksekutif

Terdapat **kesenjangan sangat besar** antara visi target di folder `struktur database/` (±500–700 tabel lintas 20 domain, arsitektur enterprise DDD) dengan kondisi nyata skema saat ini (±85 tabel yang masih berevolusi dengan banyak inkonsistensi).

Masalah utama skema saat ini **bukan** kekurangan jumlah tabel, melainkan:
1. **Dual-schema** — dua pola desain hidup berdampingan: skema "unified" `content_*` (migrasi 023) DAN tabel legacy `questions`/`exam_*` yang **dihidupkan lagi** di migrasi 034 padahal sempat di-drop di 030/031.
2. **Domain-domain inti enterprise belum ada** sama sekali (finance/payment, DAM, RBAC/ABAC, OCR, AI recommendation, reporting, scheduler/queue, search, monitoring, dll).
3. **Histori "bongkar-pasang"** yang meninggalkan sisa skema usang (gamification di-drop 041, kolom `users.school_name` hasil `ALTER` sporadis, dst.).

Kesimpulan: presepsi user bahwa DB "berantakan dan tidak scalable" **terkonfirmasi oleh bukti**. Perlu pendekatan rebuild yang terstruktur, bukan sekedar tambal-sulam migrasi.

---

## 2. Isi Folder `struktur database/` (Visi Target)

Folder berisi 20 dokumen per-domain, dengan total estimasi **±500–700 tabel**:

| # | Domain | Perkiraan Tabel | Status di DB Saat Ini |
|---|--------|------------------|------------------------|
| 1 | Master Akademik | ~20 | ✅ Ada sebagian (grades, subjects, chapters, dst.) |
| 2 | Bank Soal | ~45–60 | ⚠️ Parsial + dual-schema |
| 3 | Engine Ujian (CBT) | ~70–90 | ⚠️ Parsial + dual-schema |
| 4 | Materi Pembelajaran (LCMS) | ~55–70 | ⚠️ Parsial |
| 5 | User Enterprise (RBAC+ABAC) | ~30–35 | ❌ Hanya enum `role` di `users` |
| 6 | Asset Management (DAM) | ~28–35 | ❌ Hanya `media` sederhana |
| 7 | Finance & Membership | ~30 | ❌ Hanya `subscription_plans`+`user_subscriptions` |
| 8 | Ranking | ~6 | ⚠️ Tidak ada tabel — dihitung on-the-fly dari `content_exam_attempts` |
| 9 | Analytics | ~15 | ❌ Tidak ada (event-driven) |
| 10 | CMS | ~10 | ❌ Tidak ada |
| 11 | Notification | ~10 | ⚠️ Parsial (`notification_*`) |
| 12 | OCR / Import Engine | ~12 | ⚠️ Parsial (`question_import_jobs`) |
| 13 | Recommendation Engine (AI) | ~15 | ⚠️ Parsial (`ai_conversations`, `ai_messages`) |
| 14 | Reporting | ~12 | ❌ Tidak ada |
| 15 | Scheduler & Queue | ~60–80 | ❌ Tidak ada |
| 16 | Search | ~8 | ❌ Tidak ada (FTS + pgvector) |
| 17 | System Configuration | ~70–90 | ⚠️ Parsial (`system_settings`) |
| 18 | Logging & Audit | ~60–80 | ⚠️ Parsial (`audit_logs`) |
| 19 | API Integration | ~12 | ❌ Tidak ada |
| 20 | Monitoring | ~20 | ❌ Tidak ada |

Ciri khas desain visi:
- **Schema per bounded-context** (Postgres search_path/namespace per domain, mis. `rank`, `integration`, `ocr`, `monitoring`).
- **Event-driven** untuk analytics/ranking (event store + materialized snapshot).
- **Standar audit trail** di semua tabel (created_by/updated_by/deleted_at/version).
- **Skala target**: 100.000+ user, 10.000 concurrent, partisi + FTS + pgvector.

---

## 3. Kondisi Skema Saat Ini (±85 tabel dari 63 migrasi)

**Daftar tabel hidup (setelah migrasi 041 drop gamification):**

- **Auth/User**: `users`, `sessions`, `password_resets`
- **Akademik**: `education_levels`, `grades`, `curriculums`, `subjects`, `chapters`, `sub_chapters`, `topics`, `learning_outcomes`, `academic_programs`
- **Bank Soal**: `questions`, `question_options`, `question_revisions`, `question_analytics`, `question_stimuli`, `question_tags`, `question_tag_map`, `question_import_jobs`, `question_import_rows`
- **Unified Content (023)**: `contents`, `content_questions`, `content_question_options`, `content_materials`, `content_learning_progress`, `content_exams`, `content_exam_questions`, `content_exam_blueprints`, `content_exam_subject_blueprints`, `content_exam_participants`, `content_question_pools`, `content_exam_attempts`, `content_exam_session_questions`, `content_exam_answers`, `content_practice_sessions`, `content_practice_sets`
- **CBT Runtime (re-created 034)**: `exam_questions`, `exam_question_pools`, `exam_sessions`, `exam_session_questions`, `exam_answers`, `results`, `violations`
- **Exam Mgmt**: `exam_packages`, `exam_package_exams`, `exam_analytics`
- **Materi**: `material_media`, `material_practices`
- **Media**: `media`
- **School**: `schools`, `school_members`, `school_settings`, `school_brandings`
- **Notification**: `notifications`, `notification_templates`, `notification_preferences`
- **Membership**: `subscription_plans`, `user_subscriptions`
- **Siswa**: `target_schools`, `student_targets`
- **AI**: `ai_conversations`, `ai_messages`
- **Lainnya**: `audit_logs`, `system_settings`
- **View**: `user_accessible_grades`
- **Ranking**: tidak ada tabel — agregasi on-the-fly per request (komputasi berat tiap panggil).

---

## 4. Masalah Teridentifikasi (Bukti "Berantakan & Tidak Scalable")

### 4.1 Dual-schema serius (paling kritis)
- Migrasi 023 membuat schema `content_*` (unified). Migrasi 030/031 **menghapus** tabel legacy (`exams`, `questions`, `question_options`, `exam_answers`, dst.).
- Migrasi 034 **menghidupkan kembali** 8 tabel legacy (`questions`, `exam_questions`, `question_options`, `exam_question_pools`, `exam_sessions`, `exam_session_questions`, `exam_answers`, `results`) dengan FK yang menunjuk ke `contents(id)`.
- Akibatnya: **satu entitas soal punya 3 representasi** — `questions` (legacy), `content_questions` (unified), dan `content_exam_questions` (junction). Penulis konten menulis ke `content_*`, tapi runtime CBT membaca `exam_*`. Query gabungan (mis. ranking dari `content_exam_attempts` + penilaian dari `exam_answers`) memaksa join lintas-dua-schema yang rawan salah dan mahal.

### 4.2 Domain inti enterprise tidak ada
Finance/payment, DAM, RBAC/ABAC, analytics event, CMS, reporting, scheduler/queue, search, API integration, monitoring semuanya kosong. Visi visi target tidak akan tercapai tanpa domain ini.

### 4.3 Ranking dihitung on-the-fly
Tidak ada tabel snapshot/materialized view. `internal/ranking/ranking.go` membaca SEMUA `content_exam_attempts` lalu sort di memory per request — **tidak scalable** pada 100k user / 10k concurrent.

### 4.4 Audit trail inkonsisten
Sebagian tabel punya `created_at`/`updated_at`; hampir tidak ada yang punya `deleted_at`/`created_by`/`version` secara konsisten — bertentangan dengan standar visi.

### 4.5 Naming & tipe tidak konsisten
- Kolom foreign key: campuran `subject_id`, `exam_content_id`, `exam_id`, `package_id` ke tabel yang sama (`contents`).
- Enum: `education_level` memakai string ('SD','SMP','SMA','UNIVERSITY'); `status` pakai VARCHAR campuran (DRAFT/MEDIUM/ACTIVE dsb.) tanpa CHECK di banyak tempat.
- Timestamp & numerik tidak seragam (mis. `points DECIMAL(5,2)` vs `points DECIMAL(5,2) NOT NULL DEFAULT 1`).

### 4.6 Sisa-sisa kolom / tabel usang
`users.school_name` (ditambah ad-hoc di 040), `material_practices`/`media` yang tidak jelas terpakai, dsb. Histori `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` tanpa arsitektur.

---

## 5. Strategi Implementasi

### Opsi A — Rebuild Total dari Nol (Big Bang)
Buat ulang seluruh schema dari dokumen visi, buang semua migrasi lama, tulis ~500+ tabel baru, lalu migrasi data (bila ada data produksi).
- ✅ Bersih total, sesuai visi.
- ❌ Biaya tinggi, waktu lama, risiko tinggi; **hanya masuk akal bila belum ada data produksi / user aktif**.

### Opsi B — Rebuild Bertahap per Bounded-Context (Recommended)
Bangun ulang domain-per-domain dengan urutan prioritas, memakai **Postgres schema namespace** (mis. `academic`, `question`, `cbt`, `content`, `identity`, `finance`, ...). Setiap fase:
1. Buat schema namespace + tabel baru (desain ulang sesuai visi).
2. Migrasi data + cutover per domain.
3. Drop/archive tabel lama.
Fase 1 harus menghapus **dual-schema** (memilih satu representasi per entitas).
- ✅ Risiko rendah, dapat diuji per-fase, tidak memblokir fitur baru.
- ✅ Menghapus root-cause utama (dual-schema) di fase paling awal.
- ❌ Perlu disiplin ketat; perlu peta ketergantungan antar domain agar FK/query tetap koheren.

### Opsi C — Hibrida: Rebuild bertahap + quick-win kecil
Sama dengan B, ditambah quick-win di luar urutan untuk kebutuhan mendesak (mis. **ranking materialized table** agar halaman peringkat langsung scalable, **audit trail generator** untuk konsistensi).
- ✅ Menjawab masalah skalabilitas paling menyentuh user lebih cepat.
- ❌ Sedikit lebih kompleks dalam koordinasi timeline.

### Urutan Fase yang Disarankan (Opsi B/C)
1. **Foundation**: Postgres schema namespace, konvensi audit trail, generator migrasi standar.
2. **Identity & Access** (`identity`): users, roles, permissions, org, address, auth — menggantikan `users`/`schools`.
3. **Master Akademik** (`academic`): curriculums → grades → subjects → chapters → topics → learning_outcomes.
4. **Bank Soal** (`question`): resolusi dual-schema → satu representasi soal (rekomendasi: pilih `content_questions` → dipindah ke `question`), import pipeline, revisi, tag, statistik.
5. **CBT Engine** (`cbt`): session, attempt, answer, grading, anti-cheat, offline sync — penyatuan `exam_*` vs `content_exam_*`.
6. **Materi/LCMS** (`content`): material, media, struktur, progress.
7. **Finance & Membership** (`finance`): paket, langganan, invoice, pembayaran, wallet, voucher, komisi.
8. **Analytics & Ranking** (`analytics`): event store + snapshot; ranking materialized.
9. **Infra pendukung**: notification queue, scheduler/queue, search, system config, logging/audit, API integration, monitoring — bisa paralel dengan fase inti.

---

## 6. Pertanyaan Kunci Sebelum Implementasi (Perlu Klarifikasi User)

1. **Data produksi?** Apakah saat ini sudah ada data user/soal/ujian yang harus dipertahankan, atau bisa mulai bersih? (menentukan Opsi A vs B/C).
2. **Urutan prioritas domain?** Apakah setuju urutan fase di atas, atau ada domain yang harus didahulukan (mis. finance karena monetisasi)?
3. **Titik kontak dengan backend code?** Rebuild schema akan memaksa perubahan di `backend/internal/*` (model, query). Tetap dalam scope "database", tapi wajib dicatat bahwa migrasi akan berhenti sementara sampai kode disesuaikan, atau kita sekaligus siapkan kompatibilitas.
4. **Postgres schema namespace** — setuju memakai namespace per domain (`academic`, `cbt`, dst.) seperti visi, atau tetap satu schema public?
5. **Penyelesaian dual-schema**: pilih representasi mana yang dipertahankan (direkomendasikan: schema `question`+`cbt` baru, drop semua `exam_*` legacy dan `content_*` yang tumpang tindih).
6. **Sumber kebenaran visi**: folder `struktur database/` dipakai 100% sebagai acuan, atau perlu divalidasi dulu dengan `doc/logical_data_model` & `doc/Database Schema` yang juga ada di repo (ada perbedaan tingkat detail)?

---

## 7. Rekomendasi Awal

**Opsi C (Hibrida)** sebagai strategi umum: rebuild bertahap per bounded-context dengan schema namespace, dimulai dari fase Foundation + resolusi dual-schema, plus quick-win **ranking materialized** sejak awal karena paling berdampak pada skalabilitas yang terasa user saat ini.

Namun keputusan final bergantung pada jawaban pertanyaan §6 (terutama keberadaan data produksi).
