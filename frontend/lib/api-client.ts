/**
 * YakinLulus.id - Unified API Client & Backend Service Gateway
 * Bridges Next.js 15 App Router Frontend with Go Fiber REST API Services.
 *
 * Uses HttpOnly cookie (credentials: 'include') — no localStorage token.
 * Safe against XSS.
 */

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    meta?: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "/api/v1";
    }

    public getAuthToken(): string | null {
        // HttpOnly cookie — token not accessible from JS
        return null;
    }

    public setAuthToken(_token: string) {
        // No-op: backend sets HttpOnly cookie on login
    }

    public clearAuthToken() {
        // No-op: logout clears HttpOnly cookie server-side
    }

    public async autoLoginAdmin(): Promise<string | null> {
        // Dev convenience: auto login with admin credentials
        // Backend sets HttpOnly cookie, no token returned to JS
        try {
            const res = await fetch(`${this.baseUrl}/auth/login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "admin@yakinlulus.id",
                    password: "Admin@123!",
                }),
            });
            const text = await res.text();
            if (res.ok && text) {
                const json = JSON.parse(text);
                return json.data?.token || json.token || "ok";
            }
        } catch (err) {
            console.warn("[ApiClient] Auto admin login failed:", err);
        }
        return null;
    }

    public async request<T>(
        endpoint: string,
        options: RequestInit = {},
        retryOn401: boolean = true
    ): Promise<ApiResponse<T>> {
        // Auto obtain session if missing (for dev convenience)
        if (!endpoint.includes("/auth/login") && !endpoint.includes("/auth/register")) {
            const meRes = await fetch(`${this.baseUrl}/auth/me`, {
                credentials: "include",
            });
            if (meRes.status === 401) {
                await this.autoLoginAdmin();
            }
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(options.headers as Record<string, string>),
        };

        // Remove Content-Type for FormData uploads
        if (options.body instanceof FormData) {
            delete headers["Content-Type"];
        }

        try {
            let response = await fetch(`${this.baseUrl}${endpoint}`, {
                credentials: "include", // HttpOnly cookie auto-sent
                ...options,
                headers,
            });

            // Handle 401 Unauthorized: try auto login once
            if (response.status === 401 && retryOn401 && !endpoint.includes("/auth/login")) {
                console.info("[ApiClient] 401 encountered. Attempting auto-login...");
                await this.autoLoginAdmin();
                return this.request<T>(endpoint, options, false);
            }

            // Handle 204 No Content (DELETE responses)
            if (response.status === 204) {
                return { success: true };
            }

            // Parse JSON response safely
            const text = await response.text();
            let data: any = {};
            if (text && text.trim().length > 0) {
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { message: text };
                }
            }

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || data.error || `HTTP Error ${response.status}`,
                };
            }

            return {
                success: true,
                data: data.data !== undefined ? data.data : data,
                meta: data.meta,
            };
        } catch (err: any) {
            console.warn(`[ApiClient] Endpoint ${endpoint} unreachable:`, err);
            return {
                success: false,
                error: err.message || "Network Error: Pastikan Go Backend API berjalan di http://localhost:8080",
            };
        }
    }

    // --- 1. Auth API ---
    public auth = {
        login: async (credentials: any) => this.request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
        register: async (payload: any) => this.request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
        getMe: async () => this.request("/auth/me", { method: "GET" }),
        updateProfile: async (payload: any) => this.request("/auth/profile", { method: "PUT", body: JSON.stringify(payload) }),
    };

    // --- 2. Admin User Management API ---
    public users = {
        list: async (page = 1, limit = 20) => this.request(`/auth/users?page=${page}&limit=${limit}`, { method: "GET" }),
        search: async (q: string, page = 1, limit = 20) => this.request(`/auth/users/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`, { method: "GET" }),
        getById: async (id: string) => this.request(`/auth/users/${id}`, { method: "GET" }),
        create: async (payload: any) => this.request("/auth/users", { method: "POST", body: JSON.stringify(payload) }),
        update: async (id: string, payload: any) => this.request(`/auth/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        delete: async (id: string) => this.request(`/auth/users/${id}`, { method: "DELETE" }),
        setActive: async (id: string, active: boolean) => this.request(`/auth/users/${id}/activate`, { method: "PATCH", body: JSON.stringify({ active }) }),
    };

    // --- 3. Master Data Academic API ---
    public academic = {
        getLevels: async () => this.request("/academic/levels", { method: "GET" }),
        createLevel: async (payload: any) => this.request("/academic/levels", { method: "POST", body: JSON.stringify(payload) }),
        updateLevel: async (id: string, payload: any) => this.request(`/academic/levels/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        deleteLevel: async (id: string) => this.request(`/academic/levels/${id}`, { method: "DELETE" }),

        getSubjects: async () => this.request("/academic/subjects", { method: "GET" }),
        createSubject: async (payload: any) => this.request("/academic/subjects", { method: "POST", body: JSON.stringify(payload) }),
        updateSubject: async (id: string, payload: any) => this.request(`/academic/subjects/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        deleteSubject: async (id: string) => this.request(`/academic/subjects/${id}`, { method: "DELETE" }),

        getChapters: async (subjectId?: string) => this.request(subjectId ? `/academic/subjects/${subjectId}/chapters` : "/academic/chapters", { method: "GET" }),
        createChapter: async (subjectIdOrPayload: any, payload?: any) => {
            if (typeof subjectIdOrPayload === "string" && payload) {
                return this.request(`/academic/subjects/${subjectIdOrPayload}/chapters`, { method: "POST", body: JSON.stringify(payload) });
            }
            return this.request("/academic/chapters", { method: "POST", body: JSON.stringify(subjectIdOrPayload) });
        },
        updateChapter: async (idOrSubjectId: string, payloadOrId: any, payload?: any) => {
            if (payload) {
                return this.request(`/academic/subjects/${idOrSubjectId}/chapters/${payloadOrId}`, { method: "PUT", body: JSON.stringify(payload) });
            }
            return this.request(`/academic/chapters/${idOrSubjectId}`, { method: "PUT", body: JSON.stringify(payloadOrId) });
        },
        deleteChapter: async (idOrSubjectId: string, id?: string) => {
            if (id) {
                return this.request(`/academic/subjects/${idOrSubjectId}/chapters/${id}`, { method: "DELETE" });
            }
            return this.request(`/academic/chapters/${idOrSubjectId}`, { method: "DELETE" });
        },

        getPrograms: async () => this.request("/academic/programs", { method: "GET" }),
        createProgram: async (payload: any) => this.request("/academic/programs", { method: "POST", body: JSON.stringify(payload) }),
        updateProgram: async (id: string, payload: any) => this.request(`/academic/programs/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        deleteProgram: async (id: string) => this.request(`/academic/programs/${id}`, { method: "DELETE" }),

        getGrades: async () => this.request("/academic/grades", { method: "GET" }),
        createGrade: async (payload: any) => this.request("/academic/grades", { method: "POST", body: JSON.stringify(payload) }),
        updateGrade: async (id: string, payload: any) => this.request(`/academic/grades/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        deleteGrade: async (id: string) => this.request(`/academic/grades/${id}`, { method: "DELETE" }),
        getCurriculums: async () => this.request("/academic/curriculums", { method: "GET" }),
        createCurriculum: async (payload: any) => this.request("/academic/curriculums", { method: "POST", body: JSON.stringify(payload) }),
        updateCurriculum: async (id: string, payload: any) => this.request(`/academic/curriculums/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        deleteCurriculum: async (id: string) => this.request(`/academic/curriculums/${id}`, { method: "DELETE" }),
        getTopics: async (chapterId?: string) => this.request(`/academic/topics${chapterId ? `?chapter_id=${chapterId}` : ""}`, { method: "GET" }),
        createTopic: async (payload: any) => this.request("/academic/topics", { method: "POST", body: JSON.stringify(payload) }),
        updateTopic: async (id: string, payload: any) => this.request(`/academic/topics/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        deleteTopic: async (id: string) => this.request(`/academic/topics/${id}`, { method: "DELETE" }),
        getLearningOutcomes: async (topicId?: string) => this.request(`/academic/learning-outcomes${topicId ? `?topic_id=${topicId}` : ""}`, { method: "GET" }),
    };

    // --- 4. Question Bank API ---
    public questionBank = {
        list: async (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : "";
            return this.request(`/questions${query}`, { method: "GET" });
        },
        getById: async (id: string) => this.request(`/questions/${id}`, { method: "GET" }),
        create: async (payload: any) => this.request("/questions", { method: "POST", body: JSON.stringify(payload) }),
        update: async (id: string, payload: any) => this.request(`/questions/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        delete: async (id: string) => this.request(`/questions/${id}`, { method: "DELETE" }),
        publish: async (id: string) => this.request(`/questions/${id}/publish`, { method: "POST" }),
        archive: async (id: string) => this.request(`/questions/${id}/archive`, { method: "POST" }),
        restore: async (id: string) => this.request(`/questions/${id}/restore`, { method: "POST" }),
        unpublish: async (id: string) => this.request(`/questions/${id}/unpublish`, { method: "POST" }),
        clone: async (id: string) => this.request(`/questions/${id}/clone`, { method: "POST" }),
        export: async (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : "";
            return this.request(`/questions/export${query}`, { method: "GET" });
        },
        import: async (payload: any) => this.request("/questions/import", { method: "POST", body: JSON.stringify(payload) }),
        getOptions: async (questionId: string) => this.request(`/questions/${questionId}/options`, { method: "GET" }),
        replaceOptions: async (questionId: string, options: any[]) => this.request(`/questions/${questionId}/options`, { method: "PUT", body: JSON.stringify(options) }),
        listRevisions: async (questionId: string) => this.request(`/questions/${questionId}/revisions`, { method: "GET" }),
    };

    // --- 5. Exam Engine API ---
    public exams = {
        list: async (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : "";
            return this.request(`/exams${query}`, { method: "GET" });
        },
        getById: async (id: string) => this.request(`/exams/${id}`, { method: "GET" }),
        create: async (payload: any) => this.request("/exams", { method: "POST", body: JSON.stringify(payload) }),
        update: async (id: string, payload: any) => this.request(`/exams/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        delete: async (id: string) => this.request(`/exams/${id}`, { method: "DELETE" }),
        publish: async (id: string) => this.request(`/exams/${id}/publish`, { method: "POST" }),
        schedule: async (id: string, startTime: string, endTime: string) => this.request(`/exams/${id}/schedule`, { method: "POST", body: JSON.stringify({ start_time: startTime, end_time: endTime }) }),
        archive: async (id: string) => this.request(`/exams/${id}/archive`, { method: "POST" }),
        clone: async (id: string, title: string) => this.request(`/exams/${id}/clone`, { method: "POST", body: JSON.stringify({ title }) }),
        getAnalytics: async (id: string) => this.request(`/exams/${id}/analytics`, { method: "GET" }),
        getRule: async (id: string) => this.request(`/exams/${id}/rule`, { method: "GET" }),
        setRule: async (id: string, payload: any) => this.request(`/exams/${id}/rule`, { method: "PUT", body: JSON.stringify(payload) }),
        getBlueprint: async (id: string) => this.request(`/exams/${id}/blueprint`, { method: "GET" }),
        setBlueprint: async (id: string, payload: any) => this.request(`/exams/${id}/blueprint`, { method: "POST", body: JSON.stringify(payload) }),
        getQuestionPool: async (id: string) => this.request(`/exams/${id}/pool`, { method: "GET" }),
        createQuestionPool: async (id: string, payload: any) => this.request(`/exams/${id}/pool`, { method: "POST", body: JSON.stringify(payload) }),
        updateQuestionPool: async (id: string, payload: any) => this.request(`/exams/${id}/pool`, { method: "PUT", body: JSON.stringify(payload) }),
        deleteQuestionPool: async (id: string) => this.request(`/exams/${id}/pool`, { method: "DELETE" }),
        getParticipants: async (id: string) => this.request(`/exams/${id}/participants`, { method: "GET" }),
        addParticipants: async (id: string, userIds: string[]) => this.request(`/exams/${id}/participants`, { method: "POST", body: JSON.stringify({ user_ids: userIds }) }),
        removeParticipant: async (id: string, userId: string) => this.request(`/exams/${id}/participants/${userId}`, { method: "DELETE" }),
        getQuestions: async (id: string) => this.request(`/exams/${id}/questions`, { method: "GET" }),
        getExamQuestionPKs: async (id: string) => this.request(`/exams/${id}/exam-questions`, { method: "GET" }),
        addExamQuestions: async (id: string, questionIds: string[]) => this.request(`/exams/${id}/questions`, { method: "POST", body: JSON.stringify({ question_ids: questionIds }) }),
    };

    // --- 6. CBT Runtime API ---
    public cbt = {
        startSession: async (examId: string) => this.request(`/cbt/${examId}/start`, { method: "POST" }),
        syncAnswers: async (sessionId: string, answers: any[]) => this.request(`/cbt/${sessionId}/sync`, { method: "POST", body: JSON.stringify({ answers }) }),
        navigate: async (sessionId: string, examQuestionId: string, isDoubtful: boolean) => this.request(`/cbt/${sessionId}/navigate`, { method: "POST", body: JSON.stringify({ exam_question_id: examQuestionId, is_doubtful: isDoubtful }) }),
        pause: async (sessionId: string, remainingSeconds: number) => this.request(`/cbt/${sessionId}/pause`, { method: "POST", body: JSON.stringify({ remaining_seconds: remainingSeconds }) }),
        resume: async (sessionId: string) => this.request(`/cbt/${sessionId}/resume`, { method: "POST" }),
        finish: async (sessionId: string) => this.request(`/cbt/${sessionId}/finish`, { method: "POST" }),
        reportViolation: async (sessionId: string, violationType: string, details?: string) => this.request(`/cbt/${sessionId}/violation`, { method: "POST", body: JSON.stringify({ violation_type: violationType, details }) }),
        getAnswers: async (sessionId: string) => this.request(`/cbt/${sessionId}/answers`, { method: "GET" }),
        getSessionQuestions: async (sessionId: string) => this.request(`/cbt/${sessionId}/questions`, { method: "GET" }),
    };

    // --- 7. Learning Material API ---
    public materials = {
        list: async (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : "";
            return this.request(`/materials${query}`, { method: "GET" });
        },
        getById: async (id: string) => this.request(`/materials/${id}`, { method: "GET" }),
    };

    // --- 8. Analytics API ---
    public analytics = {
        getStudentSummary: async (studentId: string) => this.request(`/analytics/students/${studentId}`, { method: "GET" }),
        getExamAnalytics: async (examId: string) => this.request(`/analytics/exams/${examId}`, { method: "GET" }),
        getAdminReports: async (page = 1, limit = 20) => this.request(`/analytics/admin/reports/exams?page=${page}&limit=${limit}`, { method: "GET" }),
    };

    // --- 9. School Mitra & Quota API ---
    public school = {
        list: async () => this.request("/schools", { method: "GET" }),
        getQuota: async (schoolId: string) => this.request(`/schools/${schoolId}/quota`, { method: "GET" }),
    };

    // --- 10. Scoring API ---
    public scoring = {
        getResults: async () => this.request("/results", { method: "GET" }),
        getResultById: async (sessionId: string) => this.request(`/results/${sessionId}`, { method: "GET" }),
    };

    // --- 11. Media API ---
    public media = {
        upload: async (formData: FormData) => this.request("/media/upload", { method: "POST", body: formData, headers: {} as any }),
        list: async (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : "";
            return this.request(`/media${query}`, { method: "GET" });
        },
    };

    // --- 12. Notification API ---
    public notification = {
        list: async (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : "";
            return this.request(`/notifications${query}`, { method: "GET" });
        },
        markRead: async (id: string) => this.request(`/notifications/${id}/read`, { method: "POST" }),
        broadcast: async (userIds: string[], title: string, body: string) => this.request("/notifications/broadcast", { method: "POST", body: JSON.stringify({ user_ids: userIds, title, body }) }),
        send: async (userIds: string[], title: string, body: string) => this.request("/notifications/send", { method: "POST", body: JSON.stringify({ user_ids: userIds, title, body }) }),
    };

    // --- 13. Dashboard API ---
    public dashboard = {
        getStudent: async () => this.request("/dashboard/student", { method: "GET" }),
        getTeacher: async () => this.request("/dashboard/teacher", { method: "GET" }),
        getAdmin: async () => this.request("/dashboard/admin", { method: "GET" }),
    };

    // --- 14. Practice Mode API ---
    public practice = {
        startSession: async (subjectId?: string, questionCount = 10) => this.request("/practice/sessions/start", { method: "POST", body: JSON.stringify({ subject_id: subjectId, question_count: questionCount }) }),
        answerQuestion: async (sessionId: string, questionId: string, selectedOptionId: string) => this.request(`/practice/sessions/${sessionId}/answer`, { method: "POST", body: JSON.stringify({ question_id: questionId, selected_option_id: selectedOptionId }) }),
        getSession: async (sessionId: string) => this.request(`/practice/sessions/${sessionId}`, { method: "GET" }),
        listSessions: async (page = 1, limit = 20) => this.request(`/practice/sessions?page=${page}&limit=${limit}`, { method: "GET" }),
        getStats: async () => this.request("/practice/stats", { method: "GET" }),
        startMaterialPractice: async (materialId: string) => this.request(`/practice/material/${materialId}`, { method: "POST" }),
        startSubjectPractice: async (gradeId: string, subjectId: string, difficulty?: string) => this.request(`/practice/subject`, { method: "POST", body: JSON.stringify({ grade_id: gradeId, subject_id: subjectId, difficulty }) }),
        startTagBasedPractice: async (tagNames: string[], subjectId?: string, questionCount = 20) => this.request(`/practice/tags`, { method: "POST", body: JSON.stringify({ tag_names: tagNames, subject_id: subjectId, question_count: questionCount }) }),
        submitPracticeSession: async (sessionId: string, answers: any[]) => this.request(`/practice/${sessionId}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),
    };

    // --- 15. Gamification API ---
    public gamification = {
        getMyXP: async () => this.request("/gamification/xp", { method: "GET" }),
        listBadges: async (category?: string) => this.request(`/gamification/badges${category ? `?category=${category}` : ""}`, { method: "GET" }),
        getUserBadges: async () => this.request("/gamification/user/badges", { method: "GET" }),
        getStreak: async () => this.request("/gamification/streak", { method: "GET" }),
        pingStreak: async () => this.request("/gamification/streak/ping", { method: "POST" }),
        getLeaderboard: async (limit = 20, period = "all") => this.request(`/gamification/leaderboard?limit=${limit}&period=${period}`, { method: "GET" }),
        getAchievements: async () => this.request("/gamification/achievements", { method: "GET" }),
        addXP: async (userId: string, amount: number, reason: string) => this.request("/gamification/xp/add", { method: "POST", body: JSON.stringify({ user_id: userId, amount, reason }) }),
    };

    // --- 16. AI Ecosystem API ---
    public ai = {
        tutorChat: async (message: string, conversationId?: string) => this.request("/ai/tutor/chat", { method: "POST", body: JSON.stringify({ message, conversation_id: conversationId }) }),
        listConversations: async () => this.request("/ai/tutor/conversations", { method: "POST" }),
        getConversation: async (id: string) => this.request(`/ai/tutor/conversations/${id}`, { method: "GET" }),
        deleteConversation: async (id: string) => this.request(`/ai/tutor/conversations/${id}`, { method: "DELETE" }),
        generateQuestion: async (prompt: string, difficulty: string, subjectId?: string) => this.request("/ai/generate-question", { method: "POST", body: JSON.stringify({ prompt, difficulty, subject_id: subjectId }) }),
        getConfig: async () => this.request("/ai/config", { method: "GET" }),
        updateConfig: async (payload: { ai_endpoint?: string; ai_api_key?: string; ai_model?: string }) => this.request("/ai/config", { method: "PUT", body: JSON.stringify(payload) }),
        testConnection: async (payload?: { endpoint?: string; api_key?: string; model?: string }) => this.request("/ai/test-connection", { method: "POST", body: JSON.stringify(payload || {}) }),
    };

    // --- 17. Unified Content API ---
    public content = {
        list: async (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : "";
            return this.request(`/contents${query}`, { method: "GET" });
        },
        getById: async (id: string) => this.request(`/contents/${id}`, { method: "GET" }),
        getSubtype: async (id: string) => this.request(`/contents/${id}/subtype`, { method: "GET" }),
        create: async (payload: any) => this.request("/contents", { method: "POST", body: JSON.stringify(payload) }),
        update: async (id: string, payload: any) => this.request(`/contents/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
        delete: async (id: string) => this.request(`/contents/${id}`, { method: "DELETE" }),
        getMaterialPractice: async (materialId: string) => this.request(`/materials/${materialId}/practice`, { method: "GET" }),
    };

    // --- 18. WebSocket Live Proctoring API ---
    public getWebSocketUrl = (token?: string): string => {
        const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/api/v1/ws";
        return `${baseUrl}?token=${token || ""}`;
    };
}

export const apiClient = new ApiClient();
