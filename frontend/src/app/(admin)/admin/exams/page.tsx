// frontend/src/app/(admin)/admin/exams/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { academicService } from "@/services/academic.service";
import { Exam } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Search,
    GraduationCap,
    Clock,
    FileText,
    Sparkles,
    Sliders,
    Edit3,
    Trash2,
    CheckCircle2,
    Filter,
    HelpCircle,
    Loader2,
    BookOpen,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminExamsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

    // Fetch Exams List
    const { data: examList = [], isLoading, isError } = useQuery({
        queryKey: ["admin-exams-list"],
        queryFn: async () => {
            try {
                const res = await academicService.getExams();
                return Array.isArray(res) ? res : [];
            } catch {
                return [];
            }
        },
    });

    // Delete Exam Mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => academicService.deleteExam(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-exams-list"] });
        },
    });

    // Filter Logic
    const filteredExams = examList.filter((exam) => {
        const matchesSearch =
            exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (exam.subject_name && exam.subject_name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory =
            selectedCategory === "ALL" || exam.category === selectedCategory;

        const matchesStatus =
            selectedStatus === "ALL" ||
            (selectedStatus === "PUBLISHED" && exam.status !== "DRAFT") ||
            (selectedStatus === "DRAFT" && exam.status === "DRAFT");

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Stats Calculation
    const totalExams = examList.length;
    const utbkExams = examList.filter((e) => e.category === "UTBK_SNBT" || e.scoring_system === "IRT").length;
    const schoolExams = examList.filter((e) => e.category === "PTS_UAS" || e.category === "UJIAN_HARIAN").length;
    const publishedExams = examList.filter((e) => e.status !== "DRAFT").length;

    return (
        <AppShell>
            <div className="space-y-6 font-sans">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="font-heading font-bold text-xl sm:text-2xl text-foreground flex items-center gap-2.5">
                            <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            Kelola Ujian & Tryout Master
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Manajemen Ujian IRT UTBK SNBT, UMPTN, Latihan Mapel, Bab Materi, dan Dynamic Question Pool Sampling.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/admin/exams/create">
                            <Button className="rounded-xl gap-2 font-semibold text-xs sm:text-sm h-10 shadow-xs">
                                <Plus className="h-4 w-4" /> Buat Ujian / Latihan Baru
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-primary" /> Total Ujian / Latihan
                        </span>
                        <p className="text-xl sm:text-2xl font-bold font-mono text-foreground">{totalExams}</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Ujian Aktif / Publik
                        </span>
                        <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600">{publishedExams}</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> UTBK SNBT / IRT
                        </span>
                        <p className="text-xl sm:text-2xl font-bold font-mono text-amber-600">{utbkExams}</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <Sliders className="h-3.5 w-3.5 text-blue-500" /> PTS / Ujian Harian
                        </span>
                        <p className="text-xl sm:text-2xl font-bold font-mono text-blue-600">{schoolExams}</p>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama ujian, mapel, deskripsi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs rounded-xl bg-background"
                        />
                    </div>

                    <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                            <Filter className="h-3.5 w-3.5" /> Kategori:
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:outline-hidden"
                        >
                            <option value="ALL">Semua Kategori</option>
                            <option value="UTBK_SNBT">UTBK SNBT (IRT)</option>
                            <option value="UM_PTN">Ujian Mandiri PTN</option>
                            <option value="TRYOUT_NASIONAL">Tryout Nasional</option>
                            <option value="PTS_UAS">PTS / UAS Sekolah</option>
                            <option value="UJIAN_HARIAN">Ujian Harian / Drill</option>
                            <option value="UJIAN_BAB">Ujian Per-Bab Materi</option>
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:outline-hidden"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="PUBLISHED">Publik</option>
                            <option value="DRAFT">Draft</option>
                        </select>
                    </div>
                </div>

                {/* Exams Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center p-12 text-muted-foreground font-medium text-xs">
                        <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" /> Memuat daftar ujian...
                    </div>
                ) : filteredExams.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-border rounded-3xl bg-card space-y-3">
                        <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
                        <p className="text-sm font-semibold text-foreground">Tidak Ada Paket Ujian Ditemukan</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Belum ada paket ujian yang sesuai dengan filter pencarian Anda. Silakan tambah paket ujian baru.
                        </p>
                        <Link href="/admin/exams/create">
                            <Button size="sm" className="rounded-xl mt-2 text-xs">
                                <Plus className="h-4 w-4 mr-1" /> Buat Paket Ujian Pertama
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredExams.map((exam) => (
                            <div
                                key={exam.id}
                                className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all shadow-2xs flex flex-col justify-between space-y-4"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <Badge
                                            variant={exam.category === "UTBK_SNBT" ? "secondary" : "outline"}
                                            className="text-[10px] font-bold"
                                        >
                                            {exam.category || "UTBK SNBT"}
                                        </Badge>

                                        {exam.subject_name && (
                                            <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                                                {exam.subject_name}
                                            </Badge>
                                        )}

                                        {exam.difficulty && (
                                            <Badge variant="outline" className="text-[10px] font-semibold">
                                                {exam.difficulty}
                                            </Badge>
                                        )}

                                        <Badge
                                            variant={exam.status === "DRAFT" ? "outline" : "default"}
                                            className="text-[10px] ml-auto"
                                        >
                                            {exam.status === "DRAFT" ? "Draft" : "Published"}
                                        </Badge>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                                            {exam.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                            {exam.description || "Tidak ada deskripsi ujian."}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-border/60">
                                    <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground font-medium">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <span>{exam.duration_minutes}m</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <span>{exam.total_questions} Soal</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            <span>{exam.scoring_system || "IRT"}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deleteMutation.mutate(exam.id)}
                                            className="h-8 rounded-xl text-xs text-destructive hover:bg-destructive/10 border-destructive/20"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus
                                        </Button>

                                        <Link href={`/admin/exams`}>
                                            <Button size="sm" variant="secondary" className="h-8 rounded-xl text-xs font-semibold">
                                                <Edit3 className="h-3.5 w-3.5 mr-1" /> Detail
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
