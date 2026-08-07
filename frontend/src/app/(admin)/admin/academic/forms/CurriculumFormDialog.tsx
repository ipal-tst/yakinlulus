// src/app/(admin)/admin/academic/forms/CurriculumFormDialog.tsx
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
    name: z.string().min(1, "Nama kurikulum wajib diisi"),
    code: z.string().min(1, "Kode kurikulum wajib diisi"),
    description: z.string().optional(),
    is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface CurriculumFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editing?: {
        id: string;
        name: string;
        code: string;
        description?: string | null;
        is_active: boolean;
    } | null;
}

export function CurriculumFormDialog({ open, onClose, onSuccess, editing }: CurriculumFormDialogProps) {
    const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            code: "",
            description: "",
            is_active: true,
        },
    });

    const queryClient = useQueryClient();
    const isActiveValue = watch("is_active");

    React.useEffect(() => {
        if (editing) {
            setValue("name", editing.name);
            setValue("code", editing.code);
            setValue("description", editing.description ?? "");
            setValue("is_active", editing.is_active);
        } else {
            reset();
        }
    }, [editing, setValue, reset]);

    const createMutation = useMutation({
        mutationFn: academicMasterService.createCurriculum,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-curriculums"] });
            onSuccess?.();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormValues }) => academicMasterService.updateCurriculum(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-curriculums"] });
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
                        {editing ? "Edit Kurikulum" : "Tambah Kurikulum Baru"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Nama Kurikulum</label>
                        <Input {...register("name")} className="h-11" placeholder="cth: Kurikulum Merdeka" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Kode Kurikulum</label>
                        <Input {...register("code")} className="h-11" placeholder="cth: KM" />
                        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Deskripsi (Opsional)</label>
                        <Input {...register("description")} className="h-11" placeholder="Deskripsi singkat" />
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