// src/components/admin/notifications/TemplateFormDialog.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NotificationTemplate } from "@/services/notification.service";

const schema = z.object({
    name: z.string().min(1, "Nama templat wajib diisi"),
    title: z.string().min(1, "Judul notifikasi wajib diisi"),
    message: z.string().min(1, "Isi pesan wajib diisi"),
    channel: z.string().min(1, "Kanal wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

interface TemplateFormDialogProps {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (values: Omit<NotificationTemplate, "id">) => void;
}

export function TemplateFormDialog({ open, loading = false, onClose, onSubmit }: TemplateFormDialogProps) {
    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { channel: "IN_APP" },
    });

    React.useEffect(() => {
        if (open) reset();
    }, [open, reset]);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">Buat Templat Notifikasi</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit((d) => onSubmit(d))} className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Nama Templat</label>
                        <Input {...register("name")} className="h-11" placeholder="cth: OTP_VERIFICATION" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Judul Default</label>
                            <Input {...register("title")} className="h-11" placeholder="Kode OTP YakinLulus" />
                            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Kanal</label>
                            <Select value={watch("channel")} onValueChange={(v) => setValue("channel", (v as string) || "IN_APP")}>
                                <SelectTrigger className="h-11 w-full">
                                    <SelectValue placeholder="Pilih kanal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IN_APP">Dalam Aplikasi</SelectItem>
                                    <SelectItem value="EMAIL">Email</SelectItem>
                                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Isi Pesan Templat (Gunakan {`{otp}`} dll)</label>
                        <textarea
                            {...register("message")}
                            rows={3}
                            className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="cth: Kode OTP keamanan Anda adalah {otp}. Jangan sebarkan kode ini."
                        />
                        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
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