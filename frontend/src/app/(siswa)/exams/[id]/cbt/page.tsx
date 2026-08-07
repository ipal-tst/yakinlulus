// frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx
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
    Grid,
    HelpCircle,
    Bookmark,
    BookOpen,
    FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MockQuestion {
    id: string;
    number: number;
    subtestName?: string;
    content: string;
    options: { key: string; text: string }[];
}

const MOCK_QUESTIONS: MockQuestion[] = [
    {
        id: "q-1",
        number: 1,
        subtestName: "Penalaran Kuantitatif",
        content: "Jika x + y = 10 dan xy = 21, maka berapakah nilai dari x² + y²?\n\nPetunjuk: Gunakan identitas aljabar dasar (x + y)² = x² + 2xy + y².",
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
        subtestName: "Penalaran Logis",
        content: "Semua mahasiswa peserta seminar membawa kartu tanda mahasiswa. Sebagian peserta seminar memakai kemeja putih. Manakah kesimpulan yang paling tepat dari pernyataan tersebut?",
        options: [
            { key: "A", text: "Semua peserta seminar memakai kemeja putih" },
            { key: "B", text: "Sebagian mahasiswa peserta seminar memakai kemeja putih" },
            { key: "C", text: "Semua mahasiswa tidak memakai kemeja putih" },
            { key: "D", text: "Sebagian peserta seminar tidak membawa kartu tanda mahasiswa" },
            { key: "E", text: "Tidak dapat ditarik kesimpulan dari kedua pernyataan di atas" },
        ],
    },
    {
        id: "q-3",
        number: 3,
        subtestName: "Penalaran Matematika",
        content: "Sebuah tangki air awal mula terisi 3/5 bagian dari total volumenya. Jika ke dalam tangki tersebut ditambahkan 12 liter air, tangki tersebut menjadi terisi 3/4 bagian.\n\nBerapakah kapasitas volume total dari tangki tersebut dalam satuan liter?",
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
        subtestName: "Literasi Bahasa Indonesia",
        content: "Cermati kutipan teks berikut:\n\n'Peningkatan literasi digital di Indonesia merupakan langkah krusial dalam menghadapi era akselerasi teknologi informasi. Meskipun infrastruktur jaringan internet di berbagai pelosok daerah terus dibangun, pemanfaatan internet untuk kegiatan produktif dan edukatif masih tergolong rendah.'\n\nGagasan utama yang ingin disampaikan oleh penulis dalam paragraf di atas adalah...",
        options: [
            { key: "A", text: "Pengembangan infrastruktur jaringan di daerah pelosok" },
            { key: "B", text: "Pentingnya literasi digital dan pemanfaatan internet yang edukatif" },
            { key: "C", text: "Akselerasi teknologi informasi di kawasan Asia Tenggara" },
            { key: "D", text: "Rendahnya harga paket kuota internet di sekolah dasar" },
            { key: "E", text: "Integrasi sistem kecerdasan buatan dalam kurikulum nasional" },
        ],
    },
    {
        id: "q-5",
        number: 5,
        subtestName: "Pengetahuan Kuantitatif",
        content: "Diberikan sekumpulan data statistik sebagai berikut: 4, 7, 2, 9, 12, 15, 8.\n\nBerapakah nilai median dari kumpulan data tersebut?",
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
    const [secondsLeft, setSecondsLeft] = useState(195 * 60); // 195 mins timer
    const [autoSaveStatus, setAutoSaveStatus] = useState<"SAVED" | "SAVING">("SAVED");
    const [showNavGridPopover, setShowNavGridPopover] = useState(false);
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
            router.push(`/exams/${examId}/result`);
        } catch {
            alert("Gagal mengirim jawaban.");
        }
    };

    const totalAnswered = Object.keys(answers).length;
    const totalFlagged = Object.keys(flags).filter((k) => flags[k]).length;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col select-none overflow-hidden h-screen">
            {/* CBT Header Bar */}
            <header className="sticky top-0 z-30 h-16 bg-card border-b border-border px-4 md:px-6 flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold font-heading text-base shadow-xs">
                        YL
                    </div>
                    <div>
                        <h2 className="font-heading font-bold text-sm leading-tight text-foreground">
                            Try Out UTBK SNBT 2026 #5
                        </h2>
                        <span className="text-[11px] text-muted-foreground font-medium">
                            Subtes: {currentQ.subtestName || "Penalaran Umum"}
                        </span>
                    </div>
                </div>

                {/* Center: Timer & AutoSave */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-sm shadow-2xs">
                        <Clock className="h-4 w-4 animate-pulse" />
                        <span>{formatTimer(secondsLeft)}</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Save className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{autoSaveStatus === "SAVING" ? "Tersimpan..." : "Auto-Save Aktif"}</span>
                    </div>
                </div>

                {/* Right: Submit Button */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowFinishModal(true)}
                        variant="destructive"
                        size="sm"
                        className="rounded-xl font-semibold h-9 px-4 text-xs shadow-xs"
                    >
                        Selesai Ujian
                    </Button>
                </div>
            </header>

            {/* CBT Main Split Screen Container */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* LEFT PANEL: SOAL / QUESTION SECTION */}
                <section className="flex-1 border-b md:border-b-0 md:border-r border-border bg-background p-6 md:p-8 overflow-y-auto flex flex-col justify-between space-y-6">
                    <div className="space-y-6 max-w-3xl">
                        {/* Question Metadata Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-border/80">
                            <div className="flex items-center gap-3">
                                <div className="h-8 px-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                                    Soal #{currentQ.number}
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">
                                    dari {MOCK_QUESTIONS.length} Soal Ujian
                                </span>
                            </div>

                            <Badge variant="outline" className="text-[11px] gap-1 font-semibold">
                                <FileText className="h-3.5 w-3.5 text-primary" /> Stimulus & Teks Ujian
                            </Badge>
                        </div>

                        {/* Main Question Text Content */}
                        <div className="text-base sm:text-lg font-medium leading-relaxed text-foreground whitespace-pre-line bg-card/60 p-6 rounded-3xl border border-border/70 shadow-2xs">
                            {currentQ.content}
                        </div>
                    </div>
                </section>

                {/* RIGHT PANEL: OPSI JAWABAN / ANSWER OPTIONS SECTION */}
                <section className="w-full md:w-[480px] lg:w-[540px] shrink-0 bg-card/50 p-6 md:p-8 overflow-y-auto flex flex-col justify-between space-y-6 border-l border-border/60">
                    <div className="space-y-5">
                        {/* Header for Answer Options & Ragu Toggle */}
                        <div className="flex items-center justify-between pb-3 border-b border-border/80">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" /> Pilih Jawaban Kamu
                            </h3>

                            {/* Ragu-Ragu Checkbox Button */}
                            <button
                                onClick={handleToggleFlag}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs",
                                    isFlagged
                                        ? "bg-amber-500 text-amber-950 border-amber-400 font-extrabold"
                                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                                )}
                            >
                                <Flag className="h-3.5 w-3.5" />
                                <span>Ragu-Ragu</span>
                            </button>
                        </div>

                        {/* Options A, B, C, D, E List */}
                        <div className="space-y-3">
                            {currentQ.options.map((opt) => {
                                const isSelected = selectedOption === opt.key;
                                return (
                                    <button
                                        key={opt.key}
                                        onClick={() => handleSelectOption(opt.key)}
                                        className={cn(
                                            "w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer shadow-2xs group",
                                            isSelected
                                                ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs ring-1 ring-primary/40"
                                                : "border-border bg-card hover:bg-muted/60 text-foreground"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-colors",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground shadow-xs"
                                                    : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                                            )}
                                        >
                                            {opt.key}
                                        </span>
                                        <span className="text-sm pt-1 leading-normal">{opt.text}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navigation Buttons Footer (Right Panel Bottom) */}
                    <div className="pt-6 flex items-center justify-between border-t border-border mt-6 gap-3">
                        <Button
                            variant="outline"
                            disabled={currentIndex === 0}
                            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                            className="rounded-xl h-11 px-5 text-xs font-semibold"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Soal Sebelumnya
                        </Button>

                        <Button
                            disabled={currentIndex === MOCK_QUESTIONS.length - 1}
                            onClick={() =>
                                setCurrentIndex((prev) => Math.min(MOCK_QUESTIONS.length - 1, prev + 1))
                            }
                            className="rounded-xl h-11 px-5 text-xs font-semibold shadow-xs"
                        >
                            Soal Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </section>

                {/* FLOATING HOVER QUESTION NAVIGATION WIDGET (BOTTOM-LEFT CORNER) */}
                <div
                    className="fixed bottom-6 left-6 z-40"
                    onMouseEnter={() => setShowNavGridPopover(true)}
                    onMouseLeave={() => setShowNavGridPopover(false)}
                >
                    {/* Hover/Click Popover Grid Panel */}
                    {showNavGridPopover && (
                        <div className="mb-3 p-4 rounded-3xl bg-card border border-border shadow-2xl w-80 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
                            <div className="flex items-center justify-between border-b border-border/80 pb-2">
                                <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                                    <Grid className="h-4 w-4 text-primary" /> Matriks Navigasi Soal
                                </h4>
                                <Badge variant="secondary" className="text-[10px]">
                                    {totalAnswered} / {MOCK_QUESTIONS.length} Dijawab
                                </Badge>
                            </div>

                            {/* Legend Bar */}
                            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground pb-2 border-b border-border/60">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-md bg-emerald-500"></span>
                                    <span>Dijawab ({totalAnswered})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-md bg-amber-400"></span>
                                    <span>Ragu ({totalFlagged})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-md bg-muted border border-border"></span>
                                    <span>Belum ({MOCK_QUESTIONS.length - totalAnswered})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-md bg-primary"></span>
                                    <span>Aktif</span>
                                </div>
                            </div>

                            {/* Numbers Grid */}
                            <div className="grid grid-cols-5 gap-2 max-h-52 overflow-y-auto pr-1">
                                {MOCK_QUESTIONS.map((q, idx) => {
                                    const answered = !!answers[q.id];
                                    const flagged = !!flags[q.id];
                                    const active = idx === currentIndex;

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => {
                                                setCurrentIndex(idx);
                                                setShowNavGridPopover(false);
                                            }}
                                            className={cn(
                                                "h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer shadow-2xs",
                                                active
                                                    ? "ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground shadow-xs"
                                                    : flagged
                                                        ? "bg-amber-400 text-amber-950 font-black"
                                                        : answered
                                                            ? "bg-emerald-500 text-white font-bold"
                                                            : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                                            )}
                                        >
                                            {q.number}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Floating Launcher Button */}
                    <button
                        onClick={() => setShowNavGridPopover(!showNavGridPopover)}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-card border border-primary/30 shadow-xl hover:border-primary text-foreground transition-all cursor-pointer group"
                    >
                        <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
                            <Grid className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                            <span className="text-[11px] font-bold text-primary block leading-none">
                                Navigasi Soal
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                                #{currentIndex + 1} ({totalAnswered}/{MOCK_QUESTIONS.length})
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showFinishModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card max-w-md w-full rounded-3xl p-6 shadow-2xl border border-border space-y-4 animate-in zoom-in-95 duration-150">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mx-auto">
                            <AlertTriangle className="h-6 w-6" />
                        </div>

                        <div className="text-center space-y-1">
                            <h3 className="font-heading font-bold text-lg">Konfirmasi Selesai Ujian</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Anda telah menjawab <strong className="text-foreground">{totalAnswered}</strong> dari{" "}
                                {MOCK_QUESTIONS.length} soal. Yakin ingin mengakhiri sesi pengerjaan ujian ini sekarang?
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowFinishModal(false)}
                                className="w-full rounded-xl text-xs font-semibold h-10"
                            >
                                Lanjutkan Pengerjaan
                            </Button>
                            <Button
                                onClick={handleSubmitExam}
                                variant="destructive"
                                className="w-full rounded-xl font-bold text-xs h-10 shadow-xs"
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
