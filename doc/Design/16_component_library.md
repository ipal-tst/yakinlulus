````markdown
# 16_component_library.md

> Product : YakinLulus.id
> Module : Design System Component Library
> Document Type : UI Component Specification
> Version : 1.0.0
> Status : Draft
> Owner : Product Design Team

---

# 1. Purpose

Component Library merupakan kumpulan seluruh komponen UI yang digunakan secara konsisten di seluruh aplikasi YakinLulus.id.

Tujuan utama:

- Konsistensi UI
- Mempercepat Development
- Mempermudah Maintenance
- Memudahkan Figma Design
- Memudahkan QA
- Mendukung Dark Mode
- Mendukung Accessibility
- Mendukung Responsive Design

---

# 2. Design Philosophy

Semua komponen mengikuti prinsip:

- Atomic Design
- Design Token Driven
- Reusable
- Accessible
- Responsive
- Themeable
- Stateless jika memungkinkan
- High Performance

---

# 3. Component Hierarchy

```
Design System

│

├── Foundation

│ ├── Color
│ ├── Typography
│ ├── Spacing
│ ├── Elevation
│ ├── Radius
│ ├── Shadow

│

├── Atom

│ ├── Button
│ ├── Input
│ ├── Checkbox
│ ├── Radio
│ ├── Switch
│ ├── Icon
│ ├── Avatar
│ ├── Badge
│ ├── Chip
│ ├── Divider

│

├── Molecule

│ ├── Search Box
│ ├── Card Header
│ ├── Filter Bar
│ ├── Form Field
│ ├── Pagination
│ ├── Navigation Item
│ ├── Empty State
│ ├── Statistic Card

│

├── Organism

│ ├── Sidebar
│ ├── Header
│ ├── Data Table
│ ├── Question Card
│ ├── Material Card
│ ├── Chart
│ ├── Dashboard Widget
│ ├── AI Chat
│ ├── CBT Question

│

└── Template

Dashboard

Material

Practice

CBT

Admin

Teacher

Student
```

---

# 4. Foundation Component

## Color

Menggunakan Design Token.

```
Primary

Secondary

Success

Warning

Danger

Info

Neutral
```

---

## Typography

```
Display

Heading

Body

Label

Caption

Code
```

---

## Radius

```
4 px

8 px

12 px

16 px

24 px

9999 px
```

---

## Shadow

```
xs

sm

md

lg

xl
```

---

## Opacity

```
0

25

50

75

100
```

---

# 5. Button Component

Variant

```
Primary

Secondary

Outline

Ghost

Text

Danger

Success
```

Size

```
XS

SM

MD

LG

XL
```

State

```
Default

Hover

Pressed

Focused

Disabled

Loading
```

Support

- Icon Left
- Icon Right
- Full Width
- Rounded
- Loading Spinner

---

# 6. Icon Button

Variant

```
Filled

Outlined

Ghost
```

Size

```
32

40

48

56
```

---

# 7. Input Component

Support

- Label
- Placeholder
- Helper Text
- Error Text
- Prefix
- Suffix
- Icon
- Clear Button

State

- Default
- Focus
- Error
- Disabled
- Readonly

---

# 8. Textarea

Support

- Auto Resize
- Character Counter
- Markdown *(Future)*

---

# 9. Select

Variant

- Single Select
- Multi Select
- Searchable
- Async Select

---

# 10. Checkbox

State

- Checked
- Unchecked
- Indeterminate
- Disabled

---

# 11. Radio

State

- Selected
- Unselected
- Disabled

---

# 12. Switch

Variant

- Default
- Success
- Danger

---

# 13. Badge

Variant

```
Primary

Success

Warning

Danger

Info

Gray
```

---

# 14. Chip

Support

- Icon
- Avatar
- Removable
- Selectable

---

# 15. Avatar

Size

```
24

32

40

48

64

96
```

Support

- Image
- Initial
- Icon

---

# 16. Card

Variant

- Default
- Statistic
- Dashboard
- Material
- Question
- AI
- Profile

Support

- Header
- Footer
- Actions

---

# 17. Modal

Size

```
SM

MD

LG

XL

Full Screen
```

Support

- Confirm
- Form
- Preview
- Alert

---

# 18. Drawer

Direction

- Left
- Right
- Bottom

---

# 19. Tooltip

Trigger

- Hover
- Focus
- Click

---

# 20. Popover

Support

- Form
- Information
- Menu

---

# 21. Dropdown

Support

- Single
- Nested
- Searchable

---

# 22. Toast

Variant

- Success
- Error
- Warning
- Info

Position

- Top Right

---

# 23. Alert

Variant

- Success
- Warning
- Danger
- Info

---

# 24. Progress

Variant

- Linear
- Circular
- Step Progress

---

# 25. Skeleton

Support

- Card
- Table
- Chart
- Avatar
- Paragraph

---

# 26. Tabs

Variant

- Line
- Pill
- Underline

---

# 27. Accordion

Support

- Single
- Multiple

---

# 28. Breadcrumb

Support

- Icon
- Collapse

---

# 29. Pagination

Support

- Page Number
- Next
- Previous
- First
- Last

---

