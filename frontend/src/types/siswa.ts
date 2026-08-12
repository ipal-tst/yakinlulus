export type EducationLevelCode = "SD" | "SMP" | "SMA" | "UNIVERSITY" | "GapYear";

import { LearnSubject } from "@/types";

export type ProgressStatus = "GREEN" | "AMBER" | "GREY";
export type MasteryStatus = "MASTERED" | "GUARD" | "WEAK";
export type VerdictStatus = "PASSED" | "BELOW" | "PENDING" | "SAFE" | "NEAR" | "CRITICAL";

// ---------------------------------------------------------------------------
// Dashboard — GET /dashboard/student (existing) + [KONTRAK BARU] widgets
// ---------------------------------------------------------------------------

export interface DashboardGreeting {
    full_name: string;
    greeting: string;
    date: string;
    motivation: string;
}

export interface DashboardContinueLearning {
    material_id: string;
    title: string;
    subject_name: string;
    progress: number;
    remaining_minutes: number;
}

export interface DashboardTodayGoal {
    target_materials: number;
    completed_materials: number;
    target_questions: number;
    answered_questions: number;
    progress_pct: number;
}

export interface DashboardLearningProgress {
    subject_id: string;
    subject_name: string;
    total_materials: number;
    completed_materials: number;
    progress_pct: number;
}

export interface DashboardWeeklyActivity {
    date: string;
    materials: number;
    questions: number;
    minutes: number;
}

export interface DashboardUpcomingExam {
    exam_id: string;
    title: string;
    subject_name: string;
    scheduled_date: string;
    duration_minutes: number;
    status: string;
}

export interface DashboardExamStats {
    total_completed: number;
    average_score: number;
    highest_score: number;
    national_rank: number;
}

export interface DashboardRecentActivity {
    type: "exam" | "material" | "practice";
    message: string;
    created_at: string;
}

export interface DashboardStudent {
    greeting?: DashboardGreeting;
    continue_learning?: DashboardContinueLearning;
    today_goal?: DashboardTodayGoal;
    learning_progress?: DashboardLearningProgress[];
    weekly_activity?: DashboardWeeklyActivity[];
    upcoming_exams?: DashboardUpcomingExam[];
    exam_stats?: DashboardExamStats;
    recent_activity?: DashboardRecentActivity[];
    total_exams_taken?: number;
    average_score?: number;
    global_rank?: number;
    study_hours?: number;
    streak_days?: number;
    completed_materials_count?: number;
    total_practice_count?: number;
}

// [KONTRAK BARU] GET /dashboard/student/target
export interface StudentTargetComparison {
    has_target: boolean;
    school_name: string;
    major: string;
    academic_year?: string;
    seat_quota?: number;
    passing_score_lowest: number;
    student_score: number;
    score_gap: number;
    chance_pct: number;
    verdict: VerdictStatus;
}

// [KONTRAK BARU] GET /dashboard/student/subject-mastery
export interface SubjectMasteryItem {
    subject_id: string;
    subject_name: string;
    total_questions: number;
    correct_count: number;
    accuracy_pct: number;
    level: "strong" | "weak";
}

export interface SubjectMasteryResponse {
    config: { strong_threshold: number };
    subjects: SubjectMasteryItem[];
}

// [KONTRAK BARU] GET /dashboard/student/subject-progress
export interface SubjectProgressItem {
    subject_id: string;
    subject_name: string;
    correct_target: number;
    correct_count: number;
    progress_pct: number;
}

export interface SubjectProgressResponse {
    config: { correct_target: number };
    subjects: SubjectProgressItem[];
}

// [KONTRAK BARU] GET /dashboard/student/weekly-exam
export interface WeeklyExam {
    exam_id: string;
    title: string;
    subject_name: string;
    scheduled_start: string;
    scheduled_end: string;
    duration_minutes: number;
    total_questions: number;
    is_ranking_basis: boolean;
}

// [KONTRAK BARU] GET /dashboard/student/streak
export interface StudentStreak {
    current_streak: number;
    longest_streak: number;
}

// [KONTRAK BARU] GET /config/student-dashboard
export interface StudentDashboardConfig {
    strong_subject_threshold: number;
    correct_progress_target: number;
    chapter_correct_target: number;
    practice_master_threshold: number;
    subject_master_rule: "ALL" | "MAJORITY";
    color_bands: { min: number; max: number; label: string }[];
}

export const DEFAULT_DASHBOARD_CONFIG: StudentDashboardConfig = {
    strong_subject_threshold: 70,
    correct_progress_target: 50,
    chapter_correct_target: 50,
    practice_master_threshold: 85,
    subject_master_rule: "ALL",
    color_bands: [
        { min: 0, max: 70, label: "CRITICAL" },
        { min: 70.1, max: 95, label: "GUARD" },
        { min: 95.1, max: 100, label: "SAFE" },
    ],
};

