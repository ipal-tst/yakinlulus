````markdown
# 07_iconography.md

> Product : YakinLulus.id  
> Document Type : Design System  
> Version : 1.0.0  
> Status : Draft  
> Owner : Product Design Team

---

# 1. Purpose

Dokumen ini mendefinisikan standar penggunaan ikon pada seluruh platform YakinLulus.id.

Iconography System bertujuan untuk:

- meningkatkan kecepatan pemahaman visual;
- memperjelas fungsi komponen;
- menjaga konsistensi antarmuka;
- mendukung aksesibilitas;
- menyederhanakan implementasi frontend.

Seluruh icon yang digunakan wajib mengikuti standar pada dokumen ini.

---

# 2. Icon Philosophy

Icon bukan dekorasi.

Icon adalah alat komunikasi visual.

Setiap icon harus:

- mudah dikenali;
- konsisten;
- sederhana;
- memiliki makna yang jelas.

Jika sebuah icon tidak membantu pengguna memahami fungsi suatu elemen, maka icon tersebut tidak perlu digunakan.

---

# 3. Icon Design Principles

Seluruh icon harus memenuhi prinsip berikut.

- Simple
- Recognizable
- Consistent
- Minimal
- Pixel Perfect
- Accessible
- Scalable

---

# 4. Official Icon Library

YakinLulus.id menggunakan satu icon library resmi.

## Primary Library

**Lucide Icons**

Alasan:

- Open Source (ISC License)
- Modern
- Sangat konsisten
- Ringan
- Mendukung React
- Mendukung Figma
- Mendukung SVG
- Komunitas aktif

Official Website

https://lucide.dev

---

## Secondary Library

Digunakan hanya jika icon tidak tersedia pada Lucide.

**Tabler Icons**

https://tabler.io/icons

---

Tidak diperbolehkan mencampur berbagai style icon dalam satu aplikasi.

---

# 5. Icon Style

Seluruh icon menggunakan:

```
Outline
```

Bukan

```
Filled
```

Kecuali:

- Achievement Badge
- Medal
- Trophy
- Premium

---

# 6. Stroke

Default

```
2 px
```

Tidak diperbolehkan mengubah stroke secara acak.

---

# 7. Corner Style

Mengikuti bawaan Lucide.

- Rounded
- Clean
- Modern

---

# 8. Icon Size

| Token | Size |
|---------|------|
| icon-xs | 16 px |
| icon-sm | 20 px |
| icon-md | 24 px |
| icon-lg | 32 px |
| icon-xl | 40 px |
| icon-2xl | 48 px |
| icon-3xl | 64 px |

---

# 9. Usage Guidelines

## 16 px

Digunakan pada:

- Badge
- Chip
- Helper Text

---

## 20 px

Digunakan pada:

- Input
- Table
- Menu
- Breadcrumb

---

## 24 px

Default UI.

Digunakan pada:

- Sidebar
- Button
- Card
- Navigation
- Toolbar

---

## 32 px

Digunakan pada:

- Dashboard Widget
- Empty State

---

## 40–64 px

Digunakan pada:

- Hero
- Illustration
- Large Empty State

---

# 10. Color Rules

Icon menggunakan Semantic Color.

Default

```
color.text.secondary
```

Hover

```
color.primary
```

Disabled

```
color.text.disabled
```

Danger

```
color.error
```

Success

```
color.success
```

---

# 11. Icon Placement

Gap icon dengan text.

```
8 px
```

Icon selalu berada:

```
Left

+

Text
```

Kecuali:

- Dropdown
- Accordion
- Expand

---

# 12. Icon Alignment

Seluruh icon harus:

- pixel aligned;
- center aligned;
- mengikuti grid.

---

# 13. Sidebar Icons

Seluruh sidebar menggunakan:

```
24 px
```

Gap

```
16 px
```

Tidak menggunakan icon dengan ukuran berbeda.

---

# 14. Button Icons

Leading Icon

```
✓
```

Trailing Icon

```
✓
```

Icon Only Button

```
✓
```

Gap

```
8 px
```

---

# 15. Navigation Icons

Bottom Navigation

```
24 px
```

Header

```
20 px
```

Context Menu

```
18 px
```

---

# 16. Dashboard Icon Mapping

| Widget | Icon |
|----------|------|
| Dashboard | LayoutDashboard |
| Learning | BookOpen |
| Practice | PenTool |
| CBT | ClipboardCheck |
| AI Tutor | Bot |
| Progress | TrendingUp |
| Analytics | BarChart3 |
| Leaderboard | Trophy |
| Achievement | Medal |
| Calendar | Calendar |
| Notification | Bell |
| Download | Download |
| Bookmark | Bookmark |
| Forum | MessageCircle |
| Profile | User |
| Settings | Settings |
| Search | Search |

---

# 17. Student Icons

| Feature | Icon |
|----------|------|
| Continue Learning | PlayCircle |
| Today's Goal | Target |
| XP | Star |
| Streak | Flame |
| Accuracy | CheckCircle |
| Wrong Answer | XCircle |
| Recommendation | Sparkles |
| Weak Topic | TriangleAlert |
| Rank | Crown |

---

# 18. Teacher Icons

