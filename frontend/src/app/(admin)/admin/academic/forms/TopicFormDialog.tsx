// src/app/(admin)/admin/academic/forms/TopicFormDialog.tsx
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
    chapter_id: z.string().min(1, "Bab wajib dipilih"),
    title: z.string().min(1, "Judul topik wajib diisi"),
    description: z.string().optional(),
    sequence: z.number().min(0, "Urutan tidak boleh negatif"),
});

type FormValues = z.infer<typeof schema>;

interface TopicFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editing?: {
        id: string;
        chapter_id: string;
        title: string;
        description?: string | null;
        sequence: number;
    } | null;
}

export function TopicFormDialog({ open, onClose, onSuccess, editing }: TopicFormDialogProps) {
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            chapter_id: "",
            title: "",
            description: "",
            sequence: 0,
        },
    });

    const queryClient = useQueryClient();

    React.useEffect(() => {
        if (editing) {
            setValue("chapter_id", editing.chapter_id);
            setValue("title", editing.title);
            setValue("description", editing.description ?? "");
            setValue("sequence", editing.sequence);
        } else {
            reset();
        }
    }, [editing, setValue, reset]);

    const createMutation = useMutation({
        mutationFn: academicMasterService.createTopic,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-topics"] });
            onSuccess?.();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormValues }) => academicMasterService.updateTopic(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-topics"] });
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
                        {editing ? "Edit Topik" : "Tambah Topik Baru"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Bab</label>
                        <Input
                            {...register("chapter_id")}
                            className="h-11"
                            type="text"
                            placeholder="Pilih bab"
                        />
                        {errors.chapter_id && <p className="text-xs text-destructive">{errors.chapter_id.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Judul Topik</label>
                        <Input {...register("title")} className="h-11" placeholder="cth: Penjumlahan Bilangan" />
                        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Deskripsi (Opsional)</label>
                        <Input {...register("description")} className="h-11" placeholder="Deskripsi singkat" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Urutan</label>
                        <Input
                            {...register("sequence", { valueAsNumber: true })}
                            className="h-11"
                            type="number"
                            min="0"
                        />
                        {errors.sequence && <p className="text-xs text-destructive">{errors.sequence.message}</p>}
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
