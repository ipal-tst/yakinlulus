ALTER TABLE media.asset DROP CONSTRAINT IF EXISTS fk_asset_current_version;
DROP TABLE IF EXISTS media.asset_version;
DROP TABLE IF EXISTS media.asset;
DROP TABLE IF EXISTS media.asset_storage;
DROP TABLE IF EXISTS media.storage_provider;
DROP TABLE IF EXISTS media.asset_type;
