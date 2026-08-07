"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { academicService } from "@/services/academic.service";
import { QuestionOption } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Flag,
    CheckCircle2,
    AlertTriangle,
    Menu,
    X,
    Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MockQuestion {
    id: string;
    number: number;
    content: string;
    options: { key: string; text: string }[];
}

const MOCK_QUESTIONS: MockQuestion[] = [
    {
        id: "q-1",
        number: 1,
        content: "Jika x + y = 10 dan xy = 21, maka nilai dari x² + y² adalah...",
        options: [
            { key: "A", text: "58" },
            { key: "B", text: "62" },
            { key: "C", text: "79" },
            { key: "D", text: "100" },
            { key: "E", text: "142" },
        ],
    },
    {
        id: "q-2",
        number: 2,
        content: "Semua mahasiswa peserta seminar membawa kartu tanda mahasiswa. Sebagian peserta seminar memakai kemeja putih. Kesimpulan yang benar adalah...",
        options: [
            { key: "A", text: "Semua peserta seminar memakai kemeja putih" },
            { key: "B", text: "Sebagian mahasiswa peserta seminar memakai kemeja putih" },
            { key: "C", text: "Semua mahasiswa tidak memakai kemeja putih" },
            { key: "D", text: "Sebagian peserta seminar tidak membawa kartu tanda mahasiswa" },
            { key: "E", text: "Tidak dapat ditarik kesimpulan" },
        ],
    },
    {
        id: "q-3",
        number: 3,
        content: "Sebuah tangki berisi air 3/5 bagian. Jika ditambahkan 12 liter air, tangki tersebut menjadi terisi 3/4 bagian. Berapakah kapasitas total tangki tersebut?",
        options: [
            { key: "A", text: "60 liter" },
            { key: "B", text: "80 liter" },
            { key: "C", text: "90 liter" },
            { key: "D", text: "120 liter" },
            { key: "E", text: "150 liter" },
        ],
    },
    {
        id: "q-4",
        number: 4,
        content: "Gagasan utama paragraf kedua pada teks wacana di atas merujuk pada pentingnya...",
        options: [
            { key: "A", text: "Pengembangan infrastruktur pendidikan digital" },
            { key: "B", text: "Peningkatan kualitas sumber daya manusia" },
            { key: "C", text: "Pemerataan akses internet daerah 3T" },
            { key: "D", text: "Digitalisasi bahan ajar sekolah dasar" },
            { key: "E", text: "Integrasi sistem kecerdasan buatan" },
        ],
    },
    {
        id: "q-5",
        number: 5,
        content: "Berapakah median dari sekumpulan data: 4, 7, 2, 9, 12, 15, 8?",
        options: [
            { key: "A", text: "7" },
            { key: "B", text: "8" },
            { key: "C", text: "9" },
            { key: "D", text: "10" },
            { key: "E", text: "12" },
        ],
    },
];

