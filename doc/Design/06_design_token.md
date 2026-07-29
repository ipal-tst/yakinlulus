````markdown
# 06_design_token.md

> Product : YakinLulus.id  
> Document Type : Design System  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

Dokumen ini mendefinisikan Design Token yang menjadi **single source of truth** untuk seluruh nilai desain di YakinLulus.id.

Seluruh implementasi pada:

- Figma
- React
- Flutter
- CSS
- Tailwind

wajib menggunakan Design Token dan **tidak diperbolehkan menggunakan hardcoded value**.

---

# 2. What is Design Token

Design Token adalah representasi terstruktur dari nilai desain yang dapat digunakan lintas platform.

Contoh:

Bukan

```css
color: #1565C0;
padding: 16px;
border-radius: 12px;
```

Tetapi

```text
color.primary.500

space.4

radius.lg
```

Dengan pendekatan ini seluruh platform akan selalu konsisten.

---

# 3. Token Architecture

Menggunakan arsitektur tiga lapis.

```
Primitive Token

↓

Semantic Token

↓

Component Token
```

---

# 4. Primitive Token

Primitive Token adalah nilai dasar.

Contoh:

```
Blue 500

Gray 100

16 px

12 px

Bold

24 px
```

Primitive tidak digunakan langsung oleh komponen.

---

# 5. Semantic Token

Semantic Token memberikan makna.

Contoh

```
color.background

color.surface

color.text.primary

color.text.secondary

color.border

color.success

color.error

color.warning

color.info
```

Komponen hanya menggunakan Semantic Token.

---

# 6. Component Token

Component Token adalah token khusus untuk komponen.

Contoh

```
button.primary.background

button.primary.text

button.primary.hover

button.radius

card.background

card.shadow

input.border

sidebar.background
```

---

# 7. Naming Convention

Gunakan format berikut.

```
category.object.property.state
```

Contoh

```
color.primary.500

color.text.primary

space.4

radius.md

button.primary.background

input.focus.border

card.shadow.md
```

Gunakan huruf kecil dan pemisah titik (`.`).

---

# 8. Color Token

## Brand

```
color.primary.50

color.primary.100

...

color.primary.900
```

```
color.secondary.50

...

color.secondary.900
```

```
color.accent.50

...

color.accent.900
```

---

## Semantic

```
color.success

color.warning

color.error

color.info
```

---

## Background

```
color.background

color.surface

color.surface.secondary

color.surface.tertiary
```

---

## Text

```
color.text.primary

color.text.secondary

color.text.tertiary

color.text.inverse

color.text.disabled
```

---

## Border

```
color.border

color.border.focus

color.border.error

color.border.hover
```

---

# 9. Typography Token

## Font Family

```
font.family.primary

font.family.secondary

font.family.mono
```

---

## Font Size

```
font.size.display-xl

font.size.display-lg

font.size.h1

font.size.h2

font.size.h3

font.size.h4

font.size.h5

font.size.h6

font.size.body-lg

font.size.body-md

font.size.body-sm

font.size.caption
```

---

## Weight

```
font.weight.regular

font.weight.medium

font.weight.semibold

font.weight.bold
```

---

## Line Height

```
font.line.display

font.line.heading

font.line.body

font.line.caption
```

---

# 10. Spacing Token

```
space.1 = 4

space.2 = 8

space.3 = 12

space.4 = 16

space.5 = 20

space.6 = 24

space.8 = 32

space.10 = 40

space.12 = 48

space.16 = 64

space.20 = 80

space.24 = 96

space.32 = 128
```

---

# 11. Radius Token

```
radius.none = 0

radius.sm = 4

radius.md = 8

radius.lg = 12

radius.xl = 16

radius.2xl = 24

radius.full = 9999
```

---

# 12. Shadow Token

```
shadow.xs

shadow.sm

shadow.md

shadow.lg

shadow.xl
```

Contoh

```
Card

↓

shadow.md

Modal

↓

shadow.xl

Tooltip

↓

shadow.sm
```

---

# 13. Opacity Token

```
opacity.0

opacity.10

opacity.20

opacity.40

opacity.60

opacity.80

opacity.100
```

---

# 14. Border Token

```
border.none

border.thin

border.normal

border.thick
```

Mapping

```
0

1

2

4
```

---

# 15. Icon Token

```
icon.xs = 16

icon.sm = 20

icon.md = 24

icon.lg = 32

icon.xl = 40
```

---

# 16. Animation Token

Duration

```
motion.fast

motion.normal

motion.slow
```

Mapping

