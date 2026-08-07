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
    AlertTriangle,
    Pencil,
    Plus,
    Search,
    Eye,
    Filter,
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

    return (
        <AppShell>
            <div className="space-y-6 max-w-6xl mx-auto pb-12">
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
                                Unggah file .xlsx, pratinjau &amp; edit data soal sebelum disimpan ke database.
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
                                        <strong>Pratinjau &amp; Edit</strong>: Lihat semua baris soal, perbaiki typo, ubah opsi jawaban atau tambahkan soal baru di browser.
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
                                            <th className="p-3 w-24 text-right">Aksi</th>
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
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    onClick={() => {
                                                                        setEditingRow({ ...row });
                                                                        setIsEditDialogOpen(true);
                                                                    }}
                                                                    className="rounded-lg hover:bg-primary/10 hover:text-primary"
                                                                    title="Edit Detail Soal"
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

                {/* EDIT ROW DIALOG */}
                {editingRow && (
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                    <Pencil className="h-4 w-4 text-primary" />
                                    Edit Detail Soal #{editingRow.no}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 py-2 text-xs">
                                {/* Row 1: Mapel & Bab */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-foreground">Mata Pelajaran</label>
                                        <Input
                                            value={editingRow.mapel}
                                            onChange={(e) => setEditingRow({ ...editingRow, mapel: e.target.value })}
                                            placeholder="Contoh: Matematika SD"
                                            className="rounded-xl text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-foreground">Materi / Bab</label>
                                        <Input
                                            value={editingRow.bab}
                                            onChange={(e) => setEditingRow({ ...editingRow, bab: e.target.value })}
                                            placeholder="Contoh: Pecahan & Desimal"
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
                                            onChange={(e) => setEditingRow({ ...editingRow, tipeSoal: e.target.value })}
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
                                            onChange={(e) => setEditingRow({ ...editingRow, kunciJawaban: e.target.value.toUpperCase() })}
                                            placeholder="A / B / C / D / A,B"
                                            className="rounded-xl font-mono font-bold text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-foreground">Skor Soal</label>
                                        <Input
                                            value={editingRow.skor}
                                            onChange={(e) => setEditingRow({ ...editingRow, skor: e.target.value })}
                                            placeholder="5"
                                            className="rounded-xl text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Question Text */}
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Pertanyaan / Teks Soal (Blok 1 Isi)</label>
                                    <textarea
                                        rows={4}
                                        value={editingRow.block1Isi}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingRow({ ...editingRow, block1Isi: e.target.value })}
                                        placeholder="Tulis pertanyaan soal..."
                                        className="w-full min-h-[80px] rounded-xl border border-input bg-background p-3 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                </div>

                                {/* Options Grid */}
                                <div className="space-y-2 border-t border-border pt-3">
                                    <label className="font-semibold text-foreground block">Pilihan Jawaban (Opsi A - D)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-muted-foreground">Opsi A</span>
                                            <Input
                                                value={editingRow.optionA}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingRow({ ...editingRow, optionA: e.target.value })}
                                                className="rounded-xl text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-muted-foreground">Opsi B</span>
                                            <Input
                                                value={editingRow.optionB}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingRow({ ...editingRow, optionB: e.target.value })}
                                                className="rounded-xl text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-muted-foreground">Opsi C</span>
                                            <Input
                                                value={editingRow.optionC}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingRow({ ...editingRow, optionC: e.target.value })}
                                                className="rounded-xl text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-muted-foreground">Opsi D</span>
                                            <Input
                                                value={editingRow.optionD}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingRow({ ...editingRow, optionD: e.target.value })}
                                                className="rounded-xl text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Explanation */}
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-foreground">Pembahasan Soal (Opsional)</label>
                                    <textarea
                                        rows={2}
                                        value={editingRow.pembahasan}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingRow({ ...editingRow, pembahasan: e.target.value })}
                                        placeholder="Penjelasan langkah penyelesaian soal..."
                                        className="w-full min-h-[60px] rounded-xl border border-input bg-background p-3 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl text-xs">
                                    Batal
                                </Button>
                                <Button onClick={handleSaveRow} className="rounded-xl text-xs font-bold bg-primary text-primary-foreground">
                                    Simpan Perubahan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AppShell>
    );
}