````markdown
# 25_frontend_guideline.md

> Product : YakinLulus.id  
> Module : Frontend Engineering Guideline  
> Document Type : Engineering Standard  
> Version : 1.0.0  
> Status : Draft  
> Owner : Frontend Engineering Team

---

# 1. Purpose

Dokumen ini menjadi standar resmi implementasi Frontend YakinLulus.id.

Tujuan:

- Konsistensi kode
- Konsistensi UI
- Mempermudah maintenance
- Mempercepat development
- Mempermudah onboarding developer
- Mengurangi technical debt

Frontend **wajib mengikuti Design System** yang telah didefinisikan sebelumnya.

---

# 2. Technology Stack

## Framework

```
Next.js 15
```

App Router.

---

## Language

```
TypeScript
```

Strict Mode wajib aktif.

---

## Styling

```
Tailwind CSS v4
```

---

## UI Library

```
shadcn/ui
```

---

## Icon

```
Lucide React
```

---

## Animation

```
Framer Motion
```

---

## Form

```
React Hook Form
```

```
Zod
```

---

## State Management

Global

```
Zustand
```

Server

```
TanStack Query
```

---

## Chart

```
Recharts
```

---

## Table

```
TanStack Table
```

---

## Date

```
date-fns
```

---

## Markdown

```
react-markdown
```

---

## Formula

```
KaTeX
```

---

## Syntax Highlight

```
Shiki
```

---

# 3. Project Structure

```
src/

├── app/

├── components/

├── features/

├── hooks/

├── services/

├── lib/

├── store/

├── types/

├── utils/

├── styles/

├── config/

├── constants/

├── assets/

└── middleware.ts
```

---

# 4. Feature Structure

```
features/

student/

teacher/

admin/

auth/

material/

question/

practice/

exam/

analytics/

ai/

notification/
```

Setiap domain dipisahkan.

---

# 5. Component Structure

```
components/

ui/

layout/

dashboard/

chart/

form/

table/

material/

question/

cbt/

ai/

common/
```

---

# 6. Naming Convention

Component

```
PascalCase
```

Contoh

```
StudentCard.tsx
```

---

Hook

```
camelCase
```

```
useExam.ts
```

---

Utility

```
camelCase
```

---

Constant

```
UPPER_CASE
```

---

# 7. Routing

Menggunakan App Router.

```
app/

student/

teacher/

admin/

login/

practice/

exam/

profile/
```

---

# 8. Layout Architecture

```
RootLayout

↓

Role Layout

↓

Page

↓

Section

↓

Component
```

---

# 9. Component Hierarchy

```
Page

↓

Section

↓

Widget

↓

Card

↓

Component

↓

Primitive
```

---

# 10. Design System Rule

Seluruh komponen wajib menggunakan:

- Design Token
- Tailwind Theme
- CSS Variable

Tidak boleh menggunakan warna hardcoded.

---

# 11. Styling Rule

Gunakan:

```
className
```

dengan utility Tailwind.

Hindari CSS manual kecuali benar-benar diperlukan.

---

# 12. Theme

Support:

- Light
- Dark
- System

Menggunakan:

```
next-themes
```

---

# 13. Responsive

Mengikuti:

```
Mobile First
```

Breakpoints:

```
sm

md

lg

xl

2xl
```

---

# 14. Folder Example

```
material/

components/

hooks/

types/

services/

constants/

utils/
```

Feature bersifat mandiri (feature-first).

---

# 15. API Layer

```
API

↓

Service

↓

React Query

↓

Hook

↓

Page
```

Page tidak memanggil API secara langsung.

---

# 16. Data Fetching

GET

```
TanStack Query
```

Mutation

```
Mutation Hook
```

Server Component digunakan jika sesuai.

---

# 17. State Management

Global

```
Zustand
```

UI Local

```
useState
```

Form

```
React Hook Form
```

---

# 18. Authentication

JWT

+

Refresh Token

Middleware:

```
middleware.ts
```

Role Based Route Protection.

---

# 19. RBAC

Role:

```
Student

Teacher

Staff

Admin

Super Admin
```

Route dilindungi berdasarkan role.

---

# 20. Component Rule

Setiap komponen memiliki:

- Props
- Variant
- State
- Documentation
- Storybook
- Unit Test

---

# 21. Component State

Minimal:

```
Loading

Empty

Success

Error

Disabled
```

---

# 22. Form Guideline

Gunakan:

React Hook Form

+

Zod

Validation tidak ditulis manual.

---

# 23. Error Handling

Gunakan Error Boundary.

Global Error Page.

Toast Error.

Retry Button.

---

# 24. Loading Strategy

Gunakan:

- Skeleton
- Suspense
- Lazy Component

Bukan Spinner untuk seluruh halaman.

---

# 25. Table Guideline

Gunakan:

TanStack Table.

Support:

- Pagination
- Filter
- Sort
- Search
- Export

---

# 26. Chart Guideline

Gunakan:

Recharts.

Support:

- Tooltip
- Responsive
- Export
- Empty State

---

# 27. AI Module

Gunakan:

Streaming Response.

Markdown.

Code Highlight.

Formula.

Citation.

---

# 28. File Upload

Support:

- Drag Drop
- Progress
- Retry
- Preview
- Validation

