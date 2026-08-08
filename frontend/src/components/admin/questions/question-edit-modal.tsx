"use client";

import { ExtendedQuestion, QuestionBlock, QuestionOptionExtended } from "@/types/question-bank";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, ChangeEvent } from "react";
import { questionService } from "@/services/question.service";
import { Plus, Trash2, Save, Image as ImageIcon, FileText, AlertTriangle } from "lucide-react";

interface EditModalProps {
    question: ExtendedQuestion | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function QuestionEditModal({ question, isOpen, onClose, onSuccess }: EditModalProps) {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const [explanation, setExplanation] = useState("");
    const [difficulty, setDifficulty] = useState<string>("MEDIUM");
    const [status, setStatus] = useState<string>("DRAFT");
    const [blocks, setBlocks] = useState<QuestionBlock[]>([]);
    const [options, setOptions] = useState<QuestionOptionExtended[]>([]);
    const [duplicateMatch, setDuplicateMatch] = useState<{ isDuplicate: boolean; code?: string } | null>(null);

    useEffect(() => {
        if (question) {
            setContent(question.content || "");
            setExplanation(question.explanation || "");
            setDifficulty(question.metadata?.difficulty_level || "MEDIUM");
            setStatus(question.status || "DRAFT");
            setBlocks(question.blocks && question.blocks.length > 0 ? [...question.blocks] : [
                { block_order: 1, block_type: "PARAGRAPH", content: question.content || "" }
            ]);
            setOptions(question.options && question.options.length > 0 ? question.options.map(o => ({ ...o })) : [
                { id: "1", label: "A", content: "", is_correct: true, score: 1 },
                { id: "2", label: "B", content: "", is_correct: false, score: 0 },
                { id: "3", label: "C", content: "", is_correct: false, score: 0 },
                { id: "4", label: "D", content: "", is_correct: false, score: 0 },
                { id: "5", label: "E", content: "", is_correct: false, score: 0 },
            ]);
            setDuplicateMatch(null);
        }
    }, [question]);

    // Real-time debounced duplicate check
    useEffect(() => {
        if (!isOpen || !question) return;
        const primaryText = blocks.find(b => b.block_type === "PARAGRAPH")?.content || content;
        if (!primaryText || primaryText.trim().length < 5) {
            setDuplicateMatch(null);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const subjectId = question.classification?.subject_id || "00000000-0000-0000-0000-000000000000";
                const results = await questionService.checkDuplicates({
                    subject_id: subjectId,
                    items: [{
                        id: question.id,
                        content: primaryText,
                        options: options.map(o => ({ label: o.label, content: o.content }))
                    }]
                });

                if (results && results.length > 0 && results[0].is_duplicate && results[0].existing_question_id !== question.id) {
                    setDuplicateMatch({
                        isDuplicate: true,
                        code: results[0].existing_question_code || "QS-DB"
                    });
                } else {
                    setDuplicateMatch(null);
                }
            } catch (err) {
                // Ignore silent duplicate check errors
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [content, blocks, options, question, isOpen]);


    if (!isOpen || !question) return null;

    const handleAddBlock = (type: "PARAGRAPH" | "IMAGE" | "LATEX") => {
        setBlocks([
            ...blocks,
            { block_order: blocks.length + 1, block_type: type, content: "" }
        ]);
    };

    const handleRemoveBlock = (index: number) => {
        const updated = blocks.filter((_, idx) => idx !== index).map((b, idx) => ({
            ...b,
            block_order: idx + 1
        }));
        setBlocks(updated);
    };

    const handleBlockChange = (index: number, key: keyof QuestionBlock, value: any) => {
        const updated = [...blocks];
        updated[index] = { ...updated[index], [key]: value };
        setBlocks(updated);
    };

    const handleOptionChange = (index: number, key: keyof QuestionOptionExtended, value: any) => {
        const updated = [...options];
        updated[index] = { ...updated[index], [key]: value };
        setOptions(updated);
    };

    const handleSetCorrectOption = (index: number) => {
        const updated = options.map((opt, idx) => ({
            ...opt,
            is_correct: idx === index,
            score: idx === index ? (opt.score > 0 ? opt.score : 1) : 0
        }));
        setOptions(updated);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const primaryText = blocks.find(b => b.block_type === "PARAGRAPH")?.content || content;

            const payload: any = {
                subject_id: question.classification?.subject_id || "00000000-0000-0000-0000-000000000000",
                content: primaryText,
                difficulty: difficulty,
                question_type: question.question_type || "SINGLE_CHOICE",
                explanation: explanation,
                status: status,
                options: options.map(o => ({
                    label: o.label,
                    content: o.content,
                    correct: o.is_correct,
                    score: o.score
                })),
                blocks: blocks.map((b, idx) => ({
                    block_order: idx + 1,
                    block_type: b.block_type,
                    content: b.content,
                    asset_id: b.asset_id
                }))
            };

            await questionService.updateQuestion(question.id, payload);
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Gagal memperbarui soal:", err);
            alert("Gagal menyimpan perubahan soal. Silakan periksa jaringan & coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-bold">Edit Butir Soal #{question.question_code}</DialogTitle>
                            <p className="text-xs text-muted-foreground">ID: {question.id}</p>
                        </div>
                        <Badge variant="outline">{question.classification?.subject_name || "Umum"}</Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {duplicateMatch?.isDuplicate && (
                        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-3.5 rounded-xl text-xs font-medium animate-in fade-in slide-in-from-top-1">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <div>
                                <span>Peringatan: Teks soal dan pilihan ini identik dengan soal <strong>{duplicateMatch.code}</strong> yang sudah ada di database.</span>
                            </div>
                        </div>
                    )}

                    {/* Metadata & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Tingkat Kesulitan</label>
                            <select
                                value={difficulty}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setDifficulty(e.target.value)}
                                className="w-full h-10 px-3 border rounded-xl bg-background text-xs"
                            >
                                <option value="EASY">Mudah (EASY)</option>
                                <option value="MEDIUM">Sedang (MEDIUM)</option>
                                <option value="HARD">Sulit (HARD)</option>
                                <option value="EXPERT">Sangat Sulit (EXPERT)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Status Soal</label>
                            <select
                                value={status}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
                                className="w-full h-10 px-3 border rounded-xl bg-background text-xs"
                            >
                                <option value="DRAFT">DRAFT</option>
                                <option value="REVIEW">REVIEW</option>
                                <option value="PUBLISHED">PUBLISHED</option>
                                <option value="ARCHIVED">ARCHIVED</option>
                            </select>
                        </div>
                    </div>

                    {/* Multi-Block Content Editor */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                                <FileText className="h-4 w-4 text-primary" /> Susunan Blok Konten Soal
                            </label>
                            <div className="flex items-center gap-1.5">
                                <Button size="sm" variant="outline" type="button" onClick={() => handleAddBlock("PARAGRAPH")} className="rounded-lg text-xs gap-1">
                                    <Plus className="h-3 w-3" /> Teks
                                </Button>
                                <Button size="sm" variant="outline" type="button" onClick={() => handleAddBlock("IMAGE")} className="rounded-lg text-xs gap-1">
                                    <ImageIcon className="h-3 w-3" /> Gambar
                                </Button>
                                <Button size="sm" variant="outline" type="button" onClick={() => handleAddBlock("LATEX")} className="rounded-lg text-xs gap-1">
                                    <Plus className="h-3 w-3" /> LaTeX
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3 border p-4 rounded-xl bg-card">
                            {blocks.map((block, idx) => (
                                <div key={idx} className="p-3 border rounded-xl bg-muted/20 space-y-2 relative">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <Badge variant="secondary" className="text-[10px]">
                                            Blok #{idx + 1} ({block.block_type})
                                        </Badge>
                                        {blocks.length > 1 && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded-md"
                                                onClick={() => handleRemoveBlock(idx)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>

                                    {block.block_type === "IMAGE" ? (
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="Masukkan URL Gambar (misal: /uploads/soal1.png)"
                                                value={block.content}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleBlockChange(idx, "content", e.target.value)}
                                                className="text-xs rounded-lg"
                                            />
                                            {block.content && (
                                                <div className="p-2 border rounded-lg bg-white inline-block">
                                                    <img src={block.content} alt="Preview" className="max-h-32 object-contain" />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <textarea
                                            rows={2}
                                            placeholder={`Isi materi blok ${block.block_type.toLowerCase()}...`}
                                            value={block.content}
                                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleBlockChange(idx, "content", e.target.value)}
                                            className="w-full p-2 border rounded-lg text-xs font-sans bg-background"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Options Editor */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-foreground">Opsi Jawaban & Kunci</label>
                        <div className="space-y-2">
                            {options.map((opt, idx) => (
                                <div key={idx} className={`p-3 border rounded-xl flex items-center gap-3 ${opt.is_correct ? "border-emerald-500 bg-emerald-500/5" : "bg-card"}`}>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={opt.is_correct ? "default" : "outline"}
                                        className={`w-8 h-8 rounded-lg shrink-0 ${opt.is_correct ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
                                        onClick={() => handleSetCorrectOption(idx)}
                                    >
                                        {opt.label}
                                    </Button>

                                    <Input
                                        value={opt.content}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleOptionChange(idx, "content", e.target.value)}
                                        placeholder={`Teks Opsi ${opt.label}`}
                                        className="text-xs flex-1 rounded-lg"
                                    />

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] text-muted-foreground">Skor:</span>
                                        <Input
                                            type="number"
                                            value={opt.score}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleOptionChange(idx, "score", parseFloat(e.target.value) || 0)}
                                            className="w-16 h-8 text-xs text-center rounded-lg"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">Pembahasan Soal</label>
                        <textarea
                            rows={3}
                            placeholder="Tuliskan langkah penyelesaian / pembahasan resmi soal..."
                            value={explanation}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setExplanation(e.target.value)}
                            className="w-full p-2 border rounded-xl text-xs bg-background"
                        />
                    </div>
                </div>

                <DialogFooter className="border-t pt-4 flex items-center justify-between">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
                        Batal
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="rounded-xl bg-primary gap-1.5">
                        <Save className="h-4 w-4" />
                        {loading ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
