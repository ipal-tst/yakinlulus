# 14_frontend_testing.md

# Frontend Testing

## 1. Tujuan

Dokumen ini menjelaskan strategi implementasi Frontend Testing pada YakinLulus.id.

Testing menjadi bagian penting untuk memastikan aplikasi tetap stabil ketika:

- Feature bertambah.
- Banyak developer bekerja bersama.
- Business logic semakin kompleks.
- CBT Engine berkembang.
- Multi platform dikembangkan.

Tujuan utama:

- Menjamin kualitas kode.
- Mengurangi regression bug.
- Memastikan UX berjalan sesuai requirement.
- Mendukung Continuous Integration.
- Mempermudah refactoring.
- Meningkatkan confidence sebelum production release.

---

# Testing Philosophy

YakinLulus.id menggunakan pendekatan:

```
Test Pyramid
```

dengan kombinasi:

```
                 E2E Test

                    ▲

                    │

             Integration Test

                    ▲

                    │

               Unit Test
```

---

# Testing Principle

Tidak semua kode harus diuji dengan cara yang sama.

Prioritas testing:

```
Critical Business Flow

        ↓

Complex Logic

        ↓

Reusable Component

        ↓

Utility Function
```

---

# Critical Feature Testing Priority

Prioritas tertinggi:

1. CBT Runtime.
2. Authentication.
3. Exam Submission.
4. Offline Sync.
5. Payment (future).
6. Question Management.
7. Learning Progress.

---

# 2. Konsep

Frontend testing dibagi menjadi beberapa layer:

```
Component Test

        +

Hook Test

        +

Integration Test

        +

End To End Test
```

---

# Testing Stack

Teknologi:

```
Vitest

+

React Testing Library

+

Playwright

+

MSW

+

TypeScript
```

---

# Testing Responsibility

## Unit Test

Menguji:

- Function.
- Hook.
- Utility.
- Business calculation.

---

## Component Test

Menguji:

- UI rendering.
- User interaction.
- Component behavior.

---

## Integration Test

Menguji:

- Beberapa component bekerja bersama.
- API interaction.
- State flow.

---

## E2E Test

Menguji:

- User journey lengkap.

Contoh:

```
Login

↓

Start Exam

↓

Answer Question

↓

Submit Exam
```

---

# 3. Architecture Diagram (ASCII)

```
                         Frontend Code

                              │

                              ▼

                       Testing Strategy

                              │

        ┌─────────────────────┼─────────────────────┐

        ▼                     ▼                     ▼

    Unit Test           Integration Test        E2E Test

        │                     │                     │

        ▼                     ▼                     ▼

    Vitest              React Testing          Playwright

                              │

                              ▼

                         CI Pipeline

                              │

                              ▼

                         Production
```

---

# 4. Component Explanation

# 4.1 Unit Testing

Unit test menguji bagian terkecil aplikasi.

Contoh:

```
calculateScore()

formatDate()

validateAnswer()
```

---

Karakteristik:

- Cepat.
- Tidak membutuhkan browser.
- Mudah dijalankan.

---

Contoh:

```
score.ts

score.test.ts
```

---

# 4.2 Component Testing

Menggunakan:

```
React Testing Library
```

Fokus:

- User behavior.
- Accessibility.
- Interaction.

---

Contoh:

Testing Button:

```
User Click

↓

Button State Change

↓

Expected Result
```

---

# 4.3 Hook Testing

Menguji custom hook.

Contoh:

```
useAuth()

useExamTimer()

usePermission()
```

---

Testing:

```
Input State

↓

Hook Execution

↓

Expected Output
```

---

# 4.4 Integration Testing

Integration test menguji hubungan antar bagian.

Contoh:

```
Exam Page

+

Exam Store

+

API Mock

+

Timer
```

---

# 4.5 End To End Testing

Menggunakan:

```
Playwright
```

E2E mensimulasikan pengguna nyata.

---

Contoh:

```
Browser

↓

Login

↓

Dashboard

↓

Exam

↓

Submit

↓

Result
```

---

# 4.6 API Mocking

Menggunakan:

```
MSW

(Mock Service Worker)
```

Tujuan:

- Test tanpa backend real.
- Simulasi response.
- Simulasi error.

---

Contoh:

```
GET /exam

↓

Mock Response

↓

Component Render
```

---

# 5. Implementation Detail

# 5.1 Testing Folder Structure

Struktur:

```
src/

features/

exam/

├── components/

│   ├── ExamTimer.tsx

│   └── ExamTimer.test.tsx

│

├── hooks/

│   ├── useExam.ts

│   └── useExam.test.ts

│

└── services/

    └── exam.service.test.ts
```

---

Global:

```
tests/

├── setup.ts

├── mocks/

│   └── handlers.ts

└── fixtures/
```

---

# 5.2 Vitest Configuration

Digunakan untuk:

- Unit test.
- Component test.

Konfigurasi:

```
Environment:

jsdom

Coverage:

enabled
```

---

# 5.3 Component Testing Pattern

Testing berdasarkan behavior.

Contoh:

