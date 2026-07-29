/**
 * usePracticeSession — manage practice session lifecycle
 * start, submit, stats, subject breakdown
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type {
  PracticeSession,
  PracticeStats,
  StartPracticeRequest,
  SubmitPracticeRequest,
} from '@/types/practice';

export function useStartPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: StartPracticeRequest) =>
      apiFetch<PracticeSession>('/practice/sessions/start', { method: 'POST', body: JSON.stringify(req) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['practice'] }),
  });
}

export function usePracticeSession(id: string | undefined) {
  return useQuery({
    queryKey: ['practice', 'session', id],
    queryFn: () => apiFetch<PracticeSession>(`/practice/${id}`),
    enabled: !!id,
  });
}

export function useSubmitPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: SubmitPracticeRequest) =>
      apiFetch<PracticeSession>(`/practice/${req.session_id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: req.answers }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });
}

export function usePracticeStats() {
  return useQuery({
    queryKey: ['practice', 'stats'],
    queryFn: () => apiFetch<PracticeStats>('/practice/stats'),
  });
}

export function useSubjectBreakdown(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['results', 'subject-breakdown', sessionId],
    queryFn: () => apiFetch(`/results/${sessionId}/subject-breakdown`),
    enabled: !!sessionId,
  });
}
