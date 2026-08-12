// frontend/src/app/(siswa)/materials/[subjectId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { academicService } from "@/services/academic.service";
import { LearnSubject, LearnChapter } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, BookOpen, ChevronDown, CheckCircle2, Flag, Play } from "lucide-react";

const DEFAULT_SUBJECT: LearnSubject = {
    subject_id: "mtk",
    subject_name: "Matematika",
    icon: "calc",
    icon_color: "#2563eb",
    total_children: 8,
    completed_children: 5,
    progress_pct: 72,
    is_mastered: false,
};

const DEFAULT_CHAPTERS: LearnChapter[] = [
    { chapter_id: "c1", subject_id: "mtk", title: "Aljabar & Fungsi", order_index: 1, progress_pct: 100, correct_count: 52, target_correct: 50, status: "green" },
    { chapter_id: "c2", subject_id: "mtk", title: "Persamaan Kuadrat", order_index: 2, progress_pct: 100, correct_count: 51, target_correct: 50, status: "green" },
    { chapter_id: "c3", subject_id: "mtk", title: "Trigonometri", order_index: 3, progress_pct: 100, correct_count: 56, target_correct: 50, status: "green" },
    { chapter_id: "c4", subject_id: "mtk", title: "Limit & Turunan", order_index: 4, progress_pct: 100, correct_count: 50, target_correct: 50, status: "green" },
    { chapter_id: "c5", subject_id: "mtk", title: "Integral", order_index: 5, progress_pct: 96, correct_count: 48, target_correct: 50, status: "amber" },
    { chapter_id: "c6", subject_id: "mtk", title: "Matriks & Vektor", order_index: 6, progress_pct: 88, correct_count: 44, target_correct: 50, status: "amber" },
    { chapter_id: "c7", subject_id: "mtk", title: "Peluang & Statistika", order_index: 7, progress_pct: 100, correct_count: 50, target_correct: 50, status: "green" },
    { chapter_id: "c8", subject_id: "mtk", title: "Lingkaran & Irisan Kerucut", order_index: 8, progress_pct: 12, correct_count: 6, target_correct: 50, status: "red" },
];

const MASTER_TOTAL = 8;

