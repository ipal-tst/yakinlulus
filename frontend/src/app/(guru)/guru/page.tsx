"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { StatsCard } from "@/components/data-display/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardService } from "@/services/dashboard.service";
import { HelpCircle, FileCheck, BookOpen, Plus, RefreshCw, AlertCircle } from "lucide-react";

export default function GuruDashboardPage() {
    const dashQuery = useQuery({
        queryKey: ["guru-dashboard"],
        queryFn: () => dashboardService.getTeacherDashboard(),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });

    const data = dashQuery.data ?? null;
    const refetchAll = () => {
        dashQuery.refetch();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard Guru</h1>
                    <p className="text-sm text-muted-foreground">Kelola bank soal, ujian, materi pembelajaran, dan media.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={refetchAll} className="rounded-lg">
                        <RefreshCw className={dashQuery.isFetching ? "animate-spin" : ""} />
                        Muat Ulang
                    </Button>
                    <Button asChild className="rounded-xl gap-2 font-medium">
                        <Link href="/guru/questions/create">
                            <Plus className="h-4 w-4" /> Buat Soal Baru
                        </Link>
                    </Button>
                </div>
            </div>

            {dashQuery.error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Gagal memuat data dashboard. Periksa koneksi lalu coba lagi.</span>
                    <Button variant="ghost" size="sm" onClick={refetchAll} className="ml-auto rounded-lg">
                        Coba Lagi
                    </Button>
                </div>
            )}

            {/* Stats Cards */}
            {dashQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatsCard
                        title="Total Bank Soal"
                        value={data?.total_questions || 0}
                        icon={HelpCircle}
                    />
                    <StatsCard
                        title="Ujian / Try Out Aktif"
                        value={data?.active_exams || 0}
                        icon={FileCheck}
                    />
                    <StatsCard
                        title="Materi Terpublikasi"
                        value={data?.total_materials || 0}
                        icon={BookOpen}
                    />
                </div>
            )}

            {/* Recent Questions List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-primary" /> Soal Terakhir Ditambahkan
                        </CardTitle>
                        <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
                            <Link href="/guru/questions">Kelola Bank Soal</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {dashQuery.isLoading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map((i) => (
                                <Skeleton key={i} className="h-14 rounded-xl" />
                            ))}
                        </div>
                    ) : data?.recent_questions && data.recent_questions.length > 0 ? (
                        <div className="space-y-3">
                            {data.recent_questions.map((q) => (
                                <div
                                    key={q.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/60 hover:bg-muted/40 transition-colors"
                                >
                                    <div className="space-y-1 max-w-xl">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px]">
                                                {q.subject_name}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    q.difficulty === "HARD"
                                                        ? "destructive"
                                                        : q.difficulty === "MEDIUM"
                                                            ? "warning"
                                                            : "success"
                                                }
                                                className="text-[10px]"
                                            >
                                                {q.difficulty}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-foreground font-medium truncate">
                                            {q.content_preview}
                                        </p>
                                    </div>
                                    <Button asChild size="sm" variant="outline" className="rounded-xl">
                                        <Link href={`/guru/questions/${q.id}`}>Edit</Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                            Belum ada soal dalam bank soal.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}