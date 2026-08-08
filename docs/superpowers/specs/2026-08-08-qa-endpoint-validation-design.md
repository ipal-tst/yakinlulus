# QA Endpoint Validation Design Specification

**Date**: 2026-08-08  
**Project**: YakinLulus.id  
**Scope**: 14 Modules, 149 Backend Endpoints (`/api/v1`)

---

## 1. Overview & Purpose

The goal of this task is to create a full QA Endpoint Validation suite for all 149 backend REST endpoints of YakinLulus.id.
The solution combines:
1. **Automated Go QA Test CLI (`backend/cmd/qa_validator`)**: Fast, scriptable, zero-dependency test runner written in Go that executes against a running backend instance (`http://localhost:8080/api/v1`), measures performance/latency, validates JSON response structures (`code`, `status`, `message`, `data`), tests RBAC permissions, and outputs a formatted Markdown/JSON test summary report.
2. **Postman Collection & Environment (`docs/qa/`)**: A standardized Postman Collection v2.1 containing all 149 endpoints organized into 14 module folders with pre-request scripts, automated test scripts (`pm.test`), and an environment file (`YakinLulus_Dev.postman_environment.json`) ready for Postman, Bruno, or Newman CLI.

---

## 2. Architecture & Components

```
yakinlulus/
├── backend/
│   └── cmd/
│       └── qa_validator/
│           ├── main.go                     # Entrypoint & CLI flag parsing
│           ├── client/
│           │   └── client.go               # HTTP client with auth context & latency measurement
│           ├── suites/
│           │   ├── auth_suite.go           # /auth/* endpoints (15)
│           │   ├── academic_suite.go       # /academic/* endpoints (16)
│           │   ├── question_bank_suite.go  # /questions/* endpoints (10)
│           │   ├── cbt_exams_suite.go      # /exams/* endpoints (24)
│           │   ├── cbt_runtime_suite.go    # /cbt/* endpoints (10)
│           │   ├── scoring_suite.go        # /results/* endpoints (2)
│           │   ├── analytics_suite.go      # /analytics/* endpoints (9)
│           │   ├── media_suite.go          # /media/* endpoints (4)
│           │   ├── materials_suite.go      # /materials/* endpoints (10)
│           │   ├── schools_suite.go        # /schools/* endpoints (10)
│           │   ├── notifications_suite.go  # /notifications/* endpoints (15)
│           │   ├── dashboard_suite.go      # /dashboard/* endpoints (3)
│           │   ├── exam_packages_suite.go  # /exam-packages/*, /leaderboard (8)
│           │   └── practice_ai_suite.go    # /practice/*, /ai/* endpoints (10)
│           └── reporter/
│               └── reporter.go             # Console formatter & report generator (MD/JSON)
└── docs/
    └── qa/
        ├── YakinLulus_QA.postman_collection.json
        ├── YakinLulus_Dev.postman_environment.json
        └── qa_report.md                    # Generated QA test report output
```

---

## 3. Detailed Specifications

### A. Go QA Validator CLI
- **Flags**:
  - `--base-url` (default: `http://localhost:8080/api/v1`)
  - `--report-md` (default: `docs/qa/qa_report.md`)
  - `--report-json` (default: `docs/qa/qa_report.json`)
  - `--verbose` (default: `false`)
- **Authentication Credentials**:
  - `SUPER_ADMIN`: `admin@yakinlulus.id` / `Admin@123!`
  - `GURU`: `guru.budi@yakinlulus.id` / `Admin@123!`
  - `SISWA`: `murid@yakinlulus.id` / `Admin@123!`
- **Validation Criteria**:
  - Status codes matching endpoint contracts (e.g. 200 OK, 201 Created, 401 Unauthorized, 403 Forbidden).
  - Standard JSON envelope structure: `code` (int), `status` (string), `message` (string).
  - Maximum latency tracking per request.
  - Role-based security checks: verifies that student tokens receive `403` on admin-only routes (`/dashboard/admin`, `/auth/users`, etc.).

### B. Postman Collection (v2.1)
- Structured into 14 folder modules:
  1. `1. Auth`
  2. `2. Academic`
  3. `3. Question Bank`
  4. `4. CBT Exams`
  5. `5. CBT Runtime`
  6. `6. Scoring`
  7. `7. Analytics`
  8. `8. Media`
  9. `9. Materials`
  10. `10. School & Branding`
  11. `11. Notifications`
  12. `12. Dashboard`
  13. `13. Exam Packages & Leaderboard`
  14. `14. Practice & AI`
- Each endpoint includes test assertions:
  ```js
  pm.test("Status code is 200/201", function () {
      pm.expect(pm.response.code).to.be.oneOf([200, 201]);
  });
  pm.test("Response has valid envelope", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData).to.have.property('status');
  });
  ```

---

## 4. Test Execution & Verification Flow

1. Boot live backend (`backend/server.exe` or `go run ./cmd/api`).
2. Run `go run ./cmd/qa_validator` from `backend/`.
3. Verify output in console and inspect `docs/qa/qa_report.md`.
4. Validate `docs/qa/YakinLulus_QA.postman_collection.json` JSON structure.
