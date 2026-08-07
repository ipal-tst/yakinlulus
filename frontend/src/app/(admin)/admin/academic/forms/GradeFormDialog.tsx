// src/app/(admin)/admin/academic/forms/GradeFormDialog.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { academicMasterService } from "@/services/academic-master.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const schema = z.object({
    education_level_id: z.string().min(1, "Jenjang wajib dipilih"),
    name: z.string().min(1, "Nama kelas wajib diisi"),
    alias: z.string().optional(),
    display_order: z.number().min(0, "Urutan display tidak boleh negatif"),
    is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface GradeFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editing?: {
        id: string;
        education_level_id: string;
        name: string;
        alias?: string | null;
        display_order: number;
        is_active: boolean;
    } | null;
}

export function GradeFormDialog({ open, onClose, onSuccess, editing }: GradeFormDialogProps) {
    const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            education_level_id: "",
            name: "",
            alias: "",
            display_order: 0,
            is_active: true,
        },
    });

    const queryClient = useQueryClient();
    const isActiveValue = watch("is_active");

    React.useEffect(() => {
        if (editing) {
            setValue("education_level_id", editing.education_level_id);
            setValue("name", editing.name);
            setValue("alias", editing.alias ?? "");
            setValue("display_order", editing.display_order);
            setValue("is_active", editing.is_active);
        } else {
            reset();
        }
    }, [editing, setValue, reset]);

    const createMutation = useMutation({
        mutationFn: academicMasterService.createGrade,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-grades"] });
            onSuccess?.();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormValues }) => academicMasterService.updateGrade(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-grades"] });
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
                        {editing ? "Edit Kelas" : "Tambah Kelas Baru"}
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
                        <label className="text-xs font-semibold text-foreground">Nama Kelas</label>
                        <Input {...register("name")} className="h-11" placeholder="cth: Kelas 10" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Alias (Opsional)</label>
                        <Input {...register("alias")} className="h-11" placeholder="cth: X" />
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
                    <div className="flex items-center justify-between space-x-3">
                        <label className="text-xs font-semibold text-foreground">Aktif</label>
                        <Switch
                            checked={isActiveValue}
                            onCheckedChange={(v: boolean) => setValue("is_active", v)}
                        />
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
