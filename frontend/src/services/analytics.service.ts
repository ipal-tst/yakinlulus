// src/services/analytics.service.ts
import { api } from "@/lib/api";

export interface AdminOverview {
    total_students?: number;
    total_teachers?: number;
    total_exams?: number;
    total_questions?: number;
    active_sessions?: number;
    avg_score?: number;
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