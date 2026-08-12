// frontend/src/app/(siswa)/exams/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GradeBadge } from "@/components/siswa/GradeBadge";
import { EmptyState } from "@/components/siswa/EmptyState";
import { useAuthStore } from "@/stores/auth.store";
import { academicService } from "@/services/academic.service";
import { ExamPackageWithMeta, ExamSummary } from "@/types/siswa";
import {
    GraduationCap,
    Trophy,
    Target,
    ListChecks,
    Layers,
    ArrowRight,
    CheckCircle2,
    XCircle,
    PackageSearch,
} from "lucide-react";

function NumberStat({ value, label }: { value: string | number; label: string }) {
    return (
        <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-xs font-semibold text-foreground">{value}</span>
            <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
    );
}

function ExamsCatalog() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const subjectFilter = searchParams.get("subject")?.toLowerCase() ?? "";

    const [packages, setPackages] = useState<ExamPackageWithMeta[]>([]);
    const [summary, setSummary] = useState<ExamSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [pkgsRes, summaryRes] = await Promise.allSettled([
                    academicService.getExamPackagesWithMeta(),
                    academicService.getExamSummary(),
                ]);

                if (pkgsRes.status === "fulfilled" && Array.isArray(pkgsRes.value)) {
                    setPackages(pkgsRes.value);
                } else {
                    setPackages([]);
                }

                if (summaryRes.status === "fulfilled" && summaryRes.value) {
                    setSummary(summaryRes.value);
                }
            } catch {
                setPackages([]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filteredPackages = subjectFilter
        ? packages.filter((p) =>
              [p.name, p.code, p.education_level]
                  .filter(Boolean)
                  .some((v) => (v as string).toLowerCase().includes(subjectFilter))
          )
        : packages;

    return (
        <AppShell>
            <div className="space-y-6 font-sans">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                Try Out
                            </h1>
                            <GradeBadge educationLevel={user?.education_level} grade={user?.grade} />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Kerjakan paket ujian sesuai jadwal. Nilai terakhir dan rata-rata tampil di bawah, lalu pilih paket untuk melihat detail sub-test.
                        </p>
                    </div>
                </div>

                {/* Progress Widget */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[0, 1, 2].map((i) => (
                            <Skeleton key={i} className="h-24" />
                        ))}
                    </div>
                ) : summary ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="p-5 space-y-1.5 rounded-3xl border-border/80 shadow-xs">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Trophy className="h-3.5 w-3.5 text-primary" /> Skor Terakhir
                            </span>
                            {summary.last_score && summary.last_score.package_name ? (
                                <>
                                    <div className="font-mono font-bold text-3xl text-foreground">
                                        {Number.isFinite(Number(summary.last_score.score)) ? summary.last_score.score : "-"}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {summary.last_score.package_name}
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className={
                                            summary.last_score.above_passing
                                                ? "text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 gap-1"
                                                : "text-[10px] border-red-500/30 bg-red-500/10 text-red-600 gap-1"
                                        }
                                    >
                                        {summary.last_score.above_passing ? (
                                            <>
                                                <CheckCircle2 className="h-3 w-3" /> Di atas passing{" "}
                                                {Number.isFinite(Number(summary.last_score.passing_score))
                                                    ? summary.last_score.passing_score
                                                    : ""}
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-3 w-3" /> Di bawah passing
                                            </>
                                        )}
                                    </Badge>
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground">Belum ada ujian yang selesai.</p>
                            )}
                        </Card>

                        <Card className="p-5 space-y-1.5 rounded-3xl border-border/80 shadow-xs">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Target className="h-3.5 w-3.5 text-primary" /> Skor Rata-rata
                            </span>
                            <div className="font-mono font-bold text-3xl text-foreground">
                                {Number.isFinite(Number(summary.avg_score)) ? summary.avg_score : "-"}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                dari {Number.isFinite(Number(summary.total_taken)) ? summary.total_taken : 0} ujian dikerjakan
                            </p>
                        </Card>

                        <Card className="p-5 space-y-1.5 rounded-3xl border-border/80 shadow-xs">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <ListChecks className="h-3.5 w-3.5 text-primary" /> Total Diikuti
                            </span>
                            <div className="font-mono font-bold text-3xl text-foreground">
                                {Number.isFinite(Number(summary.total_taken)) ? summary.total_taken : 0}
                            </div>
                            <p className="text-xs text-muted-foreground">sesi ujian yang telah dikerjakan</p>
                        </Card>
                    </div>
                ) : null}

                {/* Package List */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="space-y-4 rounded-3xl">
                                <Skeleton className="h-5 w-2/3" />
                                <Skeleton className="h-3 w-1/2" />
                                <div className="grid grid-cols-3 gap-2">
                                    <Skeleton className="h-12" />
                                    <Skeleton className="h-12" />
                                    <Skeleton className="h-12" />
                                </div>
                                <Skeleton className="h-10 w-full" />
                            </Card>
                        ))}
                    </div>
                ) : filteredPackages.length === 0 ? (
                    <EmptyState
                        icon={PackageSearch}
                        title="Belum Ada Paket Try Out"
                        description="Belum ada paket ujian yang dipublikasikan untuk jenjang kamu. Silakan cek kembali nanti atau berlatih soal mandiri dulu."
                        actionLabel="Mulai Latihan Soal"
                        actionHref="/practice"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPackages.map((p) => {
                            const attemptsUsed = p.attempts_used ?? 0;
                            const maxAttempts = p.max_attempts ?? 1;
                            const isRepeatable = maxAttempts > 1;
                            return (
                                <Card
                                    key={p.id}
                                    className="flex flex-col justify-between rounded-3xl border-border/80 shadow-xs"
                                >
                                    <CardHeader className="space-y-3">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] bg-primary/10 border-primary/20 text-primary gap-1"
                                            >
                                                <GraduationCap className="h-3 w-3" />
                                                {p.education_level || "Umum"}
                                            </Badge>
                                            {isRepeatable ? (
                                                <Badge variant="secondary" className="text-[10px]">
                                                    Bisa diulang ×{maxAttempts}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px]">
                                                    1 attempt
                                                </Badge>
                                            )}
                                        </div>

                                        <CardTitle className="text-base font-bold line-clamp-2">
                                            {p.name}
                                        </CardTitle>
                                        {p.code && (
                                            <CardDescription className="text-[11px]">{p.code}</CardDescription>
                                        )}
                                    </CardHeader>

                                    <CardContent className="pt-0 space-y-4">
                                        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 text-xs divide-x divide-border/60">
                                            <NumberStat value={p.subjects_count ?? 0} label="Mapel" />
                                            <NumberStat value={p.total_questions ?? 0} label="Soal" />
                                            <NumberStat value={p.duration_minutes ?? 0} label="Menit" />
                                        </div>

                                        {typeof p.last_score === "number" && (
                                            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                                                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                                                    <Trophy className="h-4 w-4 text-primary" /> Nilai terakhir
                                                </span>
                                                <span className="font-mono font-bold text-sm text-primary">
                                                    {p.last_score}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                            <span className="font-medium">
                                                Attempt {attemptsUsed} / {maxAttempts}
                                            </span>
                                            {p.status && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    {p.status}
                                                </Badge>
                                            )}
                                        </div>

                                        <Button asChild className="w-full rounded-xl font-semibold text-xs h-10 gap-1.5 shadow-xs">
                                            <Link href={`/exams/${p.id}`}>
                                                <Layers className="h-4 w-4" /> Lihat Detail
                                                <ArrowRight className="h-4 w-4 ml-auto" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

export default function ExamsPage() {
    return (
        <Suspense fallback={null}>
            <ExamsCatalog />
        </Suspense>
    );
}