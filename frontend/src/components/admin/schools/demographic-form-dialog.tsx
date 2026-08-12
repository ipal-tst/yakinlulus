// src/components/admin/schools/demographic-form-dialog.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SchoolDemographic, schoolService } from "@/services/school.service";
import { AlertCircle, Plus, Trash2 } from "lucide-react";

interface GradeRow {
    grade: string;
    count: string;
}

function academicYearOptions(): string[] {
    const current = new Date().getFullYear();
    const years: string[] = [];
    for (let i = current - 4; i <= current + 1; i++) {
        years.push(`${i}/${i + 1}`);
    }
    return years;
}

function breakdownToRows(breakdown: Record<string, number> | undefined): GradeRow[] {
    const entries = Object.entries(breakdown ?? {});
    return entries.length > 0
        ? entries.map(([grade, count]) => ({ grade, count: String(count) }))
        : [{ grade: "", count: "" }];
}

interface DemographicFormProps {
    schoolId?: string;
    initial?: SchoolDemographic | null;
    onClose: () => void;
}

function DemographicForm({ schoolId, initial = null, onClose }: DemographicFormProps) {
    const qc = useQueryClient();
    const [academicYear, setAcademicYear] = useState(initial?.academic_year ?? "");
    const [totalStudents, setTotalStudents] = useState(initial?.total_students != null ? String(initial.total_students) : "");
    const [totalRombel, setTotalRombel] = useState(initial?.total_rombel != null ? String(initial.total_rombel) : "");
    const [rows, setRows] = useState<GradeRow[]>(() => breakdownToRows(initial?.grade_breakdown));
    const [error, setError] = useState("");
    const isEditing = Boolean(initial);

    const yearOptions = useMemo(() => academicYearOptions(), []);

    const mutate = useMutation({
        mutationFn: async () => {
            const grade_breakdown: Record<string, number> = {};
            for (const r of rows) {
                const grade = r.grade.trim();
                const count = Number(r.count);
                if (grade && !Number.isNaN(count) && count >= 0) grade_breakdown[grade] = count;
            }
            const payload = {
                school_id: initial?.school_id ?? schoolId ?? "",
                academic_year: academicYear,
                total_students: totalStudents === "" ? undefined : Number(totalStudents),
                total_rombel: totalRombel === "" ? undefined : Number(totalRombel),
                grade_breakdown,
            };
            if (initial) {
                return schoolService.updateDemographic(initial.id, payload);
            }
            return schoolService.upsertDemographic(payload);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-school-demographics"] });
            onClose();
        },
        onError: (err: unknown) => {
            setError(err instanceof Error ? err.message : "Gagal menyimpan data demografi");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!academicYear) {
            setError("Tahun ajaran wajib diisi");
            return;
        }
        if (!schoolId && !initial?.school_id) {
            setError("Pilih sekolah terlebih dahulu");
            return;
        }
        mutate.mutate();
    };

    const updateRow = (index: number, field: keyof GradeRow, value: string) => {
        setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    };

    const addRow = () => setRows((prev) => [...prev, { grade: "", count: "" }]);
    const removeRow = (index: number) => setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tahun Ajaran</label>
                <Select value={academicYear} onValueChange={(v: string | null) => setAcademicYear(v ?? "")}>
                    <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                        {yearOptions.map((y) => (
                            <SelectItem key={y} value={y}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Total Siswa</label>
                    <Input
                        type="number"
                        min={0}
                        value={totalStudents}
                        onChange={(e) => setTotalStudents(e.target.value)}
                        className="h-11"
                        placeholder="cth: 1080"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Total Rombel</label>
                    <Input
                        type="number"
                        min={0}
                        value={totalRombel}
                        onChange={(e) => setTotalRombel(e.target.value)}
                        className="h-11"
                        placeholder="cth: 27"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Rincian per Jenjang</label>
                    <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={addRow}>
                        <Plus className="h-3.5 w-3.5" /> Tambah Baris
                    </Button>
                </div>
                {rows.map((row, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                        <Input
                            value={row.grade}
                            onChange={(e) => updateRow(index, "grade", e.target.value)}
                            className="h-10"
                            placeholder="Jenjang (cth: Kelas 10)"
                        />
                        <Input
                            type="number"
                            min={0}
                            value={row.count}
                            onChange={(e) => updateRow(index, "count", e.target.value)}
                            className="h-10"
                            placeholder="Jumlah siswa"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-10 w-10 rounded-lg p-0 text-muted-foreground"
                            onClick={() => removeRow(index)}
                            aria-label="Hapus baris"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
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
                    {mutate.isPending ? "Menyimpan..." : isEditing ? "Perbarui" : "Simpan"}
                </Button>
            </DialogFooter>
        </form>
    );
}

interface DemographicFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    schoolId?: string;
    initial?: SchoolDemographic | null;
}

export function DemographicFormDialog({ open, onOpenChange, schoolId, initial = null }: DemographicFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o: boolean) => !o && onOpenChange(false)}>
            <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">
                        {initial ? "Edit Data Siswa & Rombel" : "Tambah Data Siswa & Rombel"}
                    </DialogTitle>
                </DialogHeader>
                {open && <DemographicForm schoolId={schoolId} initial={initial} onClose={() => onOpenChange(false)} />}
            </DialogContent>
        </Dialog>
    );
}
