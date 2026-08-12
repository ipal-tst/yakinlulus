// frontend/src/components/siswa/SubjectProgressGrid.tsx
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";
import type { SubjectProgressResponse } from "@/types/siswa";
import { CheckCircle2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubjectProgressGridProps {
    data: SubjectProgressResponse | null;
    loading?: boolean;
}

export function SubjectProgressGrid({ data, loading }: SubjectProgressGridProps) {
    const rows = data?.subjects ?? [];

    if (loading) {
        return (
            <Card className="rounded-2xl">
                <CardHeader>
                    <Skeleton className="h-5 w-44" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-3 w-full rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl">
            <CardHeader>
                <SectionHeader
                    title="Progress Mapel"
                    subtitle="Berbasis jumlah jawaban benar soal latihan"
                    icon={ListChecks}
                    actionLabel="Latih Mapel"
                    actionHref="/practice"
                />
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <EmptyState
                        compact
                        icon={ListChecks}
                        title="Belum ada mapel dilatih"
                        description="Kerjakan soal latihan untuk membangun penguasaan setiap mapel hingga target tercapai."
                        actionLabel="Latih Mapel"
                        actionHref="/practice"
                    />
                ) : (
                    <div className="space-y-5">
                        {rows.map((s) => {
                            const remaining = Math.max(0, s.correct_target - s.correct_count);
                            const done = s.progress_pct >= 100;
                            return (
                                <div key={s.subject_id} className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-foreground">{s.subject_name}</p>
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            {s.correct_count}/{s.correct_target} · {Math.round(s.progress_pct)}%
                                        </p>
                                    </div>
                                    <Progress
                                        value={s.progress_pct}
                                        indicatorClassName={cn(done ? "bg-emerald-500" : "bg-primary")}
                                    />
                                    <p
                                        className={cn(
                                            "text-[11px]",
                                            done
                                                ? "flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {done ? (
                                            <>
                                                <CheckCircle2 className="h-3 w-3" /> Target tercapai — lanjut ke mapel lain!
                                            </>
                                        ) : (
                                            `${remaining} lagi benar sampai naik level`
                                        )}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}