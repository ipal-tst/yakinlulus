"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { SectionHeader } from "@/components/siswa/SectionHeader";
import { EmptyState } from "@/components/siswa/EmptyState";
import { academicService, type Result } from "@/services/academic.service";
import { ExamResult } from "@/types";
import { formatDuration } from "@/types/siswa";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Clock,
    Trophy,
    FileQuestion,
    CalendarDays,
} from "lucide-react";

function normalizeResult(raw: Result): Result {
    return {
        ...raw,
        id: raw.id ?? raw.session_id ?? "",
        session_id: raw.session_id ?? raw.id ?? "",
        exam_id: raw.exam_id ?? "",
        total_questions: raw.total_questions ?? 0,
        answered_count: raw.answered_count ?? 0,
        correct_count: raw.correct_count ?? 0,
        wrong_count: raw.wrong_count ?? 0,
        unanswered_count: raw.unanswered_count ?? 0,
        score: raw.score ?? 0,
        passing_grade: raw.passing_grade ?? 0,
        is_passed: raw.is_passed ?? false,
        duration_seconds: raw.duration_seconds ?? 0,
        subject_breakdown: raw.subject_breakdown ?? [],
    };
}

function formatDate(iso?: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function StatCard({
    label,
    value,
    icon,
    toneClass,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    toneClass?: string;
}) {
    return (
        <Card className="p-4 space-y-2 border-border/70">
            <div
                className={
                    toneClass
                        ? `p-2.5 rounded-xl w-fit ${toneClass}`
                        : "p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 w-fit"
                }
            >
                {icon}
            </div>
            <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="font-heading font-bold text-lg text-foreground tabular-nums">{value}</p>
            </div>
        </Card>
    );
}

export default function ExamResultDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [result, setResult] = useState<Result | null>(null);
    const [legacy, setLegacy] = useState<ExamResult | null>(null);
    const [hasReview, setHasReview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            setResult(null);
            setLegacy(null);
            setHasReview(false);
            try {
                const raw = await academicService.getResultBySession(id);
                if (cancelled) return;
                setResult(normalizeResult(raw));

                // Pembahasan tersedia bila endpoint review dapat diakses (graded session).
                try {
                    await academicService.getCBTReview(raw.session_id || raw.id);
                    if (!cancelled) setHasReview(true);
                } catch {
                    // review tidak tersedia -> sembunyikan CTA pembahasan
                }
            } catch {
                // Fallback ke shape legacy (ExamResult) bila tersedia.
                try {
                    const e = await academicService.getExamResult(id);
                    if (!cancelled) {
                        if (e && e.exam_id) {
                            setLegacy(e);
                        } else {
                            setError("Data hasil ujian tidak ditemukan.");
                        }
                    }
                } catch {
                    if (!cancelled) {
                        setError("Gagal memuat hasil ujian. Periksa kembali nanti.");
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    return (
        <AppShell>
            <div className="max-w-4xl mx-auto space-y-6">
                <Button asChild variant="ghost" size="sm" className="gap-2 rounded-xl text-xs">
                    <Link href="/results">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Hasil
                    </Link>
                </Button>

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-48 w-full rounded-3xl" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                            ))}
                        </div>
                        <Skeleton className="h-56 w-full rounded-3xl" />
                    </div>
                ) : error && !legacy ? (
                    <EmptyState
                        icon={FileQuestion}
                        title="Hasil Tidak Ditemukan"
                        description={error ?? "Data hasil ujian tidak tersedia."}
                        actionLabel="Kembali ke Semua Hasil"
                        actionHref="/results"
                    />
                ) : legacy ? (
                    <>
                        {/* Fallback — legacy ExamResult shape */}
                        <Card className="p-6 md:p-8 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-2 text-center md:text-left">
                                    <Badge variant={legacy.passed ? "success" : "destructive"} className="gap-1">
                                        {legacy.passed ? (
                                            <>
                                                <CheckCircle2 className="h-3 w-3" /> LULUS
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-3 w-3" /> BELUM LULUS
                                            </>
                                        )}
                                    </Badge>
                                    <h1 className="font-heading text-2xl font-bold text-foreground">
                                        {legacy.exam_title}
                                    </h1>
                                </div>
                                <div className="text-center">
                                    <span className="text-xs text-muted-foreground font-medium block">Total Nilai</span>
                                    <div className="font-heading font-bold text-5xl text-primary mt-1">
                                        {Number.isFinite(Number(legacy.total_score)) ? legacy.total_score : "-"}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {legacy.subtest_scores.length > 0 && (
                            <div className="space-y-4">
                                <SectionHeader
                                    icon={Trophy}
                                    title="Rincian Nilai per Subtes"
                                    subtitle="Perbandingan skor dan jawaban benar per subtes."
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {legacy.subtest_scores.map((sub) => (
                                        <Card key={sub.name} className="p-5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-heading font-semibold text-sm text-foreground">
                                                    {sub.name}
                                                </h3>
                                                <span className="font-heading font-bold text-lg text-primary">
                                                    {sub.score}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Jawaban Benar: {sub.correct_answers}/{sub.total_questions}</span>
                                                    <span>
                                                        {sub.total_questions > 0
                                                            ? Math.round((sub.correct_answers / sub.total_questions) * 100)
                                                            : 0}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        sub.total_questions > 0
                                                            ? (sub.correct_answers / sub.total_questions) * 100
                                                            : 0
                                                    }
                                                    indicatorClassName="bg-emerald-500"
                                                    className="h-2.5"
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button asChild variant="outline" className="rounded-xl text-xs font-semibold gap-1.5">
                            <Link href="/results">
                                Lihat Semua Hasil <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </>
                ) : result ? (
                    <>
                        {/* Detail Result header card */}
                        <Card className="p-6 md:p-8 border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-2 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                                        {result.is_passed ? (
                                            <Badge variant="success" className="gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> LULUS
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="gap-1">
                                                <XCircle className="h-3 w-3" /> BELUM LULUS
                                            </Badge>
                                        )}
                                        {result.created_at && (
                                            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                                <CalendarDays className="h-3 w-3" /> {formatDate(result.created_at)}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                                        Hasil Ujian
                                    </h1>
                                    <p className="text-xs text-muted-foreground font-mono">{result.exam_id}</p>
                                </div>
                                <div className="text-center">
                                    <span className="text-xs text-muted-foreground font-medium block">Skor Total</span>
                                    <div className="font-heading font-bold text-5xl text-primary mt-1 tabular-nums">
                                        {result.score ?? 0}
                                    </div>
                                    {result.passing_grade > 0 && (
                                        <span className="text-[11px] text-muted-foreground block mt-1">
                                            Passing grade {result.passing_grade}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Detail stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard
                                label="Benar"
                                value={`${result.correct_count ?? 0}`}
                                icon={<CheckCircle2 className="h-4 w-4" />}
                                toneClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            />
                            <StatCard
                                label="Salah"
                                value={`${result.wrong_count ?? 0}`}
                                icon={<XCircle className="h-4 w-4" />}
                                toneClass="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25"
                            />
                            <StatCard
                                label="Kosong"
                                value={`${result.unanswered_count ?? 0}`}
                                icon={<HelpCircle className="h-4 w-4" />}
                                toneClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                            />
                            <StatCard
                                label="Durasi"
                                value={formatDuration(result.duration_seconds || 0)}
                                icon={<Clock className="h-4 w-4" />}
                            />
                        </div>

                        {/* Answered overview */}
                        <Card className="p-5 space-y-3 border-border/80">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-foreground">Soal Terjawab</span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {result.answered_count ?? 0} dari {result.total_questions ?? 0} soal
                                </span>
                            </div>
                            <Progress
                                value={
                                    (result.total_questions ?? 0) > 0
                                        ? ((result.answered_count ?? 0) / (result.total_questions ?? 0)) * 100
                                        : 0
                                }
                                indicatorClassName="bg-primary"
                                className="h-2.5"
                            />
                        </Card>

                        {/* Subject breakdown */}
                        <div className="space-y-4">
                            <SectionHeader
                                icon={Trophy}
                                title="Rincian per Mapel"
                                subtitle="Skor dan persentase per mata pelajaran pada ujian ini."
                            />
                            <Card className="p-0 overflow-hidden">
                                {(result.subject_breakdown ?? []).length === 0 ? (
                                    <p className="text-xs text-muted-foreground p-6">
                                        Belum ada rincian per mapel untuk hasil ini.
                                    </p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="px-4">Mapel</TableHead>
                                                <TableHead>Soal</TableHead>
                                                <TableHead>Benar</TableHead>
                                                <TableHead>Skor</TableHead>
                                                <TableHead>Persentase</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.subject_breakdown.map((sb) => (
                                                <TableRow key={sb.subject_id}>
                                                    <TableCell className="px-4">
                                                        <span className="font-semibold text-foreground">
                                                            {sb.subject_name}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="tabular-nums">
                                                        {sb.questions_count ?? 0}
                                                    </TableCell>
                                                    <TableCell className="tabular-nums text-emerald-600 dark:text-emerald-400">
                                                        {sb.correct_count ?? 0}
                                                    </TableCell>
                                                    <TableCell className="tabular-nums">
                                                        <span className="text-foreground">
                                                            {sb.total_score ?? 0}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {" "}
                                                            / {sb.max_score ?? 0}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 min-w-[120px]">
                                                            <Progress
                                                                value={sb.percentage ?? 0}
                                                                className="h-2 w-16"
                                                                indicatorClassName={
                                                                    (sb.percentage ?? 0) >= 70
                                                                        ? "bg-emerald-500"
                                                                        : "bg-amber-500"
                                                                }
                                                            />
                                                            <span className="text-xs font-semibold tabular-nums w-10 text-right text-foreground">
                                                                {sb.percentage ?? 0}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </Card>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            {hasReview && (
                                <Button
                                    asChild
                                    className="w-full sm:w-auto rounded-xl text-xs font-semibold gap-1.5 shadow-xs"
                                >
                                    <Link href={`/cbt/${result.session_id || result.id}/review`}>
                                        <BookOpen className="h-4 w-4" /> Lihat Pembahasan
                                    </Link>
                                </Button>
                            )}
                            <Button
                                asChild
                                variant="outline"
                                className="w-full sm:w-auto rounded-xl text-xs font-semibold gap-1.5"
                            >
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