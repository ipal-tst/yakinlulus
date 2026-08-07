// frontend/src/app/(admin)/admin/exams/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { academicMasterService } from "@/services/academic-master.service";
import { academicService } from "@/services/academic.service";
import { ExamCategory, ScoringSystem, ExamSubtestRule } from "@/types";
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
} from "lucide-react";
import Link from "next/link";

export default function CreateExamPage() {
    const router = useRouter();

    // Form Steps: 1: General Info, 2: Subtests & Pool, 3: Scoring Rules, 4: Student Simulator
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [isSaving, setIsSaving] = useState(false);

    // General Exam Fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
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
    const [defaultMode, setDefaultMode] = useState<"SANTAI" | "SIMULASI">("SANTAI");

    // Subtests Configuration
    const [subtests, setSubtests] = useState<ExamSubtestRule[]>([
        {
            id: "st-1",
            subtest_name: "Penalaran Matematika",
            duration_minutes: 45,
            pool_question_ids: Array.from({ length: 100 }, (_, i) => `q-pm-${i + 1}`),
            sample_question_count: 30,
            shuffle_questions: true,
            shuffle_options: true,
        },
        {
            id: "st-2",
            subtest_name: "Literasi Bahasa Indonesia",
            duration_minutes: 45,
            pool_question_ids: Array.from({ length: 80 }, (_, i) => `q-lbi-${i + 1}`),
            sample_question_count: 30,
            shuffle_questions: true,
            shuffle_options: true,
        },
        {
            id: "st-3",
            subtest_name: "Penalaran Umum",
            duration_minutes: 30,
            pool_question_ids: Array.from({ length: 60 }, (_, i) => `q-pu-${i + 1}`),
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

    const handleAddSubtest = () => {
        const newSubtest: ExamSubtestRule = {
            id: `st-${Date.now()}`,
            subtest_name: "Subtes Baru",
            duration_minutes: 30,
            pool_question_ids: Array.from({ length: 50 }, (_, i) => `q-new-${i + 1}`),
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

    return (
        <AppShell>
            <div className="flex flex-col font-sans">
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
                                    Studio Buat Ujian & Tryout Baru
                                </h1>
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                    Konfigurasi Ujian, Latihan Mapel, Bab Materi, IRT, dan Aturan Sampling Question Pool.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
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
                            1. Informasi General & Latihan
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
                            4. Simulator Pengerjaan Siswa
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
                                    <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                        <FileCheck className="h-4 w-4 text-primary" /> Identitas Paket Ujian / Latihan
                                    </h2>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="font-bold text-xs text-foreground">Judul Paket Ujian / Latihan *</label>
                                            <Input
                                                placeholder="Contoh: Super Drill HOTS Penalaran Matematika Bab 1"
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
                                                    <BookOpen className="h-3.5 w-3.5 text-primary" /> Mata Pelajaran (Mapel)
                                                </label>
                                                <select
                                                    value={subjectId}
                                                    onChange={(e) => {
                                                        setSubjectId(e.target.value);
                                                        setChapterId("");
                                                    }}
                                                    className="w-full h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                                                >
                                                    <option value="">-- Tanpa Mapel Spesifik --</option>
                                                    {dbSubjects.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="font-semibold text-xs text-foreground flex items-center gap-1">
                                                    <Zap className="h-3.5 w-3.5 text-amber-500" /> Bab / Topik Spesifik
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
                                                placeholder="Misal: 12 SMA / Alumni"
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
                                        <Layers className="h-5 w-5 text-primary" /> Pengaturan Subtes & Dynamic Question Pool Sampling
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Admin mengumpulkan banyak soal ke Pool (contoh: 100 soal), lalu menentukan berapa soal yang akan dikerjakan siswa (contoh: 30 soal acak).
                                    </p>
                                </div>

                                <Button onClick={handleAddSubtest} size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
                                    <Plus className="h-4 w-4" /> Tambah Subtes Baru
                                </Button>
                            </div>

                            {/* Summary Badges */}
                            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 p-3.5 rounded-2xl text-xs">
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
                                        <div className="flex items-center justify-between gap-3">
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

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveSubtest(st.id)}
                                                disabled={subtests.length <= 1}
                                                className="h-8 text-xs text-destructive hover:bg-destructive/10 rounded-xl"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" /> Hapus Subtes
                                            </Button>
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
                            <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-primary" /> Pengaturan Sistem Penilaian Ujian
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div
                                    onClick={() => setScoringSystem("IRT")}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${scoringSystem === "IRT" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 bg-background"}`}
                                >
                                    <Badge variant="secondary" className="text-[10px] mb-2">
                                        Rekomendasi UTBK
                                    </Badge>
                                    <h3 className="font-bold text-sm text-foreground">Item Response Theory (IRT)</h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Skor dihitung dinamis berdasarkan tingkat kesulitan soal yang dijawab benar oleh seluruh peserta ujian.
                                    </p>
                                </div>

                                <div
                                    onClick={() => setScoringSystem("STANDARD_POINTS")}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${scoringSystem === "STANDARD_POINTS" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 bg-background"}`}
                                >
                                    <Badge variant="outline" className="text-[10px] mb-2">
                                        Sekolah / PTS / UAS
                                    </Badge>
                                    <h3 className="font-bold text-sm text-foreground">Poin Standar (0 - 100)</h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Setiap soal memiliki bobot poin sama. Skor total dihitung proporsional dari jumlah soal benar.
                                    </p>
                                </div>

                                <div
                                    onClick={() => setScoringSystem("NEGATIVE_MARKING")}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${scoringSystem === "NEGATIVE_MARKING" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 bg-background"}`}
                                >
                                    <Badge variant="outline" className="text-[10px] mb-2">
                                        Minus System
                                    </Badge>
                                    <h3 className="font-bold text-sm text-foreground">Sistem Minus (+4 / -1 / 0)</h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Jawaban benar +4 poin, salah -1 poin, dan tidak dijawab 0 poin (cocok untuk UMPTN klasik).
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Student Attempt Simulator */}
                    {currentStep === 4 && (
                        <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                    <Eye className="h-4 w-4 text-emerald-500" /> Pratinjau Simulator Varian Soal Siswa
                                </h2>
                                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs">
                                    Dynamic Randomization Active
                                </Badge>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Berikut adalah contoh variasi {totalSampledQuestions} soal yang akan diterima oleh seorang siswa secara acak dari total pool {totalPoolQuestions} soal:
                            </p>

                            <div className="space-y-3 pt-2">
                                {subtests.map((st, sIdx) => (
                                    <div key={st.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-foreground">
                                                Subtes {sIdx + 1}: {st.subtest_name}
                                            </span>
                                            <Badge variant="secondary" className="text-[10px]">
                                                Dikerjakan {st.sample_question_count} dari {st.pool_question_ids.length} Pool
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                            {Array.from({ length: st.sample_question_count }).map((_, qIdx) => (
                                                <span
                                                    key={qIdx}
                                                    className="h-7 w-7 rounded-lg bg-background border border-border flex items-center justify-center font-mono text-[11px] font-bold text-primary shadow-2xs"
                                                    title={`Soal #${qIdx + 1} (Diambil acak dari Pool ID: ${st.pool_question_ids[qIdx % st.pool_question_ids.length]})`}
                                                >
                                                    {qIdx + 1}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
