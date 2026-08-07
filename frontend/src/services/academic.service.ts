import { api } from "@/lib/api";
import {
    Material,
    Exam,
    CBTSession,
    ExamResult,
    RankingItem,
    TargetSchool,
    PaginatedData,
} from "@/types";

export const academicService = {
    // Materials
    async getMaterials(params?: { subject_id?: string; category?: string }): Promise<Material[]> {
        return api<Material[]>("/academic/materials", { params });
    },

    async getMaterialById(id: string): Promise<Material> {
        return api<Material>(`/academic/materials/${id}`);
    },

    // Exams / Tryouts
    async getExams(params?: { type?: string }): Promise<Exam[]> {
        return api<Exam[]>("/academic/exams", { params });
    },

    async getExamById(id: string): Promise<Exam> {
        return api<Exam>(`/academic/exams/${id}`);
    },

    // CBT Engine Sessions
    async startCBTSession(exam_id: string): Promise<CBTSession> {
        return api<CBTSession>("/cbt/sessions", {
            method: "POST",
            body: { exam_id },
        });
    },

    async getCBTSession(session_id: string): Promise<CBTSession> {
        return api<CBTSession>(`/cbt/sessions/${session_id}`);
    },

    async saveCBTAnswer(
        session_id: string,
        question_id: string,
        selected_option: string,
        is_flagged?: boolean
    ): Promise<{ message: string }> {
        return api<{ message: string }>(`/cbt/sessions/${session_id}/answers`, {
            method: "POST",
            body: { question_id, selected_option, is_flagged },
        });
    },

    async finishCBTSession(session_id: string): Promise<ExamResult> {
        return api<ExamResult>(`/cbt/sessions/${session_id}/finish`, {
            method: "POST",
        });
    },

    async getExamResult(exam_id: string): Promise<ExamResult> {
        return api<ExamResult>(`/academic/exams/${exam_id}/result`);
    },

    // Ranking / Leaderboard
    async getRankings(exam_id?: string): Promise<RankingItem[]> {
        return api<RankingItem[]>("/ranking", {
            params: { exam_id },
        });
    },

    // Target PTN
    async getTargetSchool(): Promise<TargetSchool | null> {
        return api<TargetSchool>("/academic/targets");
    },

    async saveTargetSchool(payload: { school_name: string; major_name: string; target_score: number }): Promise<TargetSchool> {
        return api<TargetSchool>("/academic/targets", {
            method: "POST",
            body: payload,
        });
    },
};
