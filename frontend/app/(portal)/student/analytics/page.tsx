"use client";

import * as React from "react";
import Link from "next/link";
import {
    Trophy,
    TrendingUp,
    Target,
    BarChart2,
    AlertCircle,
    ArrowUpRight,
    Sparkles,
    Loader2,
    XCircle,
    CheckCircle2,
    Calendar,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PerformanceRadarChart, RadarMetric } from "@/components/analytics/PerformanceRadarChart";
import { PerformanceTrendChart, TrendPoint } from "@/components/analytics/PerformanceTrendChart";
import { useAuth } from "@/providers/AuthProvider";
import { useStudentAnalytics, useStudentTimeline } from "@/lib/api";

interface SubjectBreakdown {
    subject_id: string;
    subject_name: string;
    questions_count: number;
    correct_count: number;
    total_score: number;
    max_score: number;
    percentage: number;
}

interface RecentResult {
    exam_content_id: string;
    exam_title: string;
    score: number;
    is_passed: boolean;
    created_at: string;
}

interface StudentAnalyticsData {
    total_exams_taken: number;
    average_score: number;
    total_passed: number;
    total_failed: number;
    total_questions: number;
    total_correct: number;
    total_wrong: number;
    total_unanswered: number;
    accuracy: number;
    subjects: SubjectBreakdown[];
    recent_results: RecentResult[];
}

interface TimelineEntry {
    date: string;
    score: number;
    exam_title: string;
    subject: string;
}

