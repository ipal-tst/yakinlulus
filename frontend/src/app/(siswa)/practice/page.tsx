// frontend/src/app/(siswa)/practice/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { EmptyState } from "@/components/siswa/EmptyState";
import { SectionHeader } from "@/components/siswa/SectionHeader";
import { GradeBadge } from "@/components/siswa/GradeBadge";
import { useAuthStore } from "@/stores/auth.store";
import {
    academicService,
    PracticeStartPayload,
} from "@/services/academic.service";
import {
    PracticeCatalog,
    PracticeSubjectNode,
    PracticeChapterNode,
    PracticeHistoryItem,
    ProgressStatus,
    formatDuration,
} from "@/types/siswa";
import { cn } from "@/lib/utils";
import {
    BookOpen,
    CheckCircle2,
    Clock,
    History,
    Play,
    Target,
    PlusCircle,
    ArrowRight,
} from "lucide-react";

const SUBJECT_ICONS: Record<string, string> = {
    calc: "📘",
    book: "📗",
    atom: "🧪",
    flask: "✨",
    history: "📜",
    globe: "🌏",
    pencil: "✏️",
};

function subjectEmoji(icon: string | undefined): string {
    if (!icon) return "📘";
    return SUBJECT_ICONS[icon.toLowerCase()] ?? "📘";
}

function barClass(status: ProgressStatus): string {
    if (status === "GREEN") return "bg-emerald-500";
    if (status === "AMBER") return "bg-amber-500";
    return "bg-muted-foreground/50";
}

