// frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { academicService } from "@/services/academic.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Flag,
    CheckCircle2,
    AlertTriangle,
    Save,
    Grid,
    BookOpen,
    FileText,
    CheckSquare,
    Square,
    Check,
    X,
    HelpCircle,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type QuestionType =
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE_MATRIX"
    | "SUITABILITY_MATRIX";

export interface StatementRow {
    id: string;
    statement: string;
}

export interface MockQuestion {
    id: string;
    number: number;
    subtestName?: string;
    type: QuestionType;
    content: string;
    options?: { key: string; text: string }[];
    statements?: StatementRow[];
}

const MOCK_QUESTIONS: MockQuestion[] = [
    {
        id: "q-1",
        number: 1,
        type: "SINGLE_CHOICE",
        subtestName: "Penalaran Kuantitatif",
        content:
            "Jika x + y = 10 dan xy = 21, maka berapakah nilai dari x² + y²?\n\nPetunjuk: Gunakan identitas aljabar dasar (x + y)² = x² + 2xy + y².",
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
        type: "MULTIPLE_CHOICE",
        subtestName: "Penalaran Umum (Pilihan Ganda Kompleks)",
        content:
            "Manakah di antara pernyataan-pernyataan matematika berikut yang bernilai BENAR?\n(Petunjuk: Pilih semua jawaban yang benar, pilihan dapat lebih dari satu).",
        options: [
            { key: "A", text: "Jumlah sudut dalam suatu segitiga adalah 180°" },
            { key: "B", text: "Bilangan 2 merupakan satu-satunya bilangan genap yang prima" },
            { key: "C", text: "Akar kuadrat dari 81 hanya bernilai 9 positif" },
            { key: "D", text: "Semua bilangan yang berakhiran angka 0 pasti habis dibagi 5 dan 10" },
            { key: "E", text: "Luas lingkaran dengan jari-jari r adalah 2πr" },
        ],
    },
    {
        id: "q-3",
        number: 3,
        type: "TRUE_FALSE_MATRIX",
        subtestName: "Penalaran Kuantitatif (Matriks Benar / Salah)",
        content:
            "Tentukan apakah setiap pernyataan statistik berikut bernilai BENAR atau SALAH berdasarkan konsep matematika dasar:",
        statements: [
            { id: "s-1", statement: "Nilai rata-rata (mean) dari data 4, 6, 8, 10 adalah 7." },
            { id: "s-2", statement: "Median dari data terurut selalu sama dengan kuartil tengah (Q2)." },
            { id: "s-3", statement: "Modus adalah nilai data yang frekuensi kemunculannya paling tinggi." },
            { id: "s-4", statement: "Simpangan baku tidak pernah bernilai negatif." },
        ],
    },
    {
        id: "q-4",
        number: 4,
        type: "SUITABILITY_MATRIX",
        subtestName: "Literasi Bahasa Indonesia (Matriks Sesuai / Tidak Sesuai)",
        content:
            "Bacalah teks singkat berikut:\n\n'Transisi energi terbarukan di Indonesia membutuhkan investasi teknologi dan regulasi yang konsisten. Meskipun potensi energi surya dan angin sangat tinggi, tantangan utama terletak pada efisiensi penyimpanan baterai jaringan listrik.'\n\nBerdasarkan kutipan teks di atas, tentukan apakah pernyataan berikut SESUAI atau TIDAK SESUAI:",
        statements: [
            { id: "st-1", statement: "Potensi energi surya dan angin di Indonesia dinilai sangat melimpah." },
            { id: "st-2", statement: "Investasi teknologi dan regulasi tidak lagi diperlukan dalam transisi energi." },
            { id: "st-3", statement: "Efisiensi penyimpanan baterai jaringan merupakan tantangan utama." },
        ],
    },
    {
        id: "q-5",
        number: 5,
        type: "MULTIPLE_CHOICE",
        subtestName: "Literasi Bahasa Inggris (Pilihan Ganda Kompleks)",
        content:
            "Select ALL statements that are ACCURATE regarding effective essay structure and academic writing principles:",
        options: [
            { key: "A", text: "A strong thesis statement presents the main argument of the essay." },
            { key: "B", text: "Topic sentences should introduce the main idea of each paragraph." },
            { key: "C", text: "Informal slang and contractions should be used frequently in formal papers." },
            { key: "D", text: "Proper citations are mandatory to avoid plagiarism." },
        ],
    },
    {
        id: "q-6",
        number: 6,
        type: "SINGLE_CHOICE",
        subtestName: "Penalaran Matematika",
        content:
            "Sebuah tangki air awal mula terisi 3/5 bagian dari total volumenya. Jika ke dalam tangki tersebut ditambahkan 12 liter air, tangki tersebut menjadi terisi 3/4 bagian.\n\nBerapakah kapasitas volume total dari tangki tersebut dalam satuan liter?",
        options: [
            { key: "A", text: "60 liter" },
            { key: "B", text: "80 liter" },
            { key: "C", text: "90 liter" },
            { key: "D", text: "120 liter" },
            { key: "E", text: "150 liter" },
        ],
    },
];

