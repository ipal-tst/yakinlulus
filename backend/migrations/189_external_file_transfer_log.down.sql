-- Migration 189 down: external file transfer log, callback queue & api configuration.

DROP TABLE IF EXISTS integration.api_configuration;
DROP TABLE IF EXISTS integration.callback_queue;
DROP TABLE IF EXISTS integration.external_file_transfer_log;