"use client";

import { ExtendedQuestion } from "@/types/question-bank";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    X,
    CheckCircle2,
    Copy,
    Clock,
    Flame,
    Calculator,
    HelpCircle,
    BookOpen,
    Layers,
    BarChart3,
    ShieldAlert,
} from "lucide-react";
import { useState } from "react";

interface DrawerProps {
    question: ExtendedQuestion | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: (id: string, action: "publish" | "unpublish" | "archive") => void;
}

export function QuestionDetailDrawer({ question, isOpen, onClose, onStatusChange }: DrawerProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !question) return null;

    const handleCopyCode = () => {
        navigator.clipboard.writeText(question.question_code || question.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
            <div className="bg-card w-full max-w-2xl h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-200">
                {/* Drawer Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-card">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs font-semibold">
                                {question.question_code}
                            </Badge>
                            <Badge
                                variant={
                                    question.status === "PUBLISHED"
                                        ? "default"
                                        : question.status === "DRAFT"
                                            ? "secondary"
                                            : "outline"
                                }
                            >
                                {question.status}
                            </Badge>
                            {question.metadata.is_hots && (
                                <Badge variant="destructive" className="gap-1 text-[10px]">
                                    <Flame className="h-3 w-3" /> HOTS
                                </Badge>
                            )}
                        </div>
                        <h2 className="text-lg font-bold font-heading">Detail Butir Soal</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyCode}
                            className="rounded-xl gap-1.5 text-xs font-semibold"
                        >
                            <Copy className="h-3.5 w-3.5" />
                            {copied ? "Tersalin!" : "Salin Kode"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-xl hover:bg-accent"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Drawer Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Classification Metadata */}
                    <Card className="p-4 bg-muted/30 border-border/70 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                            <BookOpen className="h-4 w-4" /> Klasifikasi Master Akademik
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                                <span className="text-muted-foreground block text-[10px]">Mata Pelajaran:</span>
                                <span className="font-semibold text-foreground">
                                    {question.classification.subject_name}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px]">Jenjang & Kelas:</span>
                                <span className="font-semibold text-foreground">
                                    {question.classification.level_name} ({question.classification.grade_name})
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px]">Bab:</span>
                                <span className="font-semibold text-foreground">
                                    {question.classification.chapter_name || "-"}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px]">Topik:</span>
                                <span className="font-semibold text-foreground">
                                    {question.classification.topic_name || "-"}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px]">Capaian / Kompetensi:</span>
                                <span className="font-semibold text-foreground">
                                    {question.classification.competency_name || "-"}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px]">Kurikulum:</span>
                                <span className="font-semibold text-foreground">
                                    {question.classification.curriculum_name || "Kurikulum Merdeka"}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Question Content / Blocks */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-primary" /> Konten Utama Soal
                        </h3>
                        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-3">
                            {(!question.blocks || question.blocks.length <= 1) && question.content && (
                                <p className="text-sm font-medium leading-relaxed whitespace-pre-line text-foreground">
                                    {question.content}
                                </p>
                            )}

                            {question.blocks && question.blocks.length > 0 && (
                                <div className="space-y-3">
                                    {question.blocks.map((block, idx) => (
                                        <div key={idx} className="p-3 rounded-xl bg-muted/40 text-xs font-mono border border-border/40">
                                            <span className="text-[10px] text-primary font-bold uppercase block mb-1">
                                                Blok #{block.block_order ?? idx + 1} ({block.block_type})
                                            </span>
                                            {block.block_type === "IMAGE" || block.block_type === "PICTURE" || block.block_type === "IMG" ? (
                                                <div className="py-1 space-y-1">
                                                    <img
                                                        src={block.content}
                                                        alt={`Gambar Soal Blok #${block.block_order ?? idx + 1}`}
                                                        className="max-h-72 w-auto max-w-full object-contain rounded-xl border border-border bg-white p-2 shadow-2xs"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).alt = "Gambar tidak dapat dimuat (" + block.content + ")";
                                                        }}
                                                    />
                                                    <span className="text-[10px] text-muted-foreground block truncate font-mono">URL: {block.content}</span>
                                                </div>
                                            ) : block.block_type === "LATEX" ? (
                                                <code className="text-emerald-600 dark:text-emerald-400 bg-background px-2 py-1 rounded">
                                                    {block.content}
                                                </code>
                                            ) : (
                                                <p className="whitespace-pre-line text-foreground font-sans text-sm leading-relaxed">{block.content}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <HelpCircle className="h-4 w-4 text-primary" /> Opsi Jawaban & Skor
                        </h3>
                        <div className="space-y-2">
                            {question.options.map((opt) => (
                                <div
                                    key={opt.id}
                                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${opt.is_correct
                                        ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"
                                        : "border-border bg-card"
                                        }`}
                                >
                                    <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${opt.is_correct
                                            ? "bg-emerald-500 text-white"
                                            : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {opt.label}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium text-foreground">{opt.content}</p>
                                        {opt.explanation && (
                                            <p className="text-xs text-muted-foreground italic">
                                                Catatan opsi: {opt.explanation}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-right shrink-0">
                                        {opt.is_correct ? (
                                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 text-[10px]">
                                                <CheckCircle2 className="h-3 w-3" /> Kunci (Skor: {opt.score})
                                            </Badge>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground">Skor: {opt.score}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pembahasan / Solution Steps */}
                    {question.explanation && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Pembahasan Resmi
                            </h3>
                            <Card className="p-4 bg-emerald-500/5 border-emerald-500/20 rounded-2xl space-y-2 text-xs leading-relaxed">
                                <p className="text-foreground font-medium whitespace-pre-line">{question.explanation}</p>
                            </Card>
                        </div>
                    )}

                    {/* Cognitive & Physical Attributes */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <Card className="p-3 bg-card border-border/80 rounded-xl space-y-1">
                            <span className="text-[10px] text-muted-foreground">Kesulitan</span>
                            <p className="font-bold">{question.metadata.difficulty_level}</p>
                        </Card>
                        <Card className="p-3 bg-card border-border/80 rounded-xl space-y-1">
                            <span className="text-[10px] text-muted-foreground">Taksonomi Bloom</span>
                            <p className="font-bold">{question.metadata.blooms_level}</p>
                        </Card>
                        <Card className="p-3 bg-card border-border/80 rounded-xl space-y-1">
                            <span className="text-[10px] text-muted-foreground">Estimasi Waktu</span>
                            <p className="font-bold flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                {question.metadata.estimated_time_seconds} detik
                            </p>
                        </Card>
                        <Card className="p-3 bg-card border-border/80 rounded-xl space-y-1">
                            <span className="text-[10px] text-muted-foreground">Kalkulator Allowed</span>
                            <p className="font-bold flex items-center gap-1">
                                <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                                {question.metadata.is_calculator_allowed ? "Ya" : "Tidak"}
                            </p>
                        </Card>
                    </div>

                    {/* IRT Statistics (if available) */}
                    {question.statistics && (
                        <Card className="p-4 bg-card border-border rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                <BarChart3 className="h-4 w-4" /> Statistik Parameter IRT & Penggunaan
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div>
                                    <span className="text-[10px] text-muted-foreground">Total Dijawab:</span>
                                    <p className="font-semibold">{question.statistics.total_answers} siswa</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground">Akurasi:</span>
                                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {question.statistics.accuracy_percentage}%
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground">Daya Beda (a):</span>
                                    <p className="font-semibold">{question.statistics.parameter_a || 1.45}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground">Tingkat Kesukaran (b):</span>
                                    <p className="font-semibold">{question.statistics.parameter_b || 0.82}</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Versi: v{question.version_no} (Dibuat oleh {question.author_name || "Admin"})</span>
                    <div className="flex items-center gap-2">
                        {onStatusChange && (
                            <>
                                {question.status !== "PUBLISHED" && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                        onClick={() => onStatusChange(question.id, "publish")}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Setujui & Publikasikan
                                    </Button>
                                )}
                                {question.status === "PUBLISHED" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl gap-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                                        onClick={() => onStatusChange(question.id, "unpublish")}
                                    >
                                        Kembalikan ke Draft
                                    </Button>
                                )}
                                {question.status !== "ARCHIVED" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl gap-1 text-slate-500 border-border hover:bg-accent"
                                        onClick={() => onStatusChange(question.id, "archive")}
                                    >
                                        Arsipkan
                                    </Button>
                                )}
                            </>
                        )}
                        <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                            Tutup
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
