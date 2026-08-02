"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    Check,
    Clock,
    X,
    Play,
    Sparkles,
    Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PracticeQuestion {
    id: string;
    num: number;
    text: string;
    options: { label: string; text: string }[];
    subjectName: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    explanation?: string;
}

interface MaterialPracticeSession {
    id: string;
    materialId: string;
    materialTitle: string;
    questions: PracticeQuestion[];
    timeLimit: number;
    totalQuestions: number;
    startedAt: string;
    mode: "STANDARD" | "ADAPTIVE";
}

const mockSession: MaterialPracticeSession = {
    id: "prac-session-001",
    materialId: "mat-001",
    materialTitle: "Logika Induktif & Deduktif",
    timeLimit: 900,
    totalQuestions: 10,
    startedAt: new Date().toISOString(),
    mode: "STANDARD",
    questions: [
        {
            id: "q1",
            num: 1,
            subjectName: "Penalaran Umum",
            difficulty: "EASY",
            text: "Manakah berikut ini yang merupakan contoh penalaran induktif?",
            options: [
                { label: "A", text: "Semua manusia mortal. Socrates manusia. Maka Socrates mortal." },
                { label: "B", text: "Hari ini hujan, kemarin hujan, besok kemungkinan besar hujan." },
                { label: "C", text: "Jika x > 5 maka x² > 25. x = 6. Maka 36 > 25." },
                { label: "D", text: "Semua segitiga memiliki jumlah sudut 180°. ABC segitiga. Maka ABC 180°." },
                { label: "E", text: "Semua bilangan genap habis dibagi 2. 8 bilangan genap. Maka 8 habis dibagi 2." },
            ],
            explanation: "Penalaran induktif menarik kesimpulan umum dari pengamatan kasus-kasus khusus.",
        },
        {
            id: "q2",
            num: 2,
            subjectName: "Penalaran Umum",
            difficulty: "MEDIUM",
            text: "Diketahui premis: (1) Jika hujan, maka tanah basah. (2) Tanah tidak basah. Kesimpulan yang valid adalah...",
            options: [
                { label: "A", text: "Hujan" },
                { label: "B", text: "Tidak hujan" },
                { label: "C", text: "Mungkin hujan" },
                { label: "D", text: "Tidak dapat disimpulkan" },
                { label: "E", text: "Tanah kering" },
            ],
            explanation: "Ini adalah Modus Tollens: Jika P → Q dan ¬Q, maka ¬P.",
        },
        {
            id: "q3",
            num: 3,
            subjectName: "Penalaran Umum",
            difficulty: "HARD",
            text: "Manakah argumen berikut yang valid secara deduktif?",
            options: [
                { label: "A", text: "Beberapa mahasiswa pintar. Budi mahasiswa. Maka Budi pintar." },
                { label: "B", text: "Semua dokter punya STR. Dr. Andi punya STR. Maka Dr. Andi dokter." },
                { label: "C", text: "Tidak ada ikan yang bisa terbang. Lumpuh ikan. Maka lumpuh tidak bisa terbang." },
                { label: "D", text: "Sebagian guru sabar. Pak Budi guru. Maka Pak Budi sabar." },
                { label: "E", text: "Semua persegi empat segi. Bangun ini empat segi. Maka bangun ini persegi." },
            ],
            explanation: "Hanya C yang valid.",
        },
        {
            id: "q4",
            num: 4,
            subjectName: "Penalaran Umum",
            difficulty: "EASY",
            text: "Silogisme kategorik valid memerlukan...",
            options: [
                { label: "A", text: "2 premis dan 1 kesimpulan dengan 3 istilah berbeda" },
                { label: "B", text: "3 premis dan 2 kesimpulan" },
                { label: "C", text: "1 premis dan 1 kesimpulan" },
                { label: "D", text: "4 premis tanpa kesimpulan" },
                { label: "E", text: "Premis bersifat probabilistik" },
            ],
            explanation: "Silogisme kategorik standar memiliki 2 premis dan 1 kesimpulan dengan tepat 3 istilah.",
        },
        {
            id: "q5",
            num: 5,
            subjectName: "Penalaran Umum",
            difficulty: "MEDIUM",
            text: "Negasi dari pernyataan 'Semua siswa kelas XII lulus ujian' adalah...",
            options: [
                { label: "A", text: "Tidak ada siswa kelas XII yang lulus ujian" },
                { label: "B", text: "Beberapa siswa kelas XII tidak lulus ujian" },
                { label: "C", text: "Semua siswa kelas XII tidak lulus ujian" },
                { label: "D", text: "Sebagian siswa kelas XII lulus ujian" },
                { label: "E", text: "Minimal satu siswa kelas XII lulus ujian" },
            ],
            explanation: "Negasi dari 'Semua A adalah B' adalah 'Beberapa A bukan B'.",
        },
        {
            id: "q6",
            num: 6,
            subjectName: "Penalaran Umum",
            difficulty: "EASY",
            text: "Contoh Modus Ponens yang benar:",
            options: [
                { label: "A", text: "Jika belajar maka lulus. Dia lulus. Maka dia belajar." },
                { label: "B", text: "Jika belajar maka lulus. Dia belajar. Maka dia lulus." },
                { label: "C", text: "Jika belajar maka lulus. Dia tidak belajar. Maka dia tidak lulus." },
                { label: "D", text: "Jika belajar maka lulus. Dia tidak lulus. Maka dia belajar." },
                { label: "E", text: "Jika belajar maka lulus. Maka dia belajar dan lulus." },
            ],
            explanation: "Modus Ponens: P → Q, P ⊢ Q.",
        },
        {
            id: "q7",
            num: 7,
            subjectName: "Penalaran Umum",
            difficulty: "HARD",
            text: "Manakah yang merupakan kesimpulan valid dari premis: 'Jika tidak hujan maka saya jalan kaki. Saya tidak jalan kaki.'",
            options: [
                { label: "A", text: "Hujan" },
                { label: "B", text: "Tidak hujan" },
                { label: "C", text: "Saya naik motor" },
                { label: "D", text: "Cuaca cerah" },
                { label: "E", text: "Tidak dapat disimpulkan" },
            ],
            explanation: "Modus Tollens: ¬Q → ¬P.",
        },
        {
            id: "q8",
            num: 8,
            subjectName: "Penalaran Umum",
            difficulty: "MEDIUM",
            text: "Perbedaan utama induktif dan deduktif:",
            options: [
                { label: "A", text: "Induktif pasti, deduktif probabilistik" },
                { label: "B", text: "Deduktif dari khusus ke umum, induktif dari umum ke khusus" },
                { label: "C", text: "Induktif dari khusus ke umum (probabilistik), deduktif dari umum ke khusus (pasti)" },
                { label: "D", text: "Keduanya sama pastinya" },
                { label: "E", text: "Keduanya sama probabilistiknya" },
            ],
            explanation: "Induktif: khusus → umum (probabilistik). Deduktif: umum → khusus (pasti).",
        },
        {
            id: "q9",
            num: 9,
            subjectName: "Penalaran Umum",
            difficulty: "MEDIUM",
            text: "Fallacy pada: 'Pak Polisi, saya tidak boleh dikasih tilang karena saya orang miskin' adalah...",
            options: [
                { label: "A", text: "Ad Hominem" },
                { label: "B", text: "Appeal to Pity" },
                { label: "C", text: "Straw Man" },
                { label: "D", text: "False Dilemma" },
                { label: "E", text: "Hasty Generalization" },
            ],
            explanation: "Appeal to Pity: mencoba meyakinkan dengan membangkitkan belas kasihan.",
        },
        {
            id: "q10",
            num: 10,
            subjectName: "Penalaran Umum",
            difficulty: "HARD",
            text: "Diberikan: (1) P → Q (2) Q → R (3) ¬R. Kesimpulan valid:",
            options: [
                { label: "A", text: "P" },
                { label: "B", text: "¬P" },
                { label: "C", text: "Q" },
                { label: "D", text: "¬Q" },
                { label: "E", text: "R" },
            ],
            explanation: "Hypothetical Syllogis + Modus Tollens → ¬P.",
        },
    ],
};

