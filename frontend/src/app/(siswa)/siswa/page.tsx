// frontend/src/app/(siswa)/siswa/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatsCard } from "@/components/data-display/stats-card";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { GradeBadge } from "@/components/siswa/GradeBadge";
import { EmptyState } from "@/components/siswa/EmptyState";
import { SectionHeader } from "@/components/siswa/SectionHeader";
import { ProgressRing } from "@/components/siswa/ProgressRing";
import { WeeklyExamCard } from "@/components/siswa/WeeklyExamCard";
import { TargetChanceCard } from "@/components/siswa/TargetChanceCard";
import { SubjectMasteryChart } from "@/components/siswa/SubjectMasteryChart";
import { SubjectStrengthCard } from "@/components/siswa/SubjectStrengthCard";
import { SubjectProgressGrid } from "@/components/siswa/SubjectProgressGrid";
import { WeeklyActivityChart } from "@/components/siswa/WeeklyActivityChart";
import { useAuthStore } from "@/stores/auth.store";
import { dashboardService } from "@/services/dashboard.service";
import {
    type DashboardStudent,
    type StudentTargetComparison,
    type SubjectMasteryResponse,
    type SubjectProgressResponse,
    type WeeklyExam,
    type StudentStreak,
    type StudentDashboardConfig,
    DEFAULT_DASHBOARD_CONFIG,
} from "@/types/siswa";
import { cn } from "@/lib/utils";
import {
    FileCheck,
    Trophy,
    Award,
    Crown,
    Flame,
    CalendarDays,
    BookOpen,
    ArrowRight,
    Activity,
    Pencil,
    Target,
    type LucideIcon,
} from "lucide-react";

function formatDayDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(d);
}

function formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}

function timeAgo(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diff = then - Date.now();
    const rtf = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
    const mins = Math.round(diff / 60000);
    if (Math.abs(mins) < 60) return rtf.format(mins, "minute");
    const hrs = Math.round(mins / 60);
    if (Math.abs(hrs) < 24) return rtf.format(hrs, "hour");
    return rtf.format(Math.round(hrs / 24), "day");
}

