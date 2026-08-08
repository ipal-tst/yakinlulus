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
import { Eye, EyeOff, KeyRound, User as UserIcon, Building2, Phone, GraduationCap, ShieldCheck } from "lucide-react";

const schema = z.object({
    full_name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().optional(),
    role: z.enum(["SUPER_ADMIN", "STAFF", "FINANCE", "GURU", "SISWA", "SUPER_SISWA", "INVESTOR"]),
    gender: z.string().optional(),
    phone: z.string().optional(),
    school_name: z.string().optional(),
    education_level: z.string().optional(),
    grade: z.string().optional(),
    membership_status: z.enum(["ACTIVE", "INACTIVE", "TRIAL"]).optional(),
});

export type UserFormValues = z.infer<typeof schema>;

interface UserFormDialogProps {
    open: boolean;
    loading?: boolean;
    editing?: {
        id: string;
        full_name: string;
        email: string;
        role: UserRole;
        gender?: string;
        phone?: string;
        school_name?: string;
        education_level?: string;
        grade?: string;
        membership_status?: "ACTIVE" | "INACTIVE" | "TRIAL";
    };
    onClose: () => void;
    onSubmit: (values: UserFormValues) => void;
}

const ROLE_OPTIONS: UserRole[] = ["SISWA", "SUPER_SISWA", "GURU", "STAFF", "FINANCE", "INVESTOR", "SUPER_ADMIN"];

export function UserFormDialog({ open, loading = false, editing, onClose, onSubmit }: UserFormDialogProps) {
    const [showPassword, setShowPassword] = React.useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<UserFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { role: "SISWA", membership_status: "TRIAL", ...editing },
    });

    React.useEffect(() => {
        if (open) {
            setShowPassword(false);
            reset(editing ? { ...editing, password: "" } : { role: "SISWA", membership_status: "TRIAL", password: "" });
        }
    }, [open, reset, editing]);

    const handleFormSubmit = (data: UserFormValues) => {
        // Clean up empty password during edit if not provided
        const payload = { ...data };
        if (editing && (!payload.password || payload.password.trim() === "")) {
            delete payload.password;
        }
        onSubmit(payload);
    };

    return (
        <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
            <DialogContent className="sm:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary" />
                        {editing ? `Edit Pengguna: ${editing.full_name}` : "Tambah Pengguna Baru"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                Nama Lengkap <span className="text-destructive">*</span>
                            </label>
                            <Input {...register("full_name")} placeholder="Masukkan nama lengkap" className="h-11" />
                            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                Email <span className="text-destructive">*</span>
                            </label>
                            <Input type="email" {...register("email")} placeholder="user@yakinlulus.id" className="h-11" />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                    </div>

                    {/* Password Field (Ganti Password for edit, mandatory creation) */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <KeyRound className="h-3.5 w-3.5 text-primary" />
                                {editing ? "Ganti Password / Reset Kata Sandi" : "Kata Sandi (Password)"}
                                {!editing && <span className="text-destructive">*</span>}
                            </label>
                            {editing && (
                                <span className="text-[11px] text-muted-foreground font-medium">
                                    (Kosongkan jika tidak ingin diubah)
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                {...register("password")}
                                placeholder={editing ? "Masukkan password baru jika ingin mengubah..." : "Minimal 8 karakter"}
                                className="h-11 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>

                    {/* Role & Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                Peran (Role) <span className="text-destructive">*</span>
                            </label>
                            <Select value={watch("role")} onValueChange={(v: string | null) => setValue("role", (v || "") as UserRole)}>
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

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Jenis Kelamin</label>
                            <Select value={watch("gender") || undefined} onValueChange={(v: string | null) => setValue("gender", v || undefined)}>
                                <SelectTrigger className="h-11 w-full">
                                    <SelectValue placeholder="Pilih jenis kelamin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* SISWA specific profile details */}
                    {(watch("role") === "SISWA" || watch("role") === "SUPER_SISWA") && (
                        <div className="space-y-4 pt-2 border-t border-border">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                                Profil Siswa
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Nomor HP / WhatsApp
                                    </label>
                                    <Input {...register("phone")} className="h-11" placeholder="08123456789" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Nama Sekolah
                                    </label>
                                    <Input {...register("school_name")} className="h-11" placeholder="SMA Negeri 1 Jakarta" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" /> Jenjang
                                    </label>
                                    <Select value={watch("education_level") || undefined} onValueChange={(v: string | null) => setValue("education_level", v || undefined)}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Jenjang" />
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
                                    <Input {...register("grade")} className="h-11" placeholder="10, 11, 12" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Status Paket</label>
                                    <Select value={watch("membership_status")} onValueChange={(v: string | null) => setValue("membership_status", v as any)}>
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">Aktif</SelectItem>
                                            <SelectItem value="INACTIVE">Non-aktif</SelectItem>
                                            <SelectItem value="TRIAL">Trial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:justify-end pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-xl font-medium px-6">
                            {loading ? "Menyimpan..." : (editing ? "Simpan Perubahan" : "Tambah Pengguna")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}