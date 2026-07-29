"use client";

import * as React from "react";
import Link from "next/link";
import { useStudentDashboard } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Flame, Trophy, BookOpen, HelpCircle, FileSpreadsheet,
    Bot, Play, Calendar, ArrowRight, Sparkles, Target, Zap,
    TrendingUp, CheckCircle2, Clock, Medal, Activity, BarChart3,
} from "lucide-react";

const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
};

const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function StudentDashboardPage() {
    const { data: dashData, isLoading } = useStudentDashboard() as any;

    const greeting = dashData?.greeting ?? {};
    const achievement = dashData?.achievement ?? {};
    const continueLearning = dashData?.continue_learning;
    const todayGoal = dashData?.today_goal ?? {};
    const learningProgress = dashData?.learning_progress ?? [];
    const weeklyActivity = dashData?.weekly_activity ?? [];
    const upcomingExams = dashData?.upcoming_exams ?? [];
    const leaderboard = dashData?.leaderboard ?? [];
    const recentActivity = dashData?.recent_activity ?? [];

    const studentName = greeting?.full_name || "Murid";
    const initial = studentName.charAt(0).toUpperCase();
    const totalXP = achievement?.total_xp ?? 0;
    const level = achievement?.level ?? 1;
    const streak = achievement?.streak ?? 0;
    const badgesCount = achievement?.badges_count ?? 0;

    const maxActivity = Math.max(...weeklyActivity.map((d: any) => d.questions + d.materials), 1);

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Student Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-card p-6 rounded-2xl border shadow-xs">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center shadow-md shadow-primary/20">
                        {isLoading ? "..." : initial}
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight">
                                {isLoading ? "..." : `${greeting.greeting || "Selamat Datang"}, ${studentName}!`}
                            </h1>
                            <Badge variant="default" className="text-[10px] font-bold">SNBT 2026 Fighter</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {greeting.date || formatDate(new Date().toISOString())}
                        </p>
                        {greeting.motivation && (
                            <p className="text-[11px] text-muted-foreground italic mt-0.5">
                                &ldquo;{greeting.motivation}&rdquo;
                            </p>
                        )}
                    </div>
                </div>

                {/* Gamification Bar */}
                <div className="flex items-center gap-3 self-stretch md:self-auto">
                    <div className="px-3.5 py-2 rounded-xl bg-card border flex items-center gap-2 shadow-2xs">
                        <Flame className={`h-4 w-4 ${streak > 0 ? "text-warning animate-bounce" : "text-muted-foreground"}`} />
                        <div>
                            <span className="text-[10px] text-muted-foreground block font-semibold">Streak</span>
                            <span className="font-extrabold text-xs text-foreground">{streak} Hari</span>
                        </div>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-card border flex items-center gap-2 shadow-2xs">
                        <Trophy className="h-4 w-4 text-primary" />
                        <div>
                            <span className="text-[10px] text-muted-foreground block font-semibold">Level {level}</span>
                            <span className="font-extrabold text-xs text-foreground">{totalXP.toLocaleString()} XP</span>
                        </div>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-card border flex items-center gap-2 shadow-2xs">
                        <Medal className="h-4 w-4 text-indigo-500" />
                        <div>
                            <span className="text-[10px] text-muted-foreground block font-semibold">Lencana</span>
                            <span className="font-extrabold text-xs text-foreground">{badgesCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { href: "/student/materials", icon: BookOpen, label: "Belajar Materi", sub: `${learningProgress.length} Mata Pelajaran`, color: "bg-primary/10 text-primary" },
                    { href: "/student/practice", icon: HelpCircle, label: "Latihan Soal", sub: "Adaptif & Daily", color: "bg-indigo-500/10 text-indigo-500" },
                    { href: "/student/exam", icon: FileSpreadsheet, label: "Ujian CBT", sub: `${upcomingExams.length} Tryout Tersedia`, color: "bg-warning/10 text-warning" },
                    { href: "/student/ai-tutor", icon: Bot, label: "AI Tutor 24/7", sub: "Tanya Rumus & Soal", color: "bg-success/10 text-success" },
                ].map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Card className="p-4 flex items-center gap-3.5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
                            <div className={`h-10 w-10 rounded-xl ${item.color} flex items-center justify-center font-bold group-hover:scale-105 transition-transform`}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xs group-hover:text-primary transition-colors">{item.label}</h3>
                                <span className="text-[10px] text-muted-foreground">{item.sub}</span>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* 3-Column Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Continue Learning */}
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-sm">Lanjutkan Belajar</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px]">Continue Learning</Badge>
                        </div>
                        {continueLearning ? (
                            <div className="p-4 rounded-xl border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-2 w-full">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="default" className="text-[10px]">
                                            {continueLearning.subject_name || "Materi"}
                                        </Badge>
                                        {continueLearning.remaining_minutes > 0 && (
                                            <span className="text-[10px] text-muted-foreground">
                                                ~{continueLearning.remaining_minutes} menit lagi
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-extrabold text-sm">{continueLearning.title}</h4>
                                    <div className="w-full bg-muted rounded-full h-1.5">
                                        <div
                                            className="bg-primary rounded-full h-1.5 transition-all"
                                            style={{ width: `${Math.min(continueLearning.progress || 0, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                        {Math.round(continueLearning.progress || 0)}% selesai
                                    </span>
                                </div>
                                <Link href="/student/materials">
                                    <Button size="sm" className="text-xs font-bold shrink-0">
                                        <Play className="mr-1.5 h-3.5 w-3.5 fill-primary-foreground" /> Lanjutkan
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl border bg-muted/20 text-center">
                                <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">Belum ada materi yang sedang dipelajari.</p>
                                <Link href="/student/materials">
                                    <Button variant="outline" size="sm" className="text-xs font-bold mt-3">
                                        Mulai Belajar
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </Card>

                    {/* Today's Goal + Learning Progress */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Today's Goal */}
                        <Card className="p-5 space-y-3">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="font-bold text-xs flex items-center gap-2">
                                    <Target className="h-3.5 w-3.5 text-primary" /> Target Hari Ini
                                </h4>
                                <Badge variant="outline" className="text-[10px]">Daily Goal</Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Materi</span>
                                    <span className="font-bold">{todayGoal.completed_materials || 0}/{todayGoal.target_materials || 3}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Soal Terjawab</span>
                                    <span className="font-bold">{todayGoal.answered_questions || 0}/{todayGoal.target_questions || 10}</span>
                                </div>
                                <div className="pt-2">
                                    <div className="flex items-center justify-between text-[10px] mb-1">
                                        <span className="text-muted-foreground">Progres</span>
                                        <span className="font-bold">{Math.round((todayGoal.progress_pct || 0) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary rounded-full h-2 transition-all"
                                            style={{ width: `${Math.min((todayGoal.progress_pct || 0) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Learning Progress Summary */}
                        <Card className="p-5 space-y-3">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="font-bold text-xs flex items-center gap-2">
                                    <BarChart3 className="h-3.5 w-3.5 text-indigo-500" /> Progres Mata Pelajaran
                                </h4>
                            </div>
                            {learningProgress.length > 0 ? (
                                <div className="space-y-2">
                                    {learningProgress.slice(0, 4).map((sp: any) => (
                                        <div key={sp.subject_id}>
                                            <div className="flex items-center justify-between text-[11px] mb-0.5">
                                                <span className="font-semibold">{sp.subject_name || sp.subject_id?.slice(0, 8)}</span>
                                                <span className="text-muted-foreground">{Math.round(sp.progress_pct || 0)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-1.5">
                                                <div
                                                    className="bg-indigo-500 rounded-full h-1.5 transition-all"
                                                    style={{ width: `${Math.min(sp.progress_pct || 0, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground py-2">Belum ada data progres.</p>
                            )}
                        </Card>
                    </div>

                    {/* Weekly Activity Chart */}
                    <Card className="p-5 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-xs flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5 text-primary" /> Aktivitas 7 Hari Terakhir
                            </h4>
                        </div>
                        {weeklyActivity.length > 0 ? (
                            <div className="flex items-end gap-2 pt-2" style={{ height: 100 }}>
                                {weeklyActivity.map((day: any, i: number) => {
                                    const val = (day.questions + day.materials) || 0;
                                    const pct = Math.max((val / maxActivity) * 100, 4);
                                    const dayDate = new Date(day.date);
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-[9px] text-muted-foreground">{val}</span>
                                            <div
                                                className="w-full bg-primary/20 rounded-t-sm"
                                                style={{ height: `${pct}%`, minHeight: 4 }}
                                            >
                                                <div
                                                    className="w-full bg-primary rounded-t-sm transition-all"
                                                    style={{ height: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] text-muted-foreground">
                                                {dayLabels[dayDate.getDay()]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground py-4 text-center">
                                Belum ada aktivitas minggu ini. Mulai belajar untuk mengisi grafik!
                            </p>
                        )}
                    </Card>

                    {/* Upcoming Exams */}
                    <Card className="p-5 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-xs flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-primary" /> Tryout Tersedia
                            </h4>
                            <span className="text-[10px] text-muted-foreground">{upcomingExams.length} Paket</span>
                        </div>
                        {upcomingExams.length > 0 ? (
                            <div className="space-y-2">
                                {upcomingExams.slice(0, 5).map((ex: any) => (
                                    <div key={ex.exam_id} className="p-3 rounded-lg border bg-background flex items-center justify-between">
                                        <div className="min-w-0 mr-2">
                                            <span className="font-bold block text-xs truncate">{ex.title}</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {ex.subject_name && (
                                                    <Badge variant="outline" className="text-[9px]">{ex.subject_name}</Badge>
                                                )}
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    <Clock className="h-3 w-3 inline mr-0.5" />
                                                    {ex.duration_minutes} Menit
                                                </span>
                                            </div>
                                        </div>
                                        <Link href={`/student/exam/${ex.exam_id}/info`}>
                                            <Button size="sm" variant="outline" className="text-[11px] h-7 font-bold shrink-0">
                                                Ikuti
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground py-2">Belum ada tryout tersedia.</p>
                        )}
                    </Card>

                    {/* Recent Activity */}
                    <Card className="p-5 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-xs flex items-center gap-2">
                                <Activity className="h-3.5 w-3.5 text-primary" /> Aktivitas Terbaru
                            </h4>
                        </div>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-1">
                                {recentActivity.slice(0, 5).map((act: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                            act.type === "exam" ? "bg-warning/10 text-warning" :
                                            act.type === "material" ? "bg-primary/10 text-primary" :
                                            "bg-indigo-500/10 text-indigo-500"
                                        }`}>
                                            {act.type === "exam" ? <FileSpreadsheet className="h-3 w-3" /> :
                                             act.type === "material" ? <BookOpen className="h-3 w-3" /> :
                                             <Medal className="h-3 w-3" />}
                                        </div>
                                        <p className="text-xs flex-1">{act.message}</p>
                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                            {formatTime(act.created_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground py-2 text-center">
                                Belum ada aktivitas. Mulai belajar atau ikuti tryout!
                            </p>
                        )}
                    </Card>
                </div>

                {/* Right 1 Col */}
                <div className="space-y-6">
                    {/* AI Recommendation */}
                    <Card className="p-6 space-y-4 border-indigo-500/20 bg-gradient-to-br from-card via-card to-indigo-500/5">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-500" /> Rekomendasi Belajar AI
                            </h3>
                            <Badge variant="outline" className="text-[10px] font-mono">Personalized</Badge>
                        </div>

                        {learningProgress.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Fokus tingkatkan penguasaan materi di <span className="font-bold text-foreground">
                                    {learningProgress.sort((a: any, b: any) => a.progress_pct - b.progress_pct)[0]?.subject_name || "subjek"}
                                    </span> yang masih {Math.round(learningProgress.sort((a: any, b: any) => a.progress_pct - b.progress_pct)[0]?.progress_pct || 0)}%.
                                </p>
                                <Link href="/student/practice">
                                    <Button variant="outline" size="sm" className="w-full justify-between text-xs font-semibold">
                                        <span>Latihan Soal Adaptif</span>
                                        <ArrowRight className="h-3.5 w-3.5 text-primary" />
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Mulai perjalanan belajarmu! Kerjakan materi dan latihan soal untuk mendapatkan rekomendasi belajar yang dipersonalisasi oleh AI.
                                </p>
                                <Link href="/student/materials">
                                    <Button variant="outline" size="sm" className="w-full justify-between text-xs font-semibold">
                                        <span>Mulai Belajar</span>
                                        <ArrowRight className="h-3.5 w-3.5 text-primary" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </Card>

                    {/* Target PTN */}
                    <Card className="p-5 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-xs flex items-center gap-1.5">
                                <Target className="h-3.5 w-3.5 text-primary" /> Target PTN Impian
                            </h4>
                            <span className="text-[10px] text-muted-foreground">Pilihan 1</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-lg font-black text-primary">ITB - Teknik Informatika</span>
                                <span className="text-[10px] text-muted-foreground block">Target IRT: 710 Poin</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold border-emerald-500 text-emerald-600 bg-emerald-50">
                                TERVERIFIKASI
                            </Badge>
                        </div>
                    </Card>

                    {/* Leaderboard */}
                    <Card className="p-5 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-xs flex items-center gap-1.5">
                                <Medal className="h-3.5 w-3.5 text-warning" /> Papan Peringkat
                            </h4>
                            <Badge variant="outline" className="text-[10px]">Top 10</Badge>
                        </div>
                        {leaderboard.length > 0 ? (
                            <div className="space-y-1">
                                {leaderboard.map((entry: any) => (
                                    <div key={entry.user_id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-black w-5 text-center ${
                                                entry.rank === 1 ? "text-warning" :
                                                entry.rank === 2 ? "text-muted-foreground" :
                                                entry.rank === 3 ? "text-amber-600" : "text-muted-foreground/50"
                                            }`}>
                                                #{entry.rank}
                                            </span>
                                            <span className="text-xs font-semibold truncate max-w-[120px]">{entry.full_name}</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            Lv.{entry.level} &middot; {entry.total_xp?.toLocaleString()} XP
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground py-2 text-center">
                                Belum ada data peringkat.
                            </p>
                        )}
                        <Link href="/student/leaderboard">
                            <Button variant="ghost" size="sm" className="w-full text-xs font-semibold">
                                Lihat Semua <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                        </Link>
                    </Card>

                    {/* Quick Stats Summary */}
                    <Card className="p-5 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-xs flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-primary" /> Ringkasan Statistik
                            </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Level", value: level, icon: Trophy, color: "text-primary" },
                                { label: "Total XP", value: totalXP.toLocaleString(), icon: Zap, color: "text-warning" },
                                { label: "Streak", value: `${streak} Hari`, icon: Flame, color: "text-danger" },
                                { label: "Lencana", value: badgesCount, icon: Medal, color: "text-indigo-500" },
                            ].map((stat) => (
                                <div key={stat.label} className="p-3 rounded-xl border bg-muted/20 text-center">
                                    <stat.icon className={`h-4 w-4 ${stat.color} mx-auto mb-1`} />
                                    <span className="text-xs font-black block">{stat.value}</span>
                                    <span className="text-[9px] text-muted-foreground">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
