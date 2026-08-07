"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { questionService } from "@/services/question.service";
import { QuestionItem } from "@/types";
import { Plus, Search, HelpCircle, Edit, Trash2, CheckCircle } from "lucide-react";

export default function QuestionBankPage() {
    const [questions, setQuestions] = useState<QuestionItem[]>([]);
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        subject_name: "Penalaran Matematika",
        difficulty: "MEDIUM",
        content: "",
        options: ["", "", "", "", ""],
        correct_option: "A",
    });

    useEffect(() => {
        async function load() {
            try {
                const res = await questionService.getQuestions();
                if (Array.isArray(res)) setQuestions(res);
            } catch {
                setQuestions([
                    {
                        id: "q-101",
                        subject_name: "Penalaran Matematika",
                        difficulty: "HARD",
                        content: "Jika 3x + 2y = 18 dan x - y = 1, berapakah nilai x² + y²?",
                        created_at: "2026-03-01",
                        author_id: "guru-1",
                    },
                    {
                        id: "q-102",
                        subject_name: "Literasi Bahasa Indonesia",
                        difficulty: "MEDIUM",
                        content: "Tentukan ide pokok dari paragraf kedua pada wacana berikut...",
                        created_at: "2026-02-28",
                        author_id: "guru-1",
                    },
                    {
                        id: "q-103",
                        subject_name: "Penalaran Umum",
                        difficulty: "EASY",
                        content: "Semua A adalah B. Semua B adalah C. Manakah kesimpulan yang tepat?",
                        created_at: "2026-02-25",
                        author_id: "guru-1",
                    },
                ]);
            }
        }
        load();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const created = await questionService.createQuestion({
                subject_name: newQuestion.subject_name,
                difficulty: newQuestion.difficulty as any,
                content: newQuestion.content,
            });
            setQuestions((prev) => [created, ...prev]);
        } catch {
            setQuestions((prev) => [
                {
                    id: `q-${Date.now()}`,
                    subject_name: newQuestion.subject_name,
                    difficulty: newQuestion.difficulty as any,
                    content: newQuestion.content,
                    created_at: new Date().toISOString().split("T")[0],
                    author_id: "guru-1",
                },
                ...prev,
            ]);
        }
        setShowAddModal(false);
        setNewQuestion({
            subject_name: "Penalaran Matematika",
            difficulty: "MEDIUM",
            content: "",
            options: ["", "", "", "", ""],
            correct_option: "A",
        });
    };

    return (
        <AppShell>
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
                                    <option value="Penalaran Matematika">Penalaran Matematika</option>
                                    <option value="Literasi Bahasa Indonesia">Literasi Bahasa Indonesia</option>
                                    <option value="Penalaran Umum">Penalaran Umum</option>
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
                                <Button type="submit" className="rounded-xl font-bold">
                                    Simpan Soal
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
