// frontend/src/app/(siswa)/exams/[id]/cbt/review/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    academicService,
    CBTSessionReview,
    CBTSessionReviewQuestion,
} from "@/services/academic.service";
import { formatDuration } from "@/types/siswa";
import { cn } from "@/lib/utils";
import {
    Trophy,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Clock,
    RotateCcw,
    ListChecks,
    BookOpen,
    Lightbulb,
    AlertCircle,
    ArrowRight,
} from "lucide-react";

type QuestionStatus = "correct" | "wrong" | "unanswered";

function resolveStatus(q: CBTSessionReviewQuestion): QuestionStatus {
    if (q.is_correct === true) return "correct";
    if (q.is_correct === false) return "wrong";
    if (q.selected_option_id) return "wrong";
    return "unanswered";
}

function ReviewSummary({ review }: { review: CBTSessionReview }) {
    return (
        <Card className="p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary text-primary-foreground">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="font-heading font-bold text-xl text-foreground">Hasil Ujian</h1>
                        {review.exam_title && (
                            <p className="text-xs text-muted-foreground mt-0.5">{review.exam_title}</p>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-xs text-muted-foreground font-medium block">Skor Kamu</span>
                    <div className="font-mono font-bold text-4xl text-primary mt-1">
                        {Number.isFinite(Number(review.score)) ? review.score : "-"}
                    </div>
                    {Number.isFinite(Number(review.passing_grade)) && (
                        <span className="text-[11px] text-muted-foreground">Passing {review.passing_grade}</span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
                {review.is_passed ? (
                    <Badge className="bg-emerald-500 text-white text-[11px] gap-1">
                        <CheckCircle2 className="h-3 w-3" /> LULUS
                    </Badge>
                ) : (
                    <Badge variant="destructive" className="text-[11px] gap-1">
                        <XCircle className="h-3 w-3" /> BELUM LULUS
                    </Badge>
                )}
                {Number.isFinite(Number(review.duration_seconds)) && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDuration(review.duration_seconds)}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                    <span className="font-bold text-xl text-emerald-600 block">{review.correct_count}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Benar</span>
                </div>
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                    <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                    <span className="font-bold text-xl text-red-600 block">{review.wrong_count}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Salah</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <HelpCircle className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                    <span className="font-bold text-xl text-amber-600 block">{review.unanswered_count}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Kosong</span>
                </div>
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                    <ListChecks className="h-6 w-6 text-primary mx-auto mb-1" />
                    <span className="font-bold text-xl text-primary block">{review.total_questions}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Total Soal</span>
                </div>
            </div>
        </Card>
    );
}

function ReviewQuestionCard({ q }: { q: CBTSessionReviewQuestion }) {
    const status = resolveStatus(q);
    const hasOptions = Array.isArray(q.options) && q.options.length > 0;

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span
                        className={cn(
                            "h-7 w-7 rounded-xl font-bold text-xs flex items-center justify-center",
                            status === "correct" && "bg-emerald-500/10 text-emerald-600",
                            status === "wrong" && "bg-red-500/10 text-red-600",
                            status === "unanswered" && "bg-amber-500/10 text-amber-600"
                        )}
                    >
                        #{q.display_order}
                    </span>
                    {q.subject_name && <Badge variant="outline" className="text-[10px]">{q.subject_name}</Badge>}
                    {status === "correct" && (
                        <Badge className="bg-emerald-500 text-white text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Benar
                        </Badge>
                    )}
                    {status === "wrong" && (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                            <XCircle className="h-3 w-3" /> Salah
                        </Badge>
                    )}
                    {status === "unanswered" && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 gap-1">
                            <HelpCircle className="h-3 w-3" /> Tidak dijawab
                        </Badge>
                    )}
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {q.content || q.question || ""}
                </p>
            </div>

            <div className="p-5 space-y-4">
                {hasOptions ? (
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground">Opsi Jawaban:</h4>
                        {q.options!.map((opt, idx) => {
                            const isCorrectOpt =
                                opt.is_correct === true ||
                                (!!opt.id && opt.id === q.correct_option) ||
                                (!!opt.label && opt.label === q.correct_option);
                            const isUserChoice =
                                (!!opt.id && opt.id === q.selected_option_id) ||
                                (!!opt.label && opt.label === q.selected_option_id);
                            return (
                                <div
                                    key={`${q.exam_question_id}-${opt.id ?? opt.label ?? idx}`}
                                    className={cn(
                                        "p-3 rounded-xl border flex items-center gap-3 text-xs",
                                        isCorrectOpt
                                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-medium"
                                            : isUserChoice
                                                ? "border-red-500 bg-red-500/10 text-red-900 dark:text-red-300"
                                                : "border-border bg-card text-muted-foreground"
                                    )}
                                >
                                    <span className="font-mono font-bold">
                                        {opt.label ?? String.fromCharCode(65 + idx)}.
                                    </span>
                                    <span>{opt.text || opt.label || ""}</span>
                                    {isCorrectOpt && (
                                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold ml-auto">
                                            Kunci
                                        </Badge>
                                    )}
                                    {isUserChoice && !isCorrectOpt && (
                                        <Badge variant="destructive" className="text-[10px] font-bold ml-auto">
                                            Jawaban Kamu
                                        </Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-medium">Kunci jawaban:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">{q.correct_option}</span>
                        </div>
                        {q.selected_option_id && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-medium">Jawaban kamu:</span>
                                <span className="font-bold text-red-700 dark:text-red-300">{q.selected_option_id}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-sm text-primary">Pembahasan</h4>
                    </div>
                    {q.explanation ? (
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-line font-mono text-[11px]">
                            {q.explanation}
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">Belum ada pembahasan untuk soal ini.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function ReviewInner() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id as string;
    const sessionId = searchParams.get("session_id") ?? "";

    const [review, setReview] = useState<CBTSessionReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        let cancelled = false;
        async function load() {
            try {
                const res = await academicService.getCBTReview(sessionId);
                if (cancelled) return;
                if (res && res.session_id) {
                    setReview(res);
                } else {
                    setError("Data pembahasan tidak ditemukan.");
                }
            } catch {
                if (!cancelled) setError("Gagal memuat hasil ujian. Periksa kembali nanti.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    const effectiveError = !sessionId ? "Sesi ujian tidak ditemukan pada URL." : error;

    return (
        <AppShell>
            <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <Button asChild variant="ghost" size="sm" className="gap-2 rounded-xl text-xs">
                        <Link href="/exams">
                            <RotateCcw className="h-3.5 w-3.5" /> Kembali ke Daftar Try Out
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
                            <Link href={`/exams/${id}`}>
                                <RotateCcw className="h-3.5 w-3.5" /> Kerjakan Lagi
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="rounded-xl text-xs gap-1.5">
                            <Link href="/results">
                                Lihat Semua Hasil <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-64 w-full rounded-3xl" />
                        <div className="space-y-4">
                            <Skeleton className="h-48 w-full rounded-3xl" />
                            <Skeleton className="h-48 w-full rounded-3xl" />
                        </div>
                    </div>
                ) : effectiveError ? (
                    <div className="p-10 rounded-3xl border border-border bg-card text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-amber-600">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-base">Pembahasan Belum Tersedia</h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">{effectiveError}</p>
                    </div>
                ) : review ? (
                    <>
                        <ReviewSummary review={review} />

                        {/* Subject breakdown (optional payload) */}
                        {Array.isArray(review.subject_breakdown) && review.subject_breakdown.length > 0 && (
                            <Card className="p-6 rounded-3xl border-border/80 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                    <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                        <ListChecks className="h-5 w-5 text-primary" /> Performa Per Mapel
                                    </h3>
                                    <Badge variant="outline" className="text-xs font-mono">
                                        {review.subject_breakdown.length} Mapel
                                    </Badge>
                                </div>
                                <div className="space-y-2.5">
                                    {review.subject_breakdown.map((sb) => {
                                        const pct = sb.percentage ?? 0;
                                        return (
                                            <div
                                                key={sb.subject_id || sb.subject_name}
                                                className="p-4 rounded-2xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="h-7 w-7 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                                        {sb.correct_count}
                                                    </span>
                                                    <div>
                                                        <span className="font-bold text-foreground block text-sm">
                                                            {sb.subject_name}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            Benar {sb.correct_count} dari {sb.questions_count} soal ({Math.round(pct)}%)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-28 h-2 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full"
                                                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-mono font-bold text-sm text-primary shrink-0">
                                                        {sb.total_score}
                                                        <span className="text-[10px] font-sans font-normal text-muted-foreground">
                                                            / {sb.max_score}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}

                        <Card className="p-6 rounded-3xl border-border/80 shadow-xs">
                            <div className="flex items-center gap-2 mb-6">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <h2 className="font-bold text-lg text-foreground">Pembahasan Soal</h2>
                            </div>

                            {review.questions.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Belum ada soal yang bisa dibahas pada sesi ini.</p>
                            ) : (
                                <div className="space-y-4">
                                    {review.questions.map((q) => (
                                        <ReviewQuestionCard key={q.exam_question_id} q={q} />
                                    ))}
                                </div>
                            )}
                        </Card>
                    </>
                ) : null}
            </div>
        </AppShell>
    );
}

export default function ExamCbtReviewPage() {
    return (
        <Suspense fallback={null}>
            <ReviewInner />
        </Suspense>
    );
}