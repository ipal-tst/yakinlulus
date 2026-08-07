"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { academicMasterService } from "@/services/academic-master.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ParsedQuestionItem, DifficultyLevel, QuestionType } from "@/types/question-bank";
import { Plus, Trash2, CheckCircle2, Sparkles } from "lucide-react";

interface QuestionEditDialogProps {
    item: ParsedQuestionItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedItem: ParsedQuestionItem) => void;
}

export function QuestionEditDialog({ item, isOpen, onClose, onSave }: QuestionEditDialogProps) {
    if (!item) return null;

    const [questionText, setQuestionText] = useState(item.question_text || "");
    const [questionType, setQuestionType] = useState<QuestionType>(item.question_type || "SINGLE_CHOICE");
    const [difficulty, setDifficulty] = useState<DifficultyLevel>(item.difficulty || "MEDIUM");
    const [bloomLevel, setBloomLevel] = useState(item.bloom_level || "C2 (Memahami)");
    const [weight, setWeight] = useState(item.weight || 1.0);
    const [subject, setSubject] = useState(item.detected_subject || "Penalaran Matematika");
    const [topic, setTopic] = useState(item.detected_topic || "");
    const [explanation, setExplanation] = useState(item.explanation || "");
    const [options, setOptions] = useState(
        item.options && item.options.length > 0
            ? item.options
            : [
                { label: "A", text: "", is_answer: true },
                { label: "B", text: "", is_answer: false },
                { label: "C", text: "", is_answer: false },
                { label: "D", text: "", is_answer: false },
                { label: "E", text: "", is_answer: false },
            ]
    );

    const handleOptionTextChange = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index].text = text;
        setOptions(newOptions);
    };

    const handleSelectCorrectAnswer = (index: number) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            is_answer: i === index,
        }));
        setOptions(newOptions);
    };

    const handleAddOption = () => {
        const labels = ["A", "B", "C", "D", "E", "F", "G"];
        const nextLabel = labels[options.length] || `Opsi ${options.length + 1}`;
        setOptions([...options, { label: nextLabel, text: "", is_answer: false }]);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length <= 2) return;
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const handleSave = () => {
        const selectedCorrectOpt = options.find((o) => o.is_answer);
        const correctAnswerLabel = selectedCorrectOpt ? selectedCorrectOpt.label : "";

        // Auto-revalidate item status
        const validationMessages: string[] = [];
        let status: "VALID" | "WARNING" | "ERROR" = "VALID";

        if (!questionText.trim()) {
            status = "ERROR";
            validationMessages.push("Narasi teks soal tidak boleh kosong.");
        }
        if (options.some((o) => !o.text.trim())) {
            status = "WARNING";
            validationMessages.push("Ada opsi jawaban yang masih kosong.");
        }
        if (!correctAnswerLabel) {
            status = "ERROR";
            validationMessages.push("Kunci jawaban belum ditentukan.");
        }

        const updatedItem: ParsedQuestionItem = {
            ...item,
            question_text: questionText,
            question_type: questionType,
            difficulty: difficulty,
            bloom_level: bloomLevel,
            weight: Number(weight),
            detected_subject: subject,
            detected_topic: topic,
            options,
            correct_answer: correctAnswerLabel,
            explanation,
            validation_status: status,
            validation_messages: validationMessages,
            confidence_score: status === "VALID" ? 1.0 : status === "WARNING" ? 0.85 : 0.4,
        };

        onSave(updatedItem);
        onClose();
    };

    // Dynamic Subjects from Academic Master Database
    const { data: dbSubjects = [] } = useQuery({
        queryKey: ["academic-master-subjects-dialog"],
        queryFn: async () => {
            try {
                const res = await academicMasterService.getSubjects();
                return Array.isArray(res) ? res : [];
            } catch {
                return [];
            }
        },
    });

    const defaultSubjectNames = [
        "Penalaran Matematika",
        "Literasi Bahasa Indonesia",
        "Literasi Bahasa Inggris",
        "Penalaran Umum",
        "Fisika",
        "Kimia",
        "Biologi",
    ];

    const rawSubjects = dbSubjects.length > 0
        ? dbSubjects.map((s) => s.name)
        : defaultSubjectNames;

    const availableSubjects = Array.from(new Set(rawSubjects.filter(Boolean)));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl w-[92vw] max-h-[92vh] overflow-y-auto rounded-2xl border-border p-6 shadow-2xl">
                <DialogHeader className="space-y-1 pb-3 border-b border-border">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-bold font-heading flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Edit Soal #{item.question_number}
                        </DialogTitle>
                        <Badge variant="outline" className="font-mono text-xs">
                            ID: {item.id}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Kustomisasi draf soal yang diekstraksi AI sebelum dimasukkan ke dalam database.
                    </p>
                </DialogHeader>

                <div className="space-y-5 py-4 text-xs">
                    {/* Metadata Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Mata Pelajaran</label>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full h-9 rounded-xl border border-input bg-background px-2.5 font-medium text-xs"
                            >
                                {availableSubjects.map((subName) => (
                                    <option key={subName} value={subName}>
                                        {subName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Tipe Soal</label>
                            <select
                                value={questionType}
                                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                                className="w-full h-9 rounded-xl border border-input bg-background px-2.5 font-medium text-xs"
                            >
                                <option value="SINGLE_CHOICE">Pilihan Ganda (Single)</option>
                                <option value="MULTIPLE_CHOICE">Pilihan Ganda Kompleks</option>
                                <option value="TRUE_FALSE">Benar / Salah</option>
                                <option value="SHORT_ANSWER">Isian Singkat</option>
                                <option value="ESSAY">Uraian / Essay</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Tingkat Kesulitan</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                                className="w-full h-9 rounded-xl border border-input bg-background px-2.5 font-medium text-xs"
                            >
                                <option value="EASY">Mudah (EASY)</option>
                                <option value="MEDIUM">Sedang (MEDIUM)</option>
                                <option value="HARD">Sulit (HARD)</option>
                                <option value="EXPERT">HOTS / Expert</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Taksonomi Bloom</label>
                            <select
                                value={bloomLevel}
                                onChange={(e) => setBloomLevel(e.target.value)}
                                className="w-full h-9 rounded-xl border border-input bg-background px-2.5 font-medium text-xs"
                            >
                                <option value="C1 (Mengingat)">C1 (Mengingat)</option>
                                <option value="C2 (Memahami)">C2 (Memahami)</option>
                                <option value="C3 (Menerapkan)">C3 (Menerapkan)</option>
                                <option value="C4 (Menganalisis)">C4 (Menganalisis)</option>
                                <option value="C5 (Menilai)">C5 (Menilai)</option>
                                <option value="C6 (Menciptakan)">C6 (Menciptakan)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-foreground">Bobot Nilai</label>
                            <Input
                                type="number"
                                step="0.5"
                                value={weight}
                                onChange={(e) => setWeight(parseFloat(e.target.value) || 1.0)}
                                className="h-9 text-xs rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Question Text Narrative */}
                    <div className="space-y-1.5">
                        <label className="font-bold text-foreground flex items-center justify-between">
                            <span>Teks Narasi Soal</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                                Mendukung sintaks formula LaTeX (contoh: $f(x) = x^2$)
                            </span>
                        </label>
                        <textarea
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            rows={4}
                            className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Tuliskan teks pertanyaan soal..."
                        />
                    </div>

                    {/* Options Editor */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="font-bold text-foreground flex items-center gap-1.5">
                                Opsi Jawaban &amp; Penentu Kunci
                            </label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddOption}
                                className="h-7 text-[11px] rounded-lg gap-1 border-border"
                            >
                                <Plus className="h-3 w-3" /> Tambah Opsi
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {options.map((opt, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${opt.is_answer
                                        ? "border-emerald-500/50 bg-emerald-500/5"
                                        : "border-border/60 bg-muted/20"
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleSelectCorrectAnswer(idx)}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-colors ${opt.is_answer
                                            ? "bg-emerald-500 text-white"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                            }`}
                                        title="Klik untuk memilih kunci jawaban benar"
                                    >
                                        {opt.label}
                                    </button>

                                    <Input
                                        value={opt.text}
                                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                                        placeholder={`Teks pilihan ${opt.label}...`}
                                        className="h-8 text-xs rounded-lg flex-1 bg-background"
                                    />

                                    {opt.is_answer && (
                                        <Badge className="bg-emerald-500 text-white text-[10px] h-6">
                                            Kunci Jawaban
                                        </Badge>
                                    )}

                                    {options.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveOption(idx)}
                                            className="h-7 w-7 text-muted-foreground hover:text-rose-500 rounded-lg"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Explanation / Solution Editor */}
                    <div className="space-y-1.5 pt-2">
                        <label className="font-bold text-foreground">Pembahasan / Kunci Solusi</label>
                        <textarea
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Tuliskan pembahasan atau langkah penyelesaian soal..."
                        />
                    </div>
                </div>

                <DialogFooter className="border-t border-border pt-3 gap-2">
                    <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
                        Batal
                    </Button>
                    <Button onClick={handleSave} className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground">
                        <CheckCircle2 className="h-4 w-4" /> Simpan Perubahan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
