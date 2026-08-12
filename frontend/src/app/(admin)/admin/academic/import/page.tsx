"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/data-display/data-table";
import {
    academicMasterImportService,
    type AcademicImportKind,
    type AcademicImportResult,
} from "@/services/academic-master-import.service";
import { parseAcademicSheet, type ParsedRow } from "@/services/academic-excel-parser";
import {
    ArrowLeft,
    Download,
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
} from "lucide-react";

type TabValue = "hierarchy" | "curriculum" | "program";

const KIND_LABELS: Record<AcademicImportKind, string> = {
    level: "Jenjang",
    grade: "Kelas",
    subject: "Mata Pelajaran",
    chapter: "Bab",
    topic: "Topik",
    learning_outcome: "Capaian Pembelajaran",
    curriculum: "Kurikulum",
    program: "Program",
};

const HIERARCHY_KINDS: AcademicImportKind[] = [
    "level",
    "grade",
    "subject",
    "chapter",
    "topic",
    "learning_outcome",
];

export default function AcademicImportPage() {
    const [activeTab, setActiveTab] = useState<TabValue>("hierarchy");
    const [hierarchyKind, setHierarchyKind] = useState<AcademicImportKind>("level");

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ParsedRow[] | null>(null);
    const [result, setResult] = useState<AcademicImportResult | null>(null);

    const [parsing, setParsing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentKind: AcademicImportKind =
        activeTab === "hierarchy" ? hierarchyKind : activeTab === "curriculum" ? "curriculum" : "program";

    const handleDownloadTemplate = async () => {
        try {
            await academicMasterImportService.downloadTemplate(currentKind);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Gagal mengunduh template";
            setError(message);
        }
    };

    const handleFileSelect = async (f: File | null) => {
        if (!f) return;
        if (!f.name.toLowerCase().endsWith(".xlsx") && !f.name.toLowerCase().endsWith(".xls")) {
            setError("Hanya file berformat .xlsx atau .xls yang didukung");
            return;
        }
        setFile(f);
        setPreview(null);
        setResult(null);
        setError(null);

        setParsing(true);
        try {
            const rows = await parseAcademicSheet(f, currentKind);
            setPreview(rows);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Gagal mengurai file Excel";
            setError(message);
            setPreview(null);
        } finally {
            setParsing(false);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError("Pilih file terlebih dahulu");
            return;
        }
        setImporting(true);
        setError(null);
        try {
            const res = await academicMasterImportService.importFile(currentKind, file);
            setResult(res);
            setPreview(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Import gagal";
            setError(message);
        } finally {
            setImporting(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError(null);
    };

    const validCount = preview?.filter((r) => r.valid).length || 0;
    const invalidCount = preview?.filter((r) => !r.valid).length || 0;

    const previewColumns: Column<ParsedRow>[] = [
        { header: "Baris", accessorKey: "rowNum", enableSorting: true },
        {
            header: "Status",
            accessorKey: (r: ParsedRow) => (
                <Badge variant={r.valid ? "default" : "destructive"} className="text-xs">
                    {r.valid ? "Valid" : "Error"}
                </Badge>
            ),
            enableSorting: false,
        },
        ...(preview && preview.length > 0
            ? Object.keys(preview[0].values).map((key) => ({
                  header: key,
                  accessorKey: ((r: ParsedRow): React.ReactNode => r.values[key] || "-"),
                  enableSorting: false,
              }))
            : []),
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin/academic">
                    <Button variant="outline" size="icon" className="rounded-xl">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <PageHeader
                    title="Import Master Akademik"
                    description="Unduh template, unggah file Excel, pratinjau data, lalu import ke database"
                />
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setError(null)}
                        className="ml-auto rounded-lg"
                    >
                        Tutup
                    </Button>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                <TabsList className="bg-muted p-1 rounded-xl">
                    <TabsTrigger value="hierarchy" className="rounded-lg">
                        Hirarki
                    </TabsTrigger>
                    <TabsTrigger value="curriculum" className="rounded-lg">
                        Kurikulum
                    </TabsTrigger>
                    <TabsTrigger value="program" className="rounded-lg">
                        Program
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="hierarchy" className="space-y-6 mt-6">
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-heading font-bold text-base">Pilih Jenis Sheet</h3>
                                <p className="text-xs text-muted-foreground">
                                    Pilih sheet yang ingin diimport (Jenjang, Kelas, Mapel, dll)
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadTemplate}
                                className="rounded-xl gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Unduh Templat
                            </Button>
                        </div>

                        <select
                            value={hierarchyKind}
                            onChange={(e) => {
                                setHierarchyKind(e.target.value as AcademicImportKind);
                                handleReset();
                            }}
                            className="w-full p-3 rounded-xl border border-border bg-background text-sm"
                        >
                            {HIERARCHY_KINDS.map((k) => (
                                <option key={k} value={k}>
                                    {KIND_LABELS[k]}
                                </option>
                            ))}
                        </select>
                    </Card>
                </TabsContent>

                <TabsContent value="curriculum" className="space-y-6 mt-6">
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-heading font-bold text-base">Import Kurikulum</h3>
                                <p className="text-xs text-muted-foreground">
                                    Unduh template, isi data, lalu upload file Excel
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadTemplate}
                                className="rounded-xl gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Unduh Templat
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="program" className="space-y-6 mt-6">
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-heading font-bold text-base">Import Program</h3>
                                <p className="text-xs text-muted-foreground">
                                    Unduh template, isi data, lalu upload file Excel
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadTemplate}
                                className="rounded-xl gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Unduh Templat
                            </Button>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {!result && (
                <Card className="p-6 space-y-6">
                    <div className="space-y-1.5">
                        <h2 className="font-heading font-bold text-base flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            Upload File Template
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Pilih file Excel hasil unduhan template untuk diimport ({KIND_LABELS[currentKind]})
                        </p>
                    </div>

                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-input"
                    />
                    <label
                        htmlFor="file-input"
                        className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
                    >
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                                <Upload className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">
                                    {file ? file.name : "Klik untuk pilih file .xlsx"}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Maks 15MB, format .xlsx atau .xls
                                </p>
                            </div>
                        </div>
                    </label>

                    {parsing && (
                        <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-muted/50">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="text-sm font-medium">Memproses file...</span>
                        </div>
                    )}

                    {preview && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-emerald-700 dark:text-emerald-300">
                                            Valid
                                        </span>
                                        <Badge className="bg-emerald-600 text-white font-mono">
                                            {validCount}
                                        </Badge>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-red-700 dark:text-red-300">
                                            Error
                                        </span>
                                        <Badge className="bg-red-600 text-white font-mono">
                                            {invalidCount}
                                        </Badge>
                                    </div>
                                </Card>
                            </div>

                            <DataTable
                                columns={previewColumns}
                                data={preview}
                                searchPlaceholder="Cari data..."
                                pageSize={10}
                                enableExport={false}
                            />

                            {preview.some((r) => !r.valid) && (
                                <div className="space-y-2">
                                    <h4 className="font-bold text-sm">Detail Error:</h4>
                                    <div className="space-y-1">
                                        {preview
                                            .filter((r) => !r.valid)
                                            .map((r) => (
                                                <div
                                                    key={r.rowNum}
                                                    className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-xs flex gap-2"
                                                >
                                                    <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                                    <span>
                                                        Baris {r.rowNum}: {r.errors.join(", ")}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleImport}
                                    disabled={importing || invalidCount > 0}
                                    className="rounded-xl font-bold gap-2"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Mengimpor...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            Import {preview.length} Data
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    className="rounded-xl"
                                >
                                    Batal
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {result && (
                <Card className="p-8 space-y-6">
                    <div className="text-center space-y-3">
                        {result.failed === 0 ? (
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
                                <AlertCircle className="h-10 w-10" />
                            </div>
                        )}
                        <div>
                            <h2 className="font-heading font-bold text-2xl">
                                {result.failed === 0
                                    ? "Import Berhasil!"
                                    : "Import Selesai dengan Kesalahan"}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {result.created} data dibuat, {result.skipped} dilewati, {result.failed}{" "}
                                gagal
                            </p>
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                            <h4 className="font-bold text-xs mb-2">Detail Error ({result.errors.length}):</h4>
                            <ul className="space-y-1 text-xs">
                                {result.errors.map((e, i) => (
                                    <li key={i} className="flex gap-2">
                                        <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                                        <span>
                                            Baris {e.row}: {e.message}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    <div className="flex justify-center gap-3">
                        <Link href="/admin/academic">
                            <Button className="rounded-xl font-bold">Kembali ke Akademik</Button>
                        </Link>
                        <Button variant="outline" onClick={handleReset} className="rounded-xl">
                            Import File Lain
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
