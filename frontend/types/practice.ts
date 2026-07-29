/**
 * Practice types — YakinLulus.id
 * Adaptive practice engine — material/subject/tag-based modes
 */

export type PracticeMode = 'MATERIAL' | 'SUBJECT' | 'TAG_BASED' | 'CUSTOM_MIXED';

export type PracticeStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'EXPIRED';

export interface PracticeSession {
  id: string;
  user_id: string;
  mode: PracticeMode;
  status: PracticeStatus;
  subject_id?: string;
  material_id?: string;
  tag?: string;
  question_count: number;
  answered_count: number;
  correct_count: number;
  score?: number;
  started_at: string;
  completed_at?: string;
  duration_seconds: number;
  questions?: PracticeQuestion[];
  answers?: PracticeAnswer[];
}

export interface PracticeQuestion {
  id: string;
  question_id: string;
  order: number;
  content: string;
  options: PracticeOption[];
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  user_answer?: string;
  is_correct?: boolean;
  time_spent_ms?: number;
}

export interface PracticeOption {
  id: string;
  label: string;
  content: string;
  is_correct: boolean;
}

export interface PracticeAnswer {
  question_id: string;
  selected_option_id: string;
  answered_at: string;
  time_spent_ms: number;
  is_correct: boolean;
}

export interface PracticeStats {
  total_sessions: number;
  total_questions_answered: number;
  average_accuracy: number;
  average_score: number;
  total_study_time_seconds: number;
  sessions_this_week: number;
  streak_days: number;
  strong_subjects: SubjectPerformance[];
  weak_subjects: SubjectPerformance[];
  recent_sessions: PracticeSession[];
}

export interface SubjectPerformance {
  subject_id: string;
  subject_name: string;
  accuracy: number;
  questions_answered: number;
  average_score: number;
}

export interface StartPracticeRequest {
  mode: PracticeMode;
  subject_id?: string;
  grade_id?: string;
  material_id?: string;
  tag?: string;
  question_count?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  topic_ids?: string[];
}

export interface SubmitPracticeRequest {
  session_id: string;
  answers: PracticeAnswer[];
}
