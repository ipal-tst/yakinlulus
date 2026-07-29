/**
 * useExamSession — manage CBT exam session lifecycle
 * start, sync, pause, resume, finish, violations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ExamSession, ExamQuestion, ExamAnswer } from '@/types/exam';

export function useStartExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) => apiFetch<ExamSession>(`/cbt/${examId}/start`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbt'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function useExamSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['cbt', 'session', sessionId],
    queryFn: () => apiFetch<ExamSession>(`/cbt/${sessionId}`),
    enabled: !!sessionId,
    refetchInterval: 30_000, // refresh every 30s for time sync
  });
}

export function useExamQuestions(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['cbt', 'questions', sessionId],
    queryFn: () => apiFetch<ExamQuestion[]>(`/cbt/${sessionId}/questions`),
    enabled: !!sessionId,
  });
}

export function useSyncAnswers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, answers }: { sessionId: string; answers: ExamAnswer[] }) =>
      apiFetch(`/cbt/${sessionId}/sync`, { method: 'POST', body: JSON.stringify({ answers }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cbt'] }),
  });
}

export function usePauseExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => apiFetch(`/cbt/${sessionId}/pause`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cbt'] }),
  });
}

export function useResumeExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => apiFetch(`/cbt/${sessionId}/resume`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cbt'] }),
  });
}

export function useFinishExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => apiFetch<ExamSession>(`/cbt/${sessionId}/finish`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbt'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });
}

export function useReportViolation() {
  return useMutation({
    mutationFn: ({ sessionId, type }: { sessionId: string; type: string }) =>
      apiFetch(`/cbt/${sessionId}/violation`, { method: 'POST', body: JSON.stringify({ type }) }),
  });
}
