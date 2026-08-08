export type UserRole =
    | "SUPER_ADMIN"
    | "STAFF"
    | "FINANCE"
    | "GURU"
    | "SISWA"
    | "SUPER_SISWA"
    | "INVESTOR";

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    avatar_url?: string;
    grade_id?: string;
    school_name?: string;
    gender?: string;
    phone?: string;
    major?: string;
    education_level?: string;
    grade?: string;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: {
        code: string;
        message: string;
    };
}

export interface PaginatedData<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

// Auth Types
export interface AuthResponse {
    token: string;
    refresh_token?: string;
    user: User;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    email: string;
    password: string;
    full_name: string;
    role?: UserRole;
}

// Academic Master Data
export interface EducationLevel {
    id: string;
    name: string;
    code: string;
    description?: string;
}

export interface Grade {
    id: string;
    level_id: string;
    name: string;
    code: string;
    level?: EducationLevel;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    description?: string;
    icon_url?: string;
}

export interface Chapter {
    id: string;
    subject_id: string;
    name: string;
    order_index: number;
    description?: string;
}

export interface Topic {
    id: string;
    chapter_id: string;
    name: string;
    order_index: number;
}

// Question Bank
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD" | "EXPERT" | "HOTS";
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY" | "TRUE_FALSE";
export type QuestionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface QuestionOption {
    id: string;
    question_id?: string;
    text: string;
    is_correct?: boolean;
    explanation?: string;
}

export interface Question {
    id: string;
    content: string;
    options: QuestionOption[];
    difficulty: DifficultyLevel;
    question_type: QuestionType;
    status: QuestionStatus;
    source?: string;
    explanation?: string;
    image_url?: string;
    subject_id?: string;
    grade_id?: string;
    chapter_id?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface QuestionItem {
    id: string;
    subject_name?: string;
    difficulty?: DifficultyLevel | string;
    content: string;
    code?: string;
    grade_level?: string;
    image_url?: string;
    image_urls?: string[];
    options?: QuestionOption[];
    score?: number;
    status?: QuestionStatus;
    created_at?: string;
    author_id?: string;
}

// Material / Content
export interface Material {
    id: string;
    content_id?: string;
    title: string;
    body?: string;
    content?: string;
    subject_name?: string;
    subject_id?: string;
    grade_id?: string;
    chapter_id?: string;
    topic_id?: string;
    category?: string;
    content_format?: "TEXT" | "MARKDOWN" | "PDF" | "VIDEO";
    estimated_duration?: number;
    reading_time_minutes?: number;
    read_count?: number;
    is_preview?: boolean;
    video_url?: string;
    pdf_url?: string;
    description?: string;
    is_completed?: boolean;
    progress?: number;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    created_at?: string;
    updated_at?: string;
}

export interface LearningProgress {
    material_id: string;
    progress: number; // 0 - 100
    completed: boolean;
    last_position?: number;
}

// CBT / Exams
export type ExamCategory =
    | "UTBK_SNBT"
    | "UM_PTN"
    | "TRYOUT_NASIONAL"
    | "PTS_UAS"
    | "UJIAN_HARIAN"
    | "UJIAN_BAB";

export type ScoringSystem = "IRT" | "STANDARD_POINTS" | "NEGATIVE_MARKING";

export interface ExamSubtestRule {
    id: string;
    subtest_name: string;
    subject_id?: string;
    duration_minutes: number;
    pool_question_ids: string[];
    sample_question_count: number;
    shuffle_questions?: boolean;
    shuffle_options?: boolean;
}

export interface Exam {
    id: string;
    title: string;
    description?: string;
    category?: ExamCategory;
    scoring_system?: ScoringSystem;
    subject_id?: string;
    subject_name?: string;
    chapter_id?: string;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | "HOTS";
    default_mode?: "SANTAI" | "SIMULASI";
    duration_minutes: number;
    total_questions: number;
    passing_score?: number;
    is_active?: boolean;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    grade_level?: string;
    subtests?: ExamSubtestRule[];
    start_time?: string;
    end_time?: string;
    created_at: string;
}

export interface CBTSession {
    session_id: string;
    exam_id: string;
    duration_minutes: number;
    questions: Question[];
    answers: Record<string, string>;
    started_at: string;
}

export interface ExamResult {
    exam_id: string;
    exam_title: string;
    total_score: number;
    passed: boolean;
    ranking_position: number;
    total_participants: number;
    subtest_scores: {
        name: string;
        score: number;
        total_questions: number;
        correct_answers: number;
    }[];
}

export interface ExamAttempt {
    id: string;
    exam_id: string;
    user_id: string;
    status: "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "EXPIRED";
    score?: number;
    started_at: string;
    finished_at?: string;
}

export interface StudentAnswer {
    question_id: string;
    selected_option_ids: string[];
    essay_answer?: string;
    is_flagged?: boolean;
    time_spent_seconds?: number;
}

export interface PracticeSession {
    id: string;
    subject_id?: string;
    chapter_id?: string;
    total_questions: number;
    correct_count: number;
    status: "IN_PROGRESS" | "COMPLETED";
    created_at: string;
}

// Dashboards
export interface SiswaDashboard {
    greeting?: string;
    xp?: number;
    streak_days?: number;
    completed_materials_count?: number;
    total_practice_count?: number;
    total_exams_taken?: number;
    average_score?: number;
    global_rank?: number;
    study_hours?: number;
    target_school?: any;
    continue_learning?: Material[];
    upcoming_exams?: Exam[];
    recent_exams?: any[];
    leaderboard_rank?: number;
}

export interface GuruDashboard {
    total_questions?: number;
    total_materials?: number;
    total_exams?: number;
    active_exams?: number;
    total_students?: number;
    recent_submissions?: number;
    recent_questions?: any[];
}

export interface FinanceDashboard {
    mrr?: number;
    arr?: number;
    monthly_recurring_revenue?: number;
    total_revenue?: number;
    active_subscribers?: number;
    growth_rate?: number;
    recent_payments?: any[];
}

export interface InvestorDashboard {
    mrr?: number;
    arr?: number;
    active_users?: number;
    paying_users?: number;
    retention_rate?: number;
    churn_rate?: number;
}

// Ranking & Target
export interface RankingItem {
    rank: number;
    user_name: string;
    school_name: string;
    score: number;
    avatar_url?: string;
}

export interface TargetSchool {
    id?: string;
    school_name: string;
    major_name: string;
    target_score: number;
    chance_percentage?: number;
}

// Notification
export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
    is_read: boolean;
    created_at: string;
}
