````markdown
# 20_accessibility.md

> Product : YakinLulus.id  
> Module : Accessibility System  
> Document Type : UI/UX Specification  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

Accessibility memastikan seluruh pengguna dapat menggunakan YakinLulus.id secara nyaman, termasuk pengguna yang memiliki keterbatasan:

- Penglihatan
- Pendengaran
- Motorik
- Kognitif
- Warna (Color Blindness)

Standar utama yang digunakan adalah:

> **WCAG 2.2 Level AA**

Seluruh halaman, komponen, dan interaksi wajib mengikuti standar tersebut.

---

# 2. Accessibility Goals

YakinLulus.id harus:

- Mudah dibaca
- Mudah dipahami
- Mudah dinavigasi
- Mudah dioperasikan tanpa mouse
- Konsisten
- Mendukung assistive technology

---

# 3. Accessibility Principles

Mengikuti empat prinsip WCAG.

## Perceivable

Informasi dapat dilihat atau didengar.

---

## Operable

Semua fitur dapat dioperasikan.

---

## Understandable

Interface mudah dipahami.

---

## Robust

Kompatibel dengan browser dan screen reader.

---

# 4. Compliance Level

Target minimum:

```
WCAG 2.2 AA
```

Tidak menggunakan Level A saja.

AAA bersifat opsional.

---

# 5. Keyboard Navigation

Seluruh aplikasi dapat digunakan hanya dengan keyboard.

Shortcut utama:

```
Tab

Shift + Tab

Enter

Space

Esc

Arrow Key
```

---

# 6. Focus Order

Urutan fokus harus logis.

Contoh:

```
Sidebar

↓

Header

↓

Search

↓

Content

↓

Footer
```

Tidak boleh melompat.

---

# 7. Focus Indicator

Semua elemen interaktif wajib memiliki Focus Ring.

Contoh:

```
2 px

Primary Blue
```

Tidak boleh dihilangkan.

---

# 8. Skip Navigation

Pada awal halaman tersedia:

```
Skip to Main Content
```

Memudahkan pengguna keyboard dan screen reader.

---

# 9. Semantic HTML

Gunakan elemen HTML sesuai fungsinya.

```
<header>

<nav>

<main>

<section>

<article>

<footer>

<button>

<label>

<form>
```

Hindari penggunaan `<div>` untuk elemen interaktif.

---

# 10. Heading Structure

Urutan heading harus benar.

```
H1

↓

H2

↓

H3

↓

H4
```

Tidak boleh langsung dari H1 ke H4.

---

# 11. Color Contrast

Minimal kontras:

Normal Text

```
4.5 : 1
```

Large Text

```
3 : 1
```

Komponen UI

```
3 : 1
```

---

# 12. Color Independence

Informasi tidak boleh hanya dibedakan berdasarkan warna.

Contoh:

❌

Merah = Salah

Hijau = Benar

✔

Tambahkan:

- Icon
- Label
- Badge

---

# 13. Typography

Minimum:

```
16 px
```

Line Height

```
1.5
```

Paragraph Width

```
60–80 karakter
```

---

# 14. Touch Target

Ukuran minimum:

```
44 × 44 px
```

Berlaku untuk:

- Button
- Icon
- Menu
- Checkbox
- Radio
- Switch

---

# 15. Form Accessibility

Semua input wajib memiliki:

- Label
- Placeholder (opsional)
- Helper Text
- Error Message
- Required Indicator

---

# 16. Error Message

Error harus menjelaskan masalah.

Contoh:

❌

```
Invalid.
```

✔

```
Email harus menggunakan format yang benar.
```

---

# 17. Required Field

Gunakan:

```
*

Required
```

Bukan warna merah saja.

---

# 18. Screen Reader

Seluruh komponen wajib memiliki:

- aria-label
- aria-labelledby
- aria-describedby

Jika diperlukan.

---

# 19. Image Accessibility

Semua gambar wajib memiliki:

```
alt
```

Contoh:

```
Grafik perkembangan nilai Matematika selama enam bulan.
```

Bukan:

```
image1
```

---

# 20. Decorative Image

Jika gambar hanya dekorasi.

Gunakan:

```
alt=""
```

---

# 21. Icon Accessibility

Icon tanpa teks wajib memiliki:

```
aria-label
```

Contoh:

```
Search

Notification

Delete

Download
```

---

# 22. Table Accessibility

Gunakan:

```
<thead>

<tbody>

<th>

scope
```

Data kompleks menggunakan caption.

---

# 23. Modal Accessibility

Modal wajib:

- Focus Trap
- Esc untuk menutup
- Restore Focus saat ditutup

---

# 24. Dialog

Dialog menggunakan:

```
role="dialog"
```

atau

```
alertdialog
```

---

# 25. Tooltip

Tooltip muncul pada:

- Hover
- Focus

Bukan hover saja.

---

# 26. Notification

Toast harus dapat dibaca Screen Reader.

Gunakan:

```
aria-live
```

