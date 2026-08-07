"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParsedQuestionItem } from "@/types/question-bank";
import { Eye, Monitor, Smartphone, CheckCircle2, Lightbulb, Clock, Layers } from "lucide-react";

interface QuestionPreviewDialogProps {
    item: ParsedQuestionItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export function QuestionPreviewDialog({ item, isOpen, onClose }: QuestionPreviewDialogProps) {
    if (!item) return null;

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showSolution, setShowSolution] = useState(true);
    const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[92vw] max-w-6xl w-[92vw] max-h-[92vh] overflow-y-auto rounded-2xl border-border p-6 shadow-2xl">
                <DialogHeader className="space-y-2 pb-3 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                <Eye className="h-4 w-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold font-heading">
                                    Pratinjau Tampilan Siswa (CBT Engine)
                                </DialogTitle>
                                <p className="text-xs text-muted-foreground">
                                    Simulasi real-time bagaimana soal #{item.question_number} ini akan tampil di layar Ujian CBT siswa.
                                </p>
                            </div>
                        </div>

                        {/* Device View Mode Switcher */}
                        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border border-border">
                            <button
                                type="button"
                                onClick={() => setViewMode("desktop")}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${viewMode === "desktop"
                                    ? "bg-background text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Monitor className="h-3.5 w-3.5" /> Desktop
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("mobile")}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${viewMode === "mobile"
                                    ? "bg-background text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Smartphone className="h-3.5 w-3.5" /> Mobile
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Admin Toggle Controls */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/80 text-xs">
                        <div className="flex items-center gap-2 font-medium">
                            <Layers className="h-4 w-4 text-primary" />
                            <span>Kontrol Admin:</span>
                        </div>
                        <Button
                            variant={showSolution ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowSolution(!showSolution)}
                            className="rounded-xl text-xs gap-1.5"
                        >
                            <Lightbulb className="h-3.5 w-3.5" />
                            {showSolution ? "Sembunyikan Pembahasan & Kunci" : "Tampilkan Kunci & Pembahasan"}
                        </Button>
                    </div>

                    {/* Student Screen Frame Simulator */}
                    <div className="flex justify-center bg-slate-900/5 dark:bg-slate-950 p-4 rounded-2xl border border-border">
                        <div
                            className={`bg-background border border-border rounded-2xl p-6 shadow-lg transition-all space-y-5 ${viewMode === "mobile" ? "max-w-xs w-full" : "max-w-4xl w-full"
                                }`}
                        >
                            {/* Exam Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
                                        Soal #{item.question_number}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px]">
                                        {item.detected_subject || "Penalaran Matematika"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                    <Clock className="h-3.5 w-3.5" /> Bobot: {item.weight || 1} Poin
                                </div>
                            </div>

                            {/* Question Badges */}
                            <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                    {item.question_type || "SINGLE_CHOICE"}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                    Kesulitan: {item.difficulty || "MEDIUM"}
                                </Badge>
                                {item.bloom_level && (
                                    <Badge variant="outline" className="text-[10px]">
                                        {item.bloom_level}
                                    </Badge>
                                )}
                            </div>

                            {/* Question Text */}
                            <div className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap">
                                {item.question_text || "Teks soal belum diisi."}
                            </div>

                            {/* Options List */}
                            <div className="space-y-2.5 pt-2">
                                {item.question_type === "TRUE_FALSE" ? (
                                    <div className="space-y-2">
                                        <span className="text-xs text-emerald-600 font-semibold block bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                                            💡 Tipe Soal Benar / Salah (Matrix Tabel Pernyataan)
                                        </span>
                                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead className="bg-muted/70 text-foreground font-bold border-b border-border">
                                                    <tr>
                                                        <th className="p-3 w-12 text-center">Opsi</th>
                                                        <th className="p-3">Pernyataan</th>
                                                        <th className="p-3 w-28 text-center">Benar</th>
                                                        <th className="p-3 w-28 text-center">Salah</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/60">
                                                    {item.options.map((opt) => {
                                                        const isCorrectBenar = opt.is_answer || item.correct_answer?.includes("B") || item.correct_answer?.includes("BENAR");
                                                        const isCorrectSalah = !isCorrectBenar;

                                                        return (
                                                            <tr key={opt.label} className="hover:bg-muted/30 transition-colors">
                                                                <td className="p-3 text-center align-middle font-bold">
                                                                    <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center font-mono text-xs">
                                                                        {opt.label}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 align-middle text-foreground leading-relaxed text-xs">
                                                                    {opt.text}
                                                                </td>
                                                                <td className="p-2 text-center align-middle">
                                                                    <div
                                                                        className={`py-2 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1 ${showSolution && isCorrectBenar
                                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                                            : "bg-muted/30 text-muted-foreground border-border"
                                                                            }`}
                                                                    >
                                                                        <CheckCircle2 className="h-3 w-3" /> Benar
                                                                    </div>
                                                                </td>
                                                                <td className="p-2 text-center align-middle">
                                                                    <div
                                                                        className={`py-2 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1 ${showSolution && isCorrectSalah
                                                                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                                                            : "bg-muted/30 text-muted-foreground border-border"
                                                                            }`}
                                                                    >
                                                                        <CheckCircle2 className="h-3 w-3" /> Salah
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    item.options.map((opt) => {
                                        const isSelected = selectedOption === opt.label;
                                        const isCorrect = opt.is_answer || opt.label === item.correct_answer;

                                        return (
                                            <button
                                                key={opt.label}
                                                type="button"
                                                onClick={() => setSelectedOption(opt.label)}
                                                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${showSolution && isCorrect
                                                    ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10 font-medium"
                                                    : isSelected
                                                        ? "border-primary ring-2 ring-primary/20 bg-primary/5 font-medium"
                                                        : "border-border hover:bg-muted/40"
                                                    }`}
                                            >
                                                <span
                                                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${showSolution && isCorrect
                                                        ? "bg-emerald-500 text-white"
                                                        : isSelected
                                                            ? "bg-primary text-white"
                                                            : "bg-muted text-muted-foreground"
                                                        }`}
                                                >
                                                    {opt.label}
                                                </span>
                                                <span className="mt-0.5 text-foreground leading-snug flex-1">
                                                    {opt.text || `Teks pilihan ${opt.label}`}
                                                </span>
                                                {showSolution && isCorrect && (
                                                    <Badge className="bg-emerald-500 text-white text-[10px] shrink-0 gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Kunci Jawaban
                                                    </Badge>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Solution / Explanation Box (Admin Preview) */}
                            {showSolution && (
                                <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                                        <Lightbulb className="h-4 w-4" />
                                        <span>Pembahasan &amp; Solusi Kunci</span>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {item.explanation || "Belum ada pembahasan yang dicantumkan untuk soal ini."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
