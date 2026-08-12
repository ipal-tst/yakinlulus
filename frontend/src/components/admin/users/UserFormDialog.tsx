// src/components/admin/users/UserFormDialog.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/types/admin";
import { userService } from "@/services/user.service";
import { academicMasterService } from "@/services/academic-master.service";
import { schoolService } from "@/services/school.service";
import { api } from "@/lib/api";
import { Eye, EyeOff, KeyRound, User as UserIcon, Building2, Phone, GraduationCap, ShieldCheck } from "lucide-react";

const schema = z.object({
    full_name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().optional(),
    role: z.enum(["SUPER_ADMIN", "STAFF", "FINANCE", "GURU", "SISWA", "SUPER_SISWA", "INVESTOR"]),
    gender: z.string().optional(),
    phone: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "LOCKED", "PENDING"]).optional(),
    school_id: z.string().optional(),
    grade_id: z.string().optional(),
    major_id: z.string().optional(),
    education_level: z.string().optional(),
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
        school_id?: string;
        grade_id?: string;
        major_id?: string;
        education_level?: string;
        grade?: string;
        status?: "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING";
        membership_status?: "ACTIVE" | "INACTIVE" | "TRIAL";
    };
    onClose: () => void;
    onSubmit: (values: UserFormValues) => void;
}

const ROLE_OPTIONS: UserRole[] = ["SISWA", "SUPER_SISWA", "GURU", "STAFF", "FINANCE", "INVESTOR", "SUPER_ADMIN"];

interface Major {
    id: string;
    code: string;
    name: string;
    education_level_id: string;
    is_active: boolean;
}

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
        defaultValues: { role: "SISWA", status: "ACTIVE", membership_status: "TRIAL", ...editing },
    });

    React.useEffect(() => {
        if (open) {
            setShowPassword(false);
            reset(editing ? { ...editing, password: "" } : { role: "SISWA", status: "ACTIVE", membership_status: "TRIAL", password: "" });
        }
    }, [open, reset, editing]);

    const isStudentRole = watch("role") === "SISWA" || watch("role") === "SUPER_SISWA";
    const selectedLevelId = watch("education_level");

    const { data: roles } = useQuery({
        queryKey: ["roles"],
        queryFn: () => userService.listRoles(),
        enabled: open,
    });
    const { data: levels } = useQuery({
        queryKey: ["academic-levels"],
        queryFn: () => academicMasterService.getLevels(),
        enabled: open,
    });
    const { data: grades } = useQuery({
        queryKey: ["academic-grades", selectedLevelId],
        queryFn: () => academicMasterService.getGrades(selectedLevelId ?? ""),
        enabled: Boolean(selectedLevelId) && isStudentRole && open,
    });
    const { data: majors } = useQuery({
        queryKey: ["academic-majors", selectedLevelId],
        queryFn: () => api<Major[]>(`/academic/majors?level_id=${selectedLevelId ?? ""}`),
        enabled: Boolean(selectedLevelId) && isStudentRole && open,
    });
    const { data: schools } = useQuery({
        queryKey: ["schools"],
        queryFn: () => schoolService.listSchools({ limit: 500 }),
        enabled: open,
    });

    const roleItems: UserRole[] = (roles ?? [])
        .map((r) => r.code)
        .filter((code): code is UserRole => (ROLE_OPTIONS as string[]).includes(code));
    const roleOptions = roleItems.length > 0 ? roleItems : ROLE_OPTIONS;

    const handleFormSubmit = (data: UserFormValues) => {
        const payload = { ...data };
        if (editing && (!payload.password || payload.password.trim() === "")) {
            delete payload.password;
        }
        const clean: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(payload)) {
            if (value === "" || value === undefined) continue;
            clean[key] = value;
        }
        onSubmit(clean as UserFormValues);
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
                    <Tabs defaultValue="identitas" className="w-full">
                        <TabsList className="w-full">
                            <TabsTrigger value="identitas" className="flex-1">Identitas</TabsTrigger>
                            {isStudentRole && <TabsTrigger value="akademik" className="flex-1">Akademik</TabsTrigger>}
                            <TabsTrigger value="akses" className="flex-1">Akses</TabsTrigger>
                        </TabsList>

                        <TabsContent value="identitas" className="pt-4">
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

                            <div className="p-3.5 mt-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Nomor HP / WhatsApp
                                    </label>
                                    <Input {...register("phone")} className="h-11" placeholder="08123456789" />
                                </div>
                            </div>
                        </TabsContent>

                        {isStudentRole && (
                            <TabsContent value="akademik" className="pt-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" /> Jenjang
                                        </label>
                                        <Select
                                            value={selectedLevelId || undefined}
                                            onValueChange={(v: string | null) => {
                                                setValue("education_level", v || undefined);
                                                setValue("grade_id", undefined);
                                                setValue("major_id", undefined);
                                            }}
                                        >
                                            <SelectTrigger className="h-11 w-full">
                                                <SelectValue placeholder="Pilih jenjang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(levels ?? []).map((l) => (
                                                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Kelas</label>
                                        <Select value={watch("grade_id") || undefined} onValueChange={(v: string | null) => setValue("grade_id", v || undefined)}>
                                            <SelectTrigger className="h-11 w-full">
                                                <SelectValue placeholder="Pilih kelas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(grades ?? []).map((g) => (
                                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Sekolah
                                        </label>
                                        <Select value={watch("school_id") || undefined} onValueChange={(v: string | null) => setValue("school_id", v || undefined)}>
                                            <SelectTrigger className="h-11 w-full">
                                                <SelectValue placeholder="Pilih sekolah" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(schools ?? []).map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>{s.school_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Jurusan</label>
                                        <Select value={watch("major_id") || undefined} onValueChange={(v: string | null) => setValue("major_id", v || undefined)}>
                                            <SelectTrigger className="h-11 w-full">
                                                <SelectValue placeholder="Pilih jurusan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(majors ?? []).map((m) => (
                                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Status Keanggotaan</label>
                                    <Select
                                        value={watch("membership_status")}
                                        onValueChange={(v: string | null) => setValue("membership_status", (v || "TRIAL") as "ACTIVE" | "INACTIVE" | "TRIAL")}
                                    >
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
                            </TabsContent>
                        )}

                        <TabsContent value="akses" className="pt-4 space-y-4">
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
                                            {roleOptions.map((r) => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Status</label>
                                    <Select
                                        value={watch("status") || undefined}
                                        onValueChange={(v: string | null) => setValue("status", (v || undefined) as "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING" | undefined)}
                                    >
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">Aktif</SelectItem>
                                            <SelectItem value="INACTIVE">Non-aktif</SelectItem>
                                            <SelectItem value="LOCKED">Terkunci</SelectItem>
                                            <SelectItem value="PENDING">Menunggu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

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
