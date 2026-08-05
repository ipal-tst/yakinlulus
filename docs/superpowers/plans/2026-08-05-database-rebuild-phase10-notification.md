# Database Rebuild Phase 10 Implementation Plan (Notification)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun domain `notification` — 20 tabel — sesuai design doc `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §4.11 (Notification), menggantikan `notification_*`/`announcement_*`/`campaign_*` legacy.

**Architecture:** Mekanisme per design doc §4.11: event → template → queue → channel router → delivery → inbox. `notification_event` menangkap kejadian (dengan `user_id`, payload, priority, scheduled_at); `notification_queue` mengantrekan pesan ber-template per channel; `notification_delivery` mencatat pengiriman per provider; `user_notification`/`notification_history` adalah inbox + riwayat. `notification_preferences`/`notification_device` mengelola preferensi & perangkat user. `broadcast`/`announcement`/`campaign` untuk distribusi massal. `notification_rule`/`notification_scheduler` mengatur aturan & jadwal. `notification_webhook`/`notification_retry`/`notification_statistics`/`notification_audit_log` untuk integrasi, retry, metrik, dan audit.

**Tech Stack:** PostgreSQL (Supabase), runner Go `go run cmd/migrate/main.go up`, verifikasi via throwaway Go program (pgx/v5) di `C:\Users\ADMINI~1\AppData\Local\Temp\opencode\verify_p10\main.go`.

**Files target:** `backend/migrations/100_notification_template.up.sql` s.d. `109_notification_audit.up.sql` (10 file pasangan up/down).

---

## Global Constraints

Semua tabel mematuhi **Global Conventions** (`docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §2):

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel.
- Nama `snake_case` singular; kolom referensi `<entity>_id`.
- `created_at timestamptz NOT NULL DEFAULT NOW()` wajib; `updated_at` + trigger `shared.set_updated_at()` hanya pada tabel mutable.
- Enum: `text`/`varchar` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Indeks semua FK + filter umum; indeks unik sesuai spec.
- JSONB untuk payload/config (`variables`, `payload`, `request_payload`, `response_payload`, `target_filter`, `condition`, `config`, `old_data`, `new_data`).
- FK lintas schema: `identity.user` (user_id, created_by, updated_by, actor_id).
- Migrasi harus `up` bersih dari nol, dibungkus transaksi (runner sudah tx per file).
- Jangan sentuh kode Go runner.
- **Tabel append-only (hanya `created_at`, tanpa `updated_at`):** `notification_queue`, `notification_delivery`, `notification_history`, `notification_read_log`, `notification_retry`, `notification_webhook`, `notification_statistics`, `notification_audit_log`, `notification_event`.
- **Keputusan desain (deviasi minor, dicatat):**
  1. **Tidak ada partisi fisik** — konsisten dengan semua fase sebelumnya; `notification_event`/`notification_queue`/`notification_delivery`/`notification_history`/`notification_read_log`/`notification_statistics`/`notification_audit_log` dicatat di katalog sebagai "Partisi bulanan/tahunan" namun dibuat non-partisi, dengan indeks pada kolom waktu/scheduled.
  2. **§5 Cross-Domain Reference Rules:** `notification` adalah support domain standalone — ia mereferensikan `identity.user` saja, tidak direferensikan balik. Semua referensi lintas-entitas generik (`reference_type`/`reference_id`, `record_id`) sebagai `uuid`/`varchar` TANPA FK.
  3. **`notification_provider.api_key` / `secret_key`** dibuat sebagai kolom `text` biasa (bukan encrypted) — enkripsi secret adalah concern app-layer (catatan deviasi dari "encrypted" pada katalog).
  4. Indeks unik nullable (`provider_message_id`, `firebase_token`) memakai **partial unique index** `WHERE <col> IS NOT NULL` agar NULL tidak bertabrakan.

---

## Task 10A: Template & Channel — notification_template, notification_channel

**Files:**
- Create: `backend/migrations/100_notification_template.up.sql`
- Create: `backend/migrations/100_notification_template.down.sql`

**Interfaces:**
- Consumes: schema `notification` (000), `shared.set_updated_at()` (001), `identity.user` (010).
- Produces: `notification.notification_template`, `notification.notification_channel`.

- [ ] **Step 1: Tulis `100_notification_template.up.sql`**

```sql
-- Migration 100: notification template & channel.

CREATE TABLE notification.notification_template (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    category varchar(30) NOT NULL CHECK (category IN ('SYSTEM','EXAM','LEARNING','MEMBERSHIP','PAYMENT','SECURITY','PROMOTION','REMINDER','AI','ANNOUNCEMENT')),
    title_template text,
    body_template text,
    email_subject varchar(300),
    email_template text,
    whatsapp_template text,
    sms_template text,
    push_title varchar(200),
    push_body text,
    variables jsonb,
    language varchar(10) NOT NULL DEFAULT 'id',
    version int NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code, version, language)
);
CREATE INDEX idx_notification_template_category ON notification.notification_template(category);
CREATE INDEX idx_notification_template_active ON notification.notification_template(is_active);
CREATE INDEX idx_notification_template_created_by ON notification.notification_template(created_by);
CREATE TRIGGER trg_notification_template_updated BEFORE UPDATE ON notification.notification_template
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE notification.notification_channel (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL CHECK (code IN ('EMAIL','PUSH','WHATSAPP','SMS','IN_APP','TELEGRAM')),
    name varchar(100) NOT NULL,
    provider varchar(100),
    active boolean NOT NULL DEFAULT true,
    priority int NOT NULL DEFAULT 0,
    rate_limit_per_minute int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_notification_channel_code ON notification.notification_channel(code);
CREATE INDEX idx_notification_channel_active ON notification.notification_channel(active);
CREATE TRIGGER trg_notification_channel_updated BEFORE UPDATE ON notification.notification_channel
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `100_notification_template.down.sql`**

```sql
DROP TABLE IF EXISTS notification.notification_channel;
DROP TABLE IF EXISTS notification.notification_template;
```

- [ ] **Step 3: Verifikasi**

Dari `backend/` (config.yaml disalin dari repo utama — file gitignored):
```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=100_notification_template.up.sql`; `All migrations applied total=72`.

Kemudian verifikasi via throwaway Go program:
- `SELECT count(*) FROM information_schema.tables WHERE table_schema='notification';` → **2**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): notification template & channel (phase 10)"
```

---

## Task 10B: Provider & Event — notification_provider, notification_event

**Files:**
- Create: `backend/migrations/101_notification_provider.up.sql`
- Create: `backend/migrations/101_notification_provider.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `notification.notification_channel`.
- Produces: `notification.notification_provider`, `notification.notification_event`.

