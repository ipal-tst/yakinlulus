Saya juga ingin menaikkan standar **04_typography.md**.

Kebanyakan dokumentasi typography hanya berisi ukuran font. Untuk **YakinLulus.id**, saya ingin typography menjadi **Enterprise Typography System** yang mengatur seluruh hirarki teks, keterbacaan, implementasi, dan pemetaan ke frontend.

---

# 04_typography.md

````markdown
# 04_typography.md

> Product : YakinLulus.id
> Document Type : Design System
> Version : 1.0.0
> Status : Draft
> Owner : Product Design Team

---

# 1. Purpose

Dokumen ini mendefinisikan sistem tipografi yang digunakan pada seluruh antarmuka YakinLulus.id.

Typography System bertujuan untuk:

- meningkatkan keterbacaan;
- membangun hierarki informasi yang jelas;
- menciptakan konsistensi visual;
- mendukung aksesibilitas;
- mempermudah implementasi pada Frontend dan Flutter.

Seluruh halaman, komponen, dan konten wajib menggunakan sistem tipografi ini.

---

# 2. Typography Philosophy

Typography bukan sekadar memilih font.

Typography adalah alat komunikasi utama antara sistem dan pengguna.

Setiap ukuran, ketebalan, dan jarak antar huruf harus membantu pengguna memahami informasi lebih cepat.

Prinsip utama:

- Readability First
- Consistency First
- Accessibility First
- Responsive by Default

---

# 3. Font Family

## Primary Font

**Inter**

Digunakan untuk seluruh UI.

Karakteristik:

- modern
- sangat mudah dibaca
- optimal pada layar
- mendukung banyak bahasa
- performa tinggi

---

## Secondary Font

**Noto Sans**

Digunakan sebagai fallback.

Mendukung:

- Bahasa Indonesia
- Bahasa Inggris
- Unicode lengkap

---

## Monospace Font

**JetBrains Mono**

Digunakan untuk:

- code
- token
- API
- technical documentation

---

# 4. Font Stack

```css
font-family:
"Inter",
"Noto Sans",
system-ui,
sans-serif;
```

---

# 5. Typography Scale

Menggunakan skala 1.25 (Major Third).

| Token | Size | Weight | Line Height |
|--------|------|---------|------------|
| Display XL | 60 | 700 | 72 |
| Display L | 48 | 700 | 58 |
| Display M | 40 | 700 | 48 |
| H1 | 36 | 700 | 44 |
| H2 | 30 | 700 | 38 |
| H3 | 24 | 600 | 32 |
| H4 | 20 | 600 | 28 |
| H5 | 18 | 600 | 28 |
| H6 | 16 | 600 | 24 |
| Body XL | 18 | 400 | 30 |
| Body L | 16 | 400 | 28 |
| Body M | 14 | 400 | 24 |
| Body S | 13 | 400 | 20 |
| Caption | 12 | 400 | 18 |
| Overline | 11 | 600 | 16 |

Semua ukuran menggunakan satuan **px** pada desain dan **rem** pada implementasi frontend.

---

# 6. Font Weight

| Weight | Nilai | Penggunaan |
|----------|------|------------|
| Regular | 400 | Body |
| Medium | 500 | Label |
| SemiBold | 600 | Card Title |
| Bold | 700 | Heading |

Tidak menggunakan weight di luar empat nilai tersebut.

---

# 7. Line Height

Line height harus menjaga kenyamanan membaca.

| Jenis | Line Height |
|---------|------------|
| Heading | 120% |
| Body | 150% |
| Caption | 140% |
| Button | 100% |

---

# 8. Letter Spacing

| Jenis | Letter Spacing |
|--------|---------------|
| Display | -2% |
| Heading | -1% |
| Body | 0 |
| Caption | 0 |
| Overline | 8% |

---

# 9. Text Hierarchy

Urutan prioritas:

```
Display

↓

Heading

↓

Sub Heading

↓

Body

↓

Caption

↓

Helper Text

↓

Overline
```

Hierarki ini harus konsisten di seluruh aplikasi.

---

# 10. Usage Guidelines

## Display

Digunakan hanya pada:

- Landing Page
- Hero Section
- Empty State utama

Tidak digunakan pada dashboard.

---

## Heading

Digunakan sebagai judul halaman dan section.

---

## Body

Digunakan untuk seluruh isi konten.

---

## Caption

Digunakan untuk metadata, timestamp, label sekunder.

---

## Overline

Digunakan secara terbatas untuk kategori atau label kecil.

---

# 11. Dashboard Typography

