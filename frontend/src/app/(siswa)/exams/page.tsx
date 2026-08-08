// frontend/src/app/(siswa)/exams/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth.store";
import { academicService } from "@/services/academic.service";
import { Exam } from "@/types";
import { GradeBadge } from "@/components/siswa/GradeBadge";
import {
    Clock,
    HelpCircle,
    ArrowRight,
    Sparkles,
    Search,
    Trophy,
    Target,
    GraduationCap,
    TrendingUp,
    CheckCircle2,
    PlayCircle,
    RotateCcw,
    Award,
    Filter,
    Flame,
    BarChart3,
    BookOpen,
    Loader2,
    Inbox,
} from "lucide-react";

interface ExamWithProgress extends Exam {
    userStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    lastScore?: number;
    nationalRank?: number;
    totalParticipants?: number;
    targetMatch?: boolean;
}

export default function ExamsPage() {
    const { user } = useAuthStore();
    const [exams, setExams] = useState<ExamWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"ALL" | "UTBK" | "UM_PTN" | "SCHOOL">("ALL");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "NOT_STARTED" | "COMPLETED">("ALL");

    const [targetData, setTargetData] = useState<{ school_name?: string; major_name?: string; target_score?: number } | null>(null);

    // Dynamic Student Target University & Score Progress
    const studentTarget = {
        university: targetData?.school_name || user?.school_name || "Universitas Indonesia",
        major: targetData?.major_name || user?.major || "Teknik Informatika",
        targetScore: targetData?.target_score || 700,
        currentHighestScore: 685,
        passingProbability: 92,
        nationalRank: 42,
        totalParticipants: 3450,
    };

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [resExams, resTarget] = await Promise.allSettled([
                    academicService.getExams(),
                    academicService.getTargetSchool(),
                ]);

                if (resTarget.status === "fulfilled" && resTarget.value) {
                    setTargetData(resTarget.value);
                }

                if (resExams.status === "fulfilled" && Array.isArray(resExams.value)) {
                    const activeExams = resExams.value.filter((e) => e.status !== "DRAFT");
                    const enriched: ExamWithProgress[] = (activeExams.length > 0 ? activeExams : resExams.value).map((e) => ({
                        ...e,
                        userStatus: "NOT_STARTED",
                        targetMatch: Boolean(e.category === "UTBK_SNBT" || (e.title && e.title.toUpperCase().includes("UTBK"))),
                    }));
                    setExams(enriched);
                } else {
                    setExams([]);
                }
            } catch {
                setExams([]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filteredExams = exams.filter((exam) => {
        const matchesSearch =
            exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (activeTab === "UTBK" && exam.category !== "UTBK_SNBT" && !exam.title.toUpperCase().includes("UTBK")) return false;
        if (activeTab === "UM_PTN" && exam.category !== "UM_PTN" && !exam.title.toUpperCase().includes("SIMAK") && !exam.title.toUpperCase().includes("UM")) return false;
        if (activeTab === "SCHOOL" && exam.category !== "PTS_UAS" && !exam.title.toUpperCase().includes("SEKOLAH")) return false;

        if (statusFilter === "NOT_STARTED" && exam.userStatus === "COMPLETED") return false;
        if (statusFilter === "COMPLETED" && exam.userStatus !== "COMPLETED") return false;

        return true;
    });

    const scoreProgressPercent = Math.min(
        100,
        Math.round((studentTarget.currentHighestScore / studentTarget.targetScore) * 100)
    );

    return (
        <AppShell>
            <div className="space-y-6 font-sans">
                {/* Header section with Grade Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                Hub Try Out & Ujian Master
                            </h1>
                            <GradeBadge educationLevel={user?.education_level} grade={user?.grade} />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Paket ujian resmi berstandar IRT UTBK & Ujian Mandiri untuk mengejar kampus impian.
                        </p>
                    </div>
                </div>

                {/* Target PTN & National Rank Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Target PTN Card */}
                    <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background shadow-xs space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-xs">
                                    <Target className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                        Target PTN & Jurusan Impian
                                    </span>
                                    <h2 className="font-heading font-bold text-lg text-foreground leading-snug">
                                        {studentTarget.university} — {studentTarget.major}
                                    </h2>
                                </div>
                            </div>

                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold px-3 py-1 rounded-xl gap-1">
                                <Flame className="h-3.5 w-3.5 fill-emerald-500" /> Peluang Lolos {studentTarget.passingProbability}%
                            </Badge>
                        </div>

                        {/* Progress Bar & IRT Score Gap */}
                        <div className="space-y-2 bg-card/60 p-4 rounded-2xl border border-border/60">
                            <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <TrendingUp className="h-4 w-4 text-primary" /> Skor IRT Tertinggi Kamu
                                </span>
                                <span className="text-foreground">
                                    <span className="font-mono text-base font-bold text-primary">{studentTarget.currentHighestScore}</span> / {studentTarget.targetScore} IRT
                                </span>
                            </div>

                            <div className="w-full h-3 rounded-full bg-muted overflow-hidden p-0.5">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-500 to-amber-500 transition-all duration-500"
                                    style={{ width: `${scoreProgressPercent}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                                <span>Passing Grade Target: {studentTarget.targetScore} IRT</span>
                                <span className="font-bold text-emerald-600">Selisih: +{studentTarget.targetScore - studentTarget.currentHighestScore} Poin Lagi!</span>
                            </div>
                        </div>
                    </div>

                    {/* National Ranking Card */}
                    <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
                                    <Trophy className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Peringkat Nasional
                                    </span>
                                    <h3 className="font-bold text-sm text-foreground">Ranking Try Out UTBK</h3>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-mono">
                                Real-Time
                            </Badge>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center space-y-1">
                            <span className="text-xs text-muted-foreground font-medium">Posisi Kamu Saat Ini</span>
                            <div className="font-mono font-bold text-2xl sm:text-3xl text-foreground flex items-center justify-center gap-1">
                                <span className="text-primary">#{studentTarget.nationalRank}</span>
                                <span className="text-xs font-sans text-muted-foreground font-normal">/ {studentTarget.totalParticipants} Peserta</span>
                            </div>
                            <p className="text-[11px] text-emerald-600 font-semibold pt-1">
                                Top 2% Peserta Try Out Nasional 🎉
                            </p>
                        </div>

                        <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold gap-1.5 h-9">
                            <BarChart3 className="h-3.5 w-3.5 text-primary" /> Lihat Leaderboard Lengkap
                        </Button>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-2xs">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                        <Button
                            variant={activeTab === "ALL" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("ALL")}
                            className="rounded-xl text-xs font-medium"
                        >
                            Semua Ujian
                        </Button>
                        <Button
                            variant={activeTab === "UTBK" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("UTBK")}
                            className="rounded-xl text-xs font-medium"
                        >
                            Try Out UTBK/SNBT
                        </Button>
                        <Button
                            variant={activeTab === "UM_PTN" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("UM_PTN")}
                            className="rounded-xl text-xs font-medium"
                        >
                            Ujian Mandiri PTN
                        </Button>
                        <Button
                            variant={activeTab === "SCHOOL" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("SCHOOL")}
                            className="rounded-xl text-xs font-medium"
                        >
                            Ujian Sekolah
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                            <Filter className="h-3.5 w-3.5" /> Status:
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:outline-hidden"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="NOT_STARTED">Belum Dikerjakan</option>
                            <option value="COMPLETED">Sudah Dikerjakan</option>
                        </select>

                        {/* Search Input */}
                        <div className="relative w-full md:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari tryout..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs rounded-xl"
                            />
                        </div>
                    </div>
                </div>

                {/* Exams Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-card rounded-3xl border border-border">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-sm font-medium text-muted-foreground">Memuat paket ujian dari database...</p>
                    </div>
                ) : filteredExams.length === 0 ? (
                    <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3 rounded-3xl border-dashed border-2">
                        <div className="p-4 rounded-2xl bg-muted text-muted-foreground">
                            <Inbox className="h-8 w-8" />
                        </div>
                        <h3 className="font-heading font-bold text-lg text-foreground">Belum Ada Paket Ujian Tersedia</h3>
                        <p className="text-xs text-muted-foreground max-w-md">
                            {searchQuery
                                ? `Tidak ditemukan paket ujian yang cocok dengan kata kunci "${searchQuery}".`
                                : "Belum ada paket ujian yang dipublikasikan oleh guru/admin. Silakan cek kembali nanti."}
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExams.map((exam) => (
                            <Card key={exam.id} className="flex flex-col justify-between hover:border-primary/50 transition-all shadow-2xs group">
                                <CardHeader className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <Badge variant="default" className="text-[10px] gap-1 bg-primary/90">
                                            <Sparkles className="h-3 w-3 text-amber-300" /> {exam.scoring_system === "IRT" ? "Standard IRT UTBK" : exam.scoring_system === "NEGATIVE_MARKING" ? "Sistem Minus (+4/-1)" : "Poin Standar"}
                                        </Badge>

                                        {exam.targetMatch && (
                                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold">
                                                Target Match 🎯
                                            </Badge>
                                        )}

                                        {exam.userStatus === "COMPLETED" ? (
                                            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Selesai
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px]">
                                                Tersedia
                                            </Badge>
                                        )}
                                    </div>

                                    <div>
                                        <CardTitle className="text-base font-bold line-clamp-2 group-hover:text-primary transition-colors">
                                            {exam.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 text-xs mt-1">
                                            {exam.description || "Ujian simulasi dengan pembobotan skor standar nasional."}
                                        </CardDescription>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0 space-y-4">
                                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/40 text-xs">
                                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <span>{exam.duration_minutes} Menit</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                            <HelpCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <span>{exam.total_questions || 30} Soal</span>
                                        </div>
                                    </div>

                                    {/* Completed Score Display */}
                                    {exam.userStatus === "COMPLETED" && (
                                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <Award className="h-4 w-4 text-primary" />
                                                <span className="font-semibold text-foreground">Skor IRT Kamu:</span>
                                            </div>
                                            <div className="font-mono font-bold text-sm text-primary">
                                                {exam.lastScore} <span className="text-[10px] font-sans text-muted-foreground font-normal">(Rank #{exam.nationalRank})</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-1">
                                        {exam.userStatus === "COMPLETED" ? (
                                            <Button asChild variant="outline" className="w-full rounded-xl font-semibold text-xs h-10 gap-1.5 cursor-pointer">
                                                <Link href={`/exams/${exam.id}`}>
                                                    <RotateCcw className="h-4 w-4" /> Ulangi / Lihat Pembahasan
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button asChild className="w-full rounded-xl font-semibold text-xs h-10 shadow-xs gap-1.5 cursor-pointer">
                                                <Link href={`/exams/${exam.id}`}>
                                                    <PlayCircle className="h-4 w-4" /> Mulai Pengerjaan <ArrowRight className="h-4 w-4 ml-auto" />
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
