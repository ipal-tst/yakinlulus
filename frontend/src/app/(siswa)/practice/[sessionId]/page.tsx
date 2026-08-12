// frontend/src/app/(siswa)/practice/[sessionId]/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/siswa/EmptyState";
import { academicService } from "@/services/academic.service";
import {
    PracticeScope,
    PracticeSessionDetail,
    PracticeRunnerQuestion,
} from "@/types/siswa";
import { cn } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
    Flag,
    ListChecks,
    BookOpen,
    Send,
    CheckCircle2,
} from "lucide-react";

function formatScopeTitle(scope: PracticeScope): string {
    const parts = [
        scope.subject_name,
        scope.chapter_title,
        scope.topic_title,
    ].filter((x): x is string => Boolean(x));
    return parts.join(" · ") || "Latihan";
}

function RunnerSkeleton() {
    return (
        <AppShell>
            <div className="space-y-6">
                <div className="space-y-3">
                    <Skeleton className="h-6 w-72" />
                    <Skeleton className="h-2.5 w-full" />
                </div>
                <Skeleton className="h-48 w-full rounded-3xl" />
                <div className="space-y-2.5">
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                    ))}
                </div>
                <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
        </AppShell>
    );
}

function PracticeRunner() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params?.sessionId as string;

    const [session, setSession] = useState<PracticeSessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [doubts, setDoubts] = useState<Record<string, boolean>>({});
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const submittingRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await academicService.getPracticeSession(sessionId);
                if (cancelled) return;
                setSession(data);
                setCurrentIndex(0);
                setAnswers({});
                setDoubts({});
            } catch {
                if (!cancelled)
                    setError(
                        "Sesi latihan tidak ditemukan atau tidak dapat dimuat."
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

    const selectOption = useCallback((qid: string, optId: string) => {
        setSubmitError(null);
        setAnswers((prev) => {
            const next = { ...prev };
            if (next[qid] === optId) {
                delete next[qid];
            } else {
                next[qid] = optId;
            }
            return next;
        });
    }, []);

    const toggleDoubt = useCallback((qid: string) => {
        setDoubts((prev) => ({ ...prev, [qid]: !prev[qid] }));
    }, []);

    const handleSubmit = useCallback(async () => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);
        setSubmitError(null);
        setConfirmOpen(false);
        try {
            const payload = Object.entries(answers).map(
                ([question_id, selected_option_id]) => ({
                    question_id,
                    selected_option_id,
                })
            );
            await academicService.submitPractice(sessionId, payload);
            router.push(`/practice/${sessionId}/review`);
        } catch {
            submittingRef.current = false;
            setSubmitting(false);
            setSubmitError(
                "Gagal mengumpulkan jawaban. Periksa koneksi lalu coba lagi."
            );
        }
    }, [answers, sessionId, router]);

    const questions: PracticeRunnerQuestion[] = session?.questions ?? [];
    const currentQ = questions[currentIndex];
    const currentAnswer = currentQ ? answers[currentQ.question_id] : undefined;
    const currentFlagged = currentQ
        ? Boolean(doubts[currentQ.question_id])
        : false;
    const answeredCount = questions.filter(
        (q) => answers[q.question_id] !== undefined
    ).length;
    const doubtfulCount = Object.keys(doubts).filter((k) => doubts[k]).length;

    return (
        <AppShell>
            <div className="mx-auto max-w-4xl space-y-5">
                {loading ? (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-72" />
                            <Skeleton className="h-2.5 w-full" />
                        </div>
                        <Skeleton className="h-48 w-full rounded-3xl" />
                        <div className="space-y-2.5">
                            {[0, 1, 2, 3].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-14 w-full rounded-2xl"
                                />
                            ))}
                        </div>
                        <Skeleton className="h-24 w-full rounded-2xl" />
                    </div>
                ) : error ? (
                    <EmptyState
                        icon={BookOpen}
                        title="Latihan Tidak Ditemukan"
                        description={error}
                        actionLabel="Muat Ulang"
                        onAction={() => setReloadKey((k) => k + 1)}
                    />
                ) : questions.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        title="Belum Ada Soal"
                        description="Sesi latihan ini belum memiliki soal. Silakan mulai latihan baru."
                        actionLabel="Kembali ke Latihan"
                        actionHref="/practice"
                    />
                ) : currentQ ? (
                    <>
                        {submitError && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-semibold">
                                <Send className="h-4 w-4 shrink-0" />
                                {submitError}
                            </div>
                        )}
                        <header className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="min-w-0">
                                    <h1 className="font-heading font-bold text-sm md:text-base text-foreground truncate">
                                        {session
                                            ? formatScopeTitle(session.scope)
                                            : "Latihan"}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                        <span className="text-xs text-muted-foreground font-medium">
                                            Tanpa waktu — jawaban hanya terekam
                                            saat Selesai.
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <Flag className="h-3.5 w-3.5 text-amber-600" />
                                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                {doubtfulCount} ragu
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-xs shrink-0"
                                    onClick={() => setConfirmOpen(true)}
                                    disabled={submitting}
                                >
                                    <Send className="h-3.5 w-3.5" /> Selesai
                                </Button>
                            </div>
                            <div className="mt-3 flex items-center gap-3">
                                <Progress
                                    value={
                                        questions.length
                                            ? (answeredCount / questions.length) *
                                              100
                                            : 0
                                    }
                                    className="h-2 flex-1"
                                    indicatorClassName="bg-primary"
                                />
                                <span className="text-xs font-semibold text-muted-foreground shrink-0">
                                    {answeredCount}/{questions.length}
                                </span>
                            </div>
                        </header>

                        <section className="rounded-2xl border border-border/80 bg-card p-5 md:p-6 shadow-xs space-y-5">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <span className="h-8 px-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                                        Soal {currentIndex + 1}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        dari {questions.length}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleDoubt(currentQ.question_id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                                        currentFlagged
                                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                                            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                                    )}
                                    aria-pressed={currentFlagged}
                                >
                                    <Flag className="h-3.5 w-3.5" />{" "}
                                    {currentFlagged ? "Batalkan ragu-ragu" : "Ragu-ragu"}
                                </button>
                            </div>

                            <div className="text-base sm:text-lg font-medium leading-relaxed text-foreground whitespace-pre-line">
                                {currentQ.content}
                            </div>

                            <div className="space-y-2.5">
                                {currentQ.options.map((opt, idx) => {
                                    const selected =
                                        currentAnswer === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() =>
                                                selectOption(
                                                    currentQ.question_id,
                                                    opt.id
                                                )
                                            }
                                            className={cn(
                                                "w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer shadow-2xs",
                                                selected
                                                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs ring-1 ring-primary/40"
                                                    : "border-border bg-card hover:bg-muted/60 text-foreground"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-colors",
                                                    selected
                                                        ? "bg-primary text-primary-foreground shadow-xs"
                                                        : "bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {opt.key ||
                                                    String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="text-sm pt-1 leading-normal">
                                                {opt.content}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pt-4 flex items-center justify-between gap-3 border-t border-border/70">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentIndex === 0}
                                    onClick={() =>
                                        setCurrentIndex((p) => Math.max(0, p - 1))
                                    }
                                    className="rounded-xl h-11 px-5 text-xs font-semibold"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />{" "}
                                    Sebelumnya
                                </Button>
                                {currentIndex === questions.length - 1 ? (
                                    <Button
                                        size="sm"
                                        onClick={() => setConfirmOpen(true)}
                                        disabled={submitting}
                                        className="rounded-xl h-11 px-5 text-xs font-semibold shadow-xs"
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />{" "}
                                        Selesai Ujian
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            setCurrentIndex((p) =>
                                                Math.min(
                                                    questions.length - 1,
                                                    p + 1
                                                )
                                            )
                                        }
                                        className="rounded-xl h-11 px-5 text-xs font-semibold shadow-xs"
                                    >
                                        Berikutnya{" "}
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                                    <ListChecks className="h-4 w-4 text-primary" />{" "}
                                    Navigasi Soal
                                </span>
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-md bg-emerald-500" />{" "}
                                        Dijawab ({answeredCount})
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-md bg-amber-400" />{" "}
                                        Ragu
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-md bg-primary" />{" "}
                                        Sedang dikerjakan
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5 max-h-44 overflow-y-auto pr-1">
                                {questions.map((q, idx) => {
                                    const answered =
                                        answers[q.question_id] !== undefined;
                                    const flagged = Boolean(doubts[q.question_id]);
                                    const active = idx === currentIndex;
                                    return (
                                        <button
                                            key={q.question_id}
                                            type="button"
                                            onClick={() => setCurrentIndex(idx)}
                                            className={cn(
                                                "h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer",
                                                active
                                                    ? "ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground shadow-xs"
                                                    : flagged
                                                      ? "bg-amber-400 text-amber-950"
                                                      : answered
                                                        ? "bg-emerald-500 text-white font-bold"
                                                        : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                                            )}
                                        >
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </>
                ) : null}

                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">
                                Yakin Selesai?
                            </DialogTitle>
                            <DialogDescription className="text-xs leading-relaxed">
                                Kamu telah menjawab{" "}
                                <strong>
                                    {answeredCount} dari {questions.length}
                                </strong>{" "}
                                soal. Jawaban akan dinilai dan terekam di
                                riwayat setelah kamu menyelesaikan latihan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setConfirmOpen(false)}
                                disabled={submitting}
                                className="w-full rounded-xl text-xs font-semibold h-10"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={() => handleSubmit()}
                                disabled={submitting}
                                className="w-full rounded-xl font-bold text-xs h-10 shadow-xs gap-1.5"
                            >
                                <Send className="h-3.5 w-3.5" />{" "}
                                {submitting ? "Mengirim..." : "Ya, Selesai"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppShell>
    );
}

export default function PracticeRunnerPage() {
    return (
        <Suspense fallback={<RunnerSkeleton />}>
            <PracticeRunner />
        </Suspense>
    );
}