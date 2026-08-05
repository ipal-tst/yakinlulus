# DB Rebuild Phase 12: `ai` Domain (AI Tutor / Chat / RAG / Recommendation)

Base commit: `3efd12d`. Branch: `phase-12`. Worktree: `D:\Project\EdTech\yl-phase-12`.

DB URL: `postgresql://postgres:kqHtPV72xUL1PYv1@db.cjrhqywtwlmebthajrkx.supabase.co:5432/postgres?sslmode=require&connect_timeout=10`

Target: `ai` schema, migrations ONLY `120_*`..`129_*` (10 files, `.up.sql` + `.down.sql` each).
Design source: design doc §4.13 (lines ~496-511).

## Conventions (from 100_notification_*, 110_queue_*, 001)
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `created_at timestamptz NOT NULL DEFAULT NOW()`, `updated_at timestamptz NOT NULL DEFAULT NOW()` (+ `shared.set_updated_at()` trigger)
- FK: `REFERENCES identity.user(id)`
- Enum strings enforced via `CHECK (... IN ('A','B',...))`
- `CREATE INDEX` after table; names `idx_<table>_<col>`
- pgvector `vector` type is available (enabled in `001_functions_and_extensions.up.sql` line 4) — do NOT recreate extension.
- DOWN files reverse-dependency-ordered + idempotent.

## Task 12A — `120_ai_core`: provider, model, model_pricing (3 tables)
Verification: `go run cmd/migrate/main.go up` clean; verifier `ai` count = 3.
Commit: `feat(db): phase 12 AI core (provider/model/pricing) (phase 12)`

### 120_ai_core.up.sql
```sql
-- Migration 120: ai provider, model, model pricing.

CREATE TABLE ai.ai_provider (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL CHECK (code IN ('OPENAI','ANTHROPIC','GOOGLE','MISTRAL','LOCAL','OTHER')),
    name varchar(120) NOT NULL,
    base_url text,
    api_key_ref text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code)
);
CREATE TRIGGER trg_ai_provider_updated BEFORE UPDATE ON ai.ai_provider
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_model (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES ai.ai_provider(id) ON DELETE CASCADE,
    model_name varchar(120) NOT NULL,
    purpose varchar(20) NOT NULL CHECK (purpose IN ('OCR','CHAT','EMBEDDING','QUESTION','SUMMARY','RECOMMENDATION','TUTOR','RAG')),
    dimension int,
    context_window int,
    max_tokens int,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider_id, model_name)
);
CREATE INDEX idx_ai_model_provider ON ai.ai_model(provider_id);
CREATE INDEX idx_ai_model_purpose ON ai.ai_model(purpose);
CREATE INDEX idx_ai_model_active ON ai.ai_model(is_active);
CREATE TRIGGER trg_ai_model_updated BEFORE UPDATE ON ai.ai_model
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_model_pricing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id uuid NOT NULL REFERENCES ai.ai_model(id) ON DELETE CASCADE,
    currency char(3) NOT NULL DEFAULT 'IDR',
    input_cost numeric(18,8) NOT NULL DEFAULT 0,
    output_cost numeric(18,8) NOT NULL DEFAULT 0,
    effective_from timestamptz NOT NULL DEFAULT NOW(),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_model_pricing_model ON ai.ai_model_pricing(model_id);
CREATE TRIGGER trg_ai_model_pricing_updated BEFORE UPDATE ON ai.ai_model_pricing
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

### 120_ai_core.down.sql
```sql
DROP TABLE IF EXISTS ai.ai_model_pricing;
DROP TABLE IF EXISTS ai.ai_model;
DROP TABLE IF EXISTS ai.ai_provider;
```

## Task 12B — `121_ai_prompt`: prompt_template, conversation, conversation_participant (3 tables)
Verification: `ai` count = 6. Commit: `feat(db): phase 12 AI prompt+conversation (phase 12)`

### 121_ai_prompt.up.sql
```sql
-- Migration 121: ai prompt template, conversation, conversation participant.

