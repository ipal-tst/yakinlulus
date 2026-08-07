"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    questionImportService,
    QuestionImportResult,
} from "@/services/question-import.service";
import {
    parseExcelQuestionFile,
    generateExcelFromRows,
    validateQuestionRow,
    parseTrueFalseKeyMap,
    ParsedQuestionRow,
} from "@/services/question-excel-parser";
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
    X,
    AlertTriangle,
    Pencil,
    Plus,
    Search,
    Eye,
    Monitor,
    Smartphone,
    Lightbulb,
    Clock,
    Layers,
    Sparkles,
} from "lucide-react";

type View = "upload" | "preview" | "processing" | "result";

export default function QuestionImportPage() {
    const [state, setState] = useState<View>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedQuestionRow[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState("");
    const [parsing, setParsing] = useState(false);
    const [result, setResult] = useState<QuestionImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "invalid">("all");

    // Edit Modal State
    const [editingRow, setEditingRow] = useState<ParsedQuestionRow | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Standalone Student POV Preview Modal State
    const [previewPovRow, setPreviewPovRow] = useState<ParsedQuestionRow | null>(null);
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

    // POV Live Simulator Controls
    const [simulatorDevice, setSimulatorDevice] = useState<"desktop" | "mobile">("desktop");
    const [simulatorShowSolution, setSimulatorShowSolution] = useState(true);
    const [simulatorSelectedOpt, setSimulatorSelectedOpt] = useState<string | null>(null);
    const [simulatorMatrixAnswers, setSimulatorMatrixAnswers] = useState<Record<string, "BENAR" | "SALAH">>({});

    const reset = () => {
        setFile(null);
        setParsedRows([]);
        setError("");
        setResult(null);
        setState("upload");
    };

    const handleFileSelect = async (f: File | undefined | null) => {
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

    const handleParseFile = async () => {
        if (!file) return;
        setParsing(true);
        setError("");
        try {
            const rows = await parseExcelQuestionFile(file);
            if (rows.length === 0) {
                setError("File Excel tidak berisi data soal yang dapat diproses.");
                setParsing(false);
                return;
            }
            setParsedRows(rows);
            setState("preview");
        } catch (err: any) {
            setError(err?.message || "Gagal mengurai file Excel.");
        } finally {
            setParsing(false);
        }
    };

    const handleSaveRow = () => {
        if (!editingRow) return;
        const revalidated = {
            ...editingRow,
            validationErrors: validateQuestionRow(editingRow),
        };
        setParsedRows((prev) =>
            prev.map((r) => (r.id === editingRow.id ? revalidated : r))
        );
        setIsEditDialogOpen(false);
        setEditingRow(null);
    };

    const handleDeleteRow = (id: string) => {
        setParsedRows((prev) => prev.filter((r) => r.id !== id));
    };

    const handleAddRow = () => {
        const newRow: ParsedQuestionRow = {
            id: `row-new-${Date.now()}`,
            no: String(parsedRows.length + 1),
            kode: "",
            mapel: parsedRows[0]?.mapel || "Matematika SD",
            kelas: parsedRows[0]?.kelas || "1",
            bab: "",
            tipeSoal: "SINGLE_CHOICE",
            kesulitan: "MEDIUM",
            block1Type: "PARAGRAPH",
            block1Isi: "Tulis pertanyaan baru di sini...",
            block2Type: "PARAGRAPH",
            block2Isi: "",
            block3Type: "PARAGRAPH",
            block3Isi: "",
            block4Type: "PARAGRAPH",
            block4Isi: "",
            optionA: "Pilihan A",
            optionB: "Pilihan B",
            optionC: "Pilihan C",
            optionD: "Pilihan D",
            optionE: "",
            optionF: "",
            optionG: "",
            optionH: "",
            kunciJawaban: "A",
            skor: "5",
            skorNegatif: "0",
            pembahasan: "",
            bloomLevel: "C3",
            bahasa: "id",
            validationErrors: [],
        };
        newRow.validationErrors = validateQuestionRow(newRow);
        setParsedRows((prev) => [newRow, ...prev]);
        setEditingRow(newRow);
        setIsEditDialogOpen(true);
    };

    const handleExecuteImport = async () => {
        if (parsedRows.length === 0) {
            setError("Tidak ada data soal untuk diimpor.");
            return;
        }
        setState("processing");
        setError("");
        try {
            const generatedFile = generateExcelFromRows(parsedRows);
            const res = await questionImportService.importFile(generatedFile);
            setResult(res);
            setState("result");
        } catch (err: any) {
            setError(err?.message || "Impor ke database gagal.");
            setState("preview");
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Filtered rows for preview table
    const filteredRows = parsedRows.filter((r) => {
        const matchesSearch =
            r.mapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.block1Isi.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.bab.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterStatus === "valid") return matchesSearch && r.validationErrors.length === 0;
        if (filterStatus === "invalid") return matchesSearch && r.validationErrors.length > 0;
        return matchesSearch;
    });

    const validCount = parsedRows.filter((r) => r.validationErrors.length === 0).length;
    const invalidCount = parsedRows.filter((r) => r.validationErrors.length > 0).length;

    // Helper to collect non-empty options for Student POV Simulator
    const getOptionsList = (row: ParsedQuestionRow) => {
        const opts: { label: string; text: string }[] = [];
        if (row.optionA) opts.push({ label: "A", text: row.optionA });
        if (row.optionB) opts.push({ label: "B", text: row.optionB });
        if (row.optionC) opts.push({ label: "C", text: row.optionC });
        if (row.optionD) opts.push({ label: "D", text: row.optionD });
        if (row.optionE) opts.push({ label: "E", text: row.optionE });
        if (row.optionF) opts.push({ label: "F", text: row.optionF });
        if (row.optionG) opts.push({ label: "G", text: row.optionG });
        if (row.optionH) opts.push({ label: "H", text: row.optionH });
        return opts;
    };

    return (
        <AppShell>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
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
                                Unggah file .xlsx, pratinjau POV siswa &amp; edit data soal sebelum disimpan ke database.
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

                {/* STEP 1: FILE SELECTION */}
                {state === "upload" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card className="p-6 border border-border rounded-2xl space-y-6 shadow-xs bg-card">
                                <div className="space-y-1.5">
                                    <h2 className="font-heading font-bold text-base flex items-center gap-2">
                                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                                        Pilih File Template (.xlsx)
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Format berkas harus berupa spreadsheet Excel (`.xlsx`) hasil unduhan template resmi YakinLulus.id.
                                    </p>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                                />

                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOver(true);
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOver(false);
                                        handleFileSelect(e.dataTransfer.files?.[0]);
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
                                                    File Siap Diproses &amp; Dipratinjau
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

                                {file && (
                                    <div className="pt-2">
                                        <Button
                                            onClick={handleParseFile}
                                            disabled={parsing}
                                            className="w-full rounded-xl text-sm font-bold gap-2 bg-primary text-primary-foreground py-5 shadow-xs"
                                        >
                                            {parsing ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Membaca &amp; Mengurai File...
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="h-4 w-4" />
                                                    Lanjut Parse &amp; Pratinjau Soal ({file.name})
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="p-5 border border-border rounded-2xl space-y-4 shadow-xs bg-muted/20">
                                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                                    <HelpCircle className="h-4 w-4 text-primary" />
                                    Alur Fitur Import Soal
                                </div>

                                <ol className="space-y-3 text-xs text-muted-foreground list-decimal pl-4">
                                    <li>
                                        <strong>Pilih File Template</strong> hasil unduhan resmi (`.xlsx`).
                                    </li>
                                    <li>
                                        <strong>Pratinjau POV Siswa &amp; Editor Lebar</strong>: Lihat simulasi tampilan ujian siswa dan edit soal dengan nyaman di editor split-screen.
                                    </li>
                                    <li>
                                        <strong>Eksekusi Database</strong>: Setelah data dipastikan benar, klik tombol eksekusi untuk menyimpan ke database.
                                    </li>
                                </ol>

                                <div className="pt-2 border-t border-border/60">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => questionImportService.downloadTemplate()}
                                        className="w-full rounded-xl text-xs gap-1.5 text-primary hover:bg-primary/10"
                                    >
                                        <Download className="h-3.5 w-3.5" /> Unduh ulang template XLSX
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* STEP 2: PREVIEW & EDIT TABLE */}
                {state === "preview" && (
                    <div className="space-y-6">
                        {/* KPI Overview Banner */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="p-4 border border-border rounded-xl bg-card flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-medium text-muted-foreground block">Total Soal Terurai</span>
                                    <span className="text-2xl font-bold font-mono text-foreground mt-0.5 block">{parsedRows.length}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                    <FileSpreadsheet className="h-5 w-5" />
                                </div>
                            </Card>

                            <Card className="p-4 border border-emerald-500/20 rounded-xl bg-emerald-500/5 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 block">Status Valid</span>
                                    <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">{validCount}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            </Card>

                            <Card className={`p-4 border rounded-xl flex items-center justify-between ${invalidCount > 0 ? "border-amber-500/30 bg-amber-500/10" : "border-border bg-card"
                                }`}>
                                <div>
                                    <span className="text-xs font-medium text-muted-foreground block">Ada Peringatan/Kekurangan</span>
                                    <span className={`text-2xl font-bold font-mono mt-0.5 block ${invalidCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                                        }`}>{invalidCount}</span>
                                </div>
                                <div className={`p-3 rounded-xl ${invalidCount > 0 ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                            </Card>
                        </div>

                        {/* Toolbar & Filters */}
                        <Card className="p-4 border border-border rounded-2xl space-y-4 bg-card">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 flex-1 max-w-md">
                                    <div className="relative w-full">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari mapel, bab, atau isi teks soal..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 text-xs rounded-xl border-border"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="inline-flex items-center p-1 bg-muted rounded-xl border border-border text-xs">
                                        <button
                                            onClick={() => setFilterStatus("all")}
                                            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                                                }`}
                                        >
                                            Semua ({parsedRows.length})
                                        </button>
                                        <button
                                            onClick={() => setFilterStatus("valid")}
                                            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === "valid" ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs" : "text-muted-foreground"
                                                }`}
                                        >
                                            Valid ({validCount})
                                        </button>
                                        <button
                                            onClick={() => setFilterStatus("invalid")}
                                            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filterStatus === "invalid" ? "bg-background text-amber-600 dark:text-amber-400 shadow-xs" : "text-muted-foreground"
                                                }`}
                                        >
                                            Peringatan ({invalidCount})
                                        </button>
                                    </div>

                                    <Button
                                        onClick={handleAddRow}
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl text-xs gap-1.5 border-border hover:bg-primary/5 hover:text-primary"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Tambah Soal
                                    </Button>

                                    <Button
                                        onClick={handleExecuteImport}
                                        size="sm"
                                        className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs"
                                    >
                                        <UploadCloud className="h-4 w-4" />
                                        Eksekusi Input DB ({parsedRows.length} Soal)
                                    </Button>

                                    <Button
                                        onClick={() => setState("upload")}
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-xl text-xs text-muted-foreground hover:bg-muted"
                                    >
                                        Ganti File
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Interactive Preview Table */}
                        <Card className="border border-border rounded-2xl overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                                            <th className="p-3 w-12 text-center">#</th>
                                            <th className="p-3 w-36">Mapel</th>
                                            <th className="p-3 w-28">Tipe Soal</th>
                                            <th className="p-3 min-w-[240px]">Teks Soal (Blok 1)</th>
                                            <th className="p-3 w-24 text-center">Kunci</th>
                                            <th className="p-3 w-32">Status</th>
                                            <th className="p-3 w-40 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {filteredRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                    Tidak ada data soal yang cocok dengan filter pencarian.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRows.map((row, idx) => {
                                                const hasErr = row.validationErrors.length > 0;
                                                return (
                                                    <tr
                                                        key={row.id}
                                                        className={`hover:bg-muted/30 transition-colors align-top ${hasErr ? "bg-amber-500/5" : ""
                                                            }`}
                                                    >
                                                        <td className="p-3 text-center font-mono font-semibold text-muted-foreground">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="font-bold text-foreground block">{row.mapel || "-"}</span>
                                                            {row.bab && <span className="text-[10px] text-muted-foreground block font-mono">{row.bab}</span>}
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge variant="outline" className="text-[10px] font-mono">
                                                                {row.tipeSoal}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3">
                                                            <p className="line-clamp-2 text-foreground font-medium">
                                                                {row.block1Isi || <span className="italic text-rose-500">Teks soal kosong</span>}
                                                            </p>
                                                            {/* Show options snippet */}
                                                            <div className="flex gap-2 text-[10px] text-muted-foreground mt-1 font-mono">
                                                                {row.optionA && <span>A: {row.optionA.slice(0, 15)}...</span>}
                                                                {row.optionB && <span>B: {row.optionB.slice(0, 15)}...</span>}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <Badge className="bg-primary/10 text-primary font-bold font-mono">
                                                                {row.kunciJawaban || "-"}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3">
                                                            {hasErr ? (
                                                                <div className="space-y-1">
                                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">
                                                                        ⚠️ Peringatan
                                                                    </Badge>
                                                                    <span className="text-[10px] text-amber-600 block leading-tight">
                                                                        {row.validationErrors[0]}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                                                                    ✓ Valid
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                {/* Student POV Quick Button */}
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setPreviewPovRow(row);
                                                                        setIsPreviewDialogOpen(true);
                                                                    }}
                                                                    className="rounded-lg text-[11px] gap-1 border-border bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                                                    title="Pratinjau POV Siswa"
                                                                >
                                                                    <Eye className="h-3 w-3 text-primary" />
                                                                    POV Siswa
                                                                </Button>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    onClick={() => {
                                                                        setEditingRow({ ...row });
                                                                        setIsEditDialogOpen(true);
                                                                    }}
                                                                    className="rounded-lg hover:bg-primary/10 hover:text-primary"
                                                                    title="Edit Detail & Live POV Editor"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    onClick={() => handleDeleteRow(row.id)}
                                                                    className="rounded-lg text-destructive hover:bg-destructive/10"
                                                                    title="Hapus Soal Ini"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Bottom Action Footer */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-xs">
                            <span className="text-xs text-muted-foreground">
                                Menampilkan <strong>{filteredRows.length}</strong> dari <strong>{parsedRows.length}</strong> total baris soal.
                            </span>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => setState("upload")}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-xs border-border"
                                >
                                    Kembali ke Unggah File
                                </Button>
                                <Button
                                    onClick={handleExecuteImport}
                                    size="sm"
                                    className="rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground shadow-xs"
                                >
                                    <UploadCloud className="h-4 w-4" />
                                    Eksekusi Input ke Database ({parsedRows.length} Soal)
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: PROCESSING STATE */}
                {state === "processing" && (
                    <Card className="p-12 border border-border rounded-2xl text-center space-y-6 shadow-xs bg-card max-w-xl mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-heading font-bold text-xl text-foreground">
                                Mengeksekusi Input {parsedRows.length} Soal...
                            </h2>
                            <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                Sistem sedang memproses data soal terkonfirmasi ke database Bank Soal.
                            </p>
                        </div>
                    </Card>
                )}

                {/* STEP 4: RESULT STATE */}
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
                                        ? "Import Soal Selesai!"
                                        : "Import Selesai dengan Catatan Error"}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Data soal berhasil dieksekusi dan disimpan ke sistem database Bank Soal.
                                </p>
                            </div>
                        </div>

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

                {/* WIDE SPLIT-SCREEN EDIT DIALOG WITH LIVE STUDENT POV PREVIEW */}
                {editingRow && (
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent className="sm:max-w-[95vw] lg:max-w-[1400px] w-[95vw] max-h-[92vh] overflow-y-auto p-6 rounded-2xl border-border bg-card shadow-2xl">
                            <DialogHeader className="pb-3 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                            <Pencil className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-lg font-bold font-heading">
                                                Editor Soal #{editingRow.no} (Fitur Split-Screen Live POV)
                                            </DialogTitle>
                                            <p className="text-xs text-muted-foreground">
                                                Ubah data soal di panel kiri. Layar kanan otomatis mensimulasikan pratinjau real-time tampilan CBT siswa.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Simulator Device Mode Switcher */}
                                    <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border border-border">
                                        <button
                                            type="button"
                                            onClick={() => setSimulatorDevice("desktop")}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${simulatorDevice === "desktop"
                                                ? "bg-background text-foreground shadow-2xs"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            <Monitor className="h-3.5 w-3.5" /> Desktop
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSimulatorDevice("mobile")}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${simulatorDevice === "mobile"
                                                ? "bg-background text-foreground shadow-2xs"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            <Smartphone className="h-3.5 w-3.5" /> Mobile
                                        </button>
                                    </div>
                                </div>
                            </DialogHeader>

                            {/* Split-Screen Container */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4">
                                {/* LEFT PANEL (7/12 width): EDIT FORM */}
                                <div className="lg:col-span-7 space-y-4 text-xs pr-0 lg:pr-2">
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-primary font-semibold">
                                        <span className="flex items-center gap-1.5">
                                            <Sparkles className="h-4 w-4" /> Form Pengisian Parameter Soal
                                        </span>
                                        <Badge variant="outline" className="text-[10px]">
                                            Kolom Lebar &amp; Ergonomis
                                        </Badge>
                                    </div>

                                    {/* Row 1: Mapel & Bab */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-foreground">Mata Pelajaran</label>
                                            <Input
                                                value={editingRow.mapel}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    setEditingRow({ ...editingRow, mapel: e.target.value })
                                                }
                                                placeholder="Contoh: Matematika SD"
                                                className="rounded-xl text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-foreground">Materi / Bab</label>
                                            <Input
                                                value={editingRow.bab}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    setEditingRow({ ...editingRow, bab: e.target.value })
                                                }
                                                placeholder="Contoh: Pecahan &amp; Desimal"
                                                className="rounded-xl text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Row 2: Tipe Soal & Kunci Jawaban & Skor */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-foreground">Tipe Soal</label>
                                            <select
                                                value={editingRow.tipeSoal}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                                    setEditingRow({ ...editingRow, tipeSoal: e.target.value })
                                                }
                                                className="w-full rounded-xl border border-input bg-background p-2 text-xs"
                                            >
                                                <option value="SINGLE_CHOICE">SINGLE_CHOICE (Pilihan Ganda)</option>
                                                <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE (PG Kompleks)</option>
                                                <option value="TRUE_FALSE">TRUE_FALSE (Benar / Salah)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-foreground">Kunci Jawaban</label>
                                            <Input
                                                value={editingRow.kunciJawaban}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    setEditingRow({ ...editingRow, kunciJawaban: e.target.value.toUpperCase() })
                                                }
                                                placeholder="A / B / C / D / A,B"
                                                className="rounded-xl font-mono font-bold text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-foreground">Skor Soal</label>
                                            <Input
                                                value={editingRow.skor}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    setEditingRow({ ...editingRow, skor: e.target.value })
                                                }
                                                placeholder="5"
                                                className="rounded-xl text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Question Text */}
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-foreground">Pertanyaan / Teks Soal (Blok 1 Isi)</label>
                                        <textarea
                                            rows={5}
                                            value={editingRow.block1Isi}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                                setEditingRow({ ...editingRow, block1Isi: e.target.value })
                                            }
                                            placeholder="Tulis pertanyaan soal di sini..."
                                            className="w-full min-h-[100px] rounded-xl border border-input bg-background p-3 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
                                        />
                                    </div>

                                    {/* Options Grid / Matrix Pernyataan */}
                                    <div className="space-y-2 border-t border-border pt-3">
                                        {editingRow.tipeSoal === "TRUE_FALSE" ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                        Matriks Pernyataan &amp; Kunci (True / False)
                                                    </label>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Centang [Benar] atau [Salah] pada setiap opsi untuk menyusun Kunci Jawaban
                                                    </span>
                                                </div>

                                                <div className="space-y-3">
                                                    {[
                                                        { label: "A", text: editingRow.optionA, key: "optionA" as const },
                                                        { label: "B", text: editingRow.optionB, key: "optionB" as const },
                                                        { label: "C", text: editingRow.optionC, key: "optionC" as const },
                                                        { label: "D", text: editingRow.optionD, key: "optionD" as const },
                                                        { label: "E", text: editingRow.optionE, key: "optionE" as const },
                                                    ].map((optItem) => {
                                                        const keyMap = parseTrueFalseKeyMap(editingRow.kunciJawaban);
                                                        const isBenar = keyMap[optItem.label] === "BENAR";
                                                        const isSalah = keyMap[optItem.label] === "SALAH";

                                                        const handleToggleKey = (targetValue: "BENAR" | "SALAH") => {
                                                            const newMap = { ...keyMap, [optItem.label]: targetValue };
                                                            const newKeyStr = Object.entries(newMap)
                                                                .filter(([_, v]) => v)
                                                                .map(([k, v]) => `${k}:${v}`)
                                                                .join(", ");
                                                            setEditingRow({ ...editingRow, kunciJawaban: newKeyStr });
                                                        };

                                                        return (
                                                            <div key={optItem.label} className="p-3 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center">
                                                                            {optItem.label}
                                                                        </span>
                                                                        <span className="text-xs font-bold text-foreground">
                                                                            Pernyataan {optItem.label}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-semibold text-muted-foreground">Pilih Kunci:</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleKey("BENAR")}
                                                                            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${isBenar
                                                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                                                : "bg-muted/40 text-muted-foreground border-border hover:bg-emerald-500/10 hover:text-emerald-600"
                                                                                }`}
                                                                        >
                                                                            <Check className="h-3 w-3" /> Benar
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleKey("SALAH")}
                                                                            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${isSalah
                                                                                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                                                                : "bg-muted/40 text-muted-foreground border-border hover:bg-rose-500/10 hover:text-rose-600"
                                                                                }`}
                                                                        >
                                                                            <X className="h-3 w-3" /> Salah
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <textarea
                                                                    rows={2}
                                                                    value={optItem.text}
                                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                                                        setEditingRow({ ...editingRow, [optItem.key]: e.target.value })
                                                                    }
                                                                    placeholder={`Tulis teks pernyataan lengkap untuk Opsi ${optItem.label}...`}
                                                                    className="w-full min-h-[54px] rounded-xl border border-input bg-background p-2.5 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <label className="font-semibold text-foreground block">Pilihan Jawaban (Opsi A - E)</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-muted-foreground">Opsi A</span>
                                                        <Input
                                                            value={editingRow.optionA}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                setEditingRow({ ...editingRow, optionA: e.target.value })
                                                            }
                                                            className="rounded-xl text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-muted-foreground">Opsi B</span>
                                                        <Input
                                                            value={editingRow.optionB}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                setEditingRow({ ...editingRow, optionB: e.target.value })
                                                            }
                                                            className="rounded-xl text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-muted-foreground">Opsi C</span>
                                                        <Input
                                                            value={editingRow.optionC}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                setEditingRow({ ...editingRow, optionC: e.target.value })
                                                            }
                                                            className="rounded-xl text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-bold text-muted-foreground">Opsi D</span>
                                                        <Input
                                                            value={editingRow.optionD}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                setEditingRow({ ...editingRow, optionD: e.target.value })
                                                            }
                                                            className="rounded-xl text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1 col-span-2">
                                                        <span className="text-[10px] font-bold text-muted-foreground">Opsi E (Opsional)</span>
                                                        <Input
                                                            value={editingRow.optionE}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                setEditingRow({ ...editingRow, optionE: e.target.value })
                                                            }
                                                            className="rounded-xl text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Explanation */}
                                    <div className="space-y-1.5 border-t border-border pt-3">
                                        <label className="font-semibold text-foreground">Pembahasan Soal (Opsional)</label>
                                        <textarea
                                            rows={3}
                                            value={editingRow.pembahasan}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                                setEditingRow({ ...editingRow, pembahasan: e.target.value })
                                            }
                                            placeholder="Penjelasan langkah penyelesaian soal..."
                                            className="w-full min-h-[70px] rounded-xl border border-input bg-background p-3 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                    </div>
                                </div>

                                {/* RIGHT PANEL (5/12 width): LIVE STUDENT POV SIMULATOR */}
                                <div className="lg:col-span-5 space-y-4 border-l border-border pl-0 lg:pl-6">
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                                        <span className="flex items-center gap-1.5">
                                            <Eye className="h-4 w-4" /> Live POV Siswa (Real-Time CBT)
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSimulatorShowSolution(!simulatorShowSolution)}
                                            className="h-6 text-[10px] px-2 rounded-lg hover:bg-emerald-500/20"
                                        >
                                            <Lightbulb className="h-3 w-3 mr-1" />
                                            {simulatorShowSolution ? "Sembunyikan Kunci" : "Tampilkan Kunci"}
                                        </Button>
                                    </div>

                                    {/* Simulated CBT Screen Frame */}
                                    <div className="flex justify-center bg-slate-900/5 dark:bg-slate-950 p-4 rounded-2xl border border-border">
                                        <div
                                            className={`bg-background border border-border rounded-2xl p-5 shadow-lg transition-all space-y-4 ${simulatorDevice === "mobile" ? "max-w-xs w-full" : "w-full"
                                                }`}
                                        >
                                            {/* Exam Top Bar */}
                                            <div className="flex items-center justify-between pb-2.5 border-b border-border text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5">
                                                        Soal #{editingRow.no}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {editingRow.mapel || "Mata Pelajaran"}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                                                    <Clock className="h-3 w-3" /> {editingRow.skor || 5} Poin
                                                </div>
                                            </div>

                                            {/* Question Badges */}
                                            <div className="flex flex-wrap gap-1.5">
                                                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                                    {editingRow.tipeSoal}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {editingRow.kesulitan}
                                                </Badge>
                                                {editingRow.bab && (
                                                    <Badge variant="outline" className="text-[10px] truncate max-w-[150px]">
                                                        {editingRow.bab}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Live Question Text */}
                                            <div className="text-xs font-medium leading-relaxed text-foreground whitespace-pre-wrap min-h-[50px] p-3 rounded-xl bg-muted/20 border border-border/50">
                                                {editingRow.block1Isi || <span className="italic text-muted-foreground">Tulis pertanyaan soal di form sebelah kiri...</span>}
                                            </div>

                                            {/* Live Options List */}
                                            <div className="space-y-2 pt-1">
                                                {editingRow.tipeSoal === "TRUE_FALSE" ? (
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] text-emerald-600 font-semibold block bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                                                            💡 Tipe Soal Benar / Salah (Matrix Tabel Pernyataan)
                                                        </span>
                                                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                                                            <table className="w-full text-left text-xs border-collapse">
                                                                <thead className="bg-muted/70 text-foreground font-bold border-b border-border">
                                                                    <tr>
                                                                        <th className="p-2 w-10 text-center text-[10px]">Opsi</th>
                                                                        <th className="p-2 text-[10px]">Pernyataan</th>
                                                                        <th className="p-2 w-20 text-center text-[10px]">Benar</th>
                                                                        <th className="p-2 w-20 text-center text-[10px]">Salah</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border/60">
                                                                    {getOptionsList(editingRow).map((opt) => {
                                                                        const keyMap = parseTrueFalseKeyMap(editingRow.kunciJawaban);
                                                                        const isCorrectBenar = keyMap[opt.label] === "BENAR";
                                                                        const isCorrectSalah = keyMap[opt.label] === "SALAH";
                                                                        const currentSel = simulatorMatrixAnswers[opt.label];

                                                                        return (
                                                                            <tr key={opt.label} className="hover:bg-muted/30 transition-colors">
                                                                                <td className="p-2 text-center align-middle font-bold">
                                                                                    <span className="h-5 w-5 rounded-md bg-primary/10 text-primary inline-flex items-center justify-center font-mono text-[10px]">
                                                                                        {opt.label}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="p-2 align-middle text-foreground leading-snug text-[11px]">
                                                                                    {opt.text}
                                                                                </td>
                                                                                <td className="p-1 text-center align-middle">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setSimulatorMatrixAnswers(prev => ({ ...prev, [opt.label]: "BENAR" }))}
                                                                                        className={`w-full py-1 px-1.5 rounded-lg font-bold text-[10px] border transition-all flex items-center justify-center gap-1 cursor-pointer ${simulatorShowSolution && isCorrectBenar
                                                                                            ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30 font-bold"
                                                                                            : currentSel === "BENAR"
                                                                                                ? "bg-primary text-primary-foreground border-primary"
                                                                                                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                                                                                            }`}
                                                                                    >
                                                                                        <Check className="h-2.5 w-2.5" /> Benar
                                                                                    </button>
                                                                                </td>
                                                                                <td className="p-1 text-center align-middle">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setSimulatorMatrixAnswers(prev => ({ ...prev, [opt.label]: "SALAH" }))}
                                                                                        className={`w-full py-1 px-1.5 rounded-lg font-bold text-[10px] border transition-all flex items-center justify-center gap-1 cursor-pointer ${simulatorShowSolution && isCorrectSalah
                                                                                            ? "bg-rose-600 text-white border-rose-600 ring-2 ring-rose-500/30 font-bold"
                                                                                            : currentSel === "SALAH"
                                                                                                ? "bg-primary text-primary-foreground border-primary"
                                                                                                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                                                                                            }`}
                                                                                    >
                                                                                        <X className="h-2.5 w-2.5" /> Salah
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ) : getOptionsList(editingRow).length === 0 ? (
                                                    <div className="p-3 rounded-xl border border-dashed text-center text-[11px] text-muted-foreground">
                                                        Belum ada opsi jawaban diisi
                                                    </div>
                                                ) : (
                                                    getOptionsList(editingRow).map((opt) => {
                                                        const isSelected = simulatorSelectedOpt === opt.label;
                                                        const isCorrectKey = editingRow.kunciJawaban.includes(opt.label);

                                                        return (
                                                            <button
                                                                key={opt.label}
                                                                type="button"
                                                                onClick={() => setSimulatorSelectedOpt(opt.label)}
                                                                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 text-xs ${simulatorShowSolution && isCorrectKey
                                                                    ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10 font-medium"
                                                                    : isSelected
                                                                        ? "border-primary ring-2 ring-primary/20 bg-primary/5 font-medium"
                                                                        : "border-border hover:bg-muted/40"
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${simulatorShowSolution && isCorrectKey
                                                                        ? "bg-emerald-500 text-white"
                                                                        : isSelected
                                                                            ? "bg-primary text-white"
                                                                            : "bg-muted text-muted-foreground"
                                                                        }`}
                                                                >
                                                                    {opt.label}
                                                                </span>
                                                                <span className="mt-0.5 text-foreground leading-snug flex-1 text-[11px]">
                                                                    {opt.text}
                                                                </span>
                                                                {simulatorShowSolution && isCorrectKey && (
                                                                    <Badge className="bg-emerald-500 text-white text-[9px] shrink-0 gap-1 px-1.5 py-0">
                                                                        <CheckCircle2 className="h-2.5 w-2.5" /> Kunci
                                                                    </Badge>
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Live Explanation Box */}
                                            {simulatorShowSolution && (
                                                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1.5">
                                                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                                                        <Lightbulb className="h-3.5 w-3.5" />
                                                        <span>Pembahasan Kunci</span>
                                                    </div>
                                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                        {editingRow.pembahasan || "Belum ada pembahasan yang dicantumkan."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-2 border-t border-border pt-3">
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl text-xs">
                                    Batal
                                </Button>
                                <Button onClick={handleSaveRow} className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5">
                                    <Check className="h-4 w-4" /> Simpan Perubahan Soal
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* STANDALONE STUDENT POV PREVIEW MODAL */}
                {previewPovRow && (
                    <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                        <DialogContent className="sm:max-w-[90vw] lg:max-w-[1000px] w-[90vw] max-h-[90vh] overflow-y-auto p-6 rounded-2xl border-border bg-card shadow-2xl">
                            <DialogHeader className="pb-3 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                            <Eye className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-lg font-bold font-heading">
                                                Pratinjau POV Siswa - Soal #{previewPovRow.no}
                                            </DialogTitle>
                                            <p className="text-xs text-muted-foreground">
                                                Simulasi penuh layar ujian CBT siswa untuk mata pelajaran {previewPovRow.mapel}.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border border-border">
                                        <button
                                            type="button"
                                            onClick={() => setSimulatorDevice("desktop")}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${simulatorDevice === "desktop"
                                                ? "bg-background text-foreground shadow-2xs"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            <Monitor className="h-3.5 w-3.5" /> Desktop
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSimulatorDevice("mobile")}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${simulatorDevice === "mobile"
                                                ? "bg-background text-foreground shadow-2xs"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            <Smartphone className="h-3.5 w-3.5" /> Mobile
                                        </button>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                                <div className="flex justify-center bg-slate-900/5 dark:bg-slate-950 p-6 rounded-2xl border border-border">
                                    <div
                                        className={`bg-background border border-border rounded-2xl p-6 shadow-lg transition-all space-y-5 ${simulatorDevice === "mobile" ? "max-w-xs w-full" : "max-w-3xl w-full"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5">
                                                    Soal #{previewPovRow.no}
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    {previewPovRow.mapel}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                                <Clock className="h-3.5 w-3.5" /> Skor: {previewPovRow.skor || 5} Poin
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                                {previewPovRow.tipeSoal}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px]">
                                                Kesulitan: {previewPovRow.kesulitan}
                                            </Badge>
                                            {previewPovRow.bab && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    Bab: {previewPovRow.bab}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap p-4 rounded-xl bg-muted/20 border border-border/60">
                                            {previewPovRow.block1Isi}
                                        </div>

                                        <div className="space-y-2.5 pt-2">
                                            {previewPovRow.tipeSoal === "TRUE_FALSE" ? (
                                                <div className="space-y-2">
                                                    <span className="text-xs text-emerald-600 font-semibold block bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                                                        💡 Tipe Soal Benar / Salah (Matrix Tabel Pernyataan)
                                                    </span>
                                                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead className="bg-muted/70 text-foreground font-bold border-b border-border">
                                                                <tr>
                                                                    <th className="p-3 w-12 text-center">Opsi</th>
                                                                    <th className="p-3">Pernyataan</th>
                                                                    <th className="p-3 w-28 text-center">Benar</th>
                                                                    <th className="p-3 w-28 text-center">Salah</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border/60">
                                                                {getOptionsList(previewPovRow).map((opt) => {
                                                                    const keyMap = parseTrueFalseKeyMap(previewPovRow.kunciJawaban);
                                                                    const isCorrectBenar = keyMap[opt.label] === "BENAR";
                                                                    const isCorrectSalah = keyMap[opt.label] === "SALAH";

                                                                    return (
                                                                        <tr key={opt.label} className="hover:bg-muted/30 transition-colors">
                                                                            <td className="p-3 text-center align-middle font-bold">
                                                                                <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center font-mono text-xs">
                                                                                    {opt.label}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-3 align-middle text-foreground leading-relaxed text-xs">
                                                                                {opt.text}
                                                                            </td>
                                                                            <td className="p-2 text-center align-middle">
                                                                                <div
                                                                                    className={`py-2 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1 ${isCorrectBenar
                                                                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                                                        : "bg-muted/30 text-muted-foreground border-border"
                                                                                        }`}
                                                                                >
                                                                                    <Check className="h-3 w-3" /> Benar
                                                                                    {isCorrectBenar && (
                                                                                        <Badge className="bg-white/20 text-white text-[9px] ml-1 px-1 py-0">Kunci</Badge>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-2 text-center align-middle">
                                                                                <div
                                                                                    className={`py-2 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-1 ${isCorrectSalah
                                                                                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                                                                        : "bg-muted/30 text-muted-foreground border-border"
                                                                                        }`}
                                                                                >
                                                                                    <X className="h-3 w-3" /> Salah
                                                                                    {isCorrectSalah && (
                                                                                        <Badge className="bg-white/20 text-white text-[9px] ml-1 px-1 py-0">Kunci</Badge>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ) : (
                                                getOptionsList(previewPovRow).map((opt) => {
                                                    const isCorrectKey = previewPovRow.kunciJawaban.includes(opt.label);
                                                    return (
                                                        <div
                                                            key={opt.label}
                                                            className={`w-full p-3.5 rounded-xl border flex items-start gap-3 text-xs ${isCorrectKey
                                                                ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10 font-medium"
                                                                : "border-border bg-card"
                                                                }`}
                                                        >
                                                            <span
                                                                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${isCorrectKey ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                                                                    }`}
                                                            >
                                                                {opt.label}
                                                            </span>
                                                            <span className="mt-0.5 text-foreground leading-snug flex-1">
                                                                {opt.text}
                                                            </span>
                                                            {isCorrectKey && (
                                                                <Badge className="bg-emerald-500 text-white text-[10px] shrink-0 gap-1">
                                                                    <CheckCircle2 className="h-3 w-3" /> Kunci Jawaban
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {previewPovRow.pembahasan && (
                                            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                                                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                                                    <Lightbulb className="h-4 w-4" />
                                                    <span>Pembahasan &amp; Solusi Kunci</span>
                                                </div>
                                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                    {previewPovRow.pembahasan}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)} className="rounded-xl text-xs">
                                    Tutup
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsPreviewDialogOpen(false);
                                        setEditingRow({ ...previewPovRow });
                                        setIsEditDialogOpen(true);
                                    }}
                                    className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5"
                                >
                                    <Pencil className="h-3.5 w-3.5" /> Edit Soal Ini
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AppShell>
    );
}