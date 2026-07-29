````markdown
# 05_spacing_grid.md

> Product : YakinLulus.id  
> Document Type : Design System  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

Dokumen ini mendefinisikan sistem spacing, layout grid, alignment, dan aturan penempatan elemen pada seluruh antarmuka YakinLulus.id.

Spacing dan Grid System bertujuan untuk:

- menciptakan layout yang konsisten;
- meningkatkan keterbacaan;
- mempermudah implementasi frontend;
- mendukung responsive design;
- mengurangi inkonsistensi antar halaman.

Seluruh halaman wajib mengikuti sistem ini.

---

# 2. Philosophy

Layout yang baik tidak ditentukan oleh banyaknya elemen.

Layout yang baik ditentukan oleh bagaimana ruang kosong (Whitespace) digunakan.

Whitespace membantu pengguna:

- memahami prioritas informasi;
- mengurangi cognitive load;
- meningkatkan fokus;
- mempercepat proses scanning.

Prinsip utama:

> **Whitespace is a design element, not empty space.**

---

# 3. Design Principles

Grid System dibangun berdasarkan prinsip:

- Consistency
- Alignment
- Predictability
- Reusability
- Scalability
- Responsive by Default

---

# 4. Base Unit

Seluruh spacing menggunakan **Base Unit 4px**.

Semua nilai spacing merupakan kelipatan dari 4.

```
4

8

12

16

20

24

32

40

48

56

64

80

96

128
```

Tidak diperbolehkan menggunakan angka acak seperti:

```
11px

19px

37px
```

---

# 5. Spacing Scale

| Token | Value |
|---------|------:|
| space-1 | 4 px |
| space-2 | 8 px |
| space-3 | 12 px |
| space-4 | 16 px |
| space-5 | 20 px |
| space-6 | 24 px |
| space-8 | 32 px |
| space-10 | 40 px |
| space-12 | 48 px |
| space-14 | 56 px |
| space-16 | 64 px |
| space-20 | 80 px |
| space-24 | 96 px |
| space-32 | 128 px |

---

# 6. Grid System

Desktop menggunakan **12 Column Grid**.

```
|1|2|3|4|5|6|7|8|9|10|11|12|
```

Grid ini digunakan untuk:

- Dashboard
- CBT
- Learning Material
- Analytics
- Admin Panel

---

# 7. Breakpoints

| Device | Width |
|----------|-------|
| Mobile | 0–767 px |
| Tablet | 768–1023 px |
| Laptop | 1024–1439 px |
| Desktop | 1440–1919 px |
| Large Desktop | ≥1920 px |

---

# 8. Container Width

| Device | Max Width |
|----------|----------:|
| Mobile | 100% |
| Tablet | 100% |
| Laptop | 1200 px |
| Desktop | 1320 px |
| Large Desktop | 1440 px |

Container selalu berada di tengah (center aligned).

---

# 9. Column Layout

Desktop

```
12 Column
```

Tablet

```
8 Column
```

Mobile

```
4 Column
```

---

# 10. Gutter

| Device | Gutter |
|----------|--------|
| Desktop | 24 px |
| Tablet | 20 px |
| Mobile | 16 px |

---

# 11. Margin

Desktop

```
40 px
```

Tablet

```
32 px
```

Mobile

```
16 px
```

---

# 12. Sidebar Layout

Expanded

```
280 px
```

Collapsed

```
88 px
```

Content otomatis menyesuaikan sisa lebar layar.

---

# 13. Header Layout

Height

```
72 px
```

Horizontal Padding

```
24 px
```

Mobile

```
16 px
```

---

# 14. Card Layout

Internal Padding

```
24 px
```

Compact Card

```
16 px
```

Large Card

```
32 px
```

Gap antar Card

```
24 px
```

---

# 15. Section Spacing

Antar Section

```
48 px
```

Antar Widget

```
32 px
```

Antar Card

```
24 px
```

Antar Komponen

```
16 px
```

Antar Label dan Input

```
8 px
```

---

# 16. Form Layout

Field Gap

```
24 px
```

Label ke Input

```
8 px
```

Input ke Helper

```
4 px
```

Section Form

```
32 px
```

---

# 17. Button Spacing

Padding Horizontal

```
20 px
```

Padding Vertical

```
12 px
```

Gap Icon

```
8 px
```

Gap antar Button

```
12 px
```

---

# 18. Table Layout

Cell Padding

```
16 px
```

Header Height

```
56 px
```

Row Height

```
52 px
```

---

# 19. Dashboard Grid

Desktop

```
12 Column

+-------------------------------------------+

Greeting

Today's Goal

Continue Learning

Progress

AI Coach

Leaderboard

Calendar

Recent Activity

+-------------------------------------------+
```