```
100 ms

200 ms

300 ms
```

---

Easing

```
ease.standard

ease.decelerate

ease.accelerate
```

---

# 17. Z Index Token

```
z.base

z.dropdown

z.sticky

z.overlay

z.modal

z.toast

z.tooltip
```

---

# 18. Layout Token

```
layout.sidebar.width

layout.sidebar.collapsed

layout.header.height

layout.container

layout.max-width
```

---

# 19. Component Token

## Button

```
button.primary.background

button.primary.hover

button.primary.text

button.primary.border
```

---

## Card

```
card.background

card.border

card.shadow

card.padding
```

---

## Input

```
input.background

input.border

input.focus

input.error

input.placeholder
```

---

## Modal

```
modal.background

modal.shadow

modal.radius
```

---

# 20. Theme Token

## Light

```
theme.light.background

theme.light.surface

theme.light.text
```

---

## Dark

```
theme.dark.background

theme.dark.surface

theme.dark.text
```

---

# 21. Figma Structure

```
Primitive

├── Color
├── Typography
├── Space
├── Radius
├── Shadow

↓

Semantic

↓

Component

↓

Theme
```

Menggunakan **Variables** dan **Collections**.

---

# 22. CSS Variable Mapping

```css
:root{

--color-primary:
--color-surface:
--color-text-primary:

--space-1:
--space-2:

--radius-md:

--shadow-md:

--font-body:

}
```

---

# 23. Tailwind Mapping

```
theme.extend

↓

colors

spacing

fontSize

borderRadius

boxShadow

zIndex
```

Tailwind mengambil nilai dari Design Token.

---

# 24. Flutter Mapping

```dart
AppColors

AppTypography

AppSpacing

AppRadius

AppShadow

AppMotion
```

Semua widget Flutter hanya menggunakan token tersebut.

---

# 25. React Mapping

```
tokens/

colors.ts

spacing.ts

radius.ts

typography.ts

shadow.ts

motion.ts

zindex.ts
```

Kemudian diekspor melalui:

```
index.ts
```

---

# 26. Folder Structure

```
design-token/

colors.json

typography.json

spacing.json

radius.json

shadow.json

motion.json

zindex.json

layout.json
```

Format JSON mengikuti W3C Design Tokens Community Group.

---

# 27. Token Rules

✔ Gunakan token.

✔ Gunakan semantic token pada komponen.

✔ Primitive hanya sebagai dasar.

✔ Jangan hardcode nilai.

✔ Semua platform harus menggunakan sumber token yang sama.

---

# 28. Do

✔ Gunakan token untuk semua properti desain.

✔ Gunakan semantic naming.

✔ Gunakan component token untuk komponen kompleks.

✔ Sinkronkan Figma dan kode.

---

# 29. Don't

✘ Jangan menggunakan HEX langsung di komponen.

✘ Jangan menggunakan nilai spacing acak.

✘ Jangan membuat radius baru.

✘ Jangan membuat shadow baru tanpa persetujuan.

✘ Jangan membuat token duplikat.

---

# 30. Versioning

Setiap perubahan token harus:

- memiliki nomor versi;
- didokumentasikan pada changelog;
- diuji pada seluruh tema;
- diverifikasi di Figma dan frontend.

Perubahan token dianggap sebagai perubahan global.

---

# 31. QA Checklist

- □ Tidak ada hardcoded color.
- □ Tidak ada hardcoded spacing.
- □ Tidak ada hardcoded radius.
- □ Semua komponen menggunakan semantic token.
- □ Figma menggunakan Variables.
- □ React menggunakan token.
- □ Flutter menggunakan token.
- □ Light dan Dark Theme telah diverifikasi.

---

# 32. Future Scalability

Design Token dirancang agar mendukung:

- Web
- Flutter
- React Native
- Desktop
- White Label
- Multi Brand
- Dark Mode
- High Contrast
- Multi Theme
- Future Design System

Tanpa mengubah struktur token utama.
````

---

## Rekomendasi

Saya menyarankan menggunakan **standar W3C Design Tokens Community Group** sebagai format dasar penyimpanan token (JSON). Dengan pendekatan ini:

* Figma Variables dapat menjadi sumber desain.
* Token dapat diekspor ke React, Tailwind CSS, Flutter, dan platform lain secara otomatis.
* Ketika warna, spacing, atau typography berubah, seluruh aplikasi ikut berubah tanpa modifikasi manual.

Ini akan membuat Design System YakinLulus.id jauh lebih mudah dipelihara dan siap untuk otomatisasi pipeline desain-ke-kode di masa depan.
