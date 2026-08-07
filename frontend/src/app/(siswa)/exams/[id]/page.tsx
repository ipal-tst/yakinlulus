// frontend/src/app/(siswa)/exams/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { academicService } from "@/services/academic.service";
import { Exam, ExamSubtestRule } from "@/types";
import {
    ArrowLeft,
    Clock,
    HelpCircle,
    ShieldAlert,
    Play,
    CheckCircle2,
    Sparkles,
    Layers,
    BookOpen,
    Zap,
    Info,
    AlertCircle,
    Sliders,
    Award,
} from "lucide-react";

export default function ExamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await academicService.getExamById(id);
                if (res) {
                    setExam(res);
                } else {
                    setExam(getFallbackExamById(id));
                }
            } catch {
                setExam(getFallbackExamById(id));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    function getFallbackExamById(examId: string): Exam {
        if (examId === "ex-2") {
            return {
                id: "ex-2",
                title: "Try Out SIMAK UI Kemampuan IPA & IPS #2",
                description: "Latihan Ujian Mandiri Universitas Indonesia dengan skema penilaian sistem minus (+4 untuk benar, -1 untuk salah, 0 jika kosong).",
                category: "UM_PTN",
                scoring_system: "NEGATIVE_MARKING",
                difficulty: "HOTS",
                default_mode: "SIMULASI",
                duration_minutes: 120,
                total_questions: 90,
                is_active: true,
                created_at: "2026-02-28",
                subtests: [
                    { id: "st-simak-1", subtest_name: "Kemampuan Dasar (Matematika & B. Indonesia)", duration_minutes: 60, pool_question_ids: [], sample_question_count: 45 },
                    { id: "st-simak-2", subtest_name: "Kemampuan Saintek / Soshum", duration_minutes: 60, pool_question_ids: [], sample_question_count: 45 },
                ],
            };
        } else if (examId === "ex-3") {
            return {
                id: "ex-3",
                title: "Try Out Sekolah SMAN 1 Jakarta - PAS Genap",
                description: "Simulasi Ujian Sekolah Standar Kurikulum Merdeka untuk Evaluasi Rapor & PTS/PAS Genap.",
                category: "PTS_UAS",
                scoring_system: "STANDARD_POINTS",
                difficulty: "MEDIUM",
                default_mode: "SANTAI",
                duration_minutes: 90,
                total_questions: 50,
                is_active: true,
                created_at: "2026-02-20",
            };
        } else if (examId.startsWith("pr-") || examId.startsWith("ex-uh")) {
            return {
                id: examId,
                title: "Drill Spesial Bab: Penalaran Matematika & Aljabar",
                description: "Paket latihan drill fokus bab tertentu buatan admin untuk menguji pemahaman konsep secara mendalam.",
                category: "UJIAN_BAB",
                scoring_system: "STANDARD_POINTS",
                difficulty: "MEDIUM",
                default_mode: "SANTAI",
                duration_minutes: 30,
                total_questions: 20,
                is_active: true,
                created_at: "2026-03-01",
            };
        }

        // Default UTBK fallback
        return {
            id: examId || "ex-1",
            title: "Try Out Nasional UTBK SNBT 2026 #5",
            description: "Simulasi ujian lengkap 7 Subtes (TPS & Literasi) dengan penilaian IRT Item Response Theory skala 200 - 1000.",
            category: "UTBK_SNBT",
            scoring_system: "IRT",
            difficulty: "HARD",
            default_mode: "SIMULASI",
            duration_minutes: 195,
            total_questions: 155,
            is_active: true,
            created_at: "2026-03-01",
            subtests: [
                { id: "st-1", subtest_name: "Penalaran Umum (PU)", duration_minutes: 30, pool_question_ids: [], sample_question_count: 30 },
                { id: "st-2", subtest_name: "Pengetahuan & Pemahaman Umum (PPU)", duration_minutes: 15, pool_question_ids: [], sample_question_count: 20 },
                { id: "st-3", subtest_name: "Memahami Bacaan & Menulis (PBM)", duration_minutes: 25, pool_question_ids: [], sample_question_count: 20 },
                { id: "st-4", subtest_name: "Pengetahuan Kuantitatif (PK)", duration_minutes: 20, pool_question_ids: [], sample_question_count: 15 },
                { id: "st-5", subtest_name: "Literasi Bahasa Indonesia", duration_minutes: 45, pool_question_ids: [], sample_question_count: 30 },
                { id: "st-6", subtest_name: "Literasi Bahasa Inggris", duration_minutes: 30, pool_question_ids: [], sample_question_count: 20 },
                { id: "st-7", subtest_name: "Penalaran Matematika (PM)", duration_minutes: 30, pool_question_ids: [], sample_question_count: 20 },
            ],
        };
    }

    const handleStartExam = async () => {
        setStarting(true);
        try {
            router.push(`/exams/${id}/cbt`);
        } catch {
            alert("Gagal memulai sesi ujian");
        } finally {
            setStarting(false);
        }
    };

    if (loading) {
        return (
            <AppShell>
                <div className="max-w-3xl mx-auto p-12 text-center text-xs text-muted-foreground font-medium">
                    Memuat petunjuk ujian...
                </div>
            </AppShell>
        );
    }

    if (!exam) return null;

    const isIRT = exam.scoring_system === "IRT";
    const isNegative = exam.scoring_system === "NEGATIVE_MARKING";
    const isStandard = exam.scoring_system === "STANDARD_POINTS" || !exam.scoring_system;

    return (
        <AppShell>
            <div className="max-w-4xl mx-auto space-y-6 font-sans">
                <Button asChild variant="ghost" size="sm" className="gap-2 rounded-xl text-xs">
                    <Link href="/exams">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog Ujian
                    </Link>
                </Button>

                <Card className="p-6 md:p-8 space-y-6 rounded-3xl border border-border shadow-xs">
                    {/* Exam Identity Header */}
                    <div className="space-y-3 pb-6 border-b border-border">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="default" className="text-[11px] font-bold">
                                {exam.category === "UTBK_SNBT"
                                    ? "Simulasi UTBK SNBT"
                                    : exam.category === "UM_PTN"
                                        ? "Ujian Mandiri PTN"
                                        : exam.category === "PTS_UAS"
                                            ? "PTS / UAS Sekolah"
                                            : exam.category === "UJIAN_BAB"
                                                ? "Latihan Per-Bab"
                                                : "Paket Ujian Special"}
                            </Badge>

                            <Badge variant="outline" className="text-[11px] font-bold border-primary/40 text-primary">
                                {isIRT ? "Scoring IRT (200-1000)" : isNegative ? "Sistem Minus (+4/-1)" : "Poin Standar (0-100)"}
                            </Badge>

                            {exam.difficulty && (
                                <Badge variant="secondary" className="text-[11px]">
                                    Level: {exam.difficulty}
                                </Badge>
                            )}

                            {exam.default_mode && (
                                <Badge variant="outline" className="text-[11px]">
                                    {exam.default_mode === "SANTAI" ? "Mode Santai" : "Mode Simulasi Timer"}
                                </Badge>
                            )}
                        </div>

                        <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-snug">
                            {exam.title}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{exam.description}</p>
                    </div>

                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                <Clock className="h-4 w-4 text-primary shrink-0" /> Total Durasi
                            </span>
                            <span className="font-heading font-bold text-lg text-foreground block">
                                {exam.duration_minutes} Menit
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                <HelpCircle className="h-4 w-4 text-primary shrink-0" /> Jumlah Soal
                            </span>
                            <span className="font-heading font-bold text-lg text-foreground block">
                                {exam.total_questions} Soal
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-1 col-span-2 sm:col-span-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                <Award className="h-4 w-4 text-emerald-600 shrink-0" /> Skema Penilaian
                            </span>
                            <span className="font-heading font-bold text-sm sm:text-base text-foreground block">
                                {isIRT ? "IRT National Standard" : isNegative ? "Minus System (+4/-1)" : "Skala 0 - 100"}
                            </span>
                        </div>
                    </div>

                    {/* Dynamic Subtests Breakdown List */}
                    {exam.subtests && exam.subtests.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary" /> Rincian {exam.subtests.length} Subtes Ujian
                            </h3>

                            <div className="space-y-2">
                                {exam.subtests.map((st, idx) => (
                                    <div
                                        key={st.id}
                                        className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <span className="font-bold text-foreground">{st.subtest_name}</span>
                                        </div>

                                        <div className="flex items-center gap-3 text-muted-foreground font-medium shrink-0">
                                            <span>{st.sample_question_count} Soal</span>
                                            <span>•</span>
                                            <span className="text-primary font-bold">{st.duration_minutes} Menit</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contextual Scoring Rules Box */}
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
                        <h3 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                            <Info className="h-4 w-4 text-primary" /> Aturan Penilaian Ujian Ini
                        </h3>
                        {isIRT && (
                            <p className="text-muted-foreground leading-relaxed">
                                Ujian ini menggunakan <strong>Item Response Theory (IRT)</strong>. Bobot setiap soal ditentukan secara statistik setelah seluruh peserta selesai mengerjakan. Soal sulit bernilai lebih tinggi, dan <strong>TIDAK ADA pengurangan nilai</strong> untuk jawaban salah.
                            </p>
                        )}
                        {isNegative && (
                            <p className="text-muted-foreground leading-relaxed">
                                Ujian ini menggunakan <strong>Sistem Minus</strong>. Setiap jawaban <strong>Benar bernilai +4</strong>, <strong>Salah bernilai -1</strong>, dan <strong>Kosong bernilai 0</strong>. Disarankan tidak menebak acak jika ragu.
                            </p>
                        )}
                        {isStandard && (
                            <p className="text-muted-foreground leading-relaxed">
                                Ujian ini menggunakan <strong>Poin Standar (0 - 100)</strong>. Setiap soal memiliki bobot poin seimbang. Nilai akhir dihitung proporsional dari total jawaban benar yang kamu peroleh.
                            </p>
                        )}
                    </div>

                    {/* Instructions & Guidelines */}
                    <div className="space-y-3 p-4.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-300">
                        <h3 className="font-semibold text-xs flex items-center gap-2 text-amber-900 dark:text-amber-200">
                            <ShieldAlert className="h-4 w-4 text-amber-600" /> Petunjuk Pengerjaan CBT System
                        </h3>
                        <ul className="text-xs space-y-1.5 list-disc pl-5 leading-relaxed text-amber-800 dark:text-amber-400">
                            <li>Pastikan koneksi internet Anda stabil selama pengerjaan ujian.</li>
                            <li>Setiap jawaban tersimpan otomatis (*auto-save*) di server saat Anda memilih opsi A/B/C/D/E.</li>
                            <li>Waktu ujian akan terus berjalan secara otomatis begitu Anda menekan tombol "Mulai Ujian".</li>
                            <li>Gunakan fitur "Ragu-Ragu" untuk menandai nomor soal yang perlu ditinjau ulang sebelum submit.</li>
                        </ul>
                    </div>

                    {/* Start CTA */}
                    <Button
                        onClick={handleStartExam}
                        disabled={starting}
                        className="w-full h-12 rounded-2xl text-sm font-bold shadow-xs gap-2"
                    >
                        <Play className="h-5 w-5 fill-current" />
                        {starting ? "Membuat Sesi Ujian..." : "Mulai Ujian CBT Sekarang"}
                    </Button>
                </Card>
            </div>
        </AppShell>
    );
}