| Feature | Icon |
|----------|------|
| Question Bank | Library |
| Material | BookCopy |
| Students | Users |
| Exam | FileCheck |
| Review | ClipboardList |
| Class | GraduationCap |

---

# 19. Admin Icons

| Feature | Icon |
|----------|------|
| User Management | UsersRound |
| School | Building2 |
| Payment | CreditCard |
| Audit | ShieldCheck |
| Server | Server |
| Database | Database |
| AI | Cpu |

---

# 20. Functional Icons

| Action | Icon |
|---------|------|
| Add | Plus |
| Edit | Pencil |
| Delete | Trash2 |
| Save | Save |
| Upload | Upload |
| Download | Download |
| Filter | Filter |
| Sort | ArrowUpDown |
| Refresh | RefreshCw |
| Print | Printer |
| Share | Share2 |
| Copy | Copy |
| More | Ellipsis |
| Close | X |

---

# 21. Status Icons

| Status | Icon |
|----------|------|
| Success | CheckCircle2 |
| Warning | TriangleAlert |
| Error | CircleX |
| Info | Info |
| Loading | LoaderCircle |

---

# 22. Empty State Icons

Gunakan icon besar.

Ukuran

```
64 px
```

Opacity

```
30%
```

---

# 23. Icon Animation

Loading

```
Rotate
```

Refresh

```
Rotate
```

Success

```
Scale
```

Notification

```
Bell Shake
```

Bookmark

```
Scale
```

Durasi

```
200 ms
```

---

# 24. Accessibility

Icon dekoratif:

```
aria-hidden="true"
```

Icon fungsional:

Harus memiliki:

- aria-label
- tooltip
- keyboard support bila dapat diklik

Icon tidak boleh menjadi satu-satunya indikator status.

---

# 25. SVG Rules

Gunakan format:

```
SVG
```

Tidak menggunakan:

- PNG
- JPG
- BMP

SVG memberikan:

- ukuran kecil;
- scalable;
- mudah diberi warna.

---

# 26. Naming Convention

Gunakan nama asli dari library.

Contoh

```
BookOpen

Bell

Bot

Target

Calendar

Settings

Search
```

Jangan membuat alias berbeda.

---

# 27. React Mapping

```tsx
import {

BookOpen,

Bot,

Bell,

Search,

Settings

} from "lucide-react";
```

---

# 28. Flutter Mapping

Gunakan package:

```
lucide_icons_flutter
```

atau

```
flutter_tabler_icons
```

Seluruh icon dibungkus melalui:

```dart
AppIcon()
```

agar ukuran dan warna mengikuti Design Token.

---

# 29. Figma Structure

```
Icons

├── Navigation
├── Dashboard
├── Learning
├── Teacher
├── Admin
├── Status
├── Action
├── AI
├── Analytics
├── Misc
```

Semua icon disimpan sebagai Component.

---

# 30. Asset Management

Seluruh SVG disimpan pada:

```
/assets/icons/

navigation/

dashboard/

teacher/

admin/

status/

action/

misc/
```

---

# 31. Do

✔ Gunakan Lucide Icons.

✔ Gunakan ukuran sesuai token.

✔ Gunakan Semantic Color.

✔ Gunakan SVG.

✔ Gunakan outline style.

✔ Gunakan icon yang mudah dipahami.

---

# 32. Don't

✘ Jangan mencampur outline dan filled.

✘ Jangan menggunakan PNG sebagai icon.

✘ Jangan mengubah stroke.

✘ Jangan menggunakan lebih dari satu library tanpa alasan.

✘ Jangan menggunakan icon hanya sebagai dekorasi.

---

# 33. Recommended Resources

## Official Icon Library

Lucide

https://lucide.dev

---

## Figma Plugin

Lucide Icons

https://www.figma.com/community/plugin/1168700094974398609

---

## Secondary Library

Tabler Icons

https://tabler.io/icons

---

# 34. QA Checklist

- □ Semua icon berasal dari library resmi.
- □ Ukuran mengikuti Design Token.
- □ Warna menggunakan Semantic Color.
- □ SVG digunakan di seluruh aplikasi.
- □ Tidak ada icon blur.
- □ Alignment pixel-perfect.
- □ Tooltip tersedia untuk icon-only button.
- □ Aksesibilitas telah diverifikasi.

---

# 35. Future Scalability

Iconography System dirancang agar mendukung:

- Web
- Mobile
- Flutter
- Dark Mode
- White Label
- Multi Theme
- AI Module
- Future Feature

Tanpa mengubah struktur icon utama.
````

---

# Rekomendasi

Saya menyarankan **Lucide** dijadikan **satu-satunya icon library utama** untuk seluruh proyek YakinLulus.id.

Keunggulannya dibanding Heroicons, Feather, atau Material Icons:

* Konsisten dengan ekosistem **shadcn/ui** dan React modern.
* Sangat lengkap untuk dashboard, AI, analytics, dan education.
* Ringan karena berbasis SVG.
* Lisensi ISC (bebas digunakan untuk proyek komersial).
* Tersedia untuk Figma, React, React Native, Vue, Svelte, dan Flutter.

Dengan satu library resmi, seluruh UI akan memiliki gaya visual yang konsisten dan lebih mudah dipelihara.
