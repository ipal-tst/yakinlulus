// frontend/src/app/(siswa)/exams/[id]/result/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { academicService } from "@/services/academic.service";
import { ExamResult } from "@/types";
import {
    Trophy,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    BookOpen,
    ArrowRight,
    AlertCircle,
} from "lucide-react";

function ResultInner() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id as string;
    const sessionId = searchParams.get("session_id") ?? "";

    const [result, setResult] = useState<ExamResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await academicService.getExamResult(id);
                if (res && res.exam_id) {
                    setResult(res);
                } else {
                    setError("Data hasil ujian tidak ditemukan.");
                }
            } catch {
                setError("Gagal memuat hasil ujian. Periksa kembali nanti.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    return (
        <AppShell>
            <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
                <Button asChild variant="ghost" size="sm" className="gap-2 rounded-xl text-xs">
                    <Link href="/exams">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Try Out
                    </Link>
                </Button>

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-56 w-full rounded-3xl" />
                        <Skeleton className="h-56 w-full rounded-3xl" />
                    </div>
                ) : error ? (
                    <div className="p-10 rounded-3xl border border-border bg-card text-center space-y-4">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-amber-600">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-base">Hasil Belum Tersedia</h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">{error}</p>
                        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                            <Link href={`/exams/${id}`}>Lihat Detail Paket</Link>
                        </Button>
                    </div>
                ) : result ? (
                    <>
                        {/* Score Hero Card */}
                        <Card className="p-6 md:p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-2 text-center md:text-left">
                                    <div className="flex items-center gap-2 justify-center md:justify-start">
                                        {result.passed ? (
                                            <Badge variant="success" className="gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> LULUS
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="gap-1">
                                                <XCircle className="h-3 w-3" /> BELUM LULUS
                                            </Badge>
                                        )}
                                        <span className="text-[11px] font-medium text-muted-foreground">
                                            {result.exam_title}
                                        </span>
                                    </div>
                                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                                        Hasil Ujian
                                    </h1>
                                </div>
                                <div className="text-center">
                                    <span className="text-xs text-muted-foreground font-medium block">Total Nilai</span>
                                    <div className="font-mono font-bold text-5xl text-primary mt-1">
                                        {Number.isFinite(Number(result.total_score)) ? result.total_score : "-"}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Ranking */}
                        {Number.isFinite(Number(result.ranking_position)) &&
                            Number.isFinite(Number(result.total_participants)) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 rounded-3xl border border-border bg-card shadow-xs text-center space-y-1">
                                        <span className="text-xs text-muted-foreground font-medium block">Peringkat Kamu</span>
                                        <div className="font-mono font-bold text-2xl text-foreground">
                                            #{result.ranking_position}
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-3xl border border-border bg-card shadow-xs text-center space-y-1">
                                        <span className="text-xs text-muted-foreground font-medium block">Total Peserta</span>
                                        <div className="font-mono font-bold text-2xl text-foreground">
                                            {result.total_participants}
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* Subject breakdown */}
                        <Card className="p-6 rounded-3xl border-border/80 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-primary" /> Skor Per Sub-Test
                                </h3>
                                <Badge variant="outline" className="text-xs font-mono">
                                    {result.subtest_scores.length} Mapel
                                </Badge>
                            </div>

                            {result.subtest_scores.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Belum ada rincian per sub-test.</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {result.subtest_scores.map((st, idx) => {
                                        const pct =
                                            st.total_questions > 0
                                                ? Math.round((st.correct_answers / st.total_questions) * 100)
                                                : 0;
                                        return (
                                            <div
                                                key={`${st.name}-${idx}`}
                                                className="p-4 rounded-2xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="h-7 w-7 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <span className="font-bold text-foreground block text-sm">{st.name}</span>
                                                        <span className="text-muted-foreground">
                                                            Benar {st.correct_answers} dari {st.total_questions} ({pct}%)
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
                                                        {Number.isFinite(Number(st.score)) ? st.score : "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            {sessionId ? (
                                <Button asChild className="w-full sm:w-auto rounded-xl font-semibold text-xs h-10 gap-1.5 shadow-xs">
                                    <Link href={`/exams/${id}/cbt/review?session_id=${encodeURIComponent(sessionId)}`}>
                                        <BookOpen className="h-4 w-4" /> Lihat Pembahasan
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild className="w-full sm:w-auto rounded-xl font-semibold text-xs h-10 gap-1.5 shadow-xs">
                                    <Link href={`/exams/${id}`}>
                                        <ArrowLeft className="h-4 w-4" /> Kembali ke Paket
                                    </Link>
                                </Button>
                            )}
                            <Button asChild variant="outline" className="w-full sm:w-auto rounded-xl font-semibold text-xs h-10 gap-1.5">
                                <Link href="/results">
                                    Lihat Semua Hasil <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </>
                ) : null}
            </div>
        </AppShell>
    );
}

export default function ExamResultPage() {
    return (
        <Suspense fallback={null}>
            <ResultInner />
        </Suspense>
    );
}