// src/components/admin/target-schools/TargetSchoolFormDialog.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TargetSchoolPayload } from "@/services/target-school.service";

const schema = z.object({
    name: z.string().min(1, "Nama target wajib diisi"),
    level: z.string().min(1, "Jenjang wajib diisi"),
    max_total_score: z.coerce.number().min(1, "Skor maksimal wajib diisi"),
    subjectsRaw: z.string().optional(),
    academic_year: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TargetSchoolFormDialogProps {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (values: TargetSchoolPayload) => void;
}

export function TargetSchoolFormDialog({ open, loading = false, onClose, onSubmit }: TargetSchoolFormDialogProps) {
    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema as any),
        defaultValues: { level: "SMA", max_total_score: 1000 },
    });

    React.useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    const handleFormSubmit = (data: FormValues) => {
        const subjects = (data.subjectsRaw || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        onSubmit({
            name: data.name,
            level: data.level,
            max_total_score: data.max_total_score,
            subjects,
            academic_year: data.academic_year,
            is_active: true,
        });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">Tambah Target Sekolah / PTN</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Nama Target / PTN</label>
                        <Input {...register("name")} className="h-11" placeholder="cth: ITB - Teknik Informatika" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Jenjang</label>
                            <Select value={watch("level") || "SMA"} onValueChange={(v) => setValue("level", (v as string) || "SMA")}>
                                <SelectTrigger className="h-11 w-full">
                                    <SelectValue placeholder="Pilih jenjang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SMP">SMP</SelectItem>
                                    <SelectItem value="SMA">SMA</SelectItem>
                                    <SelectItem value="UTBK">UTBK/SNBT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Skor Maksimal</label>
                            <Input type="number" {...register("max_total_score")} className="h-11" />
                            {errors.max_total_score ? <p className="text-xs text-destructive">{errors.max_total_score.message}</p> : null}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Mata Pelajaran (pisahkan dengan koma)</label>
                        <Input {...register("subjectsRaw")} className="h-11" placeholder="PU, PK, PBM, LBENG" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Tahun Ajaran (Opsional)</label>
                        <Input {...register("academic_year")} className="h-11" placeholder="2025/2026" />
                    </div>
                    <DialogFooter className="gap-2 sm:justify-end mt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-xl">
                            {loading ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}