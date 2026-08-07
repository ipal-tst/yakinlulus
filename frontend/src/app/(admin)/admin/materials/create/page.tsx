"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { academicMasterService } from "@/services/academic-master.service";
import { academicService } from "@/services/academic.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
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
    Columns,
    Maximize2,
    CheckCircle2,
    Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";

export default function CreateMaterialPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [subjectName, setSubjectName] = useState("Penalaran Matematika");
    const [category, setCategory] = useState("TEORI");
    const [readingTime, setReadingTime] = useState(15);
    const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("PUBLISHED");
    const [videoUrl, setVideoUrl] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [content, setContent] = useState("");

    const [isSplitMode, setIsSplitMode] = useState(true);
    const [activeMobileTab, setActiveMobileTab] = useState<"EDITOR" | "METADATA" | "PREVIEW">("EDITOR");
    const [isSaving, setIsSaving] = useState(false);

    // Dynamic Subjects from Academic Master Database
    const { data: dbSubjects = [] } = useQuery({
        queryKey: ["academic-master-subjects-create-page"],
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

    const handleInsertSnippet = (snippet: string) => {
        setContent((prev) => prev + (prev ? "\n" : "") + snippet);
    };

    const handleSave = async () => {
        if (!title.trim()) return;

        setIsSaving(true);
        try {
            await academicService.createMaterial({
                title: title.trim(),
                subject_name: subjectName,
                category,
                reading_time_minutes: Number(readingTime) || 10,
                status,
                video_url: videoUrl.trim() || undefined,
                pdf_url: pdfUrl.trim() || undefined,
                content: content.trim(),
            });
            router.push("/admin/materials");
        } catch (err) {
            console.error("Failed to create material", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                    <Link href="/admin/materials">
                        <Button variant="ghost" size="sm" className="rounded-xl gap-1.5 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" /> Kembali
                        </Button>
                    </Link>

                    <div className="h-4 w-px bg-border hidden sm:block" />

                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-heading font-bold text-base sm:text-lg text-foreground leading-tight">
                                Tulis Materi Belajar Baru
                            </h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                Studio authoring rangkuman teori, strategi pengerjaan, dan formula cepat UTBK.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSplitMode(!isSplitMode)}
                        className="rounded-xl text-xs h-9 gap-1.5 hidden md:inline-flex"
                    >
                        {isSplitMode ? <Maximize2 className="h-3.5 w-3.5 text-primary" /> : <Columns className="h-3.5 w-3.5" />}
                        {isSplitMode ? "Fokus Editor" : "Split Screen Live"}
                    </Button>

                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className="rounded-xl gap-1.5 font-semibold text-xs h-9 shadow-xs"
                    >
                        <Save className="h-4 w-4" /> {isSaving ? "Menyimpan..." : "Simpan & Publikasikan"}
                    </Button>
                </div>
            </header>

            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden border-b border-border bg-muted/30 p-2 gap-1 overflow-x-auto">
                <Button
                    variant={activeMobileTab === "EDITOR" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveMobileTab("EDITOR")}
                    className="rounded-xl text-xs h-8 gap-1 font-medium flex-1"
                >
                    <PenTool className="h-3.5 w-3.5" /> Editor
                </Button>
                <Button
                    variant={activeMobileTab === "METADATA" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveMobileTab("METADATA")}
                    className="rounded-xl text-xs h-8 gap-1 font-medium flex-1"
                >
                    <Sliders className="h-3.5 w-3.5" /> Pengaturan
                </Button>
                <Button
                    variant={activeMobileTab === "PREVIEW" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveMobileTab("PREVIEW")}
                    className="rounded-xl text-xs h-8 gap-1 font-medium flex-1"
                >
                    <Eye className="h-3.5 w-3.5" /> Pratinjau
                </Button>
            </div>

            {/* Studio Workspace Content */}
            <div className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: Metadata Sidebar (3 cols on desktop) */}
                <div className={`md:col-span-4 lg:col-span-3 space-y-5 ${activeMobileTab !== "METADATA" ? "hidden md:block" : "block"}`}>
                    {/* Module Primary Settings Card */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-4 shadow-2xs">
                        <h2 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Sliders className="h-4 w-4 text-primary" /> Pengaturan Akademik
                        </h2>

                        <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <label className="font-semibold text-foreground">Mata Pelajaran Master *</label>
                                <select
                                    value={subjectName}
                                    onChange={(e) => setSubjectName(e.target.value)}
                                    className="w-full h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
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
                                    className="w-full h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                                >
                                    <option value="TEORI">Rangkuman Teori</option>
                                    <option value="STRATEGI">Strategi Belajar & Pengerjaan</option>
                                    <option value="TRIK_CEPAT">Trik Cepat & Formula</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-foreground">Waktu Baca (Menit)</label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={readingTime}
                                    onChange={(e) => setReadingTime(parseInt(e.target.value) || 5)}
                                    className="h-9 text-xs rounded-xl bg-background"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-foreground">Status Publikasi</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                    className="w-full h-9 rounded-xl border border-input bg-background px-3 font-medium text-xs focus:outline-hidden"
                                >
                                    <option value="PUBLISHED">Terpublikasi (Aktif)</option>
                                    <option value="DRAFT">Draf (Revisi)</option>
                                    <option value="ARCHIVED">Arsip</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Media Attachments Card */}
                    <div className="p-4 sm:p-5 rounded-2xl border border-border bg-muted/20 space-y-4 shadow-2xs">
                        <h2 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <LinkIcon className="h-4 w-4 text-blue-500" /> Media & Lampiran
                        </h2>

                        <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <label className="font-semibold text-foreground flex items-center gap-1.5">
                                    <Video className="h-3.5 w-3.5 text-blue-500" /> Link Video Tutorial
                                </label>
                                <Input
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-background"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-foreground flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-purple-500" /> Link File Rangkuman PDF
                                </label>
                                <Input
                                    placeholder="https://storage.yakinlulus.id/pdf/..."
                                    value={pdfUrl}
                                    onChange={(e) => setPdfUrl(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-background"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Studio Editor Workspace (9 cols on desktop) */}
                <div className={`md:col-span-8 lg:col-span-9 space-y-4 flex flex-col ${activeMobileTab === "METADATA" ? "hidden md:flex" : "flex"}`}>
                    {/* Title Input */}
                    <div className="space-y-1">
                        <label className="font-bold text-xs text-foreground">Judul Materi Belajar *</label>
                        <Input
                            placeholder="Contoh: Konsep Dasar & Formula Cepat Aljabar Kuadrat UTBK"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-11 rounded-2xl text-base font-bold bg-card shadow-2xs border-border"
                        />
                    </div>

                    {/* Editor + Split Screen Preview Container */}
                    <div className={`grid gap-4 flex-1 ${isSplitMode && activeMobileTab !== "PREVIEW" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
                        {/* Markdown / LaTeX Editor */}
                        <div className={`space-y-2 flex flex-col ${activeMobileTab === "PREVIEW" ? "hidden lg:flex" : "flex"}`}>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <label className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                    <PenTool className="h-4 w-4 text-primary" /> Isi Rangkuman & Formula LaTeX
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
                                rows={20}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Tuliskan modul teori lengkap di sini. Gunakan pemformatan Markdown dan rumus LaTeX..."
                                className="w-full flex-1 min-h-[460px] rounded-2xl border border-input bg-card p-4 font-mono text-xs focus:outline-hidden leading-relaxed shadow-2xs resize-y"
                            />
                        </div>

                        {/* Live Preview Column */}
                        {(isSplitMode || activeMobileTab === "PREVIEW") && (
                            <div className="space-y-2 flex flex-col">
                                <label className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                    <Eye className="h-4 w-4 text-emerald-500" /> Pratinjau Tampilan Siswa (Live Render)
                                </label>

                                <div className="w-full flex-1 min-h-[460px] rounded-2xl border border-border bg-muted/20 p-5 overflow-y-auto space-y-4">
                                    <div className="space-y-2 pb-3 border-b border-border">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="secondary" className="text-[10px]">
                                                {subjectName}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px]">
                                                {category}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200 bg-purple-50">
                                                <Clock className="h-3 w-3 mr-1" /> {readingTime} Min
                                            </Badge>
                                        </div>
                                        <h2 className="font-heading font-bold text-xl text-foreground mt-1">
                                            {title || "Judul Belum Diisi"}
                                        </h2>
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
                                                Ketik konten di editor untuk melihat pratinjau langsung di sini...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
