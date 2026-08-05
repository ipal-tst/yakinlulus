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