---

# 27. Loading

Loading wajib menjelaskan proses.

Contoh:

```
Mengunggah file...

75%
```

---

# 28. Skeleton

Skeleton harus diberi:

```
aria-hidden
```

---

# 29. AI Chat Accessibility

Mendukung:

- Screen Reader
- Keyboard Navigation
- Live Region

Streaming AI menggunakan:

```
aria-live="polite"
```

---

# 30. Video Accessibility

Semua video pembelajaran wajib mendukung:

- Subtitle
- Closed Caption
- Transcript

Future:

- Sign Language

---

# 31. Audio Accessibility

Audio wajib memiliki:

- Transcript
- Speed Control
- Pause

---

# 32. Formula Accessibility

Formula matematika menggunakan:

- KaTeX
- MathML

Sehingga dapat dibaca Screen Reader yang mendukung matematika.

---

# 33. CBT Accessibility

Mendukung:

- Keyboard Navigation
- High Contrast
- Zoom hingga 200%
- Screen Reader (kecuali jika dibatasi oleh kebijakan ujian)

---

# 34. Zoom Support

Seluruh halaman harus tetap berfungsi pada:

```
200%
```

tanpa kehilangan informasi.

---

# 35. Responsive Accessibility

Semua fitur tetap dapat digunakan pada:

- Desktop
- Tablet
- Mobile

---

# 36. Motion Accessibility

Jika pengguna mengaktifkan:

```
prefers-reduced-motion
```

Semua animasi kompleks dimatikan.

---

# 37. Dark Mode Accessibility

Dark Mode tetap memenuhi:

```
Contrast ≥ 4.5 : 1
```

---

# 38. Browser Support

Diuji pada:

- Chrome
- Edge
- Firefox
- Safari

---

# 39. Screen Reader Support

Target kompatibilitas:

- NVDA
- JAWS
- VoiceOver
- TalkBack

---

# 40. Accessibility Testing

Tools:

- Lighthouse
- axe DevTools
- WAVE
- Accessibility Insights

Testing Manual:

- Keyboard Only
- Screen Reader
- Zoom
- High Contrast
- Color Blind Simulation

---

# 41. Component Accessibility Matrix

| Component | Requirement |
|------------|-------------|
| Button | Focus + Label |
| Input | Label + Error |
| Card | Semantic Region |
| Table | Header + Scope |
| Modal | Focus Trap |
| Drawer | Keyboard |
| Sidebar | Landmark |
| Chart | Summary + Data Table |
| AI Chat | Live Region |
| CBT | Keyboard + Timer Alert |

---

# 42. Accessibility Checklist

□ Seluruh halaman dapat digunakan tanpa mouse.

□ Focus Ring terlihat.

□ Kontras memenuhi WCAG.

□ Heading benar.

□ Landmark lengkap.

□ Form memiliki Label.

□ Error mudah dipahami.

□ Gambar memiliki Alt.

□ Icon memiliki Label.

□ Modal memiliki Focus Trap.

□ Screen Reader berjalan.

□ Zoom 200% tetap baik.

□ Dark Mode memenuhi kontras.

□ Keyboard Navigation lengkap.

□ Chart memiliki alternatif data.

□ AI Chat mendukung Live Region.

---

# 43. Recommended Library

Frontend:

- Radix UI
- React Aria (opsional)
- shadcn/ui
- axe-core
- eslint-plugin-jsx-a11y

---

# 44. Best Practices

Gunakan:

✔ Semantic HTML

✔ Keyboard First

✔ High Contrast

✔ Focus Ring

✔ Alt Text

✔ Live Region

✔ Accessible Form

✔ Screen Reader Support

✔ Caption

✔ Transcript

Hindari:

✖ Menghilangkan Focus Outline

✖ Placeholder sebagai Label

✖ Warna sebagai satu-satunya indikator

✖ Klik-only Interaction

✖ Gambar tanpa Alt

✖ Animasi berlebihan

✖ Target sentuh terlalu kecil

---

# 45. Future Enhancement

Dirancang mendukung:

- Dyslexia Friendly Font
- Reading Mode
- High Contrast Theme
- Voice Navigation
- Voice Command
- AI Accessibility Assistant
- Auto Caption
- Sign Language Overlay
- Personalized Accessibility Profile

---

# 46. Design Notes

## Accessibility Priority

```
Keyboard

↓

Screen Reader

↓

Contrast

↓

Responsive

↓

Motion

↓

Media Accessibility
```

## Definition of Done

Sebuah halaman dinyatakan selesai apabila:

- Memenuhi WCAG 2.2 AA
- Lulus Lighthouse Accessibility ≥ 95
- Tidak memiliki isu kritis pada axe DevTools
- Dapat dioperasikan hanya dengan keyboard
- Dapat digunakan pada zoom 200%
- Seluruh komponen telah diuji menggunakan minimal satu screen reader
- Mendukung Dark Mode dan High Contrast tanpa kehilangan informasi
````
