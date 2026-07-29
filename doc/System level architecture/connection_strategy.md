# Strategi Koneksi Full-Stack: Frontend — API — Backend — Database

Cetakan biru (blueprint) arsitektur koneksi end-to-end untuk platform **YakinLulus.id** berbasis **Next.js 15 (Frontend)**, **Go Fiber REST API (Backend)**, dan **Supabase PostgreSQL (Database)**.

---

## 1. Topologi Arsitektur & Alur Data

```mermaid
graph TD
    Client[Next.js 15 App Router Frontend] -->|HTTPS / REST API| API[Go Fiber API Gateway :8080]
    API -->|JWT Middleware & RBAC| Services[Backend Service Modules]
    Services -->|Postgres Connection Pool| DB[(Supabase PostgreSQL)]
    Services -->|Cache & Session| Redis[(Redis Storage)]
    Services -->|Object Storage| MinIO[(MinIO S3 Media Storage)]
    
    subgraph Frontend Resilience
        Client -->|Offline Cache| LocalStore[LocalStorage / IndexedDB]
        LocalStore -->|Auto Sync Queue| Client
    end
```

---

## 2. Strategi Koneksi Frontend — API Client

### A. Environment Configuration
Frontend mengakses API Backend melalui variabel lingkungan terstandarisasi di `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### B. Unified API Client Wrapper (`frontend/lib/api-client.ts`)
Seluruh pemanggilan API dari komponen React/Next.js dipusatkan melalui kelas `ApiClient`:
- **Base URL Dynamics**: Menggunakan `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"`.
- **JWT Authorization Injector**: Otomatis menyisipkan `Authorization: Bearer <yl_access_token>` pada setiap *header* request.
- **Handling 401 Unauthorized**: Jika server merespons 401, token otomatis dibersihkan (`clearAuthToken()`) dan pengguna di-redirect ke `/login`.
- **Network Error Resilience Fallback**: Apabila koneksi backend terputus, `ApiClient` memberikan respons fallback terstruktur tanpa menyebabkan *unhandled exception/crash* pada UI.

---

## 3. Strategi Koneksi Go Backend — Supabase Database

### A. Connection Pooling (`pkg/database/postgres.go`)
- Menggunakan `pgxpool` untuk koneksi performa tinggi ke Supabase PostgreSQL.
- Dikonfigurasi dengan SSL Mode (`sslmode=require`) dan koneksi batas waktu (*timeout* 10s).
- String Koneksi Database (`config.yaml`):
  ```yaml
  database:
    url: "postgresql://postgres:[PASSWORD]@db.cjrhqywtwlmebthajrkx.supabase.co:5432/postgres?sslmode=require&connect_timeout=10"
  ```

### B. Health Check & Diagnostics (`GET /health`)
- Health check menjalankan kueri riil ke database (`SELECT true`).
- Merespons `{ status: "ok", database: "connected" }` jika sehat, atau `{ status: "degraded", database: "disconnected" }` jika koneksi terputus.

### C. Migration & Schema Synchronization
- Migrasi database dikelola terpusat melalui perkasas migrasi terstruktur Go (`cmd/migrate/main.go`).
- Menjamin konsistensi tabel dan relasi (16 migrasi aktif) dari lingkungan pengembangan hingga produksi.

---

## 4. Strategi CBT Engine Offline-First & Sync

```mermaid
sequenceDiagram
    participant Student as Siswa (Frontend)
    participant Local as LocalStorage / IndexedDB
    participant API as Go CBT Runtime API
    participant DB as Supabase DB

    Student->>Local: 1. Simpan Jawaban Instan (Latency ~0ms)
    Student->>API: 2. Async Batch Sync (/cbt/{sessionId}/sync)
    alt Server Connected
        API->>DB: 3. Persist Jawaban ke Database
        API-->>Student: 4. Sync ACK Success
    else Server Offline / Reconnecting
        API--xStudent: Network Timeout
        Student->>Local: 5. Tandai Unsynced Queue (Re-try dalam 5s)
    end
```

1. **Simpan Instan (Zero Latency UI)**: Setiap kali siswa memilih jawaban atau menandai ragu-ragu, state langsung disimpan di memori lokal.
2. **Auto-Batch Sync**: Latar belakang aplikasi mengirimkan payload jawaban setiap 5 detik atau saat perpindahan nomor soal.
3. **Recovery Offline**: Jika jaringan siswa terputus di pertengahan ujian CBT, timer dan jawaban tetap berjalan di browser. Setelah jaringan pulih, antrean jawaban otomatis disinkronkan ke backend.

---

## 5. Keamanan, CORS, Rate Limiting & Auth

- **CORS Protection**: Dibatasi hanya untuk origin terdaftar (`http://localhost:3000`, `http://127.0.0.1:3000`).
- **Middleware Sanitasi & Security Headers**: Menapis payload dari XSS/SQL Injection secara otomatis pada layer Go Fiber.
- **Rate Limiting**: Membatasi 100 request/menit per client IP untuk mencegah serangan DDoS / Brute Force.
- **RBAC Enforcement**: Middleware `RequireAuth` dan `RequireRole` memastikan endpoint Admin (`/api/v1/admin/*`) dan Guru (`/api/v1/teacher/*`) hanya bisa diakses oleh token dengan peran yang valid.

---

## 6. Ringkasan Tindakan & Best Practices

| Komponen | Lingkungan Dev | Lingkungan Prod | Catatan Penting |
| :--- | :--- | :--- | :--- |
| **Frontend API URL** | `http://localhost:8080/api/v1` | `https://api.yakinlulus.id/v1` | Diatur melalui `NEXT_PUBLIC_API_URL` |
| **Database Pool** | Max 10-20 Conns | Max 50-100 Conns (PG Bouncer) | Menggunakan Supabase SSL Direct/Pooled Connection |
| **Auth Storage** | LocalStorage + Cookie | Secure HttpOnly Cookie | Cookie `yakinlulus-token` & `yakinlulus-role` |
| **CBT Answer Sync** | Throttle 5s | Throttle 3s + WebSockets | Offline-first resilience |
