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
    password: z.string().min(8, "Kata sandi minimal 8 karakter").optional(),
    role: z.enum(["SUPER_ADMIN", "STAFF", "FINANCE", "GURU", "SISWA", "INVESTOR"]),
    // SISWA-specific fields
    phone: z.string().optional(),
    school_name: z.string().optional(),
    education_level: z.string().optional(),
    grade: z.string().optional(),
    membership_status: z.enum(["ACTIVE", "INACTIVE", "TRIAL"]).optional(),
});

type FormValues = z.infer<typeof schema>;

interface UserFormDialogProps {
    open: boolean;
    loading?: boolean;
    editing?: {
        id: string;
        full_name: string;
        email: string;
        role: UserRole;
        phone?: string;
        school_name?: string;
        education_level?: string;
        grade?: string;
        membership_status?: "ACTIVE" | "INACTIVE" | "TRIAL";
    };
    onClose: () => void;
    onSubmit: (values: FormValues) => void;
}

const ROLE_OPTIONS: UserRole[] = ["SISWA", "GURU", "STAFF", "FINANCE", "INVESTOR", "SUPER_ADMIN"];

export function UserFormDialog({ open, loading = false, editing, onClose, onSubmit }: UserFormDialogProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { role: "SISWA", membership_status: "TRIAL", ...editing },
    });

    React.useEffect(() => {
        if (open) reset(editing || { role: "SISWA", membership_status: "TRIAL" });
    }, [open, reset, editing]);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">
                        {editing ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                    </DialogTitle>
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
                    {!editing && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Kata Sandi</label>
                            <Input type="password" {...register("password")} className="h-11" />
                            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Peran (Role)</label>
                        <Select value={watch("role")} onValueChange={(v) => setValue("role", (v || "") as UserRole)}>
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
                    {watch("role") === "SISWA" && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Nomor Telepon</label>
                                <Input {...register("phone")} className="h-11" placeholder="0812..." />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Nama Sekolah</label>
                                <Input {...register("school_name")} className="h-11" placeholder="SMA Negeri..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Jenjang</label>
                                    <Select value={watch("education_level") || undefined} onValueChange={(v) => setValue("education_level", v || undefined)}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Pilih jenjang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SD">SD</SelectItem>
                                            <SelectItem value="SMP">SMP</SelectItem>
                                            <SelectItem value="SMA">SMA</SelectItem>
                                            <SelectItem value="GapYear">Gap Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Kelas</label>
                                    <Input {...register("grade")} className="h-11" placeholder="10, 11, 12, dll" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Status Membership</label>
                                <Select value={watch("membership_status")} onValueChange={(v) => setValue("membership_status", v as any)}>
                                    <SelectTrigger className="h-11 w-full">
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Aktif</SelectItem>
                                        <SelectItem value="INACTIVE">Non-aktif</SelectItem>
                                        <SelectItem value="TRIAL">Trial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                    <DialogFooter className="gap-2 sm:justify-end mt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-xl">
                            {loading ? "Menyimpan..." : (editing ? "Update" : "Simpan")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}