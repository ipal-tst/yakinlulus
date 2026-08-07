"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { academicService } from "@/services/academic.service";
import { Exam } from "@/types";
import { ArrowLeft, Clock, HelpCircle, ShieldAlert, Play, CheckCircle2 } from "lucide-react";

export default function ExamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [exam, setExam] = useState<Exam | null>(null);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await academicService.getExamById(id);
                setExam(res);
            } catch {
                setExam({
                    id,
                    title: "Try Out Nasional UTBK SNBT 2026 #5",
                    description: "Simulasi ujian lengkap 7 Subtes dengan penilaian IRT (Item Response Theory).",
                    duration_minutes: 195,
                    total_questions: 155,
                    is_active: true,
                    created_at: "2026-03-01",
                });
            }
        }
        load();
    }, [id]);

    const handleStartExam = async () => {
        setStarting(true);
        try {
            // Create session in backend or navigate to CBT
            router.push(`/exams/${id}/cbt`);
        } catch {
            alert("Gagal memulai sesi ujian");
        } finally {
            setStarting(false);
        }
    };

    return (
        <AppShell>
            <div className="max-w-3xl mx-auto space-y-6">
                <Button asChild variant="ghost" size="sm" className="gap-2">
                    <Link href="/exams">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog
                    </Link>
                </Button>

                {exam && (
                    <Card className="p-6 md:p-8 space-y-6">
                        <div className="space-y-3 pb-6 border-b border-border">
                            <Badge variant="default" className="text-xs">
                                Simulasi Ujian UTBK SNBT
                            </Badge>
                            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
                                {exam.title}
                            </h1>
                            <p className="text-sm text-muted-foreground">{exam.description}</p>
                        </div>

                        {/* Overview Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-primary" /> Durasi Pengerjaan
                                </span>
                                <span className="font-heading font-bold text-lg text-foreground mt-1 block">
                                    {exam.duration_minutes} Menit
                                </span>
                            </div>
                            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <HelpCircle className="h-4 w-4 text-primary" /> Jumlah Soal
                                </span>
                                <span className="font-heading font-bold text-lg text-foreground mt-1 block">
                                    {exam.total_questions} Soal
                                </span>
                            </div>
                            <div className="p-4 rounded-2xl bg-secondary/50 border border-border col-span-2 sm:col-span-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" /> Metode Scoring
                                </span>
                                <span className="font-heading font-bold text-lg text-foreground mt-1 block">
                                    IRT Standard
                                </span>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-3 p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50">
                            <h3 className="font-heading font-semibold text-sm text-orange-900 dark:text-orange-300 flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4" /> Petunjuk Pengerjaan CBT
                            </h3>
                            <ul className="text-xs text-orange-800 dark:text-orange-400 space-y-1.5 list-disc pl-5">
                                <li>Pastikan koneksi internet Anda stabil selama ujian.</li>
                                <li>Jawaban Anda tersimpan otomatis (auto-save) setiap kali memilih opsi.</li>
                                <li>Waktu akan terus berjalan setelah Anda menekan tombol "Mulai Ujian".</li>
                                <li>Gunakan tombol "Ragu-ragu" untuk menandai soal yang ingin diperiksa kembali.</li>
                            </ul>
                        </div>

                        {/* Start CTA */}
                        <Button
                            onClick={handleStartExam}
                            disabled={starting}
                            className="w-full h-12 rounded-xl text-base font-bold shadow-md gap-2"
                        >
                            <Play className="h-5 w-5 fill-current" />
                            {starting ? "Memulai Ujian..." : "Mulai Ujian CBT Sekarang"}
                        </Button>
                    </Card>
                )}
            </div>
        </AppShell>
    );
}
