// src/app/(admin)/admin/academic/forms/ChapterFormDialog.tsx
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
    subject_id: z.string().min(1, "Mata pelajaran wajib dipilih"),
    name: z.string().min(1, "Nama bab wajib diisi"),
    description: z.string().optional(),
    display_order: z.number().min(0, "Urutan display tidak boleh negatif"),
});

type FormValues = z.infer<typeof schema>;

interface ChapterFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editing?: {
        id: string;
        subject_id: string;
        name: string;
        description?: string | null;
        display_order: number;
    } | null;
}

export function ChapterFormDialog({ open, onClose, onSuccess, editing }: ChapterFormDialogProps) {
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            subject_id: "",
            name: "",
            description: "",
            display_order: 0,
        },
    });

    const queryClient = useQueryClient();

    React.useEffect(() => {
        if (editing) {
            setValue("subject_id", editing.subject_id);
            setValue("name", editing.name);
            setValue("description", editing.description ?? "");
            setValue("display_order", editing.display_order);
        } else {
            reset();
        }
    }, [editing, setValue, reset]);

    const createMutation = useMutation({
        mutationFn: academicMasterService.createChapter,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-chapters"] });
            onSuccess?.();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormValues }) => academicMasterService.updateChapter(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-chapters"] });
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
                        {editing ? "Edit Bab" : "Tambah Bab Baru"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Mata Pelajaran</label>
                        <Input
                            {...register("subject_id")}
                            className="h-11"
                            type="text"
                            placeholder="Pilih mata pelajaran"
                        />
                        {errors.subject_id && <p className="text-xs text-destructive">{errors.subject_id.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Nama Bab</label>
                        <Input {...register("name")} className="h-11" placeholder="cth: Bilangan Bulat" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
