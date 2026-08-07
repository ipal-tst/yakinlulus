"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Plus,
    Trash2,
    CheckCircle2,
    Save,
    BookOpen,
    HelpCircle,
    Flame,
    Calculator,
    Clock,
    Layers,
    Eye,
    Code,
    Sparkles,
} from "lucide-react";
import { DifficultyLevel, QuestionType, BloomsLevel } from "@/types/question-bank";

export default function CreateQuestionPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [classification, setClassification] = useState({
        level: "SMA / UTBK",
        grade: "Kelas 12",
        subject: "Penalaran Matematika",
        chapter: "Aljabar & Sistem Persamaan",
        topic: "SPLDV & Kuadrat",
        competency: "Pemecahan Masalah Aljabar Kuadrat",
        curriculum: "Kurikulum Merdeka",
    });

    const [metadata, setMetadata] = useState({
        difficulty: "MEDIUM" as DifficultyLevel,
        questionType: "SINGLE_CHOICE" as QuestionType,
        bloomsLevel: "C3" as BloomsLevel,
        estimatedTimeSeconds: 120,
        isHots: true,
        isCalculatorAllowed: false,
        isRandomizable: true,
    });

    const [content, setContent] = useState(
        "Jika 3x + 2y = 18 dan x - y = 1, berapakah nilai x² + y²?"
    );

    const [latexFormula, setLatexFormula] = useState("\\sqrt{x^2 + y^2}");

    const [options, setOptions] = useState([
        { label: "A", text: "20", isCorrect: false, score: 0 },
        { label: "B", text: "22", isCorrect: false, score: 0 },
        { label: "C", text: "24", isCorrect: false, score: 0 },
        { label: "D", text: "25", isCorrect: true, score: 100 },
        { label: "E", text: "30", isCorrect: false, score: 0 },
    ]);

    const [explanation, setExplanation] = useState(
        "Eliminasi sistem persamaan: x = y + 1 => 3(y+1) + 2y = 18 => 5y = 15 => y = 3, x = 4. Maka x² + y² = 16 + 9 = 25."
    );

    const [hints, setHints] = useState([
        "Gunakan metode substitusi untuk menemukan nilai x dan y terlebih dahulu.",
    ]);

    const handleOptionTextChange = (index: number, text: string) => {
        setOptions((prev) => {
            const next = [...prev];
            next[index].text = text;
            return next;
        });
    };

    const handleSelectCorrect = (index: number) => {
        setOptions((prev) =>
            prev.map((opt, i) => ({
                ...opt,
                isCorrect: i === index,
                score: i === index ? 100 : 0,
            }))
        );
    };

    const handleAddOption = () => {
        if (options.length >= 6) return;
        const labels = ["A", "B", "C", "D", "E", "F"];
        const nextLabel = labels[options.length];
        setOptions((prev) => [
            ...prev,
            { label: nextLabel, text: "", isCorrect: false, score: 0 },
        ]);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length <= 2) return;
        setOptions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddHint = () => {
        setHints((prev) => [...prev, ""]);
    };

    const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
        setIsSaving(true);
        await new Promise((res) => setTimeout(res, 800));
        setIsSaving(false);
        alert(`Berhasil menyimpan soal dengan status ${status}!`);
        router.push("/admin/questions");
    };

    return (
        <AppShell>
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Header Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/questions">
                            <Button variant="outline" size="icon" className="rounded-xl border-border">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-heading text-2xl font-bold tracking-tight">
                                Form Authoring & Tambah Soal Baru
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Tambah butir soal lengkap dengan taksonomi kognitif, blok konten, dan kunci jawaban.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit("DRAFT")}
                            disabled={isSaving}
                            className="rounded-xl font-semibold border-border gap-2"
                        >
                            <Save className="h-4 w-4" /> Simpan Draft
                        </Button>
                        <Button
                            onClick={() => handleSubmit("PUBLISHED")}
                            disabled={isSaving}
                            className="rounded-xl font-bold gap-2 bg-primary text-primary-foreground"
                        >
                            <CheckCircle2 className="h-4 w-4" /> Publish Soal
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Form Sections (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Section 1: Hierarchical Classification */}
                        <Card className="p-6 border border-border rounded-2xl space-y-4 shadow-2xs">
                            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <h2 className="font-heading font-bold text-base">
                                    1. Klasifikasi Master Akademik
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Jenjang Pendidikan</label>
                                    <select
                                        value={classification.level}
                                        onChange={(e) =>
                                            setClassification((p) => ({ ...p, level: e.target.value }))
                                        }
                                        className="w-full h-10 rounded-xl border border-input bg-background px-3"
                                    >
                                        <option value="SD">SD / MI</option>
                                        <option value="SMP">SMP / MTs</option>
                                        <option value="SMA / UTBK">SMA / MA / UTBK-SNBT</option>
                                        <option value="Kedinasan">CPNS & Kedinasan</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Mata Pelajaran</label>
                                    <select
                                        value={classification.subject}
                                        onChange={(e) =>
                                            setClassification((p) => ({ ...p, subject: e.target.value }))
                                        }
                                        className="w-full h-10 rounded-xl border border-input bg-background px-3"
                                    >
                                        <option value="Penalaran Matematika">Penalaran Matematika</option>
                                        <option value="Literasi Bahasa Indonesia">Literasi Bahasa Indonesia</option>
                                        <option value="Literasi Bahasa Inggris">Literasi Bahasa Inggris</option>
                                        <option value="Penalaran Umum">Penalaran Umum</option>
                                        <option value="Fisika">Fisika</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Bab Pelajaran</label>
                                    <Input
                                        value={classification.chapter}
                                        onChange={(e) =>
                                            setClassification((p) => ({ ...p, chapter: e.target.value }))
                                        }
                                        placeholder="Nama Bab..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Sub-bab / Topik</label>
                                    <Input
                                        value={classification.topic}
                                        onChange={(e) =>
                                            setClassification((p) => ({ ...p, topic: e.target.value }))
                                        }
                                        placeholder="Nama Topik..."
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Section 2: Cognitive Metadata & Attributes */}
                        <Card className="p-6 border border-border rounded-2xl space-y-4 shadow-2xs">
                            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                <h2 className="font-heading font-bold text-base">
                                    2. Metadata Kognitif & Pengaturan Soal
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Tipe Soal</label>
                                    <select
                                        value={metadata.questionType}
                                        onChange={(e) =>
                                            setMetadata((p) => ({
                                                ...p,
                                                questionType: e.target.value as QuestionType,
                                            }))
                                        }
                                        className="w-full h-10 rounded-xl border border-input bg-background px-3"
                                    >
                                        <option value="SINGLE_CHOICE">Pilihan Ganda (Single Choice)</option>
                                        <option value="MULTIPLE_CHOICE">PG Kompleks (Multiple Answer)</option>
                                        <option value="TRUE_FALSE">Benar / Salah</option>
                                        <option value="SHORT_ANSWER">Isian Singkat</option>
                                        <option value="ESSAY">Uraian / Essay</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Tingkat Kesulitan</label>
                                    <select
                                        value={metadata.difficulty}
                                        onChange={(e) =>
                                            setMetadata((p) => ({
                                                ...p,
                                                difficulty: e.target.value as DifficultyLevel,
                                            }))
                                        }
                                        className="w-full h-10 rounded-xl border border-input bg-background px-3"
                                    >
                                        <option value="EASY">EASY</option>
                                        <option value="MEDIUM">MEDIUM</option>
                                        <option value="HARD">HARD</option>
                                        <option value="EXPERT">EXPERT</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Taksonomi Bloom</label>
                                    <select
                                        value={metadata.bloomsLevel}
                                        onChange={(e) =>
                                            setMetadata((p) => ({
                                                ...p,
                                                bloomsLevel: e.target.value as BloomsLevel,
                                            }))
                                        }
                                        className="w-full h-10 rounded-xl border border-input bg-background px-3"
                                    >
                                        <option value="C1">C1 - Pemahaman / Knowledge</option>
                                        <option value="C2">C2 - Comprehension</option>
                                        <option value="C3">C3 - Application</option>
                                        <option value="C4">C4 - Analysis</option>
                                        <option value="C5">C5 - Evaluation</option>
                                        <option value="C6">C6 - Creation</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={metadata.isHots}
                                        onChange={(e) =>
                                            setMetadata((p) => ({ ...p, isHots: e.target.checked }))
                                        }
                                        className="rounded border-input text-primary h-4 w-4"
                                    />
                                    <span className="font-semibold flex items-center gap-1">
                                        <Flame className="h-3.5 w-3.5 text-rose-500" /> Kategori HOTS
                                    </span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={metadata.isCalculatorAllowed}
                                        onChange={(e) =>
                                            setMetadata((p) => ({
                                                ...p,
                                                isCalculatorAllowed: e.target.checked,
                                            }))
                                        }
                                        className="rounded border-input text-primary h-4 w-4"
                                    />
                                    <span className="font-semibold flex items-center gap-1">
                                        <Calculator className="h-3.5 w-3.5 text-indigo-500" /> Boleh Pakai Kalkulator
                                    </span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={metadata.isRandomizable}
                                        onChange={(e) =>
                                            setMetadata((p) => ({
                                                ...p,
                                                isRandomizable: e.target.checked,
                                            }))
                                        }
                                        className="rounded border-input text-primary h-4 w-4"
                                    />
                                    <span className="font-semibold">Acak Urutan Opsi</span>
                                </label>
                            </div>
                        </Card>

                        {/* Section 3: Content Block Editor */}
                        <Card className="p-6 border border-border rounded-2xl space-y-4 shadow-2xs">
                            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                <Layers className="h-5 w-5 text-indigo-500" />
                                <h2 className="font-heading font-bold text-base">
                                    3. Editor Konten Utama Soal
                                </h2>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Teks Narasi Soal</label>
                                    <textarea
                                        rows={4}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Tuliskan narasi atau soal..."
                                        className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div className="p-3 bg-muted/40 rounded-xl space-y-2">
                                    <label className="font-semibold text-foreground flex items-center gap-1.5">
                                        <Code className="h-3.5 w-3.5 text-emerald-500" /> Formula LaTeX (Opsional)
                                    </label>
                                    <Input
                                        value={latexFormula}
                                        onChange={(e) => setLatexFormula(e.target.value)}
                                        placeholder="Contoh: \sqrt{x^2 + y^2}"
                                        className="font-mono bg-background"
                                    />
                                    {latexFormula && (
                                        <div className="p-2 rounded bg-background border border-border font-mono text-emerald-600 dark:text-emerald-400">
                                            Preview Formula: {latexFormula}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Section 4: Options Builder */}
                        <Card className="p-6 border border-border rounded-2xl space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="h-5 w-5 text-emerald-500" />
                                    <h2 className="font-heading font-bold text-base">
                                        4. Opsi Jawaban & Kunci
                                    </h2>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddOption}
                                    className="rounded-xl text-xs gap-1"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Tambah Opsi
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {options.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${opt.isCorrect
                                                ? "border-emerald-500 bg-emerald-500/5"
                                                : "border-border bg-card"
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleSelectCorrect(idx)}
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer ${opt.isCorrect
                                                    ? "bg-emerald-500 text-white"
                                                    : "bg-muted text-muted-foreground hover:bg-accent"
                                                }`}
                                            title="Klik untuk jadikan kunci jawaban"
                                        >
                                            {opt.label}
                                        </button>

                                        <Input
                                            value={opt.text}
                                            onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                                            placeholder={`Isi pilihan jawaban ${opt.label}...`}
                                            className="text-xs flex-1"
                                        />

                                        {opt.isCorrect && (
                                            <Badge className="bg-emerald-500 text-white text-[10px] shrink-0">
                                                KUNCI
                                            </Badge>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveOption(idx)}
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Section 5: Explanation & Hints */}
                        <Card className="p-6 border border-border rounded-2xl space-y-4 shadow-2xs">
                            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <h2 className="font-heading font-bold text-base">
                                    5. Pembahasan & Hint Solusi
                                </h2>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Pembahasan Lengkap</label>
                                    <textarea
                                        rows={3}
                                        value={explanation}
                                        onChange={(e) => setExplanation(e.target.value)}
                                        placeholder="Tuliskan pembahasan langkah demi langkah..."
                                        className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Real-Time Student Preview Card */}
                    <div className="space-y-4">
                        <div className="sticky top-6">
                            <Card className="p-5 border border-primary/30 bg-card rounded-2xl space-y-4 shadow-lg">
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-primary" />
                                        <h3 className="font-heading font-bold text-sm">
                                            Live Student Preview
                                        </h3>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">
                                        Tampilan Siswa
                                    </Badge>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-[10px]">
                                            {classification.subject}
                                        </Badge>
                                        <Badge
                                            variant={
                                                metadata.difficulty === "HARD" ? "destructive" : "default"
                                            }
                                            className="text-[10px]"
                                        >
                                            {metadata.difficulty}
                                        </Badge>
                                        {metadata.isHots && (
                                            <Badge variant="destructive" className="text-[9px] gap-0.5">
                                                <Flame className="h-2.5 w-2.5" /> HOTS
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="font-medium text-foreground leading-relaxed">
                                        {content || "Preview narasi soal akan muncul di sini..."}
                                    </p>

                                    {latexFormula && (
                                        <div className="p-2.5 rounded-xl bg-muted/50 font-mono text-emerald-600 dark:text-emerald-400">
                                            {latexFormula}
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-2">
                                        {options.map((opt) => (
                                            <div
                                                key={opt.label}
                                                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${opt.isCorrect
                                                        ? "border-emerald-500/50 bg-emerald-500/5"
                                                        : "border-border"
                                                    }`}
                                            >
                                                <span className="w-5 h-5 rounded-md bg-muted font-bold text-[10px] flex items-center justify-center">
                                                    {opt.label}
                                                </span>
                                                <span className="flex-1">{opt.text || `Opsi ${opt.label}`}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
