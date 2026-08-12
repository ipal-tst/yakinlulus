// frontend/src/app/(siswa)/exams/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/siswa/EmptyState";
import { academicService } from "@/services/academic.service";
import { ExamPackageDetail } from "@/types/siswa";
import { Exam } from "@/types";
import {
    ArrowLeft,
    Clock,
    HelpCircle,
    Layers,
    GraduationCap,
    Play,
    RotateCcw,
    PackageSearch,
    Award,
    Repeat,
} from "lucide-react";

export default function ExamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [pkg, setPkg] = useState<ExamPackageDetail | null>(null);
    const [legacyExam, setLegacyExam] = useState<Exam | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            setPkg(null);
            setLegacyExam(null);
            setNotFound(false);
            try {
                const detail = await academicService.getExamPackageDetail(id);
                if (detail && detail.id) {
                    setPkg(detail);
                } else {
                    throw new Error("empty");
                }
            } catch {
                try {
                    const exam = await academicService.getExamById(id);
                    if (exam && exam.id) {
                        setLegacyExam(exam);
                    } else {
                        setNotFound(true);
                    }
                } catch {
                    setNotFound(true);
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    const handleStart = () => {
        router.push(`/exams/${id}/instructions`);
    };

    if (loading) {
        return (
            <AppShell>
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-8 w-44" />
                    <Skeleton className="h-52 w-full rounded-3xl" />
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </AppShell>
        );
    }

    if (notFound) {
        return (
            <AppShell>
                <div className="max-w-3xl mx-auto">
                    <EmptyState
                        icon={PackageSearch}
                        title="Paket Tidak Ditemukan"
                        description="Paket ujian ini tidak tersedia atau belum dipublikasikan untuk jenjang kamu."
                        actionLabel="Kembali ke Daftar Try Out"
                        actionHref="/exams"
                    />
                </div>
            </AppShell>
        );
    }

    if (legacyExam) {
        return (
            <AppShell>
                <div className="max-w-4xl mx-auto space-y-6 font-sans">
                    <Button asChild variant="ghost" size="sm" className="gap-2 rounded-xl text-xs">
                        <Link href="/exams">
                            <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog Ujian
                        </Link>
                    </Button>

                    <Card className="p-6 md:p-8 space-y-6 rounded-3xl border-border/80 shadow-xs">
                        <div className="space-y-3 pb-6 border-b border-border">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="default" className="text-[11px] font-bold">
                                    {legacyExam.category || "Paket Ujian"}
                                </Badge>
                                {legacyExam.scoring_system && (
                                    <Badge variant="outline" className="text-[11px] font-bold border-primary/40 text-primary">
                                        Scoring {legacyExam.scoring_system}
                                    </Badge>
                                )}
                            </div>
                            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-snug">
                                {legacyExam.title}
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {legacyExam.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                    <Clock className="h-4 w-4 text-primary shrink-0" /> Total Durasi
                                </span>
                                <span className="font-heading font-bold text-lg text-foreground block">
                                    {legacyExam.duration_minutes} Menit
                                </span>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                    <HelpCircle className="h-4 w-4 text-primary shrink-0" /> Jumlah Soal
                                </span>
                                <span className="font-heading font-bold text-lg text-foreground block">
                                    {legacyExam.total_questions} Soal
                                </span>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1 col-span-2 sm:col-span-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                    <Award className="h-4 w-4 text-emerald-600 shrink-0" /> Passing Grade
                                </span>
                                <span className="font-heading font-bold text-lg text-foreground block">
                                    {typeof legacyExam.passing_score === "number" ? legacyExam.passing_score : "-"}
                                </span>
                            </div>
                        </div>

                        {legacyExam.subtests && legacyExam.subtests.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-primary" /> Rincian {legacyExam.subtests.length} Subtes Ujian
                                </h3>
                                <div className="space-y-2">
                                    {legacyExam.subtests.map((st, idx) => (
                                        <div
                                            key={st.id || idx}
                                            className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between gap-3 text-xs"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-bold text-foreground">{st.subtest_name}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-muted-foreground font-medium shrink-0">
                                                <span>{st.sample_question_count || 0} Soal</span>
                                                <span>•</span>
                                                <span className="text-primary font-bold">{st.duration_minutes} Menit</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleStart}
                            className="w-full h-12 rounded-2xl text-sm font-bold shadow-xs gap-2"
                        >
                            <Play className="h-5 w-5 fill-current" /> Mulai Ujian CBT Sekarang
                        </Button>
                    </Card>
                </div>
            </AppShell>
        );
    }

    // Package layout
    if (!pkg) return null;

    const mode = pkg.package_mode ?? "SINGLE";
    const maxAttempts = pkg.max_attempts ?? 1;
    const attemptsUsed = pkg.attempts_used ?? 0;
    const isRepeatable = maxAttempts > 1;
    const remaining = Math.max(0, maxAttempts - attemptsUsed);
    const canStart = remaining > 0 || attemptsUsed === 0;

    return (
        <AppShell>
            <div className="max-w-4xl mx-auto space-y-6 font-sans">
                <Button asChild variant="ghost" size="sm" className="gap-2 rounded-xl text-xs">
                    <Link href="/exams">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Try Out
                    </Link>
                </Button>

                <Card className="p-6 md:p-8 space-y-6 rounded-3xl border-border/80 shadow-xs">
                    {/* Package Identity Header */}
                    <div className="space-y-4 pb-6 border-b border-border">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[11px] bg-primary/10 border-primary/20 text-primary gap-1">
                                <GraduationCap className="h-3 w-3" /> {pkg.education_level || "Umum"}
                            </Badge>
                            <Badge variant="secondary" className="text-[11px]">
                                {mode === "PER_SUBTEST" ? "Per Sub-Test" : "Satu Sesi"}
                            </Badge>
                            {pkg.status && (
                                <Badge variant="outline" className="text-[11px]">
                                    {pkg.status}
                                </Badge>
                            )}
                        </div>

                        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-snug">
                            {pkg.name}
                        </h1>
                        {pkg.code && <CardDescription className="text-sm">{pkg.code}</CardDescription>}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                            <span className="text-xs text-muted-foreground font-medium">Mapel</span>
                            <span className="font-heading font-bold text-lg text-foreground block">
                                {pkg.subjects_count ?? 0}
                            </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                            <span className="text-xs text-muted-foreground font-medium">Soal</span>
                            <span className="font-heading font-bold text-lg text-foreground block">
                                {pkg.total_questions ?? 0}
                            </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                            <span className="text-xs text-muted-foreground font-medium">Durasi</span>
                            <span className="font-heading font-bold text-lg text-foreground block">
                                {pkg.duration_minutes ?? 0} mnt
                            </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                {isRepeatable ? <Repeat className="h-3.5 w-3.5 text-primary" /> : <Award className="h-3.5 w-3.5 text-primary" />}
                                Attempt
                            </span>
                            <span className="font-heading font-bold text-lg text-foreground block">
                                {attemptsUsed} / {maxAttempts}
                            </span>
                        </div>
                    </div>

                    {/* Rules */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {typeof pkg.passing_score === "number" && (
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-emerald-600 font-bold block text-[11px] uppercase tracking-wider">
                                    Passing Score
                                </span>
                                <span className="font-mono font-bold text-lg text-emerald-700 dark:text-emerald-300">
                                    {pkg.passing_score}
                                </span>
                            </div>
                        )}
                        {isRepeatable ? (
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                                <span className="text-primary font-bold block text-[11px] uppercase tracking-wider">
                                    Kuota Mengulang
                                </span>
                                <span className="font-mono font-bold text-lg text-primary">
                                    {remaining}× tersisa
                                </span>
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                <span className="text-amber-600 font-bold block text-[11px] uppercase tracking-wider">
                                    Batas Pengerjaan
                                </span>
                                <span className="font-mono font-bold text-lg text-amber-700 dark:text-amber-300">
                                    1 attempt
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Subtests */}
                    {pkg.subjects && pkg.subjects.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary" /> Sub-Test Paket Ini
                            </h3>
                            <div className="space-y-2">
                                {[...pkg.subjects]
                                    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                                    .map((st) => (
                                        <div
                                            key={st.exam_content_id}
                                            className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="h-7 w-7 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                                    {st.display_order ?? 0}
                                                </span>
                                                <div>
                                                    <span className="font-bold text-sm text-foreground block">
                                                        {st.subject_name}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        Sub-test #{st.display_order ?? 0}
                                                    </span>
                                                </div>
                                            </div>

                                            {mode === "PER_SUBTEST" ? (
                                                <Button
                                                    onClick={handleStart}
                                                    disabled={!canStart}
                                                    size="sm"
                                                    className="rounded-xl text-xs font-semibold"
                                                >
                                                    <Play className="h-3.5 w-3.5 fill-current" /> Mulai
                                                </Button>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px]">
                                                    Di satu sesi
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Primary CTA */}
                    <div className="pt-2">
                        <Button
                            onClick={handleStart}
                            disabled={!canStart}
                            className="w-full h-12 rounded-2xl text-sm font-bold shadow-xs gap-2"
                        >
                            {canStart ? (
                                <>
                                    <Play className="h-5 w-5 fill-current" />
                                    {mode === "PER_SUBTEST" ? "Mulai Try Out" : "Mulai Try Out"}
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="h-5 w-5" /> Kuota Attempt Habis
                                </>
                            )}
                        </Button>
                        {!canStart && (
                            <p className="text-center text-xs text-muted-foreground mt-2">
                                Kamu sudah memakai seluruh {maxAttempts} attempt untuk paket ini.
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </AppShell>
    );
}