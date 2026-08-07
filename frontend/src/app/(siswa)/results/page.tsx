"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, Trophy, ArrowRight } from "lucide-react";

export default function ResultsHistoryPage() {
    const [results] = useState([
        {
            id: "ex-1",
            title: "Try Out Nasional UTBK SNBT 2026 #5",
            score: 710,
            date: "2026-03-01",
            rank: 42,
            passed: true,
        },
        {
            id: "ex-2",
            title: "Drill Subtes Penalaran Matematika #3",
            score: 660,
            date: "2026-02-25",
            rank: 115,
            passed: true,
        },
    ]);

    return (
        <AppShell>
            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Riwayat Hasil Try Out</h1>
                    <p className="text-sm text-muted-foreground">Lihat perkembangan skor UTBK dan rincian pembahasan soal.</p>
                </div>

                <div className="space-y-4">
                    {results.map((r) => (
                        <Card key={r.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant={r.passed ? "success" : "outline"} className="text-[10px]">
                                        {r.passed ? "Lolos Target" : "Evaluasi"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{r.date}</span>
                                </div>
                                <h3 className="font-heading font-bold text-base text-foreground">{r.title}</h3>
                                <p className="text-xs text-muted-foreground">Peringkat #{r.rank} Nasional</p>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto justify-between border-t md:border-t-0 pt-3 md:pt-0 border-border">
                                <div className="text-right">
                                    <span className="font-heading font-extrabold text-2xl text-primary">{r.score}</span>
                                    <span className="block text-[10px] text-muted-foreground">Skor UTBK</span>
                                </div>
                                <Button asChild className="rounded-xl font-medium">
                                    <Link href={`/results/${r.id}`}>
                                        Lihat Pembahasan <ArrowRight className="h-4 w-4 ml-1" />
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}
