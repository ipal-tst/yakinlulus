/**
 * Exam types — YakinLulus.id
 * CBT Exam, Tryout, Multi-subject
 */

export type ExamType = 'STANDARD' | 'TRYOUT' | 'PRACTICE' | 'DIAGNOSTIC' | 'CUSTOM_MIXED';
export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
export type ExamSessionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'EXPIRED' | 'TERMINATED';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  type: ExamType;
  status: ExamStatus;
  subject_id?: string;
  grade_id?: string;
  duration_minutes: number;
  total_questions: number;
  total_points: number;
  passing_score?: number;
  start_at?: string;
  end_at?: string;
  created_at: string;
  updated_at: string;
  question_count?: number;
  participant_count?: number;
  tags?: string[];
}

export interface ExamQuestion {
  id: string;
  order: number;
  question_id: string;
  content: string;
  stimulus?: string;
  options: ExamOption[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  topic_id?: string;
  user_selected_option_id?: string;
  is_correct?: boolean;
  time_spent_ms?: number;
}

export interface ExamOption {
  id: string;
  label: string;
  content: string;
  is_correct: boolean;
}

export interface ExamSession {
  id: string;
  exam_id: string;
  user_id: string;
  status: ExamSessionStatus;
  started_at: string;
  expires_at: string;
  completed_at?: string;
  current_question_index: number;
  total_questions: number;
  answered_count: number;
  time_remaining_seconds: number;
  score?: number;
  passing_grade?: boolean;
  questions?: ExamQuestion[];
  answers?: ExamAnswer[];
  violations?: ExamViolation[];
}

export interface ExamAnswer {
  question_id: string;
  selected_option_id: string;
  answered_at: string;
  time_spent_ms: number;
  is_correct?: boolean;
  points_earned?: number;
}

export interface ExamViolation {
  type: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'COPY_PASTE' | 'DEVTOOLS';
  timestamp: string;
  count: number;
}

export interface ExamBlueprint {
  id: string;
  exam_id: string;
  subject_id: string;
  subject_name: string;
  question_count: number;
  easy_count: number;
  medium_count: number;
  hard_count: number;
  total_points: number;
}

export interface SubjectBreakdown {
  subject_id: string;
  subject_name: string;
  total_questions: number;
  answered: number;
  correct: number;
  accuracy: number;
  score: number;
  max_score: number;
  time_spent_seconds: number;
}

export interface ExamResult {
  session_id: string;
  exam_id: string;
  exam_title: string;
  user_id: string;
  total_score: number;
  max_score: number;
  accuracy: number;
  passing_grade: boolean;
  rank?: number;
  percentile?: number;
  duration_seconds: number;
  completed_at: string;
  subject_breakdown: SubjectBreakdown[];
}

export interface ExamAnalytics {
  exam_id: string;
  total_attempts: number;
  completed_attempts: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  average_duration_minutes: number;
  question_difficulty_distribution: QuestionDifficultyStat[];
  subject_performance: SubjectPerformanceStat[];
}

export interface QuestionDifficultyStat {
  question_id: string;
  correct_rate: number;
  average_time_seconds: number;
  skip_rate: number;
}

export interface SubjectPerformanceStat {
  subject_id: string;
  subject_name: string;
  average_score: number;
  pass_rate: number;
}

export interface StartExamRequest {
  exam_id: string;
  tag?: string;
  blueprints?: { subject_id: string; count: number }[];
}

export interface ExamPackage {
  id: string;
  code: string;
  name: string;
  education_level: "SD" | "SMP" | "SMA" | "UNIVERSITY";
  grade_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackageExam {
  exam_content_id: string;
  subject_id: string;
  subject_name: string;
  display_order: number;
}

export interface RankingRow {
  rank: number;
  user_id: string;
  full_name: string;
  school_name: string;
  subject_scores: Record<string, number>;
  total: number;
  average: number;
}
