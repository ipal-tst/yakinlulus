# 00_design_principle.md

> Version: 1.0
> Product: YakinLulus.id
> Document Type: Design System
> Status: Draft
> Owner: Product Design Team

---

# 1. Purpose

Dokumen ini menjadi landasan seluruh keputusan desain pada platform **YakinLulus.id**.

Semua halaman, fitur, komponen, ilustrasi, animasi, icon, typography, hingga interaksi pengguna **WAJIB** mengikuti prinsip yang dijelaskan pada dokumen ini.

Dokumen ini bertujuan agar seluruh produk memiliki:

- konsistensi visual
- konsistensi UX
- konsistensi branding
- mudah dipelajari
- scalable
- mudah dikembangkan
- mudah dipelihara

Design Principle merupakan **source of truth** seluruh UI Design.

---

# 2. Vision

> Membangun platform belajar yang terasa modern, profesional, cepat, menyenangkan, dan membuat siswa selalu ingin kembali belajar.

Dashboard bukan hanya tempat melihat statistik.

Dashboard harus menjadi:

> **Learning Command Center**

dimana siswa mengetahui dengan jelas:

- apa yang harus dipelajari
- dimana kelemahannya
- target hari ini
- perkembangan belajar
- ujian berikutnya
- rekomendasi AI

---

# 3. Design Philosophy

Design YakinLulus.id menggabungkan filosofi dari beberapa produk terbaik.

| Product | Inspiration |
|----------|------------|
| Linear | Clean Interface |
| Stripe Dashboard | Information hierarchy |
| Notion | Simplicity |
| Duolingo | Gamification |
| Google Material 3 | Accessibility |
| Apple Human Interface | Elegance |
| Vercel | White Space |
| GitHub | Developer Friendly |
| Khan Academy | Learning Experience |

---

# 4. Design Keywords

Semua keputusan desain harus memenuhi minimal keyword berikut.

```
Modern

Professional

Educational

Clean

Focused

Minimal

Friendly

Trustworthy

Accessible

Fast

Premium

Scalable
```

Jika suatu desain bertentangan dengan keyword di atas maka desain tersebut harus direvisi.

---

# 5. Product Personality

YakinLulus.id bukan game.

YakinLulus.id juga bukan LMS sekolah tradisional.

Personality produk adalah:

## Professional

Memberikan rasa percaya kepada sekolah, guru, dan orang tua.

---

## Friendly

Tidak terasa kaku.

Siswa merasa nyaman belajar.

---

## Motivating

UI selalu memberikan motivasi.

Contoh:

✔ Good Morning

✔ Great Job

✔ Keep Learning

✔ 20 Questions Completed

---

## Smart

Platform terlihat "AI First"

AI menjadi bagian alami dari produk.

Bukan sekadar chatbot.

---

## Premium

Walaupun versi gratis, UI harus terasa premium.

---

# 6. User Experience Principles

## Principle 1

### Learning First

Semua halaman harus membantu siswa belajar.

Bukan sekadar menampilkan data.

Prioritas:

```
Learning

↓

Practice

↓

CBT

↓

Analytics
```

Bukan sebaliknya.

---

## Principle 2

### Action over Information

Dashboard harus selalu mendorong tindakan.

Bukan statistik.

Contoh buruk:

```
Accuracy

82%
```

Contoh baik:

```
Accuracy

82%

AI merekomendasikan latihan Persamaan Linear.

[Mulai Sekarang]
```

---

## Principle 3

### One Primary Action

Setiap halaman hanya memiliki satu CTA utama.

Contoh Dashboard:

```
Continue Learning
```

Bukan

```
Continue

Practice

AI

Exam

Download

Leaderboard

Settings
```

semuanya sama besar.

---

## Principle 4

### Reduce Cognitive Load

Jangan membuat pengguna berpikir.

UI harus menjawab:

Apa yang harus dilakukan berikutnya?

---

## Principle 5

### Progressive Disclosure

Informasi kompleks disembunyikan sampai diperlukan.

Contoh:

```
Question Detail

↓

klik

↓

baru muncul metadata
```

---

## Principle 6

### Recognition over Recall

User tidak boleh menghafal.

Gunakan:

- icon
- warna
- ilustrasi
- badge
- avatar

---

## Principle 7

### Consistency

Semua halaman memiliki pola yang sama.

Misal:

Search selalu di atas.

Sidebar selalu kiri.

Profile selalu kanan atas.

---

# 7. Information Hierarchy

Prioritas informasi.

```
Primary

↓

Secondary

↓

Supporting

↓

Decoration
```

Contoh Dashboard

```
Today's Goal

Continue Learning

Upcoming CBT

AI Recommendation

Progress

Achievement

Leaderboard

Analytics

Footer
```

---

# 8. Layout Philosophy

Menggunakan:

```
Sidebar

+

Top Navigation

+

Card Layout
```

Tidak menggunakan top navigation penuh.

---

Desktop

```
+------------------------------------------------------+

Sidebar

|

Content

|

Inspector(optional)

+------------------------------------------------------+
```