# 30. Search Box

Support

- Recent Search
- Suggestion
- Filter

Shortcut

```
Ctrl + K
```

---

# 31. Data Table

Support

- Sorting
- Filtering
- Sticky Header
- Pagination
- Selection
- Expand Row
- Export
- Column Resize
- Column Hide

---

# 32. Chart Component

Support

- Line
- Bar
- Area
- Pie
- Donut
- Radar
- Heatmap
- Gauge

---

# 33. Dashboard Widget

Template

```
Header

↓

Statistic

↓

Chart

↓

Footer
```

---

# 34. Question Component

Support

- Story
- Formula
- Image
- Option
- Explanation

---

# 35. Material Component

Support

- Thumbnail
- Progress
- Duration
- Difficulty
- Rating
- Bookmark

---

# 36. AI Chat Component

Support

- Bubble
- Citation
- Markdown
- Formula
- Attachment
- Streaming

---

# 37. CBT Component

Support

- Question Palette
- Timer
- Navigation
- Flag
- Auto Save Indicator
- Network Indicator

---

# 38. Empty State

Support

- Illustration
- Title
- Description
- CTA

---

# 39. Error State

Support

- Illustration
- Error Message
- Retry Button

---

# 40. Loading State

Support

- Skeleton
- Spinner
- Progress

---

# 41. Responsive Rules

Desktop

```
>=1200 px
```

Tablet

```
768–1199 px
```

Mobile

```
<768 px
```

Semua komponen wajib adaptif.

---

# 42. Accessibility

Semua komponen wajib memenuhi:

- WCAG 2.2 AA
- Keyboard Navigation
- Screen Reader
- Focus Ring
- Minimum Touch Area 44×44 px
- Color Contrast ≥ 4.5:1

---

# 43. Motion Support

Animasi:

- Fade
- Slide
- Scale

Durasi

```
150 ms

200 ms

300 ms
```

Tidak menggunakan animasi berlebihan.

---

# 44. Naming Convention

Format:

```
Component

↓

Variant

↓

State

↓

Size
```

Contoh

```
Button

Primary

Hover

Large
```

---

# 45. Figma Structure

```
Atoms

Molecules

Organisms

Templates

Pages
```

Setiap komponen memiliki:

- Auto Layout
- Variant
- Design Token
- Documentation

---

# 46. Component Checklist

Setiap komponen wajib memiliki:

✔ Variant

✔ Size

✔ State

✔ Dark Mode

✔ Accessibility

✔ Responsive

✔ Interaction

✔ Documentation

✔ Design Token

✔ Figma Variant

✔ Storybook Story

✔ Unit Test

---

# 47. Recommended Tech Stack

Frontend

- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui (base component)
- Radix UI (headless primitives)
- React Hook Form
- TanStack Table
- TanStack Virtual
- Framer Motion
- Recharts
- KaTeX
- Lucide React

---

# 48. Folder Structure

```
components/

├── ui/
│
├── layout/
│
├── dashboard/
│
├── material/
│
├── practice/
│
├── cbt/
│
├── ai/
│
├── charts/
│
├── forms/
│
├── table/
│
├── feedback/
│
└── common/
```

---

# 49. Storybook Structure

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

Semua komponen harus memiliki:

- Interactive Example
- Props Documentation
- Accessibility Test
- Responsive Preview

---

# 50. QA Checklist

□ Semua komponen menggunakan Design Token.

□ Tidak ada hardcoded color.

□ Semua memiliki Dark Mode.

□ Semua memiliki Hover State.

□ Semua memiliki Focus State.

□ Semua memiliki Disabled State.

□ Semua memenuhi WCAG 2.2 AA.

□ Responsive.

□ Variant lengkap.

□ Storybook tersedia.

□ Unit Test tersedia.

□ Dokumentasi lengkap.

□ Digunakan secara konsisten di seluruh aplikasi.

---

# 51. Component Priority (MVP)

## Tier 1 (Core)

- AppShell
- Sidebar
- Header
- Button
- Input
- Card
- Modal
- Table
- Badge
- Avatar
- Search Box

## Tier 2

- Chart
- Drawer
- Tabs
- Accordion
- Progress
- Pagination
- Tooltip
- Toast

## Tier 3

- AI Chat
- Question Viewer
- Material Card
- Question Palette
- Formula Renderer
- PDF Viewer
- File Upload
- OCR Preview
````

## Rekomendasi

Untuk YakinLulus.id, seluruh UI sebaiknya dibangun di atas **satu Design System terpadu**, bukan membuat komponen baru di setiap fitur. Gunakan **shadcn/ui** sebagai fondasi, **Radix UI** untuk perilaku (accessibility dan interaction), lalu bungkus dengan komponen internal (`YKButton`, `YKCard`, `YKDataTable`, `YKQuestionViewer`, dan sebagainya). Dengan pendekatan ini, seluruh halaman—Student Dashboard, Teacher Dashboard, Admin Dashboard, Learning Material, Practice, CBT, hingga AI Tutor—akan memiliki tampilan, perilaku, dan pengalaman pengguna yang konsisten sekaligus memudahkan pemeliharaan dan pengembangan jangka panjang.
