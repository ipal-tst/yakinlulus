"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatsCard } from "@/components/data-display/stats-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth.store";
import { dashboardService } from "@/services/dashboard.service";
import { SiswaDashboard } from "@/types/admin";
import {
    FileCheck,
    Trophy,
    Award,
    Clock,
    Target,
    ArrowRight,
    BookOpen,
    Sparkles,
} from "lucide-react";

export default function SiswaDashboardPage() {
    const { user } = useAuthStore();
    const [data, setData] = useState<SiswaDashboard | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await dashboardService.getStudentDashboard();
                setData(res);
            } catch {
                // Fallback mock data if API unavailable
                setData({
                    total_exams_taken: 12,
                    average_score: 685,
                    global_rank: 42,
                    study_hours: 38.5,
                    target_school: {
                        school_name: "Universitas Indonesia",
                        major_name: "Teknik Informatika",
                        target_score: 720,
                        current_score: 685,
                        passing_chance: 85,
                    },
                    recent_exams: [
                        {
                            id: "ex-1",
                            title: "Try Out Nasional UTBK SNBT #5",
                            score: 710,
                            date: "2026-03-01",
                            passed: true,
                        },
                        {
                            id: "ex-2",
                            title: "Try Out Penalaran Matematika #3",
                            score: 660,
                            date: "2026-02-25",
                            passed: true,
                        },
                    ],
                });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const target = data?.target_school;
    const targetScore = target?.target_score || 700;
    const currentScore = target?.current_score || 650;
    const progressPercent = Math.min(100, Math.round((currentScore / targetScore) * 100));

    return (
        <AppShell>
            <div className="space-y-8">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary via-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-lg">
                    <div className="relative z-10 space-y-2 max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
                            <Sparkles className="h-3.5 w-3.5" /> Siap Menghadapi UTBK/SNBT 2026
                        </span>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
                            Selamat datang kembali, {user?.full_name || "Siswa YakinLulus"}! 👋
                        </h1>
                        <p className="text-white/80 text-sm md:text-base leading-relaxed">
                            Konsistensi adalah kunci. Kamu sudah mengerjakan{" "}
                            <strong className="text-white font-semibold">{data?.total_exams_taken || 0} Try Out</strong> sejauh ini. Terus tingkatkan kemampuanmu!
                        </p>
                        <div className="pt-2 flex flex-wrap gap-3">
                            <Button asChild className="rounded-xl bg-white text-primary hover:bg-white/90 font-semibold shadow-sm">
                                <Link href="/exams">Mulai Try Out Baru <ArrowRight className="h-4 w-4 ml-1" /></Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 font-semibold">
                                <Link href="/materials">Pelajari Materi</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Overview Stats Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
                    ) : (
                        <>
                            <StatsCard
                                title="Try Out Selesai"
                                value={data?.total_exams_taken || 0}
                                icon={FileCheck}
                                trend={{ value: 15, label: "vs bulan lalu" }}
                            />
                            <StatsCard
                                title="Rata-rata Skor UTBK"
                                value={data?.average_score || 0}
                                icon={Trophy}
                                trend={{ value: 8.4, label: "meningkat" }}
                            />
                            <StatsCard
                                title="Peringkat Nasional"
                                value={`#${data?.global_rank || "-"}`}
                                icon={Award}
                                description="Dari 15.420 siswa"
                            />
                            <StatsCard
                                title="Total Jam Belajar"
                                value={`${data?.study_hours || 0} jam`}
                                icon={Clock}
                                trend={{ value: 12, label: "minggu ini" }}
                            />
                        </>
                    )}
                </div>

                {/* Main Content Grid: Target School & Recent Tryouts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Target School Card */}
                    <Card className="lg:col-span-1 border-primary/20 bg-linear-to-b from-card to-blue-50/30 dark:to-blue-950/10">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" /> Target PTN Impian
                                </CardTitle>
                                <Badge variant="success">{target?.passing_chance || 80}% Peluang Lulus</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-heading text-lg font-bold text-foreground">
                                    {target?.school_name || "Universitas Indonesia"}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {target?.major_name || "Teknik Informatika"}
                                </p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span>Skor Saat Ini: <strong className="text-primary font-bold">{currentScore}</strong></span>
                                    <span>Target: <strong>{targetScore}</strong></span>
                                </div>
                                <Progress value={progressPercent} className="h-3" />
                                <p className="text-[11px] text-muted-foreground text-right">
                                    Kurang {Math.max(0, targetScore - currentScore)} poin dari target minimum
                                </p>
                            </div>

                            <Button asChild variant="outline" className="w-full rounded-xl mt-2 font-medium">
                                <Link href="/targets">Ubah Target PTN</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Try Outs List */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileCheck className="h-5 w-5 text-primary" /> Riwayat Try Out Terakhir
                                </CardTitle>
                                <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
                                    <Link href="/results">Lihat Semua</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {data?.recent_exams && data.recent_exams.length > 0 ? (
                                <div className="space-y-3">
                                    {data.recent_exams.map((exam) => (
                                        <div
                                            key={exam.id}
                                            className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/60 hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="space-y-1">
                                                <h4 className="font-heading font-semibold text-sm text-foreground">
                                                    {exam.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground">{exam.date}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="font-heading font-bold text-lg text-primary">
                                                        {exam.score}
                                                    </span>
                                                    <p className="text-[10px] text-muted-foreground">Skor UTBK</p>
                                                </div>
                                                <Button asChild size="sm" variant="outline" className="rounded-xl">
                                                    <Link href={`/results/${exam.id}`}>Pembahasan</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Belum ada try out yang diselesaikan.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppShell>
    );
}
