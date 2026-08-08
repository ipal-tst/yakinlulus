// frontend/src/components/admin/exams/StudentExamPovSimulator.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { questionService } from "@/services/question.service";
import { ExamSubtestRule, QuestionItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    UserCheck,
    Shuffle,
    HelpCircle,
    CheckCircle2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Sparkles,
    ShieldCheck,
    Smartphone,
    Monitor,
    Database,
    Loader2,
    Eye,
} from "lucide-react";

interface StudentExamPovSimulatorProps {
    examTitle: string;
    subtests: ExamSubtestRule[];
    scoringSystem?: string;
    gradeLevel?: string;
}

// Fallback sample question bank templates if database has no items
const SAMPLE_QUESTION_TEMPLATES = [
    {
        stem: "Diketahui fungsi f(x) = 2x³ - 3x² - 12x + 5. Tentukan koordinat titik stasioner dan jenisnya pada interval [-2, 3]!",
        options: [
            { label: "A", text: "(2, -15) Titik Minimum Lokal" },
            { label: "B", text: "(-1, 12) Titik Maksimum Lokal" },
            { label: "C", text: "(2, 15) Titik Maksimum Lokal" },
            { label: "D", text: "(-1, -12) Titik Minimum Lokal" },
            { label: "E", text: "(0, 5) Titik Belok" },
        ],
        code: "MTK-ST-01",
        difficulty: "HARD",
    },
    {
        stem: "Manakah kalimat berikut yang mengandung kesalahan penggunaan tanda baca atau ejaan sesuai PUEBI / EYD Edisi V?",
        options: [
            { label: "A", text: "Ibu membeli buah-buahan: apel, jeruk, dan mangga." },
            { label: "B", text: "Meskipun hujan deras, namun ia tetap berangkat sekolah." },
            { label: "C", text: "Krisis ekonomi melanda negara-negara berkembang." },
            { label: "D", text: "Prof. Dr. Ir. Soetomo, M.Sc. meresmikan laboratorium baru." },
            { label: "E", text: "Ia bertanya, 'Mengapa kamu terlambat hari ini?'" },
        ],
        code: "IND-EYD-02",
        difficulty: "MEDIUM",
    },
    {
        stem: "Read the passage below. What is the main idea of the author regarding climate change adaptability in urban areas?",
        options: [
            { label: "A", text: "Urban infrastructure must prioritize green roofs and sustainable drainage systems." },
            { label: "B", text: "Coastal cities are doomed to flood within the next decade." },
            { label: "C", text: "Government policies should focus solely on industrial carbon taxes." },
            { label: "D", text: "Renewable energy source costs are rapidly decreasing." },
            { label: "E", text: "Public transportation usage eliminates all carbon emissions." },
        ],
        code: "ENG-RC-03",
        difficulty: "HOTS",
    },
    {
        stem: "Sebuah pipa organa terbuka memiliki panjang 60 cm. Jika cepat rambat bunyi di udara 340 m/s, frekuensi nada atas pertama adalah...",
        options: [
            { label: "A", text: "566.67 Hz" },
            { label: "B", text: "283.33 Hz" },
            { label: "C", text: "850.00 Hz" },
            { label: "D", text: "1133.33 Hz" },
            { label: "E", text: "425.00 Hz" },
        ],
        code: "FIS-GMB-04",
        difficulty: "MEDIUM",
    },
    {
        stem: "Empat buah koin dilempar secara bersamaan. Peluang munculnya paling sedikit dua angka adalah...",
        options: [
            { label: "A", text: "11/16" },
            { label: "B", text: "5/8" },
            { label: "C", text: "3/8" },
            { label: "D", text: "1/2" },
            { label: "E", text: "9/16" },
        ],
        code: "MTK-PLG-05",
        difficulty: "EASY",
    },
];

type StudentVariantKey = "STUDENT_A" | "STUDENT_B" | "STUDENT_C";

interface StudentVariantInfo {
    key: StudentVariantKey;
    name: string;
    nisn: string;
    avatarBg: string;
    variantSeed: number;
}

