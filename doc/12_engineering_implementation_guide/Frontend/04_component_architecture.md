# 04_component_architecture.md

# Component Architecture

## 1. Tujuan

Dokumen ini menjelaskan standar arsitektur komponen pada Frontend YakinLulus.id.

Tujuan utama dari arsitektur komponen adalah:

- Meningkatkan reusability.
- Mengurangi duplikasi kode.
- Menjaga konsistensi UI.
- Memisahkan UI dan business logic.
- Mempermudah testing.
- Mempermudah maintenance.
- Mendukung parallel development.
- Menjaga performa React.

Seluruh komponen harus mengikuti prinsip:

- Single Responsibility Principle (SRP)
- Composition over Inheritance
- Stateless First
- Predictable Rendering
- Reusable by Design

---

# 2. Konsep

Pada YakinLulus.id, Component Architecture dibangun secara bertingkat.

```
Application

↓

Page

↓

Feature Component

↓

Shared Component

↓

Primitive UI Component

↓

HTML Element
```

Semakin ke bawah, komponen semakin generik.

Sebaliknya, semakin ke atas, komponen semakin spesifik terhadap domain bisnis.

---

## Hierarki Komponen

```
Page

│

├── Feature Component

│      │

│      ├── Feature Section

│      │

│      ├── Feature Widget

│      │

│      └── Shared Component

│

└── Primitive UI
```

Prinsip ini memastikan business logic tidak masuk ke komponen UI dasar.

---

# 3. Architecture Diagram (ASCII)

```
                     Dashboard Page

                           │

        ┌──────────────────┼──────────────────┐

        ▼                  ▼                  ▼

 ProgressCard       RankingWidget      AnnouncementList

        │                  │                  │

        ▼                  ▼                  ▼

      Card             DataTable          AlertCard

        │                  │                  │

        ▼                  ▼                  ▼

     Button            Badge            Avatar

        │

        ▼

    HTML Element
```

---

# 4. Component Explanation

Frontend menggunakan lima level komponen.

---

## 4.1 Primitive Component

Level paling bawah.

Berisi komponen UI dasar.

Contoh:

```
Button

Input

Textarea

Checkbox

Switch

Badge

Avatar

Dialog

Tabs

Card

Accordion

Tooltip

Popover

Table
```

Karakteristik:

- Tidak memiliki business logic.
- Tidak melakukan API Call.
- Tidak mengetahui domain aplikasi.
- Sangat reusable.
- Dibangun di atas shadcn/ui.

---

## 4.2 Shared Component

Merupakan kombinasi beberapa Primitive Component.

Contoh:

```
SearchBar

Pagination

EmptyState

ConfirmDialog

LoadingScreen

DataFilter

ErrorPanel

OfflineBanner

Breadcrumb
```

Karakteristik:

- Digunakan oleh banyak feature.
- Tidak mengetahui aturan bisnis.
- Memiliki sedikit presentational logic.
- Tidak memiliki akses langsung ke API.

---

## 4.3 Feature Component

Komponen khusus milik satu feature.

Contoh:

```
ExamQuestionCard

QuestionNavigator

ExamTimer

ExamReviewDialog

MaterialViewer

LeaderboardCard

ProfileStatistic
```

Karakteristik:

- Mengetahui domain feature.
- Menggunakan hook feature.
- Menggunakan service feature.
- Tidak digunakan oleh feature lain secara langsung.

---

## 4.4 Section Component

Menggabungkan beberapa Feature Component menjadi satu area halaman.

Contoh:

```
DashboardSummarySection

ExamQuestionSection

ProfileInformationSection

MaterialContentSection

RankingSummarySection
```

Section bertugas mengatur layout dan koordinasi antar widget dalam satu area.

---

## 4.5 Page Component

Merupakan entry point suatu route.

Contoh:

```
Dashboard Page

Exam Page

Login Page

Profile Page

Ranking Page
```

