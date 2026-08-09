// src/components/admin/target-schools/TargetSchoolFormDialog.tsx
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SchoolSelect } from "@/components/admin/schools/school-select";
import { ApiError } from "@/lib/api";
import { schoolService } from "@/services/school.service";
import { TargetSchoolPayload } from "@/services/target-school.service";
import { defaultMaxTotal } from "@/lib/target-school-mappers";

const levelLabels: Record<string, string> = {
    SMP: "SMP",
    SMA: "SMA",
    UNIVERSITY: "UNIVERSITY (Perguruan Tinggi)",
};

const createSchema = z.object({
    name: z.string().min(1, "Nama sekolah/PT wajib diisi"),
    npsn: z.string().optional(),
    province: z.string().optional(),
    regency: z.string().optional(),
});
type CreateValues = z.infer<typeof createSchema>;

interface TargetSchoolFormDialogProps {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (values: TargetSchoolPayload) => void;
    level?: string;
    onCreateSchool?: () => void;
}

export function TargetSchoolFormDialog({
    open,
    loading = false,
    onClose,
    onSubmit,
    level,
    onCreateSchool,
}: TargetSchoolFormDialogProps) {
    const effectiveLevel = level || "SMA";
    const maxTotal = defaultMaxTotal(effectiveLevel);
    const queryClient = useQueryClient();

    const schema = z
        .object({
            school_id: z.string().min(1, "Pilih sekolah/PT dari katalog"),
            min_score: z.string().optional(),
            max_score: z.string().optional(),
            subjectsRaw: z.string().optional(),
            academic_year: z.string().optional(),
        })
        .superRefine((val, ctx) => {
            const min = val.min_score ? Number(val.min_score) : NaN;
            const max = val.max_score ? Number(val.max_score) : NaN;
            if (!Number.isNaN(min) && !Number.isNaN(max)) {
                if (max < min) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["max_score"],
                        message: "Nilai tertinggi tidak boleh di bawah nilai terendah",
                    });
                }
                if (max > maxTotal) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["max_score"],
                        message: `Nilai tertinggi maksimal ${maxTotal}`,
                    });
                }
            }
        });

    type FormValues = z.infer<typeof schema>;

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { school_id: "", min_score: "", max_score: "", subjectsRaw: "", academic_year: "" },
    });

    useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    const handleFormSubmit = (data: FormValues) => {
        const subjects = (data.subjectsRaw || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        onSubmit({
            school_id: data.school_id,
            level: effectiveLevel,
            min_score: data.min_score ? Number(data.min_score) : undefined,
            max_score: data.max_score ? Number(data.max_score) : undefined,
            max_total_score: maxTotal,
            subjects,
            academic_year: data.academic_year || undefined,
            is_active: true,
        });
    };

    // --- create school in-form (tombol "+ Baru") ---
    const [createOpen, setCreateOpen] = useState(false);
    const [createBusy, setCreateBusy] = useState(false);
    const [createError, setCreateError] = useState("");
    const createForm = useForm<CreateValues>({
        resolver: zodResolver(createSchema),
        defaultValues: { name: "", npsn: "", province: "", regency: "" },
    });

    useEffect(() => {
        if (createOpen) {
            createForm.reset({ name: "", npsn: "", province: "", regency: "" });
            setCreateError("");
        }
    }, [createOpen, createForm]);

    const handleCreateSchool = async (data: CreateValues) => {
        setCreateBusy(true);
        setCreateError("");
        try {
            const school = await schoolService.createSchool({
                name: data.name,
                education_level: effectiveLevel,
                province: data.province,
                regency: data.regency,
                npsn: data.npsn,
            });
            setValue("school_id", school.id, { shouldValidate: true });
            setCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: ["admin-schools-catalog"] });
        } catch (err) {
            const e = err instanceof ApiError ? err : null;
            setCreateError(
                e
                    ? `${e.message}${e.status === 409 ? " (kemungkinan NPSN sudah terdaftar)" : ""}`
                    : "Gagal membuat sekolah/PT. Coba lagi."
            );
        } finally {
            setCreateBusy(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg font-bold">Tambah Target Sekolah / PTN</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Sekolah / PT Target</label>
                            <SchoolSelect
                                level={effectiveLevel}
                                value={watch("school_id")}
                                onChange={(id) => setValue("school_id", id, { shouldValidate: true })}
                                onCreateSchool={onCreateSchool ?? (() => setCreateOpen(true))}
                            />
                            {errors.school_id && <p className="text-xs text-destructive">{errors.school_id.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Jenjang</label>
                                <div className="flex h-11 items-center rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium text-foreground">
                                    {levelLabels[effectiveLevel] ?? effectiveLevel}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Skor Maksimal</label>
                                <div className="flex h-11 items-center rounded-xl border border-border bg-muted/40 px-3 font-mono text-sm text-foreground">
                                    {maxTotal}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Nilai Terendah Diterima</label>
                                <Input type="number" min={0} {...register("min_score")} className="h-11" placeholder="cth: 320" />
                                {errors.min_score && <p className="text-xs text-destructive">{errors.min_score.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Nilai Tertinggi Diterima</label>
                                <Input type="number" min={0} max={maxTotal} {...register("max_score")} className="h-11" placeholder={`maks ${maxTotal}`} />
                                {errors.max_score && <p className="text-xs text-destructive">{errors.max_score.message}</p>}
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

            <Dialog open={createOpen} onOpenChange={(o: boolean) => !o && setCreateOpen(false)}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg font-bold">Buat Sekolah / PT Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={createForm.handleSubmit(handleCreateSchool)} className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Nama Sekolah / PT</label>
                            <Input {...createForm.register("name")} className="h-11" placeholder="cth: SMA Negeri 1 Jakarta" />
                            {createForm.formState.errors.name && (
                                <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Jenjang</label>
                            <div className="flex h-11 items-center rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium text-foreground">
                                {levelLabels[effectiveLevel] ?? effectiveLevel}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Provinsi</label>
                                <Input {...createForm.register("province")} className="h-11" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Kota/Kab</label>
                                <Input {...createForm.register("regency")} className="h-11" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">NPSN (Opsional)</label>
                            <Input {...createForm.register("npsn")} className="h-11" />
                            {createError && <p className="text-xs text-destructive">{createError}</p>}
                        </div>
                        <DialogFooter className="gap-2 sm:justify-end mt-4">
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={createBusy} className="rounded-xl">
                                Batal
                            </Button>
                            <Button type="submit" disabled={createBusy} className="rounded-xl">
                                {createBusy ? "Menyimpan..." : "Buat Sekolah"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}