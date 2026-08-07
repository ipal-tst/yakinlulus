# Design System
## YakinLulus.id

Version : 1.0
Status  : Production Ready
Design Style : Modern Minimal Education
Target Platform : Web Desktop, Tablet, Mobile
Framework : Next.js + Tailwind CSS v4 + shadcn/ui

---

# 1. Design Philosophy

YakinLulus merupakan platform EdTech yang berfokus pada pembelajaran, latihan soal, CBT, analitik, dan persiapan ujian.

Design harus memenuhi prinsip berikut:

- Clean
- Professional
- Modern
- Fast
- Accessible
- Focus on Learning
- Low Cognitive Load
- Data Driven
- Responsive

Pengguna harus dapat menemukan informasi penting kurang dari 3 detik.

---

# 2. Design Principles

## Simplicity

Hilangkan elemen visual yang tidak memberikan nilai.

Gunakan whitespace secara cukup.

Jangan menggunakan dekorasi berlebihan.

---

## Consistency

Semua halaman harus memiliki:

- ukuran icon sama
- ukuran button konsisten
- warna konsisten
- spacing konsisten
- typography konsisten

---

## Focus

Halaman CBT harus membuat siswa fokus.

Tidak boleh ada:

- popup mengganggu
- animasi besar
- background ramai
- iklan

---

## Accessibility

Minimal memenuhi WCAG AA

Kontras warna minimal 4.5:1

Keyboard navigation

Screen Reader Friendly

Visible Focus Ring

---

# 3. Visual Style

Style utama:

Modern Minimal

Dipadukan dengan

- Card Based UI
- Soft Glassmorphism (hanya popup)
- Flat Design
- Soft Shadow

Jangan menggunakan

❌ Skeuomorphism

❌ Heavy Gradient

❌ Full Neumorphism

❌ Glass di seluruh halaman

---

# 4. Brand Personality

YakinLulus harus terasa

Profesional

Cerdas

Ramah

Modern

Menyenangkan

Terpercaya

Fokus Belajar

---

# 5. Color Palette

## Primary

Blue

```

50  #EFF6FF
100 #DBEAFE
200 #BFDBFE
300 #93C5FD
400 #60A5FA
500 #3B82F6
600 #2563EB
700 #1D4ED8
800 #1E40AF
900 #1E3A8A

```

---

## Secondary

Green

```

50  #F0FDF4
100 #DCFCE7
200 #BBF7D0
300 #86EFAC
400 #4ADE80
500 #22C55E
600 #16A34A
700 #15803D
800 #166534

```

---

## Accent

Orange

```

50  #FFF7ED
100 #FFEDD5
200 #FED7AA
300 #FDBA74
400 #FB923C
500 #F97316
600 #EA580C
700 #C2410C

```

---

## Neutral

```

White

Gray50
Gray100
Gray200
Gray300
Gray400
Gray500
Gray600
Gray700
Gray800
Gray900

```

---

## Semantic

Success

Green500

Warning

Orange500

Error

Red500

Info

Blue500

---

# 6. Color Usage

70%

Primary

20%

Neutral

10%

Accent

Jangan menggunakan orange sebagai background utama.

---

# 7. Typography

Primary Font

Inter

Alternative

Plus Jakarta Sans

Code

JetBrains Mono

---

## Font Weight

Regular

Medium

Semibold

Bold

---

## Font Size

Display

48

H1

40

H2

32

H3

28

H4

24

Body

16

Small

14

Caption

12

---

# 8. Spacing

Gunakan skala 4px

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

96

---

# 9. Border Radius

Small

8px

Default

12px

Large

16px

Dialog

20px

Pill

999px

---

# 10. Shadow

Gunakan shadow ringan.

Small

Card

Medium

Dropdown

Large

Dialog

---

# 11. Iconography

Gunakan

Lucide React

Style

Outline

Stroke 2

Ukuran

16

20

24

32

---

# 12. Button

Primary

Blue

Secondary

White

Outline

Danger

Red

Success

Green

Warning

Orange

Ghost

Transparent

Ukuran

Small

Medium

Large

Icon

Icon Only

---

# 13. Form

Input Height

44px

Border Radius

12px

Label selalu di atas input.

Error ditampilkan di bawah input.

Placeholder warna Gray400.

---

# 14. Card

Radius

16

Padding

24

Border

Gray200

Shadow

Small

Hover

