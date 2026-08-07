export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD" | "EXPERT";

export type QuestionType =
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "ESSAY"
    | "MATCHING";

export type QuestionStatus =
    | "DRAFT"
    | "REVIEW"
    | "APPROVED"
    | "PUBLISHED"
    | "ARCHIVED";

export type BloomsLevel = "C1" | "C2" | "C3" | "C4" | "C5" | "C6";

export type ImportFileFormat = "PDF" | "DOCX" | "XLSX" | "CSV";

export type ImportJobStatus =
    | "UPLOADED"
    | "VALIDATING"
    | "PROCESSING"
    | "OCR_AI"
    | "REVIEW"
    | "APPROVED"
    | "IMPORTING"
    | "COMPLETED"
    | "FAILED";

export interface QuestionBlock {
    id?: string;
    block_order: number;
    block_type: "PARAGRAPH" | "IMAGE" | "TABLE" | "LATEX";
    content: string;
    asset_id?: string;
}

export interface QuestionOptionExtended {
    id: string;
    label: string; // 'A', 'B', 'C', 'D', 'E'
    score: number;
    is_correct: boolean;
    content: string;
    explanation?: string;
}

export interface SolutionStep {
    id?: string;
    step_no: number;
    title: string;
    content: string;
}

export interface QuestionMetadata {
    estimated_time_seconds: number;
    difficulty_level: DifficultyLevel;
    blooms_level: BloomsLevel;
    cognitive_level?: string;
    language?: string;
    source_type?: string;
    source_name?: string;
    publication_year?: number;
    reference_code?: string;
    is_hots: boolean;
    is_calculator_allowed: boolean;
    is_randomizable: boolean;
}

export interface IRTStatistics {
    total_answers: number;
    correct_answers: number;
    wrong_answers: number;
    accuracy_percentage: number;
    parameter_a?: number; // Discrimination
    parameter_b?: number; // Difficulty
    parameter_c?: number; // Guessing
}

export interface QuestionClassification {
    level_id?: string;
    level_name: string;
    grade_id?: string;
    grade_name: string;
    subject_id?: string;
    subject_name: string;
    chapter_id?: string;
    chapter_name: string;
    topic_id?: string;
    topic_name: string;
    competency_id?: string;
    competency_name?: string;
    curriculum_name?: string;
}

export interface ExtendedQuestion {
    id: string;
    question_code: string;
    version_no: number;
    status: QuestionStatus;
    content: string;
    blocks: QuestionBlock[];
    options: QuestionOptionExtended[];
    question_type: QuestionType;
    explanation?: string;
    solution_steps?: SolutionStep[];
    hints?: string[];
    classification: QuestionClassification;
    metadata: QuestionMetadata;
    statistics?: IRTStatistics;
    created_by: string;
    author_name?: string;
    created_at: string;
    updated_at: string;
}

export interface ImportJob {
    id: string;
    job_number: string;
    job_name: string;
    source_type: ImportFileFormat;
    status: ImportJobStatus;
    total_rows: number;
    parsed_rows: number;
    error_count: number;
    started_at: string;
    completed_at?: string;
    uploaded_by: string;
}

export interface ParsedQuestionItem {
    id: string;
    question_number: number;
    question_text: string;
    question_type: QuestionType;
    options: { label: string; text: string; is_answer: boolean }[];
    correct_answer: string;
    explanation?: string;
    detected_subject?: string;
    detected_topic?: string;
    difficulty: DifficultyLevel;
    confidence_score: number; // 0.0 - 1.0
    validation_status: "VALID" | "WARNING" | "ERROR";
    validation_messages: string[];
}
