// frontend/src/app/(siswa)/materials/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { academicService } from "@/services/academic.service";
import { Material } from "@/types";
import {
    ArrowLeft,
    Clock,
    CheckCircle2,
    Lightbulb,
    PenTool,
    ArrowRight,
    Share2,
    Bookmark,
} from "lucide-react";

export default function MaterialDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [material, setMaterial] = useState<Material | null>(null);
    const [completed, setCompleted] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await academicService.getMaterialById(id);
                setMaterial(res);
                setCompleted(res.is_completed || res.progress === 100);

                // Fetch real user progress if API is connected
                try {
                    const prog = await academicService.getMaterialProgress(id);
                    if (prog && prog.completed) {
                        setCompleted(true);
                    }
                } catch {
                    // Ignore progress check errors
                }
            } catch {
                setMaterial({
                    id,
                    title: "Konsep Dasar Penalaran Matematika UTBK",
                    subject_name: "Penalaran Matematika",
                    category: "TEORI",
                    content_format: "TEXT",
                    estimated_duration: 15,
                    description: "Panduan lengkap memahami prinsip logika kuantitatif, analisis data grafik, dan penyelesaian soal matematika cerita.",
                    body: `
# 1. Pendahuluan Penalaran Matematika

Penalaran matematika pada UTBK SNBT tidak sekadar menguji kemampuan berhitung kuantitatif biasa, melainkan kemampuan menganalisis informasi, pola, dan hubungan antar variabel.

## Poin Utama Ujian:
- **Analisis Data Grafik:** Membaca tabel, diagram lingkaran, dan grafik tren secara cepat & cermat.
- **Model Matematika:** Mengubah wacana soal cerita (verbal) menjadi persamaan/pertidaksamaan linear.
- **Logika Angka & Deret:** Menentukan sifat bilangan asli, cacah, prima, dan operasi rasional.

### Contoh Soal & Pembahasan Model UTBK:
Diberikan persamaan 2x + 3y = 12. Jika x dan y adalah bilangan bulat positif, berapakah nilai x + y maksimum?

**Pembahasan:**
Nilai pasangan (x, y) yang memenuhi bilangan bulat positif adalah **(3, 2)**. Maka nilai maksimum x + y = **5**.
          `,
                    is_completed: true,
                });
                setCompleted(true);
            }
        }
        load();
    }, [id]);

    const handleToggleComplete = async () => {
        const nextState = !completed;
        setCompleted(nextState);
        setSaving(true);
        try {
            await academicService.saveMaterialProgress(id, nextState ? 100 : 0);
        } catch {
            // Graceful fallback for mock mode
        } finally {
            setSaving(false);
        }
    };

    const duration = material?.estimated_duration || material?.reading_time_minutes || 15;
    const bodyText = material?.body || material?.content || "";

    return (
        <AppShell>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Navigation Breadcrumb Header */}
                <div className="flex items-center justify-between">
                    <Button asChild variant="ghost" size="sm" className="gap-2 text-xs font-medium">
                        <Link href="/materials">
                            <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog Materi
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl" title="Bagikan">
                            <Share2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl" title="Simpan Bookmark">
                            <Bookmark className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {material && (
                    <Card className="p-6 md:p-10 space-y-8 border-border/80 shadow-md">
                        {/* Header Details */}
                        <div className="space-y-4 pb-6 border-b border-border/60">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="font-semibold text-xs px-3 py-1">
                                    {material.subject_name || "Materi Pelajaran"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {material.category || material.content_format || "TEORI DASAR"}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto font-medium">
                                    <Clock className="h-3.5 w-3.5 text-primary" /> {duration} Menit Baca
                                </span>
                            </div>

                            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
                                {material.title}
                            </h1>

                            {material.description && (
                                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                    {material.description}
                                </p>
                            )}
                        </div>

                        {/* UTBK Tips & Tricks Callout Box */}
                        <div className="p-4 md:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-sm text-amber-700 dark:text-amber-300">
                                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
                                <span>💡 Tips & Trik Kunci UTBK SNBT</span>
                            </div>
                            <p className="text-xs md:text-sm leading-relaxed pl-7">
                                Selalu identifikasi variabel yang ditanyakan sebelum melakukan substitusi angka. Gunakan trik eliminasi pilihan jawaban jika terdapat batas ketidaksamaan.
                            </p>
                        </div>

                        {/* Article Content Body */}
                        <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed space-y-4 whitespace-pre-line text-foreground/90 font-sans">
                            {bodyText}
                        </div>

                        {/* Bottom Actions Section: Completion & Practice CTA */}
                        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <Button
                                onClick={handleToggleComplete}
                                disabled={saving}
                                variant={completed ? "outline" : "secondary"}
                                className="w-full sm:w-auto rounded-xl gap-2 font-semibold text-xs"
                            >
                                <CheckCircle2 className={`h-4 w-4 ${completed ? "text-emerald-500" : ""}`} />
                                {completed ? "Materi Selesai Dibaca" : "Tandai Selesai Dibaca"}
                            </Button>

                            <Button asChild className="w-full sm:w-auto rounded-xl gap-2 font-semibold text-xs shadow-md bg-primary hover:bg-primary/90">
                                <Link href={`/exams?subject=${encodeURIComponent(material.subject_name || "")}`}>
                                    <PenTool className="h-4 w-4" />
                                    <span>🔥 Latihan Soal Materi Ini</span>
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </AppShell>
    );
}