// ---------------------------------------------------------------------------
// Belajar — /materials/catalog etc ([KONTRAK BARU])
// ---------------------------------------------------------------------------

export interface LearnExtra {
    kind: "TIPS" | "VIDEO" | "AUDIO";
    title: string;
    media_url?: string;
    synopsis?: string;
    duration_seconds?: number;
    link?: string;
}

export interface LearnCatalog {
    subjects: LearnSubject[];
    extras: LearnExtra[];
}

// ---------------------------------------------------------------------------
// Latihan — /practice (hierarki + runner) [KONTRAK BARU]
// ---------------------------------------------------------------------------

export type PracticeScopeLevel = "SUBJECT" | "CHAPTER" | "TOPIC";

export interface PracticeScope {
    level: PracticeScopeLevel;
    subject_id?: string;
    subject_name?: string;
    chapter_id?: string;
    chapter_title?: string;
    topic_id?: string;
    topic_title?: string;
}

export interface PracticeTreeNode {
    progress_pct: number;
    status: ProgressStatus;
}

export interface PracticeTopicNode extends PracticeTreeNode {
    topic_id: string;
    title: string;
    question_count: number;
}

export interface PracticeChapterNode extends PracticeTreeNode {
    chapter_id: string;
    title: string;
    topics: PracticeTopicNode[];
}

export interface PracticeSubjectNode extends PracticeTreeNode {
    subject_id: string;
    subject_name: string;
    icon: string;
    color: string;
    chapters: PracticeChapterNode[];
}

export interface PracticeCatalog {
    config: { threshold: number };
    subjects: PracticeSubjectNode[];
}

export interface PracticeOption {
    id: string;
    key: string;
    content: string;
}

export interface PracticeRunnerQuestion {
    question_id: string;
    content: string;
    options: PracticeOption[];
}

export interface PracticeSessionDetail {
    session_id: string;
    scope: PracticeScope;
    questions: PracticeRunnerQuestion[];
}

export interface PracticeSubmitResult {
    session_id: string;
    scope: PracticeScope;
    total: number;
    correct: number;
    wrong: number;
    unanswered: number;
    accuracy_pct: number;
    duration_seconds: number;
    passed: boolean;
}

export interface PracticeReviewQuestion {
    number: number;
    content: string;
    options: { key: string; text: string; is_correct: boolean }[];
    selected_key?: string;
    is_correct: boolean;
    explanation: string;
}

export interface PracticeReview {
    session_id: string;
    scope: PracticeScope;
    questions: PracticeReviewQuestion[];
}

export interface PracticeHistoryItem {
    session_id: string;
    scope: PracticeScope;
    accuracy_pct: number;
    duration_seconds: number;
    correct: number;
    total: number;
    created_at: string;
}

// ---------------------------------------------------------------------------
// Ujian — paket ujian /exams ([KONTRAK BARU] extend)
// ---------------------------------------------------------------------------

export type ExamPackageMode = "SINGLE" | "PER_SUBTEST";

export interface ExamPackageWithMeta {
    id: string;
    code: string;
    name: string;
    education_level: string;
    grade_id?: string | null;
    category?: string;
    max_attempts?: number;
    attempts_used?: number;
    subjects_count?: number;
    total_questions?: number;
    duration_minutes?: number;
    status?: string;
    last_score?: number;
    is_active?: boolean;
}

export interface ExamSummary {
    last_score: { package_name: string; score: number; passing_score: number; above_passing: boolean };
    avg_score: number;
    total_taken: number;
}

export interface ExamPackageSubtest {
    exam_content_id: string;
    subject_name: string;
    display_order: number;
}

export interface ExamPackageDetail extends ExamPackageWithMeta {
    subjects: ExamPackageSubtest[];
    package_mode: ExamPackageMode;
    passing_score?: number;
}

// ---------------------------------------------------------------------------
// Hasil & Analisis — /results ([KONTRAK BARU] /results/analytics)
// ---------------------------------------------------------------------------

export interface RecommendationItem {
    topic_id: string;
    name: string;
    reason: string;
    action: string;
}

export interface WeakestTopic {
    topic_id: string;
    name: string;
    accuracy: number;
}

export interface ResultsSubjectAnalytics {
    subject_id: string;
    subject_name: string;
    status: MasteryStatus;
    accuracy_pct_ujian: number;
    accuracy_pct_latihan: number;
    material_pct: number;
    exam_avg: number;
    exam_count: number;
    weakest_topic?: WeakestTopic;
    recommended: RecommendationItem[];
}

