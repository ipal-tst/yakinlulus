"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMaterial } from "@/lib/api";
import {
    ArrowLeft,
    Play,
    FileText,
    Sparkles,
    BookOpen,
    Film,
    Monitor,
    Headphones,
    Target,
    Clock,
    Eye,
} from "lucide-react";

const getFormat = (fmt: string) => {
    const map: Record<string, { icon: any; label: string; color: string }> = {
        VIDEO: { icon: Film, label: "Video", color: "text-rose-500 bg-rose-500/10" },
        PDF: { icon: FileText, label: "PDF", color: "text-red-500 bg-red-500/10" },
        MARKDOWN: { icon: BookOpen, label: "Markdown", color: "text-blue-500 bg-blue-500/10" },
        RICH_TEXT: { icon: Monitor, label: "Rich Text", color: "text-indigo-500 bg-indigo-500/10" },
        TEXT: { icon: FileText, label: "Text", color: "text-muted-foreground bg-muted/30" },
        AUDIO: { icon: Headphones, label: "Audio", color: "text-emerald-500 bg-emerald-500/10" },
        INTERACTIVE: { icon: Monitor, label: "Interaktif", color: "text-purple-500 bg-purple-500/10" },
    };
    return (map[fmt] ?? map.TEXT)!;
};

export default function StudentMaterialDetailPage({ params }: { params: Promise<{ materialId: string }> }) {
    const resolvedParams = React.use(params);
    const [isAiSummaryOpen, setIsAiSummaryOpen] = React.useState(false);

    const { data: material, isLoading } = useMaterial(resolvedParams.materialId) as any;

    const fmt = getFormat(material?.content_format ?? "TEXT");
    const Icon = fmt.icon;

    return (
        <div className="space-y-6">
            {/* Top Navigation */}
            <div className="flex items-center justify-between gap-3">
                <Link href="/student/materials">
                    <Button variant="ghost" size="sm" className="text-xs font-semibold">
                        <ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali ke Materi
                    </Button>
                </Link>
                <Button
                    size="sm"
                    onClick={() => setIsAiSummaryOpen(!isAiSummaryOpen)}
                    className="text-xs font-bold"
                >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI Summary
                </Button>
            </div>

            {/* Hero Section */}
            <section className="bg-primary rounded-2xl p-6 text-primary-foreground relative overflow-hidden shadow-lg shadow-primary/20">
                <div className="relative z-10 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-80">
                            <Icon className="h-4 w-4" /> {fmt.label}
                        </span>
                        {material?.subject_name && (
                            <Badge className="bg-white/20 text-primary-foreground hover:bg-white/20 border-transparent text-[10px]">
                                {material.subject_name}
                            </Badge>
                        )}
                        {material?.chapter_name && (
                            <Badge className="bg-white/20 text-primary-foreground hover:bg-white/20 border-transparent text-[10px]">
                                {material.chapter_name}
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                        {isLoading ? "Memuat materi..." : (material?.title || "Materi")}
                    </h1>
                    {material && (
                        <div className="flex items-center gap-4 text-xs opacity-90">
                            {material.estimated_duration && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> {material.estimated_duration} Menit
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5" /> {material.read_count?.toLocaleString() || 0} dibaca
                            </span>
                        </div>
                    )}
                </div>
                <div className="absolute right-[-20px] top-[-20px] opacity-10">
                    <BookOpen className="h-40 w-40" />
                </div>
            </section>

            {/* Material Content */}
            <Card className="rounded-2xl p-5 md:p-6 space-y-4">
                <h3 className="font-bold text-sm border-b pb-2">Isi Modul</h3>
                {isLoading ? (
                    <div className="space-y-3">
                        <div className="animate-pulse bg-muted rounded-lg h-4 w-full" />
                        <div className="animate-pulse bg-muted rounded-lg h-4 w-5/6" />
                        <div className="animate-pulse bg-muted rounded-lg h-4 w-2/3" />
                    </div>
                ) : material?.body ? (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{material.body}</p>
                ) : (
                    <div className="bg-card rounded-2xl border border-dashed p-8 text-center">
                        <p className="text-xs text-muted-foreground">Konten materi belum tersedia.</p>
                    </div>
                )}
            </Card>

            {/* AI Summary */}
            {isAiSummaryOpen && (
                <Card className="rounded-2xl p-5 border-primary/20 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" /> AI Rangkuman Otomatis
                        </h3>
                        <Badge variant="outline" className="text-[10px]">Gemini 3 Flash RAG</Badge>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4 leading-relaxed">
                        <li><strong className="text-foreground">Logika Induktif:</strong> Penarikan kesimpulan dari kasus khusus ke umum (probabilistik).</li>
                        <li><strong className="text-foreground">Logika Deduktif:</strong> Penarikan kesimpulan dari hukum umum ke khusus (silogisme pasti).</li>
                        <li><strong className="text-foreground">Rumus Cepat Modus Ponens:</strong> Jika $P \to Q$ dan $P$ terjadi, maka $Q$ pasti terjadi.</li>
                    </ul>
                </Card>
            )}

            {/* Post-Material Practice */}
            <Card className="rounded-2xl p-5 border-primary/20 bg-primary/5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Latihan Pasca-Materi</h3>
                        <p className="text-xs text-muted-foreground">Uji pemahaman materi yang baru saja dipelajari</p>
                    </div>
                </div>
                <div className="p-4 rounded-xl border bg-muted/30 text-xs text-muted-foreground leading-relaxed">
                    <p className="text-foreground">Soal latihan diambil dari pool soal yang relevan dengan:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>Bab: Logika Formal</li>
                        <li>Topik: Logika Induktif &amp; Deduktif</li>
                        <li>Capaian Pembelajaran: Menganalisis validitas argumen</li>
                    </ul>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                    <Link href={`/student/practice/material/${resolvedParams.materialId}`} className="flex-1 min-w-[180px]">
                        <Button size="sm" className="text-xs font-bold w-full">
                            <Play className="mr-1.5 h-3.5 w-3.5" /> Mulai Latihan 10 Soal
                        </Button>
                    </Link>
                    <Link href={`/student/practice/material/${resolvedParams.materialId}`} className="flex-1 min-w-[180px]">
                        <Button variant="outline" size="sm" className="text-xs font-semibold w-full">
                            <Target className="mr-1.5 h-3.5 w-3.5" /> Mode Adaptif (IRT)
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
