// src/services/analytics.service.ts
import { api } from "@/lib/api";

export interface ScoreDistributionBreakdown {
    bracket_700_plus?: number;
    bracket_600_699?: number;
    bracket_500_599?: number;
    bracket_below_500?: number;
}

export interface SubjectPerformanceItem {
    subject_id: string;
    subject_name: string;
    avg_score: number;
    difficulty: string;
    total_questions: number;
}

export interface AdminOverview {
    total_students?: number;
    total_teachers?: number;
    total_exams?: number;
    total_questions?: number;
    total_answers?: number;
    total_participants?: number;
    active_sessions?: number;
    avg_score?: number;
    pass_rate?: number;
    item_fit_index?: number;
    score_distribution?: ScoreDistributionBreakdown;
    subject_performance?: SubjectPerformanceItem[];
    [key: string]: unknown;
}

export interface ExamReport {
    exam_id: string;
    title: string;
    status?: string;
    total_participants?: number;
    total_started?: number;
    total_finished?: number;
    average_score?: number;
    pass_rate?: number;
    [key: string]: unknown;
}

export const analyticsService = {
    async getAdminOverview(): Promise<AdminOverview> {
        return api<AdminOverview>("/analytics/admin/overview");
    },

    async getExamReports(): Promise<ExamReport[]> {
        return api<ExamReport[]>("/analytics/admin/reports/exams");
    },
};