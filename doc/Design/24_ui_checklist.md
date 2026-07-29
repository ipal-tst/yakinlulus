````markdown
# 24_ui_checklist.md

> Product : YakinLulus.id  
> Module : UI Quality Assurance Checklist  
> Document Type : UI Review & Acceptance Checklist  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

Dokumen ini merupakan standar Quality Assurance (QA) untuk seluruh User Interface YakinLulus.id.

Checklist digunakan oleh:

- UI Designer
- UX Designer
- Frontend Engineer
- Product Manager
- QA Engineer

Tujuan:

- menjaga konsistensi UI;
- mengurangi bug visual;
- memastikan seluruh halaman memenuhi Design System;
- mempercepat proses review sebelum implementasi.

---

# 2. Definition of Done

Sebuah halaman dinyatakan **UI Complete** apabila:

✅ Design Review selesai

✅ UX Review selesai

✅ Responsive selesai

✅ Accessibility memenuhi WCAG 2.2 AA

✅ Dark Mode selesai

✅ Semua state tersedia

✅ Developer Handoff selesai

---

# 3. General UI Checklist

## Layout

□ Layout mengikuti Grid System.

□ Tidak ada elemen keluar dari container.

□ Alignment konsisten.

□ Spacing menggunakan Design Token.

□ Margin konsisten.

□ Padding konsisten.

□ Tidak ada overlap.

□ Tidak ada scroll horizontal.

□ Container Width sesuai standar.

□ Layout stabil pada semua breakpoint.

---

## Typography

□ Menggunakan font resmi.

□ Heading hierarchy benar.

□ Font size sesuai guideline.

□ Line height sesuai.

□ Letter spacing sesuai.

□ Kontras teks memenuhi WCAG.

□ Tidak ada font hardcoded.

□ Tidak ada font terlalu kecil (<16 px untuk body).

---

## Color

□ Menggunakan Color Token.

□ Tidak ada hardcoded color.

□ Brand Color sesuai.

□ Status Color sesuai.

□ Kontras memenuhi WCAG.

□ Dark Mode tersedia.

□ Hover Color tersedia.

□ Focus Color tersedia.

---

## Icon

□ Menggunakan Lucide Icon.

□ Ukuran konsisten.

□ Stroke konsisten.

□ Alignment benar.

□ Icon memiliki label jika diperlukan.

---

## Button

□ Variant lengkap.

□ Hover.

□ Focus.

□ Active.

□ Disabled.

□ Loading.

□ Icon Button benar.

□ Touch Target ≥44 px.

---

## Form

□ Label tersedia.

□ Placeholder benar.

□ Helper Text tersedia.

□ Error State tersedia.

□ Success State tersedia.

□ Required Indicator tersedia.

□ Keyboard Navigation baik.

□ Validation jelas.

---

## Card

□ Shadow sesuai.

□ Radius sesuai.

□ Padding konsisten.

□ Hover tersedia.

□ Loading tersedia.

□ Empty State tersedia.

---

## Table

□ Header jelas.

□ Sorting.

□ Filter.

□ Pagination.

□ Responsive.

□ Sticky Header.

□ Empty State.

□ Loading.

□ Error.

---

## Modal

□ Focus Trap.

□ Close Button.

□ ESC berfungsi.

□ Responsive.

□ Scroll Lock.

□ Animation.

---

## Navigation

□ Sidebar benar.

□ Active Menu.

□ Breadcrumb.

□ Search.

□ User Menu.

□ Mobile Navigation.

---

# 4. Dashboard Checklist

## KPI

□ Semua KPI tampil.

□ Icon sesuai.

□ Nilai benar.

□ Loading tersedia.

□ Empty State tersedia.

---

## Chart

□ Tooltip.

□ Legend.

□ Filter.

□ Export.

□ Responsive.

□ Loading.

□ Empty.

□ Error.

---

## Widget

□ Card konsisten.

□ Height konsisten.

□ Margin konsisten.

□ Responsive.

---

# 5. Learning Material Checklist

□ Thumbnail.

□ Progress.

□ Difficulty.

□ Bookmark.

□ Favorite.

□ Download.

□ Continue Learning.

□ Completed State.

---

# 6. Question Bank Checklist

□ Search.

□ Filter.

□ Subject.

□ Chapter.

□ Difficulty.

□ Preview.

□ Explanation.

□ Favorite.

□ Download.

---

# 7. Practice Checklist

□ Timer.

□ Progress.

□ Navigation.

□ Review Answer.

□ Explanation.

□ Score.

□ Retry.

---

# 8. CBT Checklist

□ Timer.

□ Auto Save.

□ Question Palette.

□ Flag Question.

□ Next.

□ Previous.

□ Finish Confirmation.

□ Submit.

□ Offline Indicator.

□ Network Status.

□ Anti Refresh Warning.

---

# 9. AI Tutor Checklist

□ Chat.

□ Markdown.

□ Formula.

□ Citation.

□ Upload.

□ OCR.

□ Streaming.

□ History.

□ Recommendation.

□ Regenerate.

□ Feedback.

---

# 10. Animation Checklist

□ Hover.

□ Button.

□ Modal.

□ Drawer.

□ Toast.

□ Skeleton.

□ Chart.

□ Page Transition.

□ prefers-reduced-motion.

---

# 11. Accessibility Checklist

□ WCAG AA.

□ Keyboard Navigation.

□ Screen Reader.

□ Focus Ring.

□ Alt Image.

□ Form Label.

□ Error Message.

□ Contrast.

□ Zoom 200%.

□ Touch Target.

---

# 12. Responsive Checklist

Desktop

□ 1440 px

□ 1920 px

Tablet

□ 768 px

□ 1024 px

Mobile

□ 320 px