| Area | Style |
|------|-------|
| Greeting | H2 |
| Widget Title | H5 |
| KPI Value | Display M |
| Progress | Body M |
| Card Title | H6 |
| Button | Body M Medium |
| Notification | Body S |
| Sidebar | Body M |
| Breadcrumb | Caption |

---

# 12. Button Typography

Semua button menggunakan:

- Body M
- Medium (500)
- Tidak menggunakan huruf kapital penuh (ALL CAPS)

Contoh:

✔ Mulai Belajar

✔ Lanjutkan CBT

✘ MULAI BELAJAR

---

# 13. Card Typography

Title

H6

Description

Body S

Statistic

Display M

Label

Caption

---

# 14. Form Typography

Label

Body M Medium

Input

Body M

Placeholder

Body M

Helper

Caption

Validation

Caption Medium

---

# 15. Responsive Typography

## Desktop

Menggunakan ukuran penuh.

---

## Tablet

Heading turun satu tingkat bila diperlukan.

---

## Mobile

- Display dikurangi
- Heading lebih kecil
- Body tetap 16px bila memungkinkan
- Hindari body di bawah 14px

---

# 16. Accessibility

Seluruh typography harus memenuhi:

- mudah dibaca;
- kontras sesuai WCAG 2.2 AA;
- tidak menggunakan ukuran terlalu kecil;
- line-height cukup;
- tidak mengandalkan warna sebagai penanda.

Minimum ukuran body:

```
14 px
```

Ideal:

```
16 px
```

---

# 17. Design Token Mapping

```text
font.family.primary

font.family.secondary

font.weight.regular

font.weight.medium

font.weight.semibold

font.weight.bold

font.size.h1

font.size.body

font.lineHeight.body

font.letterSpacing.normal
```

---

# 18. CSS Variable Mapping

```css
--font-family-primary

--font-size-h1

--font-size-body

--font-weight-bold

--line-height-body

--letter-spacing-normal
```

---

# 19. Tailwind Mapping

| Design Token | Tailwind |
|---------------|----------|
| Display XL | text-6xl |
| H1 | text-4xl |
| H2 | text-3xl |
| H3 | text-2xl |
| Body L | text-base |
| Body M | text-sm |
| Caption | text-xs |

Tailwind hanya digunakan sebagai referensi implementasi. Design Token tetap menjadi sumber utama.

---

# 20. Flutter Mapping

```dart
AppTypography.displayXL

AppTypography.h1

AppTypography.h2

AppTypography.bodyLarge

AppTypography.bodyMedium

AppTypography.caption
```

---

# 21. Figma Structure

```
Typography

├── Display
├── Heading
├── Body
├── Caption
├── Overline
```

Setiap style harus dibuat sebagai **Text Style** dan dihubungkan dengan **Variables** bila tersedia.

---

# 22. Do

✔ Gunakan Text Style resmi.

✔ Gunakan hierarki yang konsisten.

✔ Gunakan Body 16px untuk konten utama.

✔ Gunakan Heading untuk struktur halaman.

✔ Pertahankan line-height yang nyaman dibaca.

---

# 23. Don't

✘ Jangan menggunakan font selain yang ditentukan.

✘ Jangan menggunakan ALL CAPS untuk tombol.

✘ Jangan menggunakan lebih dari empat font weight.

✘ Jangan membuat ukuran font di luar Typography Scale.

✘ Jangan menggunakan body text di bawah 14px.

---

# 24. QA Checklist

- □ Semua teks menggunakan Text Style resmi.
- □ Hierarki heading konsisten.
- □ Body text minimal 14px.
- □ Line-height sesuai standar.
- □ Kontras memenuhi WCAG AA.
- □ Responsive typography telah diuji.
- □ Tidak ada font yang di-hardcode.

---

# 25. Future Scalability

Typography System dirancang agar mendukung:

- Web
- Mobile
- Tablet
- Desktop
- Dark Mode
- Multi Language
- White Label
- Future Brand Extension

Tanpa mengubah struktur Design Token maupun Component Library.
````

---

## Rekomendasi

Saya menyarankan menggunakan **Inter Variable Font** sebagai font utama, bukan file statis per weight. Keuntungannya:

* Ukuran file lebih kecil.
* Rendering lebih halus.
* Performa lebih baik.
* Mudah dipadukan dengan CSS Variables dan Design Tokens.

Dengan pendekatan ini, Typography System YakinLulus.id akan siap digunakan di React/Next.js, Flutter, dan Figma dengan sumber kebenaran (single source of truth) yang sama.
