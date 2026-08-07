"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    questionImportService,
    QuestionImportResult,
} from "@/services/question-import.service";
import {
    ArrowLeft,
    UploadCloud,
    FileSpreadsheet,
    Download,
    CheckCircle2,
    XCircle,
    Loader2,
    FileCheck,
    Trash2,
    HelpCircle,
    BookOpen,
    Check,
    AlertTriangle
} from "lucide-react";

type View = "upload" | "processing" | "result";
type State = View;

export default function QuestionImportPage() {
    const [state, setState] = useState<State>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<QuestionImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setFile(null);
        setError("");
        setResult(null);
        setState("upload");
    };

    const acceptFile = (f: File | undefined | null) => {
        if (!f) return;
        if (!f.name.toLowerCase().endsWith(".xlsx")) {
            setError("Hanya file berformat .xlsx yang didukung.");
            setFile(null);
            return;
        }
        if (f.size > 15 * 1024 * 1024) {
            setError("Ukuran file melebihi batas 15MB.");
            setFile(null);
            return;
        }
        setError("");
        setFile(f);
    };

    const handleStartImport = async () => {
        if (!file) {
            setError("Pilih file terlebih dahulu.");
            return;
        }
        setState("processing");
        setError("");
        try {
            const res = await questionImportService.importFile(file);
            setResult(res);
            setState("result");
        } catch (err: any) {
            setError(err?.message || "Impor gagal. Periksa kembali file template Anda.");
            setState("upload");
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <AppShell>
            <div className="space-y-6 max-w-4xl mx-auto pb-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/questions">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-xl border-border"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-heading text-2xl font-bold tracking-tight">
                                Import Bank Soal (Excel)
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Unggah file .xlsx berdasarkan template resmi untuk menambahkan banyak soal secara instan.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => questionImportService.downloadTemplate()}
                        className="rounded-xl text-xs gap-1.5 border-border shadow-xs hover:bg-muted"
                    >
                        <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Unduh Template XLSX
                    </Button>
                </div>

                {state === "upload" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left 2 Cols: Main Dropzone & Upload Action */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="p-6 border border-border rounded-2xl space-y-6 shadow-xs bg-card">
                                <div className="space-y-1.5">
                                    <h2 className="font-heading font-bold text-base flex items-center gap-2">
                                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                                        Pilih File Template (.xlsx)
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Format file harus berupa spreadheet Excel (`.xlsx`) hasil unduhan template resmi YakinLulus.id.
                                    </p>
                                </div>

                                {/* Hidden Native File Input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    onChange={(e) => acceptFile(e.target.files?.[0])}
                                />

                                {/* Interactive Drag & Drop Area */}
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOver(true);
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOver(false);
                                        acceptFile(e.dataTransfer.files?.[0]);
                                    }}
                                    onClick={() => {
                                        if (!file) fileInputRef.current?.click();
                                    }}
                                    className={`border-2 border-dashed rounded-2xl p-8 text-center space-y-4 transition-all duration-200 cursor-pointer ${dragOver
                                            ? "border-primary bg-primary/5 scale-[0.99]"
                                            : file
                                                ? "border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500"
                                                : "border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/30"
                                        }`}
                                >
                                    {file ? (
                                        <div className="space-y-4">
                                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
                                                <FileCheck className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <Badge variant="outline" className="mb-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-mono text-[11px]">
                                                    File Siap Diimpor
                                                </Badge>
                                                <h3 className="font-bold text-sm text-foreground break-all max-w-md mx-auto">
                                                    {file.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1 font-mono">
                                                    Ukuran: {formatFileSize(file.size)}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="rounded-xl text-xs font-semibold border-border"
                                                >
                                                    Ganti File
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setFile(null)}
                                                    className="rounded-xl text-xs text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                    Hapus
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                                                <UploadCloud className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-foreground">
                                                    Tarik &amp; lepas file .xlsx di sini
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    atau klik area ini untuk memilih berkas komputer
                                                </p>
                                            </div>

                                            <div className="pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        fileInputRef.current?.click();
                                                    }}
                                                    className="rounded-xl text-xs font-semibold border-border hover:border-primary/50 shadow-2xs"
                                                >
                                                    Pilih Berkas Komputer
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                                        <XCircle className="h-4 w-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Import Action Button */}
                                {file && (
                                    <div className="pt-2">
                                        <Button
                                            onClick={handleStartImport}
                                            className="w-full rounded-xl text-sm font-bold gap-2 bg-primary text-primary-foreground py-5 shadow-xs"
                                        >
                                            <UploadCloud className="h-4 w-4" />
                                            Mulai Proses Impor ({file.name})
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Right 1 Col: Guidelines & Requirements */}
                        <div className="space-y-6">
                            <Card className="p-5 border border-border rounded-2xl space-y-4 shadow-xs bg-muted/20">
                                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                                    <HelpCircle className="h-4 w-4 text-primary" />
                                    Petunjuk Pengisian Template
                                </div>

                                <ul className="space-y-2.5 text-xs text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span><strong>Mapel</strong>: Tulis nama Mata Pelajaran sesuai persis dengan nama mapel di sistem (misal: <em>Matematika SD</em>, <em>IPAS SD</em>).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span><strong>Materi / Bab</strong>: Nama bab atau topik bahasan materi soal.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span><strong>Kunci Jawaban</strong>: Huruf jawaban benar (misal <em>A</em>, <em>B</em>, <em>C</em> s/d <em>H</em>).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span><strong>Tipe Soal</strong>: Mendukung Pilihan Ganda (<em>MULTIPLE_CHOICE</em>), Kompleks, Isian, maupun Essay.</span>
                                    </li>
                                </ul>

                                <div className="pt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => questionImportService.downloadTemplate()}
                                        className="w-full rounded-xl text-xs gap-1.5 text-primary hover:bg-primary/10"
                                    >
                                        <Download className="h-3.5 w-3.5" /> Unduh ulang file template
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {state === "processing" && (
                    <Card className="p-12 border border-border rounded-2xl text-center space-y-6 shadow-xs bg-card max-w-xl mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-heading font-bold text-xl text-foreground">
                                Sedang Memproses {file?.name ?? "File Excel"}...
                            </h2>
                            <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                Sistem sedang mengurai baris spreadsheet, memvalidasi mapel, dan memasukkan data ke Bank Soal.
                            </p>
                        </div>
                    </Card>
                )}

                {state === "result" && result && (
                    <Card className="p-8 border border-border rounded-2xl space-y-6 shadow-xs bg-card max-w-2xl mx-auto">
                        <div className="text-center space-y-3">
                            {result.failed === 0 ? (
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
                                    <AlertTriangle className="h-10 w-10" />
                                </div>
                            )}
                            <div className="space-y-1">
                                <h2 className="font-heading font-bold text-2xl">
                                    {result.failed === 0
                                        ? "Import Soal Berhasil!"
                                        : "Import Selesai dengan Catatan Error"}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Hasil pengolahan spreadsheet template bank soal.
                                </p>
                            </div>
                        </div>

                        {/* KPI Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-center">
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 block">Soal Berhasil Dibuat</span>
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                                    {result.created}
                                </span>
                            </div>

                            <div className={`p-4 rounded-xl border text-center ${result.failed > 0
                                    ? "border-destructive/20 bg-destructive/10 text-destructive"
                                    : "border-border bg-muted/20 text-muted-foreground"
                                }`}>
                                <span className="text-xs font-semibold block">Gagal Diproses</span>
                                <span className="text-2xl font-bold font-mono mt-1 block">
                                    {result.failed}
                                </span>
                            </div>
                        </div>

                        {result.errors && result.errors.length > 0 && (
                            <Card className="p-4 border border-border rounded-xl space-y-2 bg-muted/20 max-h-60 overflow-y-auto">
                                <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                    <XCircle className="h-4 w-4 text-destructive" />
                                    Rincian Error Baris ({result.errors.length})
                                </p>
                                <ul className="space-y-1.5 text-xs text-muted-foreground">
                                    {result.errors.map((e, i) => (
                                        <li key={i} className="flex gap-2 p-2 rounded-lg bg-card border border-border/60">
                                            <span className="font-mono text-[10px] text-destructive shrink-0">#{i + 1}</span>
                                            <span>{e}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <Link href="/admin/questions">
                                <Button className="rounded-xl font-bold bg-primary text-primary-foreground gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Lihat Daftar Bank Soal
                                </Button>
                            </Link>
                            <Button variant="outline" onClick={reset} className="rounded-xl font-semibold border-border">
                                Impor File Lain
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </AppShell>
    );
}