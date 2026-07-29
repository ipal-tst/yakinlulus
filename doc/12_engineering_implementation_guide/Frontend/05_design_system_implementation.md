# 05_design_system_implementation.md

# Design System Implementation

## 1. Tujuan

Dokumen ini menjelaskan implementasi Design System Frontend YakinLulus.id.

Design System menjadi fondasi utama untuk menjaga konsistensi:

- Visual Interface
- User Experience
- Component Behavior
- Accessibility
- Responsive Design
- Theme Management
- Development Workflow

Design System tidak hanya berisi kumpulan komponen UI, tetapi merupakan sistem lengkap yang mengatur:

- Design Token
- Typography
- Color System
- Spacing
- Component Rules
- Interaction Pattern
- Accessibility Standard
- Responsive Strategy

Tujuan akhirnya adalah memastikan seluruh aplikasi:

- Student Platform
- Teacher Platform
- Admin Dashboard
- CBT Interface
- Mobile Application

memiliki pengalaman pengguna yang konsisten.

---

# 2. Konsep

YakinLulus.id menggunakan pendekatan:

```
Design Token

↓

Primitive Component

↓

Composite Component

↓

Feature Component

↓

Application Interface
```

Design System menjadi kontrak antara:

```
Designer

        ↕

Frontend Developer

        ↕

Product Team
```

---

## Prinsip Design System

### Consistency

Komponen yang sama harus memiliki perilaku yang sama.

Contoh:

Button Submit pada:

- Login
- Exam
- Material
- Profile

harus menggunakan aturan visual yang sama.

---

### Accessibility First

Seluruh komponen harus mendukung:

- Keyboard Navigation
- Screen Reader
- Focus State
- Color Contrast
- Semantic HTML

---

### Theme Ready

Design System harus mendukung:

- Light Theme
- Dark Theme

tanpa perubahan struktur komponen.

---

### Responsive First

Seluruh komponen harus berjalan pada:

- Desktop
- Tablet
- Mobile
- PWA

---

# 3. Architecture Diagram (ASCII)

```
                 Design System

                       │

              ┌────────┴────────┐

              ▼                 ▼

        Design Token       Component Rules

              │                 │

              ▼                 ▼

          Tailwind CSS       shadcn/ui

              │

              ▼

       Shared Components

              │

              ▼

        Feature Components

              │

              ▼

          Application UI
```

---

# 4. Component Explanation

## 4.1 Design Token Layer

Design Token adalah nilai dasar yang digunakan seluruh aplikasi.

Contoh:

- Color
- Typography
- Spacing
- Border Radius
- Shadow
- Animation
- Breakpoint

Contoh struktur:

```
config/

design-token.ts

theme.ts

```

---

## 4.2 Color System

YakinLulus.id menggunakan kombinasi:

- Blue
- Green
- Gold

sebagai identitas utama.

Konsep warna:

```
Primary

Secondary

Accent

Success

Warning

Error

Neutral
```

---

## Primary Color

Digunakan untuk:

- Navigation
- CTA
- Primary Action
- Brand Identity

Contoh:

```
Primary Blue
```

---

## Success Color

Digunakan untuk:

- Jawaban benar
- Status selesai
- Progress positif

Contoh:

```
Green
```

---

## Accent Color

Digunakan untuk:

- Achievement
- Ranking
- Premium Feature

Contoh:

```
Gold
```

---

## Dark Mode

Dark theme tidak menggunakan sekadar membalik warna.

Dark mode harus memiliki:

- Contrast yang sesuai.
- Surface hierarchy.
- Reduced eye strain.

Contoh:

```
Light

Background
Surface
Card


Dark

Background Dark
Surface Dark
Card Dark
```

---

# 4.3 Typography System

Typography menggunakan hierarchy.

Contoh:

```
Display

Heading 1

Heading 2

Heading 3

Body

Caption

Label
```

Tujuan:

- Mempermudah scanning.
- Menjaga readability.
- Konsisten antar halaman.

---

## Font Strategy

Prioritas:

1. System Font
2. Optimized Web Font

Pertimbangan:

- Performance
- Loading Speed
- Accessibility

---

# 4.4 Spacing System

Menggunakan spacing scale.

Contoh:

```
4px

8px

12px

16px

24px

32px

48px

64px
```

Tidak membuat nilai spacing random.

Hindari:

```
margin-top: 13px;

padding: 27px;
```

---

# 4.5 Component Library

Menggunakan:

```
shadcn/ui
```

sebagai base component.

Komponen dasar:

```
Button

Input

Select

Dialog

Card

Dropdown

Tabs

Table

Toast
```

Kemudian dikembangkan menjadi komponen YakinLulus.id.

---

## Component Layering

```
shadcn/ui

      ↓

YakinLulus UI

      ↓

Feature Component

      ↓

Application
```

---

# 4.6 Button System

Button memiliki variant:

```
Primary

Secondary

Outline

Ghost

Danger

Success
```

Ukuran:

```
Small

Medium

Large
```

State:

```
Default

Hover

Active

Disabled

Loading
```

Contoh penggunaan:

```
Primary Button

Submit Exam

Save Profile


Danger Button

Delete Account
```

---

# 4.7 Form Component

Form menggunakan:

- React Hook Form
- Zod Validation

Komponen:

```
FormField

Input

Select

Checkbox

Radio

DatePicker

FileUpload
```

Setiap form harus memiliki:

- Label
- Helper Text
- Error Message
- Loading State

---

