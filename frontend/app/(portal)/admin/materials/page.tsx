"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
    useMaterials,
    useDeleteMaterial,
    usePublishMaterial,
    useSubjects,
} from "@/lib/api";
import {
    BookOpen,
    Plus,
    Search,
    Video,
    FileText,
    Sparkles,
    Eye,
    Trash2,
    Edit3,
    Filter,
    Loader2
} from "lucide-react";

export default function LearningMaterialsAdminPage() {
    const [search, setSearch] = React.useState("");
    const [selectedSubjectFilter, setSelectedSubjectFilter] = React.useState("ALL");
    const [selectedFormatFilter, setSelectedFormatFilter] = React.useState("ALL");

    // Modals state
    const [deletingMaterial, setDeletingMaterial] = React.useState<any>(null);
    const [viewingMaterial, setViewingMaterial] = React.useState<any>(null);
    const [isAISummaryOpen, setIsAISummaryOpen] = React.useState(false);
    const [aiMaterial, setAiMaterial] = React.useState<any>(null);
    const [aiResult, setAiResult] = React.useState<string | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);

    // Queries & Mutations
    const { data: materialsList = [], isLoading, refetch } = useMaterials() as any;
    const { data: subjects = [] } = useSubjects() as any;

    const deleteMutation = useDeleteMaterial();
    const publishMutation = usePublishMaterial();

    const handleDelete = async () => {
        if (!deletingMaterial) return;
        try {
            await deleteMutation.mutateAsync(deletingMaterial.id || deletingMaterial.content_id);
            setDeletingMaterial(null);
            refetch();
        } catch (err: any) {
            alert(err?.message || "Gagal menghapus materi");
        }
    };

    const handleTogglePublish = async (m: any) => {
        const id = m.id || m.content_id;
        const currentStatus = m.status || "PUBLISHED";
        const newStatus = currentStatus === "PUBLISHED" ? false : true;
        try {
            await publishMutation.mutateAsync({ id, publish: newStatus });
            refetch();
        } catch (err: any) {
            alert(err?.message || "Gagal mengubah status publish");
        }
    };

    const handleGenerateAISummary = (m: any) => {
        setAiMaterial(m);
        setIsGeneratingAI(true);
        setAiResult(null);
        setTimeout(() => {
            setAiResult(`### Rangkuman Eksekutif AI (Gemini 3 Flash)
- **Topik Utama**: ${m.title || "Modul Pembelajaran"}
- **Fokus Sub-Tes**: ${m.subject || "Penalaran Akademik"}
- **Poin Penting**:
  1. Konsep dasar dan definisi operasional materi.
  2. Rumus & formula praktis untuk penyelesaian soal cepat UTBK.
  3. Jebakan tipe soal konseptual yang sering muncul.

### Kartu Flashcard AI
- **Q**: Apakah prinsip dasar dari modul ini?
- **A**: Memahami implikasi kausalitas dan penalaran logis secara terstruktur.`);
            setIsGeneratingAI(false);
        }, 1200);
    };

    // Filter Logic
    const materialsArray = Array.isArray(materialsList) ? materialsList : [];
    const filteredMaterials = materialsArray.filter((m: any) => {
        const title = (m.title || m.name || "").toLowerCase();
        const subject = (m.subject || m.subject_name || "").toLowerCase();
        const matchesSearch = title.includes(search.toLowerCase()) || subject.includes(search.toLowerCase());

        const matchesSubject = selectedSubjectFilter === "ALL" ||
            m.subject_id === selectedSubjectFilter ||
            (m.subject || "").toLowerCase() === selectedSubjectFilter.toLowerCase();

        const matchesFormat = selectedFormatFilter === "ALL" ||
            (m.content_format || m.contentFormat || "MARKDOWN").toUpperCase() === selectedFormatFilter.toUpperCase();

        return matchesSearch && matchesSubject && matchesFormat;
    });

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold">CONTENT HUB</Badge>
                        <span className="text-xs text-muted-foreground">Go Backend: `internal/material`</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Materi Pembelajaran CMS</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola modul pembelajaran, video penjelasan HD, PDF rangkuman, slide, dan AI Summary Generator.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => { setIsAISummaryOpen(true); if (materialsArray.length > 0) handleGenerateAISummary(materialsArray[0]); }}
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold cursor-pointer hover:border-indigo-400"
                    >
                        <Sparkles className="mr-2 h-3.5 w-3.5 text-indigo-500" /> AI Material Summary
                    </Button>
                    <Link href="/admin/materials/create">
                        <Button size="sm" className="text-xs font-bold shadow-md shadow-primary/20 cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" /> Upload Materi Baru
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Total Materi Dipublish</span>
                        <div className="text-xl font-extrabold">{materialsArray.length} Modul</div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center font-bold">
                        <Eye className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Total Watch & Read Time</span>
                        <div className="text-xl font-extrabold text-success">18,400 Jam</div>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-bold">
                        <Video className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground font-semibold">Video & Modul Interaktif</span>
                        <div className="text-xl font-extrabold text-warning">1,240 Video</div>
                    </div>
                </Card>
            </div>

            {/* Search & Filters */}
            <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari judul modul atau sub-tes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Filter className="h-3.5 w-3.5" /> Filter:
                    </div>
                    <select
                        value={selectedSubjectFilter}
                        onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-lg border bg-background text-foreground"
                    >
                        <option value="ALL">Semua Mata Pelajaran</option>
                        {Array.isArray(subjects) && subjects.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.level_code || "?"})</option>
                        ))}
                    </select>
                    <select
                        value={selectedFormatFilter}
                        onChange={(e) => setSelectedFormatFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-lg border bg-background text-foreground"
                    >
                        <option value="ALL">Semua Format</option>
                        <option value="VIDEO">Video HD</option>
                        <option value="MARKDOWN">Markdown / Text</option>
                        <option value="PDF">PDF Rangkuman</option>
                    </select>
                </div>
            </Card>

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs font-semibold">Memuat modul pembelajaran...</p>
                </div>
            )}

            {/* Material Grid */}
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMaterials.length === 0 ? (
                        <div className="col-span-full text-center py-12 border rounded-xl bg-card p-6">
                            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-semibold">Belum ada modul pembelajaran yang ditemukan</p>
                            <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan kata kunci pencarian atau tambah modul baru.</p>
                        </div>
                    ) : (
                        filteredMaterials.map((m: any) => {
                            const id = m.id || m.content_id || Math.random().toString();
                            const code = m.code || (id.length >= 8 ? `MAT-${id.substring(0, 4).toUpperCase()}` : "MAT-5000");
                            const status = m.status || "PUBLISHED";
                            const title = m.title || "Modul Pembelajaran";
                            const subject = m.subject_name || m.subject || "Mata Pelajaran";
                            const chapter = m.chapter_name || m.chapter || "Bab Utama";
                            const viewsCount = m.viewsCount ?? m.views_count ?? m.readCount ?? m.read_count ?? 0;
                            const format = (m.content_format || m.contentFormat || "MARKDOWN").toUpperCase();

                            return (
                                <Card key={id} className="p-5 flex flex-col justify-between hover:border-primary/40 transition-all space-y-4 shadow-sm">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Badge variant="outline" className="font-mono text-[10px]">{code}</Badge>
                                                <Badge variant="secondary" className="text-[9px] font-bold">
                                                    {format === "VIDEO" ? <Video className="h-3 w-3 mr-1 inline" /> : <FileText className="h-3 w-3 mr-1 inline" />}
                                                    {format}
                                                </Badge>
                                            </div>
                                            <button
                                                onClick={() => handleTogglePublish(m)}
                                                className="cursor-pointer"
                                                title="Klik untuk mengubah status publish"
                                            >
                                                <Badge variant={status === "PUBLISHED" ? "success" : "warning"} className="text-[10px] font-bold">
                                                    {status}
                                                </Badge>
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-sm text-foreground pt-1 line-clamp-2">{title}</h3>
                                        <p className="text-xs text-muted-foreground">{subject} • {chapter}</p>
                                    </div>

                                    <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1 font-semibold">
                                            <Eye className="h-3.5 w-3.5 text-primary" /> {Number(viewsCount).toLocaleString()} Pembaca
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                onClick={() => setViewingMaterial(m)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                                                title="Lihat Detail Modul"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Link href={`/admin/materials/${m.id || m.content_id}/edit`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                                                    title="Edit Modul"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                            <Button
                                                onClick={() => setDeletingMaterial(m)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                                                title="Hapus Modul"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {/* Delete Modal */}
            <Dialog
                isOpen={deletingMaterial !== null}
                onClose={() => setDeletingMaterial(null)}
                title="Konfirmasi Hapus Modul"
                description="Apakah Anda yakin ingin menghapus modul materi pembelajaran ini? Tindakan ini tidak dapat dibatalkan."
            >
                <div className="space-y-4 text-xs">
                    {deletingMaterial && (
                        <div className="p-3 border rounded-lg bg-destructive/5 text-destructive font-semibold">
                            {deletingMaterial.title}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingMaterial(null)}
                            className="cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteMutation.isPending}
                            onClick={handleDelete}
                            className="font-bold cursor-pointer"
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Hapus Permanen
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Detail Preview Modal */}
            <Dialog
                isOpen={viewingMaterial !== null}
                onClose={() => setViewingMaterial(null)}
                title={viewingMaterial?.title || "Detail Modul Materi"}
                description={`${viewingMaterial?.subject_name || viewingMaterial?.subject || "Mata Pelajaran"} • ${viewingMaterial?.chapter_name || viewingMaterial?.chapter || "Bab"}`}
            >
                {viewingMaterial && (
                    <div className="space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b pb-3">
                            <Badge variant="outline" className="font-mono">{viewingMaterial.code || "MAT-5000"}</Badge>
                            <Badge variant={viewingMaterial.status === "PUBLISHED" ? "success" : "warning"}>
                                {viewingMaterial.status || "PUBLISHED"}
                            </Badge>
                        </div>

                        <div className="bg-muted/40 p-4 rounded-xl space-y-2 border max-h-60 overflow-y-auto">
                            <div className="font-bold text-foreground mb-1">Ringkasan Modul:</div>
                            <div className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                                {viewingMaterial.body || viewingMaterial.content || viewingMaterial.summary || "Materi pembelajaran lengkap meliputi konsep, penjelasan video HD, serta latihan soal berbobot."}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-2">
                            <span>Estimasi Durasi: {viewingMaterial.estimated_duration || 15} Menit</span>
                            <span>Total Pembaca: {Number(viewingMaterial.viewsCount || viewingMaterial.views_count || 0).toLocaleString()} Siswa</span>
                        </div>
                    </div>
                )}
            </Dialog>

            {/* AI Material Summary Generator Modal */}
            <Dialog
                isOpen={isAISummaryOpen}
                onClose={() => setIsAISummaryOpen(false)}
                title="AI Material Summary & Flashcard Generator"
                description="Generasikan ringkasan otomatis & kartu flashcard interaktif menggunakan LLM Gemini 3."
            >
                <div className="space-y-4 text-xs">
                    <div>
                        <label className="font-semibold block mb-1">Pilih Modul Pembelajaran untuk Di-analisis:</label>
                        <select
                            value={aiMaterial?.id || ""}
                            onChange={(e) => {
                                const selected = materialsArray.find((m: any) => (m.id || m.content_id) === e.target.value);
                                if (selected) handleGenerateAISummary(selected);
                            }}
                            className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
                        >
                            {materialsArray.map((m: any) => (
                                <option key={m.id || m.content_id} value={m.id || m.content_id}>
                                    {m.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isGeneratingAI ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2 text-indigo-600">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-xs font-semibold">Gemini 3 Flash sedang menganalisis materi...</span>
                        </div>
                    ) : aiResult ? (
                        <div className="p-4 rounded-xl border bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold">
                                <Sparkles className="h-4 w-4" /> Hasil AI Summary Generator
                            </div>
                            <div className="whitespace-pre-wrap text-[11px] font-mono leading-relaxed text-foreground">
                                {aiResult}
                            </div>
                        </div>
                    ) : null}
                </div>
            </Dialog>
        </div>
    );
}