Semua widget mengikuti grid 12 kolom.

---

# 20. Card Alignment

Semua isi card menggunakan:

```
Vertical Stack
```

```
Title

↓

Subtitle

↓

Content

↓

Action
```

Tidak menggunakan alignment acak.

---

# 21. Whitespace Rules

Semakin penting informasi,
semakin banyak ruang kosong yang diberikan.

Jangan memenuhi seluruh layar dengan konten.

Whitespace adalah bagian dari desain.

---

# 22. Responsive Rules

Desktop

Widget dapat tampil berdampingan.

Tablet

Widget mulai ditumpuk.

Mobile

Semua widget menggunakan satu kolom.

---

# 23. Nested Grid

Card yang kompleks dapat memiliki grid internal.

Contoh:

```
Course Card

+----------------------+

Title

Progress

Statistic

Button

+----------------------+
```

Tetap menggunakan Base Unit 4 px.

---

# 24. Alignment Rules

Seluruh komponen mengikuti alignment berikut:

- Left Alignment untuk teks.
- Center Alignment hanya untuk ikon atau ilustrasi.
- Right Alignment untuk angka atau nilai statistik.

---

# 25. Visual Rhythm

Gunakan ritme vertikal yang konsisten.

Contoh:

```
Heading

24 px

Content

32 px

Section

48 px
```

Pengguna harus dapat memindai halaman secara alami.

---

# 26. Grid Do

✔ Gunakan 12-column grid pada desktop.

✔ Gunakan Base Unit 4 px.

✔ Gunakan spacing berdasarkan Design Token.

✔ Pertahankan alignment yang konsisten.

✔ Gunakan whitespace untuk memperjelas hierarki.

---

# 27. Grid Don't

✘ Jangan menggunakan nilai spacing acak.

✘ Jangan membuat margin berbeda tanpa alasan.

✘ Jangan memenuhi layar dengan terlalu banyak widget.

✘ Jangan menggunakan alignment campuran dalam satu section.

✘ Jangan mengubah gutter antar halaman.

---

# 28. Design Token Mapping

```text
space.1

space.2

space.3

space.4

space.5

space.6

space.8

space.10

space.12

space.16

space.20

space.24

space.32
```

---

# 29. CSS Variable Mapping

```css
--space-1
--space-2
--space-3
--space-4
--space-5
--space-6
--space-8
--space-10
--space-12
--space-16
--space-20
--space-24
--space-32
```

---

# 30. Tailwind Mapping

| Design Token | Tailwind |
|---------------|----------|
| space-1 | p-1 / m-1 |
| space-2 | p-2 / m-2 |
| space-3 | p-3 / m-3 |
| space-4 | p-4 / m-4 |
| space-6 | p-6 / m-6 |
| space-8 | p-8 / m-8 |
| space-10 | p-10 / m-10 |
| space-12 | p-12 / m-12 |
| space-16 | p-16 / m-16 |

Design Token tetap menjadi acuan utama.

---

# 31. Flutter Mapping

```dart
AppSpacing.xs
AppSpacing.sm
AppSpacing.md
AppSpacing.lg
AppSpacing.xl
AppSpacing.xxl
```

---

# 32. Figma Structure

```
Spacing

├── 4
├── 8
├── 12
├── 16
├── 20
├── 24
├── 32
├── 40
├── 48
├── 56
├── 64
├── 80
├── 96
├── 128
```

Gunakan Variables agar sinkron dengan Design Token.

---

# 33. QA Checklist

- □ Seluruh spacing menggunakan token resmi.
- □ Tidak ada nilai spacing acak.
- □ Layout mengikuti grid yang ditentukan.
- □ Gutter konsisten.
- □ Margin konsisten.
- □ Alignment konsisten.
- □ Responsive telah diuji.
- □ Tidak terjadi overflow pada semua breakpoint.

---

# 34. Future Scalability

Spacing & Grid System dirancang untuk mendukung:

- Web
- Mobile
- Tablet
- Desktop
- Dashboard kompleks
- White Label
- Multi Workspace
- Future Modules

Tanpa mengubah Base Unit maupun Design Token.
````

---

## Rekomendasi

Untuk frontend, saya menyarankan menggunakan **8-point design methodology** dengan **base token 4px**.

Artinya:

* **4px** digunakan untuk micro spacing (icon, label, helper text).
* **8px** menjadi ritme utama layout.
* Nilai besar (16, 24, 32, 48, 64, dst.) tetap merupakan kelipatan yang konsisten.

Pendekatan ini memberikan fleksibilitas untuk komponen kecil sekaligus menjaga konsistensi visual pada layout yang lebih besar, dan sangat cocok untuk implementasi di React, Tailwind CSS, Flutter, maupun Figma Variables.
