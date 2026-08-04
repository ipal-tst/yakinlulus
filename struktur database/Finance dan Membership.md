Untuk **YakinLulus.id**, saya menyarankan **Finance** dan **Membership** dijadikan **1 bounded context (Billing Domain)** karena seluruh transaksi keuangan berasal dari membership, voucher, invoice, dan pembayaran. Domain ini harus siap menangani **100.000+ user**, **10.000 concurrent users**, dan mudah dikembangkan untuk payment gateway seperti Midtrans, Xendit, Tripay, DOKU, maupun Stripe.

---

# Billing Domain Architecture

```text
Finance & Membership

├── Membership Management
├── Subscription
├── Package Management
├── Billing
├── Invoice
├── Payment
├── Payment Gateway
├── Wallet
├── Voucher & Coupon
├── Promotion
├── Tax
├── Refund
├── Settlement
├── Revenue
├── Commission
├── Financial Report
├── Audit Log
└── Notification
```

---

# Database ERD

```text
membership_packages
        │
        ├──────────────┐
        ▼              ▼

user_memberships     package_features

        │
        ▼

subscriptions
        │
        ▼

invoices
        │
        ▼

payments
        │
        ▼

payment_transactions
        │
        ├───────────────┐
        ▼               ▼

refunds         payment_gateway_logs


users
   │
   ├──── wallet
   │
   ├──── wallet_transactions
   │
   ├──── vouchers
   │
   ├──── user_vouchers
   │
   ├──── coupon_usage
   │
   ├──── commissions
   │
   └──── financial_audit_logs
```

---

# 1. membership_packages

Master paket membership.

```text
id UUID PK

code

name

slug

description

package_type
(
trial,
monthly,
quarterly,
semester,
yearly,
lifetime
)

level
(
basic,
premium,
pro,
enterprise
)

duration_day

price

discount_price

currency

max_device

max_login

max_student

max_teacher

is_trial

trial_day

is_active

is_featured

sort_order

created_by

updated_by

created_at

updated_at

deleted_at
```

---

# 2. package_features

Daftar fitur setiap paket.

```text
id

membership_package_id

feature_code

feature_name

feature_value

is_unlimited

created_at
```

Contoh

```text
AI_TUTOR

CBT

QUESTION_BANK

DOWNLOAD

VIDEO

LIVE_CLASS

ANALYTICS

CERTIFICATE

OFFLINE_MODE

```

---

# 3. user_memberships

Membership aktif user.

```text
id

user_id

membership_package_id

invoice_id

subscription_id

status

active_from

expired_at

remaining_day

is_trial

auto_renew

renewal_count

cancel_reason

cancelled_at

created_at

updated_at
```

---

# 4. subscriptions

Auto renewal.

```text
id

user_id

membership_package_id

billing_cycle

next_billing_date

last_billing_date

status

payment_method

gateway

retry_count

created_at

updated_at
```

Status

```text
ACTIVE

PAUSED

CANCELLED

EXPIRED

FAILED

```

---

# 5. invoices

Tagihan.

```text
id UUID

invoice_number

user_id

membership_id

subtotal

discount

voucher_discount

tax

service_fee

total

currency

status

issued_at

expired_at

paid_at

created_at
```

Status

```text
DRAFT

UNPAID

PENDING

PAID

FAILED

EXPIRED

VOID

REFUND

```

---

# 6. payments

Pembayaran.

```text
id

invoice_id

user_id

payment_method

payment_channel

gateway

amount

fee

net_amount

currency

status

payment_time

gateway_reference

gateway_transaction_id

approval_code

created_at

updated_at
```

---

# 7. payment_transactions

Semua callback gateway.

```text
id

payment_id

event_type

gateway_status

request_payload JSONB

response_payload JSONB

signature

verified

created_at
```

---

# 8. payment_gateway_logs

Log debugging gateway.

```text
id

gateway

endpoint

request

response

http_status

latency

created_at
```

---

# 9. wallet

Dompet virtual (opsional).

```text
id

user_id

balance

locked_balance

currency

updated_at
```

---

# 10. wallet_transactions

Ledger wallet.

```text
id

wallet_id

reference_type

reference_id

transaction_type

amount

balance_before

balance_after

description

created_at
```

Jenis

```text
TOPUP

PAYMENT

REFUND

BONUS

CASHBACK

WITHDRAW

```

---

# 11. vouchers

Voucher global.

```text
id

code

title

description

discount_type

discount_value

maximum_discount

minimum_purchase

usage_limit

usage_per_user

valid_from

valid_until

is_active

created_at
```

---

# 12. user_vouchers

Voucher milik user.

```text
id

voucher_id

user_id

claimed_at

expired_at

status
```

---

# 13. coupon_usage

Riwayat penggunaan voucher.

```text
id

voucher_id

invoice_id

user_id

discount_amount

used_at
```

---

# 14. refunds

Refund pembayaran.

