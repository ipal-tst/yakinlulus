-- Migration 168 down: payment gateway, invoice, tax & membership configuration.

DROP TABLE IF EXISTS config.membership_configuration;
DROP TABLE IF EXISTS config.tax_configuration;
DROP TABLE IF EXISTS config.invoice_configuration;
DROP TABLE IF EXISTS config.payment_gateway;