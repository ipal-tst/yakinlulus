"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { MasteryBadge } from "@/components/siswa/MasteryBadge";
import { academicService, type Result } from "@/services/academic.service";
import { ResultsAnalytics, MasteryStatus } from "@/types/siswa";
import { formatDuration } from "@/types/siswa";
import {
    Target,
    Trophy,
    BookCheck,
    ClipboardList,
    BarChart3,
    History,
    ArrowRight,
    CalendarDays,
    Clock,
    CheckCircle2,
    XCircle,
    BookOpen,
    FileSearch,
} from "lucide-react";

function formatDate(iso?: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso?: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function deriveSummary(results: Result[]): ResultsAnalytics["summary"] {
    const totalQuestions = results.reduce((sum, r) => sum + (r.total_questions || 0), 0);
    const totalCorrect = results.reduce((sum, r) => sum + (r.correct_count || 0), 0);

    const subjectMap = new Map<string, { name: string; percentages: number[] }>();
    results.forEach((r) =>
        (r.subject_breakdown ?? []).forEach((sb) => {
            const existing = subjectMap.get(sb.subject_id);
            if (existing) {
                existing.percentages.push(sb.percentage);
            } else {
                subjectMap.set(sb.subject_id, { name: sb.subject_name, percentages: [sb.percentage] });
            }
        })
    );

    const subjects = Array.from(subjectMap.values());
    const mastered = subjects.filter((s) => {
        if (s.percentages.length === 0) return false;
        const avg = s.percentages.reduce((a, b) => a + b, 0) / s.percentages.length;
        return avg >= 70;
    }).length;

    return {
        accuracy_total: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        mastered_count: mastered,
        subject_total: subjects.length,
        material_completed: 0,
        material_total: 0,
        exam_taken: results.length,
    };
}

function examTitle(r: Result): string {
    const names = (r.subject_breakdown ?? []).map((s) => s.subject_name).filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Ujian CBT";
}

function PctBar({ value, tone }: { value: number; tone?: "good" | "warn" | "bad" }) {
    const v = Math.min(100, Math.max(0, value || 0));
    const indicator =
        tone === "good"
            ? "bg-emerald-500"
            : tone === "warn"
                ? "bg-amber-500"
                : tone === "bad"
                    ? "bg-red-500"
                    : "bg-primary";
    return (
        <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={v} className="h-2 w-16" indicatorClassName={indicator} />
            <span className="text-xs font-semibold tabular-nums w-10 text-right text-foreground">
                {value ?? 0}%
            </span>
        </div>
    );
}

function toneForStatus(status: MasteryStatus): "good" | "warn" | "bad" {
    if (status === "MASTERED") return "good";
    if (status === "GUARD") return "warn";
    return "bad";
}

export default function ResultsHistoryPage() {
    const [analytics, setAnalytics] = useState<ResultsAnalytics | null>(null);
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            const [analyticRes, resultsRes] = await Promise.allSettled([
                academicService.getResultsAnalytics(),
                academicService.getResults({ page: 1, limit: 50 }),
            ]);
            if (cancelled) return;
            if (analyticRes.status === "fulfilled") setAnalytics(analyticRes.value);
            if (resultsRes.status === "fulfilled") setResults(resultsRes.value);
            setLoading(false);
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const summary = analytics?.summary ?? deriveSummary(results);
    const analyticsSubjects = analytics?.subjects ?? [];

    return (
        <AppShell>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Hasil Ujian & Analisis</h1>
                    <p className="text-sm text-muted-foreground">
                        Rangkuman materi, latihan, dan ujian beserta saran penguatan per mata pelajaran.
                    </p>
                </div>

                {/* Summary Stats Row */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="p-5 space-y-3">
                                <Skeleton className="h-10 w-10 rounded-2xl" />
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-3 w-28" />
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-5 space-y-2 border-border/70">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 w-fit">
                                <Target className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Akurasi Total</p>
                                <h4 className="font-heading font-bold text-xl text-foreground">
                                    {summary.accuracy_total ?? 0}%
                                </h4>
                                <p className="text-[11px] text-muted-foreground">Rata-rata jawaban benar</p>
                            </div>
                        </Card>

                        <Card className="p-5 space-y-2 border-border/70">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
                                <Trophy className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Mapel Dikuasai</p>
                                <h4 className="font-heading font-bold text-xl text-foreground">
                                    {summary.mastered_count}/{summary.subject_total}
                                </h4>
                                <p className="text-[11px] text-muted-foreground">dari seluruh mapel</p>
                            </div>
                        </Card>

                        <Card className="p-5 space-y-2 border-border/70">
                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit">
                                <BookCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Materi Selesai</p>
                                <h4 className="font-heading font-bold text-xl text-foreground">
                                    {summary.material_total > 0
                                        ? `${summary.material_completed}/${summary.material_total}`
                                        : "—"}
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                    {summary.material_total > 0
                                        ? `(${Math.round((summary.material_completed / summary.material_total) * 100)}%)`
                                        : "belum tersedia"}
                                </p>
                            </div>
                        </Card>

                        <Card className="p-5 space-y-2 border-border/70">
                            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 w-fit">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Ujian Diikuti</p>
                                <h4 className="font-heading font-bold text-xl text-foreground">
                                    {summary.exam_taken}
                                </h4>
                                <p className="text-[11px] text-muted-foreground">ujian telah ditempuh</p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Per-subject analytics */}
                <div className="space-y-4">
                    <SectionHeader
                        icon={BarChart3}
                        title="Analisis per Mapel"
                        subtitle="Akurasi ujian, latihan, progres materi, dan saran penguatan per mata pelajaran."
                    />
                    <Card className="p-0 overflow-hidden">
                        {loading ? (
                            <div className="space-y-3 p-6">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full" />
                                ))}
                            </div>
                        ) : analyticsSubjects.length === 0 ? (
                            <div className="p-4">
                                <EmptyState
                                    compact
                                    icon={BarChart3}
                                    title="Analisis Belum Tersedia"
                                    description="Selesaikan ujian dan latihan untuk melihat analisis per mata pelajaran."
                                    actionLabel="Kerjakan Ujian"
                                    actionHref="/exams"
                                />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-4">Mapel</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Akurasi Ujian</TableHead>
                                        <TableHead>Akurasi Latihan</TableHead>
                                        <TableHead>Progres Materi</TableHead>
                                        <TableHead>Nilai Ujian</TableHead>
                                        <TableHead>Topik Terlemah</TableHead>
                                        <TableHead>Rekomendasi</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analyticsSubjects.map((s) => (
                                        <TableRow key={s.subject_id}>
                                            <TableCell className="px-4">
                                                <span className="font-semibold text-foreground">{s.subject_name}</span>
                                            </TableCell>
                                            <TableCell>
                                                <MasteryBadge status={s.status} />
                                            </TableCell>
                                            <TableCell>
                                                <PctBar value={s.accuracy_pct_ujian} tone={toneForStatus(s.status)} />
                                            </TableCell>
                                            <TableCell>
                                                <PctBar value={s.accuracy_pct_latihan} />
                                            </TableCell>
                                            <TableCell>
                                                <PctBar value={s.material_pct} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold tabular-nums text-foreground">
                                                    {s.exam_avg ?? 0}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                    {s.exam_count ?? 0} ujian
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {s.weakest_topic ? (
                                                    <div className="min-w-[140px]">
                                                        <span className="font-medium text-foreground">{s.weakest_topic.name}</span>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {" "}
                                                            · {s.weakest_topic.accuracy}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {s.recommended && s.recommended.length > 0 ? (
                                                    <ul className="space-y-1 min-w-[220px] max-w-[280px]">
                                                        {s.recommended.map((rec) => (
                                                            <li
                                                                key={rec.topic_id ?? rec.name}
                                                                className="text-[11px] text-muted-foreground leading-snug"
                                                            >
                                                                <span className="font-medium text-foreground">{rec.name}</span>{" "}
                                                                — {rec.reason} → {rec.action}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl gap-1.5 text-xs whitespace-nowrap"
                                                >
                                                    <Link href={`/practice?subject=${s.subject_id}`}>
                                                        Latih Mapel <ArrowRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </div>

                {/* History table */}
                <div className="space-y-4">
                    <SectionHeader
                        icon={History}
                        title="Riwayat Ujian"
                        subtitle="Semua hasil ujian yang telah ditempuh beserta passing grade dan durasi pengerjaan."
                    />
                    <Card className="p-0 overflow-hidden">
                        {loading ? (
                            <div className="space-y-3 p-6">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : results.length === 0 ? (
                            <div className="p-4">
                                <EmptyState
                                    compact
                                    icon={FileSearch}
                                    title="Belum Ada Riwayat Ujian"
                                    description="Kerjakan try out, lalu hasil dan analisisnya akan muncul di sini."
                                    actionLabel="Kerjakan Try Out"
                                    actionHref="/exams"
                                />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-4">Tanggal</TableHead>
                                        <TableHead>Ujian / Cakupan</TableHead>
                                        <TableHead>Skor</TableHead>
                                        <TableHead>Passing Grade</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Durasi</TableHead>
                                        <TableHead>Mapel</TableHead>
                                        <TableHead className="text-right pr-4">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((r) => (
                                        <TableRow key={r.session_id || r.id}>
                                            <TableCell className="px-4">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                                                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                                    {formatDate(r.created_at)}
                                                    {r.created_at && (
                                                        <span className="text-muted-foreground/70">
                                                            · {formatTime(r.created_at)}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[260px]">
                                                    <p className="font-semibold text-sm text-foreground truncate">
                                                        {examTitle(r)}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {r.total_questions ?? 0} soal
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <span className="font-heading font-bold text-base text-primary tabular-nums">
                                                    {r.score ?? 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                    {r.passing_grade ? r.passing_grade : "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {r.is_passed ? (
                                                    <Badge variant="success" className="gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Lulus
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="gap-1">
                                                        <XCircle className="h-3 w-3" /> Belum Lulus
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5 text-primary" />
                                                    {formatDuration(r.duration_seconds || 0)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {(r.subject_breakdown ?? []).length} Mapel
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl gap-1.5 text-xs"
                                                >
                                                    <Link href={`/results/${r.session_id || r.id}`}>
                                                        Detail <ArrowRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </div>

                {/* CTA to practice */}
                {results.length > 0 && (
                    <div className="p-5 rounded-2xl border border-border/80 bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 w-fit">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-foreground">Ingin meningkatkan skor?</p>
                                <p className="text-xs text-muted-foreground">
                                    Latihan soal per mapel untuk memperkuat topik yang masih lemah.
                                </p>
                            </div>
                        </div>
                        <Button asChild className="rounded-xl text-xs font-semibold gap-1.5">
                            <Link href="/practice">
                                Mulai Latihan <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </AppShell>
    );
}