```text
id

payment_id

invoice_id

amount

reason

status

requested_by

approved_by

requested_at

approved_at

completed_at
```

---

# 15. taxes

Master pajak.

```text
id

country

province

tax_name

tax_percentage

effective_from

effective_until

active
```

---

# 16. commissions

Komisi afiliasi atau sekolah.

```text
id

reference_type

reference_id

user_id

school_id

amount

percentage

status

paid_at
```

---

# 17. revenue_summary

Agregasi pendapatan.

```text
id

date

gross_income

net_income

tax

refund

transaction_count

new_subscription

renewal

cancel

created_at
```

---

# 18. financial_reports

Laporan keuangan.

```text
id

report_name

period_start

period_end

report_type

generated_by

file_url

generated_at
```

---

# 19. financial_audit_logs

Audit seluruh aktivitas finansial.

```text
id

actor_id

actor_role

action

table_name

record_id

old_data JSONB

new_data JSONB

ip_address

device

created_at
```

---

# 20. payment_methods

Master metode pembayaran.

```text
id

code

name

category

gateway

is_active

sort_order
```

Contoh

```text
QRIS

BCA VA

BNI VA

BRI VA

Mandiri VA

GoPay

OVO

Dana

ShopeePay

Credit Card

Debit Card

Bank Transfer

```

---

# 21. promotions

Promo musiman.

```text
id

title

description

start_date

end_date

discount_type

discount_value

maximum_discount

minimum_purchase

quota

remaining_quota

active
```

---

# 22. recurring_billings

Scheduler auto-renew.

```text
id

subscription_id

scheduled_date

status

retry

processed_at
```

---

# 23. finance_notifications

Notifikasi finansial.

```text
id

user_id

invoice_id

payment_id

notification_type

channel

status

sent_at
```

---

# 24. finance_settings

Konfigurasi domain finance.

```text
id

setting_key

setting_value

description
```

Contoh:

* default_currency
* default_tax
* invoice_expired_hours
* auto_cancel_invoice
* retry_payment
* retry_interval
* auto_refund
* auto_renew_default

---

# Relasi Utama

```text
User

│

├── User Membership

│        │

│        └── Subscription

│                 │

│                 └── Invoice

│                        │

│                        └── Payment

│                                │

│                                ├── Refund

│                                ├── Gateway Log

│                                └── Transaction

│

├── Wallet

│      └── Wallet Transaction

│

└── Voucher
```

---

# Index Strategy

Tabel dengan trafik tinggi perlu indeks khusus:

### invoices

* `(invoice_number)` UNIQUE
* `(user_id, status)`
* `(status, expired_at)`
* `(created_at DESC)`

### payments

* `(invoice_id)`
* `(gateway_transaction_id)` UNIQUE
* `(gateway_reference)`
* `(status, payment_time)`
* `(user_id, created_at DESC)`

### subscriptions

* `(user_id)`
* `(status, next_billing_date)`
* `(next_billing_date)`

### user_memberships

* `(user_id, status)`
* `(expired_at)`
* `(membership_package_id)`

### vouchers

* `(code)` UNIQUE
* `(valid_until)`
* `(is_active)`

---

# Partisi Tabel

Untuk menjaga performa pada skala besar:

| Tabel                | Strategi            |
| -------------------- | ------------------- |
| payments             | Monthly Partition   |
| payment_transactions | Monthly Partition   |
| payment_gateway_logs | Monthly Partition   |
| financial_audit_logs | Monthly Partition   |
| wallet_transactions  | Monthly Partition   |
| invoices             | Quarterly Partition |
| revenue_summary      | Yearly Partition    |

---

# Workflow Finance

```text
Pilih Paket
      │
      ▼
Generate Invoice
      │
      ▼
Pilih Payment Method
      │
      ▼
Payment Gateway
      │
      ▼
Callback Gateway
      │
      ▼
Payment Success
      │
      ▼
Update Invoice
      │
      ▼
Aktifkan Membership
      │
      ▼
Generate Analytics
      │
      ▼
Kirim Email / WhatsApp / Push Notification
```

## Integrasi dengan Domain Lain

Domain **Finance & Membership** menjadi pusat proses komersial dan terhubung langsung dengan:

* **User & RBAC**: kepemilikan akun dan hak akses berdasarkan membership.
* **CBT Engine**: validasi akses ujian premium.
* **Learning Material**: pembatasan materi gratis dan premium.
* **AI Tutor**: akses fitur AI berdasarkan paket.
* **Analytics**: seluruh transaksi menghasilkan event untuk perhitungan MRR, ARR, ARPU, LTV, conversion rate, renewal rate, churn, dan revenue dashboard.

Dengan struktur ini, domain Finance & Membership telah mencakup kebutuhan operasional, akuntabilitas (audit trail), integrasi payment gateway, promosi, refund, auto-renewal, serta siap diskalakan untuk platform edutech berskala enterprise.
