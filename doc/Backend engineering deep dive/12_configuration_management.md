# 12_configuration_management.md

# YakinLulus.id Configuration Management

**Document Version:** 1.0

**Status:** Draft

**Phase:** Backend Architecture

---

# 1. Purpose

Dokumen ini mendefinisikan standar **Configuration Management** pada backend YakinLulus.id.

Configuration Management bertujuan untuk memastikan seluruh konfigurasi aplikasi dikelola secara:

* Konsisten
* Aman
* Mudah dipelihara
* Mudah diubah tanpa mengubah source code
* Mendukung berbagai environment deployment

Konfigurasi tidak boleh di-hardcode pada business logic.

---

# 2. Objectives

Configuration Management dirancang untuk:

* Memisahkan konfigurasi dari kode.
* Mendukung Development, Testing, Staging, dan Production.
* Mendukung Secret Management.
* Mempermudah deployment CI/CD.
* Mendukung konfigurasi berbasis environment.

---

# 3. Configuration Principles

Seluruh konfigurasi mengikuti prinsip berikut:

* Configuration as Code
* Twelve-Factor App
* Environment Driven
* Immutable Runtime Configuration
* Fail Fast
* Secure by Default
* Single Source of Truth

---

# 4. Configuration Architecture

```text id="q9z4ep"
Environment Variables

↓

Config Loader

↓

Config Validator

↓

Configuration Struct

↓

Dependency Container

↓

Application
```

Konfigurasi dimuat satu kali saat aplikasi dijalankan.

---

# 5. Configuration Sources

Urutan prioritas konfigurasi:

| Priority | Source                                                     |
| -------- | ---------------------------------------------------------- |
| 1        | Environment Variables                                      |
| 2        | .env (Development Only)                                    |
| 3        | Default Value                                              |
| 4        | Hardcoded Constant (hanya nilai teknis yang tidak berubah) |

Production **tidak menggunakan** file `.env`.

---

# 6. Directory Structure

```text id="r7e0pm"
internal/

config/

config.go

loader.go

validator.go

env.go

defaults.go
```

---

# 7. Bootstrap Flow

```text id="k2n8ra"
Read Environment

↓

Load Configuration

↓

Validate

↓

Create Config Struct

↓

Inject Into Container
```

Jika validasi gagal, aplikasi berhenti (fail fast).

---

# 8. Configuration Object

Contoh struktur:

```go id="b8z0vh"
type Config struct {
    App      AppConfig
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
    Storage  StorageConfig
    JWT      JWTConfig
    Queue    QueueConfig
    Mail     MailConfig
    AI        AIConfig
    Logging  LoggingConfig
    Security SecurityConfig
}
```

Configuration bersifat read-only setelah bootstrap selesai.

---

# 9. App Configuration

Contoh:

```yaml id="4v0hkt"
APP_NAME

APP_VERSION

APP_ENV

APP_DEBUG
```

Environment:

* development
* testing
* staging
* production

---

# 10. Server Configuration

Contoh:

```yaml id="2d9xj5"
SERVER_HOST

SERVER_PORT

SERVER_READ_TIMEOUT

SERVER_WRITE_TIMEOUT

SERVER_IDLE_TIMEOUT
```

---

# 11. Database Configuration

Supabase PostgreSQL:

```yaml id="m5b3sq"
DB_HOST

DB_PORT

DB_NAME

DB_USER

DB_PASSWORD

DB_SSLMODE

DB_MAX_OPEN_CONN

DB_MAX_IDLE_CONN

DB_CONN_MAX_LIFETIME
```

Gunakan connection pooling yang sesuai dengan kapasitas aplikasi.

---

# 12. Redis Configuration

```yaml id="n3c7dy"
REDIS_HOST

REDIS_PORT

REDIS_PASSWORD

REDIS_DATABASE
```

Redis bersifat opsional pada fase MVP, tetapi seluruh konfigurasi sudah disiapkan.

