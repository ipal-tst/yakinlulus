"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    XCircle,
    Trophy,
    ArrowLeft,
    RotateCcw,
    Sparkles,
    BookOpen,
    HelpCircle
} from "lucide-react";

export default function StudentPracticeResultPage({ params }: { params: Promise<{ practiceId: string }> }) {
    const resolvedParams = React.use(params);

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <Badge variant="success" className="text-[10px] font-bold">LATIHAN SELESAI</Badge>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Hasil & Pembahasan Latihan</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Paket: {resolvedParams.practiceId.toUpperCase()} • Tanggal: 26 Juli 2026
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/student/practice">
                        <Button variant="outline" size="sm" className="text-xs font-semibold">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Hub
                        </Button>
                    </Link>
                    <Link href={`/student/practice/${resolvedParams.practiceId}`}>
                        <Button size="sm" className="text-xs font-bold">
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Ulangi Latihan
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/10 border-primary/20 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground font-semibold">Skor IRT Latihan</span>
                    <div className="my-2">
                        <span className="text-4xl font-black text-primary">690</span>
                        <span className="text-xs text-muted-foreground block">Tingkat Kesulitan: Medium/Hard</span>
                    </div>
                    <Badge variant="default" className="text-[10px] w-fit font-bold">+50 XP Diperoleh</Badge>
                </Card>

                <Card className="p-6 flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground font-semibold">Akurasi Jawaban</span>
                    <div className="my-2 flex items-center gap-3">
                        <span className="text-3xl font-black text-success">8 / 10</span>
                        <span className="text-xs font-bold text-success font-mono">(80%)</span>
                    </div>
                    <span className="text-xs text-muted-foreground">8 Benar • 2 Salah</span>
                </Card>

                <Card className="p-6 flex flex-col justify-between border-indigo-500/20 bg-indigo-500/5">
                    <span className="text-xs text-indigo-500 font-bold flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> AI Insight Rekomendasi
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed my-2">
                        Kelemahan Anda ada pada <strong className="text-foreground">Sifat Determinan Matriks Ordo 3x3</strong>. Pelajari kembali Modul BAB 4.
                    </p>
                    <Link href="/student/materials/mat-04">
                        <Button variant="outline" size="sm" className="text-xs font-semibold w-full">
                            Buka Modul Bab 4
                        </Button>
                    </Link>
                </Card>
            </div>

            {/* Pembahasan Detail */}
            <Card className="p-6 space-y-6">
                <h3 className="font-bold text-base border-b pb-2">Pembahasan & Rationalization Soal No. 1</h3>

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
