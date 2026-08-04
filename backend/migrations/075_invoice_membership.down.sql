ALTER TABLE finance.user_membership DROP CONSTRAINT IF EXISTS fk_user_membership_invoice;
ALTER TABLE finance.invoice DROP CONSTRAINT IF EXISTS fk_invoice_membership;
DROP TABLE IF EXISTS finance.user_membership;
DROP TABLE IF EXISTS finance.invoice;
