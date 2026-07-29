````markdown
# 22_figma_structure.md

> Product : YakinLulus.id
> Module : Figma Workspace Structure
> Document Type : Design System Specification
> Version : 1.0.0
> Status : Draft
> Owner : Product Design Team

---

# 1. Purpose

Dokumen ini mendefinisikan struktur workspace Figma yang digunakan pada pengembangan UI YakinLulus.id.

Tujuan:

- Konsistensi desain
- Memudahkan kolaborasi
- Memudahkan handoff ke developer
- Memudahkan maintenance
- Mendukung Design System
- Mendukung versioning

Seluruh designer wajib mengikuti struktur ini.

---

# 2. Workspace Structure

```
YakinLulus.id

│

├── 00 Cover

├── 01 Foundation

├── 02 Components

├── 03 Patterns

├── 04 Templates

├── 05 Student

├── 06 Teacher

├── 07 Admin

├── 08 Prototype

├── 09 Assets

├── 10 Archive
```

---

# 3. Page Overview

| Page | Function |
|---------|--------------------|
| Cover | Cover Project |
| Foundation | Color, Typography, Grid |
| Components | Component Library |
| Patterns | Layout Pattern |
| Templates | Reusable Screen |
| Student | Student UI |
| Teacher | Teacher UI |
| Admin | Admin UI |
| Prototype | Flow Prototype |
| Assets | Illustration & Icon |
| Archive | Deprecated Design |

---

# 4. Cover Page

Berisi:

- Logo
- Project Name
- Version
- Last Update
- Designer
- Quick Link

---

# 5. Foundation Page

```
Color

Typography

Spacing

Grid

Radius

Shadow

Elevation

Motion Token

Breakpoint

Icon Size
```

Semua menggunakan Design Token.

---

# 6. Components Page

```
Atoms

↓

Molecules

↓

Organisms

↓

Templates
```

---

# 7. Atoms

```
Button

Input

Checkbox

Radio

Switch

Avatar

Badge

Chip

Icon

Divider

Text

Label

Progress

Skeleton
```

---

# 8. Molecules

```
Search Box

Form Field

Card Header

Pagination

Navigation Item

Statistic Card

Filter

Breadcrumb

Tabs

Alert
```

---

# 9. Organisms

```
Sidebar

Header

Footer

Dashboard Widget

Data Table

Material Card

Question Card

AI Chat

CBT Question

Chart

Calendar

Notification Center
```

---

# 10. Templates

```
Dashboard

Learning

Question Bank

Practice

CBT

AI Tutor

Analytics

Authentication

Profile

Settings
```

---

# 11. Student Page

Frame:

```
Dashboard

↓

Learning Material

↓

Question Bank

↓

Practice

↓

CBT

↓

AI Tutor

↓

Analytics

↓

Profile

↓

Settings
```

---

# 12. Teacher Page

Frame:

```
Dashboard

↓

Material Management

↓

Question Management

↓

Exam Management

↓

Student Analytics

↓

Class

↓

AI Assistant

↓

Settings
```

---

# 13. Admin Page

Frame:

```
Dashboard

↓

User Management

↓

School

↓

Content

↓

Question

↓

Material

↓

Analytics

↓

Finance

↓

AI

↓

System Setting
```

---

# 14. Prototype Page

Berisi:

Flow Prototype.

```
Login

↓

Dashboard

↓

Learning

↓

Practice

↓

CBT

↓

Result
```

Prototype dibuat untuk seluruh user flow utama.

---

# 15. Asset Page

```
Logo

Illustration

Mascot

Icon

Background

Pattern

Photo

Video Thumbnail
```

---

# 16. Archive

Berisi:

- Deprecated Screen
- Old Component
- Old Dashboard

Tidak digunakan pada development aktif.

---

# 17. Frame Naming

Gunakan format:

```
Module

/

Screen

/

Variant
```

Contoh:

```
Student

/

Dashboard

/

Default
```

---

# 18. Component Naming

Gunakan:

```
Component

/

Variant

/

State

/

Size
```

Contoh:

```
Button

/

Primary

/

Hover

/

Large
```

---

# 19. Variant Naming

Contoh:

```
Default

Hover

Pressed

Focused

Disabled

Loading
```

---

# 20. Auto Layout

Seluruh komponen wajib menggunakan:

```
Auto Layout
```

Tidak menggunakan posisi absolut kecuali ilustrasi.

---

# 21. Constraints

Gunakan:

- Left
- Right
- Center
- Scale
- Fill Container

Semua frame harus responsif.

---

# 22. Grid

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

Menggunakan Layout Grid bawaan Figma.

---

# 23. Design Token

Menggunakan Variables.

Kategori:

```
Color

Typography

Spacing

Radius

Shadow

Elevation

Motion

Breakpoint
```

Tidak menggunakan Style lama.

---

# 24. Variables Collection

```
Primitive

↓

Semantic

↓

Component

↓

Theme
```

---

