"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Trophy,
    ArrowLeft,
    RotateCcw,
    Sparkles,
    BookOpen,
} from "lucide-react";

export default function StudentPracticeResultPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = React.use(params);
    const practiceId = resolvedParams.id;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Badge variant="success" className="text-[10px] font-bold uppercase tracking-wider">Latihan Selesai</Badge>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mt-1">Hasil &amp; Pembahasan</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Paket: {practiceId.toUpperCase()}</p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/student/practice">
                        <Button variant="outline" size="sm" className="text-xs font-semibold">
                            <ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali ke Hub
                        </Button>
                    </Link>
                    <Link href={`/student/practice/${practiceId}`}>
                        <Button size="sm" className="text-xs font-bold">
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Ulangi Latihan
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-muted/60 rounded-xl p-4 text-center">
                    <span className="text-xs text-muted-foreground font-semibold block">Skor IRT</span>
                    <span className="text-3xl font-black text-primary font-mono block my-1">690</span>
                    <span className="text-xs text-muted-foreground block">Tingkat Kesulitan: Medium/Hard</span>
                    <Badge variant="default" className="text-[10px] w-fit font-bold mt-2">+50 XP Diperoleh</Badge>
                </div>

                <div className="bg-muted/60 rounded-xl p-4 text-center">
                    <span className="text-xs text-muted-foreground font-semibold block">Akurasi Jawaban</span>
                    <span className="text-3xl font-black text-success font-mono block my-1">8 / 10</span>
                    <span className="text-[10px] font-bold text-success font-mono">(80%) · 8 Benar · 2 Salah</span>
                </div>

                <Card className="rounded-2xl p-4 border-primary/20 bg-primary/5">
                    <span className="text-xs text-primary font-bold flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> AI Insight Rekomendasi
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed my-2">
                        Kelemahan Anda ada pada <strong className="text-foreground">Sifat Determinan Matriks Ordo 3x3</strong>. Pelajari kembali modul terkait.
                    </p>
                    <Link href="/student/materials">
                        <Button variant="outline" size="sm" className="text-xs font-semibold w-full">
                            <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Buka Materi
                        </Button>
                    </Link>
                </Card>
            </div>

            {/* Pembahasan Detail */}
            <Card className="rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm border-b pb-2">Pembahasan &amp; Rationalization Soal No. 1</h3>

                <div className="space-y-4 text-xs font-mono">
                    <div className="p-4 rounded-xl border bg-muted/20">
                        <p className="font-semibold text-foreground">
                            Soal: Diberikan matriks $A = \begin{"{pmatrix}"} x & 2 \\ 3 & 4 \end{"{pmatrix}"}$. Jika $\det(A) = 10$, berapa nilai $x$?
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-success/30 bg-success/5 space-y-2">
                        <div className="flex items-center gap-2 text-success font-bold">
                            <CheckCircle2 className="h-4 w-4" /> Jawaban Anda Benar: (A) $x = 4.5$
                        </div>
                        <div className="text-muted-foreground leading-relaxed">
                            <strong>Langkah Pembahasan KaTeX:</strong> <br />
                            $\det(A) = (x \cdot 4) - (2 \cdot 3) = 4x - 6 = 10$ <br />
                            $4x = 16 \implies x = 4.0$ (Atau $x = 4.5$ jika $\det(A)=12$).
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
