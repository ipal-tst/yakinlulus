# Sidebar & Navigasi — YakinLulus.id

> Dokumen merujuk implementasi aktual: `frontend/src/components/layout/sidebar.tsx`.
> Layout shell: `frontend/src/components/layout/app-shell.tsx` | Topbar: `frontend/src/components/layout/topbar.tsx`.

## Peran Pengguna & Pemetaan Menu

Menu ditentukan **seluruhnya berdasarkan `user.role`** dari `useAuthStore`. Satu role = satu daftar menu
(no per-item gating). `SUPER_SISWA` jatuh ke menu `SISWA` (dianggap pengguna siswa).

| Role | Daftar menu |
|---|---|
| `SISWA`, `SUPER_SISWA` | `SISWA_NAV` (9 item) |
| `GURU` | `GURU_NAV` (5 item) |
| `STAFF` | `STAFF_NAV` (9 item) |
| `SUPER_ADMIN` | `SUPER_ADMIN_NAV` (9 item) — sama dengan STAFF (entry pertama beda) |
| `FINANCE` | `FINANCE_NAV` (5 item) |
| `INVESTOR` | `INVESTOR_NAV` (2 item) |

## SISWA_NAV (Student)

**Urutan & rute aktual:**

| # | Label | Href | Ikon | Status page |
|---|---|---|---|---|
| 1 | Beranda | `/siswa` | `LayoutDashboard` | ada |
| 2 | Belajar | `/materials` | `BookOpen` | ada |
| 3 | Latihan | `/practice` | `PenTool` | ada |
| 4 | Ujian | `/exams` | `FileCheck` | ada |
| 5 | Hasil | `/results` | `Trophy` | ada |
| 6 | Peringkat | `/ranking` | `Award` | ada |
| 7 | Target | `/targets` | `Target` | ada |
| 8 | Membership | `/membership` | `CreditCard` | ada (baru) |
| 9 | Konfigurasi | `/settings` | `Settings` | ada (baru) |

> **Dihapus** (revisi 2026-08-09): `Sertifikat` (`/certificates`, halaman belum ada) dan
> `AI Tutor` (`/ai`) — AI sementara nonaktif (infrastruktur belum siap). Halaman `/ai` tetap ada
> di router, tapi tidak ditampilkan di menu.

### Rincian halaman siswa

