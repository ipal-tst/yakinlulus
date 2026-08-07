"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { academicService } from "@/services/academic.service";
import { Exam } from "@/types";
import { FileCheck, Clock, HelpCircle, ArrowRight, Sparkles } from "lucide-react";

export default function ExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await academicService.getExams();
                setExams(res);
            } catch {
                setExams([
                    {
                        id: "ex-1",
                        title: "Try Out Nasional UTBK SNBT 2026 #5",
                        description: "Simulasi ujian lengkap 7 Subtes dengan penilaian IRT (Item Response Theory).",
                        duration_minutes: 195,
                        total_questions: 155,
                        is_active: true,
                        created_at: "2026-03-01",
                    },
                    {
                        id: "ex-2",
                        title: "Drill Subtes Penalaran Matematika #3",
                        description: "Latihan intensif khusus Penalaran Matematika 20 soal dengan pembahasan AI.",
                        duration_minutes: 30,
                        total_questions: 20,
                        is_active: true,
                        created_at: "2026-02-28",
                    },
                    {
                        id: "ex-3",
                        title: "Try Out Sekolah SMAN 1 Jakarta - Simulasi #1",
                        description: "Try out khusus siswa SMA Negeri 1 Jakarta.",
                        duration_minutes: 195,
                        total_questions: 155,
                        is_active: true,
                        created_at: "2026-02-20",
                    },
                ]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <AppShell>
            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Katalog Try Out & Ujian</h1>
                    <p className="text-sm text-muted-foreground">Pilih paket Try Out UTBK SNBT berstandar nasional dengan penilaian IRT asli.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map((exam) => (
                        <Card key={exam.id} className="flex flex-col justify-between hover:border-primary transition-all">
                            <CardHeader className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Badge variant="default" className="text-[10px] gap-1">
                                        <Sparkles className="h-3 w-3" /> Standard IRT
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px]">
                                        Tersedia
                                    </Badge>
                                </div>
                                <CardTitle className="text-base">{exam.title}</CardTitle>
                                <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-4">
                                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/50 text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5 text-primary" />
                                        <span>{exam.duration_minutes} Menit</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <HelpCircle className="h-3.5 w-3.5 text-primary" />
                                        <span>{exam.total_questions} Soal</span>
                                    </div>
                                </div>

                                <Button asChild className="w-full rounded-xl font-medium shadow-xs">
                                    <Link href={`/exams/${exam.id}`}>
                                        Lihat Detail & Mulai <ArrowRight className="h-4 w-4 ml-1" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}
