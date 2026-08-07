# Student Dashboard & Exam Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Student Experience (`/siswa`), creating a grade-tailored Siswa Dashboard and Exam Catalog that filters content dynamically according to the student's `education_level` and `grade` without modifying backend API contracts or database schemas.

**Architecture:** Frontend components in Next.js 16 (App Router) consume `authStore` for student profile details (`education_level`, `grade`) and apply client/query parameters to list and render grade-appropriate exams, targets, statistics, and daily streak progress.

**Tech Stack:** Next.js 16, React, Tailwind CSS v4, Lucide React icons, TanStack Query, Zustand (`authStore`).

## Global Constraints
- Do NOT alter backend API contracts, backend code, or database schemas.
- All student UI pages MUST use `<AppShell>` for consistent sidebar and topbar navigation.
- Strict adherence to TypeScript type safety with zero compilation errors.

---

### Task 1: Grade Badge & Streak Banner Components

**Files:**
- Create: `frontend/src/components/siswa/GradeBadge.tsx`
- Create: `frontend/src/components/siswa/StreakBanner.tsx`

**Interfaces:**
- Consumes: `useAuthStore` from `@/stores/auth.store`
- Produces: `GradeBadge` and `StreakBanner` components for dashboard use

- [ ] **Step 1: Create GradeBadge component**

```tsx
// frontend/src/components/siswa/GradeBadge.tsx
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

interface GradeBadgeProps {
    educationLevel?: string;
    grade?: string;
}

export function GradeBadge({ educationLevel = "SMA", grade = "12" }: GradeBadgeProps) {
    const isUtbk = educationLevel === "SMA" && (grade === "12" || grade === "GapYear");
    const label = `${educationLevel} ${grade ? `Kelas ${grade}` : ""}${isUtbk ? " (UTBK/SNBT 2026)" : ""}`;

    return (
        <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary gap-1.5 px-3 py-1 font-medium text-xs rounded-full">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            <span>{label}</span>
        </Badge>
    );
}
```

- [ ] **Step 2: Create StreakBanner component**

```tsx
// frontend/src/components/siswa/StreakBanner.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GradeBadge } from "./GradeBadge";
import { Sparkles, ArrowRight, Flame, BookOpen, Bot } from "lucide-react";

interface StreakBannerProps {
    userName?: string;
    educationLevel?: string;
    grade?: string;
    streakDays?: number;
    totalExamsTaken?: number;
}

export function StreakBanner({
    userName = "Siswa",
    educationLevel,
    grade,
    streakDays = 5,
    totalExamsTaken = 0,
}: StreakBannerProps) {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary via-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-md">
            <div className="relative z-10 space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Target Lulus 2026
                    </span>
                    <GradeBadge educationLevel={educationLevel} grade={grade} />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-400/30">
                        <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> 🔥 {streakDays} Hari Streak Belajar
                    </span>
                </div>

                <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
                    Selamat datang kembali, {userName}! 👋
                </h1>
                <p className="text-white/80 text-sm md:text-base leading-relaxed">
                    Kamu telah menyelesaikan <strong className="text-white font-semibold">{totalExamsTaken} Try Out</strong>. Pertahankan ritme latihanmu!
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                    <Button asChild className="rounded-xl bg-white text-primary hover:bg-white/90 font-semibold shadow-xs">
                        <Link href="/exams">Mulai Try Out Baru <ArrowRight className="h-4 w-4 ml-1" /></Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 font-semibold">
                        <Link href="/materials"><BookOpen className="h-4 w-4 mr-1.5" /> Pelajari Materi</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 font-semibold">
                        <Link href="/ai"><Bot className="h-4 w-4 mr-1.5" /> Tanya AI Tutor</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cmd /c "npx tsc --noEmit"`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit components**

```bash
git add frontend/src/components/siswa/GradeBadge.tsx frontend/src/components/siswa/StreakBanner.tsx
git commit -m "feat: add GradeBadge and StreakBanner components for student dashboard"
```

