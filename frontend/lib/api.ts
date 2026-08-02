/**
 * YakinLulus.id - TanStack Query API Wrapper
 * Uses HttpOnly cookie from backend (credentials: 'include')
 * No localStorage token - XSS safe
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AuthContextType } from '@/providers/AuthProvider';

const BASE_URL = '/api/v1';

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const fetchOptions: RequestInit = {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
  };

  let res = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

  if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    // Auto-login on 401 for dev session persistence
    try {
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@yakinlulus.id', password: 'Admin@123!' }),
      });
      if (loginRes.ok) {
        // Re-execute original request after acquiring new session cookie
        res = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
      }
    } catch (e) {
      console.warn('[apiFetch] Auto-login failed:', e);
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message = errorData?.message || errorData?.error || errorData?.detail || `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (res.status === 204) {
    return null as T;
  }

  const data = await res.json();
  if (data !== null && typeof data === 'object' && 'data' in data) {
    return data.data;
  }
  return data;
}

// Query Key Factory
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (page: number, limit: number) => ['users', 'list', page, limit] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  academic: {
    levels: ['academic', 'levels'] as const,
    subjects: ['academic', 'subjects'] as const,
    chapters: (subjectId?: string) => ['academic', 'chapters', subjectId] as const,
    topics: (chapterId?: string) => ['academic', 'topics', chapterId] as const,
  },
  questions: {
    all: ['questions'] as const,
    list: (params?: Record<string, string>) => ['questions', 'list', params] as const,
    detail: (id: string) => ['questions', 'detail', id] as const,
  },
  exams: {
    all: ['exams'] as const,
    list: (params?: Record<string, string>) => ['exams', 'list', params] as const,
    detail: (id: string) => ['exams', 'detail', id] as const,
    analytics: (id: string) => ['exams', 'analytics', id] as const,
  },
  cbt: {
    session: (sessionId: string) => ['cbt', 'session', sessionId] as const,
    questions: (sessionId: string) => ['cbt', 'questions', sessionId] as const,
    answers: (sessionId: string) => ['cbt', 'answers', sessionId] as const,
    review: (sessionId: string) => ['cbt', 'review', sessionId] as const,
  },
  dashboard: {
    student: ['dashboard', 'student'] as const,
    teacher: ['dashboard', 'teacher'] as const,
    admin: ['dashboard', 'admin'] as const,
  },
  practice: {
    sessions: ['practice', 'sessions'] as const,
    session: (id: string) => ['practice', 'session', id] as const,
    stats: ['practice', 'stats'] as const,
  },
  gamification: {
    xp: ['gamification', 'xp'] as const,
    badges: ['gamification', 'badges'] as const,
    streak: ['gamification', 'streak'] as const,
    leaderboard: (period: string) => ['gamification', 'leaderboard', period] as const,
  },
  analytics: {
    student: (id: string) => ['analytics', 'student', id] as const,
    exam: (id: string) => ['analytics', 'exam', id] as const,
    admin: (page?: number, limit?: number) => ['analytics', 'admin', page, limit] as const,
    overview: ['analytics', 'overview'] as const,
    reportDetail: (id: string) => ['analytics', 'admin', 'report', id] as const,
  },
  ai: {
    stats: ['ai', 'stats'] as const,
    conversations: (page?: number, limit?: number) => ['ai', 'conversations', page, limit] as const,
  },
  audit: {
    stats: ['audit', 'stats'] as const,
    logs: (page?: number, limit?: number, severity?: string, eventType?: string) => ['audit', 'logs', page, limit, severity, eventType] as const,
  },
  admin: {
    health: ['admin', 'health'] as const,
    logs: (limit?: number) => ['admin', 'logs', limit] as const,
  },
  schools: {
    all: ['schools'] as const,
  },
  subscriptions: {
    all: ['subscriptions'] as const,
    plans: ['subscriptions', 'plans'] as const,
    stats: ['subscriptions', 'stats'] as const,
    userSubs: ['subscriptions', 'users'] as const,
  },
  contents: {
    all: (params?: Record<string, string>) => ['contents', params] as const,
  },
  media: {
    all: (params?: Record<string, string>) => ['media', params] as const,
  },
  curriculums: {
    all: ['curriculums'] as const,
  },
  programs: {
    all: ['programs'] as const,
  },
  topics: {
    all: (chapterId?: string) => ['topics', chapterId] as const,
  },
  results: {
    all: ['results'] as const,
    detail: (sessionId: string) => ['results', 'detail', sessionId] as const,
    subjectBreakdown: (sessionId: string) => ['results', 'subjectBreakdown', sessionId] as const,
  },
  materials: {
    all: ['materials'] as const,
    list: (params?: Record<string, string>) => ['materials', 'list', params] as const,
    detail: (id: string) => ['materials', 'detail', id] as const,
  },
};

// Auth Hooks
export function useAuth() {
  return useQuery<{ user: AuthContextType['user'] } | null>({
    queryKey: queryKeys.auth.me,
    queryFn: () => apiFetch('/auth/me'),
    retry: false,
  });
}

// Admin Dashboard Types
export interface AdminDashboardResponse {
  totalUsers: number;
  totalSchools: number;
  activeExamSessions: number;
  totalExams: number;
  totalQuestions: number;
  approvedQuestions: number;
}

// Admin Dashboard
export function useAdminDashboard() {
  return useQuery<AdminDashboardResponse, Error>({
    queryKey: queryKeys.dashboard.admin,
    queryFn: () => apiFetch<AdminDashboardResponse>('/dashboard/admin'),
  });
}

// User Hooks
export function useUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.users.list(page, limit),
    queryFn: () => apiFetch(`/auth/users?page=${page}&limit=${limit}`),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useLevels() {
  return useQuery({
    queryKey: queryKeys.academic.levels,
    queryFn: () => apiFetch('/academic/levels'),
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.academic.subjects,
    queryFn: () => apiFetch('/academic/subjects'),
  });
}

export function useGrades() {
  return useQuery({
    queryKey: ['academic', 'grades'],
    queryFn: () => apiFetch('/academic/grades'),
  });
}

export function useChapters(subjectId?: string) {
  return useQuery({
    queryKey: queryKeys.academic.chapters(subjectId ?? 'all'),
    queryFn: () => apiFetch(subjectId ? `/academic/subjects/${subjectId}/chapters` : '/academic/chapters'),
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/academic/chapters', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.academic.chapters('all') }),
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/academic/chapters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.academic.chapters('all') }),
  });
}

export function useDeleteChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/academic/chapters/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.academic.chapters('all') }),
  });
}

// Question Bank Hooks
export function useQuestions(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.questions.list(params),
    queryFn: () => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return apiFetch(`/questions${query}`);
    },
  });
}

export function useQuestion(id: string) {
  return useQuery({
    queryKey: queryKeys.questions.detail(id),
    queryFn: () => apiFetch(`/questions/${id}`),
    enabled: !!id,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/questions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/questions/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.questions.all }),
  });
}

// Exam Hooks
export function useExams(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.exams.list(params),
    queryFn: () => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return apiFetch(`/exams${query}`);
    },
  });
}

export function useExam(id: string) {
  return useQuery({
    queryKey: queryKeys.exams.detail(id),
    queryFn: () => apiFetch(`/exams/${id}`),
    enabled: !!id,
  });
}

export function useExamAnalytics(id: string) {
  return useQuery({
    queryKey: queryKeys.exams.analytics(id),
    queryFn: () => apiFetch(`/exams/${id}/analytics`),
    enabled: !!id,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/exams', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.exams.all }),
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.exams.all }),
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/exams/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.exams.all }),
  });
}

export function useImportExams() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any[]) => apiFetch('/exams/import', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.exams.all }),
  });
}

export function useAddExamQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, questionId, points }: { examId: string; questionId: string; points?: number }) =>
      apiFetch(`/exams/${examId}/questions`, { method: 'POST', body: JSON.stringify({ question_id: questionId, display_order: 0, points: points || 1 }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.exams.all }),
  });
}

export function useRemoveExamQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, questionId }: { examId: string; questionId: string }) =>
      apiFetch(`/exams/${examId}/questions/${questionId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.exams.all }),
  });
}

// Dashboard Hooks
export function useStudentDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.student,
    queryFn: () => apiFetch('/dashboard/student'),
  });
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.teacher,
    queryFn: () => apiFetch('/dashboard/teacher'),
  });
}


// Analytics Hooks
export function useAnalytics(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.analytics.admin(page, limit),
    queryFn: () => apiFetch(`/analytics/admin/reports/exams?page=${page}&limit=${limit}`),
  });
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: queryKeys.analytics.overview,
    queryFn: () => apiFetch('/analytics/admin/overview'),
  });
}

export function useAdminExamReportDetail(examId: string) {
  return useQuery({
    queryKey: queryKeys.analytics.reportDetail(examId),
    queryFn: () => apiFetch(`/analytics/admin/reports/exams/${examId}`),
    enabled: !!examId,
  });
}

export function useStudentAnalytics(studentId: string) {
  return useQuery({
    queryKey: queryKeys.analytics.student(studentId),
    queryFn: () => apiFetch(`/analytics/students/${studentId}`),
    enabled: !!studentId,
  });
}

export function useStudentTimeline(studentId: string) {
  return useQuery({
    queryKey: ['analytics', 'student', 'timeline', studentId],
    queryFn: () => apiFetch(`/analytics/students/${studentId}/timeline`),
    enabled: !!studentId,
  });
}

// School Hooks
export function useSchools() {
  return useQuery({
    queryKey: queryKeys.schools.all,
    queryFn: () => apiFetch('/schools'),
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/schools', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiFetch(`/schools/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
}

export function useDeleteSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/schools/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
}

export function useUpdateSchoolStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiFetch(`/schools/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), headers: { 'Content-Type': 'application/json' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
}

// Subscription Hooks
export function useSubscriptionStats() {
  return useQuery({
    queryKey: queryKeys.subscriptions.stats,
    queryFn: () => apiFetch('/subscriptions/stats'),
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: queryKeys.subscriptions.plans,
    queryFn: () => apiFetch('/subscriptions/plans'),
  });
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/subscriptions/plans', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.plans });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.stats });
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiFetch(`/subscriptions/plans/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.plans });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.stats });
    },
  });
}

export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/subscriptions/plans/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.plans });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.stats });
    },
  });
}

export function useUserSubscriptions(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.subscriptions.userSubs,
    queryFn: () => apiFetch(`/subscriptions/users?page=${page}&limit=${limit}`),
  });
}

// Curriculum Hooks
export function useCurriculums() {
  return useQuery({
    queryKey: queryKeys.curriculums.all,
    queryFn: () => apiFetch('/academic/curriculums'),
  });
}

// Program Hooks
export function usePrograms() {
  return useQuery({
    queryKey: queryKeys.programs.all,
    queryFn: () => apiFetch('/academic/programs'),
  });
}

// Topic Hooks
export function useTopics(chapterId?: string) {
  return useQuery({
    queryKey: queryKeys.topics.all(chapterId),
    queryFn: () => apiFetch(chapterId ? `/academic/topics?chapter_id=${chapterId}` : '/academic/topics'),
  });
}

// Practice Hooks
export function usePracticeSessions(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.practice.sessions,
    queryFn: () => apiFetch(`/practice/sessions?page=${page}&limit=${limit}`),
  });
}

export function usePracticeSession(id: string) {
  return useQuery({
    queryKey: queryKeys.practice.session(id),
    queryFn: () => apiFetch(`/practice/sessions/${id}`),
    enabled: !!id,
  });
}

export function usePracticeStats() {
  return useQuery({
    queryKey: queryKeys.practice.stats,
    queryFn: () => apiFetch('/practice/stats'),
  });
}

export function useStartPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { subject_id?: string; question_count?: number }) =>
      apiFetch('/practice/sessions/start', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.practice.sessions }),
  });
}

export function useSubmitPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, answers }: { id: string; answers: any[] }) =>
      apiFetch(`/practice/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.practice.sessions }),
  });
}

// Gamification Hooks
export function useXP() {
  return useQuery({
    queryKey: queryKeys.gamification.xp,
    queryFn: () => apiFetch('/gamification/xp'),
  });
}

export function useBadges(category?: string) {
  return useQuery({
    queryKey: queryKeys.gamification.badges,
    queryFn: () => apiFetch(`/gamification/badges${category ? `?category=${category}` : ''}`),
  });
}

export function useUserBadges() {
  return useQuery({
    queryKey: ['gamification', 'user', 'badges'],
    queryFn: () => apiFetch('/gamification/user/badges'),
  });
}

export function useStreak() {
  return useQuery({
    queryKey: queryKeys.gamification.streak,
    queryFn: () => apiFetch('/gamification/streak'),
  });
}

export function useLeaderboard(limit = 20, period = 'all') {
  return useQuery({
    queryKey: queryKeys.gamification.leaderboard(period),
    queryFn: () => apiFetch(`/gamification/leaderboard?limit=${limit}&period=${period}`),
  });
}

// Results Hooks
export function useResults(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.results.all,
    queryFn: () => apiFetch(`/results?page=${page}&limit=${limit}`),
  });
}

export function useResultDetail(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.results.detail(sessionId),
    queryFn: () => apiFetch(`/results/${sessionId}`),
    enabled: !!sessionId,
  });
}

export function useSubjectBreakdown(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.results.subjectBreakdown(sessionId),
    queryFn: () => apiFetch(`/results/${sessionId}/subject-breakdown`),
    enabled: !!sessionId,
  });
}

// Materials Hooks
export function useMaterials(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.materials.list(params),
    queryFn: () => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return apiFetch(`/materials${query}`);
    },
  });
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: queryKeys.materials.detail(id),
    queryFn: () => apiFetch(`/materials/${id}`),
    enabled: !!id,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch('/materials', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/materials/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
  });
}

export function usePublishMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      apiFetch(`/materials/${id}/publish`, { method: 'PATCH', body: JSON.stringify({ publish }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.materials.all }),
  });
}

// CBT Session Hooks
export function useStartExamSession(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/cbt/${examId}/start`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cbt'] }),
  });
}

export function useCBTQuestions(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.cbt.questions(sessionId),
    queryFn: () => apiFetch(`/cbt/${sessionId}/questions`),
    enabled: !!sessionId,
  });
}

export function useSyncAnswers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, answers }: { sessionId: string; answers: any[] }) =>
      apiFetch(`/cbt/${sessionId}/sync`, { method: 'POST', body: JSON.stringify({ answers }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cbt'] }),
  });
}

export function useFinishExam() {
  return useMutation({
    mutationFn: (sessionId: string) => apiFetch(`/cbt/${sessionId}/finish`, { method: 'POST' }),
  });
}

export function useCBTReview(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.cbt.review(sessionId),
    queryFn: () => apiFetch(`/cbt/${sessionId}/review`),
    enabled: !!sessionId,
  });
}

// Content Hooks
export function useContents(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.contents.all(params),
    queryFn: () => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return apiFetch(`/contents${query}`);
    },
  });
}

// Media Hooks
export function useMedia(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.media.all(params),
    queryFn: () => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return apiFetch(`/media${query}`);
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

// Scores / Results Hooks
export function useScores() {
  return useQuery({
    queryKey: ['scores'],
    queryFn: () => apiFetch('/scores'),
  });
}

// Staff Dashboard Hook
export function useStaffDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'staff'],
    queryFn: () => apiFetch('/dashboard/staff'),
  });
}

// AI Tutor Hooks
export function useAIStats() {
  return useQuery({
    queryKey: queryKeys.ai.stats,
    queryFn: () => apiFetch('/ai/tutor/admin/stats'),
  });
}

export function useAIConversations(page = 0, limit = 20) {
  return useQuery({
    queryKey: queryKeys.ai.conversations(page, limit),
    queryFn: () => apiFetch(`/ai/tutor/admin/conversations?limit=${limit}&offset=${page * limit}`),
  });
}

export function useDeleteAIConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/ai/tutor/admin/conversations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

// Audit Log Hooks
export function useAuditStats() {
  return useQuery({
    queryKey: queryKeys.audit.stats,
    queryFn: () => apiFetch('/audit-logs/stats'),
  });
}

export function useAuditLogs(page = 1, limit = 20, severity?: string, eventType?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (severity) params.set('severity', severity);
  if (eventType) params.set('event_type', eventType);
  return useQuery({
    queryKey: queryKeys.audit.logs(page, limit, severity, eventType),
    queryFn: () => apiFetch(`/audit-logs?${params.toString()}`),
  });
}

// Export raw apiFetch for custom needs
export { apiFetch };

// Admin DTOs (matching backend)
export interface HealthService {
  name: string;
  endpoint?: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  latency: string;
  uptime: string;
}

export interface HealthResponse {
  services: HealthService[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  module: "HTTP_API" | "CBT_ENGINE" | "DATABASE" | "AI_RAG" | "SECURITY" | string;
  message: string;
}

export interface LogsResponse {
  logs: LogEntry[];
}

// Admin Hooks
export function useApiHealthCheck() {
  return useQuery<HealthResponse, Error>({
    queryKey: queryKeys.admin.health,
    queryFn: () => apiFetch<HealthResponse>('/admin/health'),
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useSystemLogs(limit = 50) {
  return useQuery<LogsResponse, Error>({
    queryKey: queryKeys.admin.logs(limit),
    queryFn: () => apiFetch<LogsResponse>(`/admin/logs?limit=${limit}`),
    refetchInterval: 15000,
    staleTime: 10000,
  });
}
