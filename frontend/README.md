# YakinLulus.id - Frontend Next.js 15 App Router

Platform Frontend EdTech & CBT Generasi Baru berbasis **Next.js 15 App Router**, **React 19**, **Tailwind CSS v4**, dan **TypeScript Strict Mode**.

---

## 🌟 Modul & Rute Utama

### 1. 🎓 Student Suite (`app/(portal)/student/*`)
- `/student`: Beranda Siswa
- `/student/materials`: Katalog Materi
- `/student/materials/[materialId]`: Detail & Player Video Materi
- `/student/practice`: Hub Latihan Soal Adaptif
- `/student/practice/[practiceId]`: Engine Pengerjaan Latihan
- `/student/practice/[practiceId]/result`: Hasil Latihan & Pembahasan
- `/student/exam`: Ujian CBT & Tryout Hub
- `/student/tryout/[tryoutId]/result`: Laporan & Analisis IRT 3-PL
- `/student/ai-tutor`: AI Tutor Companion Center
- `/student/analytics`: Progress & Radar Analytics
- `/student/leaderboard`: Peringkat XP & Skor
- `/student/profile`: Profil & Target Belajar Impian

### 2. 👑 Admin Suite CMS (`app/(portal)/admin/*`)
13 Modul CMS terpadu: `Command Center`, `Master Data`, `User Access`, `Question Bank FSM`, `Materials CMS`, `CBT Operations`, `School Mitra`, `Subscriptions MRR`, `Analytics Report`, `Content CMS`, `AI Companion`, `Audit Logs`, & `System Settings`.

### 3. ⚡ CBT Exam Engine Workspace (`app/exam/[examId]`)
Distraction-free environment dengan proteksi penutupan tab, timer sinkron, & matrix navigasi nomor soal.

---

## 🔌 API Client Integration (`lib/api-client.ts`)

Dihubungkan ke backend Go Fiber REST API (`http://localhost:8080/api/v1`):
- `apiClient.auth`: Login, register, me profile.
- `apiClient.academic`: Subjects, chapters.
- `apiClient.questionBank`: Soal, FSM state transition.
- `apiClient.cbtEngine`: Ujian, pengerjaan, auto-submit.
- `apiClient.materials`: Modul belajar.
- `apiClient.analytics`: Metrik performa IRT.

---

## 🚀 Perintah Utama

```bash
# Install Dependensi
npm install

# Run Development Server
npm run dev

# Strict Type-Checking
npm run type-check
```
