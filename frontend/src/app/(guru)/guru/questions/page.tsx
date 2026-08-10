"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { questionService } from "@/services/question.service";
import { academicMasterService } from "@/services/academic-master.service";
import { Plus, Search, Edit, Trash2, AlertCircle } from "lucide-react";

const FALLBACK_SUBJECTS = [
    "Penalaran Matematika",
    "Literasi Bahasa Indonesia",
    "Penalaran Umum",
];

export default function QuestionBankPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        subject_name: "Penalaran Matematika",
        difficulty: "MEDIUM",
        content: "",
        options: ["", "", "", "", ""],
        correct_option: "A",
    });

    const { data: questions = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["guru-questions"],
        queryFn: async () => {
            const res = await questionService.getQuestions();
            return Array.isArray(res) ? res : (res?.items ?? []);
        },
    });

    const { data: subjects = [] } = useQuery({
        queryKey: ["guru-subjects"],
        queryFn: () => academicMasterService.getSubjects(),
    });
    const subjectNames = subjects.length > 0 ? subjects.map((s) => s.name) : FALLBACK_SUBJECTS;

    const createMutation = useMutation({
        mutationFn: () =>
            questionService.createQuestion({
                subject_name: newQuestion.subject_name,
                difficulty: newQuestion.difficulty,
                content: newQuestion.content,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["guru-questions"] });
            setShowAddModal(false);
            setNewQuestion({
                subject_name: "Penalaran Matematika",
                difficulty: "MEDIUM",
                content: "",
                options: ["", "", "", "", ""],
                correct_option: "A",
            });
        },
        onError: () => {
            alert("Gagal menyimpan soal. Coba lagi.");
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate();
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight">Bank Soal & Latihan</h1>
                        <p className="text-sm text-muted-foreground">Kelola koleksi butir soal, tingkat kesulitan, dan opsi jawaban per subtes UTBK.</p>
                    </div>
                    <Button onClick={() => setShowAddModal(true)} className="rounded-xl gap-2 font-semibold shadow-xs">
                        <Plus className="h-4 w-4" /> Buat Soal Baru
                    </Button>
                </div>

                {isError && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Gagal memuat data soal. Periksa koneksi lalu coba lagi.</span>
                        <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                            Coba Lagi
                        </Button>
                    </div>
                )}

                {/* Search */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari konten atau ID soal..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Questions Table List */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-xl" />
                        ))}
                    </div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-10 text-sm text-muted-foreground">
                        Belum ada soal dalam bank soal. Buat soal baru untuk memulai.
                    </div>
                ) : (
                    <Card className="p-4 space-y-3">
                        {questions.map((q) => (
                            <div key={q.id} className="p-4 rounded-xl border border-border bg-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary transition-all">
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-[10px]">{q.subject_name}</Badge>
                                        <Badge
                                            variant={q.difficulty === "HARD" ? "destructive" : q.difficulty === "MEDIUM" ? "default" : "outline"}
                                            className="text-[10px]"
                                        >
                                            {q.difficulty}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">ID: {q.id}</span>
                                    </div>
                                    <p className="text-sm font-medium text-foreground line-clamp-2">{q.content}</p>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-auto">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </Card>
                )}
            </div>

            {/* Modal Add Question */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-border space-y-4">
                        <h3 className="font-heading font-bold text-lg">Tambah Soal Baru</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold">Subtes / Mata Pelajaran</label>
                                <select
                                    value={newQuestion.subject_name}
                                    onChange={(e) => setNewQuestion((p) => ({ ...p, subject_name: e.target.value }))}
                                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                                >
                                    {subjectNames.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold">Tingkat Kesulitan</label>
                                <select
                                    value={newQuestion.difficulty}
                                    onChange={(e) => setNewQuestion((p) => ({ ...p, difficulty: e.target.value }))}
                                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                                >
                                    <option value="EASY">EASY</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="HARD">HARD</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold">Konten Soal</label>
                                <Input
                                    value={newQuestion.content}
                                    onChange={(e) => setNewQuestion((p) => ({ ...p, content: e.target.value }))}
                                    placeholder="Tuliskan soal..."
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl">
                                    Batal
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending} className="rounded-xl font-bold">
                                    {createMutation.isPending ? "Menyimpan..." : "Simpan Soal"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}