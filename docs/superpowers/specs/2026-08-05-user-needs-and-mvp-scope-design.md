# YakinLulus.id — User Needs & MVP Scope (PRD)

- Tanggal: 2026-08-05
- Status: DRAFT — menunggu approval sebelum implementasi
- Produk: YakinLulus.id — Platform Learning & CBT EdTech (pre-launch, beta 500 tester)
- Input: hasil survey kebutuhan user (`user problem.md`) + keputusan brainstorming
- Scope: **PRD & MVP scope + panduan urutan teknis**. Implementasi (migrasi backend + fitur) di luar dokumen ini, dijadwalkan via plan per batch.

---

## 1. Konteks & Tujuan

Posisi produk saat ini: **pre-launch / beta belum rilis** (beta program 500 tester, gratis 6 bulan, micro-subscription Rp10.000/bulan).

Tujuan dokumen ini:
1. Mendefinisikan ulang kebutuhan user dari hasil survey menjadi *jobs-to-be-done* yang terukur.
2. Memilih scope MVP fase beta dengan skor prioritas (impact × effort).
3. Menurunkan kebutuhan teknis: fitur → modul/schema → urutan migrasi backend.

Dasar keputusan (hasil brainstorming):
- **Pre-launch, bebas menetapkan scope MVP.**
- **Fokus utama: core loop siswa + authoring** (bukan authoring dulu, bukan AI dulu).
- **Rekomendasi "sesuai kebutuhan" = rule-based mastery** (bukan IRT penuh di MVP).
- **Arsitektur semua jenjang; konten fokus** (isi bertahap).
- **Sistem penilaian konsisten SD–SMA** (mapel dasar sama, beda jenjang; SMA ada mapel tambahan/penjurusan; UTBK pakai IRT 3-PL).
- **RBAC ulang: 6 role baru.**

---

## 2. JTBD per Role

Setiap job: *user story*, *acceptance criteria*, *metrik sukses*.

### 2.1 Siswa (5 jobs inti)

| ID | Job | User story | Acceptance criteria | Metrik sukses |
|----|-----|-----------|---------------------|---------------|
| J1 | Masuk sekolah tujuan | "Saat saya punya target sekolah, saya ingin tahu peluang saya" | Input target sekolah + tampil peluang dari range nilai terendah–tertinggi yang diterima (data tahun terkini, di-input Staff Admin) | % siswa dengan target sekolah melihat peluang |
| J2 | Naikkan nilai X poin dalam y bulan | "Saya ingin rencana belajar untuk target nilai" | Input target nilai & tenggat → prioritas topik berdampak terbesar | % target tercapai |
| J3 | Belajar fokus tanpa gangguan | "Saya ingin belajar nyaman dan fokus" | Mode fokus, CBT fullscreen + log pelanggaran (tanpa auto-terminate), navigasi simpel | Sesi belajar per minggu |
| J4 | Latihan banyak + simulasi CBT | "Saya ingin banyak latihan dan simulasi ujian" | Akses bank soal, simulasi CBT (SINGLE/MULTIPLE/TRUE_FALSE), riwayat | Jumlah latihan/simulasi per minggu |
| J5 | Lihat progress & ranking | "Saya ingin melihat nilai & materi yang sudah dipelajari" | Dashboard mastery per topik, tren nilai, ranking | Frekuensi lihat dashboard |

### 2.2 Guru (3 jobs inti)

| ID | Job | Acceptance criteria |
|----|-----|---------------------|
| G1 | Authoring cepat (soal/materi/CBT) | Buat soal < 2 menit; import massal Excel/docx/pdf; **format soal blok** (TEXT/IMAGE/STIMULUS); **ownership: hanya bisa delete konten miliknya sendiri** |
| G2 | Pantau progress & ranking siswa | Akses **hanya siswa yang terdaftar sebagai muridnya**; read-only data sekolah/kelas/murid |
| G3 | Buat rekomendasi untuk siswa | Rekomendasi otomatis per siswa (materi/latihan/CBT) dari mastery |

### 2.3 Super Admin (pengganti ADMIN lama)

- A1 — Kelola seluruh platform: semua pengelolaan (data, user, konten, keuangan, CMS, dsb.), akses semua perangkat.

### 2.4 Staff Admin

- Authoring soal & materi + kelola CMS.
- Input daftar sekolah + nilai terendah/tertinggi yang diterima tahun terkini (data target sekolah/peluang).

### 2.5 Staff Finance

