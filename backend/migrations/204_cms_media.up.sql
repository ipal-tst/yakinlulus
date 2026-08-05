-- Migration 204: cms media & media folder.

CREATE TABLE cms.cms_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    filename varchar(255) NOT NULL,
    original_name varchar(255),
    mime_type varchar(120),
    extension varchar(20),
    size bigint NOT NULL DEFAULT 0,
    width int,
    height int,
    duration int,
    storage_provider varchar(60),
    storage_path text,
    public_url text,
    thumbnail_url text,
    hash varchar(64) NOT NULL,
    uploaded_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    folder_id uuid,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (hash)
);
CREATE INDEX idx_cms_media_uploader ON cms.cms_media(uploaded_by);
CREATE INDEX idx_cms_media_folder ON cms.cms_media(folder_id);
CREATE INDEX idx_cms_media_type ON cms.cms_media(mime_type);

CREATE TABLE cms.cms_media_folder (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid REFERENCES cms.cms_media_folder(id) ON DELETE CASCADE,
    name varchar(200) NOT NULL,
    path varchar(500) NOT NULL,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (path)
);
CREATE INDEX idx_cms_media_folder_parent ON cms.cms_media_folder(parent_id);