# 25. Color Variable

```
Blue

Green

Gold

Gray

Red

Orange

Purple (Reserved)

Black

White
```

---

# 26. Typography Variable

```
Display

Heading

Body

Caption

Label

Code
```

---

# 27. Spacing Variable

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

64

80
```

---

# 28. Component Variant

Seluruh komponen wajib memiliki Variant.

Contoh Button.

```
Primary

Secondary

Outline

Ghost

Danger

Success

Loading

Disabled
```

---

# 29. Responsive Preview

Setiap halaman memiliki:

Desktop

Tablet

Mobile

dalam satu frame section.

---

# 30. Annotation

Developer Handoff menggunakan:

- Note
- Description
- Interaction
- Variable Reference

---

# 31. Prototype Interaction

Minimal mendukung:

- Click
- Hover
- Overlay
- Smart Animate
- Scroll
- Back

---

# 32. Design Review Section

Setiap halaman memiliki:

```
Review

↓

Revision

↓

Approved
```

---

# 33. Versioning

Contoh:

```
v1.0

v1.1

v2.0
```

Gunakan Version History Figma.

---

# 34. Team Library

Library utama:

```
YK Design System
```

Seluruh file menggunakan library ini.

---

# 35. Asset Folder

```
Illustration

Icon

Logo

Photo

Video

Pattern

Background
```

---

# 36. Developer Handoff

Semua screen wajib memiliki:

- Component Name
- Variable
- Token
- Interaction
- Responsive Version
- State
- Accessibility Note

---

# 37. Documentation Frame

Setiap komponen memiliki:

```
Description

Props

Variant

State

Usage

Do

Don't
```

---

# 38. Branch Workflow

```
Main

↓

Feature Branch

↓

Review

↓

Merge
```

Menggunakan fitur Branch pada Figma Professional.

---

# 39. Review Workflow

Designer

↓

Lead Designer

↓

Product

↓

Frontend

↓

Approved

↓

Development

---

# 40. File Structure

```
YK Design System.fig

YK Student.fig

YK Teacher.fig

YK Admin.fig

YK Prototype.fig
```

---

# 41. Recommended Plugins

## Essential

- Iconify
- Autoflow
- Content Reel
- Similayer
- Rename It
- Design Lint

## Accessibility

- Stark
- A11y Color Contrast Checker

## Design System

- Tokens Studio
- Figma Variables

## Illustration

- Blush
- Storyset

## Developer

- EightShapes Specs
- HTML to Design (opsional)

---

# 42. Component Organization

```
Foundation

↓

Atoms

↓

Molecules

↓

Organisms

↓

Templates

↓

Pages
```

---

# 43. QA Checklist

□ Seluruh komponen menggunakan Auto Layout.

□ Menggunakan Variables.

□ Tidak ada warna hardcoded.

□ Penamaan konsisten.

□ Variant lengkap.

□ State lengkap.

□ Responsive tersedia.

□ Prototype berjalan.

□ Developer Note tersedia.

□ Accessibility Note tersedia.

□ Design System digunakan.

□ File bebas dari komponen duplikat.

---

# 44. Best Practices

Gunakan:

✔ Auto Layout

✔ Variables

✔ Component Property

✔ Variant

✔ Team Library

✔ Design Token

✔ Branch

✔ Version History

✔ Developer Mode

✔ Smart Animate

Hindari:

✖ Frame tanpa nama

✖ Hardcoded Color

✖ Komponen duplikat

✖ Komponen lokal yang tidak terdokumentasi

✖ Layout absolut tanpa alasan

✖ File Figma terlalu besar (>2.000 frame aktif)

---

# 45. Future Enhancement

Dirancang mendukung:

- Multi Brand Theme
- White Label School
- Dynamic Theme
- AI Generated UI
- Design Token Sync
- Storybook Sync
- Zero-Handoff Workflow

---

# 46. Design Notes

## Master Design File

```
YK Design System
```

Menjadi satu-satunya sumber kebenaran (Single Source of Truth) untuk seluruh komponen.

---

## Screen Ownership

- Student → Student Team
- Teacher → Teacher Team
- Admin → Admin Team

Semua tetap menggunakan library yang sama.

---

## Recommended Workflow

```
Requirement

↓

Wireframe

↓

High Fidelity

↓

Prototype

↓

Review

↓

Developer Handoff

↓

Frontend Development

↓

QA

↓

Release
```

---

## Integration dengan Frontend

Struktur Figma harus memiliki korespondensi langsung dengan struktur project React.

```
Figma
Components/Button

↓

React
components/ui/button.tsx

------------------------

Figma
Dashboard/Student

↓

React
app/student/dashboard/page.tsx

------------------------

Figma
Material/Card

↓

React
components/material/material-card.tsx
```

Dengan struktur ini, proses handoff dari UI Designer ke Frontend Engineer menjadi jauh lebih cepat, konsisten, dan mudah dipelihara sepanjang siklus pengembangan.
````