- Semua yang berkaitan dengan keuangan: CRUD membership, paket, MRR, transaksi, dsb.

### 2.6 Investor

- I1 — Laporan finansial & pertumbuhan: laporan revenue/cost/user-growth (P&L, MRR, ARPU).

---

## 3. Katalog Fitur + Skor Prioritas

Skala: **Impact 1–5** × **Effort 1–5** (1=ringan, 5=berat) → **priority = impact / effort**.

| # | Fitur | Role | Impact | Effort | Priority |
|---|-------|------|:---:|:---:|:---:|
| F1 | Login/register/RBAC (6 role) | Semua | 5 | 2 | 2.5 |
| F2 | Master akademik (jenjang/mapel/bab/topik) | Admin | 5 | 2 | 2.5 |
| F3 | Authoring soal (CRUD + import Excel) | Staff Admin/Guru | 5 | 4 | 1.25 |
| F4 | Authoring materi (CRUD) | Staff Admin/Guru | 4 | 3 | 1.33 |
| F5 | Authoring CBT/simulasi (CRUD + blueprint) | Staff Admin/Guru | 5 | 4 | 1.25 |
| F6 | Dashboard siswa (progress, mastery, tren) | Siswa | 5 | 3 | 1.67 |
| F7 | Latihan soal per topik | Siswa | 5 | 3 | 1.67 |
| F8 | Simulasi CBT (SINGLE/MULTIPLE/TF, timer, proctor) | Siswa | 5 | 4 | 1.25 |
| F9 | Hasil & pembahasan per sub-test | Siswa | 5 | 3 | 1.67 |
| F10 | Mastery per topik (rule-based) | Siswa/Guru | 5 | 3 | 1.67 |
| F11 | Rekomendasi materi/latihan/CBT per mastery | Siswa/Guru | 5 | 3 | 1.67 |
| F12 | Target sekolah & peluang (nilai range) | Siswa | 4 | 3 | 1.33 |
| F13 | Target nilai & rencana (naik X poin) | Siswa | 4 | 3 | 1.33 |
| F14 | Ranking (siswa/kelas/seluruh) | Siswa/Guru | 3 | 2 | 1.5 |
| F15 | Kelola sekolah (staff) & daftar sekolah+range nilai | Staff Admin | 4 | 2 | 2.0 |
| F16 | Kelola kelas & registrasi murid (guru) | Guru | 4 | 2 | 2.0 |
| F17 | Ownership authoring (guru hanya delete punya sendiri) | Guru | 4 | 2 | 2.0 |
| F18 | CMS (halaman, banner, berita) | Staff Admin | 3 | 4 | 0.75 |
| F19 | Membership & payment (paket, MRR) | Staff Finance | 3 | 3 | 1.0 |
| F20 | Notifikasi in-app | Semua | 3 | 2 | 1.5 |
| F21 | Laporan keuangan & pertumbuhan (investor) | Investor | 3 | 3 | 1.0 |
| F22 | AI Tutor | Siswa | 3 | 5 | 0.6 |
| F23 | IRT 3-PL untuk UTBK | Siswa | 4 | 5 | 0.8 |

---

## 4. Scope MVP (MoSCoW) — Fase Beta

### MUST (inti — wajib rilis beta)
F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F13, F14, F15, F16, F17, F20

### SHOULD (penguat loop, bila sumber daya cukup)
- F18 CMS dasar (halaman statis, banner, berita)
- F19 Membership & payment (paket, MRR dasar)

### COULD (post-beta awal)
- F21 Laporan investor (P&L, MRR, ARPU, growth)
- F23 IRT 3-PL untuk UTBK

### WON'T (tidak masuk MVP)
- F22 AI Tutor (fase berikutnya, terpisah)

> Catatan: IRT (F23) desain datanya tetap disiapkan di schema `question`/`analytics` (parameter butir, kolom theta) agar upgrade bertahap, tetapi mesin IRT tidak dibangun di MVP. Ini selaras dengan keputusan rule-based mastery.

---

## 5. Definisi "Sesuai Kebutuhan" (Rule-based Mastery)

### 5.1 Model mastery per topik
- Tiap siswa punya skor mastery per **topik** (unit terkecil di `academic`).
- Sumber: jawaban latihan (F7) + simulasi CBT (F8); rasio benar dengan bobot soal lebih sulit lebih tinggi.
- Kategori: `BELUM MULAI` → `RENDAH` → `SEDANG` → `MAHIR` (ambang misal 0 / 40 / 70 / 85%).

