-- Migration 082: index remaining finance FKs.

CREATE INDEX idx_membership_package_created_by ON finance.membership_package(created_by);
CREATE INDEX idx_membership_package_updated_by ON finance.membership_package(updated_by);
CREATE INDEX idx_invoice_membership ON finance.invoice(membership_id);
CREATE INDEX idx_user_membership_invoice ON finance.user_membership(invoice_id);
CREATE INDEX idx_user_membership_subscription ON finance.user_membership(subscription_id);
CREATE INDEX idx_refund_requested_by ON finance.refund(requested_by);
CREATE INDEX idx_refund_approved_by ON finance.refund(approved_by);
CREATE INDEX idx_financial_report_generated_by ON finance.financial_report(generated_by);
CREATE INDEX idx_finance_notification_invoice ON finance.finance_notification(invoice_id);
CREATE INDEX idx_finance_notification_payment ON finance.finance_notification(payment_id);
