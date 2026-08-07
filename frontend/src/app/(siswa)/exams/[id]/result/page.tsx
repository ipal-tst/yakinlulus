// frontend/src/app/(siswa)/exams/[id]/result/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { academicService } from "@/services/academic.service";
import { Exam } from "@/types";
import {
    Trophy,
    Target,
    Flame,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Clock,
    RotateCcw,
    ArrowLeft,
    Sparkles,
    BarChart3,
    BookOpen,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    Award,
    Layers,
    Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubtestResult {
    subtestName: string;
    correct: number;
    total: number;
    irtScore: number;
}

interface QuestionDiscussion {
    id: string;
    number: number;
    subtestName: string;
    content: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    isFlagged?: boolean;
    options: { key: string; text: string }[];
    solution: string;
}

export default function ExamResultPage() {
    const params = useParams();
    const id = params?.id as string;
    const { user } = useAuthStore();

    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<"ALL" | "CORRECT" | "INCORRECT" | "SKIPPED">("ALL");
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>("q-1");

    // Student Target University & Performance Summary
    const studentTarget = {
        university: user?.school_name || "Universitas Indonesia",
        major: user?.major || "Teknik Informatika",
        targetScore: 720,
        achievedScore: 685,
        passingProbability: 95,
        nationalRank: 42,
        totalParticipants: 3450,
    };

    const mockSubtests: SubtestResult[] = [
        { subtestName: "Penalaran Umum (PU)", correct: 26, total: 30, irtScore: 740 },
        { subtestName: "Pengetahuan Kuantitatif (PK)", correct: 13, total: 15, irtScore: 820 },
        { subtestName: "Literasi Bahasa Indonesia", correct: 25, total: 30, irtScore: 670 },
        { subtestName: "Literasi Bahasa Inggris", correct: 16, total: 20, irtScore: 650 },
        { subtestName: "Penalaran Matematika (PM)", correct: 15, total: 20, irtScore: 645 },
    ];

    const mockDiscussions: QuestionDiscussion[] = [
        {
            id: "q-1",
            number: 1,
            subtestName: "Penalaran Kuantitatif",
            content: "Jika x + y = 10 dan xy = 21, maka berapakah nilai dari x² + y²?",
            userAnswer: "B",
            correctAnswer: "B",
            isCorrect: true,
            options: [
                { key: "A", text: "58" },
                { key: "B", text: "58 (Hasil perhitungan x² + y² = 100 - 42 = 58)" },
                { key: "C", text: "79" },
                { key: "D", text: "100" },
                { key: "E", text: "142" },
            ],
            solution: "Gunakan identitas aljabar kuadrat sempurna:\n(x + y)² = x² + 2xy + y²\n\nSubstitusikan nilai yang diketahui:\n(10)² = x² + 2(21) + y²\n100 = x² + 42 + y²\nx² + y² = 100 - 42 = 58.\n\nJadi, nilai x² + y² adalah 58 (Pilihan B).",
        },
        {
            id: "q-2",
            number: 2,
            subtestName: "Penalaran Logis",
            content: "Semua mahasiswa peserta seminar membawa kartu tanda mahasiswa. Sebagian peserta seminar memakai kemeja putih. Manakah kesimpulan yang paling tepat dari pernyataan tersebut?",
            userAnswer: "A",
            correctAnswer: "B",
            isCorrect: false,
            options: [
                { key: "A", text: "Semua peserta seminar memakai kemeja putih" },
                { key: "B", text: "Sebagian mahasiswa peserta seminar memakai kemeja putih" },
                { key: "C", text: "Semua mahasiswa tidak memakai kemeja putih" },
                { key: "D", text: "Sebagian peserta seminar tidak membawa kartu tanda mahasiswa" },
                { key: "E", text: "Tidak dapat ditarik kesimpulan dari kedua pernyataan di atas" },
            ],
            solution: "Premis 1: Semua mahasiswa peserta seminar membawa KTM (Universal Afirmatif).\nPremis 2: Sebagian peserta seminar memakai kemeja putih (Partikular Afirmatif).\n\nKombinasi premis universal + partikular menghasilkan kesimpulan partikular:\n'Sebagian mahasiswa peserta seminar memakai kemeja putih' (Pilihan B).",
        },
        {
            id: "q-3",
            number: 3,
            subtestName: "Penalaran Matematika",
            content: "Sebuah tangki air awal mula terisi 3/5 bagian dari total volumenya. Jika ke dalam tangki tersebut ditambahkan 12 liter air, tangki tersebut menjadi terisi 3/4 bagian. Berapakah kapasitas volume total dari tangki tersebut?",
            userAnswer: "B",
            correctAnswer: "B",
            isCorrect: true,
            options: [
                { key: "A", text: "60 liter" },
                { key: "B", text: "80 liter" },
                { key: "C", text: "90 liter" },
                { key: "D", text: "120 liter" },
                { key: "E", text: "150 liter" },
            ],
            solution: "Misalkan volume total tangki = V liter.\n\nSelisih bagian saat ditambahkan 12 liter:\n(3/4)V - (3/5)V = 12\n\nSamakan penyebut (per 20):\n(15/20)V - (12/20)V = 12\n(3/20)V = 12\nV = (12 × 20) / 3 = 80 liter.\n\nJadi, volume total tangki adalah 80 liter (Pilihan B).",
        },
        {
            id: "q-4",
            number: 4,
            subtestName: "Literasi Bahasa Indonesia",
            content: "Cermati kutipan teks berikut:\n\n'Peningkatan literasi digital di Indonesia merupakan langkah krusial dalam menghadapi era akselerasi teknologi informasi. Meskipun infrastruktur jaringan internet di berbagai pelosok daerah terus dibangun, pemanfaatan internet untuk kegiatan produktif dan edukatif masih tergolong rendah.'\n\nGagasan utama paragraf di atas adalah...",
            userAnswer: "B",
            correctAnswer: "B",
            isCorrect: true,
            options: [
                { key: "A", text: "Pengembangan infrastruktur jaringan di daerah pelosok" },
                { key: "B", text: "Pentingnya literasi digital dan pemanfaatan internet secara edukatif" },
                { key: "C", text: "Akselerasi teknologi informasi di kawasan Asia Tenggara" },
                { key: "D", text: "Rendahnya harga paket kuota internet di sekolah dasar" },
                { key: "E", text: "Integrasi sistem kecerdasan buatan dalam kurikulum nasional" },
            ],
            solution: "Kalimat utama berada di awal paragraf: 'Peningkatan literasi digital di Indonesia merupakan langkah krusial...'. Gagasan utama dari paragraf tersebut membahas pentingnya literasi digital serta pemanfaatan internet untuk hal produktif dan edukatif (Pilihan B).",
        },
        {
            id: "q-5",
            number: 5,
            subtestName: "Pengetahuan Kuantitatif",
            content: "Diberikan sekumpulan data statistik: 4, 7, 2, 9, 12, 15, 8. Berapakah nilai median dari data tersebut?",
            userAnswer: "",
            correctAnswer: "B",
            isCorrect: false,
            isFlagged: true,
            options: [
                { key: "A", text: "7" },
                { key: "B", text: "8" },
                { key: "C", text: "9" },
                { key: "D", text: "10" },
                { key: "E", text: "12" },
            ],
            solution: "Langkah 1: Urutkan data dari terkecil ke terbesar:\n2, 4, 7, 8, 9, 12, 15 (Total n = 7 data)\n\nLangkah 2: Karena n = 7 (ganjil), median adalah nilai data ke-((7+1)/2) = data ke-4.\n\nData ke-4 adalah 8.\nJadi, median data tersebut adalah 8 (Pilihan B).",
        },
    ];

    useEffect(() => {
        async function load() {
            try {
                const res = await academicService.getExamById(id);
                if (res) setExam(res);
                else setExam(getFallbackExam(id));
            } catch {
                setExam(getFallbackExam(id));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    function getFallbackExam(examId: string): Exam {
        return {
            id: examId,
            title: "Try Out Nasional UTBK SNBT 2026 #5",
            description: "Simulasi ujian lengkap 7 Subtes (TPS & Literasi) dengan penilaian IRT Item Response Theory skala 200 - 1000.",
            category: "UTBK_SNBT",
            scoring_system: "IRT",
            duration_minutes: 195,
            total_questions: 155,
            is_active: true,
            created_at: "2026-03-01",
        };
    }

    const filteredQuestions = mockDiscussions.filter((q) => {
        if (activeFilter === "CORRECT") return q.isCorrect;
        if (activeFilter === "INCORRECT") return !q.isCorrect && q.userAnswer !== "";
        if (activeFilter === "SKIPPED") return q.userAnswer === "";
        return true;
    });

    const totalCorrect = mockDiscussions.filter((q) => q.isCorrect).length;
    const totalIncorrect = mockDiscussions.filter((q) => !q.isCorrect && q.userAnswer !== "").length;
    const totalSkipped = mockDiscussions.filter((q) => q.userAnswer === "").length;
    const accuracyPercent = Math.round((totalCorrect / mockDiscussions.length) * 100);

    return (
        <AppShell>
            <div className="space-y-6 font-sans max-w-5xl mx-auto pb-12">
                {/* Back Link Header */}
                <div className="flex items-center justify-between">
                    <Button asChild variant="ghost" size="sm" className="gap-2 rounded-xl text-xs">
                        <Link href="/exams">
                            <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog Ujian
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 font-semibold">
                            <Link href={`/exams/${id}/cbt`}>
                                <RotateCcw className="h-3.5 w-3.5" /> Ulangi Ujian
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Score Summary & Target PTN Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Main Score & Target Gap Card */}
                    <div className="lg:col-span-8 p-6 sm:p-7 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background shadow-xs space-y-5">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-xs">
                                    <Trophy className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                        Hasil Evaluasi Ujian & Skor IRT
                                    </span>
                                    <h1 className="font-heading font-bold text-xl text-foreground">
                                        {exam?.title || "Try Out UTBK SNBT 2026"}
                                    </h1>
                                </div>
                            </div>

                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold px-3 py-1 rounded-xl gap-1">
                                <Flame className="h-3.5 w-3.5 fill-emerald-500" /> Peluang Lolos {studentTarget.passingProbability}%
                            </Badge>
                        </div>

                        {/* Achieved IRT Score Big Badge & Gap */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card/70 p-4 rounded-2xl border border-border/70">
                            <div className="sm:col-span-1 space-y-1 text-center sm:text-left">
                                <span className="text-xs text-muted-foreground font-medium">Skor IRT Kamu</span>
                                <div className="font-mono font-bold text-3xl sm:text-4xl text-primary">
                                    {studentTarget.achievedScore} <span className="text-xs font-sans text-muted-foreground font-normal">IRT</span>
                                </div>
                            </div>

                            <div className="sm:col-span-2 space-y-2 border-t sm:border-t-0 sm:border-l border-border/80 pt-3 sm:pt-0 sm:pl-4">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Target className="h-4 w-4 text-primary" /> Target: {studentTarget.university}
                                    </span>
                                    <span className="text-foreground font-mono">{studentTarget.targetScore} IRT</span>
                                </div>

                                <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden p-0.5">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.round((studentTarget.achievedScore / studentTarget.targetScore) * 100))}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span>Jurusan: {studentTarget.major}</span>
                                    <span className="font-bold text-emerald-600">Selisih: +{studentTarget.targetScore - studentTarget.achievedScore} Poin Lagi!</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* National Ranking Card */}
                    <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
                                    <Award className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Leaderboard Nasional
                                    </span>
                                    <h3 className="font-bold text-sm text-foreground">Posisi Ranking</h3>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-mono">
                                Official
                            </Badge>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-center space-y-1">
                            <span className="text-xs text-muted-foreground font-medium">Peringkat Kamu</span>
                            <div className="font-mono font-bold text-2xl sm:text-3xl text-foreground flex items-center justify-center gap-1">
                                <span className="text-primary">#{studentTarget.nationalRank}</span>
                                <span className="text-xs font-sans text-muted-foreground font-normal">/ {studentTarget.totalParticipants} Peserta</span>
                            </div>
                            <p className="text-[11px] text-emerald-600 font-semibold pt-1">
                                Top 2% Nasional Try Out UTBK 🏆
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overall Accuracy Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Jawaban Benar
                        </span>
                        <span className="font-heading font-bold text-xl text-emerald-600 block">
                            {totalCorrect} <span className="text-xs font-normal text-muted-foreground">Soal</span>
                        </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <XCircle className="h-4 w-4 text-red-500" /> Jawaban Salah
                        </span>
                        <span className="font-heading font-bold text-xl text-red-600 block">
                            {totalIncorrect} <span className="text-xs font-normal text-muted-foreground">Soal</span>
                        </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <HelpCircle className="h-4 w-4 text-amber-500" /> Kosong / Ragu
                        </span>
                        <span className="font-heading font-bold text-xl text-amber-600 block">
                            {totalSkipped} <span className="text-xs font-normal text-muted-foreground">Soal</span>
                        </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <BarChart3 className="h-4 w-4 text-primary" /> Akurasi Pengerjaan
                        </span>
                        <span className="font-heading font-bold text-xl text-primary block">
                            {accuracyPercent}%
                        </span>
                    </div>
                </div>

                {/* Subtests Breakdown Table */}
                <Card className="p-6 rounded-3xl border border-border shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" /> Rincian Performa Per-Subtes
                        </h3>
                        <Badge variant="outline" className="text-xs font-mono">
                            {mockSubtests.length} Subtes Evaluasi
                        </Badge>
                    </div>

                    <div className="space-y-2.5">
                        {mockSubtests.map((st, idx) => {
                            const percent = Math.round((st.correct / st.total) * 100);
                            return (
                                <div
                                    key={idx}
                                    className="p-4 rounded-2xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="h-7 w-7 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <span className="font-bold text-foreground block text-sm">{st.subtestName}</span>
                                            <span className="text-muted-foreground">
                                                Benar {st.correct} dari {st.total} Soal ({percent}%)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                                        <div className="w-28 h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <span className="font-mono font-bold text-sm text-primary shrink-0">
                                            {st.irtScore} <span className="text-[10px] font-sans font-normal text-muted-foreground">IRT</span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Question-by-Question Discussion Section */}
                <Card className="p-6 rounded-3xl border border-border shadow-2xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                        <div>
                            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" /> Kunci Jawaban & Pembahasan Detail
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Pelajari solusi langkah demi langkah untuk setiap soal ujian.
                            </p>
                        </div>

                        {/* Discussion Filter Buttons */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            <Button
                                variant={activeFilter === "ALL" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveFilter("ALL")}
                                className="rounded-xl text-xs h-8"
                            >
                                Semua ({mockDiscussions.length})
                            </Button>
                            <Button
                                variant={activeFilter === "CORRECT" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveFilter("CORRECT")}
                                className="rounded-xl text-xs h-8"
                            >
                                Benar ({totalCorrect})
                            </Button>
                            <Button
                                variant={activeFilter === "INCORRECT" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveFilter("INCORRECT")}
                                className="rounded-xl text-xs h-8"
                            >
                                Salah ({totalIncorrect})
                            </Button>
                            <Button
                                variant={activeFilter === "SKIPPED" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveFilter("SKIPPED")}
                                className="rounded-xl text-xs h-8"
                            >
                                Kosong ({totalSkipped})
                            </Button>
                        </div>
                    </div>

                    {/* Discussions List */}
                    <div className="space-y-4">
                        {filteredQuestions.map((q) => {
                            const isExpanded = expandedQuestionId === q.id;

                            return (
                                <div
                                    key={q.id}
                                    className="rounded-2xl border border-border bg-card overflow-hidden transition-all shadow-2xs"
                                >
                                    {/* Question Header Accordion Trigger */}
                                    <button
                                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                                        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={cn(
                                                    "h-7 w-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0",
                                                    q.isCorrect
                                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                        : q.userAnswer === ""
                                                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                            : "bg-red-500/10 text-red-600 border border-red-500/20"
                                                )}
                                            >
                                                #{q.number}
                                            </span>

                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-sm text-foreground">
                                                        Soal Nomor {q.number}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {q.subtestName}
                                                    </Badge>
                                                    {q.isCorrect ? (
                                                        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold gap-1">
                                                            <Check className="h-3 w-3" /> Benar
                                                        </Badge>
                                                    ) : q.userAnswer === "" ? (
                                                        <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 font-bold gap-1">
                                                            Tidak Dijawab
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px] bg-red-500/10 text-red-600 font-bold gap-1">
                                                            <X className="h-3 w-3" /> Salah
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                    {q.content}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0 text-muted-foreground">
                                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                        </div>
                                    </button>

                                    {/* Expanded Discussion Content */}
                                    {isExpanded && (
                                        <div className="p-5 border-t border-border bg-muted/10 space-y-5 text-xs">
                                            {/* Question Text */}
                                            <div className="p-4 rounded-2xl bg-card border border-border text-sm font-medium leading-relaxed">
                                                {q.content}
                                            </div>

                                            {/* Options & Status */}
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-foreground text-xs">Opsi Jawaban:</h4>
                                                <div className="space-y-2">
                                                    {q.options.map((opt) => {
                                                        const isUserChoice = q.userAnswer === opt.key;
                                                        const isRightKey = q.correctAnswer === opt.key;

                                                        return (
                                                            <div
                                                                key={opt.key}
                                                                className={cn(
                                                                    "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs",
                                                                    isRightKey
                                                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300 font-bold"
                                                                        : isUserChoice && !isRightKey
                                                                            ? "border-red-500 bg-red-500/10 text-red-950 dark:text-red-300 font-bold"
                                                                            : "border-border bg-card text-foreground"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-mono font-bold">{opt.key}.</span>
                                                                    <span>{opt.text}</span>
                                                                </div>

                                                                {isRightKey && (
                                                                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                                                                        Kunci Jawaban
                                                                    </Badge>
                                                                )}
                                                                {isUserChoice && !isRightKey && (
                                                                    <Badge variant="destructive" className="text-[10px] font-bold">
                                                                        Pilihan Kamu
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Step-by-Step Solution Box */}
                                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
                                                <h4 className="font-bold text-primary flex items-center gap-1.5 text-xs">
                                                    <Lightbulb className="h-4 w-4" /> Solusi & Pembahasan Lengkap
                                                </h4>
                                                <p className="text-foreground leading-relaxed whitespace-pre-line font-mono text-[11px] sm:text-xs">
                                                    {q.solution}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </AppShell>
    );
}