Jangan:

```
Check Internal State
```

Tetapi:

```
User Action

↓

Expected UI Change
```

---

Contoh:

Exam Timer:

```
Timer Start

↓

Countdown

↓

Display Updated
```

---

# 5.4 Authentication Testing

Scenario:

## Login Success

```
Input Valid Credential

↓

Submit

↓

Receive Session

↓

Redirect Dashboard
```

---

## Login Failed

```
Wrong Password

↓

Show Error

↓

Stay Login Page
```

---

# 5.5 CBT Testing Strategy

CBT memiliki testing khusus.

Test:

## Timer

```
Start

↓

Countdown

↓

Expired

↓

Auto Submit
```

---

## Answer Persistence

```
Select Answer

↓

Save Local

↓

Restore Session
```

---

## Offline Recovery

```
Disconnect Network

↓

Answer Question

↓

Reconnect

↓

Sync
```

---

## Submit Flow

```
Submit

↓

Validate

↓

Send

↓

Result
```

---

# 5.6 Form Testing

Testing:

- Required field.
- Validation error.
- Submit success.
- Server error.

---

Contoh:

Question Form:

```
Empty Question

↓

Validation Error
```

---

# 5.7 Accessibility Testing

Menggunakan:

```
axe-core
```

Menguji:

- ARIA.
- Keyboard navigation.
- Contrast.
- Semantic HTML.

---

# 5.8 Visual Testing

Future support:

- Screenshot comparison.
- Component snapshot.
- UI regression detection.

---

# 5.9 CI Integration

Pipeline:

```
Developer Push

        │

        ▼

GitHub Actions

        │

        ├── Lint

        │

        ├── Unit Test

        │

        ├── Integration Test

        │

        ├── E2E Test

        │

        ▼

Deploy
```

---

# 6. Flow / Example

# Feature Development Flow

```
Developer

      │

      ▼

Create Component

      │

      ▼

Write Unit Test

      │

      ▼

Write Component Test

      │

      ▼

Integration Test

      │

      ▼

Pull Request

      │

      ▼

CI Validation
```

---

# CBT Release Testing Flow

```
CBT Feature Change

        │

        ▼

Unit Test

        │

        ▼

Runtime Test

        │

        ▼

Offline Test

        │

        ▼

E2E Simulation

        │

        ▼

Production Release
```

---

# User Journey Test Example

```
Student

↓

Login

↓

Select Exam

↓

Start Exam

↓

Answer 40 Questions

↓

Connection Lost

↓

Continue Offline

↓

Submit

↓

Receive Result
```

---

# 7. Best Practice

## Test User Behavior

Prioritaskan:

```
What User Does
```

bukan:

```
How Code Works Internally
```

---

## Critical Feature Must Have Test

Minimal:

- Authentication.
- CBT.
- Submission.
- Sync.

---

## Jangan Mock Semua Hal

Mock hanya:

- External dependency.
- API.
- Network.

---

## Maintain Test Quality

Test harus:

- Mudah dibaca.
- Stabil.
- Tidak brittle.

---

## Gunakan Realistic Data

Gunakan:

```
Test Fixture
```

yang menyerupai data production.

---

# 8. Security Consideration

## Security Testing

Frontend testing harus mencakup:

- XSS prevention.
- Input sanitization.
- Permission UI behavior.
- Sensitive data exposure.

---

## Authentication Test

Pastikan:

- Unauthorized user tidak dapat akses.
- Session expired ditangani.
- Permission sesuai role.

---

## Data Protection

Test memastikan:

- Token tidak muncul pada UI.
- Sensitive data tidak tersimpan.
- Error tidak membocorkan informasi internal.

---

# 9. Performance Consideration

Testing juga mengevaluasi:

- Bundle size.
- Rendering performance.
- Memory leak.
- Long session stability.

---

CBT khusus:

```
2-3 hour session

↓

Stable Memory Usage
```

---

# 10. Scalability Consideration

Testing architecture mendukung:

- Banyak developer.
- Banyak feature.
- Continuous delivery.
- Enterprise workflow.

---

Future:

```
Test Suite

↓

Distributed Testing

↓

Parallel Execution

↓

Fast CI Pipeline
```

---

# 11. Future Evolution

## AI Assisted Testing

AI dapat membantu:

- Generate test case.
- Detect missing coverage.
- Analyze regression.

---

## Automated User Simulation

Future:

```
AI Agent

↓

Simulate Student Behavior

↓

Find UX Issue
```

---

## Production Testing

Tambahan:

- Synthetic monitoring.
- Real user testing.
- Canary release validation.

---

# Summary

Frontend Testing YakinLulus.id menggunakan kombinasi Unit Test, Component Test, Integration Test, dan End-to-End Test dengan Vitest, React Testing Library, Playwright, dan MSW. Strategi ini memastikan fitur kritis seperti Authentication, CBT Runtime, Offline Sync, dan Exam Submission memiliki kualitas tinggi sebelum production. Testing menjadi bagian dari engineering workflow melalui CI/CD sehingga platform dapat berkembang secara aman dan stabil.