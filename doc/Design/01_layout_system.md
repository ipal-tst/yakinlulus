# 01_layout_system.md

> Version: 1.0
> Product: YakinLulus.id
> Document Type: Design System
> Status: Draft
> Owner: Product Design Team

---

# 1. Purpose

Dokumen ini mendefinisikan standar layout yang digunakan pada seluruh halaman YakinLulus.id.

Layout System bertujuan untuk:

- menjaga konsistensi visual
- mempermudah navigasi
- meningkatkan usability
- mempercepat pengembangan frontend
- mempermudah responsive design
- mendukung scalability produk

Semua halaman WAJIB mengikuti Layout System ini.

---

# 2. Layout Philosophy

Layout YakinLulus.id mengikuti prinsip:

> **Navigation is Fixed. Content is Flexible.**

Artinya:

- Navigation selalu berada pada lokasi yang konsisten.
- Area konten menjadi fleksibel sesuai kebutuhan fitur.
- User tidak perlu mempelajari ulang setiap halaman.

---

# 3. Design Goals

Layout harus memenuhi prinsip berikut:

- Predictable
- Minimal Cognitive Load
- Fast Navigation
- Responsive
- Expandable
- Modular
- Consistent

---

# 4. Global Application Layout

Desktop menggunakan struktur berikut.

```

+--------------------------------------------------------------------------------------+
| Sidebar | Header                                              | Profile              |
|---------|-----------------------------------------------------|----------------------|
|         |                                                     |                      |
|         |                                                     |                      |
|         |                                                     |                      |
|         |               Main Content                          |                      |
|         |                                                     |                      |
|         |                                                     |                      |
|         |                                                     |                      |
|         |-----------------------------------------------------|----------------------|
|         | Footer (Optional)                                   |                      |
+--------------------------------------------------------------------------------------+

```

---

# 5. Global Regions

## Sidebar

Fungsi:

- Primary Navigation

Posisi:

Left

Lebar:

```

Expanded

280 px

Collapsed

88 px

```

Selalu fixed.

---

## Header

Berisi:

- Search
- Notification
- AI Quick Action
- Theme Switch
- User Menu

Tidak boleh berisi navigation utama.

---

## Main Content

Area utama.

Menggunakan:

12 Column Grid.

---

## Right Panel (Optional)

Digunakan pada halaman tertentu.

Contoh:

Question Bank

AI Chat

Exam

Analytics

---

# 6. Grid System

Desktop

```

12 Columns

```

Tablet

```

8 Columns

```

Mobile

```

4 Columns

```

---

# 7. Max Content Width

Desktop

```

1600 px
```

Large Monitor

```

1920 px

```

Ultra Wide

Content tetap centered.

---

# 8. Safe Area

```

24 px

```

Minimal.

Tidak boleh ada komponen menempel ke tepi layar.

---

# 9. Margin

Desktop

```

32 px

```

Tablet

```

24 px

```

Mobile

```

16 px

```

---

# 10. Content Width Rules

Dashboard

```

100%

```

Question Bank

```

100%

```

Exam

```

100%

```

Learning Material

```

90%

```

Reading Mode

```

860 px

```

Supaya nyaman dibaca.

---

# 11. Card Layout Philosophy

Semua informasi menggunakan Card.

```

+--------------------------+

Title

Content

Action

+--------------------------+

```

Tidak menggunakan section tanpa card.

---

# 12. Card Rules

Minimal Padding

```

24 px

```

Radius

```

16 px

```

Shadow

```

Soft Shadow

```

Tidak menggunakan border tebal.

---

# 13. White Space Rules

White Space lebih penting daripada dekorasi.

Target.

```

30%

White Space

```

Dashboard tidak boleh terasa penuh.

---

# 14. Header Layout

```

+------------------------------------------------------------+

Logo

Search

Spacer

Quick Action

Notification

Theme

Profile

+------------------------------------------------------------+

```

Search selalu di tengah.

---

# 15. Sidebar Layout

```

Logo

──────────────

Dashboard

Courses

Practice

CBT

AI Tutor

Progress

Leaderboard

Schedule

Downloads

Forum

──────────────

Settings

Support

Premium

──────────────

Profile

```

---

# 16. Sidebar Behavior

Expanded

```

280 px

```

Collapsed

```

88 px

```

Collapsed hanya icon.

Tooltip muncul ketika hover.

---

# 17. Sticky Elements

Selalu sticky.

Sidebar

Header

Notification

AI Floating Button (opsional)

---

# 18. Scroll Behavior

Sidebar

Independent Scroll.

Content

Independent Scroll.

Header

Tidak ikut scroll.

---

# 19. Dashboard Layout

```

Greeting

Today's Goal

Progress

↓

Continue Learning

↓

Upcoming CBT

↓

AI Recommendation

↓

Subject Progress

↓

Weak Topic

↓

Recent Activity

↓

Achievement

↓

Leaderboard

↓

Study Heatmap

```

