"use client";

import * as React from "react";
import Link from "next/link";
import { useExams } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    FileSpreadsheet,
    Plus,
    Search,
    Filter,
    Calendar,
    Users,
    Clock,
    Play,
    Edit3,
    BarChart3,
    CheckCircle2,
    Sparkles,
    Trash2,
    Eye,
    Loader2,
    AlertCircle,
} from "lucide-react";

export default function TeacherExamPackagesPage() {
    const { data: examsData, isLoading, error } = useExams();
    const [activeStatus, setActiveStatus] = React.useState<string>("ALL");
    const [searchQuery, setSearchQuery] = React.useState<string>("");

    const exams = React.useMemo(() => {
        if (!examsData) return [];
        const arr = Array.isArray(examsData) ? examsData : [];
        return arr.filter((exam: any) => {
            const status = exam.status || "DRAFT";
            if (activeStatus !== "ALL" && status !== activeStatus) return false;
            if (searchQuery.trim() !== "") {
                const q = searchQuery.toLowerCase();
                return (
                    (exam.title || "").toLowerCase().includes(q) ||
                    (exam.code || exam.id || "").toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [examsData, activeStatus, searchQuery]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p className="text-sm font-medium">Gagal memuat data paket ujian</p>
                <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Header Command Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">TEACHER EXAM MANAGEMENT</Badge>
                        <span className="text-xs text-muted-foreground">Go Backend: `internal/cbt_engine`</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Paket Ujian & Tryout Guru</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola blueprint soal, buat paket tryout baru, atur durasi, dan pantau status publikasi ujian.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/teacher/exam-packages/create">
                        <Button size="sm" className="text-xs font-bold shadow-md shadow-primary/20">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Buat Paket Ujian Baru
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-3 rounded-2xl border shadow-xs">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                    <Button
                        variant={activeStatus === "ALL" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveStatus("ALL")}
                        className="text-xs font-bold shrink-0"
                    >
                        Semua ({exams.length})
                    </Button>
                    {["PUBLISHED", "DRAFT", "SCHEDULED"].map((s) => (
                        <Button
                            key={s}
                            variant={activeStatus === s ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveStatus(s)}
                            className="text-xs font-bold shrink-0"
                        >
                            {s.charAt(0) + s.slice(1).toLowerCase()} ({examsData ? (Array.isArray(examsData) ? examsData : []).filter((e: any) => e.status === s).length : 0})
                        </Button>
                    ))}
                </div>

                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama atau kode paket..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 text-xs h-9"
                    />
                </div>
            </div>

            {/* Exam Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exams.map((exam: any) => (
                    <Card key={exam.id} className="p-5 flex flex-col justify-between hover:border-primary/40 transition-all space-y-4 shadow-xs">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="font-mono text-[10px]">{exam.code || exam.id.slice(0, 8)}</Badge>
                                <Badge
                                    variant={
                                        exam.status === "PUBLISHED"
                                            ? "success"
                                            : exam.status === "SCHEDULED"
                                                ? "warning"
                                                : "secondary"
                                    }
                                    className="text-[10px]"
                                >
                                    {exam.status}
                                </Badge>
                            </div>
                            <h3 className="font-extrabold text-base text-foreground">{exam.title}</h3>
                            <p className="text-xs text-muted-foreground">{exam.grade_id || exam.type}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border bg-muted/20 text-center text-xs">
                            <div>
                                <span className="text-[10px] text-muted-foreground block">Jumlah Soal</span>
                                <span className="font-bold text-foreground">{exam.question_count ?? exam.total_questions ?? 0} Soal</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground block">Durasi Ujian</span>
                                <span className="font-bold text-foreground">{exam.duration_minutes} Menit</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground block">Peserta</span>
                                <span className="font-bold text-primary">{exam.participant_count ?? 0} Siswa</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground font-mono">
                                {exam.start_at ? `Mulai: ${new Date(exam.start_at).toLocaleDateString("id-ID")}` : "Belum Dijadwalkan"}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button variant="outline" size="sm" className="text-xs h-8 px-2.5">
                                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                                </Button>
                                <Link href="/teacher/exam-packages/create">
                                    <Button size="sm" className="text-xs h-8 px-2.5 font-bold">
                                        <Eye className="h-3.5 w-3.5 mr-1" /> Detail
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
