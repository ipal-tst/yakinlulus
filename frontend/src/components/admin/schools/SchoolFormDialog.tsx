// src/components/admin/schools/SchoolFormDialog.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { School, SchoolPayload } from "@/services/school.service";

const schema = z.object({
    name: z.string().min(1, "Nama sekolah wajib diisi"),
    code: z.string().optional(),
    npsn: z.string().optional(),
    education_level: z.string().optional(),
    province: z.string().optional(),
    regency: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface SchoolFormDialogProps {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (values: SchoolPayload) => void;
    school?: School | null;
}

export function SchoolFormDialog({ open, loading = false, onClose, onSubmit, school }: SchoolFormDialogProps) {
    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { education_level: "SMA" },
    });

    const isEditing = Boolean(school);

    React.useEffect(() => {
        if (open) {
            reset({
                name: school?.name ?? "",
                code: school?.code ?? "",
                npsn: school?.npsn ?? "",
                education_level: school?.education_level ?? "SMA",
                province: school?.province ?? "",
                regency: school?.regency ?? "",
                address: school?.address ?? "",
                phone: school?.phone ?? "",
            });
        }
    }, [open, school, reset]);

    const handleFormSubmit = (data: FormValues) => {
        onSubmit({
            name: data.name,
            code: data.code,
            npsn: data.npsn,
            education_level: data.education_level,
            province: data.province,
            regency: data.regency,
            address: data.address,
            phone: data.phone,
        });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">
                        {isEditing ? "Edit Sekolah" : "Daftarkan Sekolah Baru"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Nama Sekolah</label>
                        <Input {...register("name")} className="h-11" placeholder="cth: SMA Negeri 1 Jakarta" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Kode (Opsional)</label>
                            <Input {...register("code")} className="h-11" placeholder="SMAN1JKT" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">NPSN (Opsional)</label>
                            <Input {...register("npsn")} className="h-11" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Jenjang</label>
                        <Select value={watch("education_level")} onValueChange={(v) => setValue("education_level", v ?? undefined)}>
                            <SelectTrigger className="h-11 w-full">
                                <SelectValue placeholder="Pilih jenjang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SD">SD</SelectItem>
                                <SelectItem value="SMP">SMP</SelectItem>
                                <SelectItem value="SMA">SMA</SelectItem>
                                <SelectItem value="SMK">SMK</SelectItem>
                                <SelectItem value="UTBK">UTBK/Umum</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Provinsi</label>
                            <Input {...register("province")} className="h-11" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Kota/Kab</label>
                            <Input {...register("regency")} className="h-11" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Alamat</label>
                        <Input {...register("address")} className="h-11" placeholder="Alamat lengkap sekolah" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Nomor Telepon</label>
                        <Input {...register("phone")} className="h-11" placeholder="08xx-xxxx-xxxx" />
                    </div>
                    <DialogFooter className="gap-2 sm:justify-end mt-4">
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