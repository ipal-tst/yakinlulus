"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateExam, useSubjects } from "@/lib/api";
import {
    Plus,
    Minus,
    Trash2,
    Save,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
    GripVertical,
    LayoutDashboard,
    BookOpen,
    Target,
    Zap,
    HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface SubjectBlueprint {
    id: string;
    subjectId: string;
    subjectName: string;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
}

const DIFFICULTY_OPTIONS = [
    { value: "EASY", label: "Mudah", color: "success" },
    { value: "MEDIUM", label: "Sedang", color: "warning" },
    { value: "HARD", label: "Sulit", color: "destructive" },
] as const;

export default function CustomExamBuilder() {
    const router = useRouter();
    const { data: subjectsData } = useSubjects();
    const createExam = useCreateExam();
    const [step, setStep] = React.useState(1);
    const [error, setError] = React.useState<string | null>(null);

    const subjectOptions = React.useMemo(() => {
        if (!subjectsData) return [];
        const arr = Array.isArray(subjectsData) ? subjectsData : [];
        return arr.map((s: any) => ({ value: s.id, label: s.name }));
    }, [subjectsData]);

    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [durationMinutes, setDurationMinutes] = React.useState(120);
    const [examType, setExamType] = React.useState<"CUSTOM" | "TAG_BASED">("CUSTOM");

    const [blueprints, setBlueprints] = React.useState<SubjectBlueprint[]>([
        { id: "1", subjectId: "", subjectName: "", easyCount: 0, mediumCount: 0, hardCount: 0 },
    ]);

    const totalQuestions = React.useMemo(() =>
        blueprints.reduce((sum, bp) => sum + bp.easyCount + bp.mediumCount + bp.hardCount, 0), [blueprints]);

    const subjectTotals = React.useMemo(() =>
        blueprints.map(bp => ({
            ...bp,
            total: bp.easyCount + bp.mediumCount + bp.hardCount,
        })), [blueprints]);

    const canProceedStep1 = title.trim().length > 0 && durationMinutes > 0;
    const canSubmit = blueprints.some(bp => bp.subjectId && bp.easyCount + bp.mediumCount + bp.hardCount > 0);

    const updateBlueprint = (id: string, field: keyof SubjectBlueprint, value: string | number) => {
        setBlueprints(prev => prev.map(bp => bp.id === id ? { ...bp, [field]: value } : bp));
    };

    const addBlueprint = () => {
        const newId = String(Date.now());
        setBlueprints(prev => [...prev, { id: newId, subjectId: "", subjectName: "", easyCount: 0, mediumCount: 0, hardCount: 0 }]);
    };

    const removeBlueprint = (id: string) => {
        if (blueprints.length <= 1) return;
        setBlueprints(prev => prev.filter(bp => bp.id !== id));
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setError(null);

        const payload = {
            title,
            description,
            duration_minutes: durationMinutes,
            exam_type: examType,
            subject_blueprints: blueprints
                .filter(bp => bp.subjectId && bp.easyCount + bp.mediumCount + bp.hardCount > 0)
                .map(bp => ({
                    subject_id: bp.subjectId,
                    easy_count: bp.easyCount,
                    medium_count: bp.mediumCount,
                    hard_count: bp.hardCount,
                })),
        };

        createExam.mutate(payload, {
            onSuccess: (data: any) => {
                router.push(`/teacher/exam/${data.id}`);
            },
            onError: (err: Error) => {
                setError(err.message);
            },
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6 pb-16">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/teacher/exam">
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Custom Exam Builder</h1>
                    <p className="text-sm text-muted-foreground">
                        Buat ujian campuran multi-mapel dengan blueprint per mata pelajaran
                    </p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                    <div className="flex items-center justify-center h-8 w-8 rounded-full border font-bold text-sm">
                        1
                    </div>
                    <span className="font-medium text-sm">Info Dasar</span>
                </div>
                <div className="flex-1 h-1 bg-muted mx-4 relative">
                    <div
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
                        style={{ width: step >= 2 ? "100%" : "0%" }}
                    />
                </div>
                <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                    <span className="font-medium text-sm">Blueprint Mapel</span>
                    <div className="flex items-center justify-center h-8 w-8 rounded-full border font-bold text-sm">
                        2
                    </div>
                </div>
            </div>

            {error && (
                <Card className="border-destructive bg-destructive/5">
                    <CardContent className="p-4 flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                    </CardContent>
                </Card>
            )}

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LayoutDashboard className="h-5 w-5" />
                            Informasi Dasar Ujian
                        </CardTitle>
                        <CardDescription>
                            Isi detail utama ujian sebelum menentukan blueprint per mata pelajaran
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Judul Ujian *</label>
                            <Input
                                placeholder="Contoh: Tryout Gabungan MIPA Kelas 12"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Deskripsi</label>
                            <textarea
                                className="w-full p-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary min-h-[80px] resize-none text-sm"
                                placeholder="Deskripsi singkat ujian ini..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Durasi (Menit) *</label>
                                <Input
                                    type="number"
                                    min="30"
                                    max="300"
                                    value={durationMinutes}
                                    onChange={e => setDurationMinutes(Math.max(30, Math.min(300, parseInt(e.target.value) || 120)))}
                                    className="text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tipe Ujian</label>
                                <Select value={examType} onValueChange={v => setExamType(v as "CUSTOM" | "TAG_BASED")}>
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Pilih tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CUSTOM">Custom Mixed-Subject (Manual Blueprint)</SelectItem>
                                        <SelectItem value="TAG_BASED">Tag-Based (UTBK/SMPTN/UM)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button
                            disabled={!canProceedStep1}
                            onClick={() => setStep(2)}
                            className="text-sm font-semibold"
                        >
                            Lanjut ke Blueprint <ChevronRight className="ml-1.5 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {step === 2 && (
                <>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        Blueprint Per Mata Pelajaran
                                    </CardTitle>
                                    <CardDescription>
                                        Tentukan jumlah soal per tingkat kesulitan untuk setiap mapel
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={addBlueprint} className="gap-1.5">
                                    <Plus className="h-3.5 w-3.5" />
                                    Tambah Mapel
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {blueprints.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Belum ada mapel ditambahkan. Klik "Tambah Mapel" untuk memulai.</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {blueprints.map((bp, idx) => (
                                    <Card key={bp.id} className="p-4 space-y-4 border-primary/20">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                <Select
                                                    value={bp.subjectId}
                                                    onValueChange={v => updateBlueprint(bp.id, "subjectId", v)}
                                                >
                                                    <SelectTrigger className="text-sm">
                                                        <SelectValue placeholder="Pilih Mata Pelajaran" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {subjectOptions.map(opt => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {DIFFICULTY_OPTIONS.map(diff => (
                                                        <div key={diff.value} className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                                {diff.label}
                                                                <Badge variant={diff.color as any} className="text-[9px] h-4 px-1.5">
                                                                    {bp[`${diff.value.toLowerCase()}Count` as keyof SubjectBlueprint]}
                                                                </Badge>
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="50"
                                                                value={bp[`${diff.value.toLowerCase()}Count` as keyof SubjectBlueprint]}
                                                                onChange={e => updateBlueprint(bp.id, `${diff.value.toLowerCase()}Count` as keyof SubjectBlueprint, parseInt(e.target.value) || 0)}
                                                                className="text-center text-base font-mono h-9"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <div className="text-right">
                                                    <div className="text-[10px] text-muted-foreground">Total Soal Mapel</div>
                                                    <div className="text-2xl font-bold text-primary">
                                                        {bp.easyCount + bp.mediumCount + bp.hardCount}
                                                    </div>
                                                </div>
                                                {blueprints.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10 h-8 w-8"
                                                        onClick={() => removeBlueprint(bp.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t flex justify-between items-center">
                            <Button variant="outline" onClick={() => setStep(1)} className="text-sm font-semibold">
                                <ChevronLeft className="mr-1.5 h-4 w-4" /> Kembali
                            </Button>
                            <div className="text-sm text-muted-foreground">
                                Total Keseluruhan: <span className="font-bold text-primary ml-1">{totalQuestions} Soal</span>
                            </div>
                            <Button
                                disabled={!canSubmit || createExam.isPending}
                                onClick={handleSubmit}
                                className="text-sm font-semibold gap-1.5"
                            >
                                {createExam.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Membuat Ujian...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Buat Ujian Custom
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    {totalQuestions > 0 && (
                        <Card className="border-primary/30 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Ringkasan Blueprint
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 font-medium">Mata Pelajaran</th>
                                                <th className="pb-2 font-medium text-center">Mudah</th>
                                                <th className="pb-2 font-medium text-center">Sedang</th>
                                                <th className="pb-2 font-medium text-center">Sulit</th>
                                                <th className="pb-2 font-medium text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subjectTotals
                                                .filter(bp => bp.subjectId)
                                                .map(bp => (
                                                    <tr key={bp.id} className="border-b border-muted/50">
                                                        <td className="py-2 font-medium">
                                                            {subjectOptions.find(o => o.value === bp.subjectId)?.label || bp.subjectId}
                                                        </td>
                                                        <td className="py-2 text-center text-success font-bold">{bp.easyCount}</td>
                                                        <td className="py-2 text-center text-warning font-bold">{bp.mediumCount}</td>
                                                        <td className="py-2 text-center text-destructive font-bold">{bp.hardCount}</td>
                                                        <td className="py-2 text-right font-bold text-primary">{bp.total}</td>
                                                    </tr>
                                                ))}
                                            <tr className="bg-muted/50 font-bold">
                                                <td className="py-2">TOTAL</td>
                                                <td className="py-2 text-center text-success">
                                                    {subjectTotals.reduce((s, bp) => s + bp.easyCount, 0)}
                                                </td>
                                                <td className="py-2 text-center text-warning">
                                                    {subjectTotals.reduce((s, bp) => s + bp.mediumCount, 0)}
                                                </td>
                                                <td className="py-2 text-center text-destructive">
                                                    {subjectTotals.reduce((s, bp) => s + bp.hardCount, 0)}
                                                </td>
                                                <td className="py-2 text-right text-primary">{totalQuestions}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 p-3 rounded-lg border bg-card space-y-1 text-xs">
                                    <p className="text-muted-foreground">
                                        <Zap className="inline h-3 w-3 mr-1" /> Estimasi durasi: {Math.ceil(totalQuestions * 1.5)} menit
                                    </p>
                                    <p className="text-muted-foreground">
                                        <Target className="inline h-3 w-3 mr-1" /> Durasi ujian yang disetel: {durationMinutes} menit
                                    </p>
                                    {Math.ceil(totalQuestions * 1.5) > durationMinutes && (
                                        <p className="text-warning">
                                            <AlertCircle className="inline h-3 w-3 mr-1" /> Peringatan: Estimasi durasi melebihi batas waktu ujian!
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