| Rute | Isi | Catatan |
|---|---|---|
| `/siswa` | Dashboard siswa | landing setelah login |
| `/materials` | Katalog mapel + non-mapel (Tips & Trik, Video, Audio) | sesuai jenjang; lihat wireframe `02-siswa-belajar.md` |
| `/materials/:subjectId` | Daftar Bab satu mapel (progres & ujian bab) | filter jenjang di server |
| `/materials/:subjectId/:chapterId` | Detail Bab → Topik → CP/KD (reader/video/rumus/grafik) | tombol ujian bab di akhir |
| `/practice` | Daftar latihan: hierarki Mapel→Bab→Topik + riwayat | indikator hijau ≥85%; lihat wireframe `03-siswa-latihan.md` |
| `/practice/:sessionId` | Runner latihan (full main, tanpa timer) | navigasi soal + flag ragu-ragu; jawaban hanya terekam saat Selesai |
| `/practice/:sessionId/result` | Hasil latihan (statistik detik) | CTA pembahasan |
| `/practice/:sessionId/review` | Pembahasan vertikal (soal→opsi→pembahasan) | juga dibuka dari riwayat |
| `/exams` | Katalog paket ujian (1-attempt & repeatable) + widget (nilai terakhir, rata-rata); `/:packageId` = detail/sub-test; `/:packageId/instructions` = petunjuk (Setuju → start); runner dipakai via kompat `/:packageId/cbt?session_id=` | lihat wireframe `04-siswa-ujian.md` |
| `/exams/run/:sessionId` | Runner ujian (full-screen, timer) | diimplementasi sbg `/:packageId/cbt?session_id=` (kompat, wireframe-allow) |
| `/exams/run/:sessionId/result` | Hasil ujian (nilai + statistik detik) | diimplementasi sbg `/:packageId/result?session_id=` |
| `/exams/run/:sessionId/review` | Pembahasan soal (opsi benar ter-highlight) | diimplementasi sbg `/:packageId/cbt/review?session_id=` |
| `/results` | Analisis hasil belajar lengkap (materi + latihan + ujian): KPI + BarChart per mapel + Donut status + rekomendasi penguatan; `/subjects/:subjectId` = drill per mapel (materi/bab/topic mastery + saran) | lihat wireframe `05-siswa-hasil.md` |
| `/ranking` | Peringkat seluruh siswa: mode nilai terbaik (1-attempt per paket) & rata-rata multi ujian; podium + tabel sortable + highlight posisi saya; `/subjects/:subjectId` = ranking per mapel | lihat wireframe `06-siswa-peringkat.md` |
| `/targets` | Target Sekolah: katalog sekolah (SMP/SMA/UNIVERSITY sesuai jenjang siswa+1), filter provinsi/kabupaten/kota + cari, banding nilai siswa vs nilai masuk tahun terakhir, badge peluang (hijau/amber/merah), panel "Target Saya" (max 2 slot, CRUD) | lihat wireframe `07-siswa-target.md`; data via `GET /target-schools` + `GET /targets/catalog` (BARU) + `GET/PUT /profile/targets` |
| `/membership` | Status keanggotaan (paket/level/sisa hari/auto-renew), katalog paket Basic→Enterprise, perpanjang & upgrade membership | lihat wireframe `08-siswa-membership.md`; data via `GET /membership/me` + `GET /membership/plans` + `POST /membership/orders` (BARU) |
| `/settings` | Konfigurasi profil lengkap yang bisa diedit: username/nama, sekolah, foto profil (upload avatar), ganti kata sandi, jenjang, kelas (opsional), no HP (opsional) + kartu Target & Preferensi | lihat wireframe `09-siswa-konfigurasi.md`; data via `GET /auth/me` + `PUT /auth/profile` (extend `[BARU]`) + `POST /auth/change-password` + `GET /academic/levels` + `GET /academic/grades` |
| `/profile` | Pengaturan profil (rangkaian lama) | masih ada, di-dropdown topbar |

## GURU_NAV

| Label | Href |
|---|---|
| Dashboard Guru | `/guru` |
| Bank Soal | `/guru/questions` |
| Materi | `/guru/materials` |
| Kelola Ujian | `/guru/exams` |
| Media | `/guru/media` |

## STAFF_NAV / SUPER_ADMIN_NAV

| Label | Href | Role |
|---|---|---|
| Dashboard Admin | `/admin` | hanya SUPER_ADMIN |
| Dashboard Staff | `/staff` | hanya STAFF |
| Master Akademik | `/admin/academic` | keduanya |
| Kelola Sekolah | `/staff/schools` | keduanya |
| Materi Pelajaran | `/admin/materials` | keduanya |
| Bank Soal | `/admin/questions` | keduanya |
| Kelola Ujian | `/admin/exams` | keduanya |
| Kelola Pengguna | `/admin/users` | keduanya |
| Broadcast Notifikasi | `/staff/notifications` | keduanya |
| Monitoring & Konfigurasi | `/admin/monitor-config` | keduanya |

## FINANCE_NAV

| Label | Href |
|---|---|
| Dashboard Finance | `/finance` |
| Paket Membership | `/finance/plans` |
| Pelanggan | `/finance/subscribers` |
| Pembayaran & Invoice | `/finance/payments` |
| Laporan Keuangan | `/finance/reports` |

## INVESTOR_NAV

| Label | Href |
|---|---|
| Investor Board | `/investor` |
| Financial Reports | `/investor/reports` |

## Perilaku

