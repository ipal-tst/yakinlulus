# 02_navigation.md

> Version: 1.0
> Product: YakinLulus.id
> Document Type: Design System
> Status: Draft
> Owner: Product Design Team

---

# 1. Purpose

Dokumen ini mendefinisikan standar navigasi pada seluruh platform YakinLulus.id.

Navigation System bertujuan untuk:

- mempermudah pengguna menemukan fitur
- mengurangi cognitive load
- meningkatkan discoverability
- menjaga konsistensi seluruh aplikasi
- mendukung ekspansi fitur di masa depan
- mempercepat onboarding pengguna baru

Navigation merupakan salah satu fondasi utama User Experience.

---

# 2. Navigation Philosophy

> **Navigation should never require thinking.**

Pengguna tidak boleh berpikir:

- dimana fitur berada
- bagaimana kembali
- bagaimana berpindah halaman

Semua harus terasa natural.

---

# 3. Navigation Principles

Navigation harus memiliki karakter berikut.

- Predictable
- Consistent
- Scalable
- Accessible
- Fast
- Discoverable
- Minimal

---

# 4. Navigation Hierarchy

Platform menggunakan tiga level navigasi.

```
Primary Navigation

↓

Secondary Navigation

↓

Context Navigation
```

Tidak boleh lebih dari tiga level.

---

# 5. Navigation Architecture

```
Application

│

├── Primary Navigation

│      ├── Dashboard
│      ├── Learning
│      ├── Practice
│      ├── CBT
│      ├── AI
│      ├── Progress
│      ├── Community
│      ├── Downloads
│      ├── Settings

│

├── Secondary Navigation

│      ├── Tabs
│      ├── Filters
│      ├── Categories

│

└── Context Navigation

       ├── Breadcrumb
       ├── Back
       ├── Wizard
```

---

# 6. Primary Navigation

Primary Navigation menggunakan Sidebar.

Posisi:

```
Left
```

Status:

```
Fixed
```

Lebar:

Expanded

```
280 px
```

Collapsed

```
88 px
```

---

# 7. Sidebar Structure

```
LOGO

──────────────

Dashboard

My Courses

Practice Questions

CBT Exam

AI Tutor

Progress

Leaderboard

Schedule

Downloads

Forum

──────────────

Settings

Help Center

──────────────

Upgrade Premium

──────────────

Profile
```

---

# 8. Sidebar Groups

Menu dikelompokkan berdasarkan fungsi.

## Learning

```
Dashboard

My Courses

Learning Materials
```

---

## Assessment

```
Practice

Question Bank

CBT

Tryout
```

---

## AI

```
AI Tutor

AI Explanation

AI Recommendation
```

---

## Performance

```
Progress

Analytics

Leaderboard

Achievements
```

---

## Community

```
Forum

Discussion

Announcement
```

---

## Personal

```
Downloads

Bookmark

Settings

Profile
```

---

# 9. Sidebar Behavior

Expanded

```
Icon

+

Text
```

Collapsed

```
Icon Only
```

Hover

```
Tooltip
```

Active

```
Blue Indicator

Background Highlight

Bold Text
```

---

# 10. Active Navigation

Menu aktif harus memiliki:

✔ Background Biru

✔ Icon Berwarna

✔ Indicator kiri

✔ Bold Typography

Contoh.

```
│

█ Dashboard

```

---

# 11. Hover State

Hover hanya memberikan feedback.

Tidak mengubah layout.

Hover:

- background lebih terang
- icon berubah warna
- cursor pointer

---

# 12. Disabled State

Menu disabled memiliki:

- opacity 40%
- cursor default
- tooltip

---

# 13. Badge

Badge digunakan untuk:

- New
- Beta
- Notification
- Premium

Contoh.

```
AI Tutor

NEW
```

---

# 14. Notification Badge

Badge merah.

Berisi:

Jumlah maksimal.

```
99+
```

Jika lebih.

Tetap:

```
99+
```

---

# 15. Header Navigation

Header bukan navigation utama.

Header hanya berisi.

```
Search

Quick Action

Notification

Theme

Profile
```

---

# 16. Search

Search selalu berada di Header.

Search bersifat:

Global Search.

Dapat mencari:

- soal
- materi
- ujian
- guru
- kelas
- AI
- forum

Shortcut.

```
CTRL + K
```

---

# 17. Breadcrumb

Breadcrumb digunakan mulai level kedua.

Contoh.

```
Dashboard

>

Practice

>

Matematika

>

Aljabar
```

---

# 18. Back Navigation

Menggunakan tombol Back.

Tidak mengandalkan browser.

Contoh.

```
← Kembali ke Daftar Soal
```

---

# 19. Tabs

Tabs digunakan pada halaman yang memiliki banyak section.

Contoh.

```
Overview

Question

Discussion

Statistic

History
```

Maksimal.

```
7 Tabs
```

---

# 20. Wizard Navigation

Digunakan pada:

- CBT Setup
- Import Soal
- Registration
- Checkout