function examStatusBadge(status: string): string {
    const s = (status || "").toUpperCase();
    if (s.includes("PUBLISH") || s === "ONGOING" || s === "OPEN") {
        return "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }
    if (s === "DRAFT" || s === "CLOSED" || s === "FINISHED") {
        return "border-border bg-muted text-muted-foreground";
    }
    return "border-primary/25 bg-primary/10 text-primary";
}

function actMeta(
    type: string
): { icon: React.ReactNode; iconWrap: string } {
    switch (type) {
        case "exam":
            return {
                icon: <FileCheck className="h-4 w-4 text-primary" />,
                iconWrap: "bg-primary/10",
            };
        case "material":
            return {
                icon: <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
                iconWrap: "bg-emerald-500/10",
            };
        case "practice":
            return {
                icon: <Pencil className="h-4 w-4 text-orange-600 dark:text-orange-400" />,
                iconWrap: "bg-orange-500/10",
            };
        default:
            return {
                icon: <Activity className="h-4 w-4 text-muted-foreground" />,
                iconWrap: "bg-muted",
            };
    }
}

export default function SiswaDashboardPage() {
    const { user } = useAuthStore();

    const [base, setBase] = useState<DashboardStudent | null>(null);
    const [target, setTarget] = useState<StudentTargetComparison | null>(null);
    const [mastery, setMastery] = useState<SubjectMasteryResponse | null>(null);
    const [progress, setProgress] = useState<SubjectProgressResponse | null>(null);
    const [weekExam, setWeekExam] = useState<WeeklyExam | null>(null);
    const [streak, setStreak] = useState<StudentStreak | null>(null);
    const [config, setConfig] = useState<StudentDashboardConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            const [baseRes, weekRes, targetRes, masteryRes, progressRes, streakRes, configRes] =
                await Promise.allSettled([
                    dashboardService.getStudentDashboard(),
                    dashboardService.getWeeklyExam(),
                    dashboardService.getStudentTarget(),
                    dashboardService.getSubjectMastery(),
                    dashboardService.getSubjectProgress(),
                    dashboardService.getStudentStreak(),
                    dashboardService.getStudentDashboardConfig(),
                ]);
            if (cancelled) return;
            if (baseRes.status === "fulfilled") setBase(baseRes.value as unknown as DashboardStudent);
            if (weekRes.status === "fulfilled") setWeekExam(weekRes.value);
            if (targetRes.status === "fulfilled") setTarget(targetRes.value);
            if (masteryRes.status === "fulfilled") setMastery(masteryRes.value);
            if (progressRes.status === "fulfilled") setProgress(progressRes.value);
            if (streakRes.status === "fulfilled") setStreak(streakRes.value);
            if (configRes.status === "fulfilled") setConfig(configRes.value);
            setLoading(false);
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const greetingWord = base?.greeting?.greeting ?? "datang";
    const displayName = base?.greeting?.full_name || user?.full_name || "Siswa";
    const motivation = base?.greeting?.motivation;
    const streakDateLabel = base?.greeting?.date ? formatDayDate(base.greeting.date) : "";

    const todayGoal = base?.today_goal;
    const continueLearning = base?.continue_learning;
    const upcomingExams = base?.upcoming_exams;
    const recentActivity = base?.recent_activity;
    const stats = base?.exam_stats;

    const strongThreshold =
        config?.strong_subject_threshold ??
        mastery?.config?.strong_threshold ??
        DEFAULT_DASHBOARD_CONFIG.strong_subject_threshold;

    const introCtas: { label: string; href: string }[] = [
        { label: "Mulai Try Out", href: "/exams" },
        { label: "Pelajari Materi", href: "/materials" },
        { label: "Tanya AI Tutor", href: "/ai" },
    ];

    const statCards: {
        title: string;
        value: string | number;
        icon: LucideIcon;
        description: string;
        href?: string;
    }[] = [
        {
            title: "Try Out Selesai",
            value: stats?.total_completed ?? 0,
            icon: FileCheck,
            description: "Ujian & tryout terselesaikan",
        },
        {
            title: "Rata-rata Skor",
            value: stats && typeof stats.average_score === "number" ? Math.round(stats.average_score) : "—",
            icon: Trophy,
            description: "Skor rata-rata UTBK",
        },
        {
            title: "Skor Tertinggi",
            value: stats && typeof stats.highest_score === "number" ? Math.round(stats.highest_score) : "—",
            icon: Award,
            description: "Tryout terbaikmu",
        },
        {
            title: "Peringkat Nasional",
            value:
                stats && typeof stats.national_rank === "number" && stats.national_rank > 0
                    ? `#${stats.national_rank}`
                    : "—",
            icon: Crown,
            description: "Lihat semua hasil →",
            href: "/results",
        },
    ];

    return (
        <AppShell>
            <div className="space-y-6 md:space-y-8">
                {/* 1. Try Out Khusus Mingguan — banner */}
                <WeeklyExamCard data={weekExam} loading={loading} />

                {/* 2. Greeting + Grade + Streak */}
                <Card className="rounded-2xl">
                    <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
                                Selamat {greetingWord}, {displayName}!
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <GradeBadge
                                    educationLevel={user?.education_level}
                                    grade={user?.grade}
                                />
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                                    <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                                    {streak?.current_streak ?? 0} Hari Streak
                                </span>
                                {streakDateLabel && (
                                    <span className="text-xs text-muted-foreground">
                                        Terakhir aktif · {streakDateLabel}
                                    </span>
                                )}
                            </div>
                            {motivation && (
                                <p className="mt-3 text-sm text-muted-foreground">{motivation}</p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {introCtas.map((cta) => (
                                <Button
                                    key={cta.href}
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl"
                                >
                                    <Link href={cta.href}>{cta.label}</Link>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Goal Hari Ini + Lanjutkan Belajar */}
                <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
                    <Card className="flex h-full flex-col rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Target className="h-5 w-5 text-primary" /> Goal Hari Ini
                            </CardTitle>
                            <CardDescription>Target belajar harianmu</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1">
                            {loading ? (
                                <div className="m-auto flex flex-col items-center gap-4">
                                    <Skeleton className="h-28 w-28 rounded-full" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            ) : todayGoal ? (
                                <div className="m-auto flex flex-col items-center gap-5 text-center">
                                    <ProgressRing
                                        value={todayGoal.progress_pct}
                                        size={104}
                                        strokeWidth={10}
                                        label={`${Math.round(todayGoal.progress_pct)}%`}
                                        sublabel="tercapai"
                                    />
                                    <div className="flex items-center gap-5">
                                        <div>
                                            <p className="font-heading text-lg font-bold text-foreground">
                                                {todayGoal.completed_materials}
                                                <span className="font-normal text-muted-foreground">
                                                    /{todayGoal.target_materials}
                                                </span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">materi</p>
                                        </div>
                                        <div className="h-8 w-px bg-border" />
                                        <div>
                                            <p className="font-heading text-lg font-bold text-foreground">
                                                {todayGoal.answered_questions}
                                                <span className="font-normal text-muted-foreground">
                                                    /{todayGoal.target_questions}
                                                </span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">soal</p>
                                        </div>
                                    </div>
                                    <Button asChild className="rounded-xl gap-1.5">
                                        <Link href="/materials">
                                            Lanjutkan Belajar <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <EmptyState
                                    compact
                                    icon={Target}
                                    title="Belum ada aktivitas hari ini"
                                    description="Mulai belajar atau kerjakan soal untuk menuntaskan goal harianmu."
                                    actionLabel="Mulai Belajar"
                                    actionHref="/materials"
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="flex h-full flex-col rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BookOpen className="h-5 w-5 text-primary" /> Lanjutkan Belajar
                            </CardTitle>
                            <CardDescription>Lanjut dari materi terakhir yang kamu baca</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1">
                            {loading ? (
                                <div className="m-auto w-full space-y-3">
                                    <Skeleton className="h-5 w-2/3" />
                                    <Skeleton className="h-3 w-full rounded-full" />
                                    <Skeleton className="h-9 w-full rounded-xl" />
                                </div>
                            ) : continueLearning ? (
                                <div className="m-auto w-full space-y-4">
                                    <div className="space-y-2">
                                        <Badge variant="outline" className="rounded-full">
                                            {continueLearning.subject_name}
                                        </Badge>
                                        <h3 className="font-heading text-base font-semibold text-foreground">
                                            {continueLearning.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Sisa waktu ± {Math.round(continueLearning.remaining_minutes)} menit
                                        </p>
                                    </div>
                                    <Progress value={continueLearning.progress} />
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{Math.round(continueLearning.progress)}% selesai</span>
                                        <span>{Math.round(continueLearning.remaining_minutes)} menit lagi</span>
                                    </div>
                                    <Button asChild className="w-full rounded-xl gap-1.5">
                                        <Link href={`/materials/${continueLearning.material_id}`}>
                                            Lanjut Belajar <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <EmptyState
                                    compact
                                    icon={BookOpen}
                                    title="Belum ada materi yang kamu pelajari"
                                    description="Pilih materi untuk mulai belajar."
                                    actionLabel="Cari Materi"
                                    actionHref="/materials"
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 4. Stats Try Out (4× StatsCard) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => (
                              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                          ))
                        : statCards.map((card) => {
                              const inner = (
                                  <StatsCard
                                      title={card.title}
                                      value={card.value}
                                      icon={card.icon}
                                      description={card.description}
                                  />
                              );
                              return card.href ? (
                                  <Link key={card.title} href={card.href} className="block">
                                      {inner}
                                  </Link>
                              ) : (
                                  <div key={card.title}>{inner}</div>
                              );
                          })}
                </div>

                {/* 5. ★ TARGET SEKOLAH — kartu besar */}
                <TargetChanceCard data={target} loading={loading} />

                {/* 6. Statistik Mapel (BarChart) + Mapel Kuat vs Lemah */}
                <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
                    <SubjectMasteryChart data={mastery} threshold={strongThreshold} loading={loading} />
                    <SubjectStrengthCard data={mastery} threshold={strongThreshold} loading={loading} />
                </div>

                {/* 7. Progress Mapel (berbasis soal) */}
                <SubjectProgressGrid data={progress} loading={loading} />

                {/* 8. Ujian Mendatang + Aktivitas Terakhir */}
                <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
                    <Card className="flex h-full flex-col rounded-2xl">
                        <CardHeader>
                            <SectionHeader
                                title="Ujian Mendatang"
                                subtitle="Jadwal tryout terdekatmu"
                                icon={CalendarDays}
                                actionLabel="Lihat Semua"
                                actionHref="/exams"
                            />
                        </CardHeader>
                        <CardContent className="flex flex-1">
                            {loading ? (
                                <div className="w-full space-y-3">
                                    {[0, 1, 2].map((i) => (
                                        <Skeleton key={i} className="h-10 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : upcomingExams && upcomingExams.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ujian</TableHead>
                                            <TableHead>Mapel</TableHead>
                                            <TableHead>Jadwal</TableHead>
                                            <TableHead>Durasi</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {upcomingExams.slice(0, 5).map((ex) => (
                                            <TableRow key={ex.exam_id}>
                                                <TableCell className="max-w-40 truncate font-medium text-foreground">
                                                    {ex.title}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {ex.subject_name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDateTime(ex.scheduled_date)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {ex.duration_minutes} mnt
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "rounded-full text-[10px] font-semibold",
                                                            examStatusBadge(ex.status)
                                                        )}
                                                    >
                                                        {ex.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild size="xs" className="rounded-lg">
                                                        <Link href={`/exams/${ex.exam_id}`}>Mulai</Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <EmptyState
                                    compact
                                    icon={CalendarDays}
                                    title="Belum ada ujian mendatang"
                                    description="Jadwal tryout yang akan datang tampil di sini."
                                    actionLabel="Lihat Jadwal Ujian"
                                    actionHref="/exams"
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="flex h-full flex-col rounded-2xl">
                        <CardHeader>
                            <SectionHeader title="Aktivitas Terakhir" icon={Activity} />
                        </CardHeader>
                        <CardContent className="flex flex-1">
                            {loading ? (
                                <div className="w-full space-y-4">
                                    {[0, 1, 2].map((i) => (
                                        <Skeleton key={i} className="h-8 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : recentActivity && recentActivity.length > 0 ? (
                                <ol className="ml-2 w-full space-y-5 border-l border-border pl-6">
                                    {recentActivity.slice(0, 6).map((act, i) => {
                                        const meta = actMeta(act.type);
                                        return (
                                            <li key={i} className="relative">
                                                <span
                                                    className={cn(
                                                        "absolute -left-[38px] flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-sm",
                                                        meta.iconWrap
                                                    )}
                                                >
                                                    {meta.icon}
                                                </span>
                                                <p className="text-sm font-medium text-foreground">
                                                    {act.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {timeAgo(act.created_at)}
                                                </p>
                                            </li>
                                        );
                                    })}
                                </ol>
                            ) : (
                                <EmptyState
                                    compact
                                    icon={Activity}
                                    title="Belum ada aktivitas"
                                    description="Hasil belajarmu akan muncul di sini."
                                    actionLabel="Mulai Belajar"
                                    actionHref="/materials"
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 9. Weekly Activity (7 hari) */}
                <WeeklyActivityChart data={base?.weekly_activity ?? null} loading={loading} />
            </div>
        </AppShell>
    );
}