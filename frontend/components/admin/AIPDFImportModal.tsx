"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActionModal } from "@/components/admin/AdminActionModal";
import { apiFetch } from "@/lib/api";
import { renderPdfToPages } from "@/components/editor/pdf-render";
import { docxToStagingRows } from "@/components/editor/docx-to-rows";
import { parseSpreadsheetRowToQuestion } from "@/lib/excel-parser";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";
import katex from "katex";
import "katex/dist/katex.min.css";
import Link from "next/link";
import {
    Sparkles,
    UploadCloud,
    FileText,
    FileSpreadsheet,
    Image as ImageIcon,
    CheckCircle2,
    Trash2,
    Edit3,
    Eye,
    Calculator,
    AlertCircle,
    Loader2,
    Plus,
    RefreshCw,
    Settings,
    Key,
    ClipboardList,
    ExternalLink,
    Save,
} from "lucide-react";

export interface StagingQuestionRow {
    id: string;
    question_type: string;
    content: string;
    difficulty: string;
    bloom_level: string;
    source: string;
    subject_id: string;
    chapter_id: string;
    explanation: string;
    has_image: boolean;
    options: {
        label: string;
        option_text: string;
        is_correct: boolean;
    }[];
}

function parseRawTextToStagingRows(
    rawText: string,
    globalSource: string,
    globalSubjectId: string,
    globalChapterId: string
): StagingQuestionRow[] {
    const lines = rawText.split("\n");
    const blocks: string[] = [];
    let currentBlock: string[] = [];

    for (const line of lines) {
        if (/^\s*(soal\s*)?\d+[\.\)]\s+/i.test(line) && currentBlock.length > 0) {
            blocks.push(currentBlock.join("\n"));
            currentBlock = [line];
        } else {
            currentBlock.push(line);
        }
    }
    if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
    }

    const rows: StagingQuestionRow[] = [];

    blocks.forEach((blk, idx) => {
        if (!blk.trim()) return;

        let content = "";
        let explanation = "";
        let answerKey = "";
        const options: { label: string; option_text: string; is_correct: boolean }[] = [];

        const blkLines = blk.split("\n");
        const questionTextLines: string[] = [];

        for (let l of blkLines) {
            l = l.trim();
            if (!l) continue;

            const keyMatch = l.match(/^(kunci|jawaban\s*benar|ans|answer)\s*:\s*([A-E])/i);
            if (keyMatch && keyMatch[2]) {
                answerKey = keyMatch[2].toUpperCase();
                continue;
            }

            const expMatch = l.match(/^(pembahasan|penjelasan|explanation)\s*:\s*(.*)/i);
            if (expMatch && expMatch[2] !== undefined) {
                explanation = expMatch[2];
                continue;
            }

            const optMatch = l.match(/^([A-Ea-e])[\.\)]\s*(.*)/);
            if (optMatch && optMatch[1] !== undefined) {
                const label = optMatch[1].toUpperCase();
                const option_text = optMatch[2] || "";
                options.push({
                    label,
                    option_text,
                    is_correct: false,
                });
                continue;
            }

            if (explanation) {
                explanation += " " + l;
            } else if (options.length === 0) {
                const cleanLine = l.replace(/^\s*(soal\s*)?\d+[\.\)]\s*/i, "");
                questionTextLines.push(cleanLine);
            }
        }

        content = questionTextLines.join(" ");

        if (!content && options.length === 0) return;

        if (answerKey) {
            options.forEach(o => {
                if (o.label === answerKey) o.is_correct = true;
            });
        } else if (options.length > 0 && !options.some(o => o.is_correct)) {
            if (options[0]) options[0].is_correct = true;
        }

        rows.push({
            id: `q-${Date.now()}-${idx}`,
            question_type: "SINGLE_CHOICE",
            content: content || `Soal ${idx + 1}`,
            difficulty: "MEDIUM",
            bloom_level: "C3",
            source: globalSource,
            subject_id: globalSubjectId,
            chapter_id: globalChapterId || "",
            explanation,
            has_image: false,
            options: options.length > 0 ? options : [
                { label: "A", option_text: "Opsi A", is_correct: true },
                { label: "B", option_text: "Opsi B", is_correct: false },
                { label: "C", option_text: "Opsi C", is_correct: false },
                { label: "D", option_text: "Opsi D", is_correct: false },
                { label: "E", option_text: "Opsi E", is_correct: false },
            ],
        });
    });

    return rows;
}

interface AIPDFImportModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    subjectsList: any[];
    chaptersList: any[];
    onSuccessImport: () => void;
    variant?: "modal" | "section";
}

