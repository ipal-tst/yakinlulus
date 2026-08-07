// frontend/src/app/(siswa)/siswa/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatsCard } from "@/components/data-display/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth.store";
import { dashboardService } from "@/services/dashboard.service";
import { SiswaDashboard } from "@/types/admin";
import { StreakBanner } from "@/components/siswa/StreakBanner";
import { TargetProgressCard } from "@/components/siswa/TargetProgressCard";
import {
    FileCheck,
    Trophy,
    Award,
    Clock,
    Calendar,
    ArrowRight,
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
                setData({
                    total_exams_taken: 14,
                    average_score: 695,
                    global_rank: 38,
                    study_hours: 42.0,
                    target_school: {
                        school_name: "Universitas Indonesia",
                        major_name: "Teknik Informatika",
                        target_score: 720,
                        current_score: 695,
                        passing_chance: 88,
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
                            score: 680,
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

    return (
        <AppShell>
            <div className="space-y-8">
                {/* Welcome & Streak Banner */}
                <StreakBanner
                    userName={user?.full_name || "Siswa YakinLulus"}
                    educationLevel={user?.education_level || "SMA"}
                    grade={user?.grade || "12"}
                    streakDays={5}
                    totalExamsTaken={data?.total_exams_taken || 0}
                />

                {/* Overview Stats Cards */}
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
                                trend={{ value: 9.2, label: "meningkat" }}
                            />
                            <StatsCard
                                title="Peringkat Nasional"
                                value={`#${data?.global_rank || "-"}`}
                                icon={Award}
                                description="Dari 15.420 siswa aktif"
                            />
                            <StatsCard
                                title="Total Jam Belajar"
                                value={`${data?.study_hours || 0} jam`}
                                icon={Clock}
                                trend={{ value: 14, label: "minggu ini" }}
                            />
                        </>
                    )}
                </div>

                {/* Main Section: Target School & Recent Tryouts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Target PTN Card */}
                    <TargetProgressCard
                        schoolName={target?.school_name}
                        majorName={target?.major_name}
                        targetScore={target?.target_score}
                        currentScore={target?.current_score}
                        passingChance={target?.passing_chance}
                    />

                    {/* Recent Try Outs List */}
                    <Card className="lg:col-span-2 flex flex-col justify-between">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileCheck className="h-5 w-5 text-primary" /> Riwayat Try Out Terakhir
                                </CardTitle>
                                <Button asChild variant="ghost" size="sm" className="text-xs text-primary font-medium">
                                    <Link href="/results">Lihat Semua Hasil</Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data?.recent_exams && data.recent_exams.length > 0 ? (
                                data.recent_exams.map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-background/60 hover:bg-muted/40 transition-colors gap-3"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {user?.education_level || "SMA"} {user?.grade ? `Kelas ${user.grade}` : ""}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> {exam.date}
                                                </span>
                                            </div>
                                            <h4 className="font-heading font-semibold text-sm text-foreground">
                                                {exam.title}
                                            </h4>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                                            <div className="text-left sm:text-right">
                                                <span className="font-heading font-bold text-lg text-primary">
                                                    {exam.score}
                                                </span>
                                                <p className="text-[10px] text-muted-foreground">Skor IRT UTBK</p>
                                            </div>
                                            <Button asChild size="sm" variant="outline" className="rounded-xl gap-1">
                                                <Link href={`/results/${exam.id}`}>
                                                    Pembahasan <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
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
