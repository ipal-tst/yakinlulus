import { api } from "@/lib/api";
import {
    Material,
    Exam,
    CBTSession,
    ExamResult,
    RankingItem,
    TargetSchool,
    ExamPackage,
    LearnSubject,
    LearnChapter,
    LearnTopic,
    PaginatedData,
} from "@/types";
import {
    PracticeCatalog,
    PracticeSessionDetail,
    PracticeSubmitResult,
    PracticeReview,
    PracticeHistoryItem,
    PracticeScopeLevel,
    ExamPackageWithMeta,
    ExamPackageDetail,
    ExamSummary,
    ResultsAnalytics,
    RankingRow,
    MyRankSummary,
} from "@/types/siswa";

export interface PracticeStartPayload {
    level: PracticeScopeLevel;
    subject_id?: string;
    chapter_id?: string;
    topic_id?: string;
    question_count?: number;
}

// ---------------------------------------------------------------------------
// CBT runtime — POST/GET /cbt/* [API-contract-siswa §7.2]
// ---------------------------------------------------------------------------

export interface CBTRuntimeSession {
    id: string;
    exam_id: string;
    status: string;
    started_at: string;
    remaining_seconds: number;
    violation_score: number;
    is_terminated: boolean;
}

export interface CBTQuestionOption {
    id: string;
    label: string;
    text: string;
}

export interface CBTQuestion {
    exam_question_id: string;
    question_content_id: string;
    display_order: number;
    subjectName: string;
    stimulus: string;
    stem: string;
    questionType: string;
    difficulty: string;
    options: CBTQuestionOption[];
}

export interface CBTAnswerPayload {
    exam_question_id: string;
    selected_option_ids?: string[];
    selected_option_id?: string;
    is_doubtful?: boolean;
}

export interface CBTSubjectBreakdown {
    subject_id: string;
    subject_name: string;
    questions_count: number;
    correct_count: number;
    total_score: number;
    max_score: number;
    percentage: number;
}

export interface CBTResult {
    id: string;
    session_id: string;
    exam_id: string;
    total_questions: number;
    answered_count: number;
    correct_count: number;
    wrong_count: number;
    unanswered_count: number;
    score: number;
    passing_grade: number;
    is_passed: boolean;
    duration_seconds: number;
    subject_breakdown: CBTSubjectBreakdown[];
}

export interface CBTReviewOption {
    id?: string;
    label?: string;
    text: string;
    is_correct?: boolean;
}

export interface CBTSessionReviewQuestion {
    exam_question_id: string;
    display_order: number;
    question?: string;
    question_type?: string;
    difficulty?: string;
    content: string;
    subject_name?: string;
    correct_option: string;
    selected_option_id?: string;
    is_correct?: boolean;
    explanation?: string;
    options?: CBTReviewOption[];
}

export interface CBTSessionReview {
    session_id: string;
    exam_id: string;
    exam_title?: string;
    user_id?: string;
    total_questions: number;
    correct_count: number;
    wrong_count: number;
    unanswered_count: number;
    score: number;
    passing_grade: number;
    is_passed: boolean;
    duration_seconds: number;
    subject_breakdown?: CBTSubjectBreakdown[];
    questions: CBTSessionReviewQuestion[];
    created_at?: string;
}

export interface Result {
    id: string;
    session_id: string;
    exam_id: string;
    total_questions: number;
    answered_count: number;
    correct_count: number;
    wrong_count: number;
    unanswered_count: number;
    score: number;
    passing_grade: number;
    is_passed: boolean;
    duration_seconds: number;
    created_at?: string;
    subject_breakdown: CBTSubjectBreakdown[];
}