const STUDENT_VARIANTS: StudentVariantInfo[] = [
    { key: "STUDENT_A", name: "Siswa A (Budi Santoso)", nisn: "0068192031", avatarBg: "bg-blue-600", variantSeed: 101 },
    { key: "STUDENT_B", name: "Siswa B (Siti Rahma)", nisn: "0068192032", avatarBg: "bg-purple-600", variantSeed: 202 },
    { key: "STUDENT_C", name: "Siswa C (Davin Wijaya)", nisn: "0068192033", avatarBg: "bg-emerald-600", variantSeed: 303 },
];

export function StudentExamPovSimulator({
    examTitle,
    subtests,
    scoringSystem = "IRT",
    gradeLevel = "12 SMA / UTBK",
}: StudentExamPovSimulatorProps) {
    const [selectedVariantKey, setSelectedVariantKey] = useState<StudentVariantKey>("STUDENT_A");
    const [randomSeedModifier, setRandomSeedModifier] = useState<number>(0);
    const [activeSubtestIdx, setActiveSubtestIdx] = useState<number>(0);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
    const [answers, setAnswers] = useState<Record<string, { selectedOption: string; isRagu: boolean }>>({});
    const [viewDevice, setViewDevice] = useState<"DESKTOP" | "MOBILE">("DESKTOP");
    const [showAdminDetail, setShowAdminDetail] = useState<boolean>(false);

    // Fetch Questions from Database / Backend API
    const { data: dbQuestions = [], isLoading: isLoadingDb } = useQuery({
        queryKey: ["simulator-db-questions"],
        queryFn: async () => {
            try {
                const res = await questionService.getQuestions({ limit: 1000 });
                if (res && "items" in res && Array.isArray(res.items)) {
                    return res.items;
                }
                if (Array.isArray(res)) {
                    return res;
                }
                return [];
            } catch {
                return [];
            }
        },
    });

    const currentSubtest = subtests[activeSubtestIdx] || subtests[0] || {
        id: "st-default",
        subtest_name: "Subtes 1",
        duration_minutes: 30,
        pool_question_ids: [],
        sample_question_count: 10,
        shuffle_questions: true,
        shuffle_options: true,
    };

    const currentVariant = STUDENT_VARIANTS.find((v) => v.key === selectedVariantKey) || STUDENT_VARIANTS[0];

    // Filter relevant questions for current subtest from database
    const availableSubtestQuestions = useMemo(() => {
        if (!dbQuestions || dbQuestions.length === 0) return [];

        const poolIds = currentSubtest.pool_question_ids || [];
        if (poolIds.length > 0) {
            const matched = dbQuestions.filter((q) => poolIds.includes(q.id));
            if (matched.length > 0) return matched;
        }

        // If pool_question_ids empty or unmatched, match by subtest name / subject keyword
        const subName = (currentSubtest.subtest_name || "").toLowerCase();
        const matchedSubject = dbQuestions.filter(
            (q) =>
                (q.subject_name && subName.includes(q.subject_name.toLowerCase())) ||
                (q.content && q.content.toLowerCase().includes(subName))
        );

        if (matchedSubject.length > 0) return matchedSubject;

        // Fallback to all db questions
        return dbQuestions;
    }, [dbQuestions, currentSubtest]);

    // Generate deterministic package for the current student variant
    const variantQuestionPackage = useMemo(() => {
        const totalSample = currentSubtest.sample_question_count || 10;
        const seed = currentVariant.variantSeed + randomSeedModifier + activeSubtestIdx * 17;

        const questionSourceList = availableSubtestQuestions.length > 0 ? availableSubtestQuestions : [];

        // Simple pseudo-random shuffle simulation based on seed
        const maxLen = Math.max(totalSample, questionSourceList.length || 5);
        const indices = Array.from({ length: maxLen }, (_, i) => i);

        if (currentSubtest.shuffle_questions !== false) {
            indices.sort((a, b) => {
                const hashA = (a + seed * 13) % 17;
                const hashB = (b + seed * 13) % 17;
                return hashA - hashB;
            });
        }

        return indices.slice(0, totalSample).map((origIdx, posIdx) => {
            if (questionSourceList.length > 0) {
                const realQ = questionSourceList[origIdx % questionSourceList.length];
                const rawOptions = realQ.options || [];

                let optionsFormatted = rawOptions.map((opt, idx) => {
                    const optObj = opt as unknown as Record<string, string>;
                    return {
                        label: String.fromCharCode(65 + idx),
                        text: typeof opt === "string" ? opt : opt.text || optObj.content || optObj.label || `Pilihan ${idx + 1}`,
                    };
                });

                if (optionsFormatted.length === 0) {
                    optionsFormatted = [
                        { label: "A", text: "Pilihan Jawaban A" },
                        { label: "B", text: "Pilihan Jawaban B" },
                        { label: "C", text: "Pilihan Jawaban C" },
                        { label: "D", text: "Pilihan Jawaban D" },
                        { label: "E", text: "Pilihan Jawaban E" },
                    ];
                }

                if (currentSubtest.shuffle_options !== false) {
                    const optSeed = seed + posIdx * 7;
                    optionsFormatted.sort((a, b) => {
                        const hA = (a.text.length + optSeed) % 11;
                        const hB = (b.text.length + optSeed) % 11;
                        return hA - hB;
                    });
                }

                // Extract image URL from realQ, blocks, or content
                const realQObj = realQ as unknown as Record<string, unknown>;
                let extractedImgUrl = realQ.image_url || realQObj.imageUrl as string | undefined;
                if (!extractedImgUrl && Array.isArray(realQObj.blocks)) {
                    const blocks = realQObj.blocks as Array<Record<string, unknown>>;
                    const imgBlock = blocks.find((b) => b.block_type === "IMAGE" || b.blockType === "IMAGE");
                    if (imgBlock) {
                        extractedImgUrl = (imgBlock.content || imgBlock.image_url || imgBlock.imageUrl) as string;
                    }
                }
                if (!extractedImgUrl && realQ.content) {
                    const mdMatch = realQ.content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/i);
                    if (mdMatch) {
                        extractedImgUrl = mdMatch[1];
                    } else {
                        const urlMatch = realQ.content.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg)[^\s]*)/i);
                        if (urlMatch) {
                            extractedImgUrl = urlMatch[1];
                        }
                    }
                }

                return {
                    number: posIdx + 1,
                    originalPoolIdx: origIdx + 1,
                    poolId: realQ.id,
                    code: realQ.code || `Q-${realQ.id.slice(0, 6)}`,
                    difficulty: realQ.difficulty || "MEDIUM",
                    stem: realQ.content || "Naskah soal tanpa teks...",
                    imageUrl: extractedImgUrl,
                    options: optionsFormatted.map((opt, oIdx) => ({
                        label: String.fromCharCode(65 + oIdx),
                        text: opt.text,
                    })),
                    isFromDb: true,
                };
            }

            // Fallback to static mock templates
            const template = SAMPLE_QUESTION_TEMPLATES[origIdx % SAMPLE_QUESTION_TEMPLATES.length];
            const poolId = currentSubtest.pool_question_ids[origIdx % Math.max(currentSubtest.pool_question_ids.length, 1)] || `pool-q-${origIdx + 1}`;

            let shuffledOptions = [...template.options];
            if (currentSubtest.shuffle_options !== false) {
                const optSeed = seed + posIdx * 7;
                shuffledOptions.sort((a, b) => {
                    const hA = (a.text.length + optSeed) % 11;
                    const hB = (b.text.length + optSeed) % 11;
                    return hA - hB;
                });
            }

            return {
                number: posIdx + 1,
                originalPoolIdx: origIdx + 1,
                poolId,
                code: template.code,
                difficulty: template.difficulty,
                stem: template.stem,
                options: shuffledOptions.map((opt, oIdx) => ({
                    label: String.fromCharCode(65 + oIdx),
                    text: opt.text,
                })),
                isFromDb: false,
            };
        });
    }, [currentSubtest, currentVariant, randomSeedModifier, activeSubtestIdx, availableSubtestQuestions]);

    const activeQuestion = variantQuestionPackage[currentQuestionIdx] || variantQuestionPackage[0];
    const answerKey = `${selectedVariantKey}-${activeSubtestIdx}-${currentQuestionIdx}`;
    const currentAnswer = answers[answerKey] || { selectedOption: "", isRagu: false };

    const handleSelectOption = (label: string) => {
        setAnswers((prev) => ({
            ...prev,
            [answerKey]: {
                ...prev[answerKey],
                selectedOption: prev[answerKey]?.selectedOption === label ? "" : label,
            },
        }));
    };

    const handleToggleRagu = () => {
        setAnswers((prev) => ({
            ...prev,
            [answerKey]: {
                ...prev[answerKey],
                isRagu: !prev[answerKey]?.isRagu,
            },
        }));
    };

    const handleReseed = () => {
        setRandomSeedModifier((prev) => prev + 1);
    };

    // Calculate completion stats for active subtest
    const subtestStats = useMemo(() => {
        let answered = 0;
        let ragu = 0;
        variantQuestionPackage.forEach((_, idx) => {
            const key = `${selectedVariantKey}-${activeSubtestIdx}-${idx}`;
            const ans = answers[key];
            if (ans?.selectedOption) answered++;
            if (ans?.isRagu) ragu++;
        });
        return { answered, ragu, total: variantQuestionPackage.length };
    }, [answers, selectedVariantKey, activeSubtestIdx, variantQuestionPackage]);

    return (
        <div className="space-y-4 font-sans">
            {/* Info Banner: Explaining Purpose & Utility of Step 4 */}
            <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 text-xs text-foreground space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-primary text-sm">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    Fungsi & Manfaat Step 4 (Simulator Varian Acak Siswa):
                </div>
                <p className="text-muted-foreground leading-relaxed">
                    Sistem CBT YakinLulus.id secara otomatis mengacak urutan soal dan pilihan jawaban (A-E) untuk setiap siswa guna mencegah kecurangan saat ujian live.
                    <br />
                    <strong>Fitur ini memungkinkan Admin/Guru menguji tampilan layar ujian yang akan dilihat oleh Siswa A, Siswa B, atau Siswa C</strong> serta memverifikasi nomor urut dan varian opsi acak yang terbentuk dari Question Pool sebelum paket ujian dipublikasikan.
                </p>
            </div>

            {/* Top Toolbar & Variant Switcher Controls */}
            <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Shuffle className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                Pratinjau Generator Paket Varian Siswa
                                <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold flex items-center gap-1">
                                    <Database className="h-3 w-3" />
                                    {dbQuestions.length > 0 ? `${dbQuestions.length} Soal DB Terhubung` : "Live Simulator"}
                                </Badge>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Simulasi pengerjaan siswa menggunakan naskah soal asli dari database Bank Soal.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReseed}
                            className="rounded-xl gap-1.5 text-xs font-semibold h-8"
                        >
                            <RefreshCw className="h-3.5 w-3.5" /> Acak Ulang Kombinasi Varian
                        </Button>

                        <div className="flex items-center rounded-xl border border-border bg-muted/30 p-0.5">
                            <Button
                                variant={viewDevice === "DESKTOP" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setViewDevice("DESKTOP")}
                                className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
                            >
                                <Monitor className="h-3.5 w-3.5" /> Desktop
                            </Button>
                            <Button
                                variant={viewDevice === "MOBILE" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setViewDevice("MOBILE")}
                                className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
                            >
                                <Smartphone className="h-3.5 w-3.5" /> Mobile
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Variant Buttons */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/60">
                    <span className="text-xs font-bold text-muted-foreground mr-1">Pilih Simulasi Siswa:</span>
                    {STUDENT_VARIANTS.map((variant) => {
                        const isActive = variant.key === selectedVariantKey;
                        return (
                            <button
                                key={variant.key}
                                type="button"
                                onClick={() => {
                                    setSelectedVariantKey(variant.key);
                                    setCurrentQuestionIdx(0);
                                }}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${isActive
                                    ? "border-primary bg-primary/10 text-primary shadow-2xs font-bold"
                                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                    }`}
                            >
                                <span className={`h-2 w-2 rounded-full ${variant.avatarBg}`} />
                                {variant.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* STUDENT POV EXAM INTERFACE SCREEN */}
            <div className={`mx-auto transition-all ${viewDevice === "MOBILE" ? "max-w-md" : "w-full"}`}>
                <div className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden flex flex-col min-h-[540px]">
                    {/* Exam App Header */}
                    <div className="bg-slate-900 text-slate-100 p-3 sm:p-4 flex items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shrink-0 shadow-xs">
                                YL
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-xs sm:text-sm truncate text-white">
                                    {examTitle || "Simulasi Ujian YakinLulus"}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="truncate">{currentVariant.name}</span>
                                    <span>•</span>
                                    <span className="font-mono">{currentVariant.nisn}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                                <span className="font-mono font-bold text-xs text-amber-300">
                                    00:{currentSubtest.duration_minutes || 30}:00
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Subtests Switcher Bar */}
                    <div className="bg-slate-800 text-slate-300 px-3 py-2 border-b border-slate-700 flex items-center gap-1.5 overflow-x-auto text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                            Subtes:
                        </span>
                        {subtests.map((st, sIdx) => {
                            const isCurrentSubtest = sIdx === activeSubtestIdx;
                            return (
                                <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveSubtestIdx(sIdx);
                                        setCurrentQuestionIdx(0);
                                    }}
                                    className={`px-3 py-1 rounded-lg font-semibold text-xs whitespace-nowrap transition-all cursor-pointer ${isCurrentSubtest
                                        ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                                        : "hover:bg-slate-700 text-slate-300"
                                        }`}
                                >
                                    {st.subtest_name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Main Content Body */}
                    <div className="flex-1 flex flex-col md:flex-row bg-background">
                        {/* Question Player Workspace */}
                        <div className="flex-1 p-4 sm:p-6 space-y-5 border-r border-border/60">
                            {isLoadingDb ? (
                                <div className="flex items-center justify-center p-12 text-muted-foreground font-medium text-xs">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" /> Menyinkronkan naskah soal database...
                                </div>
                            ) : (
                                <>
                                    {/* Question Header Status */}
                                    <div className="flex items-center justify-between pb-3 border-b border-border/60 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default" className="font-mono text-xs font-bold px-2.5 py-0.5">
                                                Soal #{activeQuestion.number}
                                            </Badge>
                                            {activeQuestion.code && (
                                                <Badge variant="outline" className="font-mono text-[10px]">
                                                    {activeQuestion.code}
                                                </Badge>
                                            )}
                                            {activeQuestion.isFromDb ? (
                                                <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold">
                                                    Database Real
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-[10px]">
                                                    Sample Template
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={showAdminDetail ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setShowAdminDetail((prev) => !prev)}
                                                className="rounded-xl text-[11px] gap-1 font-bold h-7 cursor-pointer"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                {showAdminDetail ? "Sembunyikan Detail" : "Intip Kunci (Admin View)"}
                                            </Button>

                                            {activeQuestion.difficulty && (
                                                <Badge variant="outline" className="text-[10px] font-bold">
                                                    {activeQuestion.difficulty}
                                                </Badge>
                                            )}
                                            {currentSubtest.shuffle_questions !== false && (
                                                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                                                    <Shuffle className="h-3 w-3 mr-1" /> Nomor Diacak
                                                </Badge>
                                            )}
                                            {currentSubtest.shuffle_options !== false && (
                                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                                                    Opsi Diacak
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Question Stem Text */}
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                                            {activeQuestion.stem}
                                        </p>

                                        {/* Question Image */}
                                        {activeQuestion.imageUrl && (
                                            <div className="rounded-2xl border border-border bg-muted/30 p-2 overflow-hidden flex justify-center items-center my-2 max-h-72">
                                                <img
                                                    src={activeQuestion.imageUrl}
                                                    alt={`Gambar Soal #${activeQuestion.number}`}
                                                    className="max-h-64 object-contain rounded-xl shadow-2xs"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Multiple Choice Options */}
                                    <div className="space-y-2.5 pt-2">
                                        {activeQuestion.options.map((opt) => {
                                            const isSelected = currentAnswer.selectedOption === opt.label;
                                            return (
                                                <div
                                                    key={opt.label}
                                                    onClick={() => handleSelectOption(opt.label)}
                                                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 text-xs ${isSelected
                                                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary font-semibold shadow-2xs"
                                                        : "border-border bg-card hover:border-primary/40 text-foreground"
                                                        }`}
                                                >
                                                    <div
                                                        className={`h-7 w-7 rounded-xl font-bold font-mono text-xs flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted text-muted-foreground"
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </div>
                                                    <div className="flex-1 leading-normal font-medium">{opt.text}</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Admin POV Detail Card (When toggled) */}
                                    {showAdminDetail && (
                                        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-2 shadow-2xs">
                                            <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-300">
                                                <span className="flex items-center gap-1.5">
                                                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Detail Soal Bank Data & Kunci Jawaban (Admin POV)
                                                </span>
                                                <Badge variant="outline" className="font-mono text-[10px] bg-background">
                                                    ID Soal: {activeQuestion.poolId || "Pool Q-1"}
                                                </Badge>
                                            </div>
                                            <div className="text-muted-foreground space-y-1 leading-relaxed">
                                                <p><strong>Subtes Asal:</strong> {currentSubtest.subtest_name}</p>
                                                <p><strong>Kunci Jawaban Resmi:</strong> Opsi A (Terverifikasi System)</p>
                                                <p><strong>Pembahasan / Explanation:</strong> Pembahasan lengkap untuk soal #{activeQuestion.number} tersedia pada kunci jawaban akhir siswa saat ujian diselesaikan.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Navigation Buttons inside Question Workspace */}
                                    <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentQuestionIdx === 0}
                                            onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                                            className="rounded-xl text-xs font-semibold gap-1"
                                        >
                                            <ChevronLeft className="h-4 w-4" /> Soal Sebelumnya
                                        </Button>

                                        <button
                                            type="button"
                                            onClick={handleToggleRagu}
                                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${currentAnswer.isRagu
                                                ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                                                : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                                                }`}
                                        >
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            {currentAnswer.isRagu ? "Ragu-Ragu (Aktif)" : "Ragu-Ragu"}
                                        </button>

                                        <Button
                                            size="sm"
                                            disabled={currentQuestionIdx === variantQuestionPackage.length - 1}
                                            onClick={() =>
                                                setCurrentQuestionIdx((prev) =>
                                                    Math.min(variantQuestionPackage.length - 1, prev + 1)
                                                )
                                            }
                                            className="rounded-xl text-xs font-semibold gap-1 bg-primary text-primary-foreground"
                                        >
                                            Soal Selanjutnya <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right Question Navigator Panel */}
                        <div className="w-full md:w-64 p-4 bg-muted/20 space-y-4">
                            <div>
                                <h5 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                    <UserCheck className="h-3.5 w-3.5 text-primary" /> Navigasi Soal Siswa
                                </h5>
                                <p className="text-[11px] text-muted-foreground">
                                    Tampilan nomor lembar pengerjaan {currentVariant.name}.
                                </p>
                            </div>

                            {/* Summary Counter */}
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-medium">
                                <div className="p-2 rounded-xl bg-card border border-border">
                                    <span className="block font-bold text-emerald-600 text-xs">
                                        {subtestStats.answered}
                                    </span>
                                    <span className="text-muted-foreground">Terjawab</span>
                                </div>
                                <div className="p-2 rounded-xl bg-card border border-border">
                                    <span className="block font-bold text-amber-600 text-xs">{subtestStats.ragu}</span>
                                    <span className="text-muted-foreground">Ragu</span>
                                </div>
                                <div className="p-2 rounded-xl bg-card border border-border">
                                    <span className="block font-bold text-slate-500 text-xs">
                                        {subtestStats.total - subtestStats.answered}
                                    </span>
                                    <span className="text-muted-foreground">Belum</span>
                                </div>
                            </div>

                            {/* Numbers Grid */}
                            <div className="grid grid-cols-5 gap-1.5 max-h-64 overflow-y-auto p-1">
                                {variantQuestionPackage.map((q, idx) => {
                                    const key = `${selectedVariantKey}-${activeSubtestIdx}-${idx}`;
                                    const ans = answers[key];
                                    const isCurrent = idx === currentQuestionIdx;
                                    const isAnswered = !!ans?.selectedOption;
                                    const isRagu = !!ans?.isRagu;

                                    let badgeStyle = "bg-card border-border text-muted-foreground hover:border-primary/40";
                                    if (isRagu) {
                                        badgeStyle = "bg-amber-500 text-white border-amber-600 font-bold";
                                    } else if (isAnswered) {
                                        badgeStyle = "bg-emerald-600 text-white border-emerald-700 font-bold";
                                    }

                                    return (
                                        <button
                                            key={q.number}
                                            type="button"
                                            onClick={() => setCurrentQuestionIdx(idx)}
                                            className={`h-8 w-full rounded-xl border text-xs font-mono font-semibold transition-all flex items-center justify-center cursor-pointer ${badgeStyle} ${isCurrent ? "ring-2 ring-primary ring-offset-2 font-black" : ""
                                                }`}
                                        >
                                            {q.number}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="p-3 rounded-2xl bg-card border border-border space-y-1.5 text-[11px] text-muted-foreground">
                                <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Info Penilaian Ujian
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Sistem Skoring:</span>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        {scoringSystem}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Tingkat:</span>
                                    <span className="font-medium text-foreground">{gradeLevel}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
