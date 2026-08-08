// frontend/src/components/admin/exams/QuestionPoolPickerModal.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { questionService } from "@/services/question.service";
import { academicMasterService } from "@/services/academic-master.service";
import { QuestionItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Filter,
    CheckCircle2,
    X,
    Database,
    Layers,
    BookOpen,
    Zap,
    CheckSquare,
    Square,
    Loader2,
    Sliders,
} from "lucide-react";

interface QuestionPoolPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectQuestions: (selectedQuestionIds: string[]) => void;
    initialSelectedIds: string[];
    subtestName: string;
    defaultSubjectId?: string;
}

export function QuestionPoolPickerModal({
    isOpen,
    onClose,
    onSelectQuestions,
    initialSelectedIds,
    subtestName,
    defaultSubjectId,
}: QuestionPoolPickerModalProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds || []);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(defaultSubjectId || "");
    const [selectedChapterId, setSelectedChapterId] = useState<string>("");
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
    const [pageSize, setPageSize] = useState<number>(100);

    // Sync selectedIds whenever modal opens or initialSelectedIds change
    useEffect(() => {
        if (isOpen) {
            setSelectedIds(initialSelectedIds || []);
        }
    }, [isOpen, initialSelectedIds]);

    // Fetch Master Subjects
    const { data: dbSubjects = [] } = useQuery({
        queryKey: ["pool-picker-subjects"],
        queryFn: async () => {
            try {
                const res = await academicMasterService.getSubjects();
                return Array.isArray(res) ? res : [];
            } catch {
                return [];
            }
        },
        enabled: isOpen,
    });

    // Fetch Master Chapters
    const { data: dbChapters = [] } = useQuery({
        queryKey: ["pool-picker-chapters", selectedSubjectId],
        queryFn: async () => {
            if (!selectedSubjectId) return [];
            try {
                const res = await academicMasterService.getChapters(selectedSubjectId);
                return Array.isArray(res) ? res : [];
            } catch {
                return [];
            }
        },
        enabled: isOpen && !!selectedSubjectId,
    });

    // Fetch Questions from Question Bank
    const { data: rawQuestions, isLoading } = useQuery({
        queryKey: ["pool-picker-questions", pageSize],
        queryFn: async () => {
            try {
                const res = await questionService.getQuestions({ limit: pageSize });
                if (res && "items" in res && Array.isArray(res.items)) {
                    return res.items;
                }
                if (Array.isArray(res)) {
                    return res;
                }
                return [];
            } catch {
                return [];
            }
        },
        enabled: isOpen,
    });

    const questionList: QuestionItem[] = rawQuestions || [];

    // Filter Logic
    const filteredQuestions = useMemo(() => {
        return questionList.filter((q) => {
            const matchesSearch =
                !searchQuery ||
                (q.content && q.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (q.code && q.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (q.subject_name && q.subject_name.toLowerCase().includes(searchQuery.toLowerCase()));

            const selectedSubjObj = dbSubjects.find((s) => s.id === selectedSubjectId);
            const matchesSubject =
                !selectedSubjectId ||
                (selectedSubjObj && q.subject_name?.toLowerCase() === selectedSubjObj.name?.toLowerCase());

            const matchesDifficulty =
                selectedDifficulty === "ALL" || q.difficulty === selectedDifficulty;

            return matchesSearch && matchesSubject && matchesDifficulty;
        });
    }, [questionList, searchQuery, selectedSubjectId, selectedDifficulty, dbSubjects]);

    if (!isOpen) return null;

    const handleToggleQuestion = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleSelectAllFiltered = () => {
        const filteredIds = filteredQuestions.map((q) => q.id);
        const allSelected = filteredIds.every((id) => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
        } else {
            const combined = Array.from(new Set([...selectedIds, ...filteredIds]));
            setSelectedIds(combined);
        }
    };

    const handleSaveSelection = () => {
        onSelectQuestions(selectedIds);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5">
            <div className="bg-card border border-border rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans animate-in fade-in duration-200">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                            <Database className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-heading font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                                Visual Question Pool Picker
                                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary font-bold">
                                    {subtestName}
                                </Badge>
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Pilih butir soal secara visual dari Bank Soal untuk dimasukkan ke dalam Pool Subtes.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-xl text-muted-foreground hover:text-foreground h-9 w-9"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <div className="p-4 border-b border-border bg-card/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari konten soal, kode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs rounded-xl bg-background"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                        <div className="flex items-center gap-1 text-muted-foreground shrink-0 font-medium">
                            <Filter className="h-3.5 w-3.5" /> Filter:
                        </div>

                        {/* Subject Filter */}
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => {
                                setSelectedSubjectId(e.target.value);
                                setSelectedChapterId("");
                            }}
                            className="h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                        >
                            <option value="">Semua Mapel</option>
                            {dbSubjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        {/* Chapter Filter */}
                        {selectedSubjectId && dbChapters.length > 0 && (
                            <select
                                value={selectedChapterId}
                                onChange={(e) => setSelectedChapterId(e.target.value)}
                                className="h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                            >
                                <option value="">Semua Bab</option>
                                {dbChapters.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Difficulty Filter */}
                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                        >
                            <option value="ALL">Semua Kesulitan</option>
                            <option value="EASY">EASY (Mudah)</option>
                            <option value="MEDIUM">MEDIUM (Sedang)</option>
                            <option value="HARD">HARD (Sulit)</option>
                            <option value="HOTS">HOTS</option>
                        </select>

                        {/* Limit Option */}
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="h-9 rounded-xl border border-input bg-background px-2.5 font-mono text-xs focus:outline-hidden"
                        >
                            <option value={50}>50 Soal</option>
                            <option value={100}>100 Soal</option>
                            <option value={500}>500 Soal</option>
                            <option value={1000}>1000 Soal</option>
                        </select>
                    </div>
                </div>

                {/* Bulk Controls & Selected Stats */}
                <div className="px-5 py-2.5 bg-primary/5 border-b border-border flex items-center justify-between text-xs flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="flex items-center gap-2 font-semibold text-primary hover:underline cursor-pointer"
                    >
                        {filteredQuestions.length > 0 &&
                            filteredQuestions.every((q) => selectedIds.includes(q.id)) ? (
                            <CheckSquare className="h-4 w-4" />
                        ) : (
                            <Square className="h-4 w-4" />
                        )}
                        Pilih Semua Soal Terfilter ({filteredQuestions.length})
                    </button>

                    <div className="flex items-center gap-2 font-medium text-foreground">
                        <span>Total Terpilih ke Pool:</span>
                        <Badge variant="default" className="font-mono text-xs bg-primary text-primary-foreground">
                            {selectedIds.length} Soal Terdaftar
                        </Badge>
                    </div>
                </div>

                {/* Question Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[300px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12 text-muted-foreground font-medium text-xs">
                            <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" /> Memuat naskah bank soal...
                        </div>
                    ) : filteredQuestions.length === 0 ? (
                        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card space-y-2">
                            <Database className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                            <p className="text-xs font-semibold text-foreground">Tidak ada soal ditemukan</p>
                            <p className="text-[11px] text-muted-foreground">
                                Coba ubah kata kunci atau filter mata pelajaran / tingkat kesulitan.
                            </p>
                        </div>
                    ) : (
                        filteredQuestions.map((q, idx) => {
                            const isChecked = selectedIds.includes(q.id);
                            return (
                                <div
                                    key={q.id}
                                    onClick={() => handleToggleQuestion(q.id)}
                                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${isChecked ? "border-primary/60 bg-primary/5 shadow-2xs" : "border-border bg-card hover:border-primary/30"}`}
                                >
                                    <div className="pt-0.5 shrink-0 text-primary">
                                        {isChecked ? (
                                            <CheckSquare className="h-4 w-4 text-primary" />
                                        ) : (
                                            <Square className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-1.5 min-w-0">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold text-[11px] text-muted-foreground">
                                                    #{idx + 1}
                                                </span>
                                                {q.code && (
                                                    <Badge variant="outline" className="text-[10px] font-mono">
                                                        {q.code}
                                                    </Badge>
                                                )}
                                                {q.subject_name && (
                                                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                                                        {q.subject_name}
                                                    </Badge>
                                                )}
                                                {q.grade_level && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {q.grade_level}
                                                    </Badge>
                                                )}
                                            </div>

                                            {q.difficulty && (
                                                <Badge
                                                    variant={q.difficulty === "HOTS" ? "default" : "outline"}
                                                    className="text-[10px] font-bold"
                                                >
                                                    {q.difficulty}
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="text-foreground leading-relaxed line-clamp-2 font-medium">
                                            {q.content || "Naskah soal tanpa teks..."}
                                        </p>

                                        {q.options && q.options.length > 0 && (
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                                <span>{q.options.length} Pilihan Jawaban</span>
                                                {q.score && <span>• Skor: {q.score}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="rounded-xl text-xs"
                    >
                        Batal
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                            {selectedIds.length} Soal terpilih
                        </span>
                        <Button
                            size="sm"
                            onClick={handleSaveExamSelection}
                            className="rounded-xl gap-1.5 font-semibold text-xs h-9 shadow-xs"
                        >
                            <CheckCircle2 className="h-4 w-4" /> Masukkan ke Pool Subtes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    function handleSaveExamSelection() {
        handleSaveSelection();
    }
}
