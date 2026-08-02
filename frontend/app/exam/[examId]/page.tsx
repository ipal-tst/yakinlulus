"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    LayoutGrid,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CBTOptionSelector } from "@/components/cbt/CBTOptionSelector";
import { CBTNavigationMatrix } from "@/components/cbt/CBTNavigationMatrix";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";
import { useStartExamSession, useCBTQuestions, useFinishExam } from "@/lib/api";

const mockExamQuestions: any[] = [
    {
        id: 1,
        subtest: "Matematika & Geometri",
        difficulty: "Sedang",
        introText: "Perhatikan gambar denah tata ruang rumah berikut ini.",
        hasDiagram: false,
        stemText: "",
        questionType: "MULTIPLE_CHOICE",
        customInstruction: "Pilihlah lebih dari satu pernyataan yang benar berikut:",
        options: [
            { id: "1", label: "(1)", text: "Keliling halaman sebenarnya 28,5 m" },
            { id: "2", label: "(2)", text: "Keliling garasi pada denah 13,5 cm" },
            { id: "3", label: "(3)", text: "Luas Ruang Tidur 1 sebenarnya $16,25 \\text{ m}^2$" },
            { id: "4", label: "(4)", text: "Luas Ruang Tidur 2 pada denah $18,56 \\text{ cm}^2$" },
        ],
    },
    {
        id: 2,
        subtest: "Geometri Kesebangunan",
        difficulty: "Mudah",
        introText: "",
        hasDiagram: false,
        stemText: "",
        questionType: "TRUE_FALSE",
        customInstruction: "Tentukan benar atau salah untuk setiap pernyataan berikut!",
        trueFalseStatements: [
            { id: "A", label: "A", statement: "Panjang $AB = 5 \\text{ cm}$" },
            { id: "B", label: "B", statement: "Besar $\\angle R = 81,9^\\circ$" },
            { id: "C", label: "C", statement: "Besar $\\angle P = 54,5^\\circ$" },
        ],
    },
    {
        id: 3,
        subtest: "Matematika Terapan",
        difficulty: "Mudah",
        introText: "",
        hasDiagram: false,
        stemText: "Lukisan dan karton sebangun, keliling lukisan ABCD adalah ....",
        questionType: "SINGLE_CHOICE",
        options: [
            { id: "A", label: "A", text: "210 cm" },
            { id: "B", label: "B", text: "220 cm" },
            { id: "C", label: "C", text: "250 cm" },
            { id: "D", label: "D", text: "280 cm" },
        ],
    },
    {
        id: 4,
        subtest: "Penalaran Kuantitatif",
        difficulty: "Sedang",
        introText: "Diketahui persamaan kuadrat $x^2 - 5x + 6 = 0$.",
        hasDiagram: false,
        stemText: "Akar-akar dari persamaan kuadrat tersebut adalah...",
        questionType: "SINGLE_CHOICE",
        options: [
            { id: "A", label: "A", text: "$x = 2$ atau $x = 3$" },
            { id: "B", label: "B", text: "$x = -2$ atau $x = -3$" },
            { id: "C", label: "C", text: "$x = 1$ atau $x = 6$" },
            { id: "D", label: "D", text: "$x = 0$ atau $x = 5$" },
            { id: "E", label: "E", text: "$x = -1$ atau $x = 6$" },
        ],
    },
];

const fallbackQuestion: any = mockExamQuestions[0];