- [ ] **Step 1: Tulis `101_notification_provider.up.sql`**

```sql
-- Migration 101: notification provider & event.
-- Deviasi: api_key/secret_key kolom text biasa; enkripsi app-layer.

CREATE TABLE notification.notification_provider (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id uuid NOT NULL REFERENCES notification.notification_channel(id) ON DELETE CASCADE,
    provider_name varchar(100) NOT NULL,
    api_key text,
    secret_key text,
    endpoint text,
    active boolean NOT NULL DEFAULT true,
    priority int NOT NULL DEFAULT 0,
    config jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_provider_channel ON notification.notification_provider(channel_id);
CREATE INDEX idx_notification_provider_active ON notification.notification_provider(active);
CREATE TRIGGER trg_notification_provider_updated BEFORE UPDATE ON notification.notification_provider
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE notification.notification_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name varchar(100) NOT NULL,
    event_type varchar(30) NOT NULL,
    reference_type varchar(50),
    reference_id uuid,
    user_id uuid REFERENCES identity.user(id) ON DELETE CASCADE,
    payload jsonb,
    priority int NOT NULL DEFAULT 0,
    scheduled_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSED','FAILED','CANCELLED')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_event_name ON notification.notification_event(event_name);
CREATE INDEX idx_notification_event_user ON notification.notification_event(user_id);
CREATE INDEX idx_notification_event_status ON notification.notification_event(status);
CREATE INDEX idx_notification_event_scheduled ON notification.notification_event(scheduled_at);
-- Kolom reference_type/reference_id: uuid TANPA FK (event-driven, per 5).
```

- [ ] **Step 2: Tulis `101_notification_provider.down.sql`**

```sql
DROP TABLE IF EXISTS notification.notification_event;
DROP TABLE IF EXISTS notification.notification_provider;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 101; `All migrations applied total=73`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='notification';` → **4**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): notification provider & event (phase 10)"
```

---

## Task 10C: Queue & Delivery — notification_queue, notification_delivery

**Files:**
- Create: `backend/migrations/102_notification_queue.up.sql`
- Create: `backend/migrations/102_notification_queue.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `notification.notification_template`, `notification.notification_event`.
- Produces: `notification.notification_queue`, `notification.notification_delivery`.

