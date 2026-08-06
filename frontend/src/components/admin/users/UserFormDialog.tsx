// src/components/admin/users/UserFormDialog.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/types/admin";

const schema = z.object({
    full_name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    role: z.enum(["SUPER_ADMIN", "STAFF", "FINANCE", "GURU", "SISWA", "INVESTOR"]),
});

type FormValues = z.infer<typeof schema>;

interface UserFormDialogProps {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (values: FormValues) => void;
}

const ROLE_OPTIONS: UserRole[] = ["SISWA", "GURU", "STAFF", "FINANCE", "INVESTOR", "SUPER_ADMIN"];

export function UserFormDialog({ open, loading = false, onClose, onSubmit }: UserFormDialogProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { role: "SISWA" },
    });

    React.useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">Tambah Pengguna Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Nama Lengkap</label>
                        <Input {...register("full_name")} className="h-11" />
                        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Email</label>
                        <Input type="email" {...register("email")} className="h-11" />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Kata Sandi</label>
                        <Input type="password" {...register("password")} className="h-11" />
                        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Peran (Role)</label>
                        <Select value={watch("role")} onValueChange={(v) => setValue("role", v as UserRole)}>
                            <SelectTrigger className="h-11 w-full">
                                <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLE_OPTIONS.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
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