"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    HelpCircle,
    Clock,
    Plus,
    CheckCircle2,
    AlertCircle,
    BarChart2,
    Calendar,
    BookOpen,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useTeacherDashboard, useExams, useQuestions, useMaterials, useCreateQuestion, useCreateExam } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function TeacherDashboardPage() {
    const { user } = useAuth();
    const { data: dashboard, isLoading: dashLoading } = useTeacherDashboard();
    const { data: examsData } = useExams();
    const { data: questionsData } = useQuestions();

    const dash = dashboard as any;
    const exams = (examsData as any)?.data ?? (examsData as any) ?? [];
    const questions = (questionsData as any)?.data ?? (questionsData as any) ?? [];

    const activeExams = Array.isArray(exams)
        ? exams.map((exam: any) => ({
              id: exam.id ?? "-",
              title: exam.title ?? "Untitled",
              status: exam.status ?? "Draft",
              participants: exam.participant_count ?? exam.participants ?? 0,
              date: exam.scheduled_at ?? exam.date ?? "-",
          }))
        : [];

    const totalQuestions = dash?.total_questions ?? questions.length ?? 0;
    const pendingReview = dash?.pending_review ?? questions.filter((q: any) => q.status === "IN_REVIEW" || q.status === "pending").length ?? 0;
    const approvedCount = dash?.approved ?? questions.filter((q: any) => q.status === "PUBLISHED" || q.status === "approved").length ?? 0;
    const activePackageCount = dash?.active_exam_packages ?? activeExams.filter((e: any) => e.status === "Published").length ?? 0;

    return (
        <div className="space-y-6 p-6 pb-16">
            {/* Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Teacher Command Center</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola Bank Soal, Workflow FSM Review, Paket Ujian CBT, dan Materi Pembelajaran Siswa.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/teacher/question-bank/create">
                        <Button size="sm" className="text-xs font-bold shadow-xs">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Tulis Soal Baru (KaTeX)
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-4 border-primary/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <HelpCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Bank Soal Dibuat</p>
                        <p className="text-xl font-extrabold text-foreground">{totalQuestions} Soal</p>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4 border-warning/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Menunggu Review FSM</p>
                        <p className="text-xl font-extrabold text-foreground">{pendingReview} Soal</p>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4 border-success/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Disetujui (Approved)</p>
                        <p className="text-xl font-extrabold text-foreground">{approvedCount} Soal</p>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4 border-info/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Paket Ujian Aktif</p>
                        <p className="text-xl font-extrabold text-foreground">{activePackageCount} Paket</p>
                    </div>
                </Card>
            </div>

            {/* Active Exam Schedule & FSM Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Active Exams */}
                <Card className="lg:col-span-2 shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-bold">Daftar Paket Ujian & Tryout</CardTitle>
                            <CardDescription className="text-xs">Status publikasi paket tryout terkini</CardDescription>
                        </div>
                        <Link href="/teacher/exam-packages">
                            <Button variant="outline" size="sm" className="text-xs font-semibold">
                                Lihat Semua Paket <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {activeExams.map((exam) => (
                            <div
                                key={exam.id}
                                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/40 transition-all"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-semibold text-muted-foreground">{exam.id}</span>
                                        <Badge
                                            variant={
                                                exam.status === "Published"
                                                    ? "success"
                                                    : exam.status === "In Review"
                                                        ? "warning"
                                                        : "secondary"
                                            }
                                            className="text-[10px]"
                                        >
                                            {exam.status}
                                        </Badge>
                                    </div>
                                    <h4 className="font-bold text-sm text-foreground">{exam.title}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        {exam.participants} Siswa Terdaftar • Jadwal Rilis: {exam.date}
                                    </p>
                                </div>
                                <Link href="/teacher/exam-packages">
                                    <Button variant="ghost" size="sm" className="text-xs font-semibold">
                                        Kelola Soal
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Right Column: FSM Quick Action Widget */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold">FSM Workflow Soal</CardTitle>
                        <CardDescription className="text-xs">Antrean persetujuan kurikulum</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="rounded-xl border p-3 bg-muted/20 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold">TPS Kuantitatif #104</span>
                                <Badge variant="warning" className="text-[10px]">IN_REVIEW</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                Diperoleh persamaan $\int_{0}^{4} x^2 dx = \dots$
                            </p>
                            <div className="flex gap-2 pt-1">
                                <Button variant="success" size="sm" className="w-full text-xs h-7">
                                    Approve
                                </Button>
                                <Button variant="destructive" size="sm" className="w-full text-xs h-7">
                                    Reject
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-xl border p-3 bg-muted/20 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold">Literasi Bahasa #88</span>
                                <Badge variant="warning" className="text-[10px]">IN_REVIEW</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                Analisis paragraf 3 mengenai korelasi iklim global...
                            </p>
                            <div className="flex gap-2 pt-1">
                                <Button variant="success" size="sm" className="w-full text-xs h-7">
                                    Approve
                                </Button>
                                <Button variant="destructive" size="sm" className="w-full text-xs h-7">
                                    Reject
                                </Button>
                            </div>
                        </div>

                        <Link href="/teacher/question-bank" className="block pt-2">
                            <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                                Buka Bank Soal Hub <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
