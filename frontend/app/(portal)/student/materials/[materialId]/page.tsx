"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Play,
    FileText,
    Sparkles,
    CheckCircle2,
    BookOpen,
    HelpCircle,
    Bot,
    Download,
    Share2,
    Bookmark,
    Zap,
    Target,
} from "lucide-react";

export default function StudentMaterialDetailPage({ params }: { params: Promise<{ materialId: string }> }) {
    const resolvedParams = React.use(params);
    const [isAiSummaryOpen, setIsAiSummaryOpen] = React.useState(false);

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Navigation */}
            <div className="flex items-center justify-between border-b pb-4">
                <Link href="/student/materials">
                    <Button variant="ghost" size="sm" className="text-xs font-semibold">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Katalog Materi
                    </Button>
                </Link>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                        <Bookmark className="mr-2 h-3.5 w-3.5 text-primary" /> Bookmark
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsAiSummaryOpen(!isAiSummaryOpen)}
                        className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                    >
                        <Sparkles className="mr-2 h-3.5 w-3.5" /> AI Summary & Flashcards
                    </Button>
                </div>
            </div>

            {/* Video Player Section */}
            <Card className="p-6 space-y-4 overflow-hidden border-primary/20">
                <div className="flex items-center justify-between">
                    <div>
                        <Badge variant="default" className="text-[10px] font-bold">VIDEO PEMBAHASAN HD</Badge>
                        <h1 className="text-2xl font-black tracking-tight mt-1">
                            Konsep Dasar Logika Induktif & Deduktif UTBK SNBT
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Penalaran Umum • Bab 1 Logika Formal • Durasi: 18 Menit
                        </p>
                    </div>
                </div>

                <div className="aspect-video w-full rounded-2xl bg-black/90 flex flex-col items-center justify-center text-white space-y-3 relative overflow-hidden border">
                    <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl shadow-primary/50 cursor-pointer hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 fill-white translate-x-0.5" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">[ Video Stream Player HD 1080p Enabled ]</span>
                </div>
            </Card>

            {/* AI Summary Drawer / Container */}
            {isAiSummaryOpen && (
                            <Card className="p-6 border-indigo-500/30 bg-gradient-to-br from-card via-card to-indigo-500/5 space-y-3 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="font-bold text-sm text-indigo-500 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" /> AI Rangkuman Otomatis (Flashcards)
                                    </h3>
                                    <Badge variant="outline" className="text-[10px]">Gemini 3 Flash RAG</Badge>
                                </div>
                                <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4 leading-relaxed">
                                    <li><strong className="text-foreground">Logika Induktif:</strong> Penarikan kesimpulan dari kasus khusus ke umum (probabilistik).</li>
                                    <li><strong className="text-foreground">Logika Deduktif:</strong> Penarikan kesimpulan dari hukum umum ke khusus (silogisme pasti).</li>
                                    <li><strong className="text-foreground">Rumus Cepat Modus Ponens:</strong> Jika $P \\to Q$ dan $P$ terjadi, maka $Q$ pasti terjadi.</li>
                                </ul>
                            </Card>
                        )}

                        {/* Post-Material Practice Section */}
                        <Card className="p-6 border-primary/20 bg-primary/5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Zap className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Latihan Pasca-Materi</h3>
                                    <p className="text-xs text-muted-foreground">Uji pemahaman materi yang baru saja dipelajari</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl border bg-muted/30 text-xs text-muted-foreground leading-relaxed font-mono">
                                <p className="text-foreground">Soal latihan diambil dari pool soal yang relevan dengan:</p>
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li>Bab: Logika Formal</li>
                                    <li>Topik: Logika Induktif & Deduktif</li>
                                    <li>Capaian Pembelajaran: Menganalisis validitas argumen</li>
                                </ul>
                            </div>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Link href={`/student/practice/material/${resolvedParams.materialId}`}>
                                    <Button size="sm" className="text-xs font-bold shadow-md shadow-primary/20 flex-1 min-w-[180px]">
                                        <Play className="mr-1.5 h-3.5 w-3.5" /> Mulai Latihan 10 Soal
                                    </Button>
                                </Link>
                                <Button variant="outline" size="sm" className="text-xs font-semibold flex-1 min-w-[180px]">
                                    <Target className="mr-1.5 h-3.5 w-3.5" /> Mode Adaptif (IRT)
                                </Button>
                            </div>
                        </Card>

                        {/* Text & KaTeX Content */}
            <Card className="p-6 space-y-4">
                <h3 className="font-bold text-base border-b pb-2">Catatan Modul & Formula KaTeX</h3>
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed font-mono">
                    <p className="text-foreground">
                        Dalam ujian SNBT UTBK, penalaran logika sering dikombinasikan dengan pernyataan matematika kuantitatif:
                    </p>
                    <div className="p-4 rounded-xl border bg-muted/30 text-foreground font-bold">
                        Pernyataan 1: Jika $x &gt; 5$, maka $x^2 + 2x &gt; 35$. <br />
                        Pernyataan 2: Diketahui $x = 7$. <br />
                        Kesimpulan: $7^2 + 2(7) = 49 + 14 = 63 &gt; 35$ (Benar via Modus Ponens).
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Siap uji pemahaman materi ini?</span>
                    <Link href="/student/practice/pu-01">
                        <Button size="sm" className="text-xs font-bold shadow-md shadow-primary/20">
                            Kerjakan Quiz Materi Ini <HelpCircle className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
