export type ContentType = 'QUESTION' | 'MATERIAL' | 'EXAM' | 'PRACTICE_SET' | 'FLASHCARD';

export type ContentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'ONGOING' | 'COMPLETED';

export interface BaseContent {
    id: string;
    content_type: ContentType;
    grade_id: string;
    subject_id: string;
    chapter_id?: string;
    topic_id?: string;
    lo_id?: string;
    title: string;
    body: string;
    status: ContentStatus;
    created_by: string;
    metadata?: Record<string, any>;
    published_at?: string;
    created_at: string;
    updated_at: string;
}

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY' | 'SHORT_ANSWER';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionOption {
    id: string;
    content_id: string;
    label: string;
    option_text: string;
    is_correct: boolean;
    explanation?: string;
    display_order: number;
}

export interface QuestionSubtype {
    content_id: string;
    question_type: QuestionType;
    difficulty: Difficulty;
    bloom_level?: string;
    thinking_level?: string;
    language: string;
    source: string;
    score: number;
    negative_score?: number;
    estimated_time?: number;
    explanation?: string;
}

export interface QuestionFull extends BaseContent {
    question: QuestionSubtype;
    options: QuestionOption[];
}

export type MaterialFormat = 'TEXT' | 'RICH_TEXT' | 'MARKDOWN' | 'VIDEO' | 'PDF' | 'AUDIO' | 'INTERACTIVE';

export interface MaterialSubtype {
    content_id: string;
    content_format: MaterialFormat;
    estimated_duration?: number;
    read_count: number;
    is_preview: boolean;
    prerequisites?: string[];
}

export interface MaterialFull extends BaseContent {
    material: MaterialSubtype;
}

export interface ExamSubtype {
    content_id: string;
    description: string;
    duration_minutes: number;
    passing_score: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    max_attempts: number;
    start_time?: string;
    end_time?: string;
}

export interface ExamFull extends BaseContent {
    exam: ExamSubtype;
}

export interface ContentListFilter {
    type?: ContentType;
    grade_id?: string;
    subject_id?: string;
    status?: ContentStatus;
    search?: string;
    page?: number;
    limit?: number;
}
