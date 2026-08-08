// frontend/src/app/(admin)/admin/exams/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { academicService } from "@/services/academic.service";
import { Exam } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EXAM_PRESETS } from "@/components/admin/exams/exam-presets";
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
    CheckSquare,
    Square,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    LayoutGrid,
    Table as TableIcon,
    LayoutTemplate,
    AlertCircle,
    Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminExamsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [selectedScoring, setSelectedScoring] = useState<string>("ALL");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    // Checkboxes & Pagination State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Fetch Exams List
    const { data: examList = [], isLoading, isError, error, refetch } = useQuery({
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
        onSuccess: (_, deletedId) => {
            queryClient.invalidateQueries({ queryKey: ["admin-exams-list"] });
            setSelectedIds((prev) => prev.filter((i) => i !== deletedId));
        },
    });

    // Filter Logic
    const filteredExams = useMemo(() => {
        return examList.filter((exam) => {
            const matchesSearch =
                !searchQuery ||
                exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (exam.subject_name && exam.subject_name.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory =
                selectedCategory === "ALL" || exam.category === selectedCategory;

            const matchesStatus =
                selectedStatus === "ALL" ||
                (selectedStatus === "PUBLISHED" && exam.status !== "DRAFT") ||
                (selectedStatus === "DRAFT" && exam.status === "DRAFT");

            const matchesScoring =
                selectedScoring === "ALL" || exam.scoring_system === selectedScoring;

            return matchesSearch && matchesCategory && matchesStatus && matchesScoring;
        });
    }, [examList, searchQuery, selectedCategory, selectedStatus, selectedScoring]);

    // Pagination Logic
    const totalItems = filteredExams.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const paginatedExams = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredExams.slice(start, start + pageSize);
    }, [filteredExams, page, pageSize]);

    // Checkbox Handling
    const handleSelectAll = () => {
        if (selectedIds.length === paginatedExams.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedExams.map((e) => e.id));
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} paket ujian terpilih?`)) return;

        try {
            for (const id of selectedIds) {
                await academicService.deleteExam(id);
            }
            setSelectedIds([]);
            refetch();
        } catch {
            alert("Gagal menghapus beberapa ujian.");
        }
    };

    // Stats Calculation
    const totalExams = examList.length;
    const utbkExams = examList.filter((e) => e.category === "UTBK_SNBT" || e.scoring_system === "IRT").length;
    const schoolExams = examList.filter((e) => e.category === "PTS_UAS" || e.category === "UJIAN_HARIAN").length;
    const publishedExams = examList.filter((e) => e.status !== "DRAFT").length;

    return (
        <AppShell>
            <div className="space-y-6 font-sans">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-heading font-bold text-xl sm:text-2xl text-foreground flex items-center gap-2.5">
                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            Katalog Studio Ujian & Tryout Master
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Kelola repositori paket ujian IRT UTBK SNBT, PTS/UAS, Latihan Mapel, dan Dynamic Question Pool Sampling.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link href="/admin/exams/create">
                            <Button className="rounded-xl gap-2 font-bold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm h-10">
                                <Plus className="h-4 w-4" /> Buat Paket Ujian Baru
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Error Banner */}
                {isError && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error instanceof Error ? error.message : "Gagal memuat data katalog ujian."}</span>
                        <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg text-xs">
                            Coba Lagi
                        </Button>
                    </div>
                )}

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
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> UTBK SNBT (IRT)
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
                <Card className="p-4 border border-border/80 bg-card shadow-2xs rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama ujian, mapel, deskripsi..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9 h-9 text-xs rounded-xl bg-background"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-medium">
                            <Filter className="h-3.5 w-3.5" /> Filter:
                        </div>

                        {/* Category Dropdown */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setPage(1);
                            }}
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

                        {/* Status Dropdown */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:outline-hidden"
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="PUBLISHED">Publik</option>
                            <option value="DRAFT">Draft</option>
                        </select>

                        {/* Scoring System Dropdown */}
                        <select
                            value={selectedScoring}
                            onChange={(e) => {
                                setSelectedScoring(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:outline-hidden"
                        >
                            <option value="ALL">Semua Penilaian</option>
                            <option value="IRT">IRT (Item Response Theory)</option>
                            <option value="STANDARD_POINTS">Poin Standar (0-100)</option>
                            <option value="NEGATIVE_MARKING">Minus System (+4/-1/0)</option>
                        </select>

                        {/* Reset & View Switcher */}
                        <div className="flex items-center gap-1 border-l border-border pl-2">
                            <Button
                                variant={viewMode === "table" ? "secondary" : "ghost"}
                                size="icon"
                                onClick={() => setViewMode("table")}
                                className="h-8 w-8 rounded-lg"
                                title="Tampilan Tabel (Bank Soal Style)"
                            >
                                <TableIcon className="h-4 w-4" />
                            </Button>

                            <Button
                                variant={viewMode === "grid" ? "secondary" : "ghost"}
                                size="icon"
                                onClick={() => setViewMode("grid")}
                                className="h-8 w-8 rounded-lg"
                                title="Tampilan Grid Kartu"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* DATA TABLE VIEW (BANK SOAL STYLE) */}
                {viewMode === "table" ? (
                    <Card className="p-0 border border-border/80 overflow-hidden rounded-2xl shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 w-10 text-center">
                                            <button
                                                type="button"
                                                onClick={handleSelectAll}
                                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                                            >
                                                {selectedIds.length > 0 &&
                                                    selectedIds.length === paginatedExams.length ? (
                                                    <CheckSquare className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Square className="h-4 w-4" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="p-4">Kode & Judul Ujian</th>
                                        <th className="p-4">Mapel / Jenjang</th>
                                        <th className="p-4">Durasi & Soal</th>
                                        <th className="p-4">Skema Penilaian</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Aksi</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-border/60">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                                                Memuat data ujian...
                                            </td>
                                        </tr>
                                    ) : paginatedExams.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-muted-foreground">
                                                <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                                <p className="font-semibold text-foreground">Tidak Ada Ujian Ditemukan</p>
                                                <p className="text-xs">Coba ubah kata kunci atau filter yang dipilih.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedExams.map((exam) => {
                                            const isChecked = selectedIds.includes(exam.id);
                                            return (
                                                <tr
                                                    key={exam.id}
                                                    className={`hover:bg-muted/30 transition-colors ${isChecked ? "bg-primary/5" : ""}`}
                                                >
                                                    <td className="p-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectRow(exam.id)}
                                                            className="text-muted-foreground hover:text-primary cursor-pointer"
                                                        >
                                                            {isChecked ? (
                                                                <CheckSquare className="h-4 w-4 text-primary" />
                                                            ) : (
                                                                <Square className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </td>

                                                    <td className="p-4 space-y-1 max-w-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-[11px] font-bold text-muted-foreground">
                                                                EX-{exam.id.slice(0, 6)}
                                                            </span>
                                                            <Badge
                                                                variant={exam.category === "UTBK_SNBT" ? "secondary" : "outline"}
                                                                className="text-[10px] font-bold"
                                                            >
                                                                {exam.category || "UTBK_SNBT"}
                                                            </Badge>
                                                        </div>
                                                        <p className="font-bold text-foreground hover:text-primary leading-snug line-clamp-1">
                                                            {exam.title}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                            {exam.description || "Tidak ada deskripsi."}
                                                        </p>
                                                    </td>

                                                    <td className="p-4 space-y-1">
                                                        <div className="font-medium text-foreground">
                                                            {exam.subject_name || "Multi-Mapel (Paket)"}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            {exam.grade_level || "12 SMA / UTBK"}
                                                        </div>
                                                    </td>

                                                    <td className="p-4 space-y-1">
                                                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                                            <Clock className="h-3.5 w-3.5 text-primary" />
                                                            <span>{exam.duration_minutes} Menit</span>
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                                            <span>{exam.total_questions || 30} Soal</span>
                                                            <span>• Pass: {exam.passing_score || 500}</span>
                                                        </div>
                                                    </td>

                                                    <td className="p-4">
                                                        <Badge
                                                            variant={exam.scoring_system === "IRT" ? "default" : "secondary"}
                                                            className="text-[10px] font-bold"
                                                        >
                                                            {exam.scoring_system || "IRT"}
                                                        </Badge>
                                                    </td>

                                                    <td className="p-4">
                                                        <Badge
                                                            variant={exam.status === "DRAFT" ? "outline" : "default"}
                                                            className="text-[10px]"
                                                        >
                                                            {exam.status === "DRAFT" ? "Draft" : "Published"}
                                                        </Badge>
                                                    </td>

                                                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                                                        <Link href={`/admin/exams/create`}>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                        </Link>

                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => deleteMutation.mutate(exam.id)}
                                                            className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">Tampilkan per halaman:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="h-8 rounded-xl border border-input bg-background px-2.5 font-medium text-xs focus:outline-hidden"
                                >
                                    <option value={20}>20 Data</option>
                                    <option value={50}>50 Data</option>
                                    <option value={100}>100 Data</option>
                                    <option value={1000}>1000 Data</option>
                                </select>

                                <span className="text-muted-foreground font-mono">
                                    Menampilkan {filteredExams.length > 0 ? (page - 1) * pageSize + 1 : 0} -{" "}
                                    {Math.min(page * pageSize, filteredExams.length)} dari {filteredExams.length} ujian
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(1)}
                                    disabled={page === 1}
                                    className="h-8 w-8 rounded-lg"
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-8 w-8 rounded-lg"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="px-2 font-mono font-bold">
                                    {page} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="h-8 w-8 rounded-lg"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(totalPages)}
                                    disabled={page >= totalPages}
                                    className="h-8 w-8 rounded-lg"
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    /* GRID VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {paginatedExams.map((exam) => (
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
                                            <span>{exam.total_questions || 30} Soal</span>
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

                                        <Link href={`/admin/exams/create`}>
                                            <Button size="sm" variant="secondary" className="h-8 rounded-xl text-xs font-semibold">
                                                <Edit3 className="h-3.5 w-3.5 mr-1" /> Sunting
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* FLOATING ACTION BAR (BANK SOAL STYLE) */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                                {selectedIds.length}
                            </span>
                            <span>Ujian Terpilih</span>
                        </div>

                        <div className="h-4 w-px bg-background/20" />

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleBulkDelete}
                                className="h-8 rounded-xl text-xs font-semibold gap-1.5"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Hapus Terpilih
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedIds([])}
                                className="h-8 rounded-xl text-xs text-background/80 hover:text-background hover:bg-background/10"
                            >
                                Batal Pilih
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