### 5.2 Aturan rekomendasi (rule-based)
- **Materi:** topik mastery `RENDAH`/`SEDANG` → rekomendasi materi topik itu (dulu sebelum latihan).
- **Latihan:** topik `RENDAH` → latihan topik; `MAHIR` → soal lebih sulit.
- **CBT/simulasi:** yang belum pernah dikerjakan & sesuai jenjang/kelas; campuran menyesuaikan topik lemah.
- Urutan prioritas: mastery rendah → sedang → mahir.
- **Tanpa AI** — murni perhitungan rule-based.

### 5.3 Target sekolah & peluang (F12)
- Staff Admin meng-input daftar sekolah + **nilai terendah & tertinggi yang diterima tahun terkini**.
- Peluang = posisi skor siswa dalam range → klasifikasi `TINGGI` (≥ tertinggi) / `SEDANG` (dalam range) / `RENDAH` (< terendah); persentase dari posisi dalam range.

### 5.4 Target nilai & rencana (F13)
- Selisih target vs skor saat ini ÷ tenggat → prioritas topik mastery rendah dengan bobot ujian tinggi.

---

## 6. Penilaian & IRT

### 6.1 Konsistensi SD–SMA
- Sistem penilaian dasar sama di semua jenjang (rasio benar → mastery).
- Perbedaan hanya jenjang & katalog mapel.

### 6.2 IRT 3-PL (khusus UTBK)
- Model: `P = c + (1-c)/(1+e^(-a(θ-b)))` — parameter a (diskriminasi), b (kesulitan), c (tebakan).
- Estimasi kemampuan θ + kalibrasi butir dari data masajawab.
- **Desain data disiapkan:** parameter butir di `question`; ability estimate/theta, se_theta, snapshot di `analytics`/`ranking`.
- **Di luar scope MVP:** engine/estimator IRT → fase berikutnya (butuh library estimasi + data cukup dari banyak tester).

---

## 7. Jenjang & Arsitektur Konten

- **Model jenjang** (`academic`): `education_level` → `grade` → `subject` → `chapter` → `topic`.
- **Mapel dasar (shared):** Matematika, Bahasa Indonesia, Bahasa Inggris, IPA, IPS, dsb — lintas jenjang.
- **Mapel tambahan SMA + penjurusan** (MIPA/IPS/Bahasa): fisika, kimia, biologi, ekonomi, geografi, sosiologi, sejarah, dsb → relasi mapel ↔ jurusan.
- **UTBK/SNBT:** sub-tes (PU, PPU, PK, PM, Literasi Indonesia, Literasi Inggris, Penalaran Matematika) dimodelkan sebagai paket di atas mapel dasar, pakai IRT.
- **Konten fokus, arsitektur penuh:** struktur jenjang lengkap; isi konten diisi bertahap. MVP fokus SMA/Gap Year UTBK + satu jenjang dasar (mis. SMP) sebagai bukti model multi-jenjang.
- **Leveling:** siswa daftar dengan jenjang+kelas → konten sesuai; mastery dihitung per topik dalam konteks jenjang siswa.

---

## 8. Format Soal Blok & Referensi (revisi F3/F5)

**Alasan utama rombak:** editing soal sulit karena format konten tidak seragam (text→gambar→text, gambar→text→gambar→text, dst.) dan editing gambar = menyisipkan URL manual satu per satu.

**Solusi: konten soal = daftar blok terstruktur** (1 soal = 1 blok atau lebih, urutan teratur):
- `TEXT` — paragraf (mendukung LaTeX/KaTeX)
- `IMAGE` — gambar yang di-upload/disisipkan (bukan URL manual)
- `STIMULUS` — bahan acuan (teks bacaan/diagram/soal induk)

**Editor blok:** tambah/hapus/pindah urutan blok. Import docx/pdf memetakan konten ke blok sesuai letak aslinya — menghilangkan penyisipan URL manual.

**Tipe jawaban (3 jenis):**
- `SINGLE` — pilihan tunggal, 1 benar
- `MULTIPLE` — lebih dari 1 benar
- `TRUE_FALSE` — siswa memilih Benar/Salah per pernyataan (bisa >1 pernyataan = bool matrix)

