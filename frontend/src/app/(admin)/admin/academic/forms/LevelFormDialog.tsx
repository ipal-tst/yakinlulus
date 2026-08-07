// src/app/(admin)/admin/academic/forms/LevelFormDialog.tsx
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
    name: z.string().min(1, "Nama level wajib diisi"),
    code: z.string().min(1, "Kode level wajib diisi"),
    is_active: z.boolean(),
    display_order: z.number().min(0, "Urutan display tidak boleh negatif"),
});

type FormValues = z.infer<typeof schema>;

interface LevelFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function LevelFormDialog({ open, onClose, onSuccess }: LevelFormDialogProps) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            code: "",
            is_active: true,
            display_order: 0,
        },
    });

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: academicMasterService.createLevel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-levels"] });
            onSuccess?.();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormValues }) => academicMasterService.updateLevel(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["academic-levels"] });
            onSuccess?.();
        },
    });

    const isEditing = React.useRef(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    const onSubmit = handleSubmit((data) => {
        if (isEditing.current && editingId) {
            updateMutation.mutate({ id: editingId, data });
        } else {
            createMutation.mutate(data);
        }
    });

    const loading = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">
                        {isEditing.current ? "Edit Level Akademik" : "Tambah Level Akademik Baru"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Nama Level</label>
                        <Input {...register("name")} className="h-11" placeholder="cth: SMA" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Kode Level</label>
                        <Input {...register("code")} className="h-11" placeholder="cth: SMA" />
                        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                    </div>
                    <div className="flex items-center justify-between space-x-3">
                        <label className="text-xs font-semibold text-foreground">Aktif</label>
                        <Switch
                            checked={watch("is_active")}
                            onCheckedChange={(v: boolean) => setValue("is_active", v)}
                        />
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
