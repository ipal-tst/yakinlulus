# Technical Specification: Super Siswa Testing Account

**Date**: 2026-08-08  
**Module**: RBAC & Content Access Control (`backend/internal/middleware`, `backend/cmd/seed`, `backend/internal/academic`, `backend/internal/material`, `backend/internal/practice`)

---

## 1. Executive Summary

This document specifies the creation of a **Super Siswa** role and seed account (`supersiswa@yakinlulus.id`). Super Siswa operates with full student UI capabilities while bypassing all grade/level filtering restrictions, allowing full testing of questions, materials, tryouts, and practice tests across all education levels (SD, SMP, SMA, UTBK, Kedinasan).

---

## 2. Role & User Specifications

- **Role Code**: `SUPER_SISWA`
- **Role Name**: `Super Siswa (Testing)`
- **User Email**: `supersiswa@yakinlulus.id`
- **User Password**: `Admin@123!`
- **User Full Name**: `Super Siswa Testing`

---

## 3. Backend System Modifications

### 3.1 Middleware & RBAC (`backend/internal/middleware/auth.go`)
- Define `RoleSuperSiswa = "SUPER_SISWA"`.
- Update `HasAnyRole` to recognize `SUPER_SISWA` alongside `SISWA` for student endpoints.

### 3.2 Database Seeder (`backend/cmd/seed/main.go`)
- Seed `SUPER_SISWA` role into `identity.role`.
- Seed `supersiswa@yakinlulus.id` user and attach `SUPER_SISWA` role.

### 3.3 Grade Filter Bypass Logic
- Where endpoints enforce student grade restrictions (e.g. `role == "SISWA"`), update condition to:
  `if (role == "SISWA") && role != "SUPER_SISWA"`
- This ensures `SUPER_SISWA` receives all available content without grade filter narrowing.
