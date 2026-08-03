-- Down migration recreates the full gamification schema (data loss is NOT recoverable)
CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_levels (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    current_xp INTEGER NOT NULL DEFAULT 0,
    total_xp_earned INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    category VARCHAR(30) NOT NULL,
    requirement TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_badges (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE user_streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO badges (code, name, description, category, xp_reward) VALUES
('first_exam', 'Pertama Ujian', 'Selesaikan ujian pertama', 'achievement', 50),
('streak_7', 'Rajin 7 Hari', 'Belajar 7 hari berturut-turut', 'milestone', 100),
('streak_30', 'Rajin Sebulan', 'Belajar 30 hari berturut-turut', 'milestone', 500),
('perfect_score', 'Sempurna', 'Dapat nilai 100 dalam ujian', 'achievement', 200),
('top_10', 'Top 10', 'Masuk 10 besar leaderboard', 'achievement', 100),
('ten_exams', 'Veteran Ujian', 'Selesaikan 10 ujian', 'milestone', 150),
('social_butterfly', 'Sosialita', 'Ikuti 5 try out nasional', 'special', 75),
('night_owl', 'Burung Hantu', 'Belajar di atas jam 10 malam', 'special', 30);
