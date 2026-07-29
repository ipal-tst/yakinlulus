````markdown
# 21_responsive_design.md

> Product : YakinLulus.id  
> Module : Responsive Design System  
> Document Type : UI/UX Specification  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

Responsive Design memastikan seluruh fitur YakinLulus.id dapat digunakan dengan nyaman pada berbagai ukuran layar tanpa mengurangi fungsionalitas.

Target perangkat:

- Mobile Phone
- Tablet
- Laptop
- Desktop
- Ultra Wide Monitor

Prinsip utama:

> **Mobile First + Progressive Enhancement**

---

# 2. Design Goals

Responsive Design bertujuan untuk:

- memberikan pengalaman yang konsisten;
- mengoptimalkan ruang layar;
- menjaga performa;
- meminimalkan scrolling horizontal;
- meningkatkan usability pada seluruh perangkat.

---

# 3. Responsive Principles

Seluruh halaman mengikuti prinsip:

- Mobile First
- Fluid Layout
- Flexible Grid
- Flexible Component
- Adaptive Navigation
- Consistent Experience

---

# 4. Supported Breakpoints

## Mobile Small

```
320 – 375 px
```

Contoh:

- iPhone SE

---

## Mobile

```
376 – 767 px
```

Contoh:

- Android
- iPhone

---

## Tablet

```
768 – 1023 px
```

Contoh:

- iPad Mini
- iPad Air

---

## Laptop

```
1024 – 1439 px
```

---

## Desktop

```
1440 – 1919 px
```

---

## Large Desktop

```
≥1920 px
```

---

# 5. Breakpoint Token

```
sm

md

lg

xl

2xl
```

Mapping:

```
sm

640 px

md

768 px

lg

1024 px

xl

1280 px

2xl

1536 px
```

Mengikuti Tailwind CSS v4.

---

# 6. Layout Strategy

Desktop

```
Sidebar

+

Content
```

Tablet

```
Collapsible Sidebar

+

Content
```

Mobile

```
Drawer

+

Bottom Navigation
```

---

# 7. Container Width

Desktop

```
1440 px
```

Maximum

Ultra Wide

```
1600 px
```

Content tetap berada di tengah.

---

# 8. Grid System

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

# 9. Column Gap

Desktop

```
24 px
```

Tablet

```
20 px
```

Mobile

```
16 px
```

---

# 10. Margin

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

# 11. Sidebar Behavior

Desktop

```
Expanded

240 px
```

Collapse

```
72 px
```

Tablet

```
Overlay
```

Mobile

```
Drawer
```

---

# 12. Header Behavior

Desktop

Sticky

Tablet

Sticky

Mobile

Sticky

Header selalu tampil.

---

# 13. Navigation Behavior

Desktop

Sidebar

Tablet

Sidebar Collapse

Mobile

Bottom Navigation

Drawer

---

# 14. Dashboard Layout

Desktop

```
4 KPI

↓

2 Chart

↓

Table
```

Tablet

```
2 KPI

↓

Chart

↓

Table
```

Mobile

```
1 KPI

↓

Chart

↓

List
```

---

# 15. Card Layout

Desktop

```
4 Column
```

Tablet

```
2 Column
```

Mobile

```
1 Column
```

---

# 16. Table Responsive

Desktop

Table penuh.

Tablet

Horizontal Scroll.

Mobile

Card View.

Tidak memaksa tabel penuh di layar kecil.

---

# 17. Form Responsive

Desktop

```
2 Column
```

Tablet

```
2 Column
```

Mobile

```
1 Column
```

---

# 18. Chart Responsive

Desktop

```
320 px
```

Tablet

```
280 px
```

Mobile

```
220 px
```

Legenda berpindah ke bawah pada mobile.

---

# 19. Image Responsive

Semua gambar menggunakan:

```
max-width:100%
height:auto
```

Tidak boleh overflow.

---

# 20. Typography Scaling

Display

Desktop

```
48 px
```

Tablet

```
40 px
```

Mobile

```
32 px
```

Heading

Desktop

```
32 px
```

Tablet

```
28 px
```

Mobile

```
24 px
```

Body

Desktop

```
16 px
```

Tablet

```
16 px
```

Mobile

```
15–16 px
```

---

# 21. Button Responsive

Desktop

```
Height

48 px
```

Tablet

```
44 px
```

Mobile

```
44 px
```

Touch Target

```
44 × 44 px
```

Minimum.

---

# 22. Spacing Responsive

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

Menggunakan Design Token.

---

# 23. AI Tutor Responsive

Desktop

Sidebar Chat

+

Chat

Tablet

Drawer History

Mobile

Full Screen Chat

Sticky Input

---

# 24. Learning Material Responsive

Desktop

Grid

Tablet

2 Column

Mobile

1 Column

---

# 25. Question Bank Responsive

Desktop

Table

Tablet

Table Scroll

Mobile

Card List

---

# 26. CBT Responsive

Desktop

Question + Palette

Tablet

Palette Collapse

Mobile

Question Full Width

Bottom Navigation

