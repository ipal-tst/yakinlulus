# 10_form_handling.md

# Form Handling

## 1. Tujuan

Dokumen ini menjelaskan standar implementasi Form Handling pada Frontend YakinLulus.id.

Form merupakan komponen penting karena banyak aktivitas utama platform membutuhkan input pengguna:

- Login
- Registration
- Profile Management
- Question Creation
- Exam Configuration
- Material Upload
- Search and Filtering
- Administrative Management

Tujuan implementasi Form Handling:

- Validasi input yang konsisten.
- Mengurangi bug input.
- Memberikan UX yang baik.
- Menjaga performa rendering.
- Memisahkan UI, validation, dan business logic.
- Mendukung form kompleks.
- Mendukung Offline First pada kasus tertentu.

---

# 2. Konsep

YakinLulus.id menggunakan kombinasi:

```
React Hook Form

+

Zod Schema Validation

+

TypeScript

+

Server Validation
```

---

## Form Architecture

```
User Input

    │

    ▼

React Hook Form

    │

    ▼

Zod Validation

    │

    ▼

Mutation Hook

    │

    ▼

API Service

    │

    ▼

Backend Validation
```

---

## Validation Principle

Validasi dilakukan pada beberapa layer.

```
Frontend Validation

        +

Backend Validation
```

Frontend:

- UX.
- Feedback cepat.
- Mengurangi request tidak perlu.

Backend:

- Security.
- Business Rule.
- Data Integrity.

---

# Form Classification

## Simple Form

Contoh:

- Login
- Search
- Filter

Karakteristik:

- Field sedikit.
- Tidak membutuhkan state kompleks.

---

## Complex Form

Contoh:

- Create Question.
- Create Exam.
- Material Editor.

Karakteristik:

- Banyak field.
- Nested data.
- Conditional field.
- File upload.

---

## Dynamic Form

Contoh:

- Question Option.
- Exam Section.
- Material Chapter.

Karakteristik:

- Field dapat bertambah atau berkurang.

---

# 3. Architecture Diagram (ASCII)

```
                    Form Component

                          │

                          ▼

                  React Hook Form

                          │

                          ▼

                   Form Schema

                          │

                          ▼

                     Zod Resolver

                          │

                          ▼

                 Submit Handler

                          │

                          ▼

                Mutation / Service

                          │

                          ▼

                   Backend API
```

---

# 4. Component Explanation

## 4.1 React Hook Form

React Hook Form menjadi standar pengelolaan form.

Digunakan untuk:

- Form state.
- Field registration.
- Validation trigger.
- Submission handling.
- Error state.

---

Keuntungan:

- Performa tinggi.
- Minimal re-render.
- Integrasi Zod.
- TypeScript friendly.

---

# 4.2 Zod Schema

Zod digunakan untuk mendefinisikan aturan input.

Contoh:

```
Email required

Password minimum length

Question title required

Exam duration positive number
```

---

Schema menjadi kontrak:

```
Form

↓

Validation Rule

↓

API Payload
```

---

# 4.3 Form Component

Form component bertanggung jawab terhadap:

- Rendering field.
- Menampilkan error.
- Submit action.

Tidak bertanggung jawab terhadap:

- API call langsung.
- Business logic.
- Permission.

---

# 4.4 Form Field Component

Reusable field component:

Contoh:

```
FormInput

FormSelect

FormTextarea

FormCheckbox

FormDatePicker

FormUpload
```

---

Tanggung jawab:

- Label.
- Input.
- Error message.
- Helper text.
- Accessibility.

---

# 4.5 Mutation Layer

Submit form melalui mutation.

Flow:

```
Submit

↓

Mutation Hook

↓

Service

↓

API Client

↓

Backend
```

---

# 5. Implementation Detail

# 5.1 Folder Structure

Feature form berada dalam domain masing-masing.

Contoh:

```
features/

question-bank/

├── components/

│   └── QuestionForm.tsx

│

├── validation/

│   └── question.schema.ts

│

├── hooks/

│   └── useCreateQuestion.ts

│

├── services/

│   └── question.service.ts

│

└── types/

    └── question.ts
```

---

# 5.2 Form Schema Implementation

Contoh konsep:

```typescript
const loginSchema = z.object({

 email:
 z.string().email(),

 password:
 z.string().min(8)

});
```

---

Schema digunakan oleh:

- React Hook Form.
- Type inference.
- Backend payload mapping.

---

# 5.3 Type Inference

Gunakan infer dari schema.

Contoh:

```typescript
type LoginForm =
z.infer<typeof loginSchema>;
```

Keuntungan:

- Tidak ada duplikasi type.
- Schema menjadi single source of truth.

---

# 5.4 Form Component Pattern

Struktur:

```
Form

├── Header

├── Field Group

├── Validation Message

├── Action Button

└── Loading State
```

---

# 5.5 Submit Handling

Flow:

```
User Submit

      │

      ▼

Validate Form

      │

      ▼

Valid?

      │

 ┌────┴────┐

 No        Yes

 │          │

Error       Submit

             │

             ▼

        Mutation

             │

             ▼

        API Request
```

---

# 5.6 Loading State

Saat submit:

Button berubah:

```
Normal

Submit


↓

Loading

Submitting...
```

---

Tujuan:

- Mencegah double submit.
- Memberikan feedback.