□ 360 px

□ 390 px

□ 414 px

---

# 13. Dark Mode Checklist

□ Background.

□ Text.

□ Border.

□ Card.

□ Button.

□ Table.

□ Chart.

□ AI Chat.

□ Modal.

□ Sidebar.

□ Header.

---

# 14. Performance Checklist

□ CLS <0.1

□ LCP <2.5 s

□ INP <200 ms

□ Lazy Loading.

□ Image Optimization.

□ Skeleton.

□ Code Split.

□ Virtualization.

---

# 15. Browser Checklist

Desktop

□ Chrome

□ Edge

□ Firefox

□ Safari

Mobile

□ Chrome Android

□ Safari iOS

□ Samsung Internet

---

# 16. Device Checklist

Desktop

□ 1280 px

□ 1366 px

□ 1440 px

□ 1600 px

□ 1920 px

Tablet

□ iPad Mini

□ iPad Air

□ iPad Pro

Mobile

□ Android

□ iPhone

---

# 17. Component Checklist

Setiap komponen wajib memiliki:

□ Variant

□ State

□ Responsive

□ Dark Mode

□ Accessibility

□ Documentation

□ Design Token

□ Storybook

□ Unit Test

---

# 18. Design System Checklist

□ Menggunakan Color Token.

□ Typography Token.

□ Radius Token.

□ Shadow Token.

□ Motion Token.

□ Spacing Token.

□ Breakpoint Token.

---

# 19. UX Checklist

□ User Flow sederhana.

□ CTA jelas.

□ Feedback jelas.

□ Empty State informatif.

□ Error mudah dipahami.

□ Success Message jelas.

□ Loading tidak membingungkan.

□ Navigation konsisten.

---

# 20. Security UI Checklist

□ Password Hide/Show.

□ Session Timeout Warning.

□ Confirm Delete.

□ Permission Message.

□ Audit Indicator.

□ Sensitive Data Masking.

---

# 21. Analytics Checklist

□ Event Tracking.

□ Click Event.

□ Page View.

□ Search.

□ Filter.

□ Download.

□ Submit.

□ AI Usage.

---

# 22. Developer Handoff Checklist

□ Auto Layout.

□ Variables.

□ Component.

□ Variant.

□ Prototype.

□ Responsive.

□ Interaction.

□ Documentation.

□ Naming.

---

# 23. Review Workflow

```
Designer

↓

Peer Review

↓

Lead Designer

↓

Product Review

↓

Frontend Review

↓

QA Review

↓

Approved

↓

Development
```

---

# 24. Release Checklist

□ UI Review.

□ UX Review.

□ Accessibility Review.

□ Responsive Review.

□ Browser Test.

□ Performance Test.

□ Stakeholder Approval.

□ Release Note.

---

# 25. Quality Score

Gunakan penilaian berikut.

| Category | Score |
|----------|------:|
| Layout | 10 |
| Typography | 10 |
| Color | 10 |
| Component | 15 |
| Accessibility | 15 |
| Responsive | 15 |
| UX | 15 |
| Performance | 10 |
| Documentation | 10 |

Total

```
100 Point
```

---

# 26. Release Criteria

| Score | Status |
|---------|-------------|
| 95–100 | Production Ready |
| 90–94 | Minor Revision |
| 80–89 | Need Improvement |
| <80 | Not Ready |

---

# 27. Severity Classification

## Critical

- Layout rusak
- Data tidak terlihat
- Navigasi gagal
- Tidak dapat digunakan

Harus diperbaiki sebelum release.

---

## High

- Responsive rusak
- Accessibility gagal
- Dark Mode rusak
- Performance buruk

---

## Medium

- Spacing
- Typography
- Alignment
- Animation

---

## Low

- Copywriting
- Icon
- Minor Visual

---

# 28. Recommended Tools

## UI Review

- Figma Dev Mode
- Storybook

## Accessibility

- Lighthouse
- axe DevTools
- WAVE

## Responsive

- Chrome DevTools
- Responsively App

## Performance

- Lighthouse
- WebPageTest

## Browser Testing

- BrowserStack

---

# 29. Final Sign-Off

| Reviewer | Status |
|----------|--------|
| UI Designer | □ |
| UX Designer | □ |
| Product Manager | □ |
| Frontend Lead | □ |
| QA Engineer | □ |

---

# 30. Master Checklist

## Visual

□ Layout

□ Typography

□ Color

□ Icon

□ Image

□ Chart

□ Component

---

## UX

□ Navigation

□ Flow

□ Feedback

□ Error

□ Empty

---

## Technical

□ Responsive

□ Accessibility

□ Dark Mode

□ Performance

□ Browser

□ Analytics

---

## Documentation

□ Figma

□ Design Token

□ Storybook

□ API Mapping

□ Component Library

---

# 31. Quality Gate

Sebuah halaman **tidak boleh di-merge ke branch `main`** apabila salah satu kondisi berikut belum terpenuhi:

- Accessibility < WCAG 2.2 AA
- Responsive gagal pada breakpoint utama
- Komponen tidak menggunakan Design Token
- Tidak memiliki Loading, Empty, atau Error State
- Dark Mode belum didukung
- Belum lolos UI Review dan QA Review

---

# 32. Design Notes

## Minimum Acceptance Standard

Sebuah halaman dianggap selesai apabila:

- UI Score ≥95
- Tidak ada Critical Issue
- Tidak ada High Issue
- Semua checklist wajib tercentang
- Telah diuji pada desktop, tablet, dan mobile
- Lolos pengujian accessibility dan performance

Dengan checklist ini, seluruh antarmuka YakinLulus.id memiliki standar kualitas yang konsisten sebelum masuk ke tahap implementasi maupun produksi.
````