function StatusBadge({ status }: { status: ProgressStatus }) {
    if (status === "GREEN") {
        return (
            <Badge
                variant="outline"
                className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 shrink-0"
            >
                <CheckCircle2 className="h-3.5 w-3.5" /> HIJAU
            </Badge>
        );
    }
    if (status === "AMBER") {
        return (
            <Badge
                variant="outline"
                className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 shrink-0"
            >
                <Clock className="h-3.5 w-3.5" /> BELUM
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="text-muted-foreground shrink-0">
            BELUM
        </Badge>
    );
}

function historyTitle(item: PracticeHistoryItem): string {
    const s = item.scope;
    const parts = [s.subject_name, s.chapter_title, s.topic_title].filter(
        (x): x is string => Boolean(x)
    );
    return parts.join(" · ") || "Latihan";
}

function CatalogSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <Card className="p-0">
                <div className="divide-y divide-border">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="p-5 space-y-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-11 w-11 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-2.5 w-full" />
                                </div>
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                            <div className="ml-14 space-y-2">
                                <Skeleton className="h-4 w-52" />
                                <Skeleton className="h-4 w-44" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
            <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[0, 1].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function PracticePage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [catalog, setCatalog] = useState<PracticeCatalog | null>(null);
    const [historyItems, setHistoryItems] = useState<PracticeHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startingKey, setStartingKey] = useState<string | null>(null);
    const [startError, setStartError] = useState<string | null>(null);
    const [openSubjects, setOpenSubjects] = useState<string[]>([]);
    const [openChapters, setOpenChapters] = useState<string[]>([]);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const [cat, history] = await Promise.all([
                    academicService.getPracticeCatalog(),
                    academicService.getPracticeHistory({ page: 1, limit: 5 }),
                ]);
                if (cancelled) return;
                setCatalog(cat);
                const items = Array.isArray(history)
                    ? history
                    : (history?.items ?? []);
                setHistoryItems(items.filter((it) => it && it.session_id));
            } catch {
                if (!cancelled) setError("Gagal memuat daftar latihan.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    const handleStart = useCallback(
        async (key: string, payload: PracticeStartPayload) => {
            if (startingKey) return;
            setStartError(null);
            setStartingKey(key);
            try {
                const res = await academicService.startPractice(payload);
                router.push(`/practice/${res.session_id}`);
            } catch {
                setStartError("Gagal memulai latihan. Silakan coba lagi.");
                setStartingKey(null);
            }
        },
        [router, startingKey]
    );

    const threshold = catalog?.config?.threshold ?? 85;
    const subjects = catalog?.subjects ?? [];

    return (
        <AppShell>
            <div className="space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="font-heading text-2xl font-bold tracking-tight">
                                Halo {user?.full_name || "Siswa"}!
                            </h1>
                            <GradeBadge
                                educationLevel={user?.education_level}
                                grade={user?.grade}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Latihan mengikuti kurikulummu — hijau = akurasi ≥{" "}
                            {threshold}% benar di seluruh attempt.
                        </p>
                    </div>
                    <Badge
                        variant="outline"
                        className="gap-1.5 px-3 py-1.5 rounded-full text-xs bg-primary/10 border-primary/20 text-primary self-start lg:self-center"
                    >
                        <Target className="h-3.5 w-3.5" /> threshold penguasaan: ≥
                        {threshold}%
                    </Badge>
                </div>

                {loading ? (
                    <CatalogSkeleton />
                ) : error ? (
                    <EmptyState
                        icon={BookOpen}
                        title="Gagal Memuat Latihan"
                        description={error}
                        actionLabel="Muat Ulang"
                        onAction={() => setReloadKey((k) => k + 1)}
                    />
                ) : subjects.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        title="Belum Ada Latihan"
                        description="Latihan soal akan muncul di sini setelah tersedia untuk jenjangmu."
                        actionLabel="Muat Ulang"
                        onAction={() => setReloadKey((k) => k + 1)}
                    />
                ) : (
                    <>
                        <div>
                            <SectionHeader
                                icon={BookOpen}
                                title="Daftar Latihan"
                                subtitle="Pilih mapel → bab → topik. Hijau = sudah dikuasai (≥ threshold)."
                            />

                            {startError && (
                                <p className="mt-3 text-xs text-red-600 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                                    {startError}
                                </p>
                            )}

                            <Card className="mt-4 p-0 overflow-hidden">
                                <Accordion
                                    multiple
                                    value={openSubjects}
                                    onValueChange={(value) =>
                                        setOpenSubjects([...(value as string[])])
                                    }
                                >
                                    {subjects.map((subject) => (
                                        <SubjectAccordion
                                            key={subject.subject_id}
                                            subject={subject}
                                            openChapters={openChapters}
                                            onChaptersChange={setOpenChapters}
                                            startingKey={startingKey}
                                            onStart={handleStart}
                                        />
                                    ))}
                                </Accordion>
                            </Card>
                        </div>

                        <div>
                            <SectionHeader
                                icon={History}
                                title="Riwayat Latihan"
                                subtitle="Latihan terakhir yang kamu kerjakan."
                            />
                            <div className="mt-4">
                                {historyItems.length === 0 ? (
                                    <EmptyState
                                        compact
                                        icon={History}
                                        title="Belum ada riwayat latihan"
                                        description="Mulai latihan pertamamu dari daftar di atas."
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {historyItems.map((item) => {
                                            const green =
                                                item.accuracy_pct >= 85;
                                            return (
                                                <Link
                                                    key={item.session_id}
                                                    href={`/practice/${item.session_id}/review`}
                                                >
                                                    <Card className="p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all group">
                                                        <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                                                            <History className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                                {historyTitle(item)}
                                                            </p>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <span
                                                                    className={cn(
                                                                        "font-semibold",
                                                                        green
                                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                                            : "text-amber-600 dark:text-amber-400"
                                                                    )}
                                                                >
                                                                    {item.correct}/{item.total} benar
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3.5 w-3.5" />
                                                                    {formatDuration(
                                                                        item.duration_seconds
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="sm"
                                                            className="rounded-xl gap-1.5 shrink-0"
                                                        >
                                                            <span>
                                                                Pembahasan{" "}
                                                                <ArrowRight className="h-3.5 w-3.5" />
                                                            </span>
                                                        </Button>
                                                    </Card>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
}

function ChapterTopics({
    chapter,
    subject,
    startingKey,
    onStart,
}: {
    chapter: PracticeChapterNode;
    subject: PracticeSubjectNode;
    startingKey: string | null;
    onStart: (key: string, payload: PracticeStartPayload) => void;
}) {
    const hasQuestions = chapter.topics.some((t) => t.question_count > 0);
    const chapterKey = `chapter-${chapter.chapter_id}`;
    const isChapterStarting = startingKey === chapterKey;

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 py-2.5 px-1">
                <p className="text-xs text-muted-foreground font-medium">
                    Kerjakan semua soal level bab sekaligus.
                </p>
                <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs shrink-0"
                    disabled={!hasQuestions || isChapterStarting}
                    onClick={() =>
                        hasQuestions &&
                        onStart(chapterKey, {
                            level: "CHAPTER",
                            subject_id: subject.subject_id,
                            chapter_id: chapter.chapter_id,
                        })
                    }
                >
                    <PlusCircle className="h-3.5 w-3.5" />
                    {isChapterStarting ? "Memulai..." : "Mulai Bab"}
                </Button>
            </div>

            {chapter.topics.map((topic) => {
                const canStart = topic.question_count > 0;
                const key = `topic-${topic.topic_id}`;
                const isStarting = startingKey === key;
                return (
                    <div
                        key={topic.topic_id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 px-1 border-t border-border/60"
                    >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span
                                className={cn(
                                    "h-2 w-2 rounded-full shrink-0",
                                    topic.status === "GREEN"
                                        ? "bg-emerald-500"
                                        : topic.status === "AMBER"
                                          ? "bg-amber-500"
                                          : "bg-muted-foreground/40"
                                )}
                            />
                            <span className="text-sm font-medium text-foreground truncate">
                                {topic.title}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                            <span className="text-xs text-muted-foreground w-10 text-right">
                                {topic.question_count} soal
                            </span>
                            <div className="w-24">
                                <Progress
                                    value={Math.round(topic.progress_pct)}
                                    className="h-2"
                                    indicatorClassName={barClass(topic.status)}
                                />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground w-9 text-right">
                                {Math.round(topic.progress_pct)}%
                            </span>
                            <StatusBadge status={topic.status} />
                            <Button
                                size="sm"
                                className="rounded-xl text-xs shrink-0"
                                disabled={!canStart || isStarting}
                                onClick={() =>
                                    canStart &&
                                    onStart(key, {
                                        level: "TOPIC",
                                        subject_id: subject.subject_id,
                                        chapter_id: chapter.chapter_id,
                                        topic_id: topic.topic_id,
                                    })
                                }
                            >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                {isStarting ? "Memulai..." : "Mulai"}
                            </Button>
                        </div>
                    </div>
                );
            })}

            {chapter.topics.length === 0 && (
                <p className="text-xs text-muted-foreground py-3 px-1">
                    Belum ada topik untuk bab ini.
                </p>
            )}
        </div>
    );
}

function SubjectAccordion({
    subject,
    openChapters,
    onChaptersChange,
    startingKey,
    onStart,
}: {
    subject: PracticeSubjectNode;
    openChapters: string[];
    onChaptersChange: (value: string[]) => void;
    startingKey: string | null;
    onStart: (key: string, payload: PracticeStartPayload) => void;
}) {
    const greenChapters = subject.chapters.filter(
        (c) => c.status === "GREEN"
    ).length;
    const chaptersTotal = subject.chapters.length;

    return (
        <AccordionItem
            value={subject.subject_id}
            className="border-b border-border last:border-0"
        >
            <AccordionTrigger className="px-5 py-4 hover:no-underline gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <span
                        className="h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: subject.color || "#2563eb" }}
                    >
                        {subjectEmoji(subject.icon)}
                    </span>
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-bold text-sm text-foreground">
                                {subject.subject_name}
                            </span>
                            {chaptersTotal > 0 && (
                                <Badge
                                    variant="outline"
                                    className="text-[10px] font-semibold bg-muted/60"
                                >
                                    {greenChapters}/{chaptersTotal} bab hijau
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Progress
                                value={Math.round(subject.progress_pct)}
                                className="h-2 flex-1"
                                indicatorClassName={barClass(subject.status)}
                            />
                            <span className="text-xs font-semibold text-muted-foreground shrink-0">
                                {Math.round(subject.progress_pct)}%
                            </span>
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
                <Accordion
                    multiple
                    value={openChapters}
                    onValueChange={(value) =>
                        onChaptersChange([...(value as string[])])
                    }
                >
                    {subject.chapters.map((chapter) => (
                        <AccordionItem
                            key={chapter.chapter_id}
                            value={chapter.chapter_id}
                            className="border-b border-border/60 last:border-0"
                        >
                            <AccordionTrigger className="py-3 px-0 hover:no-underline gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <span className="text-sm font-semibold text-foreground truncate block">
                                            {chapter.title}
                                        </span>
                                        <div className="flex items-center gap-2.5">
                                            <Progress
                                                value={Math.round(
                                                    chapter.progress_pct
                                                )}
                                                className="h-1.5 w-28"
                                                indicatorClassName={barClass(
                                                    chapter.status
                                                )}
                                            />
                                            <span className="text-[11px] font-semibold text-muted-foreground">
                                                {Math.round(
                                                    chapter.progress_pct
                                                )}
                                                %
                                            </span>
                                        </div>
                                    </div>
                                    <StatusBadge status={chapter.status} />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-3">
                                <ChapterTopics
                                    chapter={chapter}
                                    subject={subject}
                                    startingKey={startingKey}
                                    onStart={onStart}
                                />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                {chaptersTotal === 0 && (
                    <p className="text-xs text-muted-foreground py-2">
                        Belum ada bab untuk mapel ini.
                    </p>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}