- [ ] **Step 1: Tulis `102_notification_queue.up.sql`**

```sql
-- Migration 102: notification queue & delivery.

CREATE TABLE notification.notification_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES notification.notification_event(id) ON DELETE CASCADE,
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    user_id uuid REFERENCES identity.user(id) ON DELETE CASCADE,
    channel varchar(20) NOT NULL,
    priority int NOT NULL DEFAULT 0,
    scheduled_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING','PROCESSING','SUCCESS','FAILED','RETRY','CANCELLED')),
    retry_count int NOT NULL DEFAULT 0,
    worker_id varchar(100),
    locked_at timestamptz,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_queue_event ON notification.notification_queue(event_id);
CREATE INDEX idx_notification_queue_template ON notification.notification_queue(template_id);
CREATE INDEX idx_notification_queue_user ON notification.notification_queue(user_id);
CREATE INDEX idx_notification_queue_status ON notification.notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled ON notification.notification_queue(scheduled_at);

CREATE TABLE notification.notification_delivery (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id uuid NOT NULL REFERENCES notification.notification_queue(id) ON DELETE CASCADE,
    provider varchar(100),
    provider_message_id varchar(200),
    channel varchar(20) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','DELIVERED','READ','FAILED','BOUNCED')),
    request_payload jsonb,
    response_payload jsonb,
    response_time int,
    sent_at timestamptz,
    delivered_at timestamptz,
    read_at timestamptz,
    failed_reason text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_notification_delivery_provider_msg ON notification.notification_delivery(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX idx_notification_delivery_queue ON notification.notification_delivery(queue_id);
CREATE INDEX idx_notification_delivery_status ON notification.notification_delivery(status);
```

- [ ] **Step 2: Tulis `102_notification_queue.down.sql`**

```sql
DROP TABLE IF EXISTS notification.notification_delivery;
DROP TABLE IF EXISTS notification.notification_queue;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 102; `All migrations applied total=74`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='notification';` → **6**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): notification queue & delivery (phase 10)"
```

---

## Task 10D: History & Inbox — notification_history, user_notification

**Files:**
- Create: `backend/migrations/103_notification_history.up.sql`
- Create: `backend/migrations/103_notification_history.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `notification.notification_template`.
- Produces: `notification.notification_history`, `notification.user_notification`.

- [ ] **Step 1: Tulis `103_notification_history.up.sql`**

```sql
-- Migration 103: notification history & user inbox.

CREATE TABLE notification.notification_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    channel varchar(20) NOT NULL,
    title varchar(300),
    body text,
    status varchar(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('PENDING','SENT','FAILED')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_history_user ON notification.notification_history(user_id);
CREATE INDEX idx_notification_history_template ON notification.notification_history(template_id);
CREATE INDEX idx_notification_history_channel ON notification.notification_history(channel);
CREATE INDEX idx_notification_history_time ON notification.notification_history(created_at);

CREATE TABLE notification.user_notification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    notification_history_id uuid REFERENCES notification.notification_history(id) ON DELETE SET NULL,
    title varchar(300) NOT NULL,
    body text,
    image_url text,
    action_url text,
    action_type varchar(30),
    icon varchar(120),
    badge int NOT NULL DEFAULT 0,
    priority int NOT NULL DEFAULT 0,
    is_read boolean NOT NULL DEFAULT false,
    read_at timestamptz,
    expired_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_notification_user ON notification.user_notification(user_id, is_read);
CREATE INDEX idx_user_notification_history ON notification.user_notification(notification_history_id);
CREATE INDEX idx_user_notification_read ON notification.user_notification(is_read);
CREATE TRIGGER trg_user_notification_updated BEFORE UPDATE ON notification.user_notification
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `103_notification_history.down.sql`**

```sql
DROP TABLE IF EXISTS notification.user_notification;
DROP TABLE IF EXISTS notification.notification_history;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 103; `All migrations applied total=75`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='notification';` → **8**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): notification history & user inbox (phase 10)"
```

---

## Task 10E: Preferences & Device — notification_preferences, notification_device

**Files:**
- Create: `backend/migrations/104_notification_preferences.up.sql`
- Create: `backend/migrations/104_notification_preferences.down.sql`

**Interfaces:**
- Consumes: `identity.user`.
- Produces: `notification.notification_preferences`, `notification.notification_device`.

- [ ] **Step 1: Tulis `104_notification_preferences.up.sql`**