---

# 13. Storage Configuration

Supabase Storage:

```yaml id="s7l1va"
STORAGE_ENDPOINT

STORAGE_BUCKET

STORAGE_REGION

STORAGE_PUBLIC_URL
```

Credential akses storage disimpan sebagai secret.

---

# 14. JWT Configuration

```yaml id="t8w6co"
JWT_SECRET

JWT_ISSUER

JWT_ACCESS_EXPIRE

JWT_REFRESH_EXPIRE
```

Secret tidak boleh ditampilkan pada log.

Untuk production, gunakan panjang secret minimal 256-bit.

---

# 15. Queue Configuration

Contoh:

```yaml id="e4j2xr"
QUEUE_DRIVER

QUEUE_CONCURRENCY

QUEUE_RETRY

QUEUE_TIMEOUT
```

Mendukung migrasi driver queue di masa depan.

---

# 16. Mail Configuration

```yaml id="g6k9up"
MAIL_HOST

MAIL_PORT

MAIL_USERNAME

MAIL_PASSWORD

MAIL_FROM
```

Password email diperlakukan sebagai secret.

---

# 17. AI Configuration

```yaml id="p3y7fw"
AI_PROVIDER

AI_ENDPOINT

AI_API_KEY

AI_TIMEOUT

AI_MAX_RETRY
```

Provider dapat diganti tanpa mengubah business logic.

---

# 18. Logging Configuration

```yaml id="w9q4nt"
LOG_LEVEL

LOG_FORMAT

LOG_SLOW_QUERY

LOG_SLOW_REQUEST
```

Production menggunakan JSON.

Development dapat menggunakan format yang lebih mudah dibaca.

---

# 19. Security Configuration

```yaml id="x1d8hz"
CORS_ALLOWED_ORIGINS

RATE_LIMIT

MAX_LOGIN_ATTEMPT

PASSWORD_MIN_LENGTH

PASSWORD_REQUIRE_SPECIAL
```

Semua parameter keamanan dapat diubah melalui konfigurasi.

---

# 20. Feature Flags

Feature Flag digunakan untuk mengaktifkan atau menonaktifkan fitur.

Contoh:

```yaml id="a5m0ke"
FEATURE_AI

FEATURE_GAMIFICATION

FEATURE_NOTIFICATION

FEATURE_ANALYTICS
```

Feature Flag dievaluasi pada Service Layer.

---

# 21. Environment Variables Naming

Gunakan format:

```text id="v2n6lr"
UPPER_SNAKE_CASE
```

Contoh:

```text id="h7p1bj"
SERVER_PORT

DB_HOST

JWT_SECRET
```

---

# 22. Secret Management

Secret meliputi:

* JWT Secret
* Database Password
* API Key
* SMTP Password
* Redis Password

Secret:

* Tidak masuk repository Git.
* Tidak ditampilkan pada log.
* Tidak dikembalikan melalui API.

Production disarankan menggunakan Secret Manager (misalnya Docker Secrets, Kubernetes Secrets, atau cloud secret manager).

---

# 23. Default Values

Default hanya digunakan untuk:

* Development
* Testing

Contoh:

```text id="q0z3ns"
SERVER_PORT=8080
```

Production wajib mengisi konfigurasi eksplisit.

---

# 24. Configuration Validation

Validasi dilakukan saat startup.

Contoh:

* Port valid.
* URL valid.
* Timeout positif.
* JWT Secret tersedia.
* Database Host tersedia.

Jika gagal, aplikasi tidak dijalankan.

---

# 25. Runtime Configuration

Konfigurasi dibagi menjadi:

| Type                   | Runtime Change        |
| ---------------------- | --------------------- |
| Application Config     | Tidak                 |
| Security Config        | Tidak                 |
| Database Config        | Tidak                 |
| Feature Flag           | Ya (Future)           |
| Business Configuration | Ya (melalui database) |

---

# 26. Business Configuration

