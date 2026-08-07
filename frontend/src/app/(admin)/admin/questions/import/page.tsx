"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { questionImportService } from "@/services/question-import.service";
import { ImportFileFormat, ImportJob, ParsedQuestionItem } from "@/types/question-bank";
import {
    ArrowLeft,
    UploadCloud,
    FileSpreadsheet,
    FileText,
    FileCode,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Download,
    Eye,
    RefreshCw,
    Sparkles,
    Check,
    Layers,
} from "lucide-react";

type Stage = 1 | 2 | 3 | 4;

export default function QuestionImportPage() {
    const router = useRouter();

    // Stage State
    const [currentStage, setCurrentStage] = useState<Stage>(1);
    const [selectedFormat, setSelectedFormat] = useState<ImportFileFormat>("PDF");
    const [selectedSubject, setSelectedSubject] = useState("Penalaran Matematika");
    const [file, setFile] = useState<File | null>(null);

    // Parsing & Job State
    const [isParsing, setIsParsing] = useState(false);
    const [parseProgress, setParseProgress] = useState(0);
    const [importJob, setImportJob] = useState<ImportJob | null>(null);
    const [parsedItems, setParsedItems] = useState<ParsedQuestionItem[]>([]);
    const [editingItem, setEditingItem] = useState<ParsedQuestionItem | null>(null);

    // Commit State
    const [isCommitting, setIsCommitting] = useState(false);
    const [commitResult, setCommitResult] = useState<{ count: number; job_id: string } | null>(
        null
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleStartParsing = async () => {
        if (!file) return;

        setCurrentStage(2);
        setIsParsing(true);
        setParseProgress(20);

        // Progress simulation ticks
        const interval = setInterval(() => {
            setParseProgress((prev) => (prev >= 90 ? 90 : prev + 25));
        }, 300);

        try {
            const { job, items } = await questionImportService.parseFile(
                file,
                selectedFormat,
                selectedSubject
            );
            clearInterval(interval);
            setParseProgress(100);
            setImportJob(job);
            setParsedItems(items);
            setIsParsing(false);
            setCurrentStage(3);
        } catch (error) {
            clearInterval(interval);
            setIsParsing(false);
            alert("Gagal memproses file. Silakan coba lagi.");
            setCurrentStage(1);
        }
    };

    const handleCommitImport = async () => {
        if (!importJob) return;
        setIsCommitting(true);
        try {
            const res = await questionImportService.commitImport(importJob.id, parsedItems);
            setIsCommitting(false);
            setCommitResult({ count: res.imported_count, job_id: res.job_id });
            setCurrentStage(4);
        } catch (error) {
            setIsCommitting(false);
            alert("Gagal melakukan impor batch.");
        }
    };

    return (
        <AppShell>
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/questions">
                            <Button variant="outline" size="icon" className="rounded-xl border-border">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-heading text-2xl font-bold tracking-tight">
                                Multi-Format Import Engine
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Ingest butir soal dari dokumen PDF (OCR), DOCX, XLSX, dan CSV secara otomatis dengan parsing AI.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => questionImportService.downloadTemplate("CSV")}
                            className="rounded-xl text-xs gap-1.5 border-border"
                        >
                            <Download className="h-3.5 w-3.5" /> Template CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => questionImportService.downloadTemplate("XLSX")}
                            className="rounded-xl text-xs gap-1.5 border-border"
                        >
                            <Download className="h-3.5 w-3.5" /> Template XLSX
                        </Button>
                    </div>
                </div>

                {/* 4-Stage Wizard Progress Indicator */}
                <Card className="p-4 border border-border rounded-2xl shadow-2xs">
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { num: 1, title: "1. Upload File", desc: "Pilih format & berkas" },
                            { num: 2, title: "2. OCR & AI Parsing", desc: "Ekstraksi otomatis" },
                            { num: 3, title: "3. Review & Edit", desc: "Verifikasi draf" },
                            { num: 4, title: "4. Batch Commit", desc: "Selesai diimpor" },
                        ].map((s) => {
                            const isActive = currentStage === s.num;
                            const isDone = currentStage > s.num;
                            return (
                                <div
                                    key={s.num}
                                    className={`p-3 rounded-xl border transition-all flex flex-col ${isActive
                                            ? "border-primary bg-primary/5"
                                            : isDone
                                                ? "border-emerald-500/40 bg-emerald-500/5"
                                                : "border-border/60 bg-muted/20 opacity-60"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive
                                                    ? "bg-primary text-white"
                                                    : isDone
                                                        ? "bg-emerald-500 text-white"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {isDone ? <Check className="h-3.5 w-3.5" /> : s.num}
                                        </div>
                                        <span className="font-bold text-xs text-foreground">
                                            {s.title}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1">
                                        {s.desc}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* STAGE 1: File Upload & Configuration */}
                {currentStage === 1 && (
                    <Card className="p-6 border border-border rounded-2xl space-y-6 shadow-2xs">
                        <div className="space-y-3">
                            <h2 className="font-heading font-bold text-base">Pilih Format Sumber Dokumen</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    {
                                        fmt: "PDF",
                                        name: "Dokumen PDF",
                                        desc: "Deep OCR + Math AI",
                                        icon: FileText,
                                        badge: "OCR + AI",
                                    },
                                    {
                                        fmt: "DOCX",
                                        name: "Microsoft Word",
                                        desc: ".docx dengan rumus MathType",
                                        icon: FileCode,
                                        badge: "Structured",
                                    },
                                    {
                                        fmt: "XLSX",
                                        name: "Excel Spreadsheet",
                                        desc: ".xlsx format tabel baku",
                                        icon: FileSpreadsheet,
                                        badge: "Fast Batch",
                                    },
                                    {
                                        fmt: "CSV",
                                        name: "CSV UTF-8",
                                        desc: ".csv standar bank soal",
                                        icon: FileSpreadsheet,
                                        badge: "Standard",
                                    },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    const isSelected = selectedFormat === item.fmt;
                                    return (
                                        <button
                                            key={item.fmt}
                                            type="button"
                                            onClick={() => setSelectedFormat(item.fmt as ImportFileFormat)}
                                            className={`p-4 rounded-xl border text-left space-y-2 transition-all cursor-pointer ${isSelected
                                                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                                    : "border-border hover:bg-muted/40"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <Icon
                                                    className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"
                                                        }`}
                                                />
                                                <Badge variant="outline" className="text-[9px]">
                                                    {item.badge}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="font-bold text-xs text-foreground">
                                                    {item.name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Target Subject Selector */}
                        <div className="space-y-1.5 text-xs">
                            <label className="font-semibold text-foreground">
                                Target Mata Pelajaran Default (Untuk Pengelompokan Master)
                            </label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full h-10 rounded-xl border border-input bg-background px-3 font-medium"
                            >
                                <option value="Penalaran Matematika">Penalaran Matematika</option>
                                <option value="Literasi Bahasa Indonesia">Literasi Bahasa Indonesia</option>
                                <option value="Literasi Bahasa Inggris">Literasi Bahasa Inggris</option>
                                <option value="Penalaran Umum">Penalaran Umum</option>
                                <option value="Fisika">Fisika</option>
                                <option value="Kimia">Kimia</option>
                            </select>
                        </div>

                        {/* Drag and Drop Dropzone */}
                        <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-2xl p-8 text-center space-y-4 bg-muted/20">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground">
                                    {file ? file.name : `Unggah File ${selectedFormat}`}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tarik dan lepaskan dokumen di sini, atau klik tombol di bawah (Maks. 15MB)
                                </p>
                            </div>

                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept={
                                    selectedFormat === "PDF"
                                        ? ".pdf"
                                        : selectedFormat === "DOCX"
                                            ? ".docx"
                                            : selectedFormat === "XLSX"
                                                ? ".xlsx,.xls"
                                                : ".csv"
                                }
                                onChange={handleFileChange}
                            />
                            <div className="flex justify-center gap-3">
                                <label htmlFor="file-upload">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl text-xs font-semibold cursor-pointer border-border"
                                        onClick={() => document.getElementById("file-upload")?.click()}
                                    >
                                        Pilih Berkas Komputer
                                    </Button>
                                </label>

                                {file && (
                                    <Button
                                        onClick={handleStartParsing}
                                        className="rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground"
                                    >
                                        <Sparkles className="h-4 w-4" /> Proses Parsing File
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* STAGE 2: OCR & AI Parsing Simulation */}
                {currentStage === 2 && (
                    <Card className="p-8 border border-border rounded-2xl text-center space-y-6 shadow-2xs">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center animate-pulse">
                            <Sparkles className="h-8 w-8" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="font-heading font-bold text-lg">
                                Menguraikan & Menganalisis Dokumen...
                            </h2>
                            <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                Mesin AI OCR sedang mengekstraksi teks, merender formula LaTeX, dan mencocokkan kunci jawaban otomatis.
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full max-w-md mx-auto space-y-2">
                            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300 rounded-full"
                                    style={{ width: `${parseProgress}%` }}
                                />
                            </div>
                            <span className="text-xs font-mono font-bold text-primary">
                                {parseProgress}% Selesai
                            </span>
                        </div>
                    </Card>
                )}

                {/* STAGE 3: Review, Edit & Verification Table */}
                {currentStage === 3 && importJob && (
                    <div className="space-y-6">
                        {/* Summary Badges Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <Card className="p-4 bg-card border border-border/80 rounded-2xl space-y-1">
                                <span className="text-xs text-muted-foreground">Total Ditemukan</span>
                                <h4 className="text-xl font-bold font-heading">{parsedItems.length} Soal</h4>
                            </Card>
                            <Card className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-1">
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    Valid (Siap Impor)
                                </span>
                                <h4 className="text-xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
                                    {parsedItems.filter((i) => i.validation_status === "VALID").length}
                                </h4>
                            </Card>
                            <Card className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-1">
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    Peringatan AI
                                </span>
                                <h4 className="text-xl font-bold font-heading text-amber-600 dark:text-amber-400">
                                    {parsedItems.filter((i) => i.validation_status === "WARNING").length}
                                </h4>
                            </Card>
                            <Card className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-1">
                                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                    Error (Perlu Koreksi)
                                </span>
                                <h4 className="text-xl font-bold font-heading text-rose-600 dark:text-rose-400">
                                    {parsedItems.filter((i) => i.validation_status === "ERROR").length}
                                </h4>
                            </Card>
                        </div>

                        {/* Extracted Questions Table */}
                        <Card className="p-0 border border-border overflow-hidden rounded-2xl shadow-2xs">
                            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-primary" />
                                    <h3 className="font-heading font-bold text-sm">
                                        Hasil Parsing draf: {importJob.job_name}
                                    </h3>
                                </div>
                                <Button
                                    onClick={handleCommitImport}
                                    disabled={isCommitting}
                                    className="rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground"
                                >
                                    <CheckCircle2 className="h-4 w-4" /> Impor {parsedItems.filter((i) => i.validation_status !== "ERROR").length} Soal Valid
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase">
                                        <tr>
                                            <th className="p-3 w-12 text-center">No</th>
                                            <th className="p-3 min-w-[300px]">Narasi Soal Extracted</th>
                                            <th className="p-3">Opsi Jawaban</th>
                                            <th className="p-3 text-center">Kunci</th>
                                            <th className="p-3">Akurasi AI</th>
                                            <th className="p-3">Status Validasi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {parsedItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3 text-center font-bold text-muted-foreground">
                                                    #{item.question_number}
                                                </td>

                                                <td className="p-3 space-y-1">
                                                    <p className="font-medium text-foreground line-clamp-2">
                                                        {item.question_text}
                                                    </p>
                                                    {item.validation_messages.length > 0 && (
                                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                                            ⚠️ {item.validation_messages[0]}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.options.map((opt) => (
                                                            <span
                                                                key={opt.label}
                                                                className={`px-1.5 py-0.5 rounded text-[10px] ${opt.is_answer
                                                                        ? "bg-emerald-500 text-white font-bold"
                                                                        : "bg-muted text-muted-foreground"
                                                                    }`}
                                                            >
                                                                {opt.label}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>

                                                <td className="p-3 text-center">
                                                    {item.correct_answer ? (
                                                        <Badge className="bg-emerald-500 text-white text-[10px]">
                                                            {item.correct_answer}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="text-[10px]">
                                                            Kosong
                                                        </Badge>
                                                    )}
                                                </td>

                                                <td className="p-3">
                                                    <span className="font-mono font-bold text-foreground">
                                                        {Math.round(item.confidence_score * 100)}%
                                                    </span>
                                                </td>

                                                <td className="p-3">
                                                    {item.validation_status === "VALID" && (
                                                        <Badge className="bg-emerald-500 text-white text-[10px] gap-1">
                                                            <CheckCircle2 className="h-3 w-3" /> Valid
                                                        </Badge>
                                                    )}
                                                    {item.validation_status === "WARNING" && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-amber-600 border-amber-500/40 text-[10px] gap-1"
                                                        >
                                                            <AlertTriangle className="h-3 w-3" /> Warning
                                                        </Badge>
                                                    )}
                                                    {item.validation_status === "ERROR" && (
                                                        <Badge variant="destructive" className="text-[10px] gap-1">
                                                            <XCircle className="h-3 w-3" /> Error
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {/* STAGE 4: Commit Success Screen */}
                {currentStage === 4 && commitResult && (
                    <Card className="p-10 border border-border rounded-2xl text-center space-y-6 shadow-2xs">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="font-heading font-bold text-2xl">
                                Import Batch Berhasil Diselesaikan!
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Sebanyak <strong className="text-foreground">{commitResult.count} butir soal</strong>{" "}
                                telah sukses diimpor dan terdaftar ke katalog Bank Soal aktif.
                            </p>
                        </div>

                        <div className="flex justify-center gap-3">
                            <Link href="/admin/questions">
                                <Button className="rounded-xl font-bold bg-primary text-primary-foreground">
                                    Kembali ke Katalog Bank Soal
                                </Button>
                            </Link>
                        </div>
                    </Card>
                )}
            </div>
        </AppShell>
    );
}