Page memiliki tanggung jawab:

- Memanggil data.
- Menyusun layout.
- Mengatur metadata.
- Menghubungkan feature dengan routing.

Page tidak boleh berisi implementasi UI yang kompleks secara langsung.

---

# 5. Implementation Detail

## Struktur Komponen

```
components/

ui/

layout/

common/

feedback/

charts/
```

---

## Struktur Feature

```
features/

exam/

components/

ExamHeader.tsx

ExamTimer.tsx

QuestionCard.tsx

QuestionNavigator.tsx

QuestionPalette.tsx

ReviewDialog.tsx
```

Business component tetap berada di dalam feature.

---

## Contoh Komposisi

```
Exam Page

│

├── ExamHeader

├── ExamInformation

├── ExamQuestion

├── QuestionPalette

├── NavigationFooter

└── SubmitDialog
```

Setiap komponen hanya menangani satu bagian tampilan.

---

## Smart vs Dumb Component

### Presentational Component

Hanya menerima data melalui props.

Contoh:

```
StudentCard

QuestionCard

Badge

Avatar

ProgressBar
```

Karakteristik:

- Stateless jika memungkinkan.
- Mudah diuji.
- Tidak mengetahui sumber data.

---

### Container Component

Mengelola state dan menghubungkan ke hook atau service.

Contoh:

```
DashboardContainer

ExamContainer

MaterialContainer
```

Container bertugas:

- Memanggil hook.
- Mengelola loading.
- Menangani error.
- Mengirim props ke presentational component.

---

## Component Composition

Gunakan pendekatan composition.

Contoh:

```
<Card>

<CardHeader>

<CardContent>

<CardFooter>

</Card>
```

Hindari membuat komponen yang terlalu besar dengan banyak variasi melalui props yang kompleks.

---

## Props Design

Gunakan interface yang eksplisit.

Contoh:

```ts
interface QuestionCardProps {
  question: Question;
  selectedOption: string | null;
  onAnswerChange: (optionId: string) => void;
  disabled?: boolean;
}
```

Hindari penggunaan:

```ts
props: any
```

atau props yang tidak memiliki makna yang jelas.

---

## Barrel Export

Setiap folder komponen menyediakan:

```
index.ts
```

Contoh:

```ts
export * from "./QuestionCard";
export * from "./ExamTimer";
export * from "./QuestionNavigator";
```

Hal ini menyederhanakan import dan menyembunyikan struktur internal.

---

# 6. Flow / Example

## Rendering Flow

```
Route

     │

     ▼

Page

     │

     ▼

Section

     │

     ▼

Feature Component

     │

     ▼

Shared Component

     │

     ▼

Primitive Component

     │

     ▼

HTML
```

---

## Exam Flow

```
Exam Page

      │

      ▼

ExamContainer

      │

      ▼

ExamQuestionSection

      │

      ▼

QuestionCard

      │

      ▼

RadioOption

      │

      ▼

Button
```

---

## Dashboard Flow

```
Dashboard Page

      │

      ▼

SummarySection

      │

      ├─────────────► ProgressCard

      │

      ├─────────────► RankingCard

      │

      └─────────────► StatisticChart
```

---

# 7. Best Practice

## Komponen Maksimal Satu Tanggung Jawab

Jika sebuah komponen:

- menangani form,
- dialog,
- tabel,
- grafik,
- pagination,

secara bersamaan, maka komponen tersebut perlu dipecah.

---

## Hindari Props Berlebihan

Jika jumlah props mulai banyak dan saling berkaitan, evaluasi:

- apakah perlu dipecah menjadi beberapa komponen,
- apakah perlu menggunakan composition,
- atau apakah state sebaiknya dikelola oleh container.

---

## Gunakan Composition

Lebih disarankan:

```
<Card>

<CardHeader/>

<CardContent/>

</Card>
```

