// frontend/src/components/siswa/TargetChanceCard.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreatBadge } from "./ThreatBadge";
import { chanceBand, type StudentTargetComparison } from "@/types/siswa";
import { cn } from "@/lib/utils";
import { Target, TrendingDown, TrendingUp, ArrowRight, Trophy } from "lucide-react";

interface TargetChanceCardProps {
    data: StudentTargetComparison | null;
    loading?: boolean;
}

const BAND_CLASSES: Record<ReturnType<typeof chanceBand>, string> = {
    red: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    grey: "border-border bg-muted text-muted-foreground",
};

export function TargetChanceCard({ data, loading }: TargetChanceCardProps) {
    if (loading) {
        return <Skeleton className="h-64 w-full rounded-2xl" />;
    }

    if (!data || !data.has_target) {
        return (
            <Card className="rounded-2xl border-primary/40">
                <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40 shadow-sm">
                        <Target className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="font-heading text-base font-semibold text-foreground">
                            Tentukan sekolah impianmu
                        </h2>
                        <p className="mx-auto max-w-md text-xs text-muted-foreground">
                            Pilih target sekolah/universitas untuk melihat jarak nilaimu dan peluang diterima.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button asChild size="sm" className="rounded-xl gap-1.5">
                            <Link href="/targets">
                                Pilih Target Sekolah <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="rounded-xl gap-1.5">
                            <Link href="/exams">
                                Kerjakan Tryout Khusus <Trophy className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const hasScore = typeof data.student_score === "number" && data.student_score > 0;
    const pct = Math.round(data.chance_pct);
    const isSafe = pct >= 95;

    const chanceBadge = (
        <div
            className={cn(
                "flex min-w-40 flex-col items-center justify-center rounded-2xl border px-8 py-5 text-center",
                hasScore ? BAND_CLASSES[chanceBand(data.chance_pct)] : BAND_CLASSES.grey
            )}
        >
            <span className="font-heading text-4xl font-extrabold leading-none md:text-5xl">
                {hasScore ? pct : "—"}
                {hasScore && <span className="text-2xl">%</span>}
            </span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-90">
                {hasScore ? "Peluang Diterima" : "Belum Ada Skor"}
            </span>
        </div>
    );

    return (
        <Card className="rounded-2xl border-primary/40 shadow-md">
            <CardContent className="flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                            <Target className="h-4 w-4" /> Target Sekolah / Universitas
                        </span>
                        <ThreatBadge status={data.verdict} />
                    </div>

                    <h3 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
                        {data.school_name}
                        {data.major && <span className="font-semibold text-muted-foreground"> · {data.major}</span>}
                    </h3>

                    <p
                        className={cn(
                            "inline-flex items-center gap-1.5 text-sm font-semibold",
                            hasScore
                                ? data.score_gap >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400"
                                : "text-muted-foreground"
                        )}
                    >
                        {hasScore ? (
                            <>
                                {data.score_gap >= 0 ? (
                                    <TrendingUp className="h-4 w-4" />
                                ) : (
                                    <TrendingDown className="h-4 w-4" />
                                )}
                                Jarak Nilai: {data.score_gap >= 0 ? "+" : ""}
                                {data.score_gap} poin
                                <span className="font-normal text-muted-foreground">
                                    (dari nilai terendah seleksi)
                                </span>
                            </>
                        ) : (
                            <span>Belum ada skor tryout khusus — kerjakan untuk melihat jarak nilaimu</span>
                        )}
                    </p>

                    <p className="text-sm text-muted-foreground">
                        Kuota {data.academic_year || "2026"}:{" "}
                        <span className="font-semibold text-foreground">{data.seat_quota ?? "—"}</span>
                        <span className="mx-1.5">·</span>
                        Nilai terendah:{" "}
                        <span className="font-semibold text-foreground">{data.passing_score_lowest}</span>
                        {hasScore && (
                            <>
                                <span className="mx-1.5">·</span>
                                Skor Anda:{" "}
                                <span className="font-semibold text-foreground">{data.student_score}</span>
                            </>
                        )}
                    </p>

                    <div className="flex flex-wrap gap-3 pt-1">
                        <Button asChild className="rounded-xl gap-1.5">
                            <Link href="/targets">
                                Kelola Target <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl gap-1.5">
                            <Link href="/exams">
                                Kerjakan Tryout Khusus <Trophy className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {hasScore && isSafe ? (
                        <motion.div
                            initial={{ opacity: 0.6, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            {chanceBadge}
                        </motion.div>
                    ) : (
                        chanceBadge
                    )}
                </div>
            </CardContent>
        </Card>
    );
}