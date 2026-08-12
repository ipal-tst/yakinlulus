// frontend/src/components/siswa/SubjectStrengthCard.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";
import type { SubjectMasteryResponse } from "@/types/siswa";
import { CheckCircle2, XCircle, Layers, ArrowRight } from "lucide-react";

interface SubjectStrengthCardProps {
    data: SubjectMasteryResponse | null;
    threshold?: number;
    loading?: boolean;
}

export function SubjectStrengthCard({ data, threshold = 70, loading }: SubjectStrengthCardProps) {
    const rows = data?.subjects ?? [];
    const strong = rows.filter((s) => s.accuracy_pct >= threshold);
    const weak = rows.filter((s) => s.accuracy_pct < threshold);

    if (loading) {
        return (
            <Card className="rounded-2xl">
                <CardHeader>
                    <Skeleton className="h-5 w-44" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl h-full">
            <CardHeader>
                <SectionHeader
                    title="Mapel Kuat vs Lemah"
                    subtitle={`Ambang kuat ${threshold}% jawaban benar`}
                    icon={Layers}
                    actionLabel="Latih Mapel"
                    actionHref="/practice"
                />
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <EmptyState
                        compact
                        icon={Layers}
                        title="Belum ada data penguasaan mapel"
                        description="Hasil latihan akan dikelompokkan menjadi mapel kuat &amp; lemah."
                        actionLabel="Mulai Latihan"
                        actionHref="/practice"
                    />
                ) : (
                    <div className="space-y-5">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <h4 className="text-sm font-semibold text-foreground">
                                    Kuat <span className="text-muted-foreground">({strong.length})</span>
                                </h4>
                            </div>
                            {strong.length > 0 ? (
                                <ul className="space-y-2">
                                    {strong.map((s) => (
                                        <li
                                            key={s.subject_id}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3 py-2"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-foreground">
                                                    {s.subject_name}
                                                </p>
                                                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {Math.round(s.accuracy_pct)}% · {s.total_questions} soal
                                                </p>
                                            </div>
                                            <Button asChild size="xs" variant="outline" className="rounded-lg">
                                                <Link href={`/practice?subject=${s.subject_id}`}>
                                                    Latih <ArrowRight className="h-3 w-3" />
                                                </Link>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-muted-foreground">Belum ada mapel kuat.</p>
                            )}
                        </div>

                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <h4 className="text-sm font-semibold text-foreground">
                                    Lemah <span className="text-muted-foreground">({weak.length})</span>
                                </h4>
                            </div>
                            {weak.length > 0 ? (
                                <ul className="space-y-2">
                                    {weak.map((s) => (
                                        <li
                                            key={s.subject_id}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3 py-2"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-foreground">
                                                    {s.subject_name}
                                                </p>
                                                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                                    {Math.round(s.accuracy_pct)}% · {s.total_questions} soal
                                                </p>
                                            </div>
                                            <Button asChild size="xs" variant="outline" className="rounded-lg">
                                                <Link href={`/practice?subject=${s.subject_id}`}>
                                                    Latih <ArrowRight className="h-3 w-3" />
                                                </Link>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-muted-foreground">Tidak ada mapel lemah. Mantap!</p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}