# 4.8 Data Display Component

Untuk data besar:

```
Table

Virtual List

Pagination

Filter

Search
```

Menggunakan:

- TanStack Table
- TanStack Virtual

---

# 4.9 Feedback Component

Komponen:

```
Toast

Alert

Dialog

Skeleton

Empty State

Error State
```

Tujuan:

Memberikan feedback yang jelas kepada user.

---

# 5. Implementation Detail

## Tailwind Configuration

Design token diterjemahkan ke Tailwind.

Contoh konsep:

```
colors:

primary

secondary

accent

success

warning

danger
```

Developer tidak menggunakan warna langsung.

Hindari:

```tsx
<div className="bg-blue-600">
```

Gunakan:

```tsx
<div className="bg-primary">
```

---

# Theme Implementation

Menggunakan:

```
next-themes
```

Konsep:

```
User Preference

       │

       ▼

Theme Store

       │

       ▼

HTML Class

       │

       ▼

Tailwind Dark Variant
```

---

# Component Naming Convention

Gunakan PascalCase:

```
StudentCard

ExamTimer

QuestionNavigator
```

File:

```
StudentCard.tsx
```

---

# Component Variant

Gunakan pola:

```
variant

size

state
```

Contoh:

```tsx
<Button
 variant="primary"
 size="large"
/>
```

---

# Responsive Strategy

Menggunakan pendekatan:

```
Mobile First
```

Contoh:

```
Mobile

↓

Tablet

↓

Desktop
```

Tailwind breakpoint:

```
sm

md

lg

xl

2xl
```

---

# Accessibility Implementation

Setiap component harus memiliki:

## Keyboard Support

Contoh:

- Tab navigation
- Enter action
- Escape close dialog

---

## Semantic HTML

Gunakan:

```
button

nav

main

section

article

form
```

bukan:

```
div
```

untuk semua hal.

---

## ARIA

Gunakan jika semantic HTML tidak cukup.

Contoh:

```
aria-label

aria-expanded

aria-describedby
```

---

# 6. Flow / Example

## Creating New Component

```
Requirement

      │

      ▼

Check Existing Component

      │

      ▼

Reuse Existing

      │

      ▼

Extend Variant

      │

      ▼

Create New Component

      │

      ▼

Add Documentation
```

---

## Theme Flow

```
User

 │

 ▼

Theme Toggle

 │

 ▼

Zustand Store

 │

 ▼

next-themes

 │

 ▼

HTML Class

 │

 ▼

Tailwind Theme
```

---

## Exam UI Example

```
CBT Screen

      │

      ├── Timer

      │

      ├── Question Card

      │

      ├── Navigation

      │

      └── Submit Dialog


All components use:

Design Token

        +

Shared UI Component
```

---

# 7. Best Practice

## Jangan Membuat Custom Component Jika Sudah Ada

Sebelum membuat:

```
NewButton
```

cek:

```
Button
```

dari design system.

---

## Jangan Menggunakan Hardcoded Style

Hindari:

```tsx
text-[#123456]
```

Gunakan:

```tsx
text-primary
```

---

## Component Harus Memiliki State Lengkap

Minimal:

- Default
- Loading
- Disabled
- Error
- Empty

---

## Dokumentasikan Component Kompleks

Komponen seperti:

- Table
- Exam Interface
- Rich Text Editor
- File Upload

harus memiliki dokumentasi penggunaan.

---

# 8. Security Consideration

## Input Rendering

Semua user generated content harus melalui sanitization.

Terutama:

- Material Content
- Explanation Soal
- Rich Text
- Comment

---

## File Component

Upload component wajib melakukan:

- File type checking
- File size checking
- Extension validation

Validasi utama tetap dilakukan backend.

---

## Sensitive UI

Jangan menampilkan:

- Internal ID
- Permission Detail
- Backend Error
- System Information

kepada user biasa.

---

# 9. Performance Consideration

Design System harus memperhatikan:

- Bundle Size
- Tree Shaking
- CSS Optimization
- Component Lazy Loading

Hindari memasukkan seluruh library komponen jika hanya membutuhkan beberapa bagian.

---

Komponen berat:

```
Chart

Editor

PDF Viewer

Media Player
```

menggunakan lazy loading.

---

# 10. Scalability Consideration

Design System ini memungkinkan:

- Konsistensi seluruh produk.
- Pengembangan banyak team.
- Shared component package.
- Dokumentasi visual.
- Multi-brand support.
- Multi-language support.

---

Struktur masa depan:

```
packages/

ui/

design-token/

icons/

shared-components/
```

---

# 11. Future Evolution

## Internal Design System Platform

YakinLulus.id dapat membangun:

- Component Documentation Site
- Design Token Repository
- UI Playground
- Automated Visual Testing

---

## Cross Platform Design Token

Token yang sama dapat digunakan:

```
Web

        +

Flutter Mobile

        +

Marketing Website
```

---

## AI Assisted UI Development

AI dapat membantu:

- Generate component
- Check accessibility
- Suggest improvement
- Detect inconsistent design

---

# Summary

Design System YakinLulus.id menjadi fondasi visual dan interaksi seluruh aplikasi. Implementasi menggunakan Design Token, Tailwind CSS v4, shadcn/ui, dan prinsip Accessibility First. Sistem ini memastikan seluruh interface memiliki konsistensi, mendukung Light/Dark Theme, responsive, mudah dikembangkan, serta siap digunakan pada skala enterprise dan multi-platform.