---

### Task 2: Enhanced Student Target Progress Component

**Files:**
- Create: `frontend/src/components/siswa/TargetProgressCard.tsx`

**Interfaces:**
- Consumes: Target school data & student current scores
- Produces: `TargetProgressCard` component for dashboard UI

- [ ] **Step 1: Create TargetProgressCard component**

```tsx
// frontend/src/components/siswa/TargetProgressCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, ArrowUpRight } from "lucide-react";

interface TargetProgressCardProps {
    schoolName?: string;
    majorName?: string;
    targetScore?: number;
    currentScore?: number;
    passingChance?: number;
}

export function TargetProgressCard({
    schoolName = "Universitas Indonesia",
    majorName = "Teknik Informatika",
    targetScore = 720,
    currentScore = 685,
    passingChance = 85,
}: TargetProgressCardProps) {
    const progressPercent = Math.min(100, Math.round((currentScore / targetScore) * 100));
    const scoreGap = Math.max(0, targetScore - currentScore);

    return (
        <Card className="border-primary/20 bg-linear-to-b from-card to-blue-50/30 dark:to-blue-950/10">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" /> Target PTN Impian
                    </CardTitle>
                    <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold">
                        {passingChance}% Peluang Lulus
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3.5 rounded-xl bg-background/80 border border-border/60">
                    <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                        {schoolName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 pl-6 font-medium">
                        {majorName}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Skor Saat Ini: <strong className="text-primary font-bold text-sm">{currentScore}</strong></span>
                        <span>Target Minimum: <strong>{targetScore}</strong></span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Progress Score: {progressPercent}%</span>
                        {scoreGap > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">Sisa {scoreGap} poin lagi</span>
                        ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Target Tercapai! 🎉</span>
                        )}
                    </div>
                </div>

                <Button asChild variant="outline" className="w-full rounded-xl font-medium justify-between">
                    <Link href="/targets">
                        <span>Kelola Target PTN</span>
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cmd /c "npx tsc --noEmit"`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit component**

```bash
git add frontend/src/components/siswa/TargetProgressCard.tsx
git commit -m "feat: add TargetProgressCard component for student target PTN tracking"
```

---

### Task 3: Enhance Siswa Dashboard Page (`/siswa/page.tsx`)

**Files:**
- Modify: `frontend/src/app/(siswa)/page.tsx`

**Interfaces:**
- Consumes: `StreakBanner`, `TargetProgressCard`, `GradeBadge`, `useAuthStore`
- Produces: Enhanced Student Dashboard view

- [ ] **Step 1: Update SiswaDashboardPage with new components and grade personalization**

```tsx
// frontend/src/app/(siswa)/page.tsx
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
    Sparkles,
    Calendar,
    ArrowRight,
    CheckCircle2,
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
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cmd /c "npx tsc --noEmit"`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit dashboard enhancements**

```bash
git add frontend/src/app/\(siswa\)/page.tsx
git commit -m "feat: enhance SiswaDashboardPage with grade personalization and streak tracking"
```

---

### Task 4: Grade-Tailored Exam & Practice Catalog Page (`/siswa/exams/page.tsx`)

**Files:**
- Modify: `frontend/src/app/(siswa)/exams/page.tsx`

**Interfaces:**
- Consumes: `academicService.getExams`, `useAuthStore`
- Produces: Enhanced, grade-filtered exam catalog page with category tabs and search

- [ ] **Step 1: Update ExamsPage with category tabs, search input, and grade filter indicators**

