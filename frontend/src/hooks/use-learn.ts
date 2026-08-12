import { useQuery } from "@tanstack/react-query";
import { academicService } from "@/services/academic.service";
import { LearnSubject, LearnChapter, LearnTopic } from "@/types";

export function useLearnCatalog(gradeId?: string) {
    return useQuery({
        queryKey: ["learn", "catalog", gradeId],
        queryFn: () => academicService.getLearnCatalog(gradeId ? { grade_id: gradeId } : undefined),
        staleTime: 1000 * 60 * 10,
    });
}

export function useSubjectChapters(subjectId: string) {
    return useQuery({
        queryKey: ["learn", "subject", subjectId, "chapters"],
        queryFn: () => academicService.getSubjectChapters(subjectId),
        enabled: !!subjectId,
        staleTime: 1000 * 60 * 5,
    });
}

export function useChapterDetail(subjectId: string, chapterId: string) {
    return useQuery({
        queryKey: ["learn", "subject", subjectId, "chapter", chapterId],
        queryFn: () => academicService.getChapterDetail(subjectId, chapterId),
        enabled: !!subjectId && !!chapterId,
        staleTime: 1000 * 60 * 5,
    });
}

export function getProgressColor(pct: number): "green" | "amber" | "red" | "grey" {
    if (pct >= 100) return "green";
    if (pct >= 70) return "amber";
    if (pct > 0) return "red";
    return "grey";
}

export function getProgressLabel(pct: number): string {
    if (pct >= 100) return "Dikuasai";
    if (pct >= 70) return "Sebagian dikuasai";
    if (pct > 0) return "Perlu peningkatan";
    return "Belum mulai";
}
