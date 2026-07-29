````markdown
# 18_motion_animation.md

> Product : YakinLulus.id  
> Module : Motion & Animation System  
> Document Type : UI/UX Specification  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

Motion System mendefinisikan seluruh standar animasi dan transisi pada YakinLulus.id agar memberikan pengalaman pengguna yang:

- Natural
- Konsisten
- Cepat
- Tidak mengganggu fokus belajar
- Membantu pengguna memahami perubahan UI

Motion bukan dekorasi, tetapi media komunikasi antara sistem dan pengguna.

---

# 2. Motion Principles

Seluruh animasi harus mengikuti prinsip berikut.

## Natural

Animasi menyerupai perpindahan objek nyata.

## Fast

Tidak membuat aplikasi terasa lambat.

## Functional

Setiap animasi memiliki tujuan.

## Consistent

Seluruh halaman menggunakan perilaku animasi yang sama.

## Minimal

Tidak menggunakan animasi yang berlebihan.

---

# 3. Motion Philosophy

Motion digunakan untuk:

✔ Memberikan feedback

✔ Menunjukkan perubahan state

✔ Menarik perhatian

✔ Membimbing pengguna

✔ Mengurangi cognitive load

Bukan untuk mempercantik tampilan semata.

---

# 4. Motion Duration

## Extra Fast

```
100 ms
```

Digunakan untuk:

- Hover
- Focus

---

## Fast

```
150 ms
```

Digunakan untuk:

- Button
- Icon

---

## Normal

```
200 ms
```

Digunakan untuk:

- Card
- Modal
- Drawer

---

## Slow

```
300 ms
```

Digunakan untuk:

- Page Transition
- Dashboard Widget

---

## Maximum

```
400 ms
```

Hanya untuk onboarding atau ilustrasi.

Tidak boleh melebihi:

```
500 ms
```

---

# 5. Easing Standard

Default

```
ease-out
```

Masuk

```
ease-out
```

Keluar

```
ease-in
```

Perubahan ukuran

```
ease-in-out
```

---

# 6. Animation Types

Seluruh aplikasi hanya menggunakan kombinasi animasi berikut.

- Fade
- Slide
- Scale
- Expand
- Collapse
- Progress
- Skeleton
- Pulse
- Rotate (Loading Only)

---

# 7. Hover Animation

Komponen:

- Button
- Card
- Menu
- Icon

Efek:

- Shadow meningkat
- Elevation naik
- Scale 1.02

Durasi:

```
150 ms
```

---

# 8. Button Animation

State

Default

↓

Hover

↓

Pressed

↓

Loading

↓

Disabled

Hover

- Shadow naik
- Brightness +5%

Pressed

- Scale 0.98

Loading

- Spinner
- Tidak boleh bergeser.

---

# 9. Card Animation

Hover

- Elevation naik
- Shadow bertambah
- Translate Y -2 px

Tidak menggunakan rotasi.

---

# 10. Sidebar Animation

Expand

```
240 px
```

↓

Collapse

```
72 px
```

Durasi

```
200 ms
```

Icon tetap terlihat.

---

# 11. Navigation Animation

Perpindahan menu:

- Fade
- Slide

Active Indicator

Slide mengikuti menu.

---

# 12. Page Transition

Setiap perpindahan halaman.

Animasi:

Fade

+

Slide Up

Durasi

```
250 ms
```

---

# 13. Modal Animation

Open

Scale

95%

↓

100%

Fade

Durasi

```
200 ms
```

Close

Reverse Animation.

---

# 14. Drawer Animation

Slide

Left

Right

Bottom

Durasi

```
200 ms
```

---

# 15. Accordion Animation

Expand

↓

Collapse

Menggunakan auto-height animation.

---

# 16. Tooltip Animation

Fade

+

Scale

Durasi

```
120 ms
```

---

# 17. Dropdown Animation

Slide Down

+

Fade

Durasi

```
150 ms
```

---

# 18. Toast Animation

Masuk

Slide

↓

Fade

Keluar

Fade

↓

Slide

---

# 19. Loading Animation

Menggunakan:

Skeleton

atau

Shimmer

Bukan spinner untuk konten utama.

Spinner hanya digunakan untuk proses singkat.

---

# 20. Skeleton Animation

Durasi

```
1.5 s
```

Loop

Infinite

---

# 21. Progress Animation

Linear

Animasi berlangsung sesuai progress sebenarnya.

Tidak dipercepat secara artifisial.

---

# 22. Chart Animation

Saat data pertama dimuat:

- Grow
- Fade

Durasi

```
300 ms
```

Chart tidak dianimasikan ulang setiap render.

---

# 23. Notification Badge

Ketika bertambah.

