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

function normalizeExam(e: any): Exam {
    if (!e || typeof e !== "object") return e;
    
    const content = e.Content || e;
    const examData = e.Exam || e;
    const bp = (typeof examData.blueprint === "object" && examData.blueprint !== null)
        ? examData.blueprint
        : ((typeof examData.Blueprint === "object" && examData.Blueprint !== null)
            ? examData.Blueprint
            : ((typeof e.blueprint === "object" && e.blueprint !== null) ? e.blueprint : {}));

    const subtestsList = Array.isArray(e.subtests) && e.subtests.length > 0 
        ? e.subtests 
        : (Array.isArray(bp.subtests) ? bp.subtests : (Array.isArray(examData.subtests) ? examData.subtests : []));
    
    let calcQuestions = e.total_questions ?? bp.total_questions ?? examData.total_questions;
    if ((calcQuestions === undefined || calcQuestions === null || calcQuestions === 0) && subtestsList.length > 0) {
        calcQuestions = subtestsList.reduce((sum: number, st: any) => sum + Number(st.sample_question_count || (st.pool_question_ids?.length || 0)), 0);
    }

    return {
        ...e,
        id: content.id || content.ID || e.id,
        title: content.title || content.Title || e.title || "Ujian Simulasi",
        description: content.body || content.Body || examData.description || examData.Description || e.description || "",
        status: content.status || content.Status || e.status || "DRAFT",
        created_at: content.created_at || content.CreatedAt || e.created_at,
        updated_at: content.updated_at || content.UpdatedAt || e.updated_at,
        duration_minutes: examData.duration_minutes || examData.DurationMinutes || e.duration_minutes || 120,
        passing_score: examData.passing_score || examData.PassingScore || e.passing_score || 0,
        category: e.category || bp.category || examData.category || "UTBK_SNBT",
        scoring_system: e.scoring_system || bp.scoring_system || examData.scoring_system || ((e.category || bp.category) === "UJIAN_HARIAN" || (e.category || bp.category) === "PTS_UAS" ? "STANDARD_POINTS" : "IRT"),
        grade_level: e.grade_level || bp.grade_level || examData.grade_level || "12 SMA / UTBK",
        difficulty: e.difficulty || bp.difficulty || examData.difficulty || "MEDIUM",
        default_mode: e.default_mode || bp.default_mode || examData.default_mode || "SIMULASI",
        total_questions: Number(calcQuestions) || 0,
        subtests: subtestsList,
        blueprint: bp,
    };
}

export const academicService = {
    // Materials
    async getMaterials(params?: { subject_id?: string; category?: string }): Promise<Material[]> {
        return api<Material[]>("/materials", { params });
    },

    async getMaterialById(id: string): Promise<Material> {
        return api<Material>(`/materials/${id}`);
    },

    async createMaterial(payload: Partial<Material>): Promise<Material> {
        return api<Material>("/materials", {
            method: "POST",
            body: payload,
        });
    },

    async updateMaterial(id: string, payload: Partial<Material>): Promise<Material> {
        return api<Material>(`/materials/${id}`, {
            method: "PUT",
            body: payload,
        });
    },

    async deleteMaterial(id: string): Promise<{ success: boolean }> {
        return api<{ success: boolean }>(`/materials/${id}`, {
            method: "DELETE",
        });
    },

    async saveMaterialProgress(material_id: string, progress: number): Promise<{ progress: number; completed: boolean }> {
        return api<{ progress: number; completed: boolean }>(`/materials/${material_id}/progress`, {
            method: "POST",
            body: { progress },
        });
    },

    async getMaterialProgress(material_id: string): Promise<{ progress: number; completed: boolean }> {
        return api<{ progress: number; completed: boolean }>(`/materials/${material_id}/progress`);
    },

    // Exams / Tryouts
    async getExams(params?: { type?: string }): Promise<Exam[]> {
        const res = await api<Exam[]>("/exams", { params });
        return Array.isArray(res) ? res.map(normalizeExam) : [];
    },

    async getExamById(id: string): Promise<Exam> {
        const res = await api<Exam>(`/exams/${id}`);
        return normalizeExam(res);
    },

    async createExam(payload: Partial<Exam>): Promise<Exam> {
        const fullPayload = {
            ...payload,
            blueprint: {
                category: payload.category,
                scoring_system: payload.scoring_system,
                total_questions: payload.total_questions,
                grade_level: payload.grade_level,
                difficulty: payload.difficulty,
                default_mode: payload.default_mode,
                subtests: payload.subtests,
                ...(typeof payload.blueprint === "object" ? payload.blueprint : {}),
            },
        };
        const res = await api<Exam>("/exams", {
            method: "POST",
            body: fullPayload,
        });
        return normalizeExam(res);
    },

    async updateExam(id: string, payload: Partial<Exam>): Promise<Exam> {
        const fullPayload = {
            ...payload,
            blueprint: {
                category: payload.category,
                scoring_system: payload.scoring_system,
                total_questions: payload.total_questions,
                grade_level: payload.grade_level,
                difficulty: payload.difficulty,
                default_mode: payload.default_mode,
                subtests: payload.subtests,
                ...(typeof payload.blueprint === "object" ? payload.blueprint : {}),
            },
        };
        const res = await api<Exam>(`/exams/${id}`, {
            method: "PUT",
            body: fullPayload,
        });
        return normalizeExam(res);
    },

    async deleteExam(id: string): Promise<{ success: boolean }> {
        return api<{ success: boolean }>(`/exams/${id}`, {
            method: "DELETE",
        });
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
        return api<ExamResult>(`/results/${exam_id}`);
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