CREATE TABLE ai.ai_prompt_template (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(60) NOT NULL,
    name varchar(200) NOT NULL,
    purpose varchar(20) NOT NULL CHECK (purpose IN ('OCR','CHAT','EMBEDDING','QUESTION','SUMMARY','RECOMMENDATION','TUTOR','RAG')),
    system_prompt text,
    user_template text,
    model_id uuid REFERENCES ai.ai_model(id) ON DELETE SET NULL,
    version int NOT NULL DEFAULT 1,
    parameters jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code, version)
);
CREATE INDEX idx_ai_prompt_template_active ON ai.ai_prompt_template(is_active, purpose);
CREATE TRIGGER trg_ai_prompt_template_updated BEFORE UPDATE ON ai.ai_prompt_template
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_conversation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    title varchar(200),
    subject_id uuid REFERENCES academic.subject(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ARCHIVED','CLOSED')),
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_conversation_user ON ai.ai_conversation(user_id);
CREATE INDEX idx_ai_conversation_subject ON ai.ai_conversation(subject_id);
CREATE INDEX idx_ai_conversation_status ON ai.ai_conversation(status, updated_at DESC);
CREATE TRIGGER trg_ai_conversation_updated BEFORE UPDATE ON ai.ai_conversation
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_conversation_participant (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES ai.ai_conversation(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    participant_role varchar(20) NOT NULL CHECK (participant_role IN ('OWNER','MEMBER','AI_TUTOR')),
    joined_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (conversation_id, user_id, participant_role)
);
CREATE INDEX idx_ai_conv_participant_user ON ai.ai_conversation_participant(user_id);
```

### 121_ai_prompt.down.sql
```sql
DROP TABLE IF EXISTS ai.ai_conversation_participant;
DROP TABLE IF EXISTS ai.ai_conversation;
DROP TABLE IF EXISTS ai.ai_prompt_template;
```

## Task 12C — `122_ai_message`: message, tutor_session, feedback (3 tables)
Verification: `ai` count = 9. Commit: `feat(db): phase 12 AI message/session/feedback (phase 12)`

### 122_ai_message.up.sql
```sql
-- Migration 122: ai message, tutor session, feedback.

CREATE TABLE ai.ai_message (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES ai.ai_conversation(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    role varchar(20) NOT NULL CHECK (role IN ('USER','ASSISTANT','SYSTEM','TOOL')),
    content text NOT NULL,
    content_type varchar(20) NOT NULL DEFAULT 'TEXT' CHECK (content_type IN ('TEXT','MARKDOWN','CODE','IMAGE','AUDIO')),
    model_id uuid REFERENCES ai.ai_model(id) ON DELETE SET NULL,
    input_token int NOT NULL DEFAULT 0,
    output_token int NOT NULL DEFAULT 0,
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_message_conversation ON ai.ai_message(conversation_id, created_at);
CREATE INDEX idx_ai_message_sender ON ai.ai_message(sender_id);
CREATE TRIGGER trg_ai_message_updated BEFORE UPDATE ON ai.ai_message
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_tutor_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES ai.ai_conversation(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    purpose varchar(30) NOT NULL CHECK (purpose IN ('CHAT','TUTOR','PRACTICE','SUMARIZE','QA')),
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETED','ABANDONED')),
    started_at timestamptz NOT NULL DEFAULT NOW(),
    ended_at timestamptz,
    meta jsonb
);
CREATE INDEX idx_ai_tutor_session_user ON ai.ai_tutor_session(user_id, status);
CREATE INDEX idx_ai_tutor_session_conversation ON ai.ai_tutor_session(conversation_id);

CREATE TABLE ai.ai_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES ai.ai_conversation(id) ON DELETE SET NULL,
    message_id uuid REFERENCES ai.ai_message(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    rating int CHECK (rating BETWEEN 1 AND 5),
    comment text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_feedback_user ON ai.ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_message ON ai.ai_feedback(message_id);
```

### 122_ai_message.down.sql
```sql
DROP TABLE IF EXISTS ai.ai_feedback;
DROP TABLE IF EXISTS ai.ai_tutor_session;
DROP TABLE IF EXISTS ai.ai_message;
```

## Task 12D — `123_ai_credit`: credit, credit_package, credit_package_item (3 tables)
Verification: `ai` count = 12. Commit: `feat(db): phase 12 AI credit + package (phase 12)`

### 123_ai_credit.up.sql
```sql
-- Migration 123: ai credit, credit package, credit package item.

CREATE TABLE ai.ai_credit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    balance numeric(18,6) NOT NULL DEFAULT 0,
    currency char(3) NOT NULL DEFAULT 'IDR',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_ai_credit_updated BEFORE UPDATE ON ai.ai_credit
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_credit_package (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    credit_amount numeric(18,6) NOT NULL,
    price numeric(18,6) NOT NULL,
    currency char(3) NOT NULL DEFAULT 'IDR',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code)
);
CREATE INDEX idx_ai_credit_package_active ON ai.ai_credit_package(is_active);
CREATE TRIGGER trg_ai_credit_package_updated BEFORE UPDATE ON ai.ai_credit_package
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_credit_package_item (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id uuid NOT NULL REFERENCES ai.ai_credit_package(id) ON DELETE CASCADE,
    item_type varchar(20) NOT NULL CHECK (item_type IN ('CREDIT','TOKEN','MESSAGE')),
    quantity numeric(18,6) NOT NULL DEFAULT 0,
    unit varchar(20) DEFAULT 'token'
);
CREATE INDEX idx_ai_credit_package_item_pkg ON ai.ai_credit_package_item(package_id);
```

### 123_ai_credit.down.sql
```sql
DROP TABLE IF EXISTS ai.ai_credit_package_item;
DROP TABLE IF EXISTS ai.ai_credit_package;
DROP TABLE IF EXISTS ai.ai_credit;
```

## Task 12E — `124_ai_credit_usage`: credit_transaction, usage (2 tables)
Verification: `ai` count = 14. Commit: `feat(db): phase 12 AI credit transaction + usage (phase 12)`

### 124_ai_credit_usage.up.sql
```sql
-- Migration 124: ai credit transaction, ai usage.

CREATE TABLE ai.ai_credit_transaction (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_id uuid NOT NULL REFERENCES ai.ai_credit(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    tx_type varchar(20) NOT NULL CHECK (tx_type IN ('TOPUP','SPEND','REFUND','EXPIRE','ADJUST')),
    amount numeric(18,6) NOT NULL,
    balance_after numeric(18,6) NOT NULL,
    reference_type varchar(30),
    reference_id uuid,
    note text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_credit_tx_credit ON ai.ai_credit_transaction(credit_id, created_at DESC);
CREATE INDEX idx_ai_credit_tx_user ON ai.ai_credit_transaction(user_id, created_at);
CREATE INDEX idx_ai_credit_tx_ref ON ai.ai_credit_transaction(reference_type, reference_id);

CREATE TABLE ai.ai_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    provider varchar(30) NOT NULL,
    model varchar(120) NOT NULL,
    purpose varchar(20) NOT NULL CHECK (purpose IN ('OCR','CHAT','EMBEDDING','QUESTION','SUMMARY','RECOMMENDATION','TUTOR','RAG')),
    input_token int NOT NULL DEFAULT 0,
    output_token int NOT NULL DEFAULT 0,
    estimated_cost numeric(18,8) NOT NULL DEFAULT 0,
    conversation_id uuid REFERENCES ai.ai_conversation(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_usage_user ON ai.ai_usage(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_model ON ai.ai_usage(model, created_at);
CREATE INDEX idx_ai_usage_conversation ON ai.ai_usage(conversation_id);
```

### 124_ai_credit_usage.down.sql
```sql
DROP TABLE IF EXISTS ai.ai_usage;
DROP TABLE IF EXISTS ai.ai_credit_transaction;
```

## Task 12F — `125_ai_usage_detail`: usage_daily, usage_ledger (2 tables)
Verification: `ai` count = 16. Commit: `feat(db): phase 12 AI usage daily/ledger (phase 12)`

### 125_ai_usage_detail.up.sql
```sql
-- Migration 125: ai usage daily rollup, usage ledger.

CREATE TABLE ai.ai_usage_daily (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    usage_date date NOT NULL,
    provider varchar(30),
    model varchar(120),
    purpose varchar(20),
    input_token int NOT NULL DEFAULT 0,
    output_token int NOT NULL DEFAULT 0,
    request_count int NOT NULL DEFAULT 0,
    estimated_cost numeric(18,8) NOT NULL DEFAULT 0,
    UNIQUE (user_id, usage_date, model, purpose)
);
CREATE INDEX idx_ai_usage_daily_user ON ai.ai_usage_daily(user_id, usage_date DESC);

CREATE TABLE ai.ai_usage_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usage_id uuid NOT NULL REFERENCES ai.ai_usage(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    token_count int NOT NULL DEFAULT 0,
    cost numeric(18,8) NOT NULL DEFAULT 0,
    debit_credit varchar(10) NOT NULL CHECK (debit_credit IN ('DEBIT','CREDIT')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_usage_ledger_user ON ai.ai_usage_ledger(user_id, created_at);
CREATE INDEX idx_ai_usage_ledger_usage ON ai.ai_usage_ledger(usage_id);
```

### 125_ai_usage_detail.down.sql
```sql
DROP TABLE IF EXISTS ai.ai_usage_ledger;
DROP TABLE IF EXISTS ai.ai_usage_daily;
```

## Task 12G — `126_ai_rag`: knowledge_base, document, document_processing (3 tables)
Verification: `ai` count = 19. Commit: `feat(db): phase 12 AI knowledge base + document (phase 12)`

### 126_ai_rag.up.sql
```sql
-- Migration 126: ai knowledge base, document, document processing.

CREATE TABLE ai.ai_knowledge_base (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    description text,
    kb_type varchar(20) NOT NULL CHECK (kb_type IN ('DOCUMENT','WEB','MANUAL','ACADEMIC','MF_FEATURE')),
    material_id uuid REFERENCES content.material(id) ON DELETE SET NULL,
    subject_id uuid REFERENCES academic.subject(id) ON DELETE SET NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_knowledge_base_active ON ai.ai_knowledge_base(is_active);
CREATE INDEX idx_ai_knowledge_base_material ON ai.ai_knowledge_base(material_id);
CREATE TRIGGER trg_ai_knowledge_base_updated BEFORE UPDATE ON ai.ai_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_document (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id uuid NOT NULL REFERENCES ai.ai_knowledge_base(id) ON DELETE CASCADE,
    title varchar(300) NOT NULL,
    source_type varchar(20) NOT NULL CHECK (source_type IN ('PDF','DOCX','PPTX','IMAGE','TEXT','HTML','MARKDOWN','AUDIO','VIDEO','Q&A')),
    storage_path text,
    media_asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    checksum varchar(64),
    status varchar(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','PROCESSING','INDEXED','PARTIAL','FAILED','PURGED')),
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_document_kb ON ai.ai_document(knowledge_base_id);
CREATE INDEX idx_ai_document_status ON ai.ai_document(status);
CREATE INDEX idx_ai_document_asset ON ai.ai_document(media_asset_id);
CREATE TRIGGER trg_ai_document_updated BEFORE UPDATE ON ai.ai_document
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_document_processing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES ai.ai_document(id) ON DELETE CASCADE,
    stage varchar(30) NOT NULL CHECK (stage IN ('EXTRACT','CHUNK','EMBED','INDEX')),
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED')),
    model_id uuid REFERENCES ai.ai_model(id) ON DELETE SET NULL,
    error_message text,
    duration_ms int,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_doc_processing_doc ON ai.ai_document_processing(document_id, stage);
```

### 126_ai_rag.down.sql
```sql
DROP TABLE IF EXISTS ai.ai_document_processing;
DROP TABLE IF EXISTS ai.ai_document;
DROP TABLE IF EXISTS ai.ai_knowledge_base;
```

## Task 12H — `127_ai_vector`: embedding, rag_chunk (2 tables)
Verification: `ai` count = 21. Commit: `feat(db): phase 12 AI embedding + rag chunk (phase 12)`

> `ai.embedding` is created HERE (before 129 so the deferred FK can reference it). Uses `vector` type (pgvector enabled in 001). NOTE: table is named `ai.embedding` (not `ai.ai_embedding`) so it matches the deferred FK `REFERENCES ai.embedding(id)` promised in `071_material_ai.up.sql`.

### 127_ai_vector.up.sql
```sql
-- Migration 127: ai embedding, rag chunk.

CREATE TABLE ai.embedding (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model varchar(120) NOT NULL,
    dimension int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_embedding_model ON ai.embedding(model, dimension);

CREATE TABLE ai.ai_rag_chunk (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES ai.ai_document(id) ON DELETE CASCADE,
    chunk_index int NOT NULL,
    content text NOT NULL,
    embedding vector,
    embedding_id uuid REFERENCES ai.embedding(id) ON DELETE SET NULL,
    token_count int NOT NULL DEFAULT 0,
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, chunk_index)
);
CREATE INDEX idx_ai_rag_chunk_document ON ai.ai_rag_chunk(document_id);
```

### 127_ai_vector.down.sql
```sql
DROP TABLE IF EXISTS ai.ai_rag_chunk;
DROP TABLE IF EXISTS ai.embedding;
```

## Task 12I — `128_ai_recommend`: recommendation, recommendation_feedback, weak_topic (3 tables)
Verification: `ai` count = 24. Commit: `feat(db): phase 12 AI recommendation + weak topic (phase 12)`

### 128_ai_recommend.up.sql
```sql
-- Migration 128: ai recommendation, recommendation feedback, weak topic.

CREATE TABLE ai.ai_recommendation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    rec_type varchar(20) NOT NULL CHECK (rec_type IN ('WEAK_TOPIC','MATERIAL','PRACTICE','EXAM','TUTOR')),
    recommended_entity_type varchar(30),
    recommended_entity_id uuid,
    reason text,
    confidence numeric(6,4) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    source varchar(30) NOT NULL CHECK (source IN ('RAG','RULE','HYBRID','MATERIAL_EMBEDDING')),
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, rec_type, recommended_entity_type, recommended_entity_id)
);
CREATE INDEX idx_ai_recommendation_user ON ai.ai_recommendation(user_id, created_at DESC, confidence DESC);
CREATE INDEX idx_ai_recommendation_entity ON ai.ai_recommendation(recommended_entity_type, recommended_entity_id);

CREATE TABLE ai.ai_recommendation_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id uuid NOT NULL REFERENCES ai.ai_recommendation(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    feedback varchar(20) NOT NULL CHECK (feedback IN ('ACCEPTED','REJECTED','IGNORED')),
    comment text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_recommendation_fb_rec ON ai.ai_recommendation_feedback(recommendation_id);
CREATE INDEX idx_ai_recommendation_fb_user ON ai.ai_recommendation_feedback(user_id);

CREATE TABLE ai.weak_topic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    topic_id uuid REFERENCES academic.topic(id) ON DELETE CASCADE,
    mastery_level numeric(6,4) NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 1),
    reason jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, topic_id)
);
CREATE INDEX idx_weak_topic_user ON ai.weak_topic(user_id, mastery_level);
CREATE TRIGGER trg_weak_topic_updated BEFORE UPDATE ON ai.weak_topic
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

### 128_ai_recommend.down.sql
```sql
DROP TABLE IF EXISTS ai.weak_topic;
DROP TABLE IF EXISTS ai.ai_recommendation_feedback;
DROP TABLE IF EXISTS ai.ai_recommendation;
```

## Task 12J — `129_ai_fix`: generation_log, moderation_log (2 tables) + DEFERRED FK to content.material_embedding.embedding_id (LAST file)
Verification: `ai` count = 26; deferred FK query returns `fk_material_embedding_embedding_id`.
Commit: `feat(db): phase 12 AI generation/moderation + deferred material FK (phase 12)`

> 129 is the LAST file, satisfying the deferred-FK requirement (create `ai.embedding` in 127, reference it here).

### 129_ai_fix.up.sql
```sql
-- Migration 129: ai generation log, moderation log, deferred material_embedding FK.

CREATE TABLE ai.ai_generation_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    conversation_id uuid REFERENCES ai.ai_conversation(id) ON DELETE SET NULL,
    prompt_template_id uuid REFERENCES ai.ai_prompt_template(id) ON DELETE SET NULL,
    model varchar(120),
    purpose varchar(20) NOT NULL CHECK (purpose IN ('OCR','CHAT','EMBEDDING','QUESTION','SUMMARY','RECOMMENDATION','TUTOR','RAG')),
    status varchar(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','CANCELLED')),
    input_token int NOT NULL DEFAULT 0,
    output_token int NOT NULL DEFAULT 0,
    error text,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    finished_at timestamptz
);
CREATE INDEX idx_ai_generation_log_user ON ai.ai_generation_log(user_id, started_at DESC);
CREATE INDEX idx_ai_generation_log_conversation ON ai.ai_generation_log(conversation_id);

CREATE TABLE ai.ai_moderation_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    message_id uuid REFERENCES ai.ai_message(id) ON DELETE SET NULL,
    content text,
    decision varchar(20) NOT NULL CHECK (decision IN ('ALLOW','BLOCK','FLAG')),
    reason varchar(30),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_moderation_log_user ON ai.ai_moderation_log(user_id);
CREATE INDEX idx_ai_moderation_log_decision ON ai.ai_moderation_log(decision, created_at);

-- Resolve deferred FK promised in 071_material_ai.up.sql.
ALTER TABLE content.material_embedding
  ADD CONSTRAINT fk_material_embedding_embedding_id
  FOREIGN KEY (embedding_id) REFERENCES ai.embedding(id);
```

### 129_ai_fix.down.sql
```sql
ALTER TABLE content.material_embedding DROP CONSTRAINT IF EXISTS fk_material_embedding_embedding_id;
DROP TABLE IF EXISTS ai.ai_moderation_log;
DROP TABLE IF EXISTS ai.ai_generation_log;
```

## Verification Gate (phase 12)
- [ ] `go run cmd/migrate/main.go up` applies all 10 files cleanly (no error).
- [ ] Verifier `ai` table count = 26 (>= 13).
- [ ] Deferred FK present: `fk_material_embedding_embedding_id`.
- [ ] `_migrations` grew by exactly 10 (records for 120-129).
- [ ] Each task committed individually.
- [ ] `docs/superpowers/plans/2026-08-05-database-rebuild-phase12-ai.md` + `.superpowers/sdd/progress.md` committed.

## Deviations
- `ai_embedding` in design doc §4.13 is materialized as `ai.embedding` (single word, matching the deferred FK `REFERENCES ai.embedding(id)` promised in `071_material_ai.up.sql`), created in 127 so 129 can reference it.
- `ai_rag_chunk` includes both `content text` and an optional inline `embedding vector` column plus `embedding_id` FK into `ai.embedding` for flexibility.
- Added operational tables (`ai_generation_log`, `ai_moderation_log`, `ai_document_processing`, `ai_credit_package`) beyond the §4.13 minimum to fully support the AI tutor/chat/RAG pipelines.