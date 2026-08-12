// src/components/admin/schools/SchoolFormDialog.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { School, SchoolPayload } from "@/services/school.service";
import { SchoolFormValues } from "@/lib/school-form-values";
import { AlertCircle, Building2, Contact, MapPin } from "lucide-react";

const schema = z
    .object({
        school_name: z.string().min(1, "Nama sekolah wajib diisi"),
        npsn: z
            .string()
            .optional()
            .refine((v) => !v || v.length === 0 || /^\d{8}$/.test(v), "NPSN harus 8 digit"),
        institution_type: z.enum(["SEKOLAH", "PT"]),
        education_level: z.string().optional(),
        school_status: z.enum(["NEGERI", "SWASTA"]),
        yayasan_name: z.string().optional(),
        province: z.string().optional(),
        city: z.string().optional(),
        district: z.string().optional(),
        village: z.string().optional(),
        address: z.string().optional(),
        postal_code: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        curriculum_code: z.string().optional(),
        is_active: z.boolean(),
    })
    .superRefine((val, ctx) => {
        if (val.institution_type === "SEKOLAH" && !val.education_level) {
            ctx.addIssue({ code: "custom", path: ["education_level"], message: "Jenjang wajib diisi untuk sekolah" });
        }
        if (val.school_status === "SWASTA" && !val.yayasan_name) {
            ctx.addIssue({ code: "custom", path: ["yayasan_name"], message: "Nama yayasan wajib diisi untuk sekolah swasta" });
        }
    });

const LEVEL_OPTIONS = [
    { value: "SD", label: "SD" },
    { value: "SMP", label: "SMP" },
    { value: "SMA", label: "SMA" },
    { value: "SMK", label: "SMK" },
    { value: "UNIVERSITY", label: "UNIVERSITY" },
];

interface SchoolFormDialogProps {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (values: SchoolPayload) => void;
    school?: School | null;
}

function toFormValues(school: School | null | undefined): SchoolFormValues {
    if (!school) {
        return {
            school_name: "",
            npsn: "",
            institution_type: "SEKOLAH",
            education_level: "SMA",
            school_status: "NEGERI",
            yayasan_name: "",
            province: "",
            city: "",
            district: "",
            village: "",
            address: "",
            postal_code: "",
            phone: "",
            email: "",
            website: "",
            curriculum_code: "",
            is_active: true,
        };
    }
    return {
        school_name: school.school_name ?? "",
        npsn: school.npsn ?? "",
        institution_type: school.institution_type ?? "SEKOLAH",
        education_level: school.education_level || "",
        school_status: school.school_status ?? "NEGERI",
        yayasan_name: school.yayasan_name ?? "",
        province: school.province ?? "",
        city: school.city ?? "",
        district: school.district ?? "",
        village: school.village ?? "",
        address: school.address ?? "",
        postal_code: school.postal_code ?? "",
        phone: school.phone ?? "",
        email: school.email ?? "",
        website: school.website ?? "",
        curriculum_code: school.curriculum_code ?? "",
        is_active: school.is_active ?? true,
    };
}

