// src/app/(admin)/admin/academic/forms/LearningOutcomeFormDialog.tsx
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
    topic_id: z.string().min(1, "Topik wajib dipilih"),
    code: z.string().optional(),
    title: z.string().min(1, "Judul indikator wajib diisi"),
    sequence: z.number().min(0, "Urutan tidak boleh negatif"),
    bloom_default: z.string().optional(),
    description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface LearningOutcomeFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editing?: {
        id: string;
        topic_id: string;
        code?: string | null;
        title: string;
        sequence: number;
        bloom_default?: string | null;
        description?: string | null;
    } | null;
}

export function LearningOutcomeFormDialog({ open, onClose, onSuccess, editing }: LearningOutcomeFormDialogProps) {
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            topic_id: "",
            code: "",
            title: "",
            sequence: 0,
            bloom_default: "",
            description: "",
        },
    });

    const queryClient = useQueryClient();

    React.useEffect(() => {
        if (editing) {
            setValue("topic_id", editing.topic_id);
            setValue("code", editing.code ?? "");
            setValue("title", editing.title);
            setValue("sequence", editing.sequence);
            setValue("bloom_default", editing.bloom_default ?? "");
            setValue("description", editing.description ?? "");
        } else {
            reset();
        }
    }, [editing, setValue, reset]);

    const createMutation = useMutation({
        mutationFn: academicMasterService.createLearningOutcome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-learning-outcomes"] });
            onSuccess?.();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormValues }) => academicMasterService.updateLearningOutcome(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-learning-outcomes"] });
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
                        {editing ? "Edit Indikator Pencapaian" : "Tambah Indikator Pencapaian Baru"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Topik</label>
                        <Input
                            {...register("topic_id")}
                            className="h-11"
                            type="text"
                            placeholder="Pilih topik"
                        />
                        {errors.topic_id && <p className="text-xs text-destructive">{errors.topic_id.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Kode (Opsional)</label>
                        <Input {...register("code")} className="h-11" placeholder="cth: PI-001" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Judul Indikator</label>
                        <Input {...register("title")} className="h-11" placeholder="cth: Mampu menjumlahkan bilangan bulat" />
                        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
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
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Level Bloom (Opsional)</label>
                        <Input {...register("bloom_default")} className="h-11" placeholder="cth: PENGETAHUAN" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Deskripsi (Opsional)</label>
                        <Input {...register("description")} className="h-11" placeholder="Deskripsi singkat" />
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
