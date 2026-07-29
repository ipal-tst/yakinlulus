/**
 * Dashboard types — YakinLulus.id
 * Shared shape for Student/Teacher/Admin/Staff dashboards
 */

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'list' | 'progress';
  value?: number | string;
  data?: any[];
  meta?: Record<string, any>;
}

export interface StudentDashboard {
  user_id: string;
  greeting: string;
  level: number;
  current_xp: number;
  next_level_xp: number;
  streak_days: number;
  active_courses: number;
  pending_exams: number;
  completed_exams: number;
  average_score: number;
  recent_exams: RecentExam[];
  recent_materials: RecentMaterial[];
  upcoming_events: UpcomingEvent[];
  xp_progress: number;
  leaderboard_rank?: number;
}

export interface TeacherDashboard {
  user_id: string;
  total_students: number;
  active_courses: number;
  total_questions: number;
  total_exams: number;
  exams_in_progress: number;
  average_class_score: number;
  recent_submissions: RecentSubmission[];
  pending_grading: number;
  student_activity: StudentActivity[];
  question_stats: QuestionStat[];
}

export interface AdminDashboard {
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_schools: number;
  total_exams: number;
  active_sessions: number;
  total_questions: number;
  total_materials: number;
  monthly_revenue: number;
  subscriptions: SubscriptionStats;
  system_health: SystemHealth;
  recent_activities: RecentActivity[];
}

export interface StaffDashboard {
  total_users: number;
  active_sessions: number;
  exams_in_progress: number;
  pending_reviews: number;
  reports_generated_today: number;
  recent_activities: RecentActivity[];
  academic_stats: AcademicStats;
}

export interface RecentExam {
  id: string;
  title: string;
  subject?: string;
  score?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'IN_PROGRESS';
  completed_at?: string;
  scheduled_at?: string;
}

export interface RecentMaterial {
  id: string;
  title: string;
  subject: string;
  progress_percent: number;
  last_accessed?: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  type: 'exam' | 'live_class' | 'deadline';
  scheduled_at: string;
}

export interface RecentSubmission {
  id: string;
  student_name: string;
  exam_title: string;
  score: number;
  submitted_at: string;
}

export interface StudentActivity {
  student_id: string;
  student_name: string;
  last_active: string;
  questions_answered: number;
  accuracy: number;
}

export interface QuestionStat {
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  total: number;
  average_correct_rate: number;
}

export interface SubscriptionStats {
  total_active: number;
  mrr: number;
  new_this_month: number;
  churned_this_month: number;
}

export interface SystemHealth {
  api_status: 'healthy' | 'degraded' | 'down';
  database_status: 'healthy' | 'degraded' | 'down';
  websocket_connections: number;
  cache_hit_rate: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  actor: string;
  timestamp: string;
}

export interface AcademicStats {
  total_levels: number;
  total_subjects: number;
  total_chapters: number;
  total_topics: number;
}
