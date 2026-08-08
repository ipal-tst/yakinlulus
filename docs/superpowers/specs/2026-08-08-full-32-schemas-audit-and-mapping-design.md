# Comprehensive 32 Database Schemas Audit & Backend Mapping Specification

**Date**: 2026-08-08  
**Scope**: Full Stack Audit across all 32 PostgreSQL Schemas and 26 Go Backend Modules

## Executive Summary
This specification documents the complete mapping audit of all 32 PostgreSQL schemas in the YakinLulus.id database against the 26 backend Go modules in `backend/internal/`. It confirms which modules exist, which schemas are system/infrastructure-level (Supabase/PostgreSQL native), and specifies how every domain module links to **Master Akademik (`academic` schema)**.

---

## 1. Master Database Schemas Audit & Backend Mapping Table

| No | Database Schema | Backend Module (`backend/internal/`) | Status in Backend | Master Akademik Linkage & Responsibility |
|---|---|---|---|---|
| 1 | `academic` | `academic/` | **Implemented** | **Source of Truth**: `education_level`, `grade`, `subject`, `chapter`, `topic`. |
| 2 | `cbt` | `cbt_engine/`, `cbt_runtime/`, `scoring/` | **Implemented** | Exams, packages, question pools linked to `academic.grade` & `academic.subject`. |
| 3 | `question` | `question_bank/` | **Implemented** | Bank Soal tagged with `academic.subject_id`, `academic.grade_id`, `academic.chapter_id`. |
| 4 | `content` | `content/`, `material/` | **Implemented** | Modul Materi & Ringkasan tagged with `academic.subject_id`, `grade_id`, `chapter_id`. |
| 5 | `ai` | `ai/` | **Implemented** | Generator Soal & Pembahasan AI filtered by `academic.subject` and `grade`. |
| 6 | `ocr` | `ai/` | **Implemented** | Image-to-Text OCR parsing for Questions and Study Materials. |
| 7 | `analytics` | `analytics/`, `dashboard/` | **Implemented** | Student score analytics & progress tracking per `academic.subject`. |
| 8 | `ranking` | `ranking/` | **Implemented** | National & Tryout Leaderboard linked to `cbt.exam` and `academic.grade`. |
| 9 | `practice` | `practice/` | **Implemented** | Practice question sessions by `academic.subject_id` & `chapter_id`. |
| 10 | `school` | `school/`, `target_schools/` | **Implemented** | Target PTN & High School directory for student target matching. |
| 11 | `identity` | `auth/`, `user_mgmt/`, `profile/` | **Implemented** | User profiles, roles, student grade level (`academic.grade_id`). |
| 12 | `auth` | `auth/` | **Implemented** | JWT Authentication, refresh tokens, role-based access control (RBAC). |
| 13 | `cms` | `cms/` | **Implemented** | Landing page banners, announcements, news articles. |
| 14 | `finance` | `admin/` (Finance APIs) | **Implemented** | Payouts, payment transactions, subscription invoices. |
| 15 | `subscription` | `subscription/` | **Implemented** | Student premium packages and feature access limits. |
| 16 | `media` | `media/` | **Implemented** | Storage upload metadata for question images, avatars, materials. |
| 17 | `notification` | `notification/` | **Implemented** | In-app notifications & exam reminders. |
| 18 | `audit` | `audit/` | **Implemented** | System audit logs, security events, admin activity trail. |
| 19 | `monitoring` | `admin/` (Health APIs) | **Implemented** | DB connection pool metrics, API latency stats. |
| 20 | `search` | `content/`, `question_bank/` | **Implemented** | Full-text search index for questions and materials. |
| 21 | `report` | `analytics/`, `dashboard/` | **Implemented** | Exportable CSV/PDF reports for exam attempts and scores. |
| 22 | `config` | `admin/`, `shared/` | **Implemented** | Global system configuration & feature flags. |
| 23 | `shared` | `shared/` | **Implemented** | Shared DTOs, response formatters, error models. |
| 24 | `public` | `shared/` | **Implemented** | Legacy public tables & migration helper views. |
| 25 | `integration` | `shared/` | **Implemented** | External payment gateway & webhook integrations. |
| 26 | `queue` | `shared/` | **Implemented** | Asynchronous background worker queue for scoring & emails. |
| 27 | `storage` | `media/` | **System DB Schema** | Supabase Storage bucket management. |
| 28 | `realtime` | `ws/` | **System DB Schema** | Supabase Realtime WebSocket listener for live CBT timers. |
| 29 | `extensions` | Database System | **System DB Schema** | PostgreSQL Extensions (`pgcrypto`, `uuid-ossp`, `vector`). |
| 30 | `pgbouncer` | Database Infrastructure | **System DB Schema** | PGBouncer connection pool manager. |
| 31 | `graphql` | Supabase Engine | **System DB Schema** | Supabase GraphQL auto-generated schema. |
| 32 | `graphql_public` | Supabase Engine | **System DB Schema** | Supabase Public GraphQL endpoint. |

---

## 2. Immediate Action Plan for Alignment

1. **CBT Repository (`backend/internal/content/repository.go`)**:
   - Write `category` directly into `cbt.exam.exam_type`.
   - Map `cbt.exam_grade` with `academic.grade` & `academic.education_level` in `scanExam`.
   - Calculate total questions directly from `cbt.exam_question_pool` / `cbt.exam_package_question`.

2. **Frontend Routing (`frontend/src/app/(siswa)/exams/page.tsx`)**:
   - Fix student exam action link from `/cbt/${exam.id}/start` to `/exams/${exam.id}`.

3. **QA Verification**:
   - Recompile `qa_validator.exe` and verify 46/46 API endpoint test suites pass.
   - Run `npm run build` in `frontend/` to confirm 100% clean production build.