---

# 20. Reading Layout

Untuk materi.

Lebar maksimal.

```

860 px

```

Supaya nyaman membaca.

Tidak fullscreen.

---

# 21. Exam Layout

Mode Focus.

```

+------------------------------------------------------+

Question

Question Image

Choices

Navigation

Timer

+------------------------------------------------------+

```

Sidebar disembunyikan.

Header minimal.

---

# 22. AI Chat Layout

Desktop.

```

Content

|

AI Panel

```

Panel kanan.

Lebar.

```

420 px

```

---

# 23. Empty State

Semua halaman memiliki Empty State.

```

Illustration

Title

Description

Primary Button

```

---

# 24. Loading State

Menggunakan Skeleton.

Tidak menggunakan Spinner untuk seluruh halaman.

---

# 25. Error State

```

Illustration

Title

Description

Retry Button

```

---

# 26. Responsive Breakpoints

| Device | Width |
|---------|------|
| Mobile S | 360 |
| Mobile | 390 |
| Mobile L | 480 |
| Tablet | 768 |
| Laptop | 1024 |
| Desktop | 1280 |
| Large Desktop | 1440 |
| XL | 1600 |
| XXL | 1920 |

---

# 27. Desktop Layout

```

Sidebar

280

Header

80

Content

Flexible

```

---

# 28. Tablet Layout

Sidebar menjadi:

Drawer.

Header tetap.

Grid menjadi:

8 Column.

---

# 29. Mobile Layout

Sidebar berubah menjadi:

Bottom Navigation.

```

Dashboard

Practice

CBT

AI

Profile

```

Search dipindahkan menjadi halaman tersendiri.

---

# 30. Widget Priority

Dashboard.

Priority 1

- Greeting
- Today's Goal
- Continue Learning

Priority 2

- Upcoming CBT
- AI Recommendation

Priority 3

- Subject Progress
- Weak Topic

Priority 4

- Leaderboard
- Achievement

Priority 5

- Analytics

---

# 31. Z-Index Standard

| Layer | Z |
|--------|---|
| Content | 1 |
| Card Hover | 5 |
| Sticky Header | 20 |
| Sidebar | 30 |
| Dropdown | 100 |
| Popover | 110 |
| Modal | 1000 |
| Toast | 1200 |
| Loading Overlay | 1500 |

---

# 32. Layout Do

✔ Gunakan card

✔ Banyak white space

✔ Sidebar tetap

✔ Header sederhana

✔ Grid konsisten

✔ Maksimal 3 level visual hierarchy

---

# 33. Layout Don't

✘ Jangan gunakan lebih dari 4 kolom card pada desktop

✘ Jangan membuat halaman penuh tabel tanpa filter

✘ Jangan membuat card saling menempel

✘ Jangan meletakkan lebih dari satu CTA utama dalam satu viewport

✘ Jangan menggunakan popup untuk navigasi utama

---

# 34. Engineering Guidelines

Frontend wajib menggunakan Layout Components berikut:

```

<AppShell>

<Sidebar>

<Header>

<PageContainer>

<ContentGrid>

<Card>

<Section>

```

Tidak diperbolehkan membuat layout secara manual pada setiap halaman.

---

# 35. Accessibility Requirements

- Sidebar dapat diakses menggunakan keyboard.
- Header dapat dinavigasi menggunakan Tab.
- Skip to Content tersedia untuk screen reader.
- Fokus keyboard selalu terlihat.
- Layout tidak berubah drastis ketika zoom browser hingga 200%.

---

# 36. Performance Considerations

Target layout:

- First Contentful Paint < 1.8 detik
- Largest Contentful Paint < 2.5 detik
- CLS < 0.1
- Tidak ada layout shift saat data selesai dimuat.
- Skeleton digunakan untuk menjaga stabilitas layout.

---

# 37. Acceptance Criteria

Layout dianggap memenuhi standar apabila:

- Semua halaman menggunakan App Shell yang sama.
- Sidebar, Header, dan Grid mengikuti spesifikasi.
- Tidak ada komponen keluar dari grid.
- White space konsisten.
- Layout tetap nyaman digunakan pada semua breakpoint.
- Semua halaman lulus pengujian responsive.
- Tidak terjadi horizontal scrolling pada resolusi yang didukung.

---

# 38. Future Scalability

Layout dirancang agar mampu mendukung:

- 30+ menu navigasi
- Multi-role (Student, Teacher, Admin)
- Split View
- AI Assistant Panel
- Multi Workspace
- Plugin System
- Multi Language
- White Label Deployment

Tidak diperlukan perubahan struktur layout ketika fitur baru ditambahkan.

---

# 39. Layout Principles Summary

> **Consistent Navigation**
>
> **Flexible Content**
>
> **Modular Components**
>
> **Whitespace over Decoration**
>
> **Action before Analytics**
>
> **Desktop First, Responsive Always**