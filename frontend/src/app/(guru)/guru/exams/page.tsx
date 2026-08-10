"use client";

import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { academicService } from "@/services/academic.service";
import { Plus, Clock, HelpCircle, Eye, AlertCircle } from "lucide-react";

export default function GuruExamsPage() {
    const { data: exams = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["guru-exams"],
        queryFn: () => academicService.getExams(),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Manajemen Try Out & Ujian</h1>
                    <p className="text-sm text-muted-foreground">Buat paket ujian baru, atur alokasi soal per subtes, dan durasi pengerjaan.</p>
                </div>
                <Button className="rounded-xl gap-2 font-semibold shadow-xs">
                    <Plus className="h-4 w-4" /> Buat Try Out Baru
                </Button>
            </div>

            {isError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Gagal memuat data ujian. Periksa koneksi lalu coba lagi.</span>
                    <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                        Coba Lagi
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[0, 1].map((i) => (
                        <Skeleton key={i} className="h-52 w-full rounded-xl" />
                    ))}
                </div>
            ) : exams.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                    Belum ada try out atau ujian. Buat paket ujian baru untuk memulai.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exams.map((ex) => (
                        <Card key={ex.id} className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge variant="success" className="text-[10px]">{ex.status}</Badge>
                                <span className="text-xs text-muted-foreground">ID: {ex.id}</span>
                            </div>

                            <h3 className="font-heading font-bold text-lg">{ex.title}</h3>

                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {ex.duration_minutes} Menit</span>
                                <span className="flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-primary" /> {ex.total_questions} Soal</span>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                <Button variant="outline" size="sm" className="rounded-xl gap-1"><Eye className="h-3.5 w-3.5" /> Detail</Button>
                                <Button variant="default" size="sm" className="rounded-xl">Edit Ujian</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}