Timer tetap terlihat.

---

# 27. Dashboard Widget Responsive

Desktop

```
4 Widget
```

Tablet

```
2 Widget
```

Mobile

```
1 Widget
```

---

# 28. Modal Responsive

Desktop

Centered

Tablet

Centered

Mobile

Bottom Sheet

atau

Full Screen

---

# 29. Drawer Responsive

Desktop

Side Drawer

Tablet

Overlay

Mobile

Bottom Sheet

---

# 30. Empty State

Ilustrasi otomatis mengecil pada mobile.

CTA tetap mudah dijangkau.

---

# 31. Responsive Images

Gunakan:

- Lazy Loading
- WebP
- AVIF (jika tersedia)
- srcset
- sizes

---

# 32. Performance

Target:

- CLS < 0.1
- LCP < 2.5 s
- TTI < 3 s

---

# 33. Responsive Utilities

Gunakan utility Tailwind:

```
sm:

md:

lg:

xl:

2xl:
```

Tidak menggunakan media query manual kecuali diperlukan.

---

# 34. Component Responsive Matrix

| Component | Desktop | Tablet | Mobile |
|------------|----------|---------|---------|
| Sidebar | Expanded | Overlay | Drawer |
| Header | Sticky | Sticky | Sticky |
| Dashboard | 4 Col | 2 Col | 1 Col |
| Table | Full | Scroll | Card |
| Chart | Large | Medium | Small |
| Form | 2 Col | 2 Col | 1 Col |
| AI Chat | Split | Drawer | Full |
| CBT | Split | Collapse | Full |
| Modal | Center | Center | Full |

---

# 35. Device Testing

Target minimal:

Mobile

- 320 px
- 360 px
- 390 px
- 414 px

Tablet

- 768 px
- 820 px
- 1024 px

Desktop

- 1280 px
- 1366 px
- 1440 px
- 1600 px
- 1920 px

---

# 36. Browser Testing

Desktop

- Chrome
- Edge
- Firefox
- Safari

Mobile

- Chrome Android
- Safari iOS
- Samsung Internet

---

# 37. QA Checklist

□ Tidak ada horizontal scroll.

□ Sidebar berubah sesuai breakpoint.

□ Navigation sesuai perangkat.

□ Typography tetap terbaca.

□ Chart responsif.

□ Table berubah menjadi Card View pada mobile.

□ Form satu kolom di mobile.

□ Modal menjadi Bottom Sheet di mobile.

□ Gambar tidak overflow.

□ Touch Target ≥44 px.

□ CLS memenuhi target.

□ Performa tetap baik.

□ Semua halaman lolos pengujian breakpoint.

---

# 38. Recommended Tech Stack

Layout

- CSS Grid
- Flexbox

Framework

- Tailwind CSS v4

Responsive Helper

- Tailwind Container
- CSS Container Query (opsional)

Image

- Next.js Image
- Lazy Loading

Testing

- Chrome DevTools
- Responsively App
- BrowserStack

---

# 39. Best Practices

Gunakan:

✔ Mobile First

✔ CSS Grid

✔ Flexbox

✔ Fluid Width

✔ Responsive Typography

✔ Responsive Image

✔ Adaptive Navigation

✔ Card View untuk data kompleks

✔ Design Token

Hindari:

✖ Fixed Width

✖ Horizontal Scroll

✖ Fixed Height berlebihan

✖ Font terlalu kecil

✖ Sidebar penuh pada mobile

✖ Table besar tanpa adaptasi

✖ Hardcoded Breakpoint

---

# 40. Future Enhancement

Dirancang mendukung:

- Foldable Device
- Dual Screen
- Smart TV (Dashboard)
- PWA Standalone
- Desktop App (Electron/Tauri)
- Landscape Learning Mode
- Responsive Container Query
- Adaptive Dashboard Layout

---

# 41. Responsive Strategy per Module

## Student

- Mobile sebagai prioritas utama.
- Bottom Navigation.
- Dashboard 1 kolom.
- AI Tutor full-screen.

---

## Teacher

- Tablet dan Laptop sebagai prioritas.
- Sidebar overlay pada tablet.
- Data table dapat discroll horizontal.

---

## Admin

- Desktop sebagai prioritas.
- Sidebar permanen.
- Multi-panel dashboard.
- Mendukung monitor ultra-wide.

---

# 42. Design Notes

## Responsive Priority

```
Mobile

↓

Tablet

↓

Laptop

↓

Desktop

↓

Ultra Wide
```

## Navigation Strategy

- Desktop → Sidebar
- Tablet → Collapsible Sidebar
- Mobile → Bottom Navigation + Drawer

## Grid Strategy

- Mobile → 4 Column
- Tablet → 8 Column
- Desktop → 12 Column

## Responsive Rule

Semua halaman baru wajib diuji minimal pada:

- 360 px
- 768 px
- 1024 px
- 1440 px
- 1920 px

Halaman dianggap selesai apabila seluruh breakpoint tersebut menampilkan layout yang benar tanpa kehilangan fungsi maupun informasi.
````