Contoh.

```
Step 1

↓

Step 2

↓

Step 3

↓

Finish
```

---

# 21. Pagination

Gunakan Pagination apabila data > 20.

Default.

```
20

50

100
```

per halaman.

---

# 22. Filter Navigation

Filter selalu berada di atas tabel.

Urutan.

```
Search

↓

Filter

↓

Sort

↓

View
```

---

# 23. Context Menu

Gunakan Context Menu untuk aksi sekunder.

Contoh.

```
...

Edit

Delete

Duplicate

Archive
```

---

# 24. Floating Action Button

FAB hanya digunakan pada Mobile.

Desktop menggunakan Button biasa.

---

# 25. Mobile Navigation

Menggunakan Bottom Navigation.

```
Dashboard

Practice

CBT

AI

Profile
```

Maksimal.

```
5 Menu
```

---

# 26. Drawer

Menu tambahan.

```
Bookmark

Forum

Downloads

Settings

Premium

```

---

# 27. Navigation Priority

Urutan prioritas.

```
Dashboard

↓

Continue Learning

↓

Practice

↓

CBT

↓

AI

↓

Progress
```

---

# 28. Student Navigation Tree

```
Dashboard

├── Continue Learning
├── My Courses
├── Practice
├── Question Bank
├── CBT
├── AI Tutor
├── Progress
├── Leaderboard
├── Downloads
├── Forum
├── Settings
```

---

# 29. Teacher Navigation Tree

```
Dashboard

├── Question Bank
├── Learning Material
├── CBT Management
├── Student Progress
├── Analytics
├── Forum
├── Reports
├── Settings
```

---

# 30. Admin Navigation Tree

```
Dashboard

├── User Management
├── School Management
├── Question Bank
├── CBT
├── Content
├── AI
├── Payment
├── Reports
├── Audit Log
├── System
```

---

# 31. Navigation Animation

Sidebar.

Expand

```
200 ms
```

Collapse

```
180 ms
```

Dropdown.

```
150 ms
```

Hover.

```
100 ms
```

---

# 32. Keyboard Navigation

Harus mendukung.

```
TAB

SHIFT TAB

ENTER

ESC

Arrow Keys
```

Shortcut.

```
CTRL + K

Search

```

---

# 33. Accessibility

Navigation wajib:

- dapat digunakan keyboard
- memiliki aria-label
- memiliki focus state
- memiliki tooltip
- memiliki contrast AA

---

# 34. Responsive Behavior

Desktop.

Sidebar Fixed.

Tablet.

Sidebar Drawer.

Mobile.

Bottom Navigation.

---

# 35. Do

✔ Gunakan icon yang konsisten.

✔ Kelompokkan menu berdasarkan fungsi.

✔ Gunakan badge seperlunya.

✔ Gunakan tooltip ketika sidebar collapse.

✔ Letakkan Search di Header.

✔ Gunakan breadcrumb pada halaman dalam.

---

# 36. Don't

✘ Jangan menggunakan Top Navigation untuk semua menu.

✘ Jangan membuat lebih dari tiga level navigasi.

✘ Jangan menyembunyikan fitur penting.

✘ Jangan menggunakan hamburger menu di desktop.

✘ Jangan membuat menu berpindah posisi.

✘ Jangan membuat ikon tanpa label pada desktop expanded.

---

# 37. Engineering Guidelines

Komponen yang wajib tersedia.

```
<AppSidebar>

<SidebarItem>

<SidebarGroup>

<SidebarFooter>

<AppHeader>

<SearchBar>

<Breadcrumb>

<TabNavigation>

<BottomNavigation>

<Drawer>

<ContextMenu>

<Pagination>

<FilterBar>
```

Seluruh halaman wajib menggunakan komponen ini.

---

# 38. Acceptance Criteria

Navigation dianggap memenuhi standar apabila:

- Seluruh fitur dapat diakses maksimal dalam tiga klik dari Dashboard.
- Lokasi menu konsisten di seluruh aplikasi.
- Sidebar dapat di-collapse tanpa kehilangan aksesibilitas.
- Search global dapat diakses dengan `Ctrl + K`.
- Breadcrumb muncul pada halaman level dua dan seterusnya.
- Mobile menggunakan Bottom Navigation.
- Semua state (default, hover, active, disabled, focus) tersedia.

---

# 39. Future Scalability

Navigation dirancang untuk mendukung:

- 30+ menu
- Multi Role
- Multi Workspace
- Plugin Module
- AI Workspace
- Multi School
- White Label
- Multi Language

Tanpa mengubah struktur utama Sidebar.

---

# 40. Navigation Summary

> **Navigation should guide users, not challenge them.**

Prinsip utama:

- Sidebar sebagai pusat navigasi.
- Header sebagai pusat utilitas.
- Search bersifat global.
- Breadcrumb menunjukkan konteks.
- Maksimal tiga level navigasi.
- Selalu konsisten di seluruh platform.