Pengaturan bisnis seperti:

* Durasi maksimum CBT.
* Nilai XP.
* Jumlah retry AI.
* Default pagination.
* Pengaturan ranking.

Disimpan pada tabel konfigurasi di database, bukan environment variable.

---

# 27. Configuration Versioning

Setiap perubahan konfigurasi bisnis dicatat:

* Version
* Changed By
* Changed At
* Previous Value
* New Value

Hal ini mendukung audit dan rollback.

---

# 28. Configuration Access Pattern

Seluruh module memperoleh konfigurasi melalui dependency injection.

```text id="c8g5ut"
Container

↓

Config

↓

Service
```

Tidak diperbolehkan membaca environment variable secara langsung di Service atau Repository.

---

# 29. Configuration Reload

Untuk MVP:

* Tidak mendukung hot reload.

Perubahan konfigurasi aplikasi memerlukan restart service.

Business configuration dari database dapat di-refresh melalui mekanisme cache di masa depan.

---

# 30. Configuration Security

Tidak boleh dikirim melalui:

* API Response
* Error Response
* Log
* Panic Output

Debug endpoint harus menyensor seluruh secret.

---

# 31. Configuration Testing

Pengujian meliputi:

* Missing Environment.
* Invalid Value.
* Invalid URL.
* Invalid Port.
* Invalid Duration.
* Missing Secret.

Seluruh skenario harus menghasilkan startup failure yang jelas.

---

# 32. Multi Environment

Environment yang didukung:

```text id="y1b7sj"
Development

Testing

Staging

Production
```

Setiap environment memiliki konfigurasi yang terpisah.

---

# 33. Example .env (Development)

```text id="p9v4rm"
APP_ENV=development
SERVER_PORT=8080

DB_HOST=localhost
DB_PORT=5432

JWT_SECRET=your-development-secret

LOG_LEVEL=debug
```

File `.env.example` disediakan tanpa secret nyata.

---

# 34. Recommended Libraries

Rekomendasi:

| Purpose          | Library                 |
| ---------------- | ----------------------- |
| Config Loader    | koanf                   |
| Environment      | koanf/providers/env     |
| Validation       | go-playground/validator |
| Duration Parsing | time                    |
| Logging          | slog                    |

`koanf` dipilih karena modular dan mendukung banyak sumber konfigurasi.

---

# 35. Anti-Patterns

Tidak diperbolehkan:

* Hardcoded password.
* Hardcoded API Key.
* Membaca `os.Getenv()` di Service.
* Menyimpan secret di Git.
* Mengubah konfigurasi global saat runtime.
* Menggunakan nilai default untuk secret di production.

---

# 36. Configuration Checklist

Sebelum deployment:

* Semua konfigurasi tervalidasi.
* Semua secret berasal dari environment/secret manager.
* Tidak ada secret di repository.
* Tidak ada `os.Getenv()` di luar Config Loader.
* Semua konfigurasi diakses melalui dependency injection.
* File `.env.example` diperbarui.

---

# 37. Future Enhancements

Roadmap:

* Remote Configuration Service.
* Dynamic Feature Flag.
* Secret Rotation.
* Configuration Encryption.
* Configuration Dashboard.
* Multi-Tenant Configuration.

Seluruh peningkatan ini dapat diimplementasikan tanpa mengubah kontrak `Config` utama.

---

# 38. Summary

Configuration Management YakinLulus.id menerapkan prinsip **Twelve-Factor App** dengan konfigurasi berbasis environment, validasi saat startup, dan dependency injection sebagai satu-satunya jalur akses konfigurasi.

Pendekatan ini memberikan:

* Konfigurasi yang aman dan terpusat.
* Pemisahan yang jelas antara kode dan konfigurasi.
* Dukungan untuk berbagai environment deployment.
* Kemudahan integrasi dengan CI/CD dan platform cloud.
* Fondasi yang siap berkembang menuju deployment berskala enterprise.
