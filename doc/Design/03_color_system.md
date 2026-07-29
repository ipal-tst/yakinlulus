Saya juga ingin menaikkan kualitas **03_color_system.md**.

Menurut saya, kebanyakan Design System hanya berisi daftar HEX color. Itu kurang berguna bagi developer maupun designer.

Untuk **YakinLulus.id**, saya ingin Color System menjadi **Enterprise Color Specification**, bukan sekadar palet warna.

---

# Struktur yang saya rekomendasikan

```markdown
# 03_color_system.md

1. Document Information

2. Purpose

3. Color Philosophy

4. Brand Color Identity

5. Semantic Color System

6. Neutral Color System

7. Functional Color System

8. Light Theme Palette

9. Dark Theme Palette

10. Surface System

11. Text Color System

12. Border Color System

13. State Color System

14. Component Color Mapping

15. Data Visualization Colors

16. Accessibility

17. Color Usage Rules

18. Do & Don't

19. Design Token Mapping

20. Tailwind Mapping

21. CSS Variable Mapping

22. Flutter Mapping

23. Figma Variable Mapping

24. QA Checklist

25. Future Scalability
```

---

# 03_color_system.md

````markdown
# 03_color_system.md

> Product : YakinLulus.id
> Version : 1.0.0
> Status : Draft

---

# 1. Purpose

Dokumen ini mendefinisikan seluruh sistem warna yang digunakan pada platform YakinLulus.id.

Seluruh halaman, komponen, ilustrasi, chart, icon, hingga state UI wajib menggunakan warna yang berasal dari Color System ini.

Tidak diperbolehkan menggunakan warna di luar sistem tanpa persetujuan Design Review.

---

# 2. Color Philosophy

Warna bukan sekadar estetika.

Setiap warna harus memiliki makna, fungsi, dan konsistensi.

Color System dibangun berdasarkan tiga tujuan utama:

- meningkatkan keterbacaan
- memperjelas status antarmuka
- memperkuat identitas merek

---

# 3. Brand Identity

YakinLulus.id menggunakan tiga warna utama.

## Primary Blue

Melambangkan:

- Kepercayaan
- Pendidikan
- Teknologi

```
Blue 500

#1565C0
```

---

## Secondary Green

Melambangkan:

- Pertumbuhan
- Kemajuan
- Keberhasilan

```
Green 500

#2E7D32
```

---

## Accent Gold

Melambangkan:

- Prestasi
- Penghargaan
- Premium

```
Gold 500

#F9A825
```

---

# 4. Brand Palette

## Blue Scale

| Token | HEX |
|--------|------|
| Blue 50 | #E3F2FD |
| Blue 100 | #BBDEFB |
| Blue 200 | #90CAF9 |
| Blue 300 | #64B5F6 |
| Blue 400 | #42A5F5 |
| Blue 500 | #1565C0 |
| Blue 600 | #0D47A1 |
| Blue 700 | #0B3D91 |
| Blue 800 | #082F6B |
| Blue 900 | #061F4A |

---

## Green Scale

| Token | HEX |
|--------|------|
| Green 50 | #E8F5E9 |
| Green 100 | #C8E6C9 |
| Green 200 | #A5D6A7 |
| Green 300 | #81C784 |
| Green 400 | #66BB6A |
| Green 500 | #2E7D32 |
| Green 600 | #1B5E20 |
| Green 700 | #145A32 |
| Green 800 | #0E4429 |
| Green 900 | #082D1C |

---

## Gold Scale

| Token | HEX |
|--------|------|
| Gold 50 | #FFF8E1 |
| Gold 100 | #FFECB3 |
| Gold 200 | #FFE082 |
| Gold 300 | #FFD54F |
| Gold 400 | #FFCA28 |
| Gold 500 | #F9A825 |
| Gold 600 | #F57F17 |
| Gold 700 | #E65100 |
| Gold 800 | #BF6500 |
| Gold 900 | #8D4A00 |

---

# 5. Neutral Palette

## Gray Scale

| Token | HEX |
|--------|------|
| Gray 50 | #F8FAFC |
| Gray 100 | #F1F5F9 |
| Gray 200 | #E2E8F0 |
| Gray 300 | #CBD5E1 |
| Gray 400 | #94A3B8 |
| Gray 500 | #64748B |
| Gray 600 | #475569 |
| Gray 700 | #334155 |
| Gray 800 | #1E293B |
| Gray 900 | #0F172A |

---

# 6. Semantic Colors

## Success

```
#16A34A
```

---

## Warning

```
#F59E0B
```

---

## Error

```
#DC2626
```

---

## Info

```
#0284C7
```

---

# 7. Light Theme

