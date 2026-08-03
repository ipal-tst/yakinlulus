"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import {
    useQuestions,
    useDeleteQuestion,
    useSubjects,
    useGrades,
    useLevels,
    apiFetch,
} from "@/lib/api";
import {
    Plus,
    Search,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    Calculator,
    FileSpreadsheet,
    Trash2,
    Edit3,
    ChevronDown,
    ChevronUp,
    Check,
} from "lucide-react";


export default function QuestionBankAdminPage() {
    // Search & Filters
    const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
    const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>("ALL");
    const [selectedSubjectFilter, setSelectedSubjectFilter] = React.useState<string>("ALL");
    const [selectedGradeFilter, setSelectedGradeFilter] = React.useState<string>("ALL");
    const [search, setSearch] = React.useState("");
    const [expandedQuestionId, setExpandedQuestionId] = React.useState<string | null>(null);

    // Academic data
    const { data: levels = [] } = useLevels() as any;
    const levelsList: any[] = Array.isArray(levels) ? levels : levels?.data || [];
    const { data: grades = [] } = useGrades() as any;
    const gradesList: any[] = Array.isArray(grades) ? grades : grades?.data || [];

    // Queries
    const { data: rawQuestions = [], isLoading: loading, refetch } = useQuestions(
        (() => {
            const params: Record<string, string> = {};
            if (selectedSubjectFilter !== "ALL") params.subject_id = selectedSubjectFilter;
            if (selectedGradeFilter !== "ALL") params.grade_id = selectedGradeFilter;
            return Object.keys(params).length > 0 ? params : undefined;
        })()
    ) as any;

    const questions: any[] = Array.isArray(rawQuestions)
        ? rawQuestions
        : rawQuestions?.questions || rawQuestions?.data || [];

    const { data: subjects = [] } = useSubjects() as any;
    const subjectsList: any[] = Array.isArray(subjects) ? subjects : subjects?.data || [];

    // Mutations
    const deleteQuestionMutation = useDeleteQuestion();

    // --- Modals State ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isFsmModalOpen, setIsFsmModalOpen] = React.useState(false);
    const [isKatexModalOpen, setIsKatexModalOpen] = React.useState(false);

    const [activeQuestion, setActiveQuestion] = React.useState<any | null>(null);
    const [fsmSuccess, setFsmSuccess] = React.useState(false);
    const [newTargetStatus, setNewTargetStatus] = React.useState<string>("APPROVED");

    // Submit Delete Question
    const handleDeleteSubmit = async () => {
        if (!activeQuestion) return;
        try {
            await deleteQuestionMutation.mutateAsync(activeQuestion.id);
            setIsDeleteModalOpen(false);
            setActiveQuestion(null);
            refetch();
        } catch (err: any) {
            alert("Gagal menghapus soal: " + (err.message || err));
        }
    };

    // FSM State Transition
    const handleFsmTransition = async () => {
        if (!activeQuestion) return;

        try {
            if (newTargetStatus === "APPROVED" || newTargetStatus === "PUBLISHED") {
                await apiFetch(`/questions/${activeQuestion.id}/publish`, { method: "POST" });
            } else if (newTargetStatus === "DRAFT") {
                await apiFetch(`/questions/${activeQuestion.id}/unpublish`, { method: "POST" });
            } else if (newTargetStatus === "REJECTED" || newTargetStatus === "ARCHIVED") {
                await apiFetch(`/questions/${activeQuestion.id}/archive`, { method: "POST" });
            }

            setFsmSuccess(true);
            setTimeout(() => {
                setFsmSuccess(false);
                setIsFsmModalOpen(false);
                setActiveQuestion(null);
                refetch();
            }, 1000);
        } catch (err) {
            console.error("FSM Transition failed:", err);
            alert("Gagal memperbarui status FSM");
        }
    };

    // Filter questions in list
    const filteredQuestions = questions.filter((q: any) => {
        const text = q.content || q.questionText || "";
        const code = q.code || q.id || "";
        const matchesSearch = text.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = selectedStatus === "ALL" || q.status === selectedStatus;
        const matchesDifficulty = selectedDifficulty === "ALL" || q.difficulty === selectedDifficulty;
        return matchesSearch && matchesStatus && matchesDifficulty;
    });

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">FSM & CRUD ENGINE</Badge>
                        <span className="text-xs text-muted-foreground">Go Fiber API & Supabase PostgreSQL</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Bank Soal & FSM Workflow CMS</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola siklus hidup soal (Draft → Review → Approved), preview KaTeX, serta Import Soal Massal dari Excel / CSV.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/admin/question-bank/import">
                        <Button
                            variant="default"
                            size="sm"
                            className="text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md cursor-pointer"
                        >
                            <Sparkles className="mr-2 h-4 w-4" /> ✨ Import AI PDF / Gambar
                        </Button>
                    </Link>
                    <Link href="/admin/question-bank/import">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-semibold border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Excel / CSV
                        </Button>
                    </Link>
                    <Link href="/admin/question-bank/create">
                        <Button size="sm" className="text-xs font-bold shadow-md shadow-primary/20 cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" /> Buat Soal Baru
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <Card className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan kode atau teks soal..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        <select
                            value={selectedGradeFilter}
                            onChange={(e) => {
                                setSelectedGradeFilter(e.target.value);
                                setSelectedSubjectFilter("ALL");
                            }}
                            className="px-3 py-1.5 text-xs rounded-xl border bg-background font-semibold shrink-0"
                        >
                            <option value="ALL">Semua Kelas</option>
                            {gradesList.map((g: any) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedSubjectFilter}
                            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs rounded-xl border bg-background font-semibold shrink-0"
                        >
                            <option value="ALL">Semua Mata Pelajaran</option>
                            {subjectsList.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.level_code || "?"})
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="px-3 py-1.5 text-xs rounded-xl border bg-background font-semibold shrink-0"
                        >
                            <option value="ALL">Semua Kesulitan</option>
                            <option value="EASY">EASY (Mudah)</option>
                            <option value="MEDIUM">MEDIUM (Sedang)</option>
                            <option value="HARD">HARD (Sulit)</option>
                        </select>

                        <div className="flex items-center gap-1 shrink-0">
                            {["ALL", "DRAFT", "APPROVED", "PUBLISHED", "ARCHIVED"].map((st) => (
                                <Button
                                    key={st}
                                    variant={selectedStatus === st ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedStatus(st)}
                                    className="text-[11px] font-semibold h-8"
                                >
                                    {st}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Questions Grid */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center text-xs text-muted-foreground">
                        Memuat data Bank Soal dari PostgreSQL Database...
                    </div>
                ) : filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q: any) => {
                        const isExpanded = expandedQuestionId === q.id;
                        return (
                            <Card key={q.id} className="p-5 space-y-4 hover:border-primary/40 transition-all">
                                <div className="flex items-start justify-between gap-4 border-b pb-3">
                                    <div className="flex items-center flex-wrap gap-2">
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                            {`Q-${q.id.substring(0, 8)}`}
                                        </Badge>
                                        <Badge variant="default" className="text-[10px] font-bold">
                                            {q.subject_name || "Mata Pelajaran"}
                                        </Badge>
                                        {q.grade_name && (
                                            <Badge variant="secondary" className="text-[10px]">
                                                {q.grade_name}
                                            </Badge>
                                        )}
                                        {q.level_name && !q.grade_name && (
                                            <Badge variant="secondary" className="text-[10px]">
                                                {q.level_name}
                                            </Badge>
                                        )}
                                        {q.chapter_name && (
                                            <Badge variant="secondary" className="text-[10px]">
                                                {q.chapter_name}
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-[10px]">
                                            {q.difficulty || "MEDIUM"}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] bg-muted/50">
                                            {q.question_type || "SINGLE_CHOICE"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="default"
                                            className={`text-[10px] font-bold ${q.status === "PUBLISHED"
                                                ? "bg-emerald-600"
                                                : q.status === "APPROVED"
                                                    ? "bg-blue-600"
                                                    : q.status === "DRAFT"
                                                        ? "bg-amber-600"
                                                        : "bg-gray-500"
                                                }`}
                                        >
                                            {q.status || "APPROVED"}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="text-xs text-foreground font-medium bg-muted/20 p-3.5 rounded-xl border whitespace-pre-wrap">
                                    {q.content || "Teks pertanyaan..."}
                                </div>

                                {/* Options & Details Accordion */}
                                {isExpanded && (
                                    <div className="space-y-3 pt-2 border-t mt-3">
                                        <div className="space-y-1.5">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                                Pilihan Jawaban
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {q.options && q.options.length > 0 ? (
                                                    q.options.map((opt: any, i: number) => {
                                                        const isCorrect = opt.is_correct || opt.correct;
                                                        return (
                                                            <div
                                                                key={opt.id || i}
                                                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${isCorrect
                                                                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                                                                    : "bg-background"
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold font-mono px-2 py-0.5 rounded bg-muted text-[11px]">
                                                                        {opt.label || String.fromCharCode(65 + i)}
                                                                    </span>
                                                                    <span>{opt.content}</span>
                                                                </div>
                                                                {isCorrect && (
                                                                    <Badge className="bg-emerald-600 text-[10px] shrink-0">
                                                                        <Check className="h-3 w-3 mr-1" /> Jawaban Benar
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Belum ada opsi jawaban tersimpan.
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {q.explanation && (
                                            <div className="p-3 rounded-xl border bg-amber-50/60 border-amber-200 text-xs">
                                                <span className="font-bold text-amber-800 block mb-1">Pembahasan:</span>
                                                <p className="text-amber-900 leading-relaxed">{q.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between text-xs pt-1 border-t">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                                        className="text-[11px] text-muted-foreground h-8"
                                    >
                                        {isExpanded ? (
                                            <>
                                                <ChevronUp className="mr-1 h-3.5 w-3.5" /> Sembunyikan Opsi
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="mr-1 h-3.5 w-3.5" /> Lihat Opsi ({q.options?.length || 0}) & Pembahasan
                                            </>
                                        )}
                                    </Button>

                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setActiveQuestion(q);
                                                setIsKatexModalOpen(true);
                                            }}
                                            className="text-[11px] h-8 font-medium"
                                        >
                                            <Calculator className="mr-1 h-3.5 w-3.5 text-primary" /> KaTeX
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setActiveQuestion(q);
                                                setNewTargetStatus(q.status || "APPROVED");
                                                setIsFsmModalOpen(true);
                                            }}
                                            className="text-[11px] h-8 font-medium"
                                        >
                                            FSM <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                        </Button>
                                        <Link href={`/admin/question-bank/${q.id}/edit`}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-[11px] h-8 font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
                                            >
                                                <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setActiveQuestion(q);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="text-[11px] h-8 font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                ) : (
                    <Card className="p-12 text-center text-xs text-muted-foreground">
                        Belum ada soal terdaftar yang sesuai filter.
                    </Card>
                )}
            </div>

            {/* --- DELETE QUESTION CONFIRMATION MODAL --- */}
            <AdminActionModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Hapus Soal"
                description="Tindakan ini tidak dapat dibatalkan. Data soal dan opsi jawaban di database akan dihapus permanen."
                onSubmit={handleDeleteSubmit}
                submitLabel="Hapus Soal Permanen"
            >
                <div className="p-4 rounded-xl border bg-rose-50 border-rose-200 text-rose-900 text-xs space-y-2">
                    <p className="font-bold">Apakah Anda yakin ingin menghapus soal ini?</p>
                    <p className="font-mono bg-rose-100/80 p-2 rounded border border-rose-300">
                        {activeQuestion?.content}
                    </p>
                </div>
            </AdminActionModal>

            {/* --- FSM TRANSITION MODAL --- */}
            <AdminActionModal
                isOpen={isFsmModalOpen}
                onClose={() => setIsFsmModalOpen(false)}
                title="Transisi Status FSM State Machine"
                description={`Ubah status kualifikasi untuk soal Q-${activeQuestion?.id?.substring(0, 8)}`}
                onSubmit={handleFsmTransition}
                submitLabel="Perbarui Status FSM"
            >
                {fsmSuccess ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Status FSM berhasil diperbarui di PostgreSQL DB!
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="p-3 rounded-xl border bg-muted/40 font-mono text-[11px]">
                            Status Saat Ini: <span className="font-bold text-primary">{activeQuestion?.status || "APPROVED"}</span>
                        </div>

                        <div>
                            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Pilih Status Baru</label>
                            <select
                                value={newTargetStatus}
                                onChange={(e) => setNewTargetStatus(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                            >
                                <option value="APPROVED">APPROVED (Telah Disetujui / Validasi)</option>
                                <option value="PUBLISHED">PUBLISHED (Aktif Siap Dikerjakan Siswa CBT)</option>
                                <option value="DRAFT">DRAFT (Dalam Penyuntingan)</option>
                                <option value="ARCHIVED">ARCHIVED (Diarsipkan / Nonaktif)</option>
                            </select>
                        </div>
                    </div>
                )}
            </AdminActionModal>

            {/* --- KATEX PREVIEW MODAL --- */}
            <AdminActionModal
                isOpen={isKatexModalOpen}
                onClose={() => setIsKatexModalOpen(false)}
                title="KaTeX Math Formula Live Preview"
                description="Visualisasi rendering matematika KaTeX untuk soal ini."
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl border bg-muted/40 font-mono text-xs whitespace-pre-wrap">
                        {activeQuestion?.content}
                    </div>

                    <div className="p-4 rounded-xl border bg-primary/5 text-foreground space-y-2">
                        <span className="text-[11px] font-bold text-primary block uppercase tracking-wider">
                            Rendered Math Output
                        </span>
                        <div className="text-sm font-semibold italic text-foreground bg-background p-3 rounded-lg border">
                            {activeQuestion?.content || "No Math Formula"}
                        </div>
                    </div>
                </div>
            </AdminActionModal>
        </div>
    );
}