Shadow Medium

---

# 15. Navigation

Desktop

Sidebar kiri

Top Navigation

Mobile

Bottom Navigation

Drawer

---

# 16. Layout

Max Width

1600px

Content Width

1440px

Sidebar

280px

Collapsed

72px

Topbar

72px

---

# 17. Dashboard

Semua informasi menggunakan card.

Section

Greeting

Progress

Continue Learning

Analytics

Exam

Leaderboard

Recommendation

News

---

# 18. CBT UI

Harus Full Focus.

Layout

Header

Question

Options

Navigation

Question Palette

Timer

Rule

Tidak boleh ada distraksi.

---

# 19. Learning Page

Hero

Continue Learning

Chapter

Sub Chapter

Video

PDF

Exercise

Discussion

---

# 20. Analytics

Gunakan

Bar Chart

Area Chart

Pie Chart

Line Chart

Heatmap

Progress Ring

---

# 21. Animation

Durasi

150ms

200ms

250ms

Gunakan

Fade

Slide

Scale

Hover

Tidak boleh

Bounce

Spin

Flash

---

# 22. Empty State

Gunakan ilustrasi sederhana.

Tambahkan CTA.

Contoh

Belum ada latihan.

Mulai latihan sekarang.

---

# 23. Loading

Gunakan Skeleton.

Jangan Spinner penuh layar.

---

# 24. Notification

Toast

Top Right

Dialog

Center

Alert

Inline

---

# 25. Responsive

Breakpoint

Mobile

Tablet

Laptop

Desktop

UltraWide

Semua card harus responsive.

---

# 26. Dark Mode

Support penuh.

Primary tetap Blue.

Background

Gray950

Card

Gray900

Text

Gray50

---

# 27. Illustration

Style

Flat Illustration

Simple

Education

Friendly

Tidak menggunakan karakter anime.

---

# 28. Image Style

Sudut rounded.

Resolusi tinggi.

Lazy Loading.

---

# 29. Data Table

Sticky Header

Pagination

Sorting

Filtering

Column Resize

Export

---

# 30. Charts

Gunakan warna

Blue

Green

Orange

Gray

Hindari lebih dari 6 warna.

---

# 31. Gamification

Progress Ring

XP

Badge

Achievement

Level

Streak

Leaderboard

Animasi ringan.

---

# 32. Design Tokens

Primary

Secondary

Accent

Success

Danger

Warning

Info

Radius

Spacing

Shadow

Typography

Semua token menggunakan CSS Variables.

---

# 33. Component Library

Semua komponen dibuat reusable.

Button

Input

Select

Dialog

Drawer

Card

Badge

Tabs

Accordion

Tooltip

Dropdown

Table

Chart

Toast

Skeleton

Progress

Avatar

Pagination

Breadcrumb

Command Palette

Date Picker

Calendar

---

# 34. Accessibility

Keyboard Friendly

Screen Reader

Visible Focus

ARIA Label

Contrast AA

Skip Navigation

---

# 35. Performance

Lazy Image

Lazy Component

Code Splitting

Virtual List

Prefetch

Tree Shaking

Optimized Font

---

# 36. Motion Guideline

Semua animasi

Natural

Cepat

Tidak mengganggu proses belajar.

---

# 37. UX Guideline

Minimal Click

Dashboard ≤2 klik

Mulai Ujian ≤2 klik

Belajar ≤2 klik

Cari Soal ≤3 klik

---

# 38. Error UI

404

500

403

Offline

Connection Lost

Semua memiliki ilustrasi dan CTA.

---

# 39. Future Ready

Design system harus mudah dikembangkan untuk:

AI Tutor

Video Meeting

Forum Diskusi

Live Class

Marketplace

Tryout Nasional

Mobile App

---

# 40. Technology

Frontend

Next.js 16

React 19

Tailwind CSS v4

shadcn/ui

Motion

Framer Motion

Chart

Recharts

Icon

Lucide

Table

TanStack Table

State

Zustand

Query

TanStack Query

Theme

next-themes

---

# Design Goal

Target akhir desain adalah:

- Profesional seperti Notion
- Cepat seperti Linear
- Bersih seperti Stripe Dashboard
- Mudah dipahami seperti Google Classroom
- Fokus saat CBT seperti Safe Exam Browser
- Modern dengan komponen shadcn/ui
- Konsisten untuk seluruh modul YakinLulus.id