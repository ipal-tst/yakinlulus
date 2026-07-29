"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useContents, useMedia, useDeleteMedia } from "@/lib/api";
import {
    FileText,
    Search,
    BookOpen,
    HelpCircle,
    Layers,
    Eye,
    Loader2,
    Film,
    BarChart3,
    Clock,
    CheckCircle2,
    Image,
    File,
    Music,
    Video,
    FileArchive,
    Trash2,
    Upload,
    ExternalLink
} from "lucide-react";

interface ContentItem {
    id: string; content_type: string; title: string; body?: string;
    status: string; created_at: string; updated_at: string;
}

interface MediaItem {
    id: string; file_name: string; original_name: string;
    mime_type: string; file_size: number; url: string;
    entity_type?: string; entity_id?: string; created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: any; bg: string; label: string }> = {
    MATERIAL: { icon: BookOpen, bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Materi" },
    EXAM: { icon: Film, bg: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", label: "Ujian" },
    QUESTION: { icon: HelpCircle, bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Soal" },
};

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024; const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getMediaIcon(mime: string) {
    if (mime.startsWith("image/")) return <Image className="h-3.5 w-3.5" />;
    if (mime.startsWith("video/")) return <Video className="h-3.5 w-3.5" />;
    if (mime.startsWith("audio/")) return <Music className="h-3.5 w-3.5" />;
    if (mime.includes("pdf") || mime.includes("document")) return <FileText className="h-3.5 w-3.5" />;
    if (mime.includes("zip") || mime.includes("rar")) return <FileArchive className="h-3.5 w-3.5" />;
    return <File className="h-3.5 w-3.5" />;
}

export default function ContentAdminPage() {
    const [activeTab, setActiveTab] = React.useState<"content" | "media">("content");
    const [search, setSearch] = React.useState("");
    const [typeFilter, setTypeFilter] = React.useState("ALL");
    const [statusFilter, setStatusFilter] = React.useState("ALL");
    const [mimeFilter, setMimeFilter] = React.useState("");
    const [viewingContent, setViewingContent] = React.useState<ContentItem | null>(null);
    const [deletingMedia, setDeletingMedia] = React.useState<MediaItem | null>(null);

    const { data: contentsResponse, isLoading } = useContents({ limit: "100" }) as any;
    const { data: mediaResponse, isLoading: mediaLoading, refetch: refetchMedia } = useMedia({ limit: "100" }) as any;
    const deleteMediaMutation = useDeleteMedia();

    const contents: ContentItem[] = React.useMemo(() => {
        if (!contentsResponse) return [];
        if (Array.isArray(contentsResponse)) return contentsResponse;
        if (Array.isArray(contentsResponse.data)) return contentsResponse.data;
        return [];
    }, [contentsResponse]);

    const mediaList: MediaItem[] = React.useMemo(() => {
        if (!mediaResponse) return [];
        if (Array.isArray(mediaResponse)) return mediaResponse;
        if (Array.isArray(mediaResponse.data)) return mediaResponse.data;
        return [];
    }, [mediaResponse]);

    const stats = React.useMemo(() => {
        const total = contents.length;
        const materials = contents.filter(c => c.content_type === "MATERIAL").length;
        const exams = contents.filter(c => c.content_type === "EXAM").length;
        const questions = contents.filter(c => c.content_type === "QUESTION").length;
        const published = contents.filter(c => c.status === "PUBLISHED" || c.status === "ACTIVE").length;
        const draft = contents.filter(c => c.status === "DRAFT").length;
        return { total, materials, exams, questions, published, draft };
    }, [contents]);

    const mediaStats = React.useMemo(() => {
        const total = mediaList.length;
        const totalSize = mediaList.reduce((s, m) => s + m.file_size, 0);
        const images = mediaList.filter(m => m.mime_type.startsWith("image/")).length;
        const docs = mediaList.filter(m => m.mime_type.includes("pdf") || m.mime_type.includes("document")).length;
        const videos = mediaList.filter(m => m.mime_type.startsWith("video/")).length;
        return { total, totalSize, images, docs, videos };
    }, [mediaList]);

    const filteredContents = contents.filter(c => {
        const t = (c.title || "").toLowerCase();
        const type = c.content_type || "";
        const status = c.status || "";
        return t.includes(search.toLowerCase()) &&
            (typeFilter === "ALL" || type === typeFilter) &&
            (statusFilter === "ALL" || status === statusFilter);
    });

    const filteredMedia = mediaList.filter(m => {
        const name = (m.original_name || "").toLowerCase();
        return name.includes(search.toLowerCase()) &&
            (!mimeFilter || m.mime_type.startsWith(mimeFilter));
    });

    const handleDeleteMedia = async () => {
        if (!deletingMedia) return;
        try {
            await deleteMediaMutation.mutateAsync(deletingMedia.id);
            setDeletingMedia(null);
            refetchMedia();
        } catch (err: any) {
            alert(err?.message || "Gagal menghapus file");
        }
    };

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold">CMS & MEDIA</Badge>
                        <span className="text-xs text-muted-foreground">Real-time database</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Konten & Media</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Analytics konten dan pustaka file pendukung (gambar, video, PDF, dll).
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={activeTab === "content" ? "default" : "outline"}
                        onClick={() => setActiveTab("content")}
                        className="text-xs cursor-pointer"
                    >
                        <FileText className="mr-1.5 h-3.5 w-3.5" /> Konten
                    </Button>
                    <Button
                        size="sm"
                        variant={activeTab === "media" ? "default" : "outline"}
                        onClick={() => setActiveTab("media")}
                        className="text-xs cursor-pointer"
                    >
                        <Image className="mr-1.5 h-3.5 w-3.5" /> Media ({mediaStats.total})
                    </Button>
                </div>
            </div>

            {activeTab === "content" && (
                <>
                    {/* Content Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                            { icon: <Layers className="h-4 w-4" />, bg: "bg-primary/10 text-primary", label: "Total Konten", value: stats.total },
                            { icon: <BookOpen className="h-4 w-4" />, bg: "bg-blue-100 text-blue-700", label: "Materi", value: stats.materials },
                            { icon: <Film className="h-4 w-4" />, bg: "bg-purple-100 text-purple-700", label: "Ujian", value: stats.exams },
                            { icon: <HelpCircle className="h-4 w-4" />, bg: "bg-amber-100 text-amber-700", label: "Soal", value: stats.questions },
                            { icon: <CheckCircle2 className="h-4 w-4" />, bg: "bg-success/10 text-success", label: "Published", value: stats.published },
                            { icon: <Clock className="h-4 w-4" />, bg: "bg-warning/10 text-warning", label: "Draft", value: stats.draft },
                        ].map((s, i) => (
                            <Card key={i} className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center`}>{s.icon}</div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground font-semibold">{s.label}</span>
                                        <div className="text-lg font-extrabold">{s.value}</div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Distribution */}
                    <Card className="p-5 space-y-4">
                        <h3 className="font-bold text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Distribusi Konten</h3>
                        {stats.total > 0 ? [
                            { label: "Materi", count: stats.materials, pct: Math.round(stats.materials / stats.total * 100), color: "bg-blue-500" },
                            { label: "Ujian", count: stats.exams, pct: Math.round(stats.exams / stats.total * 100), color: "bg-purple-500" },
                            { label: "Soal", count: stats.questions, pct: Math.round(stats.questions / stats.total * 100), color: "bg-amber-500" },
                        ].map((item) => (
                            <div key={item.label} className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="font-semibold">{item.label}</span>
                                    <span className="text-muted-foreground">{item.count} ({item.pct}%)</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                                </div>
                            </div>
                        )) : <p className="text-xs text-muted-foreground italic">Tidak ada data</p>}
                    </Card>

                    {/* Content Table */}
                    <Card className="overflow-hidden space-y-4 p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
                            <h3 className="font-bold text-base">Semua Konten</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative w-48">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input type="text" placeholder="Cari..." value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                                    className="px-3 py-1.5 text-xs rounded-lg border bg-background text-foreground">
                                    <option value="ALL">Semua Tipe</option>
                                    <option value="MATERIAL">Materi</option>
                                    <option value="EXAM">Ujian</option>
                                    <option value="QUESTION">Soal</option>
                                </select>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 text-xs rounded-lg border bg-background text-foreground">
                                    <option value="ALL">Semua Status</option>
                                    <option value="PUBLISHED">Published</option>
                                    <option value="DRAFT">Draft</option>
                                </select>
                            </div>
                        </div>
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                                <tr>
                                    <th className="p-3">Judul</th>
                                    <th className="p-3">Tipe</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Dibuat</th>
                                    <th className="p-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
                                ) : filteredContents.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Tidak ada konten</td></tr>
                                ) : filteredContents.map(c => (
                                    <tr key={c.id} className="hover:bg-muted/30">
                                        <td className="p-3 font-semibold">{c.title || "Untitled"}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${TYPE_CONFIG[c.content_type]?.bg || "bg-muted"}`}>
                                                {TYPE_CONFIG[c.content_type]?.label || c.content_type}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <Badge variant={["PUBLISHED", "ACTIVE"].includes(c.status) ? "success" : "warning"} className="text-[10px]">{c.status}</Badge>
                                        </td>
                                        <td className="p-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}</td>
                                        <td className="p-3 text-right">
                                            <Button onClick={() => setViewingContent(c)} variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer" title="Detail">
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    {/* Content Detail Modal */}
                    <Dialog isOpen={viewingContent !== null} onClose={() => setViewingContent(null)}
                        title={viewingContent?.title || "Detail"} description={`Tipe: ${viewingContent?.content_type || ""}`}>
                        {viewingContent && (
                            <div className="space-y-4 text-xs">
                                <div className="flex items-center justify-between border-b pb-3">
                                    <Badge variant={["PUBLISHED", "ACTIVE"].includes(viewingContent.status) ? "success" : "warning"}>{viewingContent.status}</Badge>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${TYPE_CONFIG[viewingContent.content_type]?.bg || "bg-muted"}`}>{viewingContent.content_type}</span>
                                </div>
                                <div className="bg-muted/40 p-4 rounded-xl border max-h-60 overflow-y-auto">
                                    <div className="whitespace-pre-wrap text-[11px] leading-relaxed">{viewingContent.body || <span className="italic text-muted-foreground">Kosong</span>}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="p-2.5 rounded-lg bg-muted/40 border">
                                        <span className="text-[10px] text-muted-foreground block font-semibold">Dibuat</span>
                                        <span className="font-bold">{new Date(viewingContent.created_at).toLocaleDateString("id-ID")}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-muted/40 border">
                                        <span className="text-[10px] text-muted-foreground block font-semibold">Diupdate</span>
                                        <span className="font-bold">{new Date(viewingContent.updated_at).toLocaleDateString("id-ID")}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Dialog>
                </>
            )}

            {activeTab === "media" && (
                <>
                    {/* Media Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                            { icon: <File className="h-4 w-4" />, bg: "bg-primary/10 text-primary", label: "Total File", value: mediaStats.total },
                            { icon: <Image className="h-4 w-4" />, bg: "bg-green-100 text-green-700", label: "Gambar", value: mediaStats.images },
                            { icon: <Video className="h-4 w-4" />, bg: "bg-red-100 text-red-700", label: "Video", value: mediaStats.videos },
                            { icon: <FileText className="h-4 w-4" />, bg: "bg-orange-100 text-orange-700", label: "Dokumen", value: mediaStats.docs },
                            { icon: <Layers className="h-4 w-4" />, bg: "bg-indigo-100 text-indigo-700", label: "Total Size", value: formatBytes(mediaStats.totalSize) },
                        ].map((s, i) => (
                            <Card key={i} className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center`}>{s.icon}</div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground font-semibold">{s.label}</span>
                                        <div className="text-lg font-extrabold">{s.value}</div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Media Library */}
                    <Card className="overflow-hidden space-y-4 p-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h3 className="font-bold text-base">Pustaka Media</h3>
                            <div className="flex items-center gap-2">
                                <div className="relative w-48">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input type="text" placeholder="Cari file..." value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <select value={mimeFilter} onChange={e => setMimeFilter(e.target.value)}
                                    className="px-3 py-1.5 text-xs rounded-lg border bg-background text-foreground">
                                    <option value="">Semua Tipe</option>
                                    <option value="image">Gambar</option>
                                    <option value="video">Video</option>
                                    <option value="audio">Audio</option>
                                    <option value="application">Dokumen</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {mediaLoading ? (
                                <div className="col-span-full py-12 flex flex-col items-center text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                    <span className="text-xs">Memuat file...</span>
                                </div>
                            ) : filteredMedia.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
                                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                    <p>Belum ada file media. Upload gambar, video, PDF, atau file pendukung lainnya.</p>
                                </div>
                            ) : filteredMedia.map(m => (
                                <Card key={m.id} className="p-3 space-y-2 hover:border-primary/40 transition-all">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                            {getMediaIcon(m.mime_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate" title={m.original_name}>{m.original_name}</p>
                                            <p className="text-[10px] text-muted-foreground">{formatBytes(m.file_size)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t">
                                        <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{m.mime_type}</span>
                                        <div className="flex gap-1">
                                            {m.url && (
                                                <a href={m.url} target="_blank" rel="noopener noreferrer"
                                                    className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted">
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                            <button onClick={() => setDeletingMedia(m)}
                                                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </Card>

                    {/* Delete Media Modal */}
                    <Dialog isOpen={deletingMedia !== null} onClose={() => setDeletingMedia(null)}
                        title="Hapus File" description="Hapus file media ini secara permanen?">
                        <div className="space-y-4 text-xs">
                            {deletingMedia && (
                                <div className="p-3 border rounded-lg bg-destructive/5 text-destructive font-semibold flex items-center gap-2">
                                    {getMediaIcon(deletingMedia.mime_type)}
                                    {deletingMedia.original_name}
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <Button variant="outline" size="sm" onClick={() => setDeletingMedia(null)} className="cursor-pointer">Batal</Button>
                                <Button variant="destructive" size="sm" disabled={deleteMediaMutation.isPending}
                                    onClick={handleDeleteMedia} className="font-bold cursor-pointer">
                                    {deleteMediaMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                    Hapus
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </>
            )}
        </div>
    );
}