```sql
-- Migration 104: notification preferences & user device.

CREATE TABLE notification.notification_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES identity.user(id) ON DELETE CASCADE,
    allow_email boolean NOT NULL DEFAULT true,
    allow_push boolean NOT NULL DEFAULT true,
    allow_sms boolean NOT NULL DEFAULT true,
    allow_whatsapp boolean NOT NULL DEFAULT true,
    allow_in_app boolean NOT NULL DEFAULT true,
    allow_marketing boolean NOT NULL DEFAULT true,
    allow_exam boolean NOT NULL DEFAULT true,
    allow_payment boolean NOT NULL DEFAULT true,
    allow_learning boolean NOT NULL DEFAULT true,
    allow_ai boolean NOT NULL DEFAULT true,
    allow_system boolean NOT NULL DEFAULT true,
    quiet_hour_start time,
    quiet_hour_end time,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_notification_preferences_updated BEFORE UPDATE ON notification.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE notification.notification_device (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    device_uuid varchar(200) NOT NULL,
    device_name varchar(200),
    platform varchar(30),
    manufacturer varchar(100),
    model varchar(100),
    os varchar(50),
    app_version varchar(20),
    firebase_token text,
    onesignal_token text,
    last_login timestamptz,
    last_seen timestamptz,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (device_uuid)
);
CREATE UNIQUE INDEX uq_notification_device_firebase ON notification.notification_device(firebase_token) WHERE firebase_token IS NOT NULL;
CREATE INDEX idx_notification_device_user ON notification.notification_device(user_id);
CREATE INDEX idx_notification_device_active ON notification.notification_device(active);
CREATE TRIGGER trg_notification_device_updated BEFORE UPDATE ON notification.notification_device
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `104_notification_preferences.down.sql`**

```sql
DROP TABLE IF EXISTS notification.notification_device;
DROP TABLE IF EXISTS notification.notification_preferences;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 104; `All migrations applied total=76`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='notification';` → **10**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): notification preferences & device (phase 10)"
```

---

## Task 10F: Read Log & Broadcast — notification_read_log, broadcast

**Files:**
- Create: `backend/migrations/105_notification_read_log.up.sql`
- Create: `backend/migrations/105_notification_read_log.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `notification.user_notification`, `notification.notification_template`.
- Produces: `notification.notification_read_log`, `notification.broadcast`.

- [ ] **Step 1: Tulis `105_notification_read_log.up.sql`**

```sql
-- Migration 105: notification read log & broadcast.

