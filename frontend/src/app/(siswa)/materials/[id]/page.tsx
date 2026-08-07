"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { academicService } from "@/services/academic.service";
import { Material } from "@/types";
import { ArrowLeft, Clock, CheckCircle2, BookOpen } from "lucide-react";

export default function MaterialDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [material, setMaterial] = useState<Material | null>(null);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await academicService.getMaterialById(id);
                setMaterial(res);
                setCompleted(res.is_completed || false);
            } catch {
                setMaterial({
                    id,
                    title: "Konsep Dasar Penalaran Matematika UTBK",
                    subject_name: "Penalaran Matematika",
                    category: "TEORI",
                    reading_time_minutes: 15,
                    content: `
# 1. Pendahuluan Penalaran Matematika

Penalaran matematika pada UTBK SNBT tidak sekadar menguji kemampuan berhitung kuantitatif biasa, melainkan kemampuan menganalisis informasi, pola, dan hubungan antar variabel.

## Poin Utama:
- **Analisis Data:** Membaca tabel, grafik, dan diagram garis secara efisien.
- **Model Matematika:** Mengubah soal cerita (verbal) menjadi persamaan/pertidaksamaan linear.
- **Logika Angka:** Menentukan sifat bilangan asli, cacah, prima, dan operasi pecahan.

### Contoh Soal & Pembahasan:
Diberikan persamaan 2x + 3y = 12. Jika x dan y adalah bilangan bulat positif, berapakah nilai x + y maksimum?

**Pembahasan:**
Nilai (x, y) yang memenuhi bilangan bulat positif adalah (3, 2). Maka x + y = 5.
          `,
                    is_completed: true,
                });
                setCompleted(true);
            }
        }
        load();
    }, [id]);

    return (
        <AppShell>
            <div className="max-w-4xl mx-auto space-y-6">
                <Button asChild variant="ghost" size="sm" className="gap-2">
                    <Link href="/materials">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Materi
                    </Link>
                </Button>

                {material && (
                    <Card className="p-6 md:p-8 space-y-6">
                        <div className="space-y-3 pb-6 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">{material.subject_name}</Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> {material.reading_time_minutes} Menit Baca
                                </span>
                            </div>
                            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
                                {material.title}
                            </h1>
                        </div>

                        {/* Content body */}
                        <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed space-y-4 whitespace-pre-line">
                            {material.content}
                        </div>

                        {/* Complete Action Footer */}
                        <div className="pt-6 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {completed ? "Anda sudah menyelesaikan materi ini." : "Tandai jika Anda telah memahami materi."}
                            </span>
                            <Button
                                onClick={() => setCompleted(true)}
                                variant={completed ? "outline" : "default"}
                                className="rounded-xl gap-2 font-medium"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {completed ? "Sudah Selesai" : "Tandai Selesai"}
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </AppShell>
    );
}
