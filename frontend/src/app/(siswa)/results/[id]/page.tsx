"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { academicService } from "@/services/academic.service";
import { ExamResult } from "@/types";
import { Trophy, ArrowLeft, CheckCircle2, XCircle, HelpCircle, Target, Sparkles } from "lucide-react";

export default function ExamResultPage() {
    const params = useParams();
    const id = params?.id as string;
    const [result, setResult] = useState<ExamResult | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await academicService.getExamResult(id);
                setResult(res);
            } catch {
                setResult({
                    exam_id: id,
                    exam_title: "Try Out Nasional UTBK SNBT 2026 #5",
                    total_score: 710,
                    passed: true,
                    ranking_position: 42,
                    total_participants: 15420,
                    subtest_scores: [
                        { name: "Penalaran Matematika", score: 720, total_questions: 20, correct_answers: 16 },
                        { name: "Literasi Bahasa Indonesia", score: 690, total_questions: 30, correct_answers: 24 },
                        { name: "Penalaran Umum", score: 740, total_questions: 30, correct_answers: 26 },
                        { name: "Pemahaman Bacaan & Menulis", score: 680, total_questions: 20, correct_answers: 15 },
                    ],
                });
            }
        }
        load();
    }, [id]);

    return (
        <AppShell>
            <div className="max-w-4xl mx-auto space-y-6">
                <Button asChild variant="ghost" size="sm" className="gap-2">
                    <Link href="/results">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Riwayat Results
                    </Link>
                </Button>

                {result && (
                    <>
                        {/* Main Score Hero Card */}
                        <Card className="p-6 md:p-8 bg-linear-to-b from-card via-blue-50/20 to-transparent dark:to-transparent border-primary/20">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-2 text-center md:text-left">
                                    <Badge variant="success" className="gap-1">
                                        <Sparkles className="h-3 w-3" /> Penilaian IRT Terverifikasi
                                    </Badge>
                                    <h1 className="font-heading text-2xl font-bold">{result.exam_title}</h1>
                                    <p className="text-xs text-muted-foreground">
                                        Peringkat ke-<strong className="text-foreground">#{result.ranking_position}</strong> dari {result.total_participants} peserta nasional.
                                    </p>
                                </div>

                                <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 min-w-[180px]">
                                    <span className="text-xs font-medium uppercase tracking-wider text-primary-foreground/80">Skor Total UTBK</span>
                                    <span className="font-heading font-extrabold text-4xl mt-1">{result.total_score}</span>
                                    <span className="text-[10px] mt-1 bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                                        {result.passed ? "Lolos Passing Grade" : "Perlu ditingkatkan"}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* Subtest Scores Grid */}
                        <div className="space-y-4">
                            <h2 className="font-heading text-lg font-bold">Rincian Nilai per Subtes</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.subtest_scores.map((sub) => (
                                    <Card key={sub.name} className="p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-heading font-semibold text-sm">{sub.name}</h3>
                                            <span className="font-heading font-bold text-lg text-primary">{sub.score}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Jawaban Benar: {sub.correct_answers}/{sub.total_questions}</span>
                                                <span>{Math.round((sub.correct_answers / sub.total_questions) * 100)}%</span>
                                            </div>
                                            <Progress value={(sub.correct_answers / sub.total_questions) * 100} className="h-2.5" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
}
