"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    materialImportService,
    MaterialImportResult,
} from "@/services/question-import.service";
import {
    ArrowLeft,
    UploadCloud,
    BookOpen,
    Download,
    CheckCircle2,
    XCircle,
    Loader2,
} from "lucide-react";

type State = "upload" | "processing" | "result";

export default function ImportMaterialPage() {
    const [state, setState] = useState<State>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<MaterialImportResult | null>(null);

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
            const res = await materialImportService.importFile(file);
            setResult(res);
            setState("result");
        } catch (err: any) {
            setError(err?.message || "Impor gagal. Periksa kembali file template Anda.");
            setState("upload");
        }
    };

    return (
        <AppShell>
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/materials">
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
                                Import Materi Belajar (Excel)
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Unggah file .xlsx berdasarkan template untuk membuat banyak materi sekaligus.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => materialImportService.downloadTemplate()}
                        className="rounded-xl text-xs gap-1.5 border-border"
                    >
                        <Download className="h-3.5 w-3.5" /> Unduh Template XLSX
                    </Button>
                </div>

                {state === "upload" && (
                    <Card className="p-6 border border-border rounded-2xl space-y-6 shadow-2xs">
                        <div className="space-y-1.5">
                            <h2 className="font-heading font-bold text-base">Pilih File Template</h2>
                            <p className="text-xs text-muted-foreground">
                                Kolom <strong>Mapel</strong> dan <strong>Kelas</strong> wajib diisi
                                sesuai data di sistem. <strong>Format</strong> diisi TEXT / RICH_TEXT /
                                MARKDOWN / VIDEO / PDF / AUDIO / INTERACTIVE; <strong>Status</strong>{" "}
                                diisi DRAFT atau PUBLISHED (kosongkan = DRAFT).
                            </p>
                        </div>

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
                            className={`border-2 border-dashed rounded-2xl p-10 text-center space-y-4 bg-muted/20 transition-colors ${
                                dragOver
                                    ? "border-primary/70 bg-primary/5"
                                    : "border-border hover:border-primary/50"
                            }`}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground">
                                    {file ? file.name : "Tarik & lepas file .xlsx di sini"}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Maks. 15MB, format .xlsx
                                </p>
                            </div>

                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept=".xlsx"
                                onChange={(e) => acceptFile(e.target.files?.[0])}
                            />
                            <div className="flex justify-center gap-3">
                                <label htmlFor="file-upload">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl text-xs font-semibold cursor-pointer border-border"
                                    >
                                        Pilih Berkas Komputer
                                    </Button>
                                </label>
                                {file && (
                                    <Button
                                        onClick={handleStartImport}
                                        className="rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground"
                                    >
                                        <BookOpen className="h-4 w-4" /> Mulai Impor
                                    </Button>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                                <XCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[10px]">
                                Mapel + Kelas wajib
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                                Format: TEXT / RICH_TEXT / MARKDOWN / VIDEO / PDF / AUDIO / INTERACTIVE
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                                Status: DRAFT / PUBLISHED
                            </Badge>
                        </div>
                    </Card>
                )}

                {state === "processing" && (
                    <Card className="p-10 border border-border rounded-2xl text-center space-y-5 shadow-2xs">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                            <Loader2 className="h-7 w-7 animate-spin" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="font-heading font-bold text-lg">
                                Sedang Memproses {file?.name ?? "File"}...
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Menerjemahkan baris-baris template menjadi materi belajar.
                            </p>
                        </div>
                    </Card>
                )}

                {state === "result" && result && (
                    <Card className="p-8 border border-border rounded-2xl space-y-6 shadow-2xs">
                        <div className="text-center space-y-3">
                            {result.failed === 0 ? (
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                                    <BookOpen className="h-10 w-10" />
                                </div>
                            )}
                            <div className="space-y-1">
                                <h2 className="font-heading font-bold text-2xl">
                                    {result.failed === 0
                                        ? "Import Materi Selesai!"
                                        : "Import Selesai dengan Sebagian Kesalahan"}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {result.created} materi berhasil dibuat, {result.failed} gagal diproses.
                                </p>
                            </div>
                        </div>

                        {result.errors.length > 0 && (
                            <Card className="p-4 border border-border rounded-xl space-y-2">
                                <p className="font-bold text-xs text-foreground">
                                    Detail Kesalahan ({result.errors.length})
                                </p>
                                <ul className="space-y-1 text-xs text-muted-foreground">
                                    {result.errors.map((e, i) => (
                                        <li key={i} className="flex gap-2">
                                            <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                            <span>{e}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}

                        <div className="flex justify-center gap-3">
                            <Link href="/admin/materials">
                                <Button className="rounded-xl font-bold bg-primary text-primary-foreground">
                                    Kembali ke Materi
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