CREATE TABLE notification.notification_read_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id uuid NOT NULL REFERENCES notification.user_notification(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    opened_at timestamptz,
    clicked_at timestamptz,
    device varchar(200),
    platform varchar(30),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_read_log_notification ON notification.notification_read_log(notification_id);
CREATE INDEX idx_notification_read_log_user ON notification.notification_read_log(user_id);

CREATE TABLE notification.broadcast (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(300) NOT NULL,
    description text,
    target_type varchar(20) NOT NULL DEFAULT 'ALL' CHECK (target_type IN ('ALL','STUDENT','TEACHER','STAFF','SCHOOL','PREMIUM','FREE')),
    target_filter jsonb,
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    scheduled_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SCHEDULED','SENDING','SENT','CANCELLED','FAILED')),
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_broadcast_target ON notification.broadcast(target_type);
CREATE INDEX idx_broadcast_status ON notification.broadcast(status);
CREATE INDEX idx_broadcast_template ON notification.broadcast(template_id);
CREATE INDEX idx_broadcast_created_by ON notification.broadcast(created_by);
CREATE TRIGGER trg_broadcast_updated BEFORE UPDATE ON notification.broadcast
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `105_notification_read_log.down.sql`**

```sql
DROP TABLE IF EXISTS notification.broadcast;
DROP TABLE IF EXISTS notification.notification_read_log;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 105; `All migrations applied total=77`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='notification';` → **12**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): notification read log & broadcast (phase 10)"
```

---

## Task 10G: Announcement & Campaign

**Files:**
- Create: `backend/migrations/106_announcement_campaign.up.sql`
- Create: `backend/migrations/106_announcement_campaign.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `notification.notification_template`.
- Produces: `notification.announcement`, `notification.campaign`.

- [ ] **Step 1: Tulis `106_announcement_campaign.up.sql`**

```sql
-- Migration 106: announcement & campaign.

CREATE TABLE notification.announcement (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(300) NOT NULL,
    content text,
    cover_image text,
    category varchar(50),
    publish_at timestamptz,
    expired_at timestamptz,
    is_popup boolean NOT NULL DEFAULT false,
    priority int NOT NULL DEFAULT 0,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_announcement_category ON notification.announcement(category);
CREATE INDEX idx_announcement_publish ON notification.announcement(publish_at);
CREATE INDEX idx_announcement_created_by ON notification.announcement(created_by);
CREATE TRIGGER trg_announcement_updated BEFORE UPDATE ON notification.announcement
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE notification.campaign (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name varchar(200) NOT NULL,
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    start_date timestamptz,
    end_date timestamptz,
    target_filter jsonb,
    estimated_recipient int NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SCHEDULED','RUNNING','PAUSED','COMPLETED','CANCELLED')),
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_campaign_template ON notification.campaign(template_id);
CREATE INDEX idx_campaign_status ON notification.campaign(status);
CREATE INDEX idx_campaign_dates ON notification.campaign(start_date, end_date);
CREATE INDEX idx_campaign_created_by ON notification.campaign(created_by);
CREATE TRIGGER trg_campaign_updated BEFORE UPDATE ON notification.campaign
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `106_announcement_campaign.down.sql`**

```sql
DROP TABLE IF EXISTS notification.campaign;
DROP TABLE IF EXISTS notification.announcement;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 106; `All migrations applied total=78`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='notification';` → **14**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): announcement & campaign (phase 10)"
```

---

## Task 10H: Webhook & Retry — notification_webhook, notification_retry

**Files:**
- Create: `backend/migrations/107_notification_webhook.up.sql`
- Create: `backend/migrations/107_notification_webhook.down.sql`

**Interfaces:**
- Consumes: `notification.notification_delivery`.
- Produces: `notification.notification_webhook`, `notification.notification_retry`.

- [ ] **Step 1: Tulis `107_notification_webhook.up.sql`**

```sql
-- Migration 107: notification webhook & retry.

CREATE TABLE notification.notification_webhook (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(100),
    endpoint text,
    request jsonb,
    response jsonb,
    http_status int,
    verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_webhook_provider ON notification.notification_webhook(provider);
CREATE INDEX idx_notification_webhook_status ON notification.notification_webhook(http_status);

CREATE TABLE notification.notification_retry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id uuid NOT NULL REFERENCES notification.notification_delivery(id) ON DELETE CASCADE,
    retry_number int NOT NULL DEFAULT 1,
    next_retry timestamptz,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESS','FAILED')),
    reason text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (delivery_id, retry_number)
);
CREATE INDEX idx_notification_retry_next ON notification.notification_retry(next_retry);
CREATE INDEX idx_notification_retry_status ON notification.notification_retry(status);
```

- [ ] **Step 2: Tulis `107_notification_webhook.down.sql`**

```sql
DROP TABLE IF EXISTS notification.notification_retry;
DROP TABLE IF EXISTS notification.notification_webhook;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 107; `All migrations applied total=79`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='notification';` → **16**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): notification webhook & retry (phase 10)"
```

---

## Task 10I: Scheduler & Rule — notification_scheduler, notification_rule

**Files:**
- Create: `backend/migrations/108_notification_scheduler.up.sql`
- Create: `backend/migrations/108_notification_scheduler.down.sql`

**Interfaces:**
- Consumes: `notification.notification_template`.
- Produces: `notification.notification_scheduler`, `notification.notification_rule`.

- [ ] **Step 1: Tulis `108_notification_scheduler.up.sql`**

```sql
-- Migration 108: notification scheduler & rule.

CREATE TABLE notification.notification_scheduler (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    cron_expression varchar(100) NOT NULL,
    next_run timestamptz,
    last_run timestamptz,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_scheduler_template ON notification.notification_scheduler(template_id);
CREATE INDEX idx_notification_scheduler_next ON notification.notification_scheduler(next_run);
CREATE INDEX idx_notification_scheduler_active ON notification.notification_scheduler(active);
CREATE TRIGGER trg_notification_scheduler_updated BEFORE UPDATE ON notification.notification_scheduler
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE notification.notification_rule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name varchar(100) NOT NULL,
    template_id uuid REFERENCES notification.notification_template(id) ON DELETE SET NULL,
    channel varchar(20) NOT NULL,
    priority int NOT NULL DEFAULT 0,
    delay_second int NOT NULL DEFAULT 0,
    condition jsonb,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (event_name, channel)
);
CREATE INDEX idx_notification_rule_template ON notification.notification_rule(template_id);
CREATE INDEX idx_notification_rule_active ON notification.notification_rule(active);
CREATE TRIGGER trg_notification_rule_updated BEFORE UPDATE ON notification.notification_rule
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `108_notification_scheduler.down.sql`**