export function SchoolFormDialog({ open, loading = false, onClose, onSubmit, school }: SchoolFormDialogProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<SchoolFormValues>({
        resolver: zodResolver(schema),
        defaultValues: toFormValues(school),
    });

    const isEditing = Boolean(school);
    const institutionType = watch("institution_type");
    const schoolStatus = watch("school_status");

    React.useEffect(() => {
        if (open) reset(toFormValues(school));
    }, [open, school, reset]);

    const handleFormSubmit = (data: SchoolFormValues) => {
        onSubmit({
            school_name: data.school_name,
            npsn: data.npsn || undefined,
            institution_type: data.institution_type,
            education_level: data.institution_type === "PT" ? "UNIVERSITY" : data.education_level || undefined,
            school_status: data.school_status,
            yayasan_name: data.school_status === "SWASTA" ? data.yayasan_name || undefined : undefined,
            province: data.province || undefined,
            city: data.city || undefined,
            district: data.district || undefined,
            village: data.village || undefined,
            address: data.address || undefined,
            postal_code: data.postal_code || undefined,
            phone: data.phone || undefined,
            email: data.email || undefined,
            website: data.website || undefined,
            curriculum_code: data.curriculum_code || undefined,
            is_active: data.is_active,
        });
    };

    return (
        <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
            <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">
                        {isEditing ? "Edit Sekolah / PT" : "Daftarkan Sekolah Baru"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
                    <Card className="rounded-2xl border-border shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Building2 className="h-4 w-4 text-primary" /> Identitas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Nama Sekolah / PT</label>
                                <Input {...register("school_name")} className="h-11" placeholder="cth: SMA Negeri 1 Jakarta" />
                                {errors.school_name && <p className="text-xs text-destructive">{errors.school_name.message}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">NPSN (Opsional)</label>
                                    <Input {...register("npsn")} className="h-11" placeholder="8 digit" />
                                    {errors.npsn && <p className="text-xs text-destructive">{errors.npsn.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Bentuk</label>
                                    <Select
                                        value={watch("institution_type")}
                                        onValueChange={(v: string | null) => setValue("institution_type", (v as "SEKOLAH" | "PT") ?? "SEKOLAH")}
                                    >
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue placeholder="Pilih bentuk" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SEKOLAH">Sekolah</SelectItem>
                                            <SelectItem value="PT">Perguruan Tinggi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Jenjang</label>
                                    <Select
                                        value={watch("education_level") ?? ""}
                                        onValueChange={(v: string | null) => setValue("education_level", v ?? "")}
                                        disabled={institutionType === "PT"}
                                    >
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue placeholder={institutionType === "PT" ? "PT otomatis UNIVERSITY" : "Pilih jenjang"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LEVEL_OPTIONS.map((l) => (
                                                <SelectItem key={l.value} value={l.value}>
                                                    {l.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.education_level && <p className="text-xs text-destructive">{errors.education_level.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Status</label>
                                    <Select
                                        value={watch("school_status")}
                                        onValueChange={(v: string | null) => setValue("school_status", (v as "NEGERI" | "SWASTA") ?? "NEGERI")}
                                    >
                                        <SelectTrigger className="h-11 w-full">
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEGERI">Negeri</SelectItem>
                                            <SelectItem value="SWASTA">Swasta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {schoolStatus === "SWASTA" && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Nama Yayasan</label>
                                    <Input {...register("yayasan_name")} className="h-11" placeholder="cth: Yayasan Pendidikan Nusantara" />
                                    {errors.yayasan_name && <p className="text-xs text-destructive">{errors.yayasan_name.message}</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <MapPin className="h-4 w-4 text-primary" /> Alamat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Provinsi</label>
                                    <Input {...register("province")} className="h-11" placeholder="cth: DKI Jakarta" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Kota/Kabupaten</label>
                                    <Input {...register("city")} className="h-11" placeholder="cth: Jakarta Selatan" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Kecamatan</label>
                                    <Input {...register("district")} className="h-11" placeholder="cth: Kebayoran Baru" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Kelurahan</label>
                                    <Input {...register("village")} className="h-11" placeholder="cth: Cipete Utara" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-semibold text-foreground">Alamat</label>
                                    <Input {...register("address")} className="h-11" placeholder="Alamat lengkap" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Kode Pos</label>
                                    <Input {...register("postal_code")} className="h-11" placeholder="cth: 12345" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Contact className="h-4 w-4 text-primary" /> Kontak &amp; Kurikulum
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Nomor Telepon</label>
                                    <Input {...register("phone")} className="h-11" placeholder="08xx-xxxx-xxxx" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Email</label>
                                    <Input {...register("email")} type="email" className="h-11" placeholder="admin@sekolah.sch.id" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Website</label>
                                    <Input {...register("website")} className="h-11" placeholder="https://..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Kurikulum</label>
                                    <Input {...register("curriculum_code")} className="h-11" placeholder="cth: K13 / Kurikulum Merdeka" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {errors.root && (
                        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {errors.root.message}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-xl">
                            {loading ? "Menyimpan..." : isEditing ? "Perbarui" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
