````markdown
# 19_dark_mode.md

> Product : YakinLulus.id  
> Module : Dark Mode Design System  
> Document Type : UI/UX Specification  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

Dark Mode merupakan bagian dari Design System YakinLulus.id yang bertujuan untuk:

- mengurangi kelelahan mata;
- meningkatkan kenyamanan belajar pada malam hari;
- menghemat konsumsi daya pada perangkat OLED/AMOLED;
- memberikan pengalaman visual yang konsisten.

Dark Mode **bukan sekadar membalik warna**, melainkan menggunakan palet warna yang dirancang khusus.

---

# 2. Design Philosophy

Dark Mode mengikuti prinsip:

- Comfortable
- High Readability
- Low Eye Strain
- Consistent
- Accessible
- Brand Identity Preserved

Seluruh identitas warna YakinLulus.id (Blue • Green • Gold) tetap dipertahankan.

---

# 3. Theme Architecture

```
Theme

├── Light
│
├── Dark
│
└── System
```

Mode **System** mengikuti pengaturan sistem operasi pengguna.

---

# 4. Theme Switching

Pengguna dapat memilih:

- Light
- Dark
- System

Pengaturan disimpan pada:

- Database User Preference
- Local Storage (fallback)

---

# 5. Theme Token

Seluruh warna menggunakan Design Token.

Contoh:

```
--background

--foreground

--card

--border

--primary

--secondary

--success

--warning

--danger

--muted
```

Tidak diperbolehkan menggunakan warna hardcoded.

---

# 6. Color Palette

## Background

Primary Background

```
#0F172A
```

Secondary Background

```
#1E293B
```

Surface

```
#334155
```

Hover

```
#475569
```

---

## Text

Primary

```
#F8FAFC
```

Secondary

```
#CBD5E1
```

Muted

```
#94A3B8
```

Disabled

```
#64748B
```

---

## Border

```
#334155
```

---

## Divider

```
#475569
```

---

# 7. Brand Colors

Brand Identity tetap sama.

Primary Blue

```
#2563EB
```

Primary Green

```
#16A34A
```

Primary Gold

```
#D4AF37
```

Warna brand tidak berubah drastis.

---

# 8. Elevation

Dark Mode menggunakan kombinasi:

- Shadow ringan
- Kontras antar layer
- Surface berbeda

Bukan shadow hitam pekat.

---

# 9. Surface Hierarchy

```
Level 0

Background

↓

Level 1

Card

↓

Level 2

Popup

↓

Level 3

Modal

↓

Level 4

Tooltip
```

Semakin tinggi layer, semakin terang.

---

# 10. Card

Default

```
Background

#1E293B
```

Hover

```
#273449
```

Border

```
#334155
```

---

# 11. Sidebar

Background

```
#0F172A
```

Active Menu

Blue + sedikit Green Accent.

Hover

```
#1E293B
```

---

# 12. Header

Background

```
rgba(15,23,42,0.9)
```

Menggunakan:

```
backdrop-blur
```

---

# 13. Button

Primary

Blue

Secondary

Green

Warning

Gold

Danger

Red

Hover:

Brightness +5%

---

# 14. Form

Input

```
Background

#1E293B
```

Border

```
#334155
```

Focus

Blue Border

---

# 15. Table

Header

```
#1E293B
```

Row

```
#0F172A
```

Hover

```
#1E293B
```

Alternate Row

```
#111827
```

---

# 16. Dashboard Widget

Widget menggunakan:

- Surface berbeda
- Border halus
- Shadow ringan

Tidak menggunakan warna solid penuh.

---

# 17. Chart

Background transparan.

Grid menggunakan:

```
Gray 700
```

Axis

```
Gray 400
```

Label

```
Gray 200
```

Tetap menggunakan warna brand.

---

# 18. Notification

Info

Blue

Success

Green

Warning

Gold

Danger

Red

Selalu memiliki kontras tinggi.

---

# 19. Code Block

Background

```
#111827
```

Border

```
#334155
```

Font

Monospace

---

# 20. Syntax Highlight

Disarankan menggunakan tema:

```
GitHub Dark

atau

One Dark
```

---

# 21. AI Chat

User Bubble

Blue

AI Bubble

Surface Gray

Citation

Gold

Code Block

Dark Surface

---