Scale

↓

Bounce kecil

↓

Normal

Durasi

```
200 ms
```

---

# 24. Search Animation

Search Box

Expand

↓

Focus

↓

Suggestion

Durasi

```
150 ms
```

---

# 25. Dashboard Widget

Widget muncul secara bertahap.

```
Top

↓

Bottom
```

Delay

```
40 ms
```

antar widget.

---

# 26. AI Tutor Animation

Typing Indicator

```
● ● ●
```

Streaming Text

Token muncul secara bertahap.

Avatar AI tidak dianimasikan berlebihan.

---

# 27. CBT Animation

CBT menggunakan animasi seminimal mungkin.

Hanya:

- Fade
- Progress
- Timer
- Palette Update

Tidak ada animasi dekoratif selama ujian berlangsung.

---

# 28. Success Animation

Gunakan:

Check Icon

↓

Scale

↓

Fade

Durasi

```
250 ms
```

---

# 29. Error Animation

Shake ringan

Horizontal

4 px

Durasi

```
180 ms
```

Digunakan pada:

- Form Error
- Login Error
- Validation Error

---

# 30. Empty State

Illustration

↓

Fade

↓

CTA

---

# 31. Accessibility

Apabila pengguna mengaktifkan:

```
prefers-reduced-motion
```

Semua animasi diganti menjadi:

- Instant
- Fade ringan

Animasi kompleks dimatikan.

---

# 32. Responsive Behavior

Desktop

Animasi penuh.

Tablet

Sedikit lebih ringan.

Mobile

Animasi lebih pendek.

Durasi dikurangi sekitar:

20%

---

# 33. Recommended Library

Frontend

- Framer Motion
- Motion One (opsional)
- CSS Transition

Tidak menggunakan GSAP untuk kebutuhan umum aplikasi.

---

# 34. Motion Token

```
motion-fast

motion-normal

motion-slow

motion-easing

motion-bounce

motion-fade

motion-slide
```

Seluruh animasi menggunakan Design Token.

---

# 35. Component Animation Matrix

| Component | Animation |
|-----------|-----------|
| Button | Scale |
| Card | Elevation |
| Modal | Fade + Scale |
| Drawer | Slide |
| Sidebar | Width Transition |
| Tooltip | Fade |
| Dropdown | Slide Down |
| Toast | Slide |
| Search | Expand |
| Table | Fade |
| Chart | Grow |
| AI Chat | Streaming |
| Skeleton | Shimmer |

---

# 36. Performance

Target:

- 60 FPS
- GPU Accelerated
- Transform & Opacity Only
- Hindari animasi pada width/height jika memungkinkan
- Tidak melakukan layout thrashing

---

# 37. QA Checklist

□ Hover konsisten.

□ Button memiliki semua state.

□ Card elevation benar.

□ Modal smooth.

□ Drawer smooth.

□ Tooltip cepat.

□ Dropdown tidak patah.

□ Toast muncul benar.

□ Loading menggunakan Skeleton.

□ Chart tidak berkedip.

□ AI Streaming berjalan.

□ CBT minim animasi.

□ Mendukung `prefers-reduced-motion`.

□ Tidak ada animasi lebih dari 500 ms.

□ Target 60 FPS tercapai.

---

# 38. Best Practices

Gunakan:

✔ Fade

✔ Slide

✔ Scale

✔ Skeleton

✔ Transform

✔ Opacity

✔ Framer Motion

✔ Design Token

Hindari:

✖ Bounce berlebihan

✖ Rotasi dekoratif

✖ Animasi terus-menerus

✖ Parallax

✖ Animasi panjang

✖ Efek 3D

✖ Flashing

✖ Animasi yang mengganggu proses belajar

---

# 39. Motion Priority

## Tier 1 (Wajib)

- Hover
- Button
- Modal
- Drawer
- Skeleton
- Toast
- Page Transition

## Tier 2

- Dashboard Widget
- Search
- Chart
- Notification

## Tier 3

- AI Streaming
- Success Animation
- Empty State
````

### Rekomendasi

Motion pada YakinLulus.id sebaiknya mengusung konsep **"Invisible Motion"**—animasi yang terasa alami tanpa menarik perhatian pengguna secara berlebihan. Halaman pembelajaran, latihan, dan CBT harus memprioritaskan fokus belajar dengan transisi yang cepat dan halus. Gunakan **Framer Motion** sebagai standar implementasi untuk seluruh animasi React, dikombinasikan dengan Design Token (`motion-fast`, `motion-normal`, `motion-slow`) agar seluruh aplikasi memiliki perilaku animasi yang konsisten, mudah dipelihara, dan tetap optimal di berbagai perangkat.
