// frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { academicService, CBTAnswerPayload, CBTQuestion } from "@/services/academic.service";
import { formatDuration } from "@/types/siswa";
import { cn } from "@/lib/utils";
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    ListChecks,
    Send,
    ShieldAlert,
    Flag,
} from "lucide-react";

function CBTRunner() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const examId = params?.id as string;
    const querySessionId = searchParams.get("session_id") ?? "";

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<CBTQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [doubts, setDoubts] = useState<Record<string, boolean>>({});
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [syncState, setSyncState] = useState<"IDLE" | "SAVING" | "SAVED">("IDLE");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [terminated, setTerminated] = useState(false);

    const answersRef = useRef(answers);
    const doubtsRef = useRef(doubts);
    const sessionIdRef = useRef(sessionId);
    const secondsLeftRef = useRef(secondsLeft);
    const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mounted = useRef(false);
    const finishedRef = useRef(false);
    const submittingRef = useRef(false);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);
    useEffect(() => {
        doubtsRef.current = doubts;
    }, [doubts]);
    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);
    useEffect(() => {
        secondsLeftRef.current = secondsLeft;
    }, [secondsLeft]);

    // Start or resume the CBT session
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                if (querySessionId) {
                    setSessionId(querySessionId);
                    const qs = await academicService.getCBTQuestions(querySessionId);
                    if (!cancelled && Array.isArray(qs) && qs.length > 0) {
                        setQuestions(qs);
                    }
                } else {
                    const started = await academicService.startCBTExam(examId);
                    if (cancelled) return;
                    setSessionId(started.id);
                    setSecondsLeft(started.remaining_seconds);
                    setTerminated(started.is_terminated);
                    const qs = await academicService.getCBTQuestions(started.id);
                    if (!cancelled && Array.isArray(qs) && qs.length > 0) {
                        setQuestions(qs);
                    }
                }
            } catch {
                if (!cancelled) {
                    setError("Gagal memulai sesi ujian. Pastikan kamu terdaftar sebagai peserta atau kuota attempt masih tersedia.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [examId, querySessionId]);

    useEffect(() => {
        if (!loading && sessionId) {
            mounted.current = true;
        }
    }, [loading, sessionId]);

    const handleFinish = useCallback(async () => {
        if (finishedRef.current || submittingRef.current) return;
        finishedRef.current = true;
        submittingRef.current = true;
        setSubmitting(true);
        setConfirmOpen(false);

        const sid = sessionIdRef.current;
        try {
            if (sid) {
                if (syncTimer.current) {
                    clearTimeout(syncTimer.current);
                    syncTimer.current = null;
                }
                const payload: CBTAnswerPayload[] = Object.entries(answersRef.current).map(
                    ([exam_question_id, selected_option_id]) => ({
                        exam_question_id,
                        selected_option_id,
                        is_doubtful: Boolean(doubtsRef.current[exam_question_id]),
                    })
                );
                if (payload.length > 0) {
                    await academicService
                        .syncCBTAnswers(sid, payload)
                        .catch(() => undefined);
                }
                await academicService.finishCBTExam(sid);
                router.push(`/exams/${examId}/cbt/review?session_id=${encodeURIComponent(sid)}`);
            } else {
                router.push(`/exams/${examId}`);
            }
        } catch {
            finishedRef.current = false;
            submittingRef.current = false;
            setSubmitting(false);
            setError("Gagal mengumpulkan jawaban. Periksa koneksi lalu coba lagi.");
        }
    }, [examId, router]);

    const handleFinishRef = useRef(handleFinish);
    useEffect(() => {
        handleFinishRef.current = handleFinish;
    }, [handleFinish]);

    // Countdown timer (once the session is ready)
    useEffect(() => {
        if (secondsLeftRef.current === null) return;
        const t = setInterval(() => {
            setSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
        }, 1000);
        return () => clearInterval(t);
    }, [sessionId]);

    // Auto-submit when the timer hits zero
    useEffect(() => {
        if (secondsLeft !== null && secondsLeft <= 0) {
            handleFinishRef.current();
        }
    }, [secondsLeft]);

    // Debounced auto-save via sync
    useEffect(() => {
        if (!mounted.current || !sessionId) return;
        setSyncState("SAVING");
        if (syncTimer.current) clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => {
            const payload: CBTAnswerPayload[] = Object.entries(answers).map(
                ([exam_question_id, selected_option_id]) => ({
                    exam_question_id,
                    selected_option_id,
                    is_doubtful: Boolean(doubts[exam_question_id]),
                })
            );
            if (payload.length === 0) {
                setSyncState("IDLE");
                return;
            }
            academicService
                .syncCBTAnswers(sessionId, payload)
                .then(() => setSyncState("SAVED"))
                .catch(() => setSyncState("IDLE"));
        }, 800);
        return () => {
            if (syncTimer.current) {
                clearTimeout(syncTimer.current);
                syncTimer.current = null;
            }
        };
    }, [answers, doubts, sessionId, loading]);

    const selectOption = (qId: string, optId: string) => {
        setAnswers((prev) => {
            const next = { ...prev };
            if (next[qId] === optId) {
                delete next[qId];
            } else {
                next[qId] = optId;
            }
            return next;
        });
    };

    const toggleDoubt = (qId: string) => {
        setDoubts((prev) => ({ ...prev, [qId]: !prev[qId] }));
    };

    const currentQ = questions[currentIndex];
    const currentAnswer = currentQ ? answers[currentQ.exam_question_id] : undefined;
    const isCurrentFlagged = currentQ ? Boolean(doubts[currentQ.exam_question_id]) : false;
    const answeredCount = questions.filter((q) => answers[q.exam_question_id] !== undefined).length;

    return (
        <AppShell showSidebar={false} showTopbar={false}>
            <div className="flex flex-col gap-4 font-sans min-h-full">
                {/* Topbar */}
                <header className="sticky top-0 z-30 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 h-16 bg-card border-b border-border flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold font-heading text-sm shadow-xs shrink-0">
                            YL
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-heading font-bold text-sm leading-tight text-foreground truncate">
                                Ujian / Try Out
                            </h2>
                            {currentQ && (
                                <span className="text-[11px] text-muted-foreground font-medium truncate block">
                                    Sub-test: {currentQ.subjectName}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <div
                            className={cn(
                                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm shadow-2xs",
                                secondsLeft !== null && secondsLeft < 600
                                    ? "bg-red-500/10 border-red-500/30 text-red-600"
                                    : "bg-primary/10 border-primary/20 text-primary"
                            )}
                        >
                            <Clock className="h-4 w-4" />
                            <span>{secondsLeft === null ? "--:--:--" : formatDuration(secondsLeft)}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <span
                                className={cn(
                                    "px-2 py-0.5 rounded-lg font-semibold",
                                    syncState === "SAVING"
                                        ? "bg-amber-500/10 text-amber-600"
                                        : syncState === "SAVED"
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : "bg-muted text-muted-foreground"
                                )}
                            >
                                {syncState === "SAVING" ? "Menyimpan..." : syncState === "SAVED" ? "Tersimpan" : "Auto-save"}
                            </span>
                        </div>
                        <Button
                            onClick={() => setConfirmOpen(true)}
                            disabled={submitting || questions.length === 0}
                            variant="destructive"
                            size="sm"
                            className="rounded-xl font-semibold h-9 px-4 text-xs shadow-xs"
                        >
                            <Send className="h-3.5 w-3.5" /> Kumpulkan
                        </Button>
                    </div>
                </header>

                {/* Violation / terminated notice (best-effort) */}
                {terminated && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-semibold">
                        <ShieldAlert className="h-4 w-4" /> Sesi ditandai melanggar aturan. Jawaban tetap dapat dikumpulkan.
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4 pt-4">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-56 w-full rounded-3xl" />
                        <div className="space-y-2.5">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-8 rounded-3xl border border-border bg-card text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-base">Sesi Ujian Gagal Dimulai</h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">{error}</p>
                        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                            <a href={`/exams/${examId}`}>Kembali ke Detail Paket</a>
                        </Button>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="p-8 rounded-3xl border border-border bg-card text-center space-y-4">
                        <p className="text-xs text-muted-foreground">Belum ada soal tersedia pada sesi ini.</p>
                        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                            <a href={`/exams/${examId}`}>Kembali ke Detail Paket</a>
                        </Button>
                    </div>
                ) : currentQ ? (
                    <>
                        <div className="flex flex-col lg:flex-row gap-6 flex-1">
                            {/* LEFT: Question */}
                            <section className="flex-1 space-y-4 min-w-0">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3">
                                        <span className="h-8 px-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                                            Soal #{currentQ.display_order}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-medium">
                                            {currentIndex + 1} dari {questions.length}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">
                                        {currentQ.difficulty || "MEDIUM"}
                                    </Badge>
                                </div>

                                <div className="text-base sm:text-lg font-medium leading-relaxed text-foreground whitespace-pre-line bg-card p-6 rounded-3xl border border-border/70 shadow-2xs">
                                    {currentQ.stimulus ? (
                                        <>
                                            <div className="pb-4 mb-4 border-b border-border/60 text-muted-foreground">
                                                {currentQ.stimulus}
                                            </div>
                                            <div>{currentQ.stem}</div>
                                        </>
                                    ) : (
                                        currentQ.stem
                                    )}
                                </div>
                            </section>

                            {/* RIGHT: Options */}
                            <section className="w-full lg:w-[420px] xl:w-[480px] shrink-0 space-y-5">
                                <div className="flex items-center justify-between pb-2 border-b border-border/80">
                                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <ListChecks className="h-4 w-4 text-primary" /> Pilih Jawaban
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => toggleDoubt(currentQ.exam_question_id)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                                            isCurrentFlagged
                                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                                                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                                        )}
                                    >
                                        <Flag className="h-3.5 w-3.5" /> Ragu-ragu
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    {currentQ.options.map((opt, idx) => {
                                        const selected = currentAnswer === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => selectOption(currentQ.exam_question_id, opt.id)}
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
                                                    {opt.label || String.fromCharCode(65 + idx)}
                                                </span>
                                                <span className="text-sm pt-1 leading-normal">{opt.text}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Prev / Next */}
                                <div className="pt-3 flex items-center justify-between gap-3 border-t border-border mt-6">
                                    <Button
                                        variant="outline"
                                        disabled={currentIndex === 0}
                                        onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                                        className="rounded-xl h-11 px-5 text-xs font-semibold"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Sebelum
                                    </Button>
                                    <Button
                                        disabled={currentIndex === questions.length - 1}
                                        onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                                        className="rounded-xl h-11 px-5 text-xs font-semibold shadow-xs"
                                    >
                                        Berikutnya <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </section>
                        </div>

                        {/* Docked question palette (not a popup) */}
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                                    <ListChecks className="h-4 w-4 text-primary" /> Navigasi Soal
                                </span>
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-md bg-emerald-500" /> Dijawab ({answeredCount})
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-md bg-amber-400" /> Ragu
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-md bg-primary" /> Aktif
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5 max-h-44 overflow-y-auto pr-1">
                                {questions.map((q, idx) => {
                                    const answered = answers[q.exam_question_id] !== undefined;
                                    const flagged = Boolean(doubts[q.exam_question_id]);
                                    const active = idx === currentIndex;
                                    return (
                                        <button
                                            key={q.exam_question_id}
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
                                            {q.display_order}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : null}

                {/* Submit confirmation */}
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">Konfirmasi Kumpulkan Ujian</DialogTitle>
                            <DialogDescription className="text-xs leading-relaxed">
                                Kamu telah menjawab <strong>{answeredCount}</strong> dari {questions.length} soal.
                                Semua jawaban akan dikirim dan dinilai sekarang. Yakin ingin mengakhiri sesi ini?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setConfirmOpen(false)}
                                disabled={submitting}
                                className="w-full rounded-xl text-xs font-semibold h-10"
                            >
                                Kembali Mengerjakan
                            </Button>
                            <Button
                                onClick={() => handleFinishRef.current()}
                                disabled={submitting}
                                variant="destructive"
                                className="w-full rounded-xl font-bold text-xs h-10 shadow-xs gap-1.5"
                            >
                                <Send className="h-3.5 w-3.5" /> Setuju, Selesai
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppShell>
    );
}

function CBTSkeleton() {
    return (
        <AppShell showSidebar={false} showTopbar={false}>
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-56 w-full rounded-3xl" />
            </div>
        </AppShell>
    );
}

export default function CBTPage() {
    return (
        <Suspense fallback={<CBTSkeleton />}>
            <CBTRunner />
        </Suspense>
    );
}