---

# 9. Navigation Philosophy

Navigation harus:

Predictable

Simple

Expandable

Scalable

Target maksimum menu:

```
30+
```

Menggunakan:

Sidebar Collapsible.

---

# 10. Dashboard Philosophy

Dashboard bukan halaman statistik.

Dashboard adalah:

```
Learning Command Center
```

Urutan widget.

```
Greeting

↓

Today's Goal

↓

Continue Learning

↓

Upcoming CBT

↓

AI Recommendation

↓

Weak Topic

↓

Progress

↓

Leaderboard

↓

Achievement

↓

Analytics
```

---

# 11. AI First Philosophy

AI bukan fitur tambahan.

AI adalah bagian utama produk.

AI muncul pada:

- Dashboard
- Practice
- CBT Result
- Learning Material
- Search
- Recommendation
- Weak Topic
- Explanation

AI selalu memberi aksi.

Contoh:

```
Kamu lemah di Integral.

↓

Mulai latihan 15 soal.
```

---

# 12. Gamification Philosophy

Gamification digunakan untuk meningkatkan motivasi.

Bukan membuat produk seperti game.

Elemen:

- XP
- Badge
- Achievement
- Daily Goal
- Weekly Goal
- Level
- Study Streak
- Leaderboard

Tidak boleh berlebihan.

---

# 13. Visual Language

Visual harus:

Flat

Modern

Rounded

Soft Shadow

High Contrast

Minimal Decoration

White Space Dominant

---

Tidak menggunakan:

Heavy Gradient

Glassmorphism berlebihan

Skeuomorphism

Neumorphism

Over Animation

---

# 14. Color Philosophy

Brand Identity:

Blue

Green

Gold

Dominasi:

```
60%

White

25%

Blue

10%

Green

5%

Gold
```

Makna.

Blue

```
Trust

Education

Technology
```

Green

```
Growth

Success

Progress
```

Gold

```
Achievement

Premium

Reward
```

---

# 15. Typography Philosophy

Typography lebih penting daripada dekorasi.

Gunakan maksimal:

```
Heading

Body

Caption
```

Hindari banyak variasi.

Target:

High Readability.

---

# 16. Motion Philosophy

Animation digunakan untuk:

Memberikan feedback.

Bukan hiburan.

Durasi.

```
100–250ms
```

Tidak ada animasi lebih dari:

```
400ms
```

---

# 17. Accessibility First

Target:

WCAG AA

Minimal.

Semua halaman harus:

✔ Keyboard Friendly

✔ Screen Reader Friendly

✔ High Contrast

✔ Color Blind Friendly

✔ Focus Indicator

✔ Touch Friendly

---

# 18. Performance Principle

Design harus mempertimbangkan performa.

Hindari:

100 chart

100 animation

Large illustration

Heavy SVG

Autoplay video

Target.

Dashboard tampil:

< 2 detik

---

# 19. Responsive Philosophy

Design dibuat dengan urutan:

```
Desktop

↓

Tablet

↓

Mobile
```

Bukan sebaliknya.

Karena CBT lebih banyak digunakan pada Laptop dan Desktop.

---

# 20. Component Philosophy

Semua UI dibangun menggunakan reusable component.

Tidak boleh membuat button baru jika button sudah tersedia.

Semua komponen berasal dari:

Component Library.

---

# 21. Design System Rules

Semua halaman WAJIB menggunakan:

- Color System
- Typography
- Spacing
- Icon System
- Component Library
- Grid System
- Motion System

Tidak boleh membuat style sendiri.

---

# 22. Success Metrics

Design dianggap berhasil jika memenuhi KPI berikut.

| Metric | Target |
|---------|--------|
| Task Success Rate | >95% |
| Navigation Success | >95% |
| Time to Find Feature | <10 detik |
| Dashboard Load Perception | <2 detik |
| User Satisfaction (SUS) | >85 |
| Accessibility Score | AA |
| Lighthouse Accessibility | >95 |
| Lighthouse Best Practice | >95 |
| Mobile Responsive | 100% |
| UI Consistency | 100% |

---

# 23. Definition of Good Design

Desain dianggap baik apabila:

- Pengguna memahami halaman dalam waktu kurang dari 5 detik.
- Pengguna mengetahui tindakan berikutnya tanpa perlu berpikir.
- Informasi penting terlihat tanpa melakukan scroll pada resolusi desktop umum (1920×1080).
- Komponen memiliki perilaku yang konsisten di seluruh aplikasi.
- Antarmuka tetap nyaman digunakan pada mode terang maupun gelap.
- Performa visual tidak mengorbankan kecepatan aplikasi.

---

# 24. Design Motto

> **Learn Faster. Think Less. Achieve More.**

Setiap keputusan desain harus mendukung tiga tujuan tersebut:

- Mempercepat proses belajar.
- Mengurangi beban berpikir saat menggunakan aplikasi.
- Membantu siswa mencapai hasil belajar yang lebih baik.