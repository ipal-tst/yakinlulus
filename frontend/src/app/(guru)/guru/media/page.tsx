"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { mediaService } from "@/services/media.service";
import { Image as ImageIcon, Upload, Copy, Trash2, Check, AlertCircle } from "lucide-react";

export default function GuruMediaPage() {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { data: mediaList = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["guru-media"],
        queryFn: () => mediaService.listMedia(),
    });

    const handleCopy = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Perpustakaan Media & Gambar</h1>
                    <p className="text-sm text-muted-foreground">Unggah ilustrasi soal, diagram matematika, dan gambar pendukung materi.</p>
                </div>
                <Button className="rounded-xl gap-2 font-semibold shadow-xs">
                    <Upload className="h-4 w-4" /> Unggah Gambar Baru
                </Button>
            </div>

            {isError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Gagal memuat data media. Periksa koneksi lalu coba lagi.</span>
                    <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                        Coba Lagi
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-xl" />
                    ))}
                </div>
            ) : mediaList.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Belum ada media. Unggah gambar pertama kamu.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {mediaList.map((m) => (
                        <Card key={m.id} className="p-4 space-y-3 flex flex-col justify-between hover:border-primary transition-all">
                            <div className="h-36 rounded-xl bg-muted/60 flex items-center justify-center border border-border">
                                <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-heading font-semibold text-sm truncate">{m.file_name}</h3>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border">
                                <Button
                                    onClick={() => handleCopy(m.url ?? "", m.id)}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-xs gap-1.5 w-full mr-2"
                                >
                                    {copiedId === m.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                                    {copiedId === m.id ? "Tersalin!" : "Salin URL"}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}