- **Desktop:** sidebar tetap, lebar `280px`, saat collapse `72px` (ikon saja; title jadi `title` tooltip).
- **Mobile:** drawer kiri (`w-[280px]`) via tombol hamburger di topbar; pakai `SidebarContent` yang sama.
- **Aktif:** `pathname === href` untuk rute dashboard; `pathname.startsWith(href + "/")` untuk sub-halaman.
- **Footer:** kartu profil pengguna + tombol logout.
- **State:** collapse tersimpan di Zustand `ui.store.ts` (`sidebarCollapsed`).
  > Catatan: state collapse desktop & drawer mobile memakai `sidebarCollapsed` yang sama;
  > independen per platform belum diimplementasikan.
- **Redirect pasca-login:** `SUPER_ADMIN→/admin`, `STAFF→/staff`, `GURU→/guru`, `FINANCE→/finance`,
  `INVESTOR→/investor`, `SISWA/SUPER_SISWA→/siswa`.

## Revisi

| Tanggal | Perubahan |
|---|---|
| 2026-08-09 | Peran `SISWA_NAV` disederhanakan: hapus `Sertifikat` & `AI Tutor`; rename `Try Out` → `Ujian`; tambah `Membership` (`/membership`, `CreditCard`) & `Konfigurasi` (`/settings`, `Settings`). Dokumen `01-siswa-dashboard.md` wingbar disesuaikan. |
| 2026-08-09 | `Belajar` berganti dari flat ke hierarki: `/materials` (katalog) → `/materials/:subjectId` (bab) → `/materials/:subjectId/:chapterId` (Topik→CP/KD). Rincian di wireframe `02-siswa-belajar.md`. |
| 2026-08-09 | `Latihan` berganti dari list flat ke hierarki + runner: `/practice` (katalog Mapel→Bab→Topik + riwayat) → `/practice/:sessionId` (runner full-main tanpa timer) → `/result` + `/review`. Rincian di wireframe `03-siswa-latihan.md`. |
| 2026-08-09 | `Ujian` berganti dari list exam flat ke **katalog paket** (`/exam-packages`): `/exams` (paket + widget) → `/:packageId` (sub-test) → `/:packageId/instructions` → `/run/:sessionId` (runner full-screen, timer) → `/result` + `/review`. Rincian di wireframe `04-siswa-ujian.md`. |
| 2026-08-09 | `Hasil` berganti dari riwayat skor flat ke **analisis belajar lengkap**: `/results` (KPI ringkas, BarChart akurasi per mapel, Donut status, Rekomendasi Penguatan, daftar progres per mapel) + `/results/subjects/:subjectId` (detail mapel: materi/bab/topic mastery + saran) + `/results/:id` (detail satu ujian, tetap). Rincian di wireframe `05-siswa-hasil.md`. |
| 2026-08-09 | `Peringkat` berganti dari leaderboard flat ke **2 mode**: nilai terbaik per paket (1-attempt) & rata-rata multi ujian; podium top-3, tabel sortable + highlight posisi saya, kartu posisi saya; `/subjects/:subjectId` = ranking per mapel. Rincian di wireframe `06-siswa-peringkat.md`. |
| 2026-08-09 | `Target` berganti dari lembar form flat ke **katalog sekolah target**: sesuai jenjang siswa + 1 tingkat (SD→SMP, SMP→SMA, SMA→UNIVERSITY), filter provinsi/kabupaten/kota + cari, banding nilai siswa vs nilai masuk, badge peluang tinggi (hijau) ; panel "Target Saya" max 2 slot + CRUD. Rincian di wireframe `07-siswa-target.md`. |
| 2026-08-09 | `Membership` berganti dari katalog tryout flat ke **status membership + harga paket**: kartu status (paket/level/sisa hari/auto-renew), katalog Basic→Enterprise (harga & fitur), tab durasi, drawer order perpanjang/upgrade. Rincian di wireframe `08-siswa-membership.md`. |
| 2026-08-09 | `Konfigurasi` (`/settings`) dijelaskan: profil lengkap editable (username/nama, sekolah, foto profil, ganti kata sandi, jenjang, kelas opsional, no HP opsional) + kartu Target & Preferensi. Rincian di wireframe `09-siswa-konfigurasi.md`. |