```sql
DROP TABLE IF EXISTS notification.notification_rule;
DROP TABLE IF EXISTS notification.notification_scheduler;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 108; `All migrations applied total=80`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='notification';` → **18**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): notification scheduler & rule (phase 10)"
```

---

## Task 10J: Statistics & Audit — notification_statistics, notification_audit_log

**Files:**
- Create: `backend/migrations/109_notification_audit.up.sql`
- Create: `backend/migrations/109_notification_audit.down.sql`

**Interfaces:**
- Consumes: `identity.user`.
- Produces: `notification.notification_statistics`, `notification.notification_audit_log`.

- [ ] **Step 1: Tulis `109_notification_audit.up.sql`**

```sql
-- Migration 109: notification statistics & audit log.

CREATE TABLE notification.notification_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    channel varchar(20) NOT NULL,
    total_sent int NOT NULL DEFAULT 0,
    total_delivered int NOT NULL DEFAULT 0,
    total_opened int NOT NULL DEFAULT 0,
    total_clicked int NOT NULL DEFAULT 0,
    total_failed int NOT NULL DEFAULT 0,
    delivery_rate numeric(5,2) NOT NULL DEFAULT 0,
    open_rate numeric(5,2) NOT NULL DEFAULT 0,
    click_rate numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, channel)
);
CREATE INDEX idx_notification_statistics_channel ON notification.notification_statistics(channel);

CREATE TABLE notification.notification_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    actor_role varchar(30),
    action varchar(30) NOT NULL,
    table_name varchar(100) NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address varchar(45),
    device varchar(200),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_audit_actor ON notification.notification_audit_log(actor_id);
CREATE INDEX idx_notification_audit_table ON notification.notification_audit_log(table_name, record_id);
CREATE INDEX idx_notification_audit_time ON notification.notification_audit_log(created_at);
```

- [ ] **Step 2: Tulis `109_notification_audit.down.sql`**

```sql
DROP TABLE IF EXISTS notification.notification_audit_log;
DROP TABLE IF EXISTS notification.notification_statistics;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 109; `All migrations applied total=81`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='notification';` → **20** ✓ (menyelesaikan domain notification)

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): notification statistics & audit log (phase 10) - completes notification domain (20 tables)"
```

---

## Self-Review

**Spec coverage:** design doc §3 fase 10 (Notification, 20 tabel) terpenuhi: 10 file migrasi (100–109), 20 tabel sesuai §4.11 katalog. Daftar 1:1 — notification_template, notification_event, notification_queue, notification_delivery, notification_history, user_notification, notification_preferences, notification_device, notification_read_log, broadcast, announcement, campaign, notification_webhook, notification_retry, notification_channel, notification_provider, notification_scheduler, notification_rule, notification_statistics, notification_audit_log = 20.

**Placeholder scan:** tidak ada TBD/TODO; SQL lengkap per task; enum & indeks eksplisit.

**Type/name consistency:** konvensi §2 diterapkan (uuid PK, snake_case, timestamps, CHECK enum, indeks FK/komposit/unik, `numeric(5,2)` untuk rate). Hanya `identity.user` yang di-FK (user_id, created_by, updated_by, actor_id). Referensi lintas-entitas generik (`reference_type`/`reference_id`, `record_id`) uuid/varchar tanpa FK — konsisten §5. Tabel append-only memakai `created_at` saja tanpa `updated_at`. Indeks unik nullable memakai partial unique index.

**Cacat design yang dihindari:** tidak ada dual-schema legacy (`notification_*` lama sudah dihapus di Phase 0); pemisahan event → queue → delivery → inbox (append-only, tidak mutable); tidak ada FK ke domain inti yang menciptakan siklus.

## Execution Handoff

**Plan selesai & tersimpan: `docs/superpowers/plans/2026-08-05-database-rebuild-phase10-notification.md`. Dua opsi eksekusi:**

1. **Subagent-Driven (recommended)** — dispatch subagent baru per task, review antar task, iterasi cepat.
2. **Inline Execution** — eksekusi tasks di sesi ini dengan checkpoints.

**Pilih yang mana?**
