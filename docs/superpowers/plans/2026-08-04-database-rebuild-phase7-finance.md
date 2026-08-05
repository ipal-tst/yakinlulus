# Database Rebuild Phase 7 Implementation Plan (Finance & Membership)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun domain `finance` (membership, invoice, payment, wallet, voucher) — 24 tabel — sesuai design doc `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §4.7, menggantikan `finance_*`/`membership_*`/`payment_*` legacy.

**Architecture:** `finance.membership_package` → `subscription`/`user_membership` → `invoice` → `payment` → `payment_transaction`/`gateway_log`. Wallet/voucher/refund/commission/tax/report/audit sebagai lapisan pendukung. Uang memakai `numeric(12,2)`; persen `numeric(5,2)`. Tabel volume tinggi (payment/wallet_transaction/audit_log) dicatat sebagai kandidat partisi di catatan deviasi.

**Tech Stack:** PostgreSQL (Supabase), runner Go `go run cmd/migrate/main.go up`, verifikasi via throwaway Go program (pgx) + `cmd/tools/dbcheck`.

**Files target:** `backend/migrations/074_membership_core.{up,down}.sql` s.d. `081_finance_setting.{up,down}.sql` (8 file pasangan).

---

## Global Constraints

Semua tabel mematuhi **Global Conventions** (`docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §2):

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel.
- Nama `snake_case` singular; kolom referensi `<entity>_id`.
- `created_at timestamptz NOT NULL DEFAULT NOW()` wajib; `updated_at` untuk tabel mutable.
- Soft delete `deleted_at` hanya pada master (`finance.membership_package`, `finance.voucher`).
- Enum: `text`/`varchar` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Indeks semua FK + filter umum; indeks unik sesuai spec.
- Rata-rata numerik: uang `numeric(12,2)`, persen `numeric(5,2)`, count `int`.
- FK lintas schema: `identity.user` (semua actor).
- Migrasi harus `up` bersih dari nol, dibungkus transaksi (runner sudah tx per file).
- Jangan sentuh kode Go runner.
- **Keputusan desain (deviasi minor, dicatat):**
  1. **Tidak ada partisi fisik** (`PARTITION BY RANGE`) — konsisten dengan semua fase sebelumnya (0–6); katalog §4.7 menyebut "Partisi kuartalan/bulanan/tahunan" untuk invoice/payment/payment_transaction/payment_gateway_log/wallet_transaction/revenue_summary/financial_audit_log, tetapi strategi partisi ditunda ke fase infrastruktur. Tabel tetap append-only di mana relevan.
  2. **Circular FK `invoice.membership_id ↔ user_membership.invoice_id`** diresolusi via `ALTER TABLE ADD CONSTRAINT` di Task 7B (kedua tabel dibuat tanpa FK silang dulu, lalu kedua FK ditambahkan setelah keduanya ada) — pola yang sama dengan `material.current_version_id` (Phase 6) dan `question.current_version_id` (Phase 4).
  3. `payment_method` (lookup kecil, direferensikan `payment.payment_method_id`) dikelompokkan ke Task 7A bersama membership core.

---

## Task 7A: Membership Core — membership_package, package_feature, subscription, payment_method

**Files:**
- Create: `backend/migrations/074_membership_core.up.sql`
- Create: `backend/migrations/074_membership_core.down.sql`

**Interfaces:**
- Consumes: `identity.user`, schema `finance` (000), `shared.set_updated_at()` (001).
- Produces: `finance.membership_package` (master), `finance.package_feature`, `finance.subscription`, `finance.payment_method`.

- [ ] **Step 1: Tulis `074_membership_core.up.sql`**

```sql
-- Migration 074: membership core - package, feature, subscription, payment method.

CREATE TABLE finance.membership_package (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    slug varchar(200) NOT NULL,
    package_type varchar(20) NOT NULL DEFAULT 'monthly' CHECK (package_type IN ('trial','monthly','quarterly','semester','yearly','lifetime')),
    level varchar(20) NOT NULL DEFAULT 'basic' CHECK (level IN ('basic','premium','pro','enterprise')),
    duration_day int,
    price numeric(12,2) NOT NULL DEFAULT 0,
    discount_price numeric(12,2),
    currency varchar(8) NOT NULL DEFAULT 'IDR',
    max_device int NOT NULL DEFAULT 1,
    max_login int NOT NULL DEFAULT 1,
    max_student int NOT NULL DEFAULT 1,
    max_teacher int NOT NULL DEFAULT 1,
    is_trial boolean NOT NULL DEFAULT false,
    trial_day int,
    is_active boolean NOT NULL DEFAULT true,
    is_featured boolean NOT NULL DEFAULT false,
    sort_order int NOT NULL DEFAULT 0,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_membership_package_code ON finance.membership_package(code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_membership_package_slug ON finance.membership_package(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_membership_package_type ON finance.membership_package(package_type);
CREATE INDEX idx_membership_package_active ON finance.membership_package(is_active);
CREATE TRIGGER trg_membership_package_updated BEFORE UPDATE ON finance.membership_package
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.package_feature (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_package_id uuid NOT NULL REFERENCES finance.membership_package(id) ON DELETE CASCADE,
    feature_code varchar(50) NOT NULL,
    feature_name varchar(120) NOT NULL,
    feature_value varchar(120),
    is_unlimited boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (membership_package_id, feature_code)
);
CREATE INDEX idx_package_feature_package ON finance.package_feature(membership_package_id);

CREATE TABLE finance.subscription (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    membership_package_id uuid NOT NULL REFERENCES finance.membership_package(id) ON DELETE CASCADE,
    billing_cycle varchar(20),
    next_billing_date timestamptz,
    last_billing_date timestamptz,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','CANCELLED','EXPIRED','FAILED')),
    payment_method varchar(40),
    gateway varchar(40),
    retry_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscription_user ON finance.subscription(user_id);
CREATE INDEX idx_subscription_package ON finance.subscription(membership_package_id);
CREATE INDEX idx_subscription_status ON finance.subscription(status);
CREATE TRIGGER trg_subscription_updated BEFORE UPDATE ON finance.subscription
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.payment_method (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    name varchar(120) NOT NULL,
    category varchar(40),
    gateway varchar(40),
    is_active boolean NOT NULL DEFAULT true,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_payment_method_code ON finance.payment_method(code);
```

- [ ] **Step 2: Tulis `074_membership_core.down.sql`**

```sql
DROP TABLE IF EXISTS finance.payment_method;
DROP TABLE IF EXISTS finance.subscription;
DROP TABLE IF EXISTS finance.package_feature;
DROP TABLE IF EXISTS finance.membership_package;
```

- [ ] **Step 3: Verifikasi**

Dari `backend/`:
```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=074_membership_core.up.sql`; `All migrations applied total=54`.

Kemudian verifikasi via throwaway Go program (pgx, URL dari `backend/config.yaml` `database.url`):
- `SELECT count(*) FROM information_schema.tables WHERE table_schema='finance';` → **4**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): membership core - package/feature/subscription/payment method (phase 7)"
```

---

## Task 7B: Invoice & User Membership — invoice, user_membership + circular FK

**Files:**
- Create: `backend/migrations/075_invoice_membership.up.sql`
- Create: `backend/migrations/075_invoice_membership.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `finance.membership_package`, `finance.subscription`.
- Produces: `finance.invoice`, `finance.user_membership`, plus `fk_invoice_membership` (invoice.membership_id -> user_membership) dan `fk_user_membership_invoice` (user_membership.invoice_id -> invoice) via ALTER.

- [ ] **Step 1: Tulis `075_invoice_membership.up.sql`**

```sql
-- Migration 075: invoice & user membership; circular FK resolved via ALTER.

CREATE TABLE finance.invoice (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number varchar(50) NOT NULL,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    membership_id uuid,
    subtotal numeric(12,2) NOT NULL DEFAULT 0,
    discount numeric(12,2) NOT NULL DEFAULT 0,
    voucher_discount numeric(12,2) NOT NULL DEFAULT 0,
    tax numeric(12,2) NOT NULL DEFAULT 0,
    service_fee numeric(12,2) NOT NULL DEFAULT 0,
    total numeric(12,2) NOT NULL DEFAULT 0,
    currency varchar(8) NOT NULL DEFAULT 'IDR',
    status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','UNPAID','PENDING','PAID','FAILED','EXPIRED','VOID','REFUND')),
    issued_at timestamptz,
    expired_at timestamptz,
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_invoice_number ON finance.invoice(invoice_number);
CREATE INDEX idx_invoice_user ON finance.invoice(user_id);
CREATE INDEX idx_invoice_status ON finance.invoice(status);
CREATE INDEX idx_invoice_paid ON finance.invoice(paid_at);
CREATE TRIGGER trg_invoice_updated BEFORE UPDATE ON finance.invoice
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.user_membership (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    membership_package_id uuid NOT NULL REFERENCES finance.membership_package(id) ON DELETE CASCADE,
    invoice_id uuid,
    subscription_id uuid REFERENCES finance.subscription(id) ON DELETE SET NULL,
    status varchar(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','EXPIRED','CANCELLED')),
    active_from timestamptz,
    expired_at timestamptz,
    remaining_day int,
    is_trial boolean NOT NULL DEFAULT false,
    auto_renew boolean NOT NULL DEFAULT true,
    renewal_count int NOT NULL DEFAULT 0,
    cancel_reason varchar(200),
    cancelled_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_membership_user ON finance.user_membership(user_id);
CREATE INDEX idx_user_membership_package ON finance.user_membership(membership_package_id);
CREATE INDEX idx_user_membership_status ON finance.user_membership(status);
CREATE TRIGGER trg_user_membership_updated BEFORE UPDATE ON finance.user_membership
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

-- Circular FK: invoice.membership_id -> user_membership, user_membership.invoice_id -> invoice.
ALTER TABLE finance.invoice ADD CONSTRAINT fk_invoice_membership
    FOREIGN KEY (membership_id) REFERENCES finance.user_membership(id);
ALTER TABLE finance.user_membership ADD CONSTRAINT fk_user_membership_invoice
    FOREIGN KEY (invoice_id) REFERENCES finance.invoice(id);
```

- [ ] **Step 2: Tulis `075_invoice_membership.down.sql`**

```sql
ALTER TABLE finance.user_membership DROP CONSTRAINT IF EXISTS fk_user_membership_invoice;
ALTER TABLE finance.invoice DROP CONSTRAINT IF EXISTS fk_invoice_membership;
DROP TABLE IF EXISTS finance.user_membership;
DROP TABLE IF EXISTS finance.invoice;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 075; `All migrations applied total=55`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='finance';` → **6**
`SELECT count(*) FROM pg_constraint WHERE conname IN ('fk_invoice_membership','fk_user_membership_invoice');` → **2**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): invoice & user membership + circular FK (phase 7)"
```

---

## Task 7C: Payment — payment, payment_transaction, payment_gateway_log

**Files:**
- Create: `backend/migrations/076_payment.up.sql`
- Create: `backend/migrations/076_payment.down.sql`

**Interfaces:**
- Consumes: `finance.invoice`, `identity.user`, `finance.payment_method`.
- Produces: `finance.payment`, `finance.payment_transaction`, `finance.payment_gateway_log`.

- [ ] **Step 1: Tulis `076_payment.up.sql`**

```sql
-- Migration 076: payment, payment transaction, gateway log.

CREATE TABLE finance.payment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES finance.invoice(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    payment_method varchar(40),
    payment_channel varchar(40),
    gateway varchar(40),
    amount numeric(12,2) NOT NULL DEFAULT 0,
    fee numeric(12,2) NOT NULL DEFAULT 0,
    net_amount numeric(12,2) NOT NULL DEFAULT 0,
    currency varchar(8) NOT NULL DEFAULT 'IDR',
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED')),
    payment_time timestamptz,
    gateway_reference varchar(120),
    gateway_transaction_id varchar(120),
    approval_code varchar(80),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_payment_gateway_tx ON finance.payment(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX idx_payment_invoice ON finance.payment(invoice_id);
CREATE INDEX idx_payment_user ON finance.payment(user_id);
CREATE INDEX idx_payment_status ON finance.payment(status);
CREATE TRIGGER trg_payment_updated BEFORE UPDATE ON finance.payment
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.payment_transaction (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES finance.payment(id) ON DELETE CASCADE,
    event_type varchar(40),
    gateway_status varchar(40),
    request_payload jsonb,
    response_payload jsonb,
    signature text,
    verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payment_transaction_payment ON finance.payment_transaction(payment_id);

CREATE TABLE finance.payment_gateway_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway varchar(40),
    endpoint varchar(200),
    request jsonb,
    response jsonb,
    http_status int,
    latency int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payment_gateway_log_gateway ON finance.payment_gateway_log(gateway);
CREATE INDEX idx_payment_gateway_log_time ON finance.payment_gateway_log(created_at);
```

- [ ] **Step 2: Tulis `076_payment.down.sql`**

```sql
DROP TABLE IF EXISTS finance.payment_gateway_log;
DROP TABLE IF EXISTS finance.payment_transaction;
DROP TABLE IF EXISTS finance.payment;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 076; `All migrations applied total=56`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='finance';` → **9**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): payment/transaction/gateway log (phase 7)"
```

---

## Task 7D: Wallet — wallet, wallet_transaction

**Files:**
- Create: `backend/migrations/077_wallet.up.sql`
- Create: `backend/migrations/077_wallet.down.sql`

**Interfaces:**
- Consumes: `identity.user`.
- Produces: `finance.wallet`, `finance.wallet_transaction`.

- [ ] **Step 1: Tulis `077_wallet.up.sql`**

```sql
-- Migration 077: wallet & wallet transactions.

CREATE TABLE finance.wallet (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    balance numeric(12,2) NOT NULL DEFAULT 0,
    locked_balance numeric(12,2) NOT NULL DEFAULT 0,
    currency varchar(8) NOT NULL DEFAULT 'IDR',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_wallet_updated BEFORE UPDATE ON finance.wallet
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.wallet_transaction (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id uuid NOT NULL REFERENCES finance.wallet(id) ON DELETE CASCADE,
    reference_type varchar(40),
    reference_id uuid,
    transaction_type varchar(20) NOT NULL CHECK (transaction_type IN ('TOPUP','PAYMENT','REFUND','BONUS','CASHBACK','WITHDRAW')),
    amount numeric(12,2) NOT NULL DEFAULT 0,
    balance_before numeric(12,2) NOT NULL DEFAULT 0,
    balance_after numeric(12,2) NOT NULL DEFAULT 0,
    description varchar(255),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wallet_transaction_wallet ON finance.wallet_transaction(wallet_id);
CREATE INDEX idx_wallet_transaction_time ON finance.wallet_transaction(created_at);
```

- [ ] **Step 2: Tulis `077_wallet.down.sql`**

```sql
DROP TABLE IF EXISTS finance.wallet_transaction;
DROP TABLE IF EXISTS finance.wallet;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 077; `All migrations applied total=57`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='finance';` → **11**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): wallet & wallet transactions (phase 7)"
```

---

## Task 7E: Voucher — voucher, user_voucher, coupon_usage

**Files:**
- Create: `backend/migrations/078_voucher.up.sql`
- Create: `backend/migrations/078_voucher.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `finance.invoice`.
- Produces: `finance.voucher` (master), `finance.user_voucher`, `finance.coupon_usage`.

- [ ] **Step 1: Tulis `078_voucher.up.sql`**

```sql
-- Migration 078: voucher, user voucher, coupon usage.

CREATE TABLE finance.voucher (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    title varchar(200),
    description text,
    discount_type varchar(20) NOT NULL CHECK (discount_type IN ('PERCENT','FIXED')),
    discount_value numeric(12,2) NOT NULL DEFAULT 0,
    maximum_discount numeric(12,2),
    minimum_purchase numeric(12,2) NOT NULL DEFAULT 0,
    usage_limit int,
    usage_per_user int,
    valid_from timestamptz,
    valid_until timestamptz,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_voucher_code ON finance.voucher(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_voucher_active ON finance.voucher(is_active);
CREATE TRIGGER trg_voucher_updated BEFORE UPDATE ON finance.voucher
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.user_voucher (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id uuid NOT NULL REFERENCES finance.voucher(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    claimed_at timestamptz NOT NULL DEFAULT NOW(),
    expired_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','USED','EXPIRED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (voucher_id, user_id)
);
CREATE INDEX idx_user_voucher_user ON finance.user_voucher(user_id);
CREATE INDEX idx_user_voucher_status ON finance.user_voucher(status);

CREATE TABLE finance.coupon_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id uuid NOT NULL REFERENCES finance.voucher(id) ON DELETE CASCADE,
    invoice_id uuid NOT NULL REFERENCES finance.invoice(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    discount_amount numeric(12,2) NOT NULL DEFAULT 0,
    used_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (voucher_id, invoice_id)
);
CREATE INDEX idx_coupon_usage_invoice ON finance.coupon_usage(invoice_id);
CREATE INDEX idx_coupon_usage_user ON finance.coupon_usage(user_id);
```

- [ ] **Step 2: Tulis `078_voucher.down.sql`**

```sql
DROP TABLE IF EXISTS finance.coupon_usage;
DROP TABLE IF EXISTS finance.user_voucher;
DROP TABLE IF EXISTS finance.voucher;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 078; `All migrations applied total=58`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='finance';` → **14**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): voucher/user_voucher/coupon usage (phase 7)"
```

---

## Task 7F: Refund, Commission, Tax

**Files:**
- Create: `backend/migrations/079_refund_commission_tax.up.sql`
- Create: `backend/migrations/079_refund_commission_tax.down.sql`

**Interfaces:**
- Consumes: `finance.payment`, `finance.invoice`, `identity.user`.
- Produces: `finance.refund`, `finance.commission`, `finance.tax`.

- [ ] **Step 1: Tulis `079_refund_commission_tax.up.sql`**

```sql
-- Migration 079: refund, commission, tax.

CREATE TABLE finance.refund (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES finance.payment(id) ON DELETE CASCADE,
    invoice_id uuid NOT NULL REFERENCES finance.invoice(id) ON DELETE CASCADE,
    amount numeric(12,2) NOT NULL DEFAULT 0,
    reason varchar(255),
    status varchar(30) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','APPROVED','REJECTED','PROCESSED','COMPLETED')),
    requested_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    approved_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    requested_at timestamptz NOT NULL DEFAULT NOW(),
    approved_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refund_payment ON finance.refund(payment_id);
CREATE INDEX idx_refund_invoice ON finance.refund(invoice_id);
CREATE INDEX idx_refund_status ON finance.refund(status);
CREATE TRIGGER trg_refund_updated BEFORE UPDATE ON finance.refund
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.commission (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_type varchar(40),
    reference_id uuid,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    school_id uuid,
    amount numeric(12,2) NOT NULL DEFAULT 0,
    percentage numeric(5,2),
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','PAID','CANCELLED')),
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_commission_user ON finance.commission(user_id);
CREATE INDEX idx_commission_status ON finance.commission(status);
CREATE TRIGGER trg_commission_updated BEFORE UPDATE ON finance.commission
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.tax (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    country varchar(80) NOT NULL,
    province varchar(80),
    tax_name varchar(120) NOT NULL,
    tax_percentage numeric(5,2) NOT NULL DEFAULT 0,
    effective_from timestamptz NOT NULL,
    effective_until timestamptz,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tax_country ON finance.tax(country);
```

- [ ] **Step 2: Tulis `079_refund_commission_tax.down.sql`**

```sql
DROP TABLE IF EXISTS finance.tax;
DROP TABLE IF EXISTS finance.commission;
DROP TABLE IF EXISTS finance.refund;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 079; `All migrations applied total=59`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='finance';` → **17**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): refund/commission/tax (phase 7)"
```

---

## Task 7G: Revenue, Report, Audit

**Files:**
- Create: `backend/migrations/080_revenue_report_audit.up.sql`
- Create: `backend/migrations/080_revenue_report_audit.down.sql`

**Interfaces:**
- Consumes: `identity.user`.
- Produces: `finance.revenue_summary`, `finance.financial_report`, `finance.financial_audit_log` (append-only).

- [ ] **Step 1: Tulis `080_revenue_report_audit.up.sql`**

```sql
-- Migration 080: revenue summary, financial report, financial audit log.

CREATE TABLE finance.revenue_summary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    gross_income numeric(12,2) NOT NULL DEFAULT 0,
    net_income numeric(12,2) NOT NULL DEFAULT 0,
    tax numeric(12,2) NOT NULL DEFAULT 0,
    refund numeric(12,2) NOT NULL DEFAULT 0,
    transaction_count int NOT NULL DEFAULT 0,
    new_subscription int NOT NULL DEFAULT 0,
    renewal int NOT NULL DEFAULT 0,
    cancel int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date)
);

CREATE TABLE finance.financial_report (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name varchar(200) NOT NULL,
    period_start timestamptz,
    period_end timestamptz,
    report_type varchar(40),
    generated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    file_url text,
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_financial_report_type ON finance.financial_report(report_type);

CREATE TABLE finance.financial_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    actor_role varchar(40),
    action varchar(60) NOT NULL,
    table_name varchar(80) NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address varchar(45),
    device varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_financial_audit_actor ON finance.financial_audit_log(actor_id);
CREATE INDEX idx_financial_audit_table ON finance.financial_audit_log(table_name);
CREATE INDEX idx_financial_audit_time ON finance.financial_audit_log(created_at);
```

- [ ] **Step 2: Tulis `080_revenue_report_audit.down.sql`**

```sql
DROP TABLE IF EXISTS finance.financial_audit_log;
DROP TABLE IF EXISTS finance.financial_report;
DROP TABLE IF EXISTS finance.revenue_summary;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 080; `All migrations applied total=60`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='finance';` → **20**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): revenue summary/report/audit log (phase 7)"
```

---

## Task 7H: Promotion, Recurring Billing, Notification, Setting

**Files:**
- Create: `backend/migrations/081_finance_setting.up.sql`
- Create: `backend/migrations/081_finance_setting.down.sql`

**Interfaces:**
- Consumes: `finance.subscription`, `finance.invoice`, `finance.payment`, `identity.user`.
- Produces: `finance.promotion`, `finance.recurring_billing`, `finance.finance_notification`, `finance.finance_setting`.

- [ ] **Step 1: Tulis `081_finance_setting.up.sql`**

```sql
-- Migration 081: promotion, recurring billing, finance notification, setting.

CREATE TABLE finance.promotion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(200) NOT NULL,
    description text,
    start_date timestamptz,
    end_date timestamptz,
    discount_type varchar(20) NOT NULL CHECK (discount_type IN ('PERCENT','FIXED')),
    discount_value numeric(12,2) NOT NULL DEFAULT 0,
    maximum_discount numeric(12,2),
    minimum_purchase numeric(12,2) NOT NULL DEFAULT 0,
    quota int,
    remaining_quota int,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_promotion_active ON finance.promotion(active);
CREATE TRIGGER trg_promotion_updated BEFORE UPDATE ON finance.promotion
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.recurring_billing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid NOT NULL REFERENCES finance.subscription(id) ON DELETE CASCADE,
    scheduled_date timestamptz NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SUCCESS','FAILED','CANCELLED')),
    retry int NOT NULL DEFAULT 0,
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recurring_billing_subscription ON finance.recurring_billing(subscription_id);
CREATE INDEX idx_recurring_billing_status ON finance.recurring_billing(status);
CREATE TRIGGER trg_recurring_billing_updated BEFORE UPDATE ON finance.recurring_billing
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE finance.finance_notification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    invoice_id uuid REFERENCES finance.invoice(id) ON DELETE SET NULL,
    payment_id uuid REFERENCES finance.payment(id) ON DELETE SET NULL,
    notification_type varchar(40) NOT NULL,
    channel varchar(20),
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED')),
    sent_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_finance_notification_user ON finance.finance_notification(user_id);
CREATE INDEX idx_finance_notification_type ON finance.finance_notification(notification_type);
CREATE INDEX idx_finance_notification_status ON finance.finance_notification(status);

CREATE TABLE finance.finance_setting (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key varchar(80) NOT NULL,
    setting_value text,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_finance_setting_key ON finance.finance_setting(setting_key);
CREATE TRIGGER trg_finance_setting_updated BEFORE UPDATE ON finance.finance_setting
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `081_finance_setting.down.sql`**

```sql
DROP TABLE IF EXISTS finance.finance_setting;
DROP TABLE IF EXISTS finance.finance_notification;
DROP TABLE IF EXISTS finance.recurring_billing;
DROP TABLE IF EXISTS finance.promotion;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 081; `All migrations applied total=61`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='finance';` → **24** ✓ (menyelesaikan domain finance)

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): promotion/billing/notification/setting (phase 7) - completes finance domain (24 tables)"
```

---

## Self-Review

**Spec coverage:** design doc §3 fase 7 (Finance, 24 tabel) terpenuhi: 8 file migrasi (074–081), 24 tabel sesuai §4.7 katalog. Daftar 1:1 — membership_package, package_feature, user_membership, subscription, invoice, payment, payment_transaction, payment_gateway_log, wallet, wallet_transaction, voucher, user_voucher, coupon_usage, refund, tax, commission, revenue_summary, financial_report, financial_audit_log, payment_method, promotion, recurring_billing, finance_notification, finance_setting = 24.

**Placeholder scan:** tidak ada TBD/TODO; SQL lengkap per task; enum & indeks eksplisit.

**Type/name consistency:** konvensi §2 diterapkan (uuid PK, snake_case, timestamps, deleted_at pada `membership_package`/`voucher`, CHECK enum, indeks FK/komposit/unik, `numeric(12,2)` untuk uang, `numeric(5,2)` untuk persen). Circular FK `invoice.membership_id ↔ user_membership.invoice_id` diresolusi via ALTER di Task 7B (2 FK ditambahkan setelah kedua tabel ada; down drop FK dulu). `commission.school_id`/`reference_id` dan `wallet_transaction.reference_id` dibuat `uuid` tanpa FK (polimorfik/opsional — mengikuti §5, referensi lintas entitas via `reference_type`+`reference_id`). `payment.payment_method`/`gateway` disimpan sebagai varchar (kode), bukan FK wajib ke `payment_method` — ringan dan sesuai pola `subscription.payment_method` di katalog.

**Cacat design yang dihindari:** tidak ada dual-schema legacy (`finance_*` lama sudah dihapus di Phase 0); uang memakai numeric bukan float; `financial_audit_log` append-only; `revenue_summary` unik per tanggal untuk agregasi harian.

## Execution Handoff

**Plan selesai & tersimpan: `docs/superpowers/plans/2026-08-04-database-rebuild-phase7-finance.md`. Dua opsi eksekusi:**

1. **Subagent-Driven (recommended)** — dispatch subagent baru per task, review antar task, iterasi cepat.
2. **Inline Execution** — eksekusi tasks di sesi ini dengan checkpoints.

**Pilih yang mana?**
