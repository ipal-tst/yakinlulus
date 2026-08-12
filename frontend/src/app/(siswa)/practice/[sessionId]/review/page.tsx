// frontend/src/app/(siswa)/practice/[sessionId]/review/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/siswa/EmptyState";
import { ProgressRing } from "@/components/siswa/ProgressRing";
import { SectionHeader } from "@/components/siswa/SectionHeader";
import { academicService } from "@/services/academic.service";
import {
    PracticeReview,
    PracticeReviewQuestion,
    PracticeScope,
    PracticeSubmitResult,
    formatDuration,
} from "@/types/siswa";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    HelpCircle,
    Lightbulb,
    RotateCcw,
    XCircle,
    BookOpen,
    Trophy,
} from "lucide-react";

function formatScopeTitle(scope: PracticeScope | undefined): string {
    if (!scope) return "Latihan";
    const parts = [
        scope.subject_name,
        scope.chapter_title,
        scope.topic_title,
    ].filter((x): x is string => Boolean(x));
    return parts.join(" · ") || "Latihan";
}

function ReviewSkeleton() {
    return (
        <AppShell>
            <div className="max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-48 w-full rounded-3xl" />
                {[0, 1].map((i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                    </div>
                ))}
            </div>
        </AppShell>
    );
}

function ReviewList() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params?.sessionId as string;

    const [result, setResult] = useState<PracticeSubmitResult | null>(null);
    const [review, setReview] = useState<PracticeReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retrying, setRetrying] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const [res, rev] = await Promise.all([
                    academicService.getPracticeResult(sessionId),
                    academicService.getPracticeReview(sessionId),
                ]);
                if (cancelled) return;
                setResult(res);
                setReview(rev);
            } catch {
                if (!cancelled)
                    setError(
                        "Hasil latihan tidak ditemukan atau tidak dapat dimuat."
                    );
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [sessionId, reloadKey]);

    const handleRetry = useCallback(async () => {
        const scope = result?.scope ?? review?.scope;
        if (!scope || retrying) return;
        setRetrying(true);
        try {
            const started = await academicService.startPractice({
                level: scope.level,
                subject_id: scope.subject_id,
                chapter_id: scope.chapter_id,
                topic_id: scope.topic_id,
            });
            router.push(`/practice/${started.session_id}`);
        } catch {
            setRetrying(false);
            setError("Gagal memulai latihan ulang. Silakan coba lagi.");
        }
    }, [result, review, retrying, router]);

    const scope = result?.scope ?? review?.scope;
    const scopeTitle = formatScopeTitle(scope);
    const questions: PracticeReviewQuestion[] = review?.questions ?? [];
    const accuracy = Math.round(result?.accuracy_pct ?? 0);

    return (
        <AppShell>
            <div className="mx-auto max-w-4xl space-y-6 pb-12">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/practice">
                                Latihan
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Pembahasan</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {loading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-48 w-full rounded-3xl" />
                        <div className="space-y-4">
                            {[0, 1, 2].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-56 w-full rounded-3xl"
                                />
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <EmptyState
                        icon={BookOpen}
                        title="Hasil Tidak Ditemukan"
                        description={error}
                        actionLabel="Muat Ulang"
                        onAction={() => setReloadKey((k) => k + 1)}
                    />
                ) : !result ? (
                    <EmptyState
                        icon={BookOpen}
                        title="Hasil Tidak Tersedia"
                        description="Latihan ini belum memiliki hasil. Kerjakan latihan untuk melihat pembahasannya."
                        actionLabel="Kembali ke Latihan"
                        actionHref="/practice"
                    />
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="gap-2 rounded-xl text-xs"
                            >
                                <Link href="/practice">
                                    <ArrowLeft className="h-4 w-4" /> Kembali
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRetry}
                                disabled={retrying || !scope}
                                className="rounded-xl text-xs gap-1.5"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />{" "}
                                {retrying ? "Memulai..." : "Ulangi Latihan"}
                            </Button>
                        </div>

                        <Card className="p-6 md:p-8 rounded-3xl border-border/80">
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <ProgressRing
                                    value={accuracy}
                                    size={128}
                                    strokeWidth={12}
                                    label={`${accuracy}%`}
                                    sublabel="Akurasi"
                                    colorClass={
                                        result.passed
                                            ? "stroke-emerald-500"
                                            : "stroke-amber-500"
                                    }
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="font-heading text-xl font-bold text-foreground">
                                            Hasil Latihan
                                        </h1>
                                        {result.passed ? (
                                            <Badge
                                                variant="success"
                                                className="gap-1 text-[10px]"
                                            >
                                                <Trophy className="h-3 w-3" />{" "}
                                                LULUS
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="destructive"
                                                className="gap-1 text-[10px]"
                                            >
                                                <XCircle className="h-3 w-3" />{" "}
                                                BELUM LULUS
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground font-medium">
                                        {scopeTitle}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {result.passed
                                            ? `Capaianmu ≥ ambang penguasaan. Pertahankan!`
                                            : "Terus berlatih untuk mencapai ambang penguasaan."}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                                    <span className="font-bold text-xl text-emerald-600 block">
                                        {result.correct}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                        Benar
                                    </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                                    <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                                    <span className="font-bold text-xl text-red-600 block">
                                        {result.wrong}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                        Salah
                                    </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                                    <HelpCircle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                                    <span className="font-bold text-xl text-amber-600 block">
                                        {result.unanswered}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                        Kosong
                                    </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                                    <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                                    <span className="font-bold text-xl text-primary block">
                                        {formatDuration(result.duration_seconds)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                        Waktu
                                    </span>
                                </div>
                            </div>
                        </Card>

                        <div>
                            <SectionHeader
                                icon={BookOpen}
                                title="Pembahasan Soal"
                                subtitle="Soal disusun vertikal. Kunci jawaban di-highlight hijau."
                            />
                        </div>

                        <div className="space-y-4">
                            {questions.length === 0 ? (
                                <EmptyState
                                    icon={BookOpen}
                                    title="Belum Ada Pembahasan"
                                    description="Belum ada pembahasan untuk latihan ini."
                                />
                            ) : (
                                questions.map((q) => (
                                    <ReviewQuestionCard
                                        key={q.number}
                                        question={q}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
}

function ReviewQuestionCard({ question: q }: { question: PracticeReviewQuestion }) {
    const status = q.selected_key
        ? q.is_correct
            ? "correct"
            : "incorrect"
        : "skipped";

    return (
        <Card className="p-0 overflow-hidden rounded-3xl">
            <div className="p-4 md:p-5 border-b border-border/50">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span
                        className={cn(
                            "h-7 w-7 rounded-xl font-bold text-xs flex items-center justify-center",
                            status === "correct" &&
                                "bg-emerald-500/10 text-emerald-600",
                            status === "incorrect" &&
                                "bg-red-500/10 text-red-600",
                            status === "skipped" &&
                                "bg-amber-500/10 text-amber-600"
                        )}
                    >
                        #{q.number}
                    </span>
                    <span className="font-medium text-sm text-foreground">
                        Soal {q.number}
                    </span>
                    {status === "correct" && (
                        <Badge
                            variant="success"
                            className="gap-1 text-[10px]"
                        >
                            <CheckCircle2 className="h-3 w-3" /> Benar
                        </Badge>
                    )}
                    {status === "incorrect" && (
                        <Badge
                            variant="destructive"
                            className="gap-1 text-[10px]"
                        >
                            <XCircle className="h-3 w-3" /> Salah
                        </Badge>
                    )}
                    {status === "skipped" && (
                        <Badge variant="outline" className="text-[10px]">
                            Tidak dijawab
                        </Badge>
                    )}
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {q.content}
                </p>
            </div>

            <div className="p-4 md:p-5 space-y-4">
                <div className="space-y-2">
                    {q.options.map((opt) => {
                        const isCorrect = opt.is_correct;
                        const isUserChoice =
                            q.selected_key !== undefined &&
                            q.selected_key === opt.key;
                        const isWrongChoice = isUserChoice && !isCorrect;
                        return (
                            <div
                                key={opt.key}
                                className={cn(
                                    "p-3 rounded-xl border flex items-center gap-3 text-xs",
                                    isCorrect
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-medium"
                                        : isWrongChoice
                                          ? "border-red-500 bg-red-500/10 text-red-900 dark:text-red-300"
                                          : "border-border/70 bg-card text-muted-foreground"
                                )}
                            >
                                <span className="font-mono font-bold">
                                    {opt.key}.
                                </span>
                                <span className="flex-1">{opt.text}</span>
                                {isCorrect && (
                                    <Badge
                                        variant="success"
                                        className="text-[10px] font-bold shrink-0"
                                    >
                                        Kunci
                                    </Badge>
                                )}
                                {isWrongChoice && (
                                    <Badge
                                        variant="destructive"
                                        className="text-[10px] font-bold shrink-0"
                                    >
                                        Jawaban Kamu
                                    </Badge>
                                )}
                            </div>
                        );
                    })}
                </div>

                {q.explanation && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            <h4 className="font-bold text-sm text-primary">
                                Pembahasan
                            </h4>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                            {q.explanation}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}

export default function PracticeReviewPage() {
    return (
        <Suspense fallback={<ReviewSkeleton />}>
            <ReviewList />
        </Suspense>
    );
}