# 22. Learning Material

Video

Background Hitam.

PDF

Dark Reader Mode.

Formula

Background transparan.

---

# 23. CBT Mode

CBT menggunakan Dark Mode yang lebih netral.

Background

```
#0F172A
```

Question Card

```
#1E293B
```

Answer Hover

Blue

Flag

Gold

Timer

Green

Warning

Gold

Critical

Red

---

# 24. Accessibility

Kontras minimum:

```
4.5 : 1
```

Judul besar:

```
3 : 1
```

Focus Ring selalu terlihat.

---

# 25. Theme Transition

Saat berpindah mode.

Durasi

```
200 ms
```

Animasi:

Fade

Tidak menggunakan flash.

---

# 26. Responsive Behavior

Dark Mode harus identik pada:

- Desktop
- Tablet
- Mobile

Tidak boleh ada perbedaan warna.

---

# 27. Component Compatibility

Semua komponen wajib mendukung:

✔ Button

✔ Card

✔ Table

✔ Chart

✔ Modal

✔ Drawer

✔ Tooltip

✔ AI Chat

✔ Question Viewer

✔ Material Card

✔ Dashboard Widget

---

# 28. Theme Detection

Prioritas:

```
User Setting

↓

Local Storage

↓

System Theme

↓

Light Mode
```

---

# 29. Recommended Tech

React

```
next-themes
```

Tailwind CSS

```
class strategy
```

Menggunakan:

```
dark:
```

utility.

---

# 30. Design Token Example

```
Light

background

↓

#FFFFFF

Dark

↓

#0F172A
```

Seluruh komponen mengambil warna dari token.

---

# 31. Component Matrix

| Component | Dark Support |
|------------|--------------|
| Button | ✔ |
| Card | ✔ |
| Modal | ✔ |
| Drawer | ✔ |
| Sidebar | ✔ |
| Header | ✔ |
| Chart | ✔ |
| Table | ✔ |
| AI Chat | ✔ |
| CBT | ✔ |
| Learning Material | ✔ |

---

# 32. QA Checklist

□ Theme dapat diganti.

□ System Theme berjalan.

□ Tidak ada hardcoded color.

□ Semua komponen mendukung Dark Mode.

□ Chart tetap terbaca.

□ Table jelas.

□ AI Chat benar.

□ Formula tetap jelas.

□ Focus Ring terlihat.

□ Kontras memenuhi WCAG.

□ Responsive.

□ Theme tersimpan.

□ Tidak terjadi flicker saat refresh.

---

# 33. Best Practices

Gunakan:

✔ Slate Gray Background

✔ Surface Layer

✔ Design Token

✔ Brand Color

✔ High Contrast

✔ Blur Header

✔ Soft Shadow

✔ Theme Transition

Hindari:

✖ Pure Black (#000000)

✖ Pure White Text (#FFFFFF) di seluruh area

✖ Shadow terlalu gelap

✖ Neon Color

✖ Saturasi berlebihan

✖ Hardcoded Color

---

# 34. Dark Mode Color Reference

| Element | Color |
|----------|--------|
| App Background | #0F172A |
| Surface | #1E293B |
| Elevated Surface | #334155 |
| Border | #334155 |
| Divider | #475569 |
| Primary Text | #F8FAFC |
| Secondary Text | #CBD5E1 |
| Muted Text | #94A3B8 |
| Disabled | #64748B |
| Primary | #2563EB |
| Success | #16A34A |
| Warning | #D4AF37 |
| Danger | #DC2626 |

---

# 35. Future Enhancement

Dirancang mendukung:

- AMOLED Mode
- High Contrast Mode
- Dynamic Theme
- Seasonal Theme
- Event Theme
- School Branding Theme

---

# 36. Design Notes

## Theme Strategy

```
Light

↓

Dark

↓

System
```

## Dark Background Rule

Background maksimal menggunakan:

```
#0F172A
```

Bukan hitam pekat.

## Brand Consistency

Identitas visual tetap menggunakan:

- Blue
- Green
- Gold

Baik pada Light Mode maupun Dark Mode.

## Default Theme

Untuk pengguna baru:

```
System Theme
```

Jika sistem operasi mendukung perubahan otomatis (siang/malam), aplikasi akan mengikuti tanpa memerlukan konfigurasi tambahan.
````