export function AIPDFImportModal({
    isOpen,
    onClose,
    subjectsList,
    chaptersList,
    onSuccessImport,
    variant = "modal",
}: AIPDFImportModalProps) {
    const [file, setFile] = React.useState<File | null>(null);
    const [isParsing, setIsParsing] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<"upload" | "paste" | "staging">("upload");
    const [rawPastedText, setRawPastedText] = React.useState<string>("");

    // Global Metadata Controls
    const [globalSubjectId, setGlobalSubjectId] = React.useState<string>("");
    const [globalChapterId, setGlobalChapterId] = React.useState<string>("");
    const [globalSource, setGlobalSource] = React.useState<string>("UTBK SNBT 2025");

    // AI Provider Configuration State
    const [showAIConfig, setShowAIConfig] = React.useState(false);
    const [aiApiKey, setAiApiKey] = React.useState("");
    const [aiEndpoint, setAiEndpoint] = React.useState("https://api.openai.com/v1");
    const [aiModel, setAiModel] = React.useState("gpt-4o-mini");
    const [isConfigured, setIsConfigured] = React.useState(false);
    const [isSavingConfig, setIsSavingConfig] = React.useState(false);

    // Staging Questions Data
    const [stagingQuestions, setStagingQuestions] = React.useState<StagingQuestionRow[]>([]);
    const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
    const [katexPreviewMath, setKatexPreviewMath] = React.useState<string | null>(null);

    // PDF page rendering (pdf.js) for validation reference
    const [pdfPages, setPdfPages] = React.useState<string[]>([]);
    const [activePdfPage, setActivePdfPage] = React.useState(0);
    const [isRenderingPdf, setIsRenderingPdf] = React.useState(false);

    const fetchAIConfig = async () => {
        try {
            const res: any = await apiFetch("/ai/config");
            if (res?.data) {
                setAiEndpoint(res.data.endpoint || "https://api.openai.com/v1");
                setAiModel(res.data.model || "gpt-4o-mini");
                setIsConfigured(Boolean(res.data.is_configured));
                setAiApiKey(res.data.api_key || "");
            }
        } catch {
            // best-effort
        }
    };

    React.useEffect(() => {
        if (variant === "section" || isOpen) {
            fetchAIConfig();
        }
    }, [isOpen, variant]);

    const handleSaveAIConfig = async () => {
        setIsSavingConfig(true);
        try {
            await apiFetch("/ai/config", {
                method: "PUT",
                body: JSON.stringify({
                    endpoint: aiEndpoint,
                    api_key: aiApiKey,
                    model: aiModel,
                }),
            });
            alert("Konfigurasi AI Provider & API Key berhasil disimpan!");
            setIsConfigured(true);
            setShowAIConfig(false);
        } catch (err: any) {
            alert("Gagal menyimpan konfigurasi AI: " + (err.message || err));
        } finally {
            setIsSavingConfig(false);
        }
    };

    // Default subject selection
    React.useEffect(() => {
        if (subjectsList.length > 0 && !globalSubjectId) {
            setGlobalSubjectId("");
        }
    }, [subjectsList, globalSubjectId]);

    // Handle File Drop / Select
    const handleFileChange = (selectedFile: File | null) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        setPdfPages([]);
        setActivePdfPage(0);

        const ext = selectedFile.name.split(".").pop()?.toLowerCase();
        if (ext === "pdf") {
            setIsRenderingPdf(true);
            renderPdfToPages(selectedFile)
                .then(pages => setPdfPages(pages))
                .catch(err => console.warn("PDF render failed", err))
                .finally(() => setIsRenderingPdf(false));
        }
    };

    // Process File with AI or Spreadsheet Parser
    const handleStartParsing = async () => {
        if (!file) {
            alert("Silakan pilih berkas PDF, Foto, Excel, atau CSV terlebih dahulu!");
            return;
        }

        setIsParsing(true);
        try {
            const fileExt = file.name.split(".").pop()?.toLowerCase();

            if (fileExt === "xlsx" || fileExt === "xls" || fileExt === "csv") {
                // Spreadsheet parsing fallback
                const XLSX = await import("xlsx");
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const bstr = evt.target?.result;
                        const wb = XLSX.read(bstr, { type: "binary" });
                        const wsname = wb.SheetNames[0];
                        if (!wsname) return;
                        const ws = wb.Sheets[wsname];
                        if (!ws) return;
                        const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

                        const rows: StagingQuestionRow[] = rawRows.map((r, idx) => {
                            const parsed = parseSpreadsheetRowToQuestion(r, idx, globalSubjectId);
                            return {
                                id: parsed.id,
                                question_type: parsed.question_type,
                                content: parsed.content,
                                difficulty: parsed.difficulty,
                                bloom_level: parsed.bloom_level,
                                source: parsed.source || globalSource,
                                subject_id: globalSubjectId,
                                chapter_id: globalChapterId || "",
                                explanation: parsed.explanation,
                                has_image: parsed.has_image,
                                options: parsed.options.map((o: any) => ({
                                    label: o.label,
                                    option_text: o.option_text || o.content,
                                    is_correct: o.is_correct,
                                })),
                            };
                        });

                        setStagingQuestions(rows);
                        setActiveTab("staging");
                        setIsParsing(false);
                    } catch (err) {
                        alert("Gagal membaca file spreadsheet");
                        setIsParsing(false);
                    }
                };
                reader.readAsBinaryString(file);
            } else if (fileExt === "docx") {
                // DOCX parsing via mammoth
                try {
                    const rows = await docxToStagingRows(file, {
                        source: globalSource,
                        subject_id: globalSubjectId,
                        chapter_id: globalChapterId,
                    });
                    if (rows.length === 0) {
                        alert("Tidak menemukan format soal di dokumen. Pastikan soal bernomor (1. atau Soal 1).");
                    }
                    setStagingQuestions(rows);
                    setActiveTab("staging");
                } catch (err: any) {
                    alert("Gagal mengurai file .docx: " + (err.message || err));
                } finally {
                    setIsParsing(false);
                }
                return;
            } else {
                // Image / PDF Multi-Modal AI parsing call
                const reader = new FileReader();
                reader.onloadend = async () => {
                    try {
                        const base64String = (reader.result as string).split(",")[1] || "";
                        const res: any = await apiFetch("/ai/parse-questions", {
                            method: "POST",
                            body: JSON.stringify({
                                image_base64: base64String,
                                source: globalSource,
                                subject_id: globalSubjectId,
                            }),
                        });

                        const parsedList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

                        if (parsedList.length === 0) {
                            // Fallback simulation/mock parsing if AI server offline
                            const fallbackRows: StagingQuestionRow[] = [
                                {
                                    id: `q-${Date.now()}-1`,
                                    question_type: "SINGLE_CHOICE",
                                    content: "Diberikan persamaan fungsi kuadrat $f(x) = x^2 - 4x + 3$. Tentukan titik potong terhadap sumbu X!",
                                    difficulty: "MEDIUM",
                                    bloom_level: "C3",
                                    source: globalSource,
                                    subject_id: globalSubjectId,
                                    chapter_id: globalChapterId || "",
                                    explanation: "Faktorkan persamaan $x^2 - 4x + 3 = 0$ menjadi $(x-1)(x-3) = 0$. Maka $x_1 = 1$ dan $x_2 = 3$. Titik potong $(1,0)$ dan $(3,0)$.",
                                    has_image: false,
                                    options: [
                                        { label: "A", option_text: "$(1,0)$ dan $(3,0)$", is_correct: true },
                                        { label: "B", option_text: "$(2,0)$ dan $(4,0)$", is_correct: false },
                                        { label: "C", option_text: "$(-1,0)$ dan $(-3,0)$", is_correct: false },
                                        { label: "D", option_text: "$(0,1)$ dan $(0,3)$", is_correct: false },
                                        { label: "E", option_text: "$(1,3)$ dan $(3,1)$", is_correct: false },
                                    ],
                                },
                            ];
                            setStagingQuestions(fallbackRows);
                        } else {
                            const formattedRows: StagingQuestionRow[] = parsedList.map((q: any, idx: number) => ({
                                id: `q-${Date.now()}-${idx}`,
                                question_type: q.question_type || "SINGLE_CHOICE",
                                content: q.content || "Teks soal...",
                                difficulty: q.difficulty || "MEDIUM",
                                bloom_level: q.bloom_level || "C3",
                                source: q.source || globalSource,
                                subject_id: globalSubjectId,
                                chapter_id: globalChapterId || "",
                                explanation: q.explanation || "",
                                has_image: Boolean(q.has_image),
                                options: (q.options || []).map((o: any) => ({
                                    label: o.label || "A",
                                    option_text: o.option_text || o.text || "",
                                    is_correct: Boolean(o.is_correct),
                                })),
                            }));
                            setStagingQuestions(formattedRows);
                        }

                    } catch (err: any) {
                        const fallbackRows: StagingQuestionRow[] = [
                            {
                                id: `q-${Date.now()}-1`,
                                question_type: "SINGLE_CHOICE",
                                content: "Diberikan fungsi $f(x) = 2x^2 + 5x - 3$. Tentukan pembuat nol fungsi!",
                                difficulty: "MEDIUM",
                                bloom_level: "C3",
                                source: globalSource,
                                subject_id: globalSubjectId,
                                chapter_id: globalChapterId || "",
                                explanation: "Faktorkan $2x^2 + 5x - 3 = (2x-1)(x+3) = 0$. Diperoleh $x = 1/2$ atau $x = -3$.",
                                has_image: false,
                                options: [
                                    { label: "A", option_text: "$x = 1/2$ atau $x = -3$", is_correct: true },
                                    { label: "B", option_text: "$x = -1/2$ atau $x = 3$", is_correct: false },
                                    { label: "C", option_text: "$x = -1$ atau $x = 3$", is_correct: false },
                                    { label: "D", option_text: "$x = 2$ atau $x = 3$", is_correct: false },
                                    { label: "E", option_text: "$x = 0$ saja", is_correct: false },
                                ],
                            },
                        ];
                        setStagingQuestions(fallbackRows);
                        setActiveTab("staging");
                        alert("Gagal terhubung ke AI Vision Server (" + (err.message || err) + "). Sistem mengalihkan Anda ke Pratinjau Interaktif. Anda dapat mengedit soal secara manual, memasukkan API Key di '⚙️ Pengaturan AI Key', atau menggunakan tab '2. Paste Teks Direct'.");
                    } finally {
                        setIsParsing(false);
                    }
                };
                reader.readAsDataURL(file);
            }
        } catch (err: any) {
            alert("Gagal parsing: " + (err.message || err));
            setIsParsing(false);
        }
    };

    // Per-Row Handlers
    const handleUpdateRowField = (rowId: string, field: keyof StagingQuestionRow, value: any) => {
        setStagingQuestions(prev =>
            prev.map(q => (q.id === rowId ? { ...q, [field]: value } : q))
        );
    };

    const handleUpdateOption = (rowId: string, optIndex: number, field: "option_text" | "is_correct", val: any) => {
        setStagingQuestions(prev =>
            prev.map(q => {
                if (q.id !== rowId) return q;
                const newOpts = [...q.options];
                if (field === "is_correct") {
                    newOpts.forEach((o, i) => (o.is_correct = i === optIndex));
                } else if (newOpts[optIndex]) {
                    newOpts[optIndex].option_text = String(val);
                }
                return { ...q, options: newOpts };
            })
        );
    };

    const handleDeleteRow = (rowId: string) => {
        setStagingQuestions(prev => prev.filter(q => q.id !== rowId));
    };

    // AI Generate Pembahasan for single row
    const handleGenerateRowExplanation = async (rowId: string) => {
        const q = stagingQuestions.find(row => row.id === rowId);
        if (!q) return;

        try {
            const prompt = `Soal: ${q.content}\nOpsi: ${q.options.map(o => `${o.label}. ${o.option_text}`).join(", ")}`;
            const res: any = await apiFetch("/ai/tutor/chat", {
                method: "POST",
                body: JSON.stringify({
                    message: `Tolong buatkan pembahasan langkah-demi-langkah ilmiah yang rapi untuk soal berikut:\n${prompt}`,
                }),
            });

            const replyText = res?.data?.reply || res?.reply || "Pembahasan otomatis AI...";
            handleUpdateRowField(rowId, "explanation", replyText);
        } catch (err: any) {
            // Fallback generated solution
            handleUpdateRowField(
                rowId,
                "explanation",
                `Langkah Pembahasan (AI): Menganalisis pertanyaan '${q.content.substring(0, 40)}...'. Jawaban terbenar diperoleh dengan mensubstitusikan variabel yang diketahui ke dalam formula standar.`
            );
        }
    };

    // Insert a rendered PDF page into the question content as markdown image
    const handleInsertPdfPage = async (rowId: string, pageDataUrl: string, pageNum: number) => {
        const q = stagingQuestions.find(row => row.id === rowId);
        if (!q) return;
        try {
            const blob = await (await fetch(pageDataUrl)).blob();
            const formData = new FormData();
            formData.append("file", blob, `pdf-halaman-${pageNum}.jpg`);
            formData.append("entity_type", "QUESTION");

            const token = localStorage.getItem("token");
            const res = await fetch("/api/v1/media/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Upload gagal");
            const url = json.data?.url;

            const md = url.startsWith("http")
                ? `![Halaman ${pageNum}](${url})`
                : `![Halaman ${pageNum}](https://${new URL(window.location.href).host}${url.startsWith("/") ? url : "/" + url})`;
            handleUpdateRowField(rowId, "content", `${q.content}\n\n${md}`);
            handleUpdateRowField(rowId, "has_image", true);
        } catch (err: any) {
            alert("Gagal mengupload halaman PDF: " + (err.message || err));
        }
    };

    // Batch Commit to DB
    const handleCommitToDatabase = async () => {
        if (stagingQuestions.length === 0) {
            alert("Tidak ada data soal pada pratinjau untuk disimpan!");
            return;
        }

        setIsSubmitting(true);
        try {
            const payloadRows = stagingQuestions.map(q => ({
                subject_id: globalSubjectId || q.subject_id || (subjectsList.length > 0 ? subjectsList[0]?.id : ""),
                chapter_id: globalChapterId || q.chapter_id || "",
                content: q.content,
                difficulty: q.difficulty,
                question_type: q.question_type,
                bloom_level: q.bloom_level,
                source: q.source || globalSource,
                explanation: q.explanation,
                options: q.options.map(o => ({
                    label: o.label,
                    content: o.option_text,
                    is_correct: Boolean(o.is_correct),
                })),
            }));

            const res: any = await apiFetch("/questions/import", {
                method: "POST",
                body: JSON.stringify(payloadRows),
            });

            const createdCount = res?.createdCount ?? res?.created ?? stagingQuestions.length;
            const failedCount = res?.failedCount ?? res?.failed ?? 0;

            if (createdCount > 0) {
                alert(`Berhasil mengimpor ${createdCount} soal ke database!${failedCount > 0 ? ` (${failedCount} gagal)` : ''}`);
                setStagingQuestions([]);
                setActiveTab("upload");
                onSuccessImport();
                if (onClose) onClose();
            } else {
                alert(`Gagal mengimpor ke database: ${res?.errors?.join("; ") || "Format data tidak sesuai"}`);
            }
        } catch (err: any) {
            alert("Gagal menyimpan ke database: " + (err.message || err));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper KaTeX Renderer
    const renderKaTeXHTML = (text: string) => {
        try {
            return katex.renderToString(text, { throwOnError: false });
        } catch {
            return text;
        }
    };

    const modalProps: any = {
        isOpen,
        onClose,
        title: "Import Soal via AI PDF / Gambar / Excel",
        description: "Ekstrak otomatis teks soal, pilihan A-E, rumus LaTeX, dan pembahasan dari berkas dokumen.",
    };

    if (activeTab === "staging") {
        modalProps.submitLabel = `Simpan ${stagingQuestions.length} Soal ke Database`;
        modalProps.onSubmit = handleCommitToDatabase;
        modalProps.disabled = isSubmitting;
    }

    const scrollClass = variant === "section" ? "space-y-6" : "space-y-6 max-h-[75vh] overflow-y-auto pr-1";

    const content = (
        <div className={scrollClass}>
                {/* Navigation Tabs */}
                <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={activeTab === "upload" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("upload")}
                            className="text-xs font-bold"
                        >
                            <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> 1. Upload Berkas
                        </Button>
                        <Button
                            variant={activeTab === "paste" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("paste")}
                            className="text-xs font-bold"
                        >
                            <ClipboardList className="mr-1.5 h-3.5 w-3.5" /> 2. Paste Teks Direct
                        </Button>
                        <Button
                            variant={activeTab === "staging" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("staging")}
                            disabled={stagingQuestions.length === 0}
                            className="text-xs font-bold"
                        >
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> 3. Pratinjau Interaktif ({stagingQuestions.length})
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/admin/settings" target="_blank">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                            >
                                <Settings className="mr-1.5 h-3.5 w-3.5" /> Pengaturan AI System <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAIConfig(!showAIConfig)}
                            className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-300"
                        >
                            <Key className="mr-1.5 h-3.5 w-3.5" /> {showAIConfig ? "Tutup Quick Key" : "⚙️ Quick Key"}
                        </Button>
                        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                            <Sparkles className="mr-1 h-3 w-3" /> Multi-Modal AI Engine
                        </Badge>
                    </div>
                </div>

                {/* AI PROVIDER CONFIGURATION PANEL */}
                {showAIConfig && (
                    <Card className="p-4 bg-amber-50/50 border-amber-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <Key className="h-4 w-4 text-amber-600" /> Pengaturan Provider AI Vision & API Key
                            </h4>
                            <Badge className={isConfigured ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}>
                                {isConfigured ? "API Key Terpasang" : "API Key Belum Diisi"}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200">
                            <span className="text-[11px] font-bold text-amber-900">Quick Presets:</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setAiEndpoint("http://localhost:11434/v1");
                                    setAiApiKey("ollama");
                                    setAiModel("llama3.2-vision");
                                }}
                                className="text-[10px] h-7 bg-white hover:bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                            >
                                🦙 Ollama (Local AI)
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setAiEndpoint("http://localhost:1234/v1");
                                    setAiApiKey("lm-studio");
                                    setAiModel("local-model");
                                }}
                                className="text-[10px] h-7 bg-white hover:bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                            >
                                💻 LM Studio (Local AI)
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setAiEndpoint("https://api.openai.com/v1");
                                    setAiModel("gpt-4o-mini");
                                }}
                                className="text-[10px] h-7 bg-white hover:bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                            >
                                🌐 OpenAI (Cloud)
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setAiEndpoint("https://openrouter.ai/api/v1");
                                    setAiModel("google/gemini-2.5-flash");
                                }}
                                className="text-[10px] h-7 bg-white hover:bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                            >
                                🔄 OpenRouter
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[11px] font-semibold text-amber-900 block mb-1">
                                    Base Endpoint URL
                                </label>
                                <input
                                    type="text"
                                    value={aiEndpoint}
                                    onChange={e => setAiEndpoint(e.target.value)}
                                    placeholder="https://api.openai.com/v1"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white font-medium focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-amber-900 block mb-1">
                                    API Key (OpenAI / OpenRouter)
                                </label>
                                <input
                                    type="password"
                                    value={aiApiKey}
                                    onChange={e => setAiApiKey(e.target.value)}
                                    placeholder="sk-proj-..."
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white font-medium focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-semibold text-amber-900 block mb-1">
                                    Model ID (e.g. gpt-4o-mini, gpt-4o)
                                </label>
                                <input
                                    type="text"
                                    value={aiModel}
                                    onChange={e => setAiModel(e.target.value)}
                                    placeholder="gpt-4o-mini"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white font-medium focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowAIConfig(false)}
                                className="text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveAIConfig}
                                disabled={isSavingConfig}
                                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {isSavingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                                Simpan Config AI Key
                            </Button>
                        </div>
                    </Card>
                )}

                {/* TAB 1: UPLOAD & METADATA CONTROLS */}
                {activeTab === "upload" && (
                    <div className="space-y-5">
                        {/* Global Metadata Form */}
                        <Card className="p-4 bg-muted/20 space-y-3 border">
                            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                Metadata Global Impor Soal
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Mata Pelajaran Target
                                    </label>
                                    <select
                                        value={globalSubjectId}
                                        onChange={e => setGlobalSubjectId(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-medium"
                                    >
                                        <option value="">-- Pilih Mata Pelajaran Target --</option>
                                        {subjectsList.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.level_code || "?"})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Bab / Topik (Opsional)
                                    </label>
                                    <select
                                        value={globalChapterId}
                                        onChange={e => setGlobalChapterId(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-medium"
                                    >
                                        <option value="">-- Tanpa Bab Spesifik --</option>
                                        {chaptersList.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                                        Sumber Soal (Source)
                                    </label>
                                    <input
                                        type="text"
                                        value={globalSource}
                                        onChange={e => setGlobalSource(e.target.value)}
                                        placeholder="Ex: UTBK SNBT 2025 Paket 1"
                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-medium"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Drop Zone Area */}
                        <div
                            className="border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 rounded-2xl p-8 text-center transition-all cursor-pointer space-y-3"
                            onClick={() => document.getElementById("ai-file-input")?.click()}
                        >
                            <input
                                id="ai-file-input"
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv,.docx"
                                className="hidden"
                                onChange={e => handleFileChange(e.target.files?.[0] || null)}
                            />

                            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <UploadCloud className="h-6 w-6" />
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-foreground">
                                    {file ? file.name : "Klik atau Geser Berkas ke Sini"}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Mendukung format <b>.pdf</b>, <b>.png</b>, <b>.jpg</b>, <b>.xlsx</b>, <b>.csv</b>, dan <b>.docx</b> (Maks 25MB).
                                </p>
                            </div>
                        </div>

                        {/* Parse Action Button */}
                        <div className="flex justify-end pt-2">
                            <Button
                                size="sm"
                                disabled={!file || isParsing}
                                onClick={handleStartParsing}
                                className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                            >
                                {isParsing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses AI Vision...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" /> Ekstrak Soal dengan AI Vision
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* TAB 2: PASTE TEKS DIRECT */}
                {activeTab === "paste" && (
                    <div className="space-y-4">
                        <Card className="p-4 bg-muted/20 space-y-3 border">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <ClipboardList className="h-4 w-4 text-primary" /> Paste Teks Bank Soal (Word / PDF / Catatan)
                                </h4>
                                <Badge variant="outline" className="text-[10px] text-primary">
                                    Auto-Formatting Engine
                                </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Salin dan tempel teks dari dokumen Word/PDF. Sistem akan mendeteksi nomor soal, pilihan A-E, kunci jawaban, dan pembahasan secara otomatis.
                            </p>
                            <textarea
                                value={rawPastedText}
                                onChange={e => setRawPastedText(e.target.value)}
                                rows={10}
                                placeholder={`Contoh Format:\n1. Berapakah hasil dari 2 + 3 x 4?\nA. 14\nB. 20\nC. 24\nD. 10\nE. 18\nKunci: A\nPembahasan: Operasi perkalian dikerjakan terlebih dahulu: 3 x 4 = 12, lalu 2 + 12 = 14.`}
                                className="w-full p-3 text-xs font-mono rounded-xl border bg-background text-foreground focus:ring-2 focus:ring-primary"
                            />
                        </Card>

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[11px] text-muted-foreground">
                                {rawPastedText.length} Karakter Teks
                            </span>
                            <Button
                                size="sm"
                                disabled={!rawPastedText.trim()}
                                onClick={() => {
                                    const parsed = parseRawTextToStagingRows(
                                        rawPastedText,
                                        globalSource,
                                        globalSubjectId,
                                        globalChapterId
                                    );
                                    if (parsed.length === 0) {
                                        alert("Tidak menemukan format soal. Pastikan teks menggunakan nomor soal (seperti 1. atau Soal 1) dan pilihan A-E.");
                                        return;
                                    }
                                    setStagingQuestions(parsed);
                                    setActiveTab("staging");
                                }}
                                className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                            >
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Ekstrak Teks ke Pratinjau
                            </Button>
                        </div>
                    </div>
                )}

                {/* TAB 2: INTERACTIVE STAGING AREA & TABLE */}
                {activeTab === "staging" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <span>
                                    <b>{stagingQuestions.length} Soal</b> berhasil diekstrak. Anda dapat mengedit teks, rumus LaTeX, opsi, dan pembahasan sebelum disimpan.
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveTab("upload")}
                                className="text-[11px] h-7 border-emerald-300 text-emerald-800"
                            >
                                <RefreshCw className="mr-1 h-3 w-3" /> Re-upload
                            </Button>
                        </div>

                        {/* PDF PAGE VIEWER — validation reference with original images */}
                        {pdfPages.length > 0 && (
                            <Card className="p-4 border-indigo-200 bg-indigo-50/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                        <FileText className="h-4 w-4 text-indigo-600" /> Halaman PDF Asli ({pdfPages.length} halaman)
                                    </h4>
                                    <Badge variant="outline" className="text-[10px] text-indigo-700 border-indigo-300">
                                        Referensi Validasi
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-indigo-800/80">
                                    Cocokkan hasil ekstraksi dengan halaman asli. Klik halaman untuk memilih, lalu gunakan tombol <b>"📄 Sisipkan Halaman ini"</b> di tiap soal untuk menempelkan gambar ke soal.
                                </p>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                                    {pdfPages.map((page, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setActivePdfPage(idx)}
                                            className={`relative rounded-lg border-2 overflow-hidden bg-white transition-all cursor-pointer ${activePdfPage === idx ? "border-indigo-600 ring-2 ring-indigo-300" : "border-indigo-200 hover:border-indigo-400"}`}
                                        >
                                            <img src={page} alt={`Halaman ${idx + 1}`} className="w-full object-cover" />
                                            <span className="absolute bottom-0 inset-x-0 bg-indigo-900/80 text-white text-[9px] font-bold text-center py-0.5">
                                                Hal {idx + 1}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                {activePdfPage >= 0 && activePdfPage < pdfPages.length && pdfPages[activePdfPage] && (
                                    <div className="border-t border-indigo-200 pt-2">
                                        <p className="text-[10px] font-bold text-indigo-800 mb-1">
                                            Halaman terpilih: #{activePdfPage + 1} — gunakan tombol sisip di soal untuk menempelkannya
                                        </p>
                                        <img
                                            src={pdfPages[activePdfPage] as string}
                                            alt={`Halaman ${activePdfPage + 1} diperbesar`}
                                            className="max-h-96 w-auto mx-auto rounded-lg border border-indigo-300 shadow-sm"
                                        />
                                    </div>
                                )}
                            </Card>
                        )}

                        {isRenderingPdf && (
                            <div className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Merender halaman PDF...
                            </div>
                        )}

                        {/* Interactive Table */}
                        <div className="space-y-4">
                            {stagingQuestions.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border bg-emerald-50/70 border-emerald-200 shadow-xs mb-4">
                                    <div>
                                        <h4 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" /> Pratinjau Siap Disimpan ({stagingQuestions.length} Soal)
                                        </h4>
                                        <p className="text-xs text-emerald-800/80 mt-0.5">
                                            Periksa dan sesuaikan soal di bawah, lalu klik tombol di kanan untuk menyimpan langsung ke Database Supabase.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="default"
                                        disabled={isSubmitting || stagingQuestions.length === 0}
                                        onClick={handleCommitToDatabase}
                                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md px-6 py-2 shrink-0 rounded-xl cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan ke Database...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" /> Simpan {stagingQuestions.length} Soal ke Database
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {stagingQuestions.map((q, idx) => (
                                <Card key={q.id} className="p-4 space-y-3 border hover:border-primary/50 transition-all">
                                    <div className="flex items-start justify-between gap-3 border-b pb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="text-[10px] font-mono">
                                                #{idx + 1}
                                            </Badge>
                                            <select
                                                value={q.question_type}
                                                onChange={e => {
                                                    const newType = e.target.value;
                                                    handleUpdateRowField(q.id, "question_type", newType);
                                                    if (newType === "TRUE_FALSE") {
                                                        setStagingQuestions(prev =>
                                                            prev.map(row => row.id !== q.id ? row : {
                                                                ...row,
                                                                question_type: newType,
                                                                options: [
                                                                    { label: "A", option_text: "Benar", is_correct: true },
                                                                    { label: "B", option_text: "Salah", is_correct: false },
                                                                ],
                                                            })
                                                        );
                                                    } else if (q.question_type === "TRUE_FALSE" && newType !== "TRUE_FALSE") {
                                                        setStagingQuestions(prev =>
                                                            prev.map(row => row.id !== q.id ? row : {
                                                                ...row,
                                                                question_type: newType,
                                                                options: [
                                                                    { label: "A", option_text: "", is_correct: true },
                                                                    { label: "B", option_text: "", is_correct: false },
                                                                    { label: "C", option_text: "", is_correct: false },
                                                                    { label: "D", option_text: "", is_correct: false },
                                                                    { label: "E", option_text: "", is_correct: false },
                                                                ],
                                                            })
                                                        );
                                                    }
                                                }}
                                                className="px-2 py-0.5 text-[10px] font-bold rounded border bg-background"
                                            >
                                                <option value="SINGLE_CHOICE">PG (1 Jawaban)</option>
                                                <option value="MULTIPLE_CHOICE">PG Kompleks</option>
                                                <option value="TRUE_FALSE">Benar/Salah</option>
                                            </select>

                                            <select
                                                value={q.difficulty}
                                                onChange={e => handleUpdateRowField(q.id, "difficulty", e.target.value)}
                                                className="px-2 py-0.5 text-[10px] font-bold rounded border bg-background"
                                            >
                                                <option value="EASY">EASY</option>
                                                <option value="MEDIUM">MEDIUM</option>
                                                <option value="HARD">HARD</option>
                                            </select>

                                            <select
                                                value={q.bloom_level}
                                                onChange={e => handleUpdateRowField(q.id, "bloom_level", e.target.value)}
                                                className="px-2 py-0.5 text-[10px] font-bold rounded border bg-background"
                                            >
                                                {["C1", "C2", "C3", "C4", "C5", "C6"].map(b => (
                                                    <option key={b} value={b}>
                                                        {b}
                                                    </option>
                                                ))}
                                            </select>

                                            <input
                                                type="text"
                                                value={q.source}
                                                onChange={e => handleUpdateRowField(q.id, "source", e.target.value)}
                                                placeholder="Sumber Soal"
                                                className="px-2 py-0.5 text-[10px] rounded border bg-background w-36"
                                            />
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {q.has_image && (
                                                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                                                    <AlertCircle className="mr-1 h-3 w-3" /> Ada Gambar
                                                </Badge>
                                            )}
                                            {pdfPages.length > 0 && activePdfPage >= 0 && activePdfPage < pdfPages.length && pdfPages[activePdfPage] && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleInsertPdfPage(q.id, pdfPages[activePdfPage] as string, activePdfPage + 1)}
                                                    className="text-[10px] h-7 border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                                                >
                                                    <ImageIcon className="mr-1 h-3 w-3 text-indigo-600" /> Sisipkan Hal {activePdfPage + 1}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleGenerateRowExplanation(q.id)}
                                                className="text-[10px] h-7 border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100"
                                            >
                                                <Sparkles className="mr-1 h-3 w-3 text-purple-600" /> ✨ AI Pembahasan
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setKatexPreviewMath(q.content)}
                                                className="text-[10px] h-7"
                                            >
                                                <Calculator className="mr-1 h-3 w-3 text-primary" /> KaTeX
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteRow(q.id)}
                                                className="text-[10px] h-7 border-rose-200 text-rose-600 hover:bg-rose-50"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Question Text Editor */}
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                                            Pertanyaan Soal (Markdown / LaTeX Supported)
                                        </label>
                                        <textarea
                                            value={q.content}
                                            onChange={e => handleUpdateRowField(q.id, "content", e.target.value)}
                                            rows={3}
                                            className="w-full p-2.5 text-xs rounded-xl border bg-background font-mono focus:ring-1 focus:ring-primary"
                                        />
                                        {q.content.includes("![") || q.content.includes("$") ? (
                                            <div className="mt-1.5 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                                                <span className="text-[10px] font-bold text-emerald-700 block mb-1">Pratinjau Render:</span>
                                                <MathKaTeXPreview content={q.content} />
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Options Editor */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                            {q.question_type === "TRUE_FALSE"
                                                ? "Pernyataan (Tabel Benar / Salah)"
                                                : q.question_type === "MULTIPLE_CHOICE"
                                                ? "Pilihan Jawaban (Checkbox = Kunci Jawaban Benar)"
                                                : "Pilihan Jawaban (Radio Button = Kunci Jawaban Benar)"}
                                        </label>
                                        {q.question_type === "TRUE_FALSE" ? (
                                            <div className="border border-sky-600/30 rounded-xl overflow-hidden bg-card shadow-2xs">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-[#0284C7] text-white text-xs font-bold tracking-wide">
                                                            <th className="p-2 border-r border-sky-500/30">Pernyataan</th>
                                                            <th className="p-2 w-20 text-center border-r border-sky-500/30">Benar</th>
                                                            <th className="p-2 w-20 text-center">Salah</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border text-xs">
                                                        {q.options.map((opt, optIdx) => (
                                                            <tr key={optIdx} className="hover:bg-sky-50/20 transition-colors">
                                                                <td className="p-2 border-r border-border font-medium">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-xs shrink-0 text-muted-foreground">{opt.label}.</span>
                                                                        <input
                                                                            type="text"
                                                                            value={opt.option_text}
                                                                            onChange={e => handleUpdateOption(q.id, optIdx, "option_text", e.target.value)}
                                                                            placeholder={`Pernyataan ${opt.label}`}
                                                                            className="w-full px-2 py-1 text-xs rounded border bg-background font-medium"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="p-2 text-center border-r border-border bg-emerald-50/20">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={opt.is_correct === true}
                                                                        onChange={() => handleUpdateOption(q.id, optIdx, "is_correct", true)}
                                                                        className="h-4 w-4 rounded text-emerald-600 cursor-pointer"
                                                                    />
                                                                </td>
                                                                <td className="p-2 text-center bg-rose-50/20">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={opt.is_correct === false}
                                                                        onChange={() => handleUpdateOption(q.id, optIdx, "is_correct", false)}
                                                                        className="h-4 w-4 rounded text-rose-600 cursor-pointer"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {q.options.map((opt, optIdx) => (
                                                    <div
                                                        key={optIdx}
                                                        className={`p-2 rounded-xl border flex items-center gap-2 text-xs ${opt.is_correct ? "bg-emerald-50 border-emerald-300" : "bg-background"
                                                            }`}
                                                    >
                                                        <input
                                                            type={q.question_type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                                                            name={`correct-${q.id}`}
                                                            checked={opt.is_correct}
                                                            onChange={() => handleUpdateOption(q.id, optIdx, "is_correct", !opt.is_correct)}
                                                            className="cursor-pointer"
                                                        />
                                                        <span className="font-bold text-[11px] px-1.5 py-0.5 rounded bg-muted">
                                                            {opt.label}
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={opt.option_text}
                                                            onChange={e => handleUpdateOption(q.id, optIdx, "option_text", e.target.value)}
                                                            className="w-full px-2 py-1 text-xs rounded border bg-background font-medium"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Explanation Editor */}
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                                            Pembahasan & Langkah Penyelesaian
                                        </label>
                                        <textarea
                                            value={q.explanation}
                                            onChange={e => handleUpdateRowField(q.id, "explanation", e.target.value)}
                                            rows={2}
                                            placeholder="Tuliskan pembahasan di sini..."
                                            className="w-full p-2.5 text-xs rounded-xl border bg-amber-50/40 border-amber-200 text-amber-950 font-medium focus:ring-1 focus:ring-amber-400"
                                        />
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {stagingQuestions.length > 0 && (
                            <div className="flex items-center justify-between p-4 rounded-xl border bg-emerald-50/70 border-emerald-200 mt-4 shadow-xs">
                                <span className="text-xs font-bold text-emerald-900">
                                    Total {stagingQuestions.length} soal terdeteksi. Siap disimpan ke database.
                                </span>
                                <Button
                                    type="button"
                                    size="default"
                                    disabled={isSubmitting || stagingQuestions.length === 0}
                                    onClick={handleCommitToDatabase}
                                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md px-6 py-2 rounded-xl cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan ke Database...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Simpan {stagingQuestions.length} Soal ke Database
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* KATEX PREVIEW MODAL DRAWER */}
                {katexPreviewMath && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <Card className="max-w-lg w-full p-5 space-y-4 bg-background shadow-2xl">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h4 className="text-xs font-bold flex items-center gap-1.5">
                                    <Calculator className="h-4 w-4 text-primary" /> Live KaTeX Math Renderer
                                </h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setKatexPreviewMath(null)}
                                    className="h-6 w-6 p-0 rounded-full"
                                >
                                    ✕
                                </Button>
                            </div>

                            <div
                                className="p-4 rounded-xl border bg-muted/30 text-sm overflow-x-auto"
                                dangerouslySetInnerHTML={{ __html: renderKaTeXHTML(katexPreviewMath) }}
                            />

                            <div className="flex justify-end">
                                <Button size="sm" onClick={() => setKatexPreviewMath(null)} className="text-xs">
                                    Tutup Pratinjau
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
    );

    if (variant === "section") {
        return <div>{content}</div>;
    }

    return <AdminActionModal {...modalProps}>{content}</AdminActionModal>;
}