dibandingkan membuat satu komponen dengan banyak flag seperti:

```
<Card
header
footer
border
shadow
rounded
compact
...
/>
```

---

## Pisahkan UI dan Data

Komponen UI tidak boleh melakukan:

- fetch API,
- manipulasi cache,
- autentikasi,
- navigasi bisnis.

Seluruh data diperoleh melalui hook atau container.

---

## Jangan Membuat God Component

Komponen dengan ukuran ratusan baris dan banyak tanggung jawab akan sulit diuji dan dipelihara.

Sebagai pedoman:

- >300 baris: evaluasi pemecahan.
- >500 baris: hampir selalu perlu dipisah.

---

## Memoization Secara Selektif

Gunakan `React.memo`, `useMemo`, dan `useCallback` hanya jika terbukti mengurangi render yang tidak perlu.

Jangan melakukan optimasi prematur.

---

# 8. Security Consideration

- Escape seluruh input yang ditampilkan ke UI melalui mekanisme bawaan React.
- Hindari penggunaan `dangerouslySetInnerHTML` kecuali konten telah melalui proses sanitasi yang aman.
- Komponen upload harus memvalidasi tipe file sebelum dikirim ke backend.
- Komponen download tidak boleh mengekspos URL privat secara langsung.
- Jangan menampilkan informasi sensitif seperti token, identifier internal, atau detail error server kepada pengguna.

---

# 9. Performance Consideration

Komponen dirancang untuk:

- Mengurangi re-render.
- Mendukung lazy loading.
- Mendukung virtual scrolling untuk daftar besar.
- Mengurangi ukuran bundle melalui code splitting.
- Mengoptimalkan rendering dengan Server Component jika memungkinkan.

Komponen berat seperti:

- Chart,
- PDF Viewer,
- Rich Text Viewer,
- Media Player,

harus dimuat secara dinamis (`dynamic import`) pada saat dibutuhkan.

---

# 10. Scalability Consideration

Arsitektur ini memungkinkan:

- Penambahan komponen baru tanpa memengaruhi komponen lama.
- Pembuatan design system internal.
- Penggunaan ulang komponen pada area Student, Teacher, dan Admin.
- Dokumentasi komponen menggunakan Storybook atau alat serupa di masa depan.
- Migrasi komponen menjadi shared package dalam monorepo.

Dengan batas tanggung jawab yang jelas, setiap tim dapat mengembangkan feature secara independen.

---

# 11. Future Evolution

Arsitektur komponen dipersiapkan untuk mendukung:

### Design Token

Seluruh warna, spacing, typography, radius, dan elevation akan dikelola melalui design token sehingga konsisten antara Web dan Flutter.

---

### Headless Component

Komponen kompleks seperti DataTable, Combobox, dan Command Palette dapat dipisahkan menjadi headless component untuk meningkatkan fleksibilitas.

---

### Shared UI Package

Komponen `ui` dan `common` dapat diekstraksi menjadi package internal yang digunakan oleh seluruh aplikasi dalam ekosistem YakinLulus.id.

---

### Storybook Integration

Seluruh komponen reusable akan didokumentasikan secara visual sehingga developer dan designer memiliki referensi implementasi yang sama.

---

### Accessibility Enhancement

Seluruh komponen akan dievaluasi secara berkala terhadap standar WCAG, termasuk navigasi keyboard, screen reader, dan kontras warna.

---

# Summary

Arsitektur komponen Frontend YakinLulus.id menggunakan pendekatan bertingkat yang terdiri dari Primitive Component, Shared Component, Feature Component, Section Component, dan Page Component. Setiap level memiliki tanggung jawab yang jelas sehingga UI tetap modular, mudah diuji, mudah dipelihara, dan siap berkembang seiring bertambahnya kompleksitas aplikasi. Pendekatan ini memastikan konsistensi implementasi, performa yang baik, serta mendukung pengembangan skala enterprise.