export default function StudentAnalyticsPage() {
    const { user } = useAuth();
    const studentId = user?.id || "";

    const { data: analytics, isLoading: isLoadingAnalytics, error: analyticsError } = useStudentAnalytics(studentId);
    const { data: timeline, isLoading: isLoadingTimeline } = useStudentTimeline(studentId);

    const stats = (analytics as any) as StudentAnalyticsData | undefined;
    const timelineData = (timeline as any) as TimelineEntry[] | undefined;

    if (!studentId) {
        return (
            <div className="max-w-5xl mx-auto p-6 pb-16">
                <Card className="border-destructive bg-destructive/5 p-6 text-center">
                    <XCircle className="h-10 w-10 mx-auto mb-3 text-destructive" />
                    <h3 className="font-bold mb-1">Belum Login</h3>
                    <p className="text-sm text-muted-foreground">Silakan login untuk melihat analitik</p>
                </Card>
            </div>
        );
    }

    if (isLoadingAnalytics || isLoadingTimeline) {
        return (
            <div className="max-w-5xl mx-auto p-6 pb-16">
                <Card className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
                    <p className="text-muted-foreground">Memuat data analitik...</p>
                </Card>
            </div>
        );
    }

    if (analyticsError) {
        return (
            <div className="max-w-5xl mx-auto p-6 pb-16">
                <Card className="border-destructive bg-destructive/5 p-6 text-center">
                    <XCircle className="h-10 w-10 mx-auto mb-3 text-destructive" />
                    <h3 className="font-bold mb-1">Gagal Memuat Data</h3>
                    <p className="text-sm text-muted-foreground">Coba refresh halaman</p>
                </Card>
            </div>
        );
    }

    const subjects: SubjectBreakdown[] = stats?.subjects || [];
    const recentResults: RecentResult[] = stats?.recent_results || [];
    const totalTests = stats?.total_exams_taken || 0;
    const avgScore = stats?.average_score || 0;
    const accuracy = stats?.accuracy || 0;
    const totalCorrect = stats?.total_correct || 0;
    const totalWrong = stats?.total_wrong || 0;
    const totalUnanswered = stats?.total_unanswered || 0;
    const totalQuestions = stats?.total_questions || 0;
    const passed = stats?.total_passed || 0;
    const failed = stats?.total_failed || 0;

    const radarData: RadarMetric[] = subjects.map((s) => {
        const pct = s.percentage;
        let status: RadarMetric["status"] = "SAFE";
        if (pct >= 80) status = "EXCELLENT";
        else if (pct < 60) status = "BOOST_NEEDED";
        return {
            subtest: s.subject_name,
            score: Math.round(pct * 10),
            targetScore: 600,
            status,
        };
    });

    const trendData: TrendPoint[] = (timelineData || [])
        .slice()
        .reverse()
        .map((t) => ({
            tryoutTitle: t.exam_title || t.subject || "Tryout",
            date: new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
            score: Math.round(t.score),
        }));

    const weakest = [...subjects].sort((a, b) => a.percentage - b.percentage).slice(0, 2);
    const strongest = [...subjects].sort((a, b) => b.percentage - a.percentage).slice(0, 1);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Analitik Belajar & Hasil Ujian</h2>
                    <p className="text-sm text-muted-foreground">
                        Pantau progresi skor, akurasi jawaban, dan analisis per mata pelajaran.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 border-primary/30 bg-primary/5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-primary font-semibold">Total Ujian</span>
                        <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-black mt-2">{totalTests}</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Tryout & ujian selesai</p>
                </Card>

                <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-600 font-semibold">Akurasi</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black mt-2">{accuracy.toFixed(1)}%</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{totalCorrect} benar / {totalQuestions} soal</p>
                </Card>

                <Card className="p-4 border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-600 font-semibold">Rata-rata Skor</span>
                        <BarChart2 className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black mt-2">{avgScore.toFixed(1)}</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Dari {totalTests} ujian</p>
                </Card>

                <Card className="p-4 border-violet-500/30 bg-violet-500/5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-violet-600 font-semibold">Lulus / Gagal</span>
                        <Trophy className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="text-2xl font-black mt-2">{passed} / {failed}</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{passed + failed > 0 ? ((passed / (passed + failed)) * 100).toFixed(0) : 0}% tingkat kelulusan</p>
                </Card>
            </div>

            <Card className="p-4 border bg-card shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">Ringkasan Akurasi</Badge>
                        </div>
                        <h3 className="font-bold">Rincian Jawaban: {totalCorrect} Benar / {totalWrong} Salah / {totalUnanswered} Kosong</h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-mono">
                        <div className="text-center">
                            <div className="text-lg font-bold text-emerald-600">{totalCorrect}</div>
                            <div className="text-[10px] text-muted-foreground">Benar</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-destructive">{totalWrong}</div>
                            <div className="text-[10px] text-muted-foreground">Salah</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-muted-foreground">{totalUnanswered}</div>
                            <div className="text-[10px] text-muted-foreground">Kosong</div>
                        </div>
                    </div>
                </div>
                <div className="mt-3 h-3 w-full bg-muted rounded-full overflow-hidden flex">
                    {totalQuestions > 0 && (
                        <>
                            <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${(totalCorrect / totalQuestions) * 100}%` }}
                            />
                            <div
                                className="h-full bg-destructive"
                                style={{ width: `${(totalWrong / totalQuestions) * 100}%` }}
                            />
                            <div
                                className="h-full bg-muted-foreground/30"
                                style={{ width: `${(totalUnanswered / totalQuestions) * 100}%` }}
                            />
                        </>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-xs flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" /> Radar Penguasaan Per Mata Pelajaran
                        </CardTitle>
                        <CardDescription>
                            Visualisasi akurasi jawaban per sub-tes dibandingkan target 60%.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-6">
                        {radarData.length > 0 ? (
                            <PerformanceRadarChart metrics={radarData} />
                        ) : (
                            <p className="text-sm text-muted-foreground">Belum ada data ujian</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-xs flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" /> Histori Tren Skor
                        </CardTitle>
                        <CardDescription>
                            Progresi skor dari waktu ke waktu berdasarkan riwayat ujian.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-6">
                        {trendData.length > 0 ? (
                            <PerformanceTrendChart data={trendData} targetCutoff={60} />
                        ) : (
                            <p className="text-sm text-muted-foreground">Minimal 1 ujian diperlukan untuk tren</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-xs">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-primary" /> Penguasaan Per Mata Pelajaran
                        </CardTitle>
                        <CardDescription>
                            Persentase kebenaran jawaban per sub-tes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {subjects.length > 0 ? subjects.map((sub, idx) => (
                            <div key={idx} className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold">{sub.subject_name}</span>
                                    <div className="flex items-center gap-2 font-mono">
                                        <span className="font-bold">{sub.percentage.toFixed(1)}%</span>
                                        <span className="text-muted-foreground text-[11px]">({sub.correct_count}/{sub.questions_count} benar)</span>
                                        {sub.percentage >= 80 && <Badge variant="default" className="text-[10px] py-0 bg-emerald-600">EXCELLENT</Badge>}
                                        {sub.percentage >= 60 && sub.percentage < 80 && <Badge variant="secondary" className="text-[10px] py-0">SAFE</Badge>}
                                        {sub.percentage < 60 && <Badge variant="destructive" className="text-[10px] py-0">BOOST NEEDED</Badge>}
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${sub.percentage >= 80 ? "bg-emerald-500" : sub.percentage >= 60 ? "bg-primary" : "bg-destructive"}`}
                                        style={{ width: `${Math.min(100, sub.percentage)}%` }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Belum ada data per sub-tes</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-xs">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" /> Rekomendasi Belajar
                        </CardTitle>
                        <CardDescription>
                            Fokus perbaikan berdasarkan performa terkini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                        {weakest.length > 0 && weakest.map((w, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border space-y-1 ${w.percentage < 60 ? "bg-destructive/10 border-destructive/20" : "bg-amber-50 border-amber-200"}`}>
                                <span className={`font-bold flex items-center gap-1 ${w.percentage < 60 ? "text-destructive" : "text-amber-600"}`}>
                                    <AlertCircle className="h-3.5 w-3.5" /> Prioritas {idx + 1}: {w.subject_name}
                                </span>
                                <p className="text-muted-foreground leading-relaxed">
                                    Akurasi {w.percentage.toFixed(1)}% ({w.correct_count}/{w.questions_count} benar).
                                    {w.percentage < 60 ? " Perlu perbaikan intensif. " : " Dapat ditingkatkan lagi. "}
                                </p>
                            </div>
                        ))}

                                                {strongest.length > 0 && strongest[0].percentage >= 80 && (
                            <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200 space-y-1">
                                <span className="font-bold text-emerald-700 flex items-center gap-1">
                                    <Trophy className="h-3.5 w-3.5" /> Kekuatan: {strongest[0].subject_name}
                                </span>
                                <p className="text-muted-foreground leading-relaxed">
                                    Akurasi {strongest[0].percentage.toFixed(1)}% — pertahankan!
                                </p>
                            </div>
                        )}

                        <div className="pt-2">
                            <Link href="/student/exam">
                                <Button className="w-full text-xs" size="sm">
                                    Ambil Ujian Selanjutnya <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {recentResults.length > 0 && (
                <Card className="shadow-xs">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" /> Riwayat Ujian Terakhir
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-3 font-medium">Ujian</th>
                                        <th className="pb-3 font-medium text-center">Skor</th>
                                        <th className="pb-3 font-medium text-center">Status</th>
                                        <th className="pb-3 font-medium text-right">Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentResults.map((r, idx) => (
                                        <tr key={idx} className="border-b border-muted/50 hover:bg-muted/30">
                                            <td className="py-3 font-medium">{r.exam_title}</td>
                                            <td className="py-3 text-center font-mono font-bold">{r.score?.toFixed(1) ?? "—"}</td>
                                            <td className="py-3 text-center">
                                                <Badge variant={r.is_passed ? "default" : "destructive"} className={`text-[10px] ${r.is_passed ? "bg-emerald-600" : ""}`}>
                                                    {r.is_passed ? "LULUS" : "TIDAK LULUS"}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-right text-muted-foreground text-xs">
                                                {new Date(r.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {totalTests === 0 && (
                <Card className="p-12 text-center space-y-3 bg-muted/10 border-dashed">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                    <h4 className="font-bold text-base">Belum Ada Ujian Selesai</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Mulai mengerjakan ujian untuk melihat analitik perkembangan Anda.
                    </p>
                    <Link href="/student/exam">
                        <Button className="mt-4" size="sm">Mulai Ujian Sekarang</Button>
                    </Link>
                </Card>
            )}
        </div>
    );
}