export default function CBTExamWorkspacePage() {
    const params = useParams();
    const router = useRouter();

    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [answers, setAnswers] = React.useState<Record<number, any>>({ 1: ["1", "3"] });
    const [flagged, setFlagged] = React.useState<Record<number, boolean>>({});
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = React.useState(false);
    const [isMatrixOpen, setIsMatrixOpen] = React.useState(false);
    const [timeLeft, setTimeLeft] = React.useState(6323); // 01:45:23

    const examId = params?.examId as string;
    const startExam = useStartExamSession(examId);
    const finishExam = useFinishExam();

    const [sessionId, setSessionId] = React.useState<string | null>(null);
    const { data: cbtQuestions } = useCBTQuestions(sessionId || "_");

    // Auto-start session
    React.useEffect(() => {
        if (examId && !sessionId && !startExam.isPending) {
            startExam.mutateAsync().then((res: any) => {
                if (res?.id) setSessionId(res.id);
            }).catch(() => {
                // Fallback to mock data
            });
        }
    }, [examId]);

    const examQuestions = (cbtQuestions && (cbtQuestions as any).length > 0)
        ? (cbtQuestions as any[]).map((q: any, i: number) => ({
            id: i + 1,
            subtest: q.subjectName || "Umum",
            difficulty: q.difficulty === "EASY" ? "Mudah" : q.difficulty === "HARD" ? "Sangat Sulit" : "Sedang",
            introText: q.stimulus || "",
            stemText: q.stem,
            questionType: q.questionType,
            options: (q.options || []).map((o: any) => ({ id: o.id || o.label, label: o.label, text: o.text })),
            trueFalseStatements: q.questionType === "TRUE_FALSE" ? (q.options || []).map((o: any, idx: number) => ({ id: String(idx), label: String.fromCharCode(65 + idx), statement: o.text })) : [],
        }))
        : mockExamQuestions;

    // Timer countdown
    React.useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const currentQuestion: any = examQuestions[currentIndex] || examQuestions[0] || fallbackQuestion;

    // Navigation matrix status items
    const matrixItems = React.useMemo(() => {
        return examQuestions.map((q: any) => {
            const ans = answers[q.id];
            const hasAns = q.questionType === "TRUE_FALSE"
                ? ans && typeof ans === "object" && Object.keys(ans).length > 0
                : Array.isArray(ans) ? ans.length > 0 : !!ans;
            const isFlag = !!flagged[q.id];

            let status: "UNANSWERED" | "ANSWERED" | "FLAGGED" = "UNANSWERED";
            if (isFlag) status = "FLAGGED";
            else if (hasAns) status = "ANSWERED";

            return {
                id: q.id,
                code: `SOAL-${q.id}`,
                status,
                selectedAnswer: typeof ans === "string" ? ans : undefined,
            };
        });
    }, [answers, flagged, examQuestions]);

    const handleAnswerChange = (val: any) => {
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: val,
        }));
    };

    const handleToggleFlag = () => {
        setFlagged((prev) => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
    };

    const handleFinishExam = async () => {
        setIsSubmitDialogOpen(false);
        if (!sessionId) {
            router.push(`/student/exam/${examId}/result`);
            return;
        }
        try {
            await finishExam.mutateAsync(sessionId);
        } catch (err) {
            console.warn("Session finish status:", err);
        } finally {
            router.push(`/student/exam/${examId}/result`);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F1F5F9] text-[#1E293B] antialiased">
            {/* Top Navigation Header Bar */}
            <header className="h-16 border-b border-[#E2E8F0] bg-white px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-extrabold tracking-tight text-primary">
                        YakinLulus.id
                    </span>
                    <span className="text-[#64748B]/40 text-lg font-light">|</span>
                    <h1 className="text-sm md:text-base font-bold text-[#1E293B] truncate max-w-xs md:max-w-xl">
                        Simulasi UTBK SNBT 2024 - {currentQuestion.subtest}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-mono text-sm font-bold">
                        <Clock className="h-4 w-4 text-[#E11D48] shrink-0" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>

                    <button
                        onClick={() => setIsMatrixOpen(!isMatrixOpen)}
                        className="border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#1E293B] font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                    >
                        <LayoutGrid className="h-4 w-4 text-[#64748B]" />
                        <span className="hidden sm:inline">Navigasi Soal</span>
                    </button>

                    <Button
                        size="sm"
                        className="bg-[#D32F2F] hover:bg-[#C62828] text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg"
                        onClick={() => setIsSubmitDialogOpen(true)}
                    >
                        Akhiri Ujian
                    </Button>
                </div>
            </header>

            {/* Main Workspace (Split View) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 bg-[#F1F5F9] overflow-hidden">
                {/* Left Column: Stem & Stimulus (~55% / 6 cols) - scrollable on desktop */}
                <main className="lg:col-span-6 p-6 md:p-8 space-y-6 border-r border-[#E2E8F0] bg-white flex flex-col min-h-0 overflow-y-auto">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="bg-[#F1F5F9] text-[#1E293B] font-semibold text-xs px-3.5 py-1 rounded border border-[#E2E8F0]">
                                Soal No. {currentQuestion.id} / {examQuestions.length}
                            </span>
                            <span className="border border-primary/40 text-primary bg-primary/10 font-semibold text-xs px-3.5 py-0.5 rounded">
                                {currentQuestion.difficulty}
                            </span>
                        </div>

                        {currentQuestion.introText && (
                            <div className="text-sm md:text-base leading-relaxed text-[#1E293B] font-normal p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                                <MathKaTeXPreview content={currentQuestion.introText} invertDark={false} />
                            </div>
                        )}

                        {currentQuestion.stemText && (
                            <div className="text-sm md:text-base leading-relaxed text-[#1E293B] font-semibold">
                                <MathKaTeXPreview content={currentQuestion.stemText} invertDark={false} />
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Column: Option Renderer Selector (~45% / 6 cols) - fixed height, no scroll */}
                <aside className="lg:col-span-6 p-6 md:p-8 bg-[#F8FAFC] md:bg-white flex flex-col min-h-0">
                    <div className="space-y-4">
                        <h2 className="text-base md:text-lg font-bold text-[#1E293B] tracking-tight mb-2">
                            Pilihan Jawaban Soal:
                        </h2>

                        <CBTOptionSelector
                            questionType={currentQuestion.questionType}
                            options={currentQuestion.options}
                            statements={currentQuestion.trueFalseStatements}
                            selectedValues={answers[currentQuestion.id]}
                            onChange={handleAnswerChange}
                            customInstruction={currentQuestion.customInstruction}
                        />
                    </div>
                </aside>
            </div>

            {/* Bottom Controls */}
            <footer className="h-16 border-t border-[#E2E8F0] bg-white px-6 md:px-8 flex items-center justify-center gap-4 md:gap-8 sticky bottom-0 z-20">
                <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => prev - 1)}
                    className="border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#1E293B] font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                >
                    <ChevronLeft className="h-4 w-4 text-[#64748B]" />
                    <span>Sebelumnya</span>
                </button>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#1E293B] cursor-pointer select-none bg-[#FFF8E1] border border-[#FFE082] px-3.5 py-2 rounded-lg">
                    <input
                        type="checkbox"
                        checked={!!flagged[currentQuestion.id]}
                        onChange={handleToggleFlag}
                        className="h-4 w-4 rounded border-[#E2E8F0] text-[#F9A825] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[#B78103]">Tandai Ragu-ragu</span>
                </label>

                <button
                    onClick={() => {
                        if (currentIndex < examQuestions.length - 1) {
                            setCurrentIndex((prev) => prev + 1);
                        } else {
                            setIsSubmitDialogOpen(true);
                        }
                    }}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                    <span>{currentIndex === examQuestions.length - 1 ? "Akhiri Ujian" : "Selanjutnya"}</span>
                    <ChevronRight className="h-4 w-4" />
                </button>
            </footer>

            {/* Matrix Drawer */}
            {isMatrixOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-2xs"
                    onClick={() => setIsMatrixOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 right-0 z-50 w-80 bg-white border-l border-[#E2E8F0] p-5 space-y-4 transform transition-transform duration-200 ease-in-out shadow-xl ${isMatrixOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4 text-primary" />
                        <span className="font-bold text-sm text-[#1E293B]">Navigasi Nomor Soal</span>
                    </div>
                    <button
                        className="h-8 w-8 rounded-lg hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B] cursor-pointer"
                        onClick={() => setIsMatrixOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <CBTNavigationMatrix
                    items={matrixItems}
                    currentIndex={currentIndex}
                    onSelectQuestion={(idx) => {
                        setCurrentIndex(idx);
                        setIsMatrixOpen(false);
                    }}
                    columns={5}
                />

                <div className="pt-4 border-t border-[#E2E8F0]">
                    <Button
                        className="w-full bg-[#D32F2F] hover:bg-[#C62828] text-white font-semibold text-xs py-2.5 rounded-lg"
                        onClick={() => {
                            setIsMatrixOpen(false);
                            setIsSubmitDialogOpen(true);
                        }}
                    >
                        Akhiri Ujian Sekarang
                    </Button>
                </div>
            </aside>

            {/* Finish Dialog */}
            <Dialog
                isOpen={isSubmitDialogOpen}
                onClose={() => setIsSubmitDialogOpen(false)}
                title="Selesaikan & Akhiri Sesi Ujian?"
                description="Pastikan semua nomor soal telah dijawab dan diperiksa kembali sebelum penyerahan final."
            >
                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                        <div>
                            <span className="text-[#64748B] block text-[10px]">Terjawab</span>
                            <span className="font-bold text-[#2E7D32] text-base">
                                {matrixItems.filter((i) => i.status === "ANSWERED").length}
                            </span>
                        </div>
                        <div>
                            <span className="text-[#64748B] block text-[10px]">Ragu-Ragu</span>
                            <span className="font-bold text-[#F9A825] text-base">
                                {matrixItems.filter((i) => i.status === "FLAGGED").length}
                            </span>
                        </div>
                        <div>
                            <span className="text-[#64748B] block text-[10px]">Kosong</span>
                            <span className="font-bold text-[#64748B] text-base">
                                {matrixItems.filter((i) => i.status === "UNANSWERED").length}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setIsSubmitDialogOpen(false)}>
                            Kembali Kerjakan
                        </Button>
                        <Button size="sm" className="bg-[#D32F2F] hover:bg-[#C62828] text-white" onClick={handleFinishExam}>
                            Ya, Akhiri Ujian Now
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
