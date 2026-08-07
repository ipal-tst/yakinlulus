"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { academicMasterService } from "@/services/academic-master.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Material } from "@/types";
import {
    Sparkles,
    BookOpen,
    Video,
    FileText,
    Clock,
    Layers,
    Save,
    Type,
    Bold,
    List,
    Code,
    FileQuestion,
    Eye,
    Sliders,
    PenTool,
    CheckCircle2,
    Columns,
    Maximize2,
} from "lucide-react";

interface MaterialAuthoringDialogProps {
    item: Material | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (materialPayload: Partial<Material>) => void;
}

export function MaterialAuthoringDialog({
    item,
    isOpen,
    onClose,
    onSave,
}: MaterialAuthoringDialogProps) {
    const isEdit = !!item;
    const [activeTab, setActiveTab] = useState<"METADATA" | "EDITOR" | "PREVIEW">("EDITOR");
    const [isSplitMode, setIsSplitMode] = useState(true);

    const [title, setTitle] = useState("");
    const [subjectName, setSubjectName] = useState("Penalaran Matematika");
    const [category, setCategory] = useState("TEORI");
    const [readingTime, setReadingTime] = useState(15);
    const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("PUBLISHED");
    const [videoUrl, setVideoUrl] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [content, setContent] = useState("");

    // Dynamic Subjects from Academic Master Database
    const { data: dbSubjects = [] } = useQuery({
        queryKey: ["academic-master-subjects-authoring-dialog-v3"],
        queryFn: async () => {
            try {
                const res = await academicMasterService.getSubjects();
                return Array.isArray(res) ? res : [];
            } catch {
                return [];
            }
        },
    });

    const defaultSubjectNames = [
        "Penalaran Matematika",
        "Literasi Bahasa Indonesia",
        "Literasi Bahasa Inggris",
        "Penalaran Umum",
        "Fisika",
        "Kimia",
        "Biologi",
    ];

    const rawSubjects = dbSubjects.length > 0
        ? dbSubjects.map((s) => s.name)
        : defaultSubjectNames;

    const availableSubjects = Array.from(new Set(rawSubjects.filter(Boolean)));

    useEffect(() => {
        if (item) {
            setTitle(item.title || "");
            setSubjectName(item.subject_name || availableSubjects[0] || "Penalaran Matematika");
            setCategory(item.category || "TEORI");
            setReadingTime(item.reading_time_minutes || 15);
            setStatus(item.status || "PUBLISHED");
            setVideoUrl(item.video_url || "");
            setPdfUrl(item.pdf_url || "");
            setContent(item.content || "");
        } else {
            setTitle("");
            setSubjectName(availableSubjects[0] || "Penalaran Matematika");
            setCategory("TEORI");
            setReadingTime(15);
            setStatus("PUBLISHED");
            setVideoUrl("");
            setPdfUrl("");
            setContent("");
        }
        setActiveTab("EDITOR");
    }, [item, isOpen]);

    const handleInsertSnippet = (snippet: string) => {
        setContent((prev) => prev + (prev ? "\n" : "") + snippet);
    };

    const handleSubmit = () => {
        if (!title.trim()) return;

        onSave({
            ...(item ? { id: item.id } : {}),
            title: title.trim(),
            subject_name: subjectName,
            category,
            reading_time_minutes: Number(readingTime) || 10,
            status,
            video_url: videoUrl.trim() || undefined,
            pdf_url: pdfUrl.trim() || undefined,
            content: content.trim(),
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* Expanded Dialog Width to max-w-[1400px] w-[96vw] h-[92vh] */}
            <DialogContent className="max-w-[1400px] w-[96vw] h-[92vh] max-h-[92vh] flex flex-col justify-between rounded-2xl border-border p-0 gap-0 overflow-hidden shadow-2xl bg-card">
                {/* Header */}
                <DialogHeader className="p-4 md:p-5 border-b border-border/80 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold font-heading text-foreground">
                                    {isEdit ? `Edit Modul: ${item.title}` : "Studio Authoring Materi Belajar Baru"}
                                </DialogTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Area kerja luas untuk membuat dan menyunting modul rangkuman teori, strategi, dan formula cepat.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {item?.id && (
                                <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 hidden sm:inline-flex">
                                    ID: {item.id}
                                </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
                                {subjectName}
                            </Badge>
                        </div>
                    </div>

                    {/* Navigation Tabs Bar */}
                    <div className="flex items-center justify-between gap-2 pt-4">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            <Button
                                variant={activeTab === "EDITOR" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setActiveTab("EDITOR")}
                                className="rounded-xl text-xs h-8 gap-1.5 font-medium"
                            >
                                <PenTool className="h-3.5 w-3.5" /> 1. Studio Editor & Teori
                            </Button>
                            <Button
                                variant={activeTab === "METADATA" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setActiveTab("METADATA")}
                                className="rounded-xl text-xs h-8 gap-1.5 font-medium"
                            >
                                <Sliders className="h-3.5 w-3.5" /> 2. Pengaturan & Klasifikasi
                            </Button>
                            <Button
                                variant={activeTab === "PREVIEW" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setActiveTab("PREVIEW")}
                                className="rounded-xl text-xs h-8 gap-1.5 font-medium"
                            >
                                <Eye className="h-3.5 w-3.5" /> 3. Pratinjau Tampilan Lengkap
                            </Button>
                        </div>

                        {activeTab === "EDITOR" && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsSplitMode(!isSplitMode)}
                                className="rounded-xl text-xs h-8 gap-1.5 font-medium hidden md:inline-flex"
                                title="Toggle Mode Split Screen Live Preview"
                            >
                                {isSplitMode ? <Maximize2 className="h-3.5 w-3.5 text-primary" /> : <Columns className="h-3.5 w-3.5" />}
                                {isSplitMode ? "Fokus Editor" : "Mode Split Screen"}
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {/* Dialog Body Workspace */}
                <div className="p-5 md:p-6 flex-1 overflow-y-auto space-y-5 text-xs">
                    {/* TAB 1: STUDIO EDITOR (Supports Full Screen & Split Screen Live Preview) */}
                    {activeTab === "EDITOR" && (
                        <div className="space-y-4 h-full flex flex-col justify-between">
                            {/* Top Title Input in Editor */}
                            <div className="space-y-1">
                                <label className="font-bold text-foreground">Judul Materi Belajar *</label>
                                <Input
                                    placeholder="Masukkan judul materi belajar (contoh: Formula Cepat & Konsep Aljabar UTBK)"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-10 rounded-xl text-sm font-bold bg-background shadow-2xs"
                                />
                            </div>

                            {/* Main Workspace (Split or Single Editor) */}
                            <div className={`grid gap-4 ${isSplitMode ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"} flex-1`}>
                                {/* Left Side: Editor Area */}
                                <div className="space-y-2 flex flex-col">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <label className="font-bold text-foreground flex items-center gap-1.5">
                                            <PenTool className="h-4 w-4 text-primary" /> Tulis Rangkuman Teori (Markdown & LaTeX)
                                        </label>

                                        {/* Formatting Toolbar */}
                                        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleInsertSnippet("## Sub-judul Bab\n")}
                                                className="h-7 px-2 text-[11px] gap-1 hover:bg-background"
                                                title="Sub-judul H2"
                                            >
                                                <Type className="h-3 w-3" /> H2
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleInsertSnippet("**Teks Tebal**")}
                                                className="h-7 px-2 text-[11px] gap-1 hover:bg-background"
                                                title="Teks Tebal"
                                            >
                                                <Bold className="h-3 w-3" /> Bold
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleInsertSnippet("- Poin penting 1\n- Poin penting 2\n")}
                                                className="h-7 px-2 text-[11px] gap-1 hover:bg-background"
                                                title="Daftar Poin"
                                            >
                                                <List className="h-3 w-3" /> List
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleInsertSnippet("$$\\sqrt{x^2 + y^2} = r$$\n")}
                                                className="h-7 px-2 text-[11px] gap-1 text-primary hover:bg-background"
                                                title="Formula LaTeX"
                                            >
                                                <Code className="h-3 w-3" /> LaTeX
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleInsertSnippet("> **Tips UTBK**: Selalu periksa rumus turunan sebelum pengerjaan!\n")}
                                                className="h-7 px-2 text-[11px] gap-1 text-amber-500 hover:bg-background"
                                                title="Callout Tips"
                                            >
                                                <FileQuestion className="h-3 w-3" /> Tips
                                            </Button>
                                        </div>
                                    </div>

                                    <textarea
                                        rows={18}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Tuliskan modul teori lengkap di sini. Gunakan Markdown dan rumus LaTeX..."
                                        className="w-full h-full min-h-[380px] rounded-2xl border border-input bg-background p-4 font-mono text-xs focus:outline-hidden leading-relaxed shadow-2xs resize-y"
                                    />
                                </div>

                                {/* Right Side: Live Split Screen Preview (If Split Mode active) */}
                                {isSplitMode && (
                                    <div className="space-y-2 flex flex-col">
                                        <label className="font-bold text-foreground flex items-center gap-1.5">
                                            <Eye className="h-4 w-4 text-emerald-500" /> Pratinjau Langsung Siswa (Live Render)
                                        </label>

                                        <div className="w-full h-full min-h-[380px] rounded-2xl border border-border bg-muted/20 p-5 overflow-y-auto space-y-4">
                                            <div className="space-y-1 pb-3 border-b border-border">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {subjectName}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {category}
                                                    </Badge>
                                                </div>
                                                <h3 className="font-heading font-bold text-lg text-foreground mt-1">
                                                    {title || "Judul Belum Diisi"}
                                                </h3>
                                            </div>

                                            <div className="prose prose-slate dark:prose-invert max-w-none text-xs leading-relaxed space-y-3">
                                                {content ? (
                                                    content.split("\n\n").map((p, idx) => (
                                                        <p key={idx} className="whitespace-pre-wrap">
                                                            {p}
                                                        </p>
                                                    ))
                                                ) : (
                                                    <p className="text-muted-foreground italic text-xs">
                                                        Ketik di editor sebelah kiri untuk melihat hasil render di sini...
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: METADATA & KLASIFIKASI */}
                    {activeTab === "METADATA" && (
                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-2xs">
                                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Sliders className="h-4 w-4 text-primary" /> Pengaturan & Hierarki Akademik
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="font-semibold text-foreground">Mata Pelajaran Master</label>
                                        <select
                                            value={subjectName}
                                            onChange={(e) => setSubjectName(e.target.value)}
                                            className="w-full h-10 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                                        >
                                            {availableSubjects.map((sub) => (
                                                <option key={sub} value={sub}>
                                                    {sub}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="font-semibold text-foreground">Kategori Modul</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full h-10 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                                        >
                                            <option value="TEORI">Rangkuman Teori</option>
                                            <option value="STRATEGI">Strategi Belajar & Pengerjaan</option>
                                            <option value="TRIK_CEPAT">Trik Cepat & Formula</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="font-semibold text-foreground">Estimasi Waktu Baca (Menit)</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={readingTime}
                                            onChange={(e) => setReadingTime(parseInt(e.target.value) || 5)}
                                            className="h-10 text-xs rounded-xl bg-background"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="font-semibold text-foreground">Status Publikasi</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as any)}
                                            className="w-full h-10 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                                        >
                                            <option value="PUBLISHED">Terpublikasi (Aktif)</option>
                                            <option value="DRAFT">Draf (Revisi)</option>
                                            <option value="ARCHIVED">Arsip</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Media Attachment Links */}
                            <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-4 shadow-2xs">
                                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Video className="h-4 w-4 text-blue-500" /> Link Video & Dokumen PDF Lampiran
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-foreground flex items-center gap-1.5">
                                            <Video className="h-4 w-4 text-blue-500" /> Link Video Tutorial (YouTube / Vimeo)
                                        </label>
                                        <Input
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            className="h-10 text-xs rounded-xl bg-background"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-foreground flex items-center gap-1.5">
                                            <FileText className="h-4 w-4 text-purple-500" /> Link File Rangkuman (PDF)
                                        </label>
                                        <Input
                                            placeholder="https://storage.yakinlulus.id/pdf/..."
                                            value={pdfUrl}
                                            onChange={(e) => setPdfUrl(e.target.value)}
                                            className="h-10 text-xs rounded-xl bg-background"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: FULL PREVIEW */}
                    {activeTab === "PREVIEW" && (
                        <div className="space-y-4 p-6 rounded-2xl border border-border bg-card min-h-[400px] shadow-2xs">
                            <div className="space-y-2 pb-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {subjectName}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        {category}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs text-purple-600 border-purple-200 bg-purple-50">
                                        <Clock className="h-3 w-3 mr-1" /> {readingTime} Menit Baca
                                    </Badge>
                                </div>
                                <h1 className="font-heading font-bold text-2xl text-foreground mt-2">
                                    {title || "Judul Belum Diisi"}
                                </h1>
                            </div>

                            <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 pt-2">
                                {content ? (
                                    content.split("\n\n").map((p, idx) => (
                                        <p key={idx} className="whitespace-pre-wrap">
                                            {p}
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground italic">Belum ada konten tulisan yang dimasukkan.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                        Batal
                    </Button>

                    <Button size="sm" onClick={handleSubmit} className="rounded-xl gap-1.5 font-semibold shadow-xs">
                        <Save className="h-4 w-4" /> Simpan & Dipublikasi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