function normalizeExam(e: any): Exam {
    if (!e || typeof e !== "object") return e;
    
    const content = e.content || e.Content || e;
    const examData = e.exam || e.Exam || e;
    const bp = (typeof examData.blueprint === "object" && examData.blueprint !== null)
        ? examData.blueprint
        : ((typeof examData.Blueprint === "object" && examData.Blueprint !== null)
            ? examData.Blueprint
            : ((typeof e.blueprint === "object" && e.blueprint !== null)
                ? e.blueprint
                : ((typeof e.Blueprint === "object" && e.Blueprint !== null) ? e.Blueprint : {})));

    const subtestsList = Array.isArray(e.subtests) && e.subtests.length > 0 
        ? e.subtests 
        : (Array.isArray(bp.subtests)
            ? bp.subtests 
            : (Array.isArray(examData.subtests) ? examData.subtests : []));
    
    let calcQuestions = e.total_questions ?? bp.total_questions ?? examData.total_questions ?? examData.totalQuestions;
    if ((calcQuestions === undefined || calcQuestions === null || calcQuestions === 0) && subtestsList.length > 0) {
        calcQuestions = subtestsList.reduce((sum: number, st: any) => sum + Number(st.sample_question_count || (st.pool_question_ids?.length || 0)), 0);
    }

    const category = e.category || bp.category || examData.category || "UTBK_SNBT";
    const defaultScoring = (category === "UJIAN_HARIAN" || category === "PTS_UAS" || category === "QUIZ" || category === "MID") ? "STANDARD_POINTS" : "IRT";
    const scoringSystem = e.scoring_system || bp.scoring_system || examData.scoring_system || defaultScoring;

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
        category: category,
        scoring_system: scoringSystem,
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

    // Exam Packages / Membership
    async getExamPackages(params?: { education_level?: string }): Promise<ExamPackage[]> {
        const res = await api<ExamPackage[] | { items: ExamPackage[] }>("/exam-packages", { params });
        return Array.isArray(res) ? res : (res?.items ?? []);
    },

    // Learn Module - New APIs
    async getLearnCatalog(params?: { grade_id?: string }): Promise<{
        subjects: LearnSubject[];
        extras: Array<{ kind: string; title: string; media_url?: string; duration_seconds?: number; description?: string }>;
    }> {
        return api<{
            subjects: LearnSubject[];
            extras: Array<{ kind: string; title: string; media_url?: string; duration_seconds?: number; description?: string }>;
        }>("/materials/catalog", { params });
    },

    async getSubjectChapters(subjectId: string): Promise<{
        subject: LearnSubject;
        chapters: LearnChapter[];
    }> {
        return api<{
            subject: LearnSubject;
            chapters: LearnChapter[];
        }>(`/materials/${subjectId}/chapters`);
    },

    async getChapterDetail(subjectId: string, chapterId: string): Promise<{
        chapter: LearnChapter;
        topics: LearnTopic[];
        quiz_exam_id?: string;
    }> {
        return api<{
            chapter: LearnChapter;
            topics: LearnTopic[];
            quiz_exam_id?: string;
        }>(`/materials/${subjectId}/${chapterId}`);
    },

    // ------------------------------------------------------------
    // Latihan hierarki & runner [KONTRAK BARU §15.8]
    // ------------------------------------------------------------
    async getPracticeCatalog(): Promise<PracticeCatalog> {
        return api<PracticeCatalog>("/practice/catalog");
    },

    async startPractice(payload: PracticeStartPayload): Promise<{ session_id: string }> {
        return api<{ session_id: string }>("/practice/start", {
            method: "POST",
            body: payload,
        });
    },

    async getPracticeSession(sessionId: string): Promise<PracticeSessionDetail> {
        return api<PracticeSessionDetail>(`/practice/sessions/${sessionId}`);
    },

    async submitPractice(
        sessionId: string,
        answers: { question_id: string; selected_option_id: string }[]
    ): Promise<PracticeSubmitResult> {
        return api<PracticeSubmitResult>(`/practice/sessions/${sessionId}/submit`, {
            method: "POST",
            body: { answers },
        });
    },

    async getPracticeResult(sessionId: string): Promise<PracticeSubmitResult> {
        return api<PracticeSubmitResult>(`/practice/sessions/${sessionId}/result`);
    },

    async getPracticeReview(sessionId: string): Promise<PracticeReview> {
        return api<PracticeReview>(`/practice/sessions/${sessionId}/review`);
    },

    async getPracticeHistory(params?: { page?: number; limit?: number }): Promise<PaginatedData<PracticeHistoryItem> | PracticeHistoryItem[]> {
        return api<PaginatedData<PracticeHistoryItem> | PracticeHistoryItem[]>("/practice/sessions", { params });
    },

    async getPracticeStats(): Promise<{
        total_sessions: number;
        total_questions: number;
        total_correct: number;
        avg_score: number;
        accuracy_pct: number;
    }> {
        return api<{
            total_sessions: number;
            total_questions: number;
            total_correct: number;
            avg_score: number;
            accuracy_pct: number;
        }>("/practice/stats");
    },

    // ------------------------------------------------------------
    // Paket Ujian & Summary [KONTRAK BARU §15.9]
    // ------------------------------------------------------------
    async getExamPackagesWithMeta(params?: { education_level?: string }): Promise<ExamPackageWithMeta[]> {
        const res = await api<ExamPackageWithMeta[] | { items: ExamPackageWithMeta[] }>("/exam-packages", { params });
        return Array.isArray(res) ? res : (res?.items ?? []);
    },

    async getExamPackageDetail(id: string): Promise<ExamPackageDetail> {
        return api<ExamPackageDetail>(`/exam-packages/${id}`);
    },

    async getExamSummary(): Promise<ExamSummary> {
        return api<ExamSummary>("/exams/summary");
    },

    // ------------------------------------------------------------
    // Hasil & Analisis [KONTRAK BARU §15.10]
    // ------------------------------------------------------------
    async getResultsAnalytics(): Promise<ResultsAnalytics> {
        return api<ResultsAnalytics>("/results/analytics");
    },

    async getResults(params?: { page?: number; limit?: number }): Promise<Result[]> {
        const res = await api<Result[] | { items: Result[] }>("/results", { params });
        return Array.isArray(res) ? res : (res?.items ?? []);
    },

    async getResultBySession(session_id: string): Promise<Result> {
        return api<Result>(`/results/${session_id}`);
    },

    // ------------------------------------------------------------
    // Peringkat [KONTRAK BARU §15.11]
    // ------------------------------------------------------------
    async getLeaderboard(params?: { package_id?: string; month?: string; limit?: number; subject_id?: string }): Promise<RankingRow[]> {
        const res = await api<RankingRow[] | { items: RankingRow[] }>("/leaderboard", { params });
        return Array.isArray(res) ? res : (res?.items ?? []);
    },

    async getLeaderboardAggregate(params?: { package_ids?: string; month?: string; limit?: number }): Promise<RankingRow[]> {
        const res = await api<RankingRow[] | { items: RankingRow[] }>("/leaderboard/aggregate", { params });
        return Array.isArray(res) ? res : (res?.items ?? []);
    },

    async getMyRank(params?: { package_id?: string; month?: string; package_ids?: string }): Promise<MyRankSummary> {
        return api<MyRankSummary>("/leaderboard/me", { params });
    },

    // ------------------------------------------------------------
    // CBT runner (existing /cbt session)
    // ------------------------------------------------------------
    async startCBTExam(exam_id: string): Promise<CBTRuntimeSession> {
        return api<CBTRuntimeSession>(`/cbt/${exam_id}/start`, {
            method: "POST",
        });
    },

    async getCBTQuestions(session_id: string): Promise<CBTQuestion[]> {
        const res = await api<CBTQuestion[] | { questions: CBTQuestion[] }>(
            `/cbt/${session_id}/questions`
        );
        return Array.isArray(res) ? res : (res?.questions ?? []);
    },

    async syncCBTAnswers(session_id: string, answers: CBTAnswerPayload[]): Promise<{ message: string }> {
        return api<{ message: string }>(`/cbt/${session_id}/sync`, {
            method: "POST",
            body: { answers },
        });
    },

    async finishCBTExam(session_id: string): Promise<CBTResult> {
        return api<CBTResult>(`/cbt/${session_id}/finish`, {
            method: "POST",
        });
    },

    async getCBTReview(session_id: string): Promise<CBTSessionReview> {
        return api<CBTSessionReview>(`/cbt/${session_id}/review`);
    },
};
