"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionStatsBar } from "@/components/admin/questions/question-stats-bar";
import { QuestionFilterBar } from "@/components/admin/questions/question-filter-bar";
import { QuestionDetailDrawer } from "@/components/admin/questions/question-detail-drawer";
import { QuestionEditModal } from "@/components/admin/questions/question-edit-modal";
import { QuestionBulkModal } from "@/components/admin/questions/question-bulk-modal";
import { ExtendedQuestion } from "@/types/question-bank";
import { questionService } from "@/services/question.service";
import {
    Plus,
    UploadCloud,
    Eye,
    Flame,
    CheckSquare,
    Square,
    Layers,
    AlertCircle,
    HelpCircle,
    Edit3,
    CheckCircle2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Trash2,
} from "lucide-react";

export default function AdminQuestionsPage() {
    const [selectedQuestion, setSelectedQuestion] = useState<ExtendedQuestion | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editQuestion, setEditQuestion] = useState<ExtendedQuestion | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const [filters, setFilters] = useState({
        search: "",
        subject: "ALL",
        difficulty: "ALL",
        questionType: "ALL",
        status: "ALL",
        isHotsOnly: false,
    });

    const { data: queryResult, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["admin-questions-catalog", filters.subject, filters.difficulty, filters.status, page, pageSize],
        queryFn: async () => {
            const res = await questionService.getQuestions({
                subject_name: filters.subject !== "ALL" ? filters.subject : undefined,
                difficulty: filters.difficulty !== "ALL" ? filters.difficulty : undefined,
                page,
                limit: pageSize,
            });
            const items = Array.isArray(res) ? res : (res as any)?.data || (res as any)?.items || [];
            const total = (res as any)?.meta?.total || items.length;
            const totalPages = (res as any)?.meta?.total_pages || Math.ceil(total / pageSize) || 1;

            const mapped = items.map((q: any) => ({
                id: q.id || `q-${Math.random()}`,
                question_code: q.question_code || q.code || `QS-${q.id || "001"}`,
                version_no: q.version_no || 1,
                status: q.status || "PUBLISHED",
                content: q.content || q.text || "",
                blocks: q.blocks || [
                    { block_order: 1, block_type: "PARAGRAPH", content: q.content || q.text || "" }
                ],
                options: (q.options || []).map((opt: any, idx: number) => ({
                    id: opt.id || `opt-${idx}`,
                    label: opt.label || String.fromCharCode(65 + idx),
                    score: opt.score || (opt.is_correct ? 100 : 0),
                    is_correct: opt.is_correct ?? false,
                    content: opt.content || opt.text || "",
                })),
                question_type: q.question_type || q.type || "SINGLE_CHOICE",
                explanation: q.explanation || "",
                classification: {
                    level_name: q.classification?.level_name || q.level_name || "Semua Jenjang",
                    grade_name: q.classification?.grade_name || q.grade_name || "Semua Kelas",
                    subject_name: q.classification?.subject_name || q.subject_name || "Umum",
                    chapter_name: q.classification?.chapter_name || q.chapter_name || "-",
                    topic_name: q.classification?.topic_name || q.topic_name || "-",
                    competency_name: q.classification?.competency_name || q.competency_name || "-",
                    curriculum_name: q.classification?.curriculum_name || q.curriculum_name || "Kurikulum Merdeka",
                },
                metadata: {
                    estimated_time_seconds: q.metadata?.estimated_time_seconds || 120,
                    difficulty_level: q.metadata?.difficulty_level || q.difficulty || "MEDIUM",
                    blooms_level: q.metadata?.blooms_level || "C3",
                    is_hots: q.metadata?.is_hots ?? false,
                    is_calculator_allowed: q.metadata?.is_calculator_allowed ?? false,
                    is_randomizable: q.metadata?.is_randomizable ?? true,
                },
                created_by: q.created_by || "system",
                author_name: q.author_name || q.author || "Admin",
                created_at: q.created_at || new Date().toISOString().split("T")[0],
                updated_at: q.updated_at || new Date().toISOString().split("T")[0],
            })) as ExtendedQuestion[];

            return { items: mapped, total, totalPages };
        },
    });

    const questions = queryResult?.items || [];
    const totalItems = queryResult?.total || questions.length;
    const totalPages = queryResult?.totalPages || 1;

    const filteredQuestions = useMemo(() => {
        return questions.filter((q) => {
            if (
                filters.search &&
                !q.content.toLowerCase().includes(filters.search.toLowerCase()) &&
                !q.question_code.toLowerCase().includes(filters.search.toLowerCase())
            ) {
                return false;
            }
            if (filters.subject !== "ALL" && q.classification.subject_name !== filters.subject) {
                return false;
            }
            if (filters.difficulty !== "ALL" && q.metadata.difficulty_level !== filters.difficulty) {
                return false;
            }
            if (filters.questionType !== "ALL" && q.question_type !== filters.questionType) {
                return false;
            }
            if (filters.status !== "ALL" && q.status !== filters.status) {
                return false;
            }
            if (filters.isHotsOnly && !q.metadata.is_hots) {
                return false;
            }
            return true;
        });
    }, [questions, filters]);

    const stats = useMemo(() => {
        return {
            total: questions.length,
            published: questions.filter((q) => q.status === "PUBLISHED").length,
            draft: questions.filter((q) => q.status === "DRAFT" || q.status === "REVIEW").length,
            hots: questions.filter((q) => q.metadata.is_hots).length,
            importJobs: 0,
        };
    }, [questions]);

    const handleSelectAll = () => {
        if (selectedIds.length === filteredQuestions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredQuestions.map((q) => q.id));
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleOpenDetail = (q: ExtendedQuestion) => {
        setSelectedQuestion(q);
        setIsDrawerOpen(true);
    };

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        setIsBulkLoading(true);
        try {
            const res = await questionService.bulkPublishQuestions(selectedIds);
            alert(`Berhasil menyetujui dan menerbitkan ${res.count || selectedIds.length} soal!`);
            setSelectedIds([]);
            refetch();
        } catch (err: any) {
            alert(err?.message || "Gagal melakukan approval masal");
        } finally {
            setIsBulkLoading(false);
        }
    };

    const handleBulkApply = async (payload: {
        subject_id?: string;
        grade_id?: string;
        difficulty?: string;
        status?: string;
        score?: number;
        negative_score?: number;
    }) => {
        if (selectedIds.length === 0) return;
        setIsBulkLoading(true);
        try {
            const res = await questionService.bulkUpdateQuestions({
                ids: selectedIds,
                ...payload,
            });
            alert(`Berhasil memperbarui ${res.count || selectedIds.length} soal secara serentak!`);
            setSelectedIds([]);
            refetch();
        } catch (err: any) {
            alert(err?.message || "Gagal melakukan edit masal");
        } finally {
            setIsBulkLoading(false);
        }
    };

    const handleDeleteSingle = async (id: string, code: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus butir soal ${code} ini secara permanen dari database?`)) {
            return;
        }
        try {
            await questionService.deleteQuestion(id);
            alert(`Soal ${code} berhasil dihapus.`);
            setSelectedIds((prev) => prev.filter((i) => i !== id));
            refetch();
        } catch (err: any) {
            alert(err?.message || "Gagal menghapus soal");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} butir soal yang dipilih ini secara masal? Tindakan ini tidak dapat dibatalkan.`)) {
            return;
        }
        setIsBulkLoading(true);
        try {
            const res = await questionService.bulkDeleteQuestions(selectedIds);
            alert(`Berhasil menghapus ${res.count || selectedIds.length} soal secara permanen!`);
            setSelectedIds([]);
            refetch();
        } catch (err: any) {
            alert(err?.message || "Gagal menghapus soal secara masal");
        } finally {
            setIsBulkLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Top Header & Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight">
                            Bank Soal &amp; Katalog Butir (Admin)
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola repositori butir soal, taksonomi kognitif, statistik IRT, dan pipeline import dokumen.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Link href="/admin/questions/import">
                            <Button variant="outline" className="rounded-xl gap-2 font-semibold shadow-2xs border-border">
                                <UploadCloud className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                Import Soal (PDF/Docx/Xlsx/CSV)
                            </Button>
                        </Link>

                        <Link href="/admin/questions/create">
                            <Button className="rounded-xl gap-2 font-bold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90">
                                <Plus className="h-4 w-4" /> Buat Soal Baru
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Error Banner */}
                {isError && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error instanceof Error ? error.message : "Gagal memuat data bank soal dari database."}</span>
                        <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                            Coba Lagi
                        </Button>
                    </div>
                )}

                {/* Stats Metrics Bar */}
                <QuestionStatsBar
                    totalQuestions={stats.total}
                    publishedCount={stats.published}
                    draftCount={stats.draft}
                    hotsCount={stats.hots}
                    importJobsCount={stats.importJobs}
                />

                {/* Filter & Search Bar */}
                <QuestionFilterBar
                    filters={filters}
                    onChange={setFilters}
                    onReset={() =>
                        setFilters({
                            search: "",
                            subject: "ALL",
                            difficulty: "ALL",
                            questionType: "ALL",
                            status: "ALL",
                            isHotsOnly: false,
                        })
                    }
                />

                {/* Bulk Action Bar (Visible when items selected) */}
                {selectedIds.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-950 text-indigo-100 border border-indigo-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-indigo-600 text-white font-bold text-xs px-2.5 py-1">
                                {selectedIds.length} Soal Terpilih
                            </Badge>
                            <span className="text-xs text-indigo-300">
                                Pilih aksi masal untuk diproses sekaligus ke database
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleBulkApprove}
                                disabled={isBulkLoading}
                                className="rounded-xl gap-1.5 text-xs font-semibold bg-indigo-900/60 border-indigo-700 text-indigo-100 hover:bg-indigo-800 hover:text-white"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Terbitkan Terpilih
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsBulkModalOpen(true)}
                                disabled={isBulkLoading}
                                className="rounded-xl gap-1.5 text-xs font-semibold bg-indigo-900/60 border-indigo-700 text-indigo-100 hover:bg-indigo-800 hover:text-white"
                            >
                                <Edit3 className="h-3.5 w-3.5 text-amber-400" /> Edit Serentak
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleBulkDelete}
                                disabled={isBulkLoading}
                                className="rounded-xl gap-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Hapus Masal
                            </Button>
                        </div>
                    </div>
                )}

                {/* Data Table */}
                <Card className="p-0 border border-border/80 overflow-hidden rounded-2xl shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 w-10 text-center">
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            {selectedIds.length > 0 &&
                                                selectedIds.length === filteredQuestions.length ? (
                                                <CheckSquare className="h-4 w-4 text-primary" />
                                            ) : (
                                                <Square className="h-4 w-4" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4">Kode Soal</th>
                                    <th className="p-4 min-w-[280px]">Konten / Ringkasan Soal</th>
                                    <th className="p-4">Mata Pelajaran &amp; Kelas</th>
                                    <th className="p-4">Tipe Soal</th>
                                    <th className="p-4">Tingkat Kesulitan</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx}>
                                            <td colSpan={8} className="p-4">
                                                <Skeleton className="h-10 w-full rounded-lg" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredQuestions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <HelpCircle className="h-10 w-10 text-muted-foreground/40" />
                                                <p className="font-medium text-sm">Belum ada data butir soal di database.</p>
                                                <p className="text-xs text-muted-foreground max-w-sm">
                                                    Gunakan tombol &quot;Buat Soal Baru&quot; atau &quot;Import Soal&quot; untuk menambahkan data ke dalam repositori bank soal.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredQuestions.map((q) => {
                                        const isSelected = selectedIds.includes(q.id);
                                        return (
                                            <tr
                                                key={q.id}
                                                className={`hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                                            >
                                                <td className="p-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectRow(q.id)}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare className="h-4 w-4 text-primary" />
                                                        ) : (
                                                            <Square className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </td>

                                                <td className="p-4 font-mono font-bold text-foreground">
                                                    {q.question_code}
                                                </td>

                                                <td className="p-4 space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        {q.metadata.is_hots && (
                                                            <Badge
                                                                variant="destructive"
                                                                className="text-[9px] px-1.5 py-0 gap-0.5"
                                                            >
                                                                <Flame className="h-2.5 w-2.5" /> HOTS
                                                            </Badge>
                                                        )}
                                                        <span className="font-semibold text-foreground line-clamp-1">
                                                            {q.content}
                                                        </span>
                                                    </div>
                                                    {q.blocks.length > 0 && (
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Layers className="h-3 w-3" /> {q.blocks.length} Blok Konten
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="p-4">
                                                    <span className="font-semibold block text-foreground">
                                                        {q.classification.subject_name}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {q.classification.grade_name}
                                                    </span>
                                                </td>

                                                <td className="p-4">
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {q.question_type === "SINGLE_CHOICE"
                                                            ? "Pilihan Ganda"
                                                            : q.question_type}
                                                    </Badge>
                                                </td>

                                                <td className="p-4">
                                                    <Badge
                                                        variant={
                                                            q.metadata.difficulty_level === "EXPERT" ||
                                                                q.metadata.difficulty_level === "HARD"
                                                                ? "destructive"
                                                                : q.metadata.difficulty_level === "MEDIUM"
                                                                    ? "default"
                                                                    : "outline"
                                                        }
                                                        className="text-[10px]"
                                                    >
                                                        {q.metadata.difficulty_level}
                                                    </Badge>
                                                </td>

                                                <td className="p-4">
                                                    <Badge
                                                        variant={
                                                            q.status === "PUBLISHED"
                                                                ? "default"
                                                                : q.status === "DRAFT"
                                                                    ? "secondary"
                                                                    : "outline"
                                                        }
                                                        className="text-[10px]"
                                                    >
                                                        {q.status}
                                                    </Badge>
                                                </td>

                                                {/* Action column: Read Detail, Row-Level Edit, and Delete */}
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenDetail(q)}
                                                            className="rounded-xl gap-1 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" /> Detail
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditQuestion(q);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="rounded-xl gap-1 text-xs font-semibold hover:bg-accent"
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5" /> Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteSingle(q.id, q.question_code)}
                                                            className="rounded-xl gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" /> Hapus
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/80 bg-muted/20">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Tampilkan:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/20"
                            >
                                <option value={20}>20 per halaman</option>
                                <option value={50}>50 per halaman</option>
                                <option value={100}>100 per halaman</option>
                                <option value={1000}>1000 per halaman</option>
                            </select>
                            <span>
                                Menampilkan <strong>{filteredQuestions.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> - <strong>{Math.min(page * pageSize, totalItems)}</strong> dari <strong>{totalItems}</strong> soal
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(1)}
                                disabled={page <= 1}
                                className="h-8 w-8 p-0 rounded-lg border-border"
                                title="Halaman Pertama"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="h-8 w-8 p-0 rounded-lg border-border"
                                title="Halaman Sebelumnya"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <span className="text-xs px-3 font-semibold text-foreground">
                                Halaman {page} dari {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="h-8 w-8 p-0 rounded-lg border-border"
                                title="Halaman Selanjutnya"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages}
                                className="h-8 w-8 p-0 rounded-lg border-border"
                                title="Halaman Terakhir"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Read-Only Detail Drawer */}
            <QuestionDetailDrawer
                question={selectedQuestion}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onStatusChange={() => refetch()}
            />

            {/* Row-Level Inline Editor Modal */}
            <QuestionEditModal
                question={editQuestion}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => refetch()}
            />

            {/* Bulk Edit Dialog Modal */}
            <QuestionBulkModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                selectedIds={selectedIds}
                onApply={handleBulkApply}
            />

            {/* Floating Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur-md border border-border text-card-foreground px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-600 text-white font-mono px-3 py-1 text-xs shadow-xs">
                            {selectedIds.length} Soal Dipilih
                        </Badge>
                    </div>

                    <div className="h-5 w-px bg-border" />

                    <div className="flex items-center gap-2.5">
                        <Button
                            onClick={handleBulkApprove}
                            disabled={isBulkLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl gap-2 shadow-sm text-xs"
                        >
                            {isBulkLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" />
                            )}
                            Approval Masal (Publish)
                        </Button>

                        <Button
                            onClick={() => setIsBulkModalOpen(true)}
                            disabled={isBulkLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl gap-2 shadow-sm text-xs"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit Masal
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedIds([])}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl text-xs"
                        >
                            Batal Pilih
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
