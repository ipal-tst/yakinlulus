// src/components/admin/schools/target-score-form-dialog.tsx
"use client";

import * as React from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { targetSchoolService, TargetSchoolScore } from "@/services/target-school.service";
import { defaultMaxTotal } from "@/lib/target-school-mappers";
import { AlertCircle } from "lucide-react";

function academicYearOptions(): string[] {
    const current = new Date().getFullYear();
    const years: string[] = [];
    for (let i = current - 4; i <= current + 1; i++) {
        years.push(`${i}/${i + 1}`);
    }
    return years;
}

interface TargetScoreFormProps {
    payungId?: string;
    payungName?: string;
    level?: string;
    maxDefault?: number;
    initial?: TargetSchoolScore | null;
    onClose: () => void;
}

function TargetScoreForm({ payungId, payungName, level = "", maxDefault, initial = null, onClose }: TargetScoreFormProps) {
    const qc = useQueryClient();
    const [academicYear, setAcademicYear] = useState(initial?.academic_year ?? "");
    const [minScore, setMinScore] = useState(initial?.min_score != null ? String(initial.min_score) : "");
    const [maxScore, setMaxScore] = useState(initial?.max_score != null ? String(initial.max_score) : "");
    const [maxTotal, setMaxTotal] = useState(initial?.max_total_score != null ? String(initial.max_total_score) : String(maxDefault ?? defaultMaxTotal(level)));
    const [error, setError] = useState("");

    const mutate = useMutation({
        mutationFn: async () => {
            const payload = {
                target_school_id: initial?.target_school_id ?? payungId ?? "",
                academic_year: academicYear,
                min_score: minScore === "" ? undefined : Number(minScore),
                max_score: maxScore === "" ? undefined : Number(maxScore),
                max_total_score: maxTotal === "" ? undefined : Number(maxTotal),
            };
            if (initial) {
                return targetSchoolService.updateScore(initial.id, payload);
            }
            return targetSchoolService.upsertScore(payload);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-target-scores"] });
            qc.invalidateQueries({ queryKey: ["admin-target-payungs"] });
            qc.invalidateQueries({ queryKey: ["admin-target-schools"] });
            onClose();
        },
        onError: (err: unknown) => {
            setError(err instanceof Error ? err.message : "Gagal menyimpan nilai target");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!academicYear) {
            setError("Tahun ajaran wajib diisi");
            return;
        }
        if (!payungId && !initial?.target_school_id) {
            setError("Pilih target sekolah terlebih dahulu");
            return;
        }
        const min = minScore === "" ? undefined : Number(minScore);
        const max = maxScore === "" ? undefined : Number(maxScore);
        const total = maxTotal === "" ? undefined : Number(maxTotal);
        if (min !== undefined && max !== undefined && max < min) {
            setError("Nilai maksimal tidak boleh lebih kecil dari nilai minimal");
            return;
        }
        if (total !== undefined && total > 0 && max !== undefined && max > total) {
            setError("Nilai maksimal tidak boleh melebihi skala total");
            return;
        }
        mutate.mutate();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Target Sekolah</label>
                <Input value={payungName ?? ""} readOnly className="h-11 bg-muted/40" />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tahun Ajaran</label>
                <Select value={academicYear} onValueChange={(v: string | null) => setAcademicYear(v ?? "")}>
                    <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                        {academicYearOptions().map((y) => (
                            <SelectItem key={y} value={y}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Nilai Min</label>
                    <Input
                        type="number"
                        min={0}
                        value={minScore}
                        onChange={(e) => setMinScore(e.target.value)}
                        className="h-11"
                        placeholder="cth: 300"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Nilai Max</label>
                    <Input
                        type="number"
                        min={0}
                        value={maxScore}
                        onChange={(e) => setMaxScore(e.target.value)}
                        className="h-11"
                        placeholder="cth: 380"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Skala Total</label>
                    <Input
                        type="number"
                        min={0}
                        value={maxTotal}
                        onChange={(e) => setMaxTotal(e.target.value)}
                        className="h-11"
                        placeholder="400"
                    />
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <DialogFooter className="gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={onClose} disabled={mutate.isPending} className="rounded-xl">
                    Batal
                </Button>
                <Button type="submit" disabled={mutate.isPending} className="rounded-xl">
                    {mutate.isPending ? "Menyimpan..." : initial ? "Perbarui" : "Simpan"}
                </Button>
            </DialogFooter>
        </form>
    );
}

export interface TargetScoreFormDialogProps {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    payungId?: string;
    payungName?: string;
    level?: string;
    maxDefault?: number;
    initial?: TargetSchoolScore | null;
}

export function TargetScoreFormDialog({ open, onOpenChange, payungId, payungName, level, maxDefault, initial = null }: TargetScoreFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o: boolean) => !o && onOpenChange(false)}>
            <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">
                        {initial ? "Edit Nilai Target" : "Tambah Nilai Target"}
                    </DialogTitle>
                </DialogHeader>
                {open && (
                    <TargetScoreForm
                        payungId={payungId}
                        payungName={payungName}
                        level={level}
                        maxDefault={maxDefault}
                        initial={initial}
                        onClose={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
