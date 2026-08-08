"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Edit3, CheckCircle2, Loader2 } from "lucide-react";
import { academicMasterService } from "@/services/academic-master.service";
import type { Subject, Grade } from "@/types/academic-master";

interface QuestionBulkModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedIds: string[];
    onApply: (payload: {
        subject_id?: string;
        grade_id?: string;
        difficulty?: string;
        status?: string;
        score?: number;
        negative_score?: number;
    }) => Promise<void>;
}

export const QuestionBulkModal: React.FC<QuestionBulkModalProps> = ({
    isOpen,
    onClose,
    selectedIds,
    onApply,
}) => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [isLoadingMaster, setIsLoadingMaster] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bulk state values ("keep" means "Don't change")
    const [selectedSubject, setSelectedSubject] = useState<string>("keep");
    const [selectedGrade, setSelectedGrade] = useState<string>("keep");
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("keep");
    const [selectedStatus, setSelectedStatus] = useState<string>("keep");
    const [score, setScore] = useState<string>("");
    const [negativeScore, setNegativeScore] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            setIsLoadingMaster(true);
            academicMasterService.getSubjects()
                .then((subRes) => setSubjects(Array.isArray(subRes) ? subRes : (subRes as any)?.data || []))
                .catch(() => { })
                .finally(() => setIsLoadingMaster(false));
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload: {
                subject_id?: string;
                grade_id?: string;
                difficulty?: string;
                status?: string;
                score?: number;
                negative_score?: number;
            } = {};

            if (selectedSubject !== "keep") payload.subject_id = selectedSubject;
            if (selectedGrade !== "keep") payload.grade_id = selectedGrade;
            if (selectedDifficulty !== "keep") payload.difficulty = selectedDifficulty;
            if (selectedStatus !== "keep") payload.status = selectedStatus;
            if (score.trim() !== "") payload.score = parseFloat(score);
            if (negativeScore.trim() !== "") payload.negative_score = parseFloat(negativeScore);

            await onApply(payload);
            onClose();
        } catch (err: any) {
            console.error("Bulk edit error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg bg-background border-border text-foreground shadow-2xl rounded-2xl p-6">
                <DialogHeader className="border-b border-border pb-3">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                        <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Edit Masal Soal ({selectedIds.length} Soal Dipilih)
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs">
                        Perubahan atribut di bawah ini akan diterapkan secara serentak ke semua soal yang dicentang. Kosongkan/biarkan "Tidak Diubah" untuk mempertahankan nilai lama.
                    </DialogDescription>
                </DialogHeader>

                {isLoadingMaster ? (
                    <div className="py-8 flex justify-center items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs">Memuat data akademis...</span>
                    </div>
                ) : (
                    <div className="space-y-4 py-3">
                        {/* Status Approval / State */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Ubah Status / Approval</label>
                            <Select value={selectedStatus} onValueChange={(val) => val && setSelectedStatus(val)}>
                                <SelectTrigger className="bg-background border-input text-foreground text-xs rounded-xl">
                                    <SelectValue placeholder="Pilih Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground rounded-xl shadow-lg">
                                    <SelectItem value="keep">-- Tidak Diubah --</SelectItem>
                                    <SelectItem value="DRAFT">DRAFT (Dalam Penulisan)</SelectItem>
                                    <SelectItem value="REVIEW">REVIEW (Dalam Peninjauan)</SelectItem>
                                    <SelectItem value="APPROVED">APPROVED (Disetujui)</SelectItem>
                                    <SelectItem value="PUBLISHED">PUBLISHED (Diterbitkan)</SelectItem>
                                    <SelectItem value="ARCHIVED">ARCHIVED (Diarsipkan)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tingkat Kesulitan */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Ubah Tingkat Kesulitan</label>
                            <Select value={selectedDifficulty} onValueChange={(val) => val && setSelectedDifficulty(val)}>
                                <SelectTrigger className="bg-background border-input text-foreground text-xs rounded-xl">
                                    <SelectValue placeholder="Pilih Kesulitan" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground rounded-xl shadow-lg">
                                    <SelectItem value="keep">-- Tidak Diubah --</SelectItem>
                                    <SelectItem value="EASY">Mudah (EASY)</SelectItem>
                                    <SelectItem value="MEDIUM">Sedang (MEDIUM)</SelectItem>
                                    <SelectItem value="HARD">Sulit (HARD)</SelectItem>
                                    <SelectItem value="EXPERT">Sangat Sulit (EXPERT)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Mata Pelajaran */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Ubah Mata Pelajaran</label>
                            <Select value={selectedSubject} onValueChange={(val) => val && setSelectedSubject(val)}>
                                <SelectTrigger className="bg-background border-input text-foreground text-xs rounded-xl">
                                    <SelectValue placeholder="Pilih Mata Pelajaran" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground rounded-xl shadow-lg max-h-56">
                                    <SelectItem value="keep">-- Tidak Diubah --</SelectItem>
                                    {subjects.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name} ({s.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bobot Nilai / Skor */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Skor Benar</label>
                                <Input
                                    type="number"
                                    placeholder="Biarkan kosong"
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                    className="bg-background border-input text-foreground text-xs rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Skor Negatif</label>
                                <Input
                                    type="number"
                                    placeholder="Biarkan kosong"
                                    value={negativeScore}
                                    onChange={(e) => setNegativeScore(e.target.value)}
                                    className="bg-background border-input text-foreground text-xs rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="border-t border-border pt-3 gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl text-xs font-semibold border-border">
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isLoadingMaster}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Terapkan ke {selectedIds.length} Soal
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