| Element | Color |
|----------|---------|
| Background | Gray 50 |
| Surface | White |
| Card | White |
| Sidebar | White |
| Header | White |
| Border | Gray 200 |
| Divider | Gray 200 |

---

# 8. Dark Theme

| Element | Color |
|----------|---------|
| Background | Gray 900 |
| Surface | Gray 800 |
| Card | Gray 800 |
| Sidebar | Gray 900 |
| Header | Gray 900 |
| Border | Gray 700 |
| Divider | Gray 700 |

---

# 9. Text Color

| Type | Token |
|------|-------|
| Primary | Gray 900 |
| Secondary | Gray 600 |
| Tertiary | Gray 500 |
| Disabled | Gray 400 |
| Inverse | White |

---

# 10. Border Color

Default

```
Gray 200
```

Hover

```
Blue 300
```

Focus

```
Blue 500
```

Error

```
Error
```

---

# 11. State Color

Hover

```
Opacity 8%
```

Pressed

```
Opacity 12%
```

Selected

```
Blue 50
```

Disabled

```
Gray 200
```

---

# 12. Component Mapping

Primary Button

```
Background

Blue 500

Hover

Blue 600

Text

White
```

Secondary Button

```
Background

Green 500
```

Premium Button

```
Gold 500
```

Danger Button

```
Error
```

---

# 13. Dashboard Mapping

Greeting

```
Blue
```

Progress

```
Green
```

Achievement

```
Gold
```

Leaderboard

```
Gold
```

Notification

```
Red
```

AI Widget

```
Blue
```

---

# 14. Chart Colors

Progress

```
Green
```

Accuracy

```
Blue
```

Wrong Answer

```
Red
```

Recommendation

```
Gold
```

Inactive

```
Gray
```

---

# 15. Accessibility

Seluruh kombinasi warna wajib memenuhi:

WCAG 2.2 AA

Minimum contrast:

4.5 : 1

Tidak boleh menggunakan warna sebagai satu-satunya indikator status.

Selalu gunakan:

- icon
- label
- text

---

# 16. Color Usage Rules

Blue

✔ Primary Action

✔ Active Navigation

✔ Focus

Green

✔ Success

✔ Progress

✔ Completed

Gold

✔ Achievement

✔ Premium

✔ Rank

Red

✔ Error

✔ Delete

✔ Critical

Gray

✔ Background

✔ Divider

✔ Disabled

---

# 17. Do

✔ Gunakan Semantic Color

✔ Gunakan Token

✔ Gunakan Gray untuk Background

✔ Gunakan Gold secukupnya

---

# 18. Don't

✘ Jangan menggunakan ungu sebagai warna utama

✘ Jangan menggunakan gradient berlebihan

✘ Jangan menggunakan warna di luar token

✘ Jangan menggunakan Gold sebagai background utama

---

# 19. Design Token

```
color.primary.500

color.success.500

color.warning.500

color.error.500

color.gray.500
```

---

# 20. Tailwind Mapping

```
primary

blue-700

success

green-700

warning

amber-500

danger

red-600

neutral

slate
```

---

# 21. CSS Variable

```css
--color-primary

--color-success

--color-warning

--color-error

--color-background

--color-surface

--color-border
```

---

# 22. Flutter

```dart
AppColors.primary

AppColors.success

AppColors.warning

AppColors.error

AppColors.surface

AppColors.background
```

---

# 23. Figma Variable

```
Primitive

↓

Semantic

↓

Component

↓

Theme
```

Menggunakan Variable Collection.

---

# 24. QA Checklist

□ Contrast AA

□ Dark Mode

□ Hover

□ Disabled

□ Focus

□ Error

□ Success

□ Responsive

---

# 25. Future Scalability

Color System dirancang agar mendukung:

- Light Theme
- Dark Theme
- High Contrast Mode
- White Label Theme
- School Theme
- Seasonal Theme

Tanpa mengubah struktur Design Token.
````

---

# ⭐ Saya punya satu rekomendasi besar

Menurut saya kita **tidak perlu memakai Material Design Color** sebagai basis (`Blue 50–900`, `Green 50–900`).

Karena **YakinLulus.id adalah produk sendiri**, saya lebih menyarankan kita membuat **brand palette khusus** (custom palette) dengan 10 shade yang dioptimalkan untuk UI modern, mirip pendekatan **Tailwind CSS v4**, **Radix Colors**, atau **shadcn/ui**.

Keuntungannya:

* Identitas visual lebih kuat dan unik.
* Light mode dan Dark mode lebih harmonis.
* Komponen terlihat lebih premium.
* Konsisten dengan Design Token modern.

Saya sangat menyarankan kita membangun **custom color palette** daripada mengadopsi palet Material secara langsung. Menurut saya, ini akan membuat identitas visual YakinLulus.id jauh lebih kuat dan profesional.
