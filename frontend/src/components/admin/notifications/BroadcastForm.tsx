// src/components/admin/notifications/BroadcastForm.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { notificationService } from "@/services/notification.service";

const schema = z.object({
    title: z.string().min(1, "Judul notifikasi wajib diisi"),
    message: z.string().min(1, "Pesan notifikasi wajib diisi"),
    audience: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function BroadcastForm() {
    const [status, setStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
    const [loading, setLoading] = React.useState(false);

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { audience: "ALL" },
    });

    const onSubmit = async (data: FormValues) => {
        setLoading(true);
        setStatus(null);
        try {
            await notificationService.broadcast(data);
            setStatus({ type: "success", text: "Pengumuman broadcast berhasil dikirim!" });
            reset();
        } catch (err: unknown) {
            setStatus({
                type: "error",
                text: err instanceof Error ? err.message : "Gagal mengirim pengumuman broadcast",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="rounded-2xl p-6 shadow-sm border border-border">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="font-heading text-lg font-bold">Kirim Pengumuman Broadcast</CardTitle>
                <p className="text-xs text-muted-foreground">Kirim notifikasi pesan secara massal ke pengguna sesuai segmen target.</p>
            </CardHeader>
            <CardContent className="p-0">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {status && (
                        <div
                            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                                status.type === "success"
                                    ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 border border-green-200 dark:border-green-800"
                                    : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800"
                            }`}
                        >
                            {status.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                            <span>{status.text}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Judul Notifikasi</label>
                        <Input {...register("title")} className="h-11" placeholder="cth: Pengumuman Try Out Akbar Batch 2" />
                        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Target Audiens</label>
                        <Select value={watch("audience") || "ALL"} onValueChange={(v) => setValue("audience", v ?? undefined)}>
                            <SelectTrigger className="h-11 w-full">
                                <SelectValue placeholder="Pilih audiens" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Pengguna</SelectItem>
                                <SelectItem value="SISWA">Semua Siswa</SelectItem>
                                <SelectItem value="GURU">Semua Guru</SelectItem>
                                <SelectItem value="STAFF">Staff & Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Isi Pesan Notifikasi</label>
                        <textarea
                            {...register("message")}
                            rows={4}
                            className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Tuliskan pesan detail pengumuman yang akan diterima pengguna..."
                        />
                        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading} className="rounded-xl gap-2 px-5">
                            <Send className="h-4 w-4" /> {loading ? "Mengirim..." : "Kirim Broadcast Now"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}