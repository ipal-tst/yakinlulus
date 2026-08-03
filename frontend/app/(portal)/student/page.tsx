"use client";

import * as React from "react";
import Link from "next/link";
import { useStudentDashboard, useResults } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Flame, Trophy, BookOpen, HelpCircle, FileSpreadsheet,
    Bot, Play, Calendar, ArrowRight, Sparkles, Medal, Activity, Target,
} from "lucide-react";

const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
};

const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function StudentDashboardPage() {
    const { data: dashData, isLoading } = useStudentDashboard() as any;
    const { data: resultsData } = useResults(1, 10) as any;

    const greeting = dashData?.greeting ?? {};
    const examStats = dashData?.exam_stats ?? {};
    const continueLearning = dashData?.continue_learning;
    const todayGoal = dashData?.today_goal ?? {};
    const learningProgress = dashData?.learning_progress ?? [];
    const weeklyActivity = dashData?.weekly_activity ?? [];
    const upcomingExams = dashData?.upcoming_exams ?? [];
    const recentActivity = dashData?.recent_activity ?? [];

    const recentResults = Array.isArray(resultsData) ? resultsData : [];

    const studentName = greeting?.full_name || "Murid";
    const initial = studentName.charAt(0).toUpperCase();
    const totalCompleted = examStats?.total_completed ?? 0;
    const averageScore = examStats?.average_score ?? 0;
    const highestScore = examStats?.highest_score ?? 0;
    const nationalRank = examStats?.national_rank ?? 0;

    const maxActivity = Math.max(...weeklyActivity.map((d: any) => d.questions + d.materials), 1);

    return (
        <div className="space-y-6 pb-6">
            {/* Welcome */}
            <section className="relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                                {greeting.greeting || "Selamat Datang"} 👋
                            </span>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
                                {isLoading ? "..." : `Halo, ${studentName}!`}
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">{greeting.date || formatDate(new Date().toISOString())}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full shrink-0">
                            <Target className="h-4 w-4" />
                            <span className="text-xs font-bold">Tryout Ku</span>
                        </div>
                    </div>
                </div>
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-24 -left-12 w-32 h-32 bg-success/5 rounded-full blur-2xl pointer-events-none" />
            </section>

            {/* Key Statistics Grid */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { icon: FileSpreadsheet, value: totalCompleted, label: "Tryout Selesai" },
                    { icon: Trophy, value: averageScore ? averageScore.toFixed(1) : "—", label: "Rata-rata Nilai" },
                    { icon: Medal, value: highestScore ? highestScore.toFixed(1) : "—", label: "Nilai Tertinggi" },
                    { icon: Target, value: nationalRank ? `#${nationalRank}` : "—", label: "Peringkat Nasional" },
                ].map((stat, i) => (
                    <div key={i} className="bg-muted/60 p-4 rounded-xl flex flex-col items-center text-center">
                        <stat.icon className="h-5 w-5 text-primary mb-1.5" />
                        <span className="text-xl font-extrabold">{stat.value}</span>
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                ))}
            </section>

            {/* Continue Learning Hero */}
            {continueLearning ? (
                <section className="bg-primary rounded-2xl p-6 text-primary-foreground relative overflow-hidden shadow-lg shadow-primary/20">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Play className="h-4 w-4 fill-primary-foreground" />
                            <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">Lanjutkan Belajar</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1">{continueLearning.title}</h3>
                        <p className="text-xs opacity-90 mb-4">
                            {continueLearning.subject_name || "Materi"} · {Math.round(continueLearning.progress || 0)}% selesai
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="h-1.5 bg-white/20 rounded-full">
                                    <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(continueLearning.progress || 0, 100)}%` }} />
                                </div>
                            </div>
                            <Link href="/student/materials">
                                <Button size="sm" className="bg-white text-primary hover:bg-white/90 text-xs font-bold shadow-sm">
                                    Lanjutkan
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <BookOpen className="h-40 w-40" />
                    </div>
                </section>
            ) : (
                <section className="bg-primary rounded-2xl p-6 text-primary-foreground relative overflow-hidden shadow-lg shadow-primary/20">
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold">Mulai Belajar Hari Ini</h3>
                            <p className="text-xs opacity-90 mt-1">Pilih materi atau kerjakan latihan soal pertamamu.</p>
                        </div>
                        <Link href="/student/materials">
                            <Button size="sm" className="bg-white text-primary hover:bg-white/90 text-xs font-bold shadow-sm">
                                Mulai
                            </Button>
                        </Link>
                    </div>
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                        <BookOpen className="h-40 w-40" />
                    </div>
                </section>
            )}

            {/* Quick Actions */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { href: "/student/materials", icon: BookOpen, label: "Belajar Materi", sub: `${learningProgress.length} Mapel`, color: "bg-primary/10 text-primary" },
                    { href: "/student/practice", icon: HelpCircle, label: "Latihan Soal", sub: "Adaptif", color: "bg-success/10 text-success" },
                    { href: "/student/exam", icon: FileSpreadsheet, label: "Ujian CBT", sub: `${upcomingExams.length} Tryout`, color: "bg-warning/10 text-warning" },
                    { href: "/student/ai-tutor", icon: Bot, label: "AI Tutor", sub: "24/7", color: "bg-indigo-500/10 text-indigo-500" },
                ].map((item) => (
                    <Link key={item.href} href={item.href}>
                        <div className="bg-card p-4 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                            <div className={`h-10 w-10 rounded-xl ${item.color} flex items-center justify-center mb-2.5`}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-xs">{item.label}</h3>
                            <span className="text-[10px] text-muted-foreground">{item.sub}</span>
                        </div>
                    </Link>
                ))}
            </section>

            {/* Recent Exam Results */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold text-sm flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-primary" /> Nilai Ujian Terbaru
                    </h2>
                    <Link href="/student/exam" className="text-xs font-bold text-primary">Lihat Semua</Link>
                </div>
                {recentResults.length > 0 ? (
                    <div className="space-y-3">
                        {recentResults.slice(0, 5).map((r: any) => (
                            <Link key={r.id} href={`/student/exam/${r.exam_id || r.exam_content_id}/result`} className="flex items-center gap-4 p-4 bg-card rounded-2xl border hover:border-primary/40 hover:shadow-md transition-all">
                                <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                                    <span className="text-[10px] font-bold leading-none uppercase">{new Date(r.created_at).toLocaleDateString("id-ID", { month: "short" })}</span>
                                    <span className="text-lg font-extrabold leading-tight">{new Date(r.created_at).getDate()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-xs truncate">Ujian #{r.exam_id?.slice(0, 8) || r.session_id?.slice(0, 8) || "Tryout"}</h4>
                                    <p className="text-[11px] text-muted-foreground">
                                        {(r.score ?? 0).toFixed(1)} · {r.is_passed ? "LULUS" : "BELUM LULUS"}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-[10px] shrink-0">{r.correct_count ?? 0}/{r.total_questions ?? 0} benar</Badge>
                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl border border-dashed p-8 text-center">
                        <p className="text-xs text-muted-foreground">Belum ada nilai ujian. Selesaikan tryout pertamamu!</p>
                    </div>
                )}
            </section>

            {/* Recent Materials Horizontal Scroll */}
            {learningProgress.length > 0 && (
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-sm">Materi Terbaru</h2>
                        <Link href="/student/materials" className="text-xs font-bold text-primary">Lihat Semua</Link>
                    </div>
                    <div className="flex overflow-x-auto gap-3 pb-1 no-scrollbar">
                        {learningProgress.slice(0, 5).map((sp: any, i: number) => (
                            <Link key={sp.subject_id} href="/student/materials" className="min-w-[180px] bg-card rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition-shadow">
                                <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 relative flex items-center justify-center">
                                    <BookOpen className="h-8 w-8 text-primary/40" />
                                    <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-md text-[10px] font-bold">
                                        {sp.subject_name || "Materi"}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-xs leading-tight mb-1 line-clamp-1">{sp.subject_name || "Mata Pelajaran"}</h4>
                                    <p className="text-[10px] text-muted-foreground">{Math.round(sp.progress_pct || 0)}% selesai</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Upcoming Exams */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold text-sm">Tryout Mendatang</h2>
                    <Link href="/student/exam" className="text-xs font-bold text-primary">Lihat Semua</Link>
                </div>
                {upcomingExams.length > 0 ? (
                    <div className="space-y-3">
                        {upcomingExams.slice(0, 4).map((ex: any) => {
                            const d = new Date(ex.start_time || ex.exam_id);
                            return (
                                <Link key={ex.exam_id} href={`/student/exam/${ex.exam_id}/info`} className="flex items-center gap-4 p-4 bg-card rounded-2xl border hover:border-primary/40 hover:shadow-md transition-all">
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                                        <span className="text-[10px] font-bold leading-none uppercase">{d.toLocaleDateString("id-ID", { month: "short" })}</span>
                                        <span className="text-lg font-extrabold leading-tight">{d.getDate()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-xs truncate">{ex.title}</h4>
                                        <p className="text-[11px] text-muted-foreground">
                                            {ex.duration_minutes || 120} Menit · {ex.subject_name || "Tryout"}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl border border-dashed p-8 text-center">
                        <p className="text-xs text-muted-foreground">Belum ada tryout tersedia.</p>
                    </div>
                )}
            </section>

            {/* Weekly Activity */}
            <section className="bg-card rounded-2xl border p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-sm">Aktivitas 7 Hari</h2>
                    <Activity className="h-4 w-4 text-primary" />
                </div>
                {weeklyActivity.length > 0 ? (
                    <div className="flex items-end gap-2 pt-2" style={{ height: 100 }}>
                        {weeklyActivity.map((day: any, i: number) => {
                            const val = (day.questions + day.materials) || 0;
                            const pct = Math.max((val / maxActivity) * 100, 6);
                            const dayDate = new Date(day.date);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[9px] text-muted-foreground">{val}</span>
                                    <div className="w-full bg-primary/20 rounded-t-md" style={{ height: `${pct}%`, minHeight: 6 }}>
                                        <div className="w-full bg-primary rounded-t-md" style={{ height: "100%" }} />
                                    </div>
                                    <span className="text-[9px] text-muted-foreground">{dayLabels[dayDate.getDay()]}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground py-4 text-center">Belum ada aktivitas minggu ini.</p>
                )}
            </section>

            {/* Leaderboard Preview */}
            <section className="bg-card rounded-2xl border p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-sm flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-warning" /> Peringkat Nasional
                    </h2>
                    <Link href="/student/leaderboard" className="text-xs font-bold text-primary">Lihat Peringkat</Link>
                </div>
                <p className="text-xs text-muted-foreground">
                    {nationalRank ? (
                        <>Kamu berada di peringkat <span className="font-bold text-primary">#{nationalRank}</span> nasional bulan ini.</>
                    ) : (
                        "Selesaikan tryout untuk masuk peringkat nasional."
                    )}
                </p>
            </section>

            {/* Daily Tip */}
            <section className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex gap-4 items-start">
                <div className="bg-white/70 p-3 rounded-lg shrink-0">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <h5 className="text-sm font-bold mb-1">Tips Hari Ini</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Cobalah teknik Pomodoro: belajar 25 menit, istirahat 5 menit. Ini menjaga fokusmu tetap tajam.
                    </p>
                </div>
            </section>
        </div>
    );
}