export default function CBTPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params?.id as string;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flags, setFlags] = useState<Record<string, boolean>>({});
    const [secondsLeft, setSecondsLeft] = useState(195 * 60); // 195 minutes timer
    const [autoSaveStatus, setAutoSaveStatus] = useState<"SAVED" | "SAVING">("SAVED");
    const [showGridMobile, setShowGridMobile] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);

    // Timer countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTimer = (totalSec: number) => {
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const currentQ = MOCK_QUESTIONS[currentIndex];
    const selectedOption = answers[currentQ.id];
    const isFlagged = flags[currentQ.id];

    const handleSelectOption = (key: string) => {
        setAutoSaveStatus("SAVING");
        setAnswers((prev) => ({ ...prev, [currentQ.id]: key }));
        setTimeout(() => setAutoSaveStatus("SAVED"), 300);
    };

    const handleToggleFlag = () => {
        setFlags((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
    };

    const handleSubmitExam = async () => {
        try {
            // API call to submit exam session
            router.push(`/exams/${examId}/result`);
        } catch {
            alert("Gagal mengirim jawaban.");
        }
    };

    const totalAnswered = Object.keys(answers).length;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col select-none">
            {/* CBT Header Bar */}
            <header className="sticky top-0 z-30 h-16 bg-card border-b border-border px-4 md:px-6 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold font-heading text-lg">
                        YL
                    </div>
                    <div>
                        <h2 className="font-heading font-bold text-sm leading-none">
                            Try Out UTBK SNBT 2026 #5
                        </h2>
                        <span className="text-[11px] text-muted-foreground">Subtes Penalaran Matematika</span>
                    </div>
                </div>

                {/* Center: Timer & AutoSave */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border text-foreground font-mono font-bold text-sm">
                        <Clock className="h-4 w-4 text-primary animate-pulse" />
                        <span>{formatTimer(secondsLeft)}</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Save className="h-3.5 w-3.5 text-green-600" />
                        <span>{autoSaveStatus === "SAVING" ? "Tersimpan..." : "Auto-Save Aktif"}</span>
                    </div>
                </div>

                {/* Right: Grid Toggle Mobile & Finish */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGridMobile(true)}
                        className="md:hidden rounded-xl h-9"
                    >
                        <Menu className="h-4 w-4" />
                    </Button>

                    <Button
                        onClick={() => setShowFinishModal(true)}
                        variant="destructive"
                        size="sm"
                        className="rounded-xl font-semibold h-9 px-4"
                    >
                        Selesai Ujian
                    </Button>
                </div>
            </header>

            {/* CBT Main Container */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main Question Panel */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-4xl mx-auto flex flex-col justify-between">
                    <div className="space-y-6">
                        {/* Question Header Bar */}
                        <div className="flex items-center justify-between pb-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <span className="font-heading text-lg font-bold text-primary">
                                    Soal Nomor {currentQ.number}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    dari {MOCK_QUESTIONS.length} soal
                                </span>
                            </div>

                            {/* Ragu-Ragu Checkbox */}
                            <button
                                onClick={handleToggleFlag}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                                    isFlagged
                                        ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                                )}
                            >
                                <Flag className="h-4 w-4" />
                                <span>Ragu-Ragu</span>
                            </button>
                        </div>

                        {/* Question Content */}
                        <div className="text-base font-medium leading-relaxed text-foreground">
                            {currentQ.content}
                        </div>

                        {/* Options List */}
                        <div className="space-y-3 pt-2">
                            {currentQ.options.map((opt) => {
                                const isSelected = selectedOption === opt.key;
                                return (
                                    <button
                                        key={opt.key}
                                        onClick={() => handleSelectOption(opt.key)}
                                        className={cn(
                                            "w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer",
                                            isSelected
                                                ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                                                : "border-border bg-card hover:bg-muted/50 text-foreground"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-colors",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            {opt.key}
                                        </span>
                                        <span className="text-sm pt-0.5">{opt.text}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navigation Controls Footer */}
                    <div className="pt-8 flex items-center justify-between border-t border-border mt-8">
                        <Button
                            variant="outline"
                            disabled={currentIndex === 0}
                            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                            className="rounded-xl h-11 px-5"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Soal Sebelumnya
                        </Button>

                        <Button
                            disabled={currentIndex === MOCK_QUESTIONS.length - 1}
                            onClick={() =>
                                setCurrentIndex((prev) => Math.min(MOCK_QUESTIONS.length - 1, prev + 1))
                            }
                            className="rounded-xl h-11 px-5 font-semibold"
                        >
                            Soal Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </main>

                {/* Right Sidebar Question Navigation Grid (Desktop) */}
                <aside className="w-80 border-l border-border bg-card p-6 hidden md:flex flex-col justify-between">
                    <div className="space-y-4">
                        <h3 className="font-heading font-bold text-sm text-foreground">
                            Navigasi Soal
                        </h3>

                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pb-4 border-b border-border">
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-md bg-green-500"></span>
                                <span>Dijawab ({totalAnswered})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-md bg-amber-400"></span>
                                <span>Ragu ({Object.keys(flags).filter((k) => flags[k]).length})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-md bg-muted border border-border"></span>
                                <span>Belum ({MOCK_QUESTIONS.length - totalAnswered})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-md bg-primary"></span>
                                <span>Aktif</span>
                            </div>
                        </div>

                        {/* Grid Items */}
                        <div className="grid grid-cols-5 gap-2 max-h-[400px] overflow-y-auto pr-1">
                            {MOCK_QUESTIONS.map((q, idx) => {
                                const answered = !!answers[q.id];
                                const flagged = !!flags[q.id];
                                const active = idx === currentIndex;

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={cn(
                                            "h-10 rounded-xl font-semibold text-xs transition-all relative flex items-center justify-center cursor-pointer",
                                            active
                                                ? "ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground"
                                                : flagged
                                                    ? "bg-amber-400 text-amber-950 font-bold"
                                                    : answered
                                                        ? "bg-green-500 text-white font-bold"
                                                        : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                                        )}
                                    >
                                        {q.number}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Confirmation Modal */}
            {showFinishModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card max-w-md w-full rounded-3xl p-6 shadow-2xl border border-border space-y-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 mx-auto">
                            <AlertTriangle className="h-6 w-6" />
                        </div>

                        <div className="text-center space-y-1">
                            <h3 className="font-heading font-bold text-lg">Konfirmasi Selesai Ujian</h3>
                            <p className="text-xs text-muted-foreground">
                                Anda telah menjawab <strong className="text-foreground">{totalAnswered}</strong> dari{" "}
                                {MOCK_QUESTIONS.length} soal. Yakin ingin mengakhiri sesi pengerjaan ujian ini?
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowFinishModal(false)}
                                className="w-full rounded-xl"
                            >
                                Lanjutkan Pengerjaan
                            </Button>
                            <Button
                                onClick={handleSubmitExam}
                                variant="destructive"
                                className="w-full rounded-xl font-bold"
                            >
                                Kirim Jawaban
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