function statusMeta(st: LearnChapter["status"]) {
    switch (st) {
        case "green":
            return { label: "Dikuasai", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", bar: "#16a34a", num: "#16a34a" };
        case "amber":
            return { label: "Berjalan", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", bar: "#f97316", num: "#d97706" };
        case "red":
            return { label: "Perlu Peningkatan", cls: "bg-red-500/10 text-red-600 border-red-500/20", bar: "#ef4444", num: "#ef4444" };
        default:
            return { label: "Belum mulai", cls: "bg-muted text-muted-foreground border-border", bar: "#e2e8f0", num: "#94a3b8" };
    }
}

export default function SubjectChaptersPage() {
    const params = useParams();
    const subjectId = (params?.subjectId as string) || "mtk";

    const [subject, setSubject] = useState<LearnSubject | null>(null);
    const [chapters, setChapters] = useState<LearnChapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [defChips, setDefChips] = useState<Record<string, { done_topics: number; total_topics: number }>>({
        c1: { done_topics: 12, total_topics: 12 },
        c2: { done_topics: 8, total_topics: 8 },
        c3: { done_topics: 10, total_topics: 10 },
        c4: { done_topics: 9, total_topics: 9 },
        c5: { done_topics: 7, total_topics: 9 },
        c6: { done_topics: 6, total_topics: 8 },
        c7: { done_topics: 11, total_topics: 11 },
        c8: { done_topics: 1, total_topics: 7 },
    });

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await academicService.getSubjectChapters(subjectId);
                if (res && Array.isArray(res.chapters) && res.chapters.length > 0) {
                    setSubject({ ...DEFAULT_SUBJECT, ...res.subject, subject_id: subjectId });
                    setChapters(res.chapters);
                } else {
                    setSubject({ ...DEFAULT_SUBJECT, subject_id: subjectId });
                    setChapters(DEFAULT_CHAPTERS);
                }
            } catch {
                setSubject({ ...DEFAULT_SUBJECT, subject_id: subjectId });
                setChapters(DEFAULT_CHAPTERS);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [subjectId]);

    const greenCount = chapters.filter((c) => c.status === "green").length;

    return (
        <AppShell>
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/materials" className="hover:text-primary font-medium">
                        Belajar
                    </Link>
                    <span className="text-muted-foreground/40">/</span>
                    <span className="text-foreground font-semibold">
                        {subject?.subject_name || "Mapel"}
                    </span>
                </div>

                {/* Chrome header of the subject */}
                {loading ? (
                    <Card className="p-5 flex items-center gap-4">
                        <Skeleton className="h-14 w-14 rounded-2xl" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-3 w-60" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-10 w-28" />
                    </Card>
                ) : subject ? (
                    <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <span
                            className="h-14 w-14 rounded-2xl flex items-center justify-center text-white flex-none"
                            style={{ background: subject.icon_color || "#2563eb" }}
                        >
                            <BookOpen className="h-7 w-7" />
                        </span>
                        <div className="flex-1 min-w-0">
                            <h1 className="font-heading text-xl font-extrabold">{subject.subject_name}</h1>
                            <p className="text-[13px] text-muted-foreground mt-0.5">
                                Kelas 12 · UTBK · {subject.total_children} bab
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>{greenCount} dari {subject.total_children} bab hijau</span>
                                <span className="font-bold text-foreground">{Math.round(subject.progress_pct)}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2 max-w-xs">
                                <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${subject.progress_pct}%` }}
                                />
                            </div>
                        </div>
                    </Card>
                ) : null}

                {/* Chapter list */}
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i} className="p-4">
                                <Skeleton className="h-5 w-56" />
                                <Skeleton className="h-2 w-full mt-3" />
                                <Skeleton className="h-3 w-32 mt-2" />
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {chapters.map((ch) => {
                            const meta = statusMeta(ch.status);
                            const chips = defChips[ch.chapter_id] || { done_topics: 0, total_topics: 0 };
                            const dfltOpen = ch.status !== "green" && ch.status !== "red";

                            return (
                                <Card key={ch.chapter_id} className={cn("overflow-hidden", ch.status === "green" && "border-emerald-500/30")}>
                                    <Collapsible defaultOpen={ch.order_index === 1}>
                                        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left">
                                            <span
                                                className={cn(
                                                    "h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm flex-none",
                                                    ch.status === "green"
                                                        ? "bg-emerald-500/10 text-emerald-600"
                                                        : ch.status === "red"
                                                            ? "bg-red-500/10 text-red-600"
                                                            : "bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {ch.order_index}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm text-foreground">
                                                    Bab {ch.order_index} · {ch.title}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <Badge variant="outline" className={cn("text-[10px] font-semibold", meta.cls)}>
                                                        {meta.label}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        benar {ch.correct_count}/{ch.target_correct}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="hidden sm:flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] text-muted-foreground">Progres</span>
                                                    <span className="text-xs font-bold font-mono" style={{ color: meta.num }}>
                                                        {ch.progress_pct}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ width: `${ch.progress_pct}%`, background: meta.bar }}
                                                    />
                                                </div>
                                            </div>
                                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform [&[data-open]]:rotate-180 group-data-[panel-open]:rotate-180" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="px-4 pb-4 pt-2 border-t border-border/40">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="rounded-xl bg-muted/50 p-3">
                                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                                            Topik dikuasai
                                                        </div>
                                                        <div className="font-bold text-sm text-foreground mt-0.5">
                                                            {chips.done_topics} topik
                                                        </div>
                                                    </div>
                                                    <div className="rounded-xl bg-muted/50 p-3">
                                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                                            Target bab
                                                        </div>
                                                        <div className="font-bold text-sm text-foreground mt-0.5">
                                                            {ch.correct_count}/{ch.target_correct} benar
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                    <Button asChild size="sm" className="rounded-lg text-xs font-semibold">
                                                        <Link href={`/materials/${subjectId}/${ch.chapter_id}`}>
                                                            {ch.status === "green" ? "Tinjau Bab" : "Buka Bab"} <Play className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                    {(ch.quiz_exam_id || ch.status !== "green") && (
                                                        <Button asChild size="sm" variant="outline" className="rounded-lg text-xs font-semibold">
                                                            <Link href={ch.quiz_exam_id ? `/exams/${ch.quiz_exam_id}` : "/exams"}>
                                                                <CheckCircle2 className="h-3.5 w-3.5" /> Kerjakan Ujian Bab
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Back to catalog */}
                <div className="pt-2">
                    <Button asChild variant="ghost" size="sm" className="gap-2 text-xs">
                        <Link href="/materials">
                            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Mapel
                        </Link>
                    </Button>
                </div>
            </div>
        </AppShell>
    );
}