export default function CBTPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params?.id as string;

    const [currentIndex, setCurrentIndex] = useState(0);

    // Answers state can hold strings, string arrays (multiple choice), or record objects (matrices)
    const [answers, setAnswers] = useState<Record<string, any>>({});
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
    const isFlagged = flags[currentQ.id];

    // Single Choice Handler
    const handleSelectSingleOption = (key: string) => {
        setAutoSaveStatus("SAVING");
        setAnswers((prev) => ({ ...prev, [currentQ.id]: key }));
        setTimeout(() => setAutoSaveStatus("SAVED"), 300);
    };

    // Multiple Choice (Checkbox) Handler
    const handleToggleMultipleOption = (key: string) => {
        setAutoSaveStatus("SAVING");
        setAnswers((prev) => {
            const existing: string[] = Array.isArray(prev[currentQ.id]) ? prev[currentQ.id] : [];
            const updated = existing.includes(key)
                ? existing.filter((k) => k !== key)
                : [...existing, key];
            return { ...prev, [currentQ.id]: updated };
        });
        setTimeout(() => setAutoSaveStatus("SAVED"), 300);
    };

    // Matrix Choice Handler (True/False or Suitability)
    const handleSetMatrixValue = (rowId: string, val: string) => {
        setAutoSaveStatus("SAVING");
        setAnswers((prev) => {
            const existingMatrix: Record<string, string> =
                typeof prev[currentQ.id] === "object" && !Array.isArray(prev[currentQ.id])
                    ? prev[currentQ.id]
                    : {};
            return {
                ...prev,
                [currentQ.id]: {
                    ...existingMatrix,
                    [rowId]: val,
                },
            };
        });
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

    const isQuestionAnswered = (qId: string) => {
        const val = answers[qId];
        if (!val) return false;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "object") return Object.keys(val).length > 0;
        return typeof val === "string" && val.trim() !== "";
    };

    const totalAnswered = MOCK_QUESTIONS.filter((q) => isQuestionAnswered(q.id)).length;
    const totalFlagged = Object.keys(flags).filter((k) => flags[k]).length;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col select-none overflow-hidden h-screen font-sans">
            {/* CBT Header Bar */}
            <header className="sticky top-0 z-30 h-16 bg-card border-b border-border px-4 md:px-6 flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold font-heading text-base shadow-xs">
                        YL
                    </div>
                    <div>
                        <h2 className="font-heading font-bold text-sm leading-tight text-foreground">
                            Try Out UTBK Master - Semua Tipe Soal 2026
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
                        <div className="flex items-center justify-between pb-4 border-b border-border/80 flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 px-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                                    Soal #{currentQ.number}
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">
                                    dari {MOCK_QUESTIONS.length} Soal Ujian
                                </span>
                            </div>

                            {/* Badge Type Indicator */}
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[11px] font-bold gap-1 px-3 py-1 rounded-xl",
                                    currentQ.type === "SINGLE_CHOICE" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                                    currentQ.type === "MULTIPLE_CHOICE" && "bg-purple-500/10 text-purple-600 border-purple-500/20",
                                    currentQ.type === "TRUE_FALSE_MATRIX" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                    currentQ.type === "SUITABILITY_MATRIX" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                )}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                {currentQ.type === "SINGLE_CHOICE" && "Pilihan Ganda (1 Jawaban Benar)"}
                                {currentQ.type === "MULTIPLE_CHOICE" && "Pilihan Ganda Kompleks (Bisa >1 Jawaban)"}
                                {currentQ.type === "TRUE_FALSE_MATRIX" && "Matriks: | Benar | Salah |"}
                                {currentQ.type === "SUITABILITY_MATRIX" && "Matriks: | Sesuai | Tidak Sesuai |"}
                            </Badge>
                        </div>

                        {/* Main Question Text Content */}
                        <div className="text-base sm:text-lg font-medium leading-relaxed text-foreground whitespace-pre-line bg-card/60 p-6 rounded-3xl border border-border/70 shadow-2xs">
                            {currentQ.content}
                        </div>
                    </div>
                </section>

                {/* RIGHT PANEL: OPSI JAWABAN / ANSWER OPTIONS SECTION */}
                <section className="w-full md:w-[480px] lg:w-[560px] shrink-0 bg-card/50 p-6 md:p-8 overflow-y-auto flex flex-col justify-between space-y-6 border-l border-border/60">
                    <div className="space-y-5">
                        {/* Header for Answer Options & Ragu Toggle */}
                        <div className="flex items-center justify-between pb-3 border-b border-border/80">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" /> Jawab Pernyataan / Opsi
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

                        {/* RENDERER 1: SINGLE CHOICE (Radio) */}
                        {currentQ.type === "SINGLE_CHOICE" && currentQ.options && (
                            <div className="space-y-3">
                                {currentQ.options.map((opt) => {
                                    const isSelected = answers[currentQ.id] === opt.key;
                                    return (
                                        <button
                                            key={opt.key}
                                            onClick={() => handleSelectSingleOption(opt.key)}
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
                        )}

                        {/* RENDERER 2: MULTIPLE CHOICE (Checkbox) */}
                        {currentQ.type === "MULTIPLE_CHOICE" && currentQ.options && (
                            <div className="space-y-3">
                                <span className="text-xs text-purple-600 font-semibold block bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                                    💡 Petunjuk: Anda dapat mencentang lebih dari satu opsi jawaban di bawah ini.
                                </span>
                                {currentQ.options.map((opt) => {
                                    const selectedArr: string[] = Array.isArray(answers[currentQ.id])
                                        ? answers[currentQ.id]
                                        : [];
                                    const isSelected = selectedArr.includes(opt.key);

                                    return (
                                        <button
                                            key={opt.key}
                                            onClick={() => handleToggleMultipleOption(opt.key)}
                                            className={cn(
                                                "w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer shadow-2xs group",
                                                isSelected
                                                    ? "border-purple-500 bg-purple-500/10 text-purple-950 dark:text-purple-300 font-semibold shadow-xs ring-1 ring-purple-500/40"
                                                    : "border-border bg-card hover:bg-muted/60 text-foreground"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-colors",
                                                    isSelected
                                                        ? "bg-purple-600 text-white shadow-xs"
                                                        : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                                                )}
                                            >
                                                {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                            </div>
                                            <span className="text-sm pt-1 leading-normal">
                                                <strong className="mr-2 font-mono">{opt.key}.</strong> {opt.text}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* RENDERER 3: TRUE / FALSE MATRIX TABLE */}
                        {currentQ.type === "TRUE_FALSE_MATRIX" && currentQ.statements && (
                            <div className="space-y-4">
                                <span className="text-xs text-emerald-600 font-semibold block bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                                    💡 Petunjuk: Pilih [ BENAR ] atau [ SALAH ] untuk setiap baris pernyataan di bawah.
                                </span>

                                <div className="space-y-3">
                                    {currentQ.statements.map((st, idx) => {
                                        const currentObj = typeof answers[currentQ.id] === "object" ? answers[currentQ.id] : {};
                                        const val = currentObj?.[st.id];

                                        return (
                                            <div
                                                key={st.id}
                                                className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-2xs"
                                            >
                                                <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                                                    <span className="font-bold text-primary mr-1">{idx + 1}.</span> {st.statement}
                                                </p>

                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <button
                                                        onClick={() => handleSetMatrixValue(st.id, "BENAR")}
                                                        className={cn(
                                                            "py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                                            val === "BENAR"
                                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                                                        )}
                                                    >
                                                        <Check className="h-3.5 w-3.5" /> BENAR
                                                    </button>

                                                    <button
                                                        onClick={() => handleSetMatrixValue(st.id, "SALAH")}
                                                        className={cn(
                                                            "py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                                            val === "SALAH"
                                                                ? "bg-red-600 text-white border-red-600 shadow-xs"
                                                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                                                        )}
                                                    >
                                                        <X className="h-3.5 w-3.5" /> SALAH
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* RENDERER 4: SUITABILITY MATRIX TABLE */}
                        {currentQ.type === "SUITABILITY_MATRIX" && currentQ.statements && (
                            <div className="space-y-4">
                                <span className="text-xs text-amber-600 font-semibold block bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                                    💡 Petunjuk: Pilih [ SESUAI ] atau [ TIDAK SESUAI ] untuk setiap baris pernyataan di bawah.
                                </span>

                                <div className="space-y-3">
                                    {currentQ.statements.map((st, idx) => {
                                        const currentObj = typeof answers[currentQ.id] === "object" ? answers[currentQ.id] : {};
                                        const val = currentObj?.[st.id];

                                        return (
                                            <div
                                                key={st.id}
                                                className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-2xs"
                                            >
                                                <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                                                    <span className="font-bold text-primary mr-1">{idx + 1}.</span> {st.statement}
                                                </p>

                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <button
                                                        onClick={() => handleSetMatrixValue(st.id, "SESUAI")}
                                                        className={cn(
                                                            "py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                                            val === "SESUAI"
                                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                                                        )}
                                                    >
                                                        <Check className="h-3.5 w-3.5" /> SESUAI
                                                    </button>

                                                    <button
                                                        onClick={() => handleSetMatrixValue(st.id, "TIDAK_SESUAI")}
                                                        className={cn(
                                                            "py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                                            val === "TIDAK_SESUAI"
                                                                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                                                        )}
                                                    >
                                                        <X className="h-3.5 w-3.5" /> TIDAK SESUAI
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
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
                                    const answered = isQuestionAnswered(q.id);
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
