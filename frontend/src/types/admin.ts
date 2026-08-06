export type UserRole =
    | "SUPER_ADMIN"
    | "STAFF"
    | "FINANCE"
    | "GURU"
    | "SISWA"
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
    created_at: string;
    updated_at: string;
}

export interface GreetingInfo {
    full_name: string;
    greeting: string;
    date: string;
    motivation: string;
}

export interface ActivityItem {
    type: string;
    message: string;
    created_at: string;
}

export interface SiswaDashboard {
    greeting?: GreetingInfo;
    continue_learning?: unknown[];
    today_goal?: { target_materials: number; completed_materials: number; target_questions: number; answered_questions: number; progress_pct: number };
    learning_progress?: unknown[];
    weekly_activity?: unknown[];
    upcoming_exams?: unknown[];
    exam_stats?: unknown;
    recent_activity?: ActivityItem[];
    total_exams_taken?: number;
    average_score?: number;
    global_rank?: number;
    study_hours?: number;
    target_school?: { school_name: string; major_name: string; target_score: number; current_score: number; passing_chance?: number };
    recent_exams?: { id: string; title: string; score: number; date: string; passed: boolean }[];
    streak_days?: number;
    completed_materials_count?: number;
    total_practice_count?: number;
}

export interface GuruDashboard {
    greeting?: GreetingInfo;
    today_schedule?: unknown[];
    quick_actions?: { label: string; icon: string; path: string }[];
    my_classes?: unknown[];
    upcoming_exams?: unknown[];
    student_progress?: unknown[];
    question_bank_stat?: { total: number; draft: number; published: number };
    recent_activity?: ActivityItem[];
    total_questions?: number;
    total_materials?: number;
    total_exams?: number;
    active_exams?: number;
    total_students?: number;
    recent_submissions?: number;
    recent_questions?: { id: string; subject_name: string; content_preview: string; difficulty: string; created_at: string }[];
}

export interface KPIData {
    total_users: number;
    active_today: number;
    total_schools: number;
    total_teachers: number;
    total_students: number;
    total_exams: number;
    total_materials: number;
    total_questions: number;
}

export interface SystemHealth {
    api_status: string;
    db_status: string;
    storage_usage: number;
    uptime_hours: number;
}

export interface ActiveUserStat {
    online_now: number;
    active_24h: number;
}

export interface SchoolStat {
    total: number;
    active: number;
    verified: number;
}

export interface CBTMonitoring {
    scheduled: number;
    running: number;
    finished: number;
}

export interface AdminDashboard {
    kpi: KPIData;
    system_health: SystemHealth;
    active_users: ActiveUserStat;
    school_stats: SchoolStat;
    cbt_monitoring: CBTMonitoring;
    recent_activity: ActivityItem[];
    total_revenue?: number;
    active_subscribers?: number;
    monthly_recurring_revenue?: number;
    recent_payments?: { id: string; user_name: string; plan_name: string; date: string; amount: number; status: string }[];
}

export interface AdminHealthService {
    name: string;
    endpoint?: string;
    status: string;
    latency: string;
    uptime: string;
}

export interface AdminHealth {
    services: AdminHealthService[];
}

export interface LogEntry {
    id: string;
    timestamp: string;
    level: string;
    module: string;
    message: string;
}

export interface PaginatedData<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: { code: string; message: string };
}