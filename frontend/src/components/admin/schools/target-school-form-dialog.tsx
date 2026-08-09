// src/components/admin/schools/target-school-form-dialog.tsx
"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { SchoolSelect } from "@/components/admin/schools/school-select";
import { ApiError } from "@/lib/api";
import { schoolService } from "@/services/school.service";
import { TargetSchool, TargetSchoolPayload } from "@/services/target-school.service";
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
    onOpenChange: (open: boolean) => void;
    initial?: TargetSchool | null;
    level?: string;
    loading?: boolean;
    onSubmit: (payload: TargetSchoolPayload) => void;
}

export function TargetSchoolFormDialog({
    open,
    onOpenChange,
    initial = null,
    level,
    loading = false,
    onSubmit,
}: TargetSchoolFormDialogProps) {
    const effectiveLevel = level || initial?.level || "SMA";
    const maxTotal = initial?.max_total_score ?? defaultMaxTotal(effectiveLevel);
    const isEditing = Boolean(initial);

    const schema = useMemo(
        () =>
            z
                .object({
                    school_id: z.string().min(1, "Pilih sekolah/PT dari katalog"),
                    min_score: z
                        .string()
                        .min(1, "Wajib diisi")
                        .refine((v) => !Number.isNaN(Number(v)), "Harus berupa angka"),
                    max_score: z
                        .string()
                        .min(1, "Wajib diisi")
                        .refine((v) => !Number.isNaN(Number(v)), "Harus berupa angka"),
                    academic_year: z.string().optional(),
                    subjectsRaw: z.string().optional(),
                })
                .superRefine((val, ctx) => {
                    const min = Number(val.min_score);
                    const max = Number(val.max_score);
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
                }),
        [maxTotal]
    );

    type FormValues = z.infer<typeof schema>;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { school_id: "", min_score: "", max_score: "", academic_year: "", subjectsRaw: "" },
    });

    useEffect(() => {
        if (open) {
            reset({
                school_id: initial?.school_id ?? "",
                min_score: initial?.min_score != null ? String(initial.min_score) : "",
                max_score: initial?.max_score != null ? String(initial.max_score) : "",
                academic_year: initial?.academic_year ?? "",
                subjectsRaw: initial?.subjects?.join(", ") ?? "",
            });
        }
    }, [open, initial, reset]);

    const subjects = (watch("subjectsRaw") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const handleFormSubmit = (data: FormValues) => {
        onSubmit({
            school_id: data.school_id,
            level: effectiveLevel,
            min_score: Number(data.min_score),
            max_score: Number(data.max_score),
            max_total_score: maxTotal,
            subjects,
            academic_year: data.academic_year || undefined,
            is_active: initial?.is_active ?? true,
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
            <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg font-bold">
                            {isEditing ? "Edit Target Sekolah / PTN" : "Tambah Target Sekolah / PTN"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Sekolah / PT Target</label>
                            <SchoolSelect
                                level={effectiveLevel}
                                value={watch("school_id")}
                                onChange={(id) => setValue("school_id", id, { shouldValidate: true })}
                                onCreateSchool={() => setCreateOpen(true)}
                                disabled={isEditing}
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
                            {subjects.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {subjects.map((s, i) => (
                                        <span
                                            key={`${s}-${i}`}
                                            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Tahun Ajaran (Opsional)</label>
                            <Input {...register("academic_year")} className="h-11" placeholder="2025/2026" />
                        </div>

                        <DialogFooter className="gap-2 sm:justify-end mt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-xl">
                                Batal
                            </Button>
                            <Button type="submit" disabled={loading} className="rounded-xl">
                                {loading ? "Menyimpan..." : isEditing ? "Perbarui" : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
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