---

# 29. Accessibility

Minimal:

WCAG 2.2 AA

Keyboard Navigation.

Focus Ring.

Screen Reader.

---

# 30. Motion

Gunakan:

Framer Motion.

Durasi:

```
150–250 ms
```

Hormati:

```
prefers-reduced-motion
```

---

# 31. Performance Guideline

Gunakan:

- Code Splitting
- Dynamic Import
- Lazy Loading
- Image Optimization
- Memoization
- Virtualization

---

# 32. Image Guideline

Gunakan:

```
next/image
```

Format:

AVIF

↓

WebP

↓

PNG

---

# 33. Security

Selalu lakukan:

- Input Sanitization
- XSS Protection
- CSRF Protection
- CSP
- Escape HTML

Tidak pernah merender HTML mentah dari pengguna.

---

# 34. Logging

Development

```
console.log
```

Production

Gunakan:

Logging Service.

---

# 35. Environment Variable

```
.env.local

.env.production
```

Tidak menyimpan secret di frontend.

---

# 36. Code Style

Formatter

```
Prettier
```

Lint

```
ESLint
```

Import otomatis menggunakan alias.

---

# 37. Import Alias

```
@/components

@/features

@/hooks

@/lib

@/services

@/types

@/utils
```

---

# 38. Testing

Unit Test

```
Vitest
```

Component Test

```
Testing Library
```

E2E

```
Playwright
```

---

# 39. Storybook

Seluruh reusable component wajib tersedia di Storybook.

Minimal memiliki:

- Props
- Variant
- State
- Dark Mode
- Responsive Preview

---

# 40. Documentation

Setiap feature memiliki:

```
README.md
```

Berisi:

- Purpose
- Folder
- Flow
- API
- Component
- State

---

# 41. Git Workflow

```
main

↓

develop

↓

feature/*

↓

pull request

↓

review

↓

merge
```

---

# 42. Commit Convention

Menggunakan Conventional Commit.

```
feat:

fix:

refactor:

style:

docs:

test:

chore:
```

---

# 43. Pull Request Checklist

□ Build sukses

□ Lint lolos

□ Type Check lolos

□ Unit Test lolos

□ Storybook diperbarui

□ Tidak ada hardcoded color

□ Responsive sudah diuji

□ Dark Mode didukung

□ Accessibility memenuhi standar

---

# 44. Performance Target

| Metric | Target |
|----------|---------|
| Lighthouse Performance | ≥95 |
| Accessibility | ≥95 |
| Best Practice | ≥95 |
| SEO | ≥90 |
| CLS | <0.1 |
| LCP | <2.5 s |
| INP | <200 ms |
| Bundle JS (Initial) | <250 KB (gzip) |

---

# 45. Recommended Libraries

| Category | Library |
|------------|----------------|
| Framework | Next.js |
| Language | TypeScript |
| UI | shadcn/ui |
| Styling | Tailwind CSS |
| Icon | Lucide |
| Animation | Framer Motion |
| State | Zustand |
| Server State | TanStack Query |
| Form | React Hook Form |
| Validation | Zod |
| Chart | Recharts |
| Table | TanStack Table |
| Date | date-fns |
| Markdown | react-markdown |
| Formula | KaTeX |
| Syntax | Shiki |
| Testing | Vitest |
| E2E | Playwright |
| Storybook | Storybook 9 |

---

# 46. Code Quality Rules

Wajib:

✔ TypeScript Strict Mode

✔ ESLint tanpa warning

✔ Prettier

✔ Tanpa `any` (kecuali benar-benar diperlukan)

✔ Tanpa duplicate component

✔ Feature-first architecture

✔ Reusable component

✔ Memoization jika diperlukan

✔ Tidak ada magic number

✔ Tidak ada inline style

---

# 47. Folder Mapping

```
Design System
        ↓
Figma Component
        ↓
Storybook
        ↓
React Component
        ↓
Feature Module
        ↓
Production
```

---

# 48. Frontend Development Workflow

```
Requirement

↓

UI/UX Design

↓

Figma Review

↓

Design Token

↓

Component Development

↓

Storybook

↓

Page Development

↓

API Integration

↓

Testing

↓

QA

↓

UAT

↓

Production
```

---

# 49. Definition of Done

Sebuah fitur dianggap selesai apabila:

- UI sesuai Figma (pixel tolerance ±2 px)
- Menggunakan seluruh Design Token
- Mendukung Light & Dark Mode
- Responsif pada semua breakpoint
- Lolos Accessibility (WCAG 2.2 AA)
- Lolos Unit Test
- Lolos E2E Test
- Tidak ada TypeScript Error
- Tidak ada ESLint Error
- Sudah memiliki dokumentasi dan Storybook

---

# 50. Engineering Principles

Frontend YakinLulus.id dibangun berdasarkan prinsip berikut:

- **Component-Driven Development**
- **Feature-First Architecture**
- **Design System First**
- **Type Safety**
- **Accessibility by Default**
- **Performance by Default**
- **Responsive by Default**
- **Dark Mode Native**
- **API-First Integration**
- **Maintainability over Complexity**

Dokumen ini menjadi standar implementasi resmi bagi seluruh Frontend Engineer yang terlibat dalam pengembangan YakinLulus.id.
````
