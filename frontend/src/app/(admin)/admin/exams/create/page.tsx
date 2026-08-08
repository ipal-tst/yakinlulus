// frontend/src/app/(admin)/admin/exams/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { academicMasterService } from "@/services/academic-master.service";
import { academicService } from "@/services/academic.service";
import { ExamCategory, ScoringSystem, ExamSubtestRule } from "@/types";
import { EXAM_PRESETS, ExamPreset } from "@/components/admin/exams/exam-presets";
import { QuestionPoolPickerModal } from "@/components/admin/exams/QuestionPoolPickerModal";
import { StudentExamPovSimulator } from "@/components/admin/exams/StudentExamPovSimulator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Sparkles,
    Sliders,
    Layers,
    Clock,
    CheckCircle2,
    Save,
    Plus,
    Trash2,
    Shuffle,
    HelpCircle,
    Eye,
    GraduationCap,
    Info,
    Calendar,
    FileCheck,
    BookOpen,
    Zap,
    Database,
    LayoutTemplate,
    Award,
    PlusCircle,
    Check,
    X,
} from "lucide-react";
import Link from "next/link";

export default function CreateExamPage() {
    const router = useRouter();

    // Form Steps: 1: General Info, 2: Subtests & Pool, 3: Scoring Rules, 4: Student Simulator
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isPresetModalOpen, setIsPresetModalOpen] = useState(true);

    // Selected Active Preset Track
    const [selectedPresetId, setSelectedPresetId] = useState<string>("utbk-snbt-akbar");

    // Question Pool Picker Modal State
    const [activePoolSubtestId, setActivePoolSubtestId] = useState<string | null>(null);

    // General Exam Fields
    const [title, setTitle] = useState("UTBK SNBT 2026 Akbar (IRT Standar BP3)");
    const [description, setDescription] = useState(
        "Simulasi Ujian UTBK SNBT lengkap 7 subtes (TPS, Literasi Indonesia & Inggris, Penalaran Matematika) dengan penilaian Item Response Theory (IRT)."
    );
    const [category, setCategory] = useState<ExamCategory>("UTBK_SNBT");
    const [scoringSystem, setScoringSystem] = useState<ScoringSystem>("IRT");
    const [durationMinutes, setDurationMinutes] = useState(195);
    const [passingScore, setPassingScore] = useState(650);
    const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
    const [gradeLevel, setGradeLevel] = useState("12 SMA / UTBK");

    // Practice Configuration Fields
    const [subjectId, setSubjectId] = useState<string>("");
    const [chapterId, setChapterId] = useState<string>("");
    const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "HOTS">("MEDIUM");
    const [defaultMode, setDefaultMode] = useState<"SANTAI" | "SIMULASI">("SIMULASI");

    // Subtests Configuration
    const [subtests, setSubtests] = useState<ExamSubtestRule[]>([
        {
            id: "st-pu",
            subtest_name: "Penalaran Umum (PU)",
            duration_minutes: 30,
            pool_question_ids: [],
            sample_question_count: 30,
            shuffle_questions: true,
            shuffle_options: true,
        },
        {
            id: "st-pbm",
            subtest_name: "Pemahaman Bacaan & Menulis (PBM)",
            duration_minutes: 25,
            pool_question_ids: [],
            sample_question_count: 20,
            shuffle_questions: true,
            shuffle_options: true,
        },
        {
            id: "st-ppu",
            subtest_name: "Pengetahuan & Pemahaman Umum (PPU)",
            duration_minutes: 15,
            pool_question_ids: [],
            sample_question_count: 20,
            shuffle_questions: true,
            shuffle_options: true,
        },
        {
            id: "st-pk",
            subtest_name: "Pengetahuan Kuantitatif (PK)",
            duration_minutes: 20,
            pool_question_ids: [],
            sample_question_count: 15,
            shuffle_questions: true,
            shuffle_options: true,
        },
        {
            id: "st-lbi",
            subtest_name: "Literasi Bahasa Indonesia (LBI)",
            duration_minutes: 45,
            pool_question_ids: [],
            sample_question_count: 30,
            shuffle_questions: true,
            shuffle_options: true,
        },
        {
            id: "st-lbing",
            subtest_name: "Literasi Bahasa Inggris (LBING)",
            duration_minutes: 30,
            pool_question_ids: [],
            sample_question_count: 20,
            shuffle_questions: true,
            shuffle_options: true,
        },
        {
            id: "st-pm",
            subtest_name: "Penalaran Matematika (PM)",
            duration_minutes: 45,
            pool_question_ids: [],
            sample_question_count: 20,
            shuffle_questions: true,
            shuffle_options: true,
        },
    ]);

    // Dynamic Master Subjects
    const { data: dbSubjects = [] } = useQuery({
        queryKey: ["academic-master-subjects-create-exam"],
        queryFn: async () => {
            try {
                const res = await academicMasterService.getSubjects();
                return Array.isArray(res) ? res : [];
            } catch {
                return [];
            }
        },
    });

    // Dynamic Master Chapters (dependent on subjectId)
    const { data: dbChapters = [] } = useQuery({
        queryKey: ["academic-master-chapters", subjectId],
        queryFn: async () => {
            if (!subjectId) return [];
            try {
                const res = await academicMasterService.getChapters(subjectId);
                return Array.isArray(res) ? res : [];
            } catch {
                return [];
            }
        },
        enabled: !!subjectId,
    });

    const totalSampledQuestions = subtests.reduce((sum, st) => sum + Number(st.sample_question_count || 0), 0);
    const totalPoolQuestions = subtests.reduce((sum, st) => sum + (st.pool_question_ids?.length || 0), 0);

    const selectedSubjectObj = dbSubjects.find((s) => s.id === subjectId);

    // Apply Preset Handler
    const handleApplyPreset = (preset: ExamPreset) => {
        setSelectedPresetId(preset.id);
        setTitle(preset.title);
        setDescription(preset.description);
        setCategory(preset.category);
        setScoringSystem(preset.scoring_system);
        setDurationMinutes(preset.duration_minutes);
        setPassingScore(preset.passing_score);
        setGradeLevel(preset.grade_level);
        setDefaultMode(preset.default_mode);
        setSubtests(preset.subtests);
        setIsPresetModalOpen(false);
    };

    const handleAddSubtest = () => {
        const newSubtest: ExamSubtestRule = {
            id: `st-${Date.now()}`,
            subtest_name: "Subtes Baru",
            duration_minutes: 30,
            pool_question_ids: Array.from({ length: 30 }, (_, i) => `q-new-${i + 1}`),
            sample_question_count: 15,
            shuffle_questions: true,
            shuffle_options: true,
        };
        setSubtests([...subtests, newSubtest]);
    };

    const handleRemoveSubtest = (id: string) => {
        if (subtests.length <= 1) return;
        setSubtests(subtests.filter((st) => st.id !== id));
    };

    const handleUpdateSubtest = (id: string, field: keyof ExamSubtestRule, value: any) => {
        setSubtests(
            subtests.map((st) => (st.id === id ? { ...st, [field]: value } : st))
        );
    };

    const handleSavePoolSelectionForSubtest = (selectedQuestionIds: string[]) => {
        if (!activePoolSubtestId) return;

        setSubtests((prev) =>
            prev.map((st) => {
                if (st.id === activePoolSubtestId) {
                    const newCount = Math.min(st.sample_question_count, selectedQuestionIds.length || 1);
                    return {
                        ...st,
                        pool_question_ids: selectedQuestionIds,
                        sample_question_count: newCount > 0 ? newCount : (selectedQuestionIds.length > 0 ? 1 : 0),
                    };
                }
                return st;
            })
        );
    };

    const handleSaveExam = async () => {
        if (!title.trim()) return;

        setIsSaving(true);
        try {
            await academicService.createExam({
                title: title.trim(),
                description: description.trim(),
                category,
                scoring_system: scoringSystem,
                subject_id: subjectId || undefined,
                subject_name: selectedSubjectObj?.name || undefined,
                chapter_id: chapterId || undefined,
                difficulty,
                default_mode: defaultMode,
                duration_minutes: Number(durationMinutes) || 120,
                total_questions: totalSampledQuestions,
                passing_score: Number(passingScore) || 500,
                status,
                grade_level: gradeLevel,
                subtests,
            });
            router.push("/admin/exams");
        } catch (err) {
            console.error("Failed to create exam", err);
        } finally {
            setIsSaving(false);
        }
    };

    const activeSubtestForModal = subtests.find((st) => st.id === activePoolSubtestId);

    return (
        <AppShell>
            <div className="flex flex-col font-sans min-h-screen">
                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/exams">
                            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" /> Kembali
                            </Button>
                        </Link>

                        <div className="h-4 w-px bg-border hidden sm:block" />

                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="font-heading font-bold text-base sm:text-lg text-foreground leading-tight">
                                    Studio Ujian & Tryout Master
                                </h1>
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                    Konfigurasi Ujian, Latihan Mapel, IRT, dan Dynamic Question Pool Sampling.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPresetModalOpen(true)}
                            className="rounded-xl gap-1.5 font-semibold text-xs h-9"
                        >
                            <LayoutTemplate className="h-4 w-4 text-primary" /> Preset Template
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleSaveExam}
                            disabled={isSaving || !title.trim()}
                            className="rounded-xl gap-1.5 font-semibold text-xs h-9 shadow-xs"
                        >
                            <Save className="h-4 w-4" /> {isSaving ? "Menyimpan..." : "Publikasikan Ujian"}
                        </Button>
                    </div>
                </header>

                {/* Wizard Step Nav Bar */}
                <div className="border-b border-border bg-card/50 px-4 sm:px-6 py-2.5 overflow-x-auto">
                    <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 text-xs font-medium min-w-[650px]">
                        <button
                            onClick={() => setCurrentStep(1)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${currentStep === 1 ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-muted"}`}
                        >
                            <span className="h-5 w-5 rounded-full bg-background/20 flex items-center justify-center text-[10px]">1</span>
                            1. Identitas & Mapel Ujian
                        </button>
                        <div className="h-4 w-px bg-border" />
                        <button
                            onClick={() => setCurrentStep(2)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${currentStep === 2 ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-muted"}`}
                        >
                            <span className="h-5 w-5 rounded-full bg-background/20 flex items-center justify-center text-[10px]">2</span>
                            2. Subtes & Question Pool ({subtests.length} Subtes)
                        </button>
                        <div className="h-4 w-px bg-border" />
                        <button
                            onClick={() => setCurrentStep(3)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${currentStep === 3 ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-muted"}`}
                        >
                            <span className="h-5 w-5 rounded-full bg-background/20 flex items-center justify-center text-[10px]">3</span>
                            3. Skema Penilaian ({scoringSystem})
                        </button>
                        <div className="h-4 w-px bg-border" />
                        <button
                            onClick={() => setCurrentStep(4)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${currentStep === 4 ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-muted"}`}
                        >
                            <span className="h-5 w-5 rounded-full bg-background/20 flex items-center justify-center text-[10px]">4</span>
                            4. Simulator Siswa
                        </button>
                    </div>
                </div>

                {/* Studio Workspace Content */}
                <div className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto space-y-6">
                    {/* STEP 1: General Info & Practice Attributes */}
                    {currentStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-8 space-y-5">
                                <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                            <FileCheck className="h-4 w-4 text-primary" /> Identitas Paket Ujian / Latihan
                                        </h2>
                                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                            Preset: {selectedPresetId}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="font-bold text-xs text-foreground">Judul Paket Ujian / Latihan *</label>
                                            <Input
                                                placeholder="Contoh: UTBK SNBT 2026 Akbar (IRT Standar BP3)"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="h-11 rounded-xl text-sm font-semibold bg-background"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-semibold text-xs text-foreground">Deskripsi / Petunjuk Pengerjaan</label>
                                            <textarea
                                                rows={3}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Petunjuk khusus bagi siswa sebelum memulai latihan/ujian..."
                                                className="w-full rounded-xl border border-input bg-background p-3 text-xs focus:outline-hidden leading-relaxed"
                                            />
                                        </div>

                                        {/* Practice Mapel & Bab Configuration */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1">
                                                <label className="font-semibold text-xs text-foreground flex items-center gap-1">
                                                    <BookOpen className="h-3.5 w-3.5 text-primary" /> Mata Pelajaran Utama (Mapel)
                                                </label>
                                                <select
                                                    value={subjectId}
                                                    onChange={(e) => {
                                                        setSubjectId(e.target.value);
                                                        setChapterId("");
                                                    }}
                                                    className="w-full h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                                                >
                                                    <option value="">-- Multi-Mapel / Ujian Paket --</option>
                                                    {dbSubjects.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="font-semibold text-xs text-foreground flex items-center gap-1">
                                                    <Zap className="h-3.5 w-3.5 text-amber-500" /> Bab / Topik Spesifik (Opsional)
                                                </label>
                                                <select
                                                    value={chapterId}
                                                    onChange={(e) => setChapterId(e.target.value)}
                                                    disabled={!subjectId}
                                                    className="w-full h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden disabled:opacity-50"
                                                >
                                                    <option value="">-- Semua Bab / Topik --</option>
                                                    {dbChapters.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name || (c as any).title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-4 space-y-5">
                                <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-2xs">
                                    <h2 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Sliders className="h-4 w-4 text-primary" /> Klasifikasi & Parameter Latihan
                                    </h2>

                                    <div className="space-y-3 text-xs">
                                        <div className="space-y-1">
                                            <label className="font-semibold text-foreground">Kategori Ujian / Latihan</label>
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value as any)}
                                                className="w-full h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                                            >
                                                <option value="UTBK_SNBT">UTBK SNBT (Nasional)</option>
                                                <option value="UM_PTN">Ujian Mandiri PTN (SIMAK UI, UM UGM)</option>
                                                <option value="TRYOUT_NASIONAL">Tryout Akbar Nasional</option>
                                                <option value="PTS_UAS">PTS / UAS Sekolah</option>
                                                <option value="UJIAN_HARIAN">Ujian Harian (UH)</option>
                                                <option value="UJIAN_BAB">Ujian Per-Bab Materi</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-semibold text-foreground">Tingkat Kesulitan (Difficulty)</label>
                                            <select
                                                value={difficulty}
                                                onChange={(e) => setDifficulty(e.target.value as any)}
                                                className="w-full h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                                            >
                                                <option value="EASY">EASY (Mudah)</option>
                                                <option value="MEDIUM">MEDIUM (Sedang)</option>
                                                <option value="HARD">HARD (Sulit)</option>
                                                <option value="HOTS">HOTS (High Order Thinking)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-semibold text-foreground">Default Mode Pengerjaan Siswa</label>
                                            <select
                                                value={defaultMode}
                                                onChange={(e) => setDefaultMode(e.target.value as any)}
                                                className="w-full h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                                            >
                                                <option value="SANTAI">Mode Santai (Pembahasan Langsung)</option>
                                                <option value="SIMULASI">Mode Simulasi Ujian (Timer Active)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-semibold text-foreground">Total Durasi Ujian (Menit)</label>
                                            <Input
                                                type="number"
                                                value={durationMinutes}
                                                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                                                className="h-9 text-xs rounded-xl bg-background"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-semibold text-foreground">Target Passing Score / Kelulusan</label>
                                            <Input
                                                type="number"
                                                value={passingScore}
                                                onChange={(e) => setPassingScore(parseInt(e.target.value) || 500)}
                                                className="h-9 text-xs rounded-xl bg-background"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="font-semibold text-foreground">Target Tingkat Kelas / Jenjang</label>
                                            <Input
                                                value={gradeLevel}
                                                onChange={(e) => setGradeLevel(e.target.value)}
                                                placeholder="Misal: 12 SMA / UTBK"
                                                className="h-9 text-xs rounded-xl bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Subtests & Question Pool Manager */}
                    {currentStep === 2 && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <h2 className="font-bold text-base text-foreground flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-primary" /> Dynamic Question Pool Sampling & Subtes Engine
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Kelola naskah soal per subtes. Anda bisa menambahkan pool butir soal secara visual dari Bank Soal dan menentukan berapa soal acak yang dikerjakan siswa.
                                    </p>
                                </div>

                                <Button onClick={handleAddSubtest} size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
                                    <Plus className="h-4 w-4" /> Tambah Subtes Baru
                                </Button>
                            </div>

                            {/* Summary Badges */}
                            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 p-4 rounded-2xl text-xs flex-wrap">
                                <Info className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <span className="font-bold text-foreground">Total Pool Bank Soal:</span>{" "}
                                    <Badge variant="secondary" className="font-mono text-xs">{totalPoolQuestions} Soal Terdaftar</Badge>
                                    <span className="mx-2 text-muted-foreground">•</span>
                                    <span className="font-bold text-foreground">Total Soal Dikerjakan Siswa:</span>{" "}
                                    <Badge variant="default" className="font-mono text-xs">{totalSampledQuestions} Soal Acak / Siswa</Badge>
                                </div>
                            </div>

                            {/* Subtests List */}
                            <div className="space-y-4">
                                {subtests.map((st, idx) => (
                                    <div key={st.id} className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-2xs">
                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs font-bold">
                                                    Subtes #{idx + 1}
                                                </Badge>
                                                <Input
                                                    value={st.subtest_name}
                                                    onChange={(e) => handleUpdateSubtest(st.id, "subtest_name", e.target.value)}
                                                    className="h-8 font-bold text-sm max-w-xs rounded-xl bg-background"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setActivePoolSubtestId(st.id)}
                                                    className="h-8 text-xs font-semibold rounded-xl gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                                                >
                                                    <Database className="h-3.5 w-3.5" /> Visual Question Pool Picker ({st.pool_question_ids.length} Soal)
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveSubtest(st.id)}
                                                    disabled={subtests.length <= 1}
                                                    className="h-8 text-xs text-destructive hover:bg-destructive/10 rounded-xl"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" /> Hapus
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                            <div className="space-y-1">
                                                <label className="font-semibold text-foreground">Durasi Subtes (Menit)</label>
                                                <Input
                                                    type="number"
                                                    value={st.duration_minutes}
                                                    onChange={(e) => handleUpdateSubtest(st.id, "duration_minutes", parseInt(e.target.value) || 10)}
                                                    className="h-9 rounded-xl bg-background"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="font-semibold text-foreground">Jumlah Pool Bank Soal</label>
                                                <Input
                                                    type="number"
                                                    value={st.pool_question_ids.length}
                                                    onChange={(e) => {
                                                        const count = parseInt(e.target.value) || 10;
                                                        const newPool = Array.from({ length: count }, (_, i) => `q-${st.id}-${i + 1}`);
                                                        handleUpdateSubtest(st.id, "pool_question_ids", newPool);
                                                    }}
                                                    className="h-9 rounded-xl bg-background font-mono"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="font-semibold text-foreground flex items-center gap-1">
                                                    <Shuffle className="h-3.5 w-3.5 text-primary" /> Sampling Soal Per Siswa
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={st.sample_question_count}
                                                    onChange={(e) => handleUpdateSubtest(st.id, "sample_question_count", parseInt(e.target.value) || 5)}
                                                    className="h-9 rounded-xl bg-background font-bold text-primary"
                                                />
                                            </div>

                                            <div className="space-y-2 flex flex-col justify-end">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={st.shuffle_questions !== false}
                                                        onChange={(e) => handleUpdateSubtest(st.id, "shuffle_questions", e.target.checked)}
                                                        className="rounded border-input text-primary"
                                                    />
                                                    <span className="font-medium text-foreground">Acak Nomor Soal</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={st.shuffle_options !== false}
                                                        onChange={(e) => handleUpdateSubtest(st.id, "shuffle_options", e.target.checked)}
                                                        className="rounded border-input text-primary"
                                                    />
                                                    <span className="font-medium text-foreground">Acak Opsi A/B/C/D/E</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Scoring Rules */}
                    {currentStep === 3 && (
                        <div className="p-5 rounded-2xl border border-border bg-card space-y-5 shadow-2xs">
                            <div>
                                <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                    <Sparkles className="h-4 w-4 text-primary" /> Pengaturan Sistem Penilaian Ujian
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Pilih skema kalkulasi nilai akhir siswa sesuai standar ujian nasional, sekolah, atau sistem minus.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div
                                    onClick={() => setScoringSystem("IRT")}
                                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${scoringSystem === "IRT" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 bg-background"}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 font-bold">
                                            Rekomendasi UTBK SNBT
                                        </Badge>
                                        {scoringSystem === "IRT" && <Check className="h-4 w-4 text-primary" />}
                                    </div>
                                    <h3 className="font-bold text-sm text-foreground">Item Response Theory (IRT)</h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Skor dihitung dinamis berdasarkan bobot tingkat kesulitan butir soal yang dijawab benar oleh seluruh peserta ujian.
                                    </p>
                                </div>

                                <div
                                    onClick={() => setScoringSystem("STANDARD_POINTS")}
                                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${scoringSystem === "STANDARD_POINTS" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 bg-background"}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="text-[10px]">
                                            Sekolah / PTS / UAS
                                        </Badge>
                                        {scoringSystem === "STANDARD_POINTS" && <Check className="h-4 w-4 text-primary" />}
                                    </div>
                                    <h3 className="font-bold text-sm text-foreground">Poin Standar (0 - 100)</h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Setiap soal memiliki bobot poin seragam. Skor total dihitung proporsional dari jumlah soal yang dijawab benar.
                                    </p>
                                </div>

                                <div
                                    onClick={() => setScoringSystem("NEGATIVE_MARKING")}
                                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${scoringSystem === "NEGATIVE_MARKING" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 bg-background"}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="text-[10px]">
                                            Minus System
                                        </Badge>
                                        {scoringSystem === "NEGATIVE_MARKING" && <Check className="h-4 w-4 text-primary" />}
                                    </div>
                                    <h3 className="font-bold text-sm text-foreground">Sistem Minus (+4 / -1 / 0)</h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Jawaban benar bernilai +4 poin, salah bernilai -1 poin, dan tidak dijawab 0 poin (cocok untuk SIMAK UI / UM UGM).
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Student Attempt Simulator & Interactive POV */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <StudentExamPovSimulator
                                examTitle={title}
                                subtests={subtests}
                                scoringSystem={scoringSystem}
                                gradeLevel={gradeLevel}
                            />
                        </div>
                    )}
                </div>

                {/* BOTTOM WIZARD NAVIGATION BAR */}
                <footer className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-lg mt-auto">
                    <div className="flex items-center gap-2">
                        <Link href="/admin/exams">
                            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 font-semibold text-xs text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" /> Batal &amp; Kembali ke Katalog Ujian
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        {currentStep > 1 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentStep((prev) => prev - 1)}
                                className="rounded-xl gap-1.5 font-semibold text-xs h-9"
                            >
                                ← Langkah Sebelumnya
                            </Button>
                        )}

                        {currentStep < 4 ? (
                            <Button
                                size="sm"
                                onClick={() => setCurrentStep((prev) => prev + 1)}
                                className="rounded-xl gap-1.5 font-bold text-xs h-9 bg-primary text-primary-foreground shadow-xs"
                            >
                                Lanjut ke Langkah {currentStep + 1} →
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={handleSaveExam}
                                disabled={isSaving || !title.trim()}
                                className="rounded-xl gap-1.5 font-bold text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            >
                                <Save className="h-4 w-4" /> {isSaving ? "Menyimpan..." : "Publikasikan Ujian"}
                            </Button>
                        )}
                    </div>
                </footer>
            </div>

            {/* PRESET SELECTION MODAL */}
            {isPresetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="bg-card border border-border rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans animate-in fade-in duration-200">
                        <div className="p-5 border-b border-border bg-card flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                    <LayoutTemplate className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-heading font-bold text-base sm:text-lg text-foreground">
                                        Pilih Preset Template Ujian
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Pilih jenis paket ujian untuk mengisi struktur subtes, durasi, dan penilaian secara otomatis.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link href="/admin/exams">
                                    <Button variant="ghost" size="sm" className="rounded-xl text-xs text-muted-foreground hover:text-foreground">
                                        Batal ke Katalog
                                    </Button>
                                </Link>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsPresetModalOpen(false)}
                                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                                    title="Tutup Preset Modal"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            {EXAM_PRESETS.map((preset) => (
                                <div
                                    key={preset.id}
                                    onClick={() => handleApplyPreset(preset)}
                                    className="group p-5 rounded-2xl border border-border bg-card hover:border-primary/60 transition-all cursor-pointer shadow-2xs flex flex-col justify-between space-y-3"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary font-bold">
                                                {preset.badgeText}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px]">
                                                {preset.subtests.length} Subtes
                                            </Badge>
                                        </div>

                                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                            {preset.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                            {preset.description}
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-primary" /> {preset.duration_minutes}m
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> {preset.scoring_system}
                                        </span>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold text-primary group-hover:bg-primary/10 rounded-lg">
                                            Gunakan Preset →
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsPresetModalOpen(false)}
                                className="rounded-xl text-xs font-semibold"
                            >
                                Buat Manual / Tanpa Preset
                            </Button>

                            <Link href="/admin/exams">
                                <Button variant="destructive" size="sm" className="rounded-xl text-xs font-semibold">
                                    Batal &amp; Kembali ke Halaman Ujian
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* VISUAL QUESTION POOL PICKER MODAL */}
            {activePoolSubtestId && (
                <QuestionPoolPickerModal
                    isOpen={!!activePoolSubtestId}
                    onClose={() => setActivePoolSubtestId(null)}
                    onSelectQuestions={handleSavePoolSelectionForSubtest}
                    initialSelectedIds={activeSubtestForModal?.pool_question_ids || []}
                    subtestName={activeSubtestForModal?.subtest_name || "Subtes"}
                    defaultSubjectId={subjectId}
                />
            )}
        </AppShell>
    );
}