**Referensi antar soal (wajib berderet):**
- 1 stimulus (bacaan/gambar/soal induk) menjadi acuan sederet soal berikutnya.
- **Wajib kontigu** — stimulus no N menjadi acuan soal N+1..N+k berurutan, TIDAK boleh lompat (mis. N → N+3, N+4, N+5).
- Soal yang menempel pada stimulus sama dikelompokkan; tidak perlu mengulang teks stimulus.
- Saat mengerjakan, stimulus ditampilkan **floating** agar mudah dirujuk.

---

## 9. Proctor & Anti-Cheat (F8+)

- **Fullscreen enforcement:** sesi CBT wajib fullscreen (Fullscreen API). Keluar fullscreen = 1 pelanggaran.
- **Deteksi aktivitas di luar layar:** `visibilitychange` (tab switch), `blur` (pindah aplikasi), `fullscreenchange` → kirim violation event (jenis, detail, timestamp).
- **Log pelanggaran:** tersimpan di tabel violations (session_id, type, details, created_at) — riwayat lengkap.
- **Skor pelanggaran:** tiap pelanggaran +1 `violation_score`. **TANPA auto-terminate** — ujian tetap berjalan; hanya log.
- **Realtime:** broadcast `violation_alert` via WebSocket ke proctor (guru/super admin); proctor memutuskan tindakan sendiri.

---

## 10. Panduan Urutan Teknis (Fitur MVP → Modul → Urutan Migrasi)

Tiap batch = sub-project (spec + plan + implementasi + verifikasi + merge). Batch mengikuti dependensi schema + MVP order.

### Batch 1 — Fondasi Auth & Master
- Modul: `auth`, `middleware`, `academic`, `admin`, `school` (sebagian), `profile` (sebagian)
- Schema: `identity`, `academic`, `config` (sebagian)
- Deliverable: login/register 6 role, RBAC & ownership, master jenjang/mapel/bab/topik, kelola sekolah & range nilai, kelas & registrasi murid.
- **Gate:** auth + master + RBAC ownership end-to-end.

### Batch 2 — Content Pipeline & Authoring
- Modul: `question_bank`, `content`, `material`, `media`, `cms` (dasar)
- Schema: `media`, `question`, `content`
- Deliverable: format soal blok (TEXT/IMAGE/STIMULUS), 3 tipe jawaban, referensi berderet, import docx/pdf → blok otomatis, authoring materi, authoring CBT+blueprint, CMS dasar, ownership delete (guru hanya punya sendiri).
- **Gate:** buat soal blok → import → edit → publish; materi; CBT; ownership aman.

### Batch 3 — Core Loop Siswa
- Modul: `cbt_engine`, `cbt_runtime`, `practice`, `scoring`, `dashboard`, `analytics` (mastery), `ranking`, `exam_packages`
- Schema: `cbt`, `ranking`, `analytics`
- Deliverable: latihan per topik, simulasi CBT (timer/proctor/fullscreen), hasil+pembahasan, mastery per topik, rekomendasi rule-based, target sekolah+peluang, target nilai+rencana, dashboard, ranking.
- **Gate:** siswa menyelesaikan loop penuh: latihan → CBT → hasil → rekomendasi → ranking.

### Batch 4 — Monetisasi & Reports
- Modul: `subscription`, `finance` (sebagian), `notification`, `target_schools`, investor reports
- Schema: `finance`, `notification`, `report`
- Deliverable: membership & payment dasar, MRR, notifikasi in-app, laporan investor (P&L, MRR, ARPU, growth).
- **Gate:** siklus subscribe → bayar → akses premium; laporan investor terisi.

### Fase berikutnya (di luar MVP): AI Tutor (F22), IRT engine (F23).

---

## 11. Konteks Teknis Saat Ini (Fakta)

- Database telah di-rebuild menjadi **28 schema, ±690 tabel** (identity, academic, media, question, cbt, content, finance, ranking, analytics, cms, notification, queue, ai, ocr, report, search, config, audit, integration, monitoring, shared, dll.).
- Backend Go (`backend/internal`, 24 modul, ~19.4k LOC, ~590 SQL) masih menunjuk schema `public` lama yang **sudah di-drop** — seluruh query gagal runtime (`relation "contents" does not exist`).
- Tidak ada `search_path`/re-mapping layer; SQL murni string.
- Kesimpulan: migrasi backend ke schema baru = **rewrite query per modul** (keputusan user), kontrak API dipertahankan agar frontend tidak diubah.
- Urutan migrasi modul mengikuti urutan schema baru (identity → academic → media → question → cbt → content → ...), yang dipetakan ke Batch 1–4 di atas.
