export interface ApiParam {
    name: string;
    in: 'path' | 'query' | 'header' | 'body';
    required?: boolean;
    type: string;
    description?: string;
    defaultValue?: any;
    enum?: string[];
}

export interface ApiEndpoint {
    id: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    summary: string;
    description?: string;
    tag: string;
    authRequired: boolean;
    params?: ApiParam[];
    requestBodySample?: Record<string, any> | Array<any> | string;
    responses: Record<string, string>;
}

export interface ApiTagGroup {
    name: string;
    description: string;
    endpoints: ApiEndpoint[];
}

export const OPENAPI_SPEC_INFO = {
    title: "YakinLulus.id API",
    version: "1.0.0",
    description: "Computer-Based Testing (CBT) platform API for YakinLulus.id. Authentication via Bearer JWT.",
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
    openApiUrl: "http://localhost:8080/openapi.yaml",
    swaggerUrl: "http://localhost:8080/docs",
};

export const API_ENDPOINTS: ApiEndpoint[] = [
    // --- Auth Module ---
    {
        id: "auth-register",
        path: "/auth/register",
        method: "POST",
        summary: "Register new user",
        tag: "Auth",
        authRequired: false,
        requestBodySample: { email: "user@example.com", password: "password123", name: "Nama User", phone: "08123456789" },
        responses: { "201": "User registered", "400": "Validation error" }
    },
    {
        id: "auth-login",
        path: "/auth/login",
        method: "POST",
        summary: "Login with email + password",
        tag: "Auth",
        authRequired: false,
        requestBodySample: { email: "admin@yakinlulus.id", password: "password123" },
        responses: { "200": "Login success, returns JWT token", "401": "Invalid credentials" }
    },
    {
        id: "auth-me",
        path: "/auth/me",
        method: "GET",
        summary: "Get current user profile",
        tag: "Auth",
        authRequired: true,
        responses: { "200": "Current user data", "401": "Unauthorized" }
    },
    {
        id: "auth-profile",
        path: "/auth/profile",
        method: "PUT",
        summary: "Update user profile",
        tag: "Auth",
        authRequired: true,
        requestBodySample: { name: "Nama Terupdate", phone: "089988776655", avatar_url: "https://example.com/avatar.png" },
        responses: { "200": "Profile updated successfully" }
    },
    {
        id: "auth-users",
        path: "/auth/users",
        method: "GET",
        summary: "List all users (Admin/Staff)",
        tag: "Auth Admin",
        authRequired: true,
        params: [
            { name: "page", in: "query", type: "integer", defaultValue: 1 },
            { name: "limit", in: "query", type: "integer", defaultValue: 20 },
            { name: "role", in: "query", type: "string" },
            { name: "search", in: "query", type: "string" }
        ],
        responses: { "200": "Paginated user list" }
    },

    // --- Content Domain Module ---
    {
        id: "content-list",
        path: "/contents",
        method: "GET",
        summary: "List content items (Unified Content Domain)",
        tag: "Content Domain",
        authRequired: true,
        params: [
            { name: "type", in: "query", type: "string", enum: ["QUESTION", "MATERIAL", "EXAM"] },
            { name: "grade_id", in: "query", type: "string" },
            { name: "subject_id", in: "query", type: "string" },
            { name: "status", in: "query", type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
            { name: "search", in: "query", type: "string" },
            { name: "page", in: "query", type: "integer", defaultValue: 1 },
            { name: "limit", in: "query", type: "integer", defaultValue: 20 }
        ],
        responses: { "200": "Paginated contents list" }
    },
    {
        id: "content-get",
        path: "/contents/{id}",
        method: "GET",
        summary: "Get base content by ID",
        tag: "Content Domain",
        authRequired: true,
        params: [{ name: "id", in: "path", required: true, type: "string" }],
        responses: { "200": "Base content item", "404": "Content not found" }
    },
    {
        id: "content-subtype",
        path: "/contents/{id}/subtype",
        method: "GET",
        summary: "Get polymorphic subtype details (QuestionFull / MaterialFull / ExamFull)",
        tag: "Content Domain",
        authRequired: true,
        params: [{ name: "id", in: "path", required: true, type: "string" }],
        responses: { "200": "Detailed polymorphic content item" }
    },

    // --- Academic Module ---
    {
        id: "academic-levels",
        path: "/academic/levels",
        method: "GET",
        summary: "List education levels",
        tag: "Academic",
        authRequired: true,
        responses: { "200": "List of education levels (SMA, SMP, SD, UTBK)" }
    },
    {
        id: "academic-subjects",
        path: "/academic/subjects",
        method: "GET",
        summary: "List subjects",
        tag: "Academic",
        authRequired: true,
        params: [{ name: "level_id", in: "query", type: "string" }],
        responses: { "200": "List of subjects" }
    },
    {
        id: "academic-chapters",
        path: "/academic/subjects/{id}/chapters",
        method: "GET",
        summary: "List chapters for a subject",
        tag: "Academic",
        authRequired: true,
        params: [{ name: "id", in: "path", required: true, type: "string" }],
        responses: { "200": "List of chapters" }
    },

    // --- CBT Engine & Runtime ---
    {
        id: "cbt-start",
        path: "/cbt/start",
        method: "POST",
        summary: "Start exam session & generate question package",
        tag: "CBT Runtime",
        authRequired: true,
        requestBodySample: { exam_id: "uuid-exam-id-here" },
        responses: { "200": "Active exam session token & question list", "400": "Exam expired or invalid" }
    },
    {
        id: "cbt-answer",
        path: "/cbt/answer",
        method: "POST",
        summary: "Save user answer (offline-first sync)",
        tag: "CBT Runtime",
        authRequired: true,
        requestBodySample: { session_id: "uuid-session", question_id: "uuid-question", answer: ["A"], is_flagged: false },
        responses: { "200": "Answer saved" }
    },
    {
        id: "cbt-finish",
        path: "/cbt/finish",
        method: "POST",
        summary: "Submit and finalize exam session",
        tag: "CBT Runtime",
        authRequired: true,
        requestBodySample: { session_id: "uuid-session" },
        responses: { "200": "Exam session finalized and evaluated" }
    },

    // --- Practice & Gamification ---
    {
        id: "practice-sessions",
        path: "/practice/sessions",
        method: "POST",
        summary: "Create adaptive practice session",
        tag: "Practice",
        authRequired: true,
        requestBodySample: { subject_id: "uuid-subject", mode: "ADAPTIVE", question_count: 10, difficulty: "MEDIUM" },
        responses: { "201": "Practice session created" }
    },
    {
        id: "ranking-leaderboard",
        path: "/leaderboard",
        method: "GET",
        summary: "Get monthly national exam-score leaderboard for a package",
        tag: "Ranking",
        authRequired: true,
        params: [
            { name: "package_id", in: "query", type: "string", required: true },
            { name: "month", in: "query", type: "string", description: "YYYY-MM", required: true },
            { name: "limit", in: "query", type: "integer" }
        ],
        responses: { "200": "Ranking rows with per-subject scores, totals and averages" }
    },

    // --- AI Ecosystem ---
    {
        id: "ai-tutor-chat",
        path: "/ai/tutor/chat",
        method: "POST",
        summary: "Interactive AI Tutor query (with RAG context)",
        tag: "AI Tutor",
        authRequired: true,
        requestBodySample: { message: "Jelaskan rumus trigonometri dasar dan contoh soalnya!", conversation_id: "optional-uuid" },
        responses: { "200": "AI response with explanations" }
    },

    // --- Dashboard & Analytics ---
    {
        id: "dashboard-student",
        path: "/dashboard/student",
        method: "GET",
        summary: "Student overview metrics & recent activities",
        tag: "Dashboard",
        authRequired: true,
        responses: { "200": "Student progress, active exams, XP stats" }
    },
    {
        id: "dashboard-admin",
        path: "/dashboard/admin",
        method: "GET",
        summary: "Admin platform analytics & system metrics",
        tag: "Dashboard",
        authRequired: true,
        responses: { "200": "Total users, active exams, revenue metrics" }
    }
];

export const API_TAGS: string[] = Array.from(new Set(API_ENDPOINTS.map((e) => e.tag)));
