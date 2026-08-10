"use client";

import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { academicService } from "@/services/academic.service";
import { Plus, Trash2, AlertCircle } from "lucide-react";

export default function GuruMaterialsPage() {
    const { data: materials = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["guru-materials"],
        queryFn: () => academicService.getMaterials(),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Manajemen Materi Belajar</h1>
                    <p className="text-sm text-muted-foreground">Buat dan publikasikan modul teori, rangkuman, dan strategi belajar.</p>
                </div>
                <Button className="rounded-xl gap-2 font-semibold shadow-xs">
                    <Plus className="h-4 w-4" /> Tulis Materi Baru
                </Button>
            </div>

            {isError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Gagal memuat data materi. Periksa koneksi lalu coba lagi.</span>
                    <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                        Coba Lagi
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            ) : materials.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                    Belum ada materi. Tulis materi baru untuk memulai.
                </div>
            ) : (
                <Card className="p-4 divide-y divide-border">
                    {materials.map((m) => (
                        <div key={m.id} className="p-4 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px]">{m.subject_name}</Badge>
                                    <Badge variant="success" className="text-[10px]">{m.status}</Badge>
                                </div>
                                <h3 className="font-heading font-semibold text-base">{m.title}</h3>
                                <p className="text-xs text-muted-foreground">{m.reading_time_minutes} menit waktu baca</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="rounded-xl">Edit</Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    ))}
                </Card>
            )}
        </div>
    );
}