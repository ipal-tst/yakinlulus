-- Migration 082: drop finance FK indexes (down).

DROP INDEX IF EXISTS idx_finance_notification_payment;
DROP INDEX IF EXISTS idx_finance_notification_invoice;
DROP INDEX IF EXISTS idx_financial_report_generated_by;
DROP INDEX IF EXISTS idx_refund_approved_by;
DROP INDEX IF EXISTS idx_refund_requested_by;
DROP INDEX IF EXISTS idx_user_membership_subscription;
DROP INDEX IF EXISTS idx_user_membership_invoice;
DROP INDEX IF EXISTS idx_invoice_membership;
DROP INDEX IF EXISTS idx_membership_package_updated_by;
DROP INDEX IF EXISTS idx_membership_package_created_by;