export default function MaterialPracticePage() {
    const params = useParams();
    const router = useRouter();
    const materialId = (params as any)?.materialId as string || "";

    const [currentIdx, setCurrentIdx] = React.useState(0);
    const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, string>>({});
    const [flagged, setFlagged] = React.useState<Record<number, boolean>>({});
    const [showExplanation, setShowExplanation] = React.useState(false);
    const [timeRemaining, setTimeRemaining] = React.useState(mockSession.timeLimit);
    const [isFinished, setIsFinished] = React.useState(false);
    const [isPaused, setIsPaused] = React.useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);

    const questions = mockSession.questions;
    const q = questions[currentIdx];
    if (!q) return null;
    const answeredCount = Object.keys(selectedAnswers).length;
    const progress = (answeredCount / questions.length) * 100;

    // Timer
    React.useEffect(() => {
        if (isFinished || isPaused) return;
        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    setIsFinished(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isFinished, isPaused]);

    const handleSelectOption = (optLabel: string) => {
        setSelectedAnswers(prev => ({ ...prev, [currentIdx]: optLabel }));
    };

    const toggleFlag = () => {
        setFlagged(prev => ({ ...prev, [currentIdx]: !flagged[currentIdx] }));
    };

    const handleSubmit = () => {
        setIsFinished(true);
        setIsPaused(true);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
    };

    // Score calculation
    const getScore = () => {
        let correctCount = 0;
        questions.forEach((question, idx) => {
            const selected = selectedAnswers[idx];
            if (
                (selected === "B" && idx === 1) ||
                (selected === "C" && idx === 2) ||
                (selected === "A" && idx === 3) ||
                (selected === "B" && idx === 4) ||
                (selected === "B" && idx === 5) ||
                (selected === "A" && idx === 6) ||
                (selected === "C" && idx === 7) ||
                (selected === "B" && idx === 8) ||
                (selected === "B" && idx === 9)
            ) {
                correctCount++;
            }
        });
        return correctCount;
    };

    if (isFinished) {
        const correctCount = getScore();
        const percentage = (correctCount / questions.length) * 100;

        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <Card className="rounded-2xl border-success/30 bg-success/5">
                    <CardContent className="p-8 text-center space-y-4">
                        <Badge variant={percentage >= 70 ? "default" : "destructive"} className="text-sm">
                            {percentage >= 70 ? "LULUS" : "BELAJAR LAGI"}
                        </Badge>
                        <h1 className="text-2xl font-extrabold tracking-tight">Latihan Selesai</h1>
                        <p className="text-muted-foreground text-sm">{mockSession.materialTitle}</p>
                        <div className="text-5xl font-black text-primary font-mono">{percentage.toFixed(0)}%</div>
                        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                            <span className="text-success font-bold">{correctCount} Benar</span>
                            <span className="text-destructive font-bold">{questions.length - correctCount} Salah</span>
                        </div>
                        <div className="pt-4 border-t flex justify-center gap-3 flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => router.push(`/student/materials/${materialId}`)}>
                                <ChevronLeft className="mr-1.5 h-4 w-4" /> Kembali
                            </Button>
                            <Button size="sm" onClick={() => router.push(`/student/practice`)}>
                                <Sparkles className="mr-1.5 h-4 w-4" /> Latihan Lainnya
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">Practice</Badge>
                        <span className="text-xs text-muted-foreground">{mockSession.mode}</span>
                    </div>
                    <h1 className="text-lg font-extrabold tracking-tight mt-1">Soal {q.num} dari {questions.length}</h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-muted/40 font-mono text-xs font-bold">
                        <Clock className="h-4 w-4" /> {formatTime(timeRemaining)}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)}>
                        {isPaused ? <Play className="h-4 w-4" /> : "Jeda"}
                    </Button>
                    <Button size="sm" variant="success" onClick={() => setShowSubmitConfirm(true)}>
                        <Check className="mr-1.5 h-4 w-4" /> Selesai
                    </Button>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <Card className="lg:col-span-3 rounded-2xl p-5 space-y-5">
                    <div className="flex items-center justify-between border-b pb-3 gap-2 flex-wrap">
                        <span className="text-xs font-bold text-muted-foreground">{q.subjectName} • {q.difficulty}</span>
                        <Button variant={flagged[currentIdx] ? "warning" : "outline"} size="sm" onClick={toggleFlag}>
                            <X className="mr-1.5 h-3 w-3" /> {flagged[currentIdx] ? "Ragu" : "Tandai"}
                        </Button>
                    </div>

                    <div className="text-sm font-semibold text-foreground p-4 rounded-xl border bg-muted/20 leading-relaxed">
                        {q.text}
                    </div>

                    <div className="space-y-3">
                        {q.options.map((opt) => {
                            const isSelected = selectedAnswers[currentIdx] === opt.label;
                            return (
                                <div
                                    key={opt.label}
                                    onClick={() => handleSelectOption(opt.label)}
                                    className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${isSelected ? "border-primary bg-primary/10 font-bold" : "hover:border-primary/40 bg-card"}`}
                                >
                                    <div className={`h-7 w-7 rounded-lg font-bold text-xs flex items-center justify-center border shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                        {opt.label}
                                    </div>
                                    <span className="text-xs">{opt.text}</span>
                                </div>
                            );
                        })}
                    </div>

                    {showExplanation && q.explanation && (
                        <Card className="rounded-2xl border-primary/30 bg-primary/5 p-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                <Brain className="h-4 w-4" /> Pembahasan
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">{q.explanation}</p>
                        </Card>
                    )}

                    <div className="pt-4 border-t flex justify-between items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" disabled={currentIdx === 0} onClick={() => { setCurrentIdx(currentIdx - 1); setShowExplanation(false); }}>
                            <ChevronLeft className="mr-1 h-4 w-4" /> Sebelumnya
                        </Button>
                        <Button variant={showExplanation ? "default" : "outline"} size="sm" onClick={() => setShowExplanation(!showExplanation)}>
                            <Brain className="mr-1 h-3.5 w-3.5" /> Pembahasan
                        </Button>
                        <Button size="sm" disabled={currentIdx === questions.length - 1} onClick={() => { setCurrentIdx(currentIdx + 1); setShowExplanation(false); }}>
                            Berikutnya <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </Card>

                <div className="space-y-3">
                    <Card className="rounded-2xl p-4">
                        <h4 className="font-bold text-xs border-b pb-2 mb-2">Navigasi</h4>
                        <div className="grid grid-cols-5 gap-2 text-xs font-bold">
                            {questions.map((item, idx) => {
                                const isAns = selectedAnswers[idx];
                                const isCur = currentIdx === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIdx(idx)}
                                        className={`h-9 rounded-lg border flex items-center justify-center ${isCur ? "border-primary ring-2 ring-primary/40" : isAns ? "bg-success text-success-foreground" : "bg-muted"}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-3">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {showSubmitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="rounded-2xl w-full max-w-md mx-4 p-6">
                        <CardHeader>
                            <CardTitle className="text-center">Yakin ingin mengumpulkan?</CardTitle>
                            <CardDescription className="text-center">
                                {answeredCount} dari {questions.length} soal dijawab.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center gap-2">
                            <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>Batal</Button>
                            <Button variant="success" onClick={handleSubmit}>Ya, Kumpulkan</Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
