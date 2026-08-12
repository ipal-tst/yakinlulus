"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { schoolService } from "@/services/school.service";
import { targetSchoolService } from "@/services/target-school.service";
import {
    UploadCloud,
    Download,
    CheckCircle2,
    XCircle,
    Loader2,
} from "lucide-react";

interface ImportResult {
    created: number;
    skipped: number;
    failed: number;
    errors: { row: number; message: string }[];
}

type UploadState = "idle" | "processing" | "result";

function ImportCard({
    title,
    description,
    downloadTemplate,
    doImport,
    downloadFilename,
}: {
    title: string;
    description: string;
    downloadTemplate: () => Promise<void>;
    doImport: (file: File) => Promise<ImportResult>;
    downloadFilename: string;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState("");
    const [state, setState] = useState<UploadState>("idle");
    const [result, setResult] = useState<ImportResult | null>(null);

    const reset = () => {
        setFile(null);
        setError("");
        setResult(null);
        setState("idle");
    };

    const acceptFile = (f: File | undefined | null) => {
        if (!f) return;
        if (!f.name.toLowerCase().endsWith(".xlsx")) {
            setError("Hanya file .xlsx yang didukung.");
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
        setResult(null);
    };

    const handleDownloadTemplate = async () => {
        try {
            await downloadTemplate();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal mengunduh template.";
            setError(msg);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError("Pilih file terlebih dahulu.");
            return;
        }
        setState("processing");
        setError("");
        try {
            const res = await doImport(file);
            setResult(res);
            setState("result");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Impor gagal. Periksa file template Anda.";
            setError(msg);
            setState("idle");
        }
    };

    return (
        <Card className="p-6 border border-border rounded-2xl space-y-5 shadow-xs">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="font-heading font-bold text-base">{title}</h3>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="rounded-xl text-xs gap-1.5 border-border shrink-0"
                >
                    <Download className="h-3.5 w-3.5" /> Unduh Template
                </Button>
            </div>

            {state === "idle" && (
                <>
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
                        className={`border-2 border-dashed rounded-2xl p-8 text-center space-y-3 bg-muted/20 transition-colors ${
                            dragOver
                                ? "border-primary/70 bg-primary/5"
                                : "border-border hover:border-primary/50"
                        }`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                            <UploadCloud className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">
                                {file ? file.name : "Tarik & lepas file .xlsx"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Maks. 15MB
                            </p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            id={`file-${downloadFilename}`}
                            accept=".xlsx"
                            onChange={(e) => acceptFile(e.target.files?.[0])}
                        />
                        <div className="flex justify-center gap-2">
                            <label htmlFor={`file-${downloadFilename}`}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl text-xs font-semibold cursor-pointer border-border"
                                >
                                    Pilih Berkas
                                </Button>
                            </label>
                            {file && (
                                <Button
                                    onClick={handleImport}
                                    className="rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground"
                                >
                                    <UploadCloud className="h-4 w-4" /> Import
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
                </>
            )}

            {state === "processing" && (
                <Card className="p-8 border border-border rounded-xl text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <div className="space-y-1">
                        <p className="font-bold text-sm">
                            Sedang memproses {file?.name}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Mohon tunggu, data sedang diimpor.
                        </p>
                    </div>
                </Card>
            )}

            {state === "result" && result && (
                <Card className="p-5 border border-border rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                        {result.failed === 0 ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                            <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                        <p className="font-bold text-sm">
                            {result.failed === 0
                                ? "Import selesai!"
                                : "Import selesai dengan sebagian kesalahan"}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                            {result.created} dibuat
                        </Badge>
                        {result.skipped > 0 && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                                {result.skipped} dilewati
                            </Badge>
                        )}
                        {result.failed > 0 && (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
                                {result.failed} gagal
                            </Badge>
                        )}
                    </div>

                    {result.errors.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            <p className="font-bold text-xs text-foreground">
                                Detail Kesalahan ({result.errors.length})
                            </p>
                            <ul className="space-y-1 text-xs text-muted-foreground">
                                {result.errors.map((e, i) => (
                                    <li key={i} className="flex gap-2">
                                        <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                                        <span>Baris {e.row}: {e.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        onClick={reset}
                        className="rounded-xl text-xs font-semibold border-border"
                    >
                        Import File Lain
                    </Button>
                </Card>
            )}
        </Card>
    );
}

export function SchoolsImportTab() {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <ImportCard
                title="Import Sekolah"
                description="Unggah file .xlsx berdasarkan template untuk menambah data sekolah katalog."
                downloadTemplate={schoolService.downloadSchoolImportTemplate}
                doImport={schoolService.importSchools}
                downloadFilename="template-sekolah"
            />
            <ImportCard
                title="Import Target Sekolah"
                description="Unggah file .xlsx berdasarkan template untuk menambah data target sekolah."
                downloadTemplate={targetSchoolService.downloadTargetImportTemplate}
                doImport={targetSchoolService.importTargets}
                downloadFilename="template-target-sekolah"
            />
        </div>
    );
}
