// src/app/(admin)/admin/academic/forms/SubjectFormDialog.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { academicMasterService } from "@/services/academic-master.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const schema = z.object({
    education_level_id: z.string().min(1, "Jenjang wajib dipilih"),
    grade_id: z.string().optional(),
    name: z.string().min(1, "Nama mata pelajaran wajib diisi"),
    code: z.string().min(1, "Kode mata pelajaran wajib diisi"),
    description: z.string().optional(),
    display_order: z.number().min(0, "Urutan display tidak boleh negatif"),
});

type FormValues = z.infer<typeof schema>;

interface SubjectFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editing?: {
        id: string;
        education_level_id: string;
        grade_id?: string | null;
        name: string;
        code: string;
        description?: string | null;
        display_order: number;
    } | null;
}

export function SubjectFormDialog({ open, onClose, onSuccess, editing }: SubjectFormDialogProps) {
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            education_level_id: "",
            grade_id: "",
            name: "",
            code: "",
            description: "",
            display_order: 0,
        },
    });

    const queryClient = useQueryClient();

    React.useEffect(() => {
        if (editing) {
            setValue("education_level_id", editing.education_level_id);
            setValue("grade_id", editing.grade_id ?? "");
            setValue("name", editing.name);
            setValue("code", editing.code);
            setValue("description", editing.description ?? "");
            setValue("display_order", editing.display_order);
        } else {
            reset();
        }
    }, [editing, setValue, reset]);

    const createMutation = useMutation({
        mutationFn: academicMasterService.createSubject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-subjects"] });
            onSuccess?.();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormValues }) => academicMasterService.updateSubject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-subjects"] });
            onSuccess?.();
        },
    });

    const loading = createMutation.isPending || updateMutation.isPending;

    const onSubmit = handleSubmit((data) => {
        if (editing?.id) {
            updateMutation.mutate({ id: editing.id, data });
        } else {
            createMutation.mutate(data);
        }
    });

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">
                        {editing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Jenjang</label>
                        <Input
                            {...register("education_level_id")}
                            className="h-11"
                            type="text"
                            placeholder="Pilih jenjang"
                        />
                        {errors.education_level_id && <p className="text-xs text-destructive">{errors.education_level_id.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Kelas (Opsional)</label>
                        <Input
                            {...register("grade_id")}
                            className="h-11"
                            type="text"
                            placeholder="Pilih kelas"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Nama Mata Pelajaran</label>
                        <Input {...register("name")} className="h-11" placeholder="cth: Matematika" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Kode Mata Pelajaran</label>
                        <Input {...register("code")} className="h-11" placeholder="cth: MTK" />
                        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Deskripsi (Opsional)</label>
                        <Input {...register("description")} className="h-11" placeholder="Deskripsi singkat" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Urutan Display</label>
                        <Input
                            {...register("display_order", { valueAsNumber: true })}
                            className="h-11"
                            type="number"
                            min="0"
                        />
                        {errors.display_order && <p className="text-xs text-destructive">{errors.display_order.message}</p>}
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
