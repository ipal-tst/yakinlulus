# Database Rebuild Phase 8 Implementation Plan (Ranking)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun domain `ranking` (leaderboard & skor) — 25 tabel — sesuai design doc `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §4.8, menggantikan `ranking_*`/`leaderboard_*` legacy.

**Architecture:** Mekanisme per design doc §4.8: raw score → formula versioned → snapshot leaderboard → cache Top-N → event-driven recalculation. `ranking_category`/`ranking_period`/`ranking_formula` mendefinisikan aturan; `leaderboard` + `leaderboard_entry` menyimpan snapshot; `ranking_score` menyimpan skor mentah/terbobot; tabel agregat per entitas (subject/exam/school/class/province/city) + reward/badge/achievement/streak + history/statistic/setting melengkapi domain.

**Tech Stack:** PostgreSQL (Supabase), runner Go `go run cmd/migrate/main.go up`, verifikasi via throwaway Go program (pgx) + `cmd/tools/dbcheck`.

**Files target:** `backend/migrations/083_ranking_core.{up,down}.sql` s.d. `090_ranking_statistic.{up,down}.sql` (8 file pasangan).

---

## Global Constraints

Semua tabel mematuhi **Global Conventions** (`docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §2):

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel.
- Nama `snake_case` singular; kolom referensi `<entity>_id`.
- `created_at timestamptz NOT NULL DEFAULT NOW()` wajib; `updated_at` untuk tabel mutable.
- Enum: `text`/`varchar` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Indeks semua FK + filter umum; indeks unik sesuai spec.
- Rata-rata numerik: skor `numeric(10,2)`/`numeric(12,2)`, persen `numeric(5,2)`, count `int`.
- FK lintas schema: `identity.user` (user_id di semua entitas per-user).
- Migrasi harus `up` bersih dari nol, dibungkus transaksi (runner sudah tx per file).
- Jangan sentuh kode Go runner.
- **Keputusan desain (deviasi minor, dicatat):**
  1. **Tidak ada partisi fisik** — konsisten dengan semua fase sebelumnya; strategi partisi ditunda.
  2. **§5 Cross-Domain Reference Rules:** `ranking` membaca dari `cbt`/`question`/`content`/`finance` — **event-driven, TANPA FK langsung yang membuat kunci**. Karena itu SEMUA kolom referensi lintas-entitas non-user (`subject_id`, `exam_id`, `exam_session_id`, `school_id`, `class_id`, `province_id`, `city_id`, `region_id`) dibuat sebagai `uuid` TANPA FK. Hanya `user_id` yang memakai FK ke `identity.user` (pusat identitas, tidak membuat siklus). FK internal antar-tabel `ranking` (category_id, period_id, leaderboard_id, reward_id, badge_id, achievement_id) tetap FK normal.

---

## Task 8A: Ranking Core — category, period, setting

**Files:**
- Create: `backend/migrations/083_ranking_core.up.sql`
- Create: `backend/migrations/083_ranking_core.down.sql`

**Interfaces:**
- Consumes: schema `ranking` (000), `shared.set_updated_at()` (001).
- Produces: `ranking.ranking_category`, `ranking.ranking_period`, `ranking.ranking_setting`.

- [ ] **Step 1: Tulis `083_ranking_core.up.sql`**

```sql
-- Migration 083: ranking core - category, period, setting.

CREATE TABLE ranking.ranking_category (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code varchar(50) NOT NULL,
    category_name varchar(200) NOT NULL,
    description text,
    ranking_type varchar(30) NOT NULL CHECK (ranking_type IN ('OVERALL','ACADEMIC','EXAM','PRACTICE','SUBJECT','SPEED','CONSISTENCY','ACHIEVEMENT','STREAK','CUSTOM')),
    scope varchar(20) NOT NULL DEFAULT 'GLOBAL' CHECK (scope IN ('GLOBAL','PROVINCE','CITY','SCHOOL','CLASS','GROUP')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_ranking_category_code ON ranking.ranking_category(category_code);
CREATE INDEX idx_ranking_category_type ON ranking.ranking_category(ranking_type);
CREATE TRIGGER trg_ranking_category_updated BEFORE UPDATE ON ranking.ranking_category
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ranking.ranking_period (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period_name varchar(200) NOT NULL,
    period_type varchar(20) NOT NULL DEFAULT 'WEEKLY' CHECK (period_type IN ('DAILY','WEEKLY','MONTHLY','QUARTERLY','SEMESTER','YEARLY','CUSTOM')),
    start_date timestamptz,
    end_date timestamptz,
    is_closed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_period_type ON ranking.ranking_period(period_type);
CREATE INDEX idx_ranking_period_closed ON ranking.ranking_period(is_closed);

CREATE TABLE ranking.ranking_setting (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key varchar(80) NOT NULL,
    value text,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_ranking_setting_key ON ranking.ranking_setting(key);
CREATE TRIGGER trg_ranking_setting_updated BEFORE UPDATE ON ranking.ranking_setting
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `083_ranking_core.down.sql`**

```sql
DROP TABLE IF EXISTS ranking.ranking_setting;
DROP TABLE IF EXISTS ranking.ranking_period;
DROP TABLE IF EXISTS ranking.ranking_category;
```

- [ ] **Step 3: Verifikasi**

Dari `backend/`:
```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=083_ranking_core.up.sql`; `All migrations applied total=63`.

Kemudian verifikasi via throwaway Go program (pgx, URL dari `backend/config.yaml` `database.url`):
- `SELECT count(*) FROM information_schema.tables WHERE table_schema='ranking';` → **3**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): ranking core - category/period/setting (phase 8)"
```

---

## Task 8B: Leaderboard — leaderboard, leaderboard_entry

**Files:**
- Create: `backend/migrations/084_leaderboard.up.sql`
- Create: `backend/migrations/084_leaderboard.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `ranking.ranking_category`, `ranking.ranking_period`.
- Produces: `ranking.leaderboard`, `ranking.leaderboard_entry`.

- [ ] **Step 1: Tulis `084_leaderboard.up.sql`**

```sql
-- Migration 084: leaderboard & leaderboard entries.

CREATE TABLE ranking.leaderboard (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_code varchar(50) NOT NULL,
    leaderboard_name varchar(200) NOT NULL,
    category_id uuid NOT NULL REFERENCES ranking.ranking_category(id) ON DELETE CASCADE,
    period_id uuid REFERENCES ranking.ranking_period(id) ON DELETE SET NULL,
    scope varchar(20) NOT NULL DEFAULT 'GLOBAL' CHECK (scope IN ('GLOBAL','PROVINCE','CITY','SCHOOL','CLASS','GROUP')),
    province_id uuid,
    city_id uuid,
    school_id uuid,
    class_id uuid,
    subject_id uuid,
    exam_id uuid,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_leaderboard_code ON ranking.leaderboard(leaderboard_code);
CREATE INDEX idx_leaderboard_category ON ranking.leaderboard(category_id);
CREATE INDEX idx_leaderboard_period ON ranking.leaderboard(period_id);
CREATE INDEX idx_leaderboard_active ON ranking.leaderboard(is_active);
CREATE TRIGGER trg_leaderboard_updated BEFORE UPDATE ON ranking.leaderboard
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- Kolom province_id/city_id/school_id/class_id/subject_id/exam_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE ranking.leaderboard_entry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id uuid NOT NULL REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    rank_position int NOT NULL DEFAULT 0,
    score numeric(12,2) NOT NULL DEFAULT 0,
    weighted_score numeric(12,2) NOT NULL DEFAULT 0,
    correct_answer int NOT NULL DEFAULT 0,
    wrong_answer int NOT NULL DEFAULT 0,
    unanswered int NOT NULL DEFAULT 0,
    accuracy numeric(5,2) NOT NULL DEFAULT 0,
    average_score numeric(5,2),
    average_duration int,
    total_exam int NOT NULL DEFAULT 0,
    total_practice int NOT NULL DEFAULT 0,
    total_study_minutes int NOT NULL DEFAULT 0,
    consistency_score numeric(5,2) NOT NULL DEFAULT 0,
    speed_score numeric(5,2) NOT NULL DEFAULT 0,
    achievement_score numeric(5,2) NOT NULL DEFAULT 0,
    streak_score numeric(5,2) NOT NULL DEFAULT 0,
    bonus_score numeric(5,2) NOT NULL DEFAULT 0,
    penalty_score numeric(5,2) NOT NULL DEFAULT 0,
    percentile numeric(5,2),
    previous_rank int,
    rank_change int,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (leaderboard_id, user_id)
);
CREATE INDEX idx_leaderboard_entry_rank ON ranking.leaderboard_entry(leaderboard_id, rank_position);
CREATE INDEX idx_leaderboard_entry_user ON ranking.leaderboard_entry(user_id);
CREATE TRIGGER trg_leaderboard_entry_updated BEFORE UPDATE ON ranking.leaderboard_entry
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `084_leaderboard.down.sql`**

```sql
DROP TABLE IF EXISTS ranking.leaderboard_entry;
DROP TABLE IF EXISTS ranking.leaderboard;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 084; `All migrations applied total=64`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ranking';` → **5**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): leaderboard & entries (phase 8)"
```

---

## Task 8C: Formula & Calculation Job

**Files:**
- Create: `backend/migrations/085_ranking_formula.up.sql`
- Create: `backend/migrations/085_ranking_formula.down.sql`

**Interfaces:**
- Consumes: `ranking.ranking_category`, `ranking.leaderboard`, `ranking.ranking_period`.
- Produces: `ranking.ranking_formula`, `ranking.ranking_calculation_job`.

- [ ] **Step 1: Tulis `085_ranking_formula.up.sql`**

```sql
-- Migration 085: ranking formula & calculation job.

CREATE TABLE ranking.ranking_formula (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    formula_name varchar(120) NOT NULL,
    category_id uuid REFERENCES ranking.ranking_category(id) ON DELETE SET NULL,
    description text,
    accuracy_weight numeric(5,2) NOT NULL DEFAULT 0,
    speed_weight numeric(5,2) NOT NULL DEFAULT 0,
    difficulty_weight numeric(5,2) NOT NULL DEFAULT 0,
    consistency_weight numeric(5,2) NOT NULL DEFAULT 0,
    streak_weight numeric(5,2) NOT NULL DEFAULT 0,
    achievement_weight numeric(5,2) NOT NULL DEFAULT 0,
    bonus_weight numeric(5,2) NOT NULL DEFAULT 0,
    penalty_weight numeric(5,2) NOT NULL DEFAULT 0,
    formula_expression text,
    version int NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_formula_category ON ranking.ranking_formula(category_id);
CREATE INDEX idx_ranking_formula_active ON ranking.ranking_formula(is_active);
CREATE TRIGGER trg_ranking_formula_updated BEFORE UPDATE ON ranking.ranking_formula
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ranking.ranking_calculation_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name varchar(200) NOT NULL,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE SET NULL,
    period_id uuid REFERENCES ranking.ranking_period(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED')),
    total_user int NOT NULL DEFAULT 0,
    processed_user int NOT NULL DEFAULT 0,
    duration_ms int,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_calculation_job_status ON ranking.ranking_calculation_job(status);
CREATE INDEX idx_ranking_calculation_job_leaderboard ON ranking.ranking_calculation_job(leaderboard_id);
CREATE TRIGGER trg_ranking_calculation_job_updated BEFORE UPDATE ON ranking.ranking_calculation_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `085_ranking_formula.down.sql`**

```sql
DROP TABLE IF EXISTS ranking.ranking_calculation_job;
DROP TABLE IF EXISTS ranking.ranking_formula;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 085; `All migrations applied total=65`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ranking';` → **7**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): ranking formula & calculation job (phase 8)"
```

---

## Task 8D: Score & Summary — ranking_score, user_rank_summary

**Files:**
- Create: `backend/migrations/086_ranking_score.up.sql`
- Create: `backend/migrations/086_ranking_score.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `ranking.ranking_category`.
- Produces: `ranking.ranking_score`, `ranking.user_rank_summary`.

- [ ] **Step 1: Tulis `086_ranking_score.up.sql`**

```sql
-- Migration 086: ranking score & user rank summary.

CREATE TABLE ranking.ranking_score (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    category_id uuid REFERENCES ranking.ranking_category(id) ON DELETE SET NULL,
    subject_id uuid,
    exam_session_id uuid,
    score_type varchar(20) NOT NULL CHECK (score_type IN ('EXAM','PRACTICE','HOMEWORK','TRYOUT','DAILY')),
    raw_score numeric(12,2) NOT NULL DEFAULT 0,
    normalized_score numeric(12,2) NOT NULL DEFAULT 0,
    weighted_score numeric(12,2) NOT NULL DEFAULT 0,
    difficulty_factor numeric(5,2) NOT NULL DEFAULT 0,
    speed_factor numeric(5,2) NOT NULL DEFAULT 0,
    accuracy_factor numeric(5,2) NOT NULL DEFAULT 0,
    bonus_factor numeric(5,2) NOT NULL DEFAULT 0,
    penalty_factor numeric(5,2) NOT NULL DEFAULT 0,
    final_score numeric(12,2) NOT NULL DEFAULT 0,
    calculated_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_score_user ON ranking.ranking_score(user_id);
CREATE INDEX idx_ranking_score_category ON ranking.ranking_score(category_id);
CREATE INDEX idx_ranking_score_type ON ranking.ranking_score(score_type);
CREATE INDEX idx_ranking_score_calculated ON ranking.ranking_score(calculated_at);
-- Kolom subject_id/exam_session_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE ranking.user_rank_summary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    global_rank int,
    province_rank int,
    city_rank int,
    school_rank int,
    class_rank int,
    average_rank int,
    best_rank int,
    highest_score numeric(12,2) NOT NULL DEFAULT 0,
    total_leaderboard int NOT NULL DEFAULT 0,
    last_updated timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_user_rank_summary_updated BEFORE UPDATE ON ranking.user_rank_summary
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `086_ranking_score.down.sql`**

```sql
DROP TABLE IF EXISTS ranking.user_rank_summary;
DROP TABLE IF EXISTS ranking.ranking_score;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 086; `All migrations applied total=66`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ranking';` → **9**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): ranking score & user rank summary (phase 8)"
```

---

## Task 8E: Per-Entity Ranking — subject, exam, school, class

**Files:**
- Create: `backend/migrations/087_entity_ranking.up.sql`
- Create: `backend/migrations/087_entity_ranking.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `ranking.leaderboard`.
- Produces: `ranking.subject_ranking`, `ranking.exam_ranking`, `ranking.school_ranking`, `ranking.class_ranking`.

- [ ] **Step 1: Tulis `087_entity_ranking.up.sql`**

```sql
-- Migration 087: per-entity ranking - subject, exam, school, class.

CREATE TABLE ranking.subject_ranking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    subject_id uuid,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    rank_position int NOT NULL DEFAULT 0,
    score numeric(12,2) NOT NULL DEFAULT 0,
    accuracy numeric(5,2) NOT NULL DEFAULT 0,
    speed numeric(5,2) NOT NULL DEFAULT 0,
    exam_count int NOT NULL DEFAULT 0,
    practice_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subject_ranking_user ON ranking.subject_ranking(user_id);
CREATE INDEX idx_subject_ranking_subject ON ranking.subject_ranking(subject_id);
CREATE INDEX idx_subject_ranking_leaderboard ON ranking.subject_ranking(leaderboard_id);

CREATE TABLE ranking.exam_ranking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid,
    exam_session_id uuid,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    rank_position int NOT NULL DEFAULT 0,
    score numeric(12,2) NOT NULL DEFAULT 0,
    correct_answer int NOT NULL DEFAULT 0,
    wrong_answer int NOT NULL DEFAULT 0,
    duration int,
    percentile numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exam_ranking_exam ON ranking.exam_ranking(exam_id);
CREATE INDEX idx_exam_ranking_user ON ranking.exam_ranking(user_id);

CREATE TABLE ranking.school_ranking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    rank_position int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    highest_score numeric(5,2) NOT NULL DEFAULT 0,
    participant_count int NOT NULL DEFAULT 0,
    exam_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_school_ranking_school ON ranking.school_ranking(school_id);
CREATE INDEX idx_school_ranking_leaderboard ON ranking.school_ranking(leaderboard_id);

CREATE TABLE ranking.class_ranking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id uuid,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    rank_position int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    highest_score numeric(5,2) NOT NULL DEFAULT 0,
    participant_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_class_ranking_class ON ranking.class_ranking(class_id);
CREATE INDEX idx_class_ranking_leaderboard ON ranking.class_ranking(leaderboard_id);
```

- [ ] **Step 2: Tulis `087_entity_ranking.down.sql`**

```sql
DROP TABLE IF EXISTS ranking.class_ranking;
DROP TABLE IF EXISTS ranking.school_ranking;
DROP TABLE IF EXISTS ranking.exam_ranking;
DROP TABLE IF EXISTS ranking.subject_ranking;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 087; `All migrations applied total=67`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ranking';` → **13**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): subject/exam/school/class ranking (phase 8)"
```

---

## Task 8F: Region & History — province_ranking, city_ranking, ranking_history

**Files:**
- Create: `backend/migrations/088_region_history.up.sql`
- Create: `backend/migrations/088_region_history.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `ranking.leaderboard`.
- Produces: `ranking.province_ranking`, `ranking.city_ranking`, `ranking.ranking_history`.

- [ ] **Step 1: Tulis `088_region_history.up.sql`**

```sql
-- Migration 088: province/city ranking & ranking history.

CREATE TABLE ranking.province_ranking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id uuid,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    rank_position int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    participant_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_province_ranking_region ON ranking.province_ranking(region_id);
CREATE INDEX idx_province_ranking_leaderboard ON ranking.province_ranking(leaderboard_id);

CREATE TABLE ranking.city_ranking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id uuid,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    rank_position int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    participant_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_city_ranking_region ON ranking.city_ranking(region_id);
CREATE INDEX idx_city_ranking_leaderboard ON ranking.city_ranking(leaderboard_id);

CREATE TABLE ranking.ranking_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE SET NULL,
    old_rank int,
    new_rank int,
    rank_difference int,
    old_score numeric(12,2),
    new_score numeric(12,2),
    changed_reason varchar(200),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_history_user ON ranking.ranking_history(user_id);
CREATE INDEX idx_ranking_history_leaderboard ON ranking.ranking_history(leaderboard_id);
CREATE INDEX idx_ranking_history_time ON ranking.ranking_history(created_at);
```

- [ ] **Step 2: Tulis `088_region_history.down.sql`**

```sql
DROP TABLE IF EXISTS ranking.ranking_history;
DROP TABLE IF EXISTS ranking.city_ranking;
DROP TABLE IF EXISTS ranking.province_ranking;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 088; `All migrations applied total=68`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ranking';` → **16**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): province/city ranking & history (phase 8)"
```

---

## Task 8G: Reward & Badge

**Files:**
- Create: `backend/migrations/089_ranking_reward.up.sql`
- Create: `backend/migrations/089_ranking_reward.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `ranking.leaderboard`.
- Produces: `ranking.ranking_reward`, `ranking.user_ranking_reward`, `ranking.ranking_badge`, `ranking.user_ranking_badge`.

- [ ] **Step 1: Tulis `089_ranking_reward.up.sql`**

```sql
-- Migration 089: ranking reward & badge.

CREATE TABLE ranking.ranking_reward (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id uuid NOT NULL REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    minimum_rank int,
    maximum_rank int,
    reward_type varchar(20) NOT NULL CHECK (reward_type IN ('BADGE','POINT','COIN','CERTIFICATE','MEMBERSHIP','TROPHY')),
    reward_value varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_reward_leaderboard ON ranking.ranking_reward(leaderboard_id);

CREATE TABLE ranking.user_ranking_reward (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    reward_id uuid NOT NULL REFERENCES ranking.ranking_reward(id) ON DELETE CASCADE,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE SET NULL,
    received_at timestamptz NOT NULL DEFAULT NOW(),
    claimed_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CLAIMED','EXPIRED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, reward_id)
);
CREATE INDEX idx_user_ranking_reward_reward ON ranking.user_ranking_reward(reward_id);
CREATE INDEX idx_user_ranking_reward_status ON ranking.user_ranking_reward(status);

CREATE TABLE ranking.ranking_badge (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_code varchar(50) NOT NULL,
    badge_name varchar(120) NOT NULL,
    icon varchar(120),
    color varchar(30),
    description text,
    level varchar(20) NOT NULL DEFAULT 'BRONZE' CHECK (level IN ('BRONZE','SILVER','GOLD','PLATINUM','DIAMOND')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_ranking_badge_code ON ranking.ranking_badge(badge_code);

CREATE TABLE ranking.user_ranking_badge (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    badge_id uuid NOT NULL REFERENCES ranking.ranking_badge(id) ON DELETE CASCADE,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE SET NULL,
    earned_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, badge_id)
);
CREATE INDEX idx_user_ranking_badge_badge ON ranking.user_ranking_badge(badge_id);
```

- [ ] **Step 2: Tulis `089_ranking_reward.down.sql`**

```sql
DROP TABLE IF EXISTS ranking.user_ranking_badge;
DROP TABLE IF EXISTS ranking.ranking_badge;
DROP TABLE IF EXISTS ranking.user_ranking_reward;
DROP TABLE IF EXISTS ranking.ranking_reward;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 089; `All migrations applied total=69`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ranking';` → **20**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): ranking reward & badge (phase 8)"
```

---

## Task 8H: Achievement, Streak, Notification, Statistic

**Files:**
- Create: `backend/migrations/090_ranking_statistic.up.sql`
- Create: `backend/migrations/090_ranking_statistic.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `ranking.leaderboard`.
- Produces: `ranking.ranking_achievement`, `ranking.user_ranking_achievement`, `ranking.ranking_streak`, `ranking.ranking_notification`, `ranking.ranking_statistic`.

- [ ] **Step 1: Tulis `090_ranking_statistic.up.sql`**

```sql
-- Migration 090: achievement, streak, notification, statistic.

CREATE TABLE ranking.ranking_achievement (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    achievement_code varchar(50) NOT NULL,
    achievement_name varchar(120) NOT NULL,
    score_bonus numeric(12,2) NOT NULL DEFAULT 0,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_ranking_achievement_code ON ranking.ranking_achievement(achievement_code);

CREATE TABLE ranking.user_ranking_achievement (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES ranking.ranking_achievement(id) ON DELETE CASCADE,
    earned_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, achievement_id)
);
CREATE INDEX idx_user_ranking_achievement_ach ON ranking.user_ranking_achievement(achievement_id);

CREATE TABLE ranking.ranking_streak (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    current_streak int NOT NULL DEFAULT 0,
    longest_streak int NOT NULL DEFAULT 0,
    total_day int NOT NULL DEFAULT 0,
    last_activity date,
    streak_score numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_ranking_streak_updated BEFORE UPDATE ON ranking.ranking_streak
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ranking.ranking_notification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    leaderboard_id uuid REFERENCES ranking.leaderboard(id) ON DELETE SET NULL,
    notification_type varchar(20) NOT NULL CHECK (notification_type IN ('RANK_UP','RANK_DOWN','NEW_BADGE','NEW_REWARD')),
    title varchar(200),
    message text,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_notification_user ON ranking.ranking_notification(user_id);
CREATE INDEX idx_ranking_notification_read ON ranking.ranking_notification(is_read);

CREATE TABLE ranking.ranking_statistic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id uuid NOT NULL REFERENCES ranking.leaderboard(id) ON DELETE CASCADE,
    participant_count int NOT NULL DEFAULT 0,
    average_score numeric(12,2) NOT NULL DEFAULT 0,
    median_score numeric(12,2) NOT NULL DEFAULT 0,
    highest_score numeric(12,2) NOT NULL DEFAULT 0,
    lowest_score numeric(12,2) NOT NULL DEFAULT 0,
    standard_deviation numeric(12,2) NOT NULL DEFAULT 0,
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ranking_statistic_leaderboard ON ranking.ranking_statistic(leaderboard_id);
```

- [ ] **Step 2: Tulis `090_ranking_statistic.down.sql`**

```sql
DROP TABLE IF EXISTS ranking.ranking_statistic;
DROP TABLE IF EXISTS ranking.ranking_notification;
DROP TABLE IF EXISTS ranking.ranking_streak;
DROP TABLE IF EXISTS ranking.user_ranking_achievement;
DROP TABLE IF EXISTS ranking.ranking_achievement;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 090; `All migrations applied total=70`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ranking';` → **25** ✓ (menyelesaikan domain ranking)

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): achievement/streak/notification/statistic (phase 8) - completes ranking domain (25 tables)"
```

---

## Self-Review

**Spec coverage:** design doc §3 fase 8 (Ranking, 25 tabel) terpenuhi: 8 file migrasi (083–090), 25 tabel sesuai §4.8 katalog. Daftar 1:1 — ranking_category, ranking_period, leaderboard, leaderboard_entry, ranking_score, ranking_formula, ranking_calculation_job, ranking_history, user_rank_summary, subject_ranking, exam_ranking, school_ranking, class_ranking, province_ranking, city_ranking, ranking_reward, user_ranking_reward, ranking_badge, user_ranking_badge, ranking_achievement, user_ranking_achievement, ranking_streak, ranking_notification, ranking_statistic, ranking_setting = 25.

**Placeholder scan:** tidak ada TBD/TODO; SQL lengkap per task; enum & indeks eksplisit.

**Type/name consistency:** konvensi §2 diterapkan (uuid PK, snake_case, timestamps, CHECK enum, indeks FK/komposit/unik, `numeric(12,2)` untuk skor, `numeric(5,2)` untuk persen). Semua kolom referensi lintas-entitas non-user (`subject_id`, `exam_id`, `exam_session_id`, `school_id`, `class_id`, `province_id`, `city_id`, `region_id`) dibuat `uuid` tanpa FK — konsisten dengan §5 (event-driven, TANPA FK yang membuat kunci). Hanya `user_id` yang ber-FK ke `identity.user`. `leaderboard_entry` memakai `UNIQUE (leaderboard_id, user_id)` + indeks `(leaderboard_id, rank_position)` untuk query Top-N.

**Cacat design yang dihindari:** tidak ada dual-schema legacy (`ranking_*` lama sudah dihapus di Phase 0); skor & leaderboard terpisah (raw score → formula → snapshot); history append-only (`ranking_history`, `user_ranking_reward`, `user_ranking_badge`, `user_ranking_achievement` memakai created_at, bukan mutable); tidak ada FK ke cbt/question/content/finance yang menciptakan kunci.

## Execution Handoff

**Plan selesai & tersimpan: `docs/superpowers/plans/2026-08-04-database-rebuild-phase8-ranking.md`. Dua opsi eksekusi:**

1. **Subagent-Driven (recommended)** — dispatch subagent baru per task, review antar task, iterasi cepat.
2. **Inline Execution** — eksekusi tasks di sesi ini dengan checkpoints.

**Pilih yang mana?**