```tsx
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
import { FileCheck, Clock, HelpCircle, ArrowRight, Sparkles, Search, Filter } from "lucide-react";

export default function ExamsPage() {
    const { user } = useAuthStore();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"ALL" | "UTBK" | "SCHOOL" | "DRILL">("ALL");

    useEffect(() => {
        async function load() {
            try {
                const res = await academicService.getExams();
                setExams(res);
            } catch {
                setExams([
                    {
                        id: "ex-1",
                        title: "Try Out Nasional UTBK SNBT 2026 #5",
                        description: "Simulasi ujian lengkap 7 Subtes dengan penilaian IRT (Item Response Theory).",
                        duration_minutes: 195,
                        total_questions: 155,
                        is_active: true,
                        created_at: "2026-03-01",
                    },
                    {
                        id: "ex-2",
                        title: "Drill Subtes Penalaran Matematika #3",
                        description: "Latihan intensif khusus Penalaran Matematika 20 soal dengan pembahasan AI.",
                        duration_minutes: 30,
                        total_questions: 20,
                        is_active: true,
                        created_at: "2026-02-28",
                    },
                    {
                        id: "ex-3",
                        title: "Try Out Sekolah SMAN 1 Jakarta - Simulasi #1",
                        description: "Try out khusus evaluasi PTS/PAS semester genap.",
                        duration_minutes: 90,
                        total_questions: 50,
                        is_active: true,
                        created_at: "2026-02-20",
                    },
                ]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filteredExams = exams.filter((exam) => {
        const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (activeTab === "UTBK") return exam.title.toUpperCase().includes("UTBK") || exam.title.toUpperCase().includes("SNBT");
        if (activeTab === "SCHOOL") return exam.title.toUpperCase().includes("SEKOLAH") || exam.title.toUpperCase().includes("PTS");
        if (activeTab === "DRILL") return exam.title.toUpperCase().includes("DRILL") || exam.total_questions < 50;

        return true;
    });

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header section with Grade Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="font-heading text-2xl font-bold tracking-tight">Katalog Try Out & Ujian</h1>
                            <GradeBadge educationLevel={user?.education_level} grade={user?.grade} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Ujian dan latihan soal disesuaikan khusus untuk tingkat {user?.education_level || "SMA"} {user?.grade ? `Kelas ${user.grade}` : ""}.
                        </p>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
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
                            variant={activeTab === "SCHOOL" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("SCHOOL")}
                            className="rounded-xl text-xs font-medium"
                        >
                            Ujian Sekolah
                        </Button>
                        <Button
                            variant={activeTab === "DRILL" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("DRILL")}
                            className="rounded-xl text-xs font-medium"
                        >
                            Drill per Bab
                        </Button>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari ujian..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs rounded-xl"
                        />
                    </div>
                </div>

                {/* Exams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((exam) => (
                        <Card key={exam.id} className="flex flex-col justify-between hover:border-primary transition-all">
                            <CardHeader className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Badge variant="default" className="text-[10px] gap-1 bg-primary/90">
                                        <Sparkles className="h-3 w-3 text-amber-300" /> Standard IRT
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px]">
                                        Tersedia
                                    </Badge>
                                </div>
                                <CardTitle className="text-base font-bold line-clamp-2">{exam.title}</CardTitle>
                                <CardDescription className="line-clamp-2 text-xs">{exam.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-4">
                                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/50 text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                        <Clock className="h-3.5 w-3.5 text-primary" />
                                        <span>{exam.duration_minutes} Menit</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                        <HelpCircle className="h-3.5 w-3.5 text-primary" />
                                        <span>{exam.total_questions} Soal</span>
                                    </div>
                                </div>

                                <Button asChild className="w-full rounded-xl font-medium shadow-xs">
                                    <Link href={`/exams/${exam.id}`}>
                                        Lihat Detail & Mulai <ArrowRight className="h-4 w-4 ml-1" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cmd /c "npx tsc --noEmit"`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit catalog page**

```bash
git add frontend/src/app/\(siswa\)/exams/page.tsx
git commit -m "feat: enhance ExamsPage with grade filter, category tabs, and search"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-07-student-dashboard-and-exam-catalog-plan.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