export interface ResultsAnalytics {
    summary: {
        accuracy_total: number;
        mastered_count: number;
        subject_total: number;
        material_completed: number;
        material_total: number;
        exam_taken: number;
    };
    subjects: ResultsSubjectAnalytics[];
}

// ---------------------------------------------------------------------------
// Peringkat — /leaderboard ([KONTRAK BARU] aggregate + me)
// ---------------------------------------------------------------------------

export interface RankingRow {
    rank: number;
    user_id: string;
    full_name: string;
    school_name: string;
    subject_scores: Record<string, number>;
    total: number;
    average: number;
}

export type LeaderboardMode = "BEST" | "AVERAGE";

export interface MyRankSummary {
    rank: number;
    total_siswa: number;
    delta_rank?: number;
}

// ---------------------------------------------------------------------------
// Target Sekolah — /targets ([KONTRAK BARU] extend katalog + DELETE)
// ---------------------------------------------------------------------------

export interface StudentTargetSchool {
    id: string;
    name: string;
    level: string;
    province?: string;
    city?: string;
    district?: string;
    min_score?: number;
    max_score?: number;
    max_total_score?: number;
    subjects: string[];
    academic_year?: string;
}

export interface TargetCatalogEntry {
    school_id: string;
    name: string;
    level: string;
    province?: string;
    city?: string;
    min_score?: number;
    max_score?: number;
    max_total_score?: number;
    academic_year?: string;
    subjects: string[];
    student_score?: number;
    has_score_data: boolean;
    gap?: number;
    chance_pct?: number;
    status: VerdictStatus;
}

export interface EnrichedTarget {
    id: string;
    choice: 1 | 2;
    target_type?: string;
    target_school_id?: string | null;
    school_name: string;
    major?: string | null;
    passing_score_irt?: number;
    min_score?: number;
    max_score?: number;
    max_total_score?: number;
    subjects: string[];
    student_score?: number;
    progress_pct: number;
    has_score_data: boolean;
    threshold_state: VerdictStatus;
}

export interface SaveTargetPayload {
    targets: { choice: 1 | 2; target_school_id?: string; school_name: string; major?: string; passing_score_irt?: number }[];
}

// ---------------------------------------------------------------------------
// Membership — /membership ([KONTRAK BARU] namespace siswa)
// ---------------------------------------------------------------------------

export type MembershipLevel = "basic" | "premium" | "pro" | "enterprise";
export type MembershipStatus = "ACTIVE" | "TRIAL" | "INACTIVE" | "EXPIRED" | "CANCELLED";

export interface MembershipFeature {
    name: string;
    is_unlimited?: boolean;
    value?: number;
}

export interface MembershipPlan {
    id: string;
    name: string;
    level: MembershipLevel;
    package_type?: string;
    price: number;
    discount_price?: number;
    duration_days: number;
    features: MembershipFeature[];
    is_featured?: boolean;
    is_active?: boolean;
    sort_order: number;
}

export interface MyMembership {
    has_membership: boolean;
    plan?: {
        id: string;
        name: string;
        level: MembershipLevel;
        price: number;
        duration_days: number;
        features: MembershipFeature[];
    };
    status: MembershipStatus;
    active_from?: string;
    expired_at?: string;
    remaining_day?: number;
    auto_renew?: boolean;
    is_trial?: boolean;
    limits_used: { feature_name: string; used?: number; max?: number }[];
}

export interface MembershipOrder {
    invoice_id: string;
    invoice_number: string;
    subtotal: number;
    discount: number;
    total: number;
    status: "UNPAID" | "PENDING" | "PAID";
    payment_methods: string[];
}

export interface MembershipOrderHistory {
    invoice_number: string;
    plan_name: string;
    total: number;
    status: string;
    issued_at: string;
    paid_at?: string;
}

// ---------------------------------------------------------------------------
// Utils helpers
// ---------------------------------------------------------------------------

export type ColorBand = "red" | "amber" | "green" | "grey";

export function bandForPct(pct: number, threshold: number): ProgressStatus {
    if (pct >= threshold) return "GREEN";
    if (pct > 0) return "AMBER";
    return "GREY";
}

export function masteryForPct(pct: number, strongThreshold: number): MasteryStatus {
    if (pct >= strongThreshold) return "MASTERED";
    if (pct > 0) return "GUARD";
    return "WEAK";
}

export function chanceBand(pct: number): ColorBand {
    if (pct <= 70) return "red";
    if (pct <= 95) return "amber";
    return "green";
}

export function formatIDR(value: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}