---

# 5.7 Error Handling

Jenis error:

## Client Validation Error

Contoh:

```
Email format salah
```

Ditampilkan langsung.

---

## Server Validation Error

Contoh:

```
Question duplicate
```

Dikirim backend.

---

## Network Error

Contoh:

```
Connection failed
```

Tampilkan retry option.

---

# 5.8 Dynamic Field

Digunakan untuk:

- Question options.
- Material section.
- Exam rules.

Menggunakan:

```
useFieldArray()
```

---

Contoh:

```
Question

Option A

Option B

Option C

Option D

+ Add Option
```

---

# 5.9 File Upload Form

Digunakan pada:

- Material.
- Question image.
- Explanation media.

Flow:

```
Select File

      │

      ▼

Client Validation

      │

      ▼

Upload Service

      │

      ▼

Storage

      │

      ▼

Save Metadata
```

---

Validasi:

- File size.
- File type.
- Extension.
- Upload status.

---

# 5.10 Auto Save Form

Digunakan untuk:

- CBT Answer.
- Long Content Editor.

Flow:

```
User Input

      │

      ▼

Debounce

      │

      ▼

Save Draft

      │

      ▼

Sync Queue
```

---

# 6. Flow / Example

# Login Form Flow

```
User

 │

 ▼

Email + Password

 │

 ▼

React Hook Form

 │

 ▼

Zod Validation

 │

 ▼

Login Mutation

 │

 ▼

Auth Service

 │

 ▼

Backend

 │

 ▼

Session Created
```

---

# Question Creation Flow

```
Teacher

 │

 ▼

Question Form

 │

 ▼

Input Data

 │

 ▼

Validate Schema

 │

 ▼

Upload Image

 │

 ▼

Submit Question

 │

 ▼

Backend Validation

 │

 ▼

Question Saved
```

---

# Exam Configuration Flow

```
Admin

 │

 ▼

Create Exam Form

 │

 ▼

Select Subject

 │

 ▼

Select Question Pool

 │

 ▼

Set Duration

 │

 ▼

Publish Exam
```

---

# 7. Best Practice

## Single Source Validation

Schema menjadi sumber aturan input.

Jangan membuat:

```
Component Validation

+

Separate Validation

+

Different API Validation
```

tanpa alasan.

---

## Jangan Simpan Form Global State

Hindari:

```
Zustand

↓

All Form Data
```

Gunakan:

```
React Hook Form
```

---

## Gunakan Controlled Component Hanya Jika Perlu

Sebisa mungkin gunakan uncontrolled approach dari React Hook Form.

---

## Selalu Berikan Feedback

Setiap form harus memiliki:

- Loading.
- Success.
- Error.
- Validation Message.

---

## Prevent Duplicate Submit

Gunakan:

- Disabled button.
- Mutation status.

---

## Gunakan Schema Untuk Complex Form

Form sederhana dapat inline validation.

Form besar wajib menggunakan schema terpisah.

---

# 8. Security Consideration

## Input Sanitization

Semua input user harus dianggap tidak terpercaya.

Terutama:

- Rich Text.
- HTML Content.
- Explanation Material.
- Upload Metadata.

---

## File Upload Security

Frontend melakukan:

- Extension check.
- MIME check.
- Size limit.

Backend tetap melakukan validasi final.

---

## Sensitive Data

Jangan menyimpan:

- Password.
- Credential.
- Token.
- Private information.

di form state persistence.

---

## CSRF Protection

Request mutasi harus mengikuti mekanisme security backend.

---

# 9. Performance Consideration

Optimasi:

- React Hook Form uncontrolled mode.
- Field level rendering.
- Lazy load complex form.
- Debounce search.
- Avoid unnecessary validation.

---

Form besar seperti:

```
Question Editor

Material Editor

Exam Builder
```

harus menggunakan:

- Sectioning.
- Lazy Component.
- Virtualization jika diperlukan.

---

# 10. Scalability Consideration

Arsitektur form mendukung:

- Banyak role.
- Banyak jenis input.
- Dynamic builder.
- Question generator.
- AI assisted content creation.
- Offline form submission.

---

Future:

```
Static Form

↓

Dynamic Form Engine

↓

Schema Driven Form Builder
```

---

# 11. Future Evolution

## Schema Driven Form

Form dapat dibuat berdasarkan konfigurasi.

Contoh:

```
Field Definition

↓

Renderer

↓

Validation Schema

↓

Submit Handler
```

---

## AI Form Assistant

Dapat membantu:

- Generate question.
- Suggest answer.
- Detect incomplete data.
- Auto correction.

---

## Offline Form Engine

Untuk kondisi koneksi terbatas:

```
Form Input

↓

Local Storage

↓

Sync Worker

↓

Backend
```

---

## Visual Form Builder

Admin dapat membuat form tanpa coding.

---

# Summary

Form Handling YakinLulus.id menggunakan React Hook Form, Zod Validation, TypeScript, dan Backend Validation sebagai fondasi utama. Pendekatan ini memastikan form tetap performant, aman, mudah dikembangkan, dan mampu menangani kebutuhan kompleks seperti CBT, Question Bank, Material Management, serta fitur administratif. Arsitektur ini juga mempersiapkan platform menuju Dynamic Form Engine dan Offline Form Processing di masa depan.