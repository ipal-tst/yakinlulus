"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import {
    Image,
    FileText,
    Video,
    Music,
    FileArchive,
    File,
    Upload,
    Search,
    Loader2,
    ExternalLink,
    Check,
    X,
    Trash2
} from "lucide-react";

interface MediaItem {
    id: string; file_name: string; original_name: string;
    mime_type: string; file_size: number; url: string;
    entity_type?: string; entity_id?: string; created_at: string;
}

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024; const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getMediaIcon(mime: string) {
    if (mime.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (mime.startsWith("video/")) return <Video className="h-4 w-4" />;
    if (mime.startsWith("audio/")) return <Music className="h-4 w-4" />;
    if (mime.includes("pdf") || mime.includes("document")) return <FileText className="h-4 w-4" />;
    if (mime.includes("zip") || mime.includes("rar")) return <FileArchive className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
}

function getMediaTypeLabel(mime: string): "image" | "video" | "document" | "other" {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.includes("pdf") || mime.includes("document")) return "document";
    return "other";
}

interface MediaPickerProps {
    onInsert: (html: string) => void;
    entityType?: string;
    entityId?: string;
    children?: React.ReactNode;
}

export default function MediaPicker({ onInsert, entityType, entityId, children }: MediaPickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [tab, setTab] = React.useState<"library" | "upload">("library");
    const [search, setSearch] = React.useState("");
    const [mimeFilter, setMimeFilter] = React.useState("");
    const [mediaList, setMediaList] = React.useState<MediaItem[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);

    const fetchMedia = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (mimeFilter) params.set("mime", mimeFilter);
            const res: any = await apiFetch(`/media?${params}`);
            const data = Array.isArray(res) ? res : res?.data || [];
            setMediaList(data);
        } catch (err) {
            console.warn("fetch media failed", err);
        } finally {
            setLoading(false);
        }
    }, [mimeFilter]);

    React.useEffect(() => {
        if (isOpen && tab === "library") fetchMedia();
    }, [isOpen, tab, fetchMedia]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            if (entityType) formData.append("entity_type", entityType);
            if (entityId) formData.append("entity_id", entityId);

            const token = localStorage.getItem("token");
            const res = await fetch("/api/v1/media/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const json = await res.json();
            if (json.success) {
                await fetchMedia();
                setTab("library");
            }
        } catch (err) {
            console.warn("upload failed", err);
        } finally {
            setUploading(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleSelect = (media: MediaItem) => {
        const type = getMediaTypeLabel(media.mime_type);
        let md = "";
        if (type === "image") {
            md = `![${media.original_name}](${media.url})`;
        } else if (type === "video") {
            md = `[📺 ${media.original_name}](${media.url})`;
        } else {
            md = `[${media.original_name}](${media.url})`;
        }
        onInsert(md);
        setIsOpen(false);
        setSelectedId(null);
    };

    const filteredMedia = mediaList.filter(m => {
        const name = m.original_name.toLowerCase();
        return name.includes(search.toLowerCase());
    });

    return (
        <>
            <div onClick={() => setIsOpen(true)} className="cursor-pointer inline-block">
                {children || (
                    <Button type="button" variant="outline" size="sm" className="text-xs">
                        <Image className="mr-1.5 h-3.5 w-3.5" /> Sisipkan Media
                    </Button>
                )}
            </div>

            <Dialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Media Manager"
                description="Upload atau pilih media untuk disisipkan ke konten"
            >
                <div className="space-y-4 text-xs">
                    {/* Tabs */}
                    <div className="flex gap-2 border-b pb-3">
                        <button
                            onClick={() => setTab("library")}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${tab === "library" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                        >
                            Pustaka Media
                        </button>
                        <button
                            onClick={() => setTab("upload")}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${tab === "upload" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                        >
                            Upload Baru
                        </button>
                    </div>

                    {tab === "upload" && (
                        <div className="space-y-3">
                            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/40 transition-colors">
                                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground mb-3">Klik untuk upload gambar, video, PDF, atau file pendukung</p>
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        onChange={handleUpload}
                                        disabled={uploading}
                                        className="hidden"
                                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.rar"
                                    />
                                    <span className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">
                                        {uploading ? (
                                            <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Mengupload...</>
                                        ) : (
                                            <><Upload className="mr-2 h-3.5 w-3.5" /> Pilih File</>
                                        )}
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    {tab === "library" && (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Cari file..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <select value={mimeFilter} onChange={e => setMimeFilter(e.target.value)}
                                    className="px-3 py-1.5 text-xs rounded-lg border bg-background text-foreground">
                                    <option value="">Semua</option>
                                    <option value="image">Gambar</option>
                                    <option value="video">Video</option>
                                    <option value="audio">Audio</option>
                                    <option value="application">Dokumen</option>
                                </select>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredMedia.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Tidak ada file. Upload dulu.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                                    {filteredMedia.map(m => {
                                        const type = getMediaTypeLabel(m.mime_type);
                                        const isSelected = selectedId === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    setSelectedId(m.id);
                                                    handleSelect(m);
                                                }}
                                                className={`text-left p-2 rounded-lg border transition-all cursor-pointer hover:border-primary/40 ${isSelected ? "border-primary ring-2 ring-primary/20" : ""}`}
                                            >
                                                {type === "image" && m.url ? (
                                                    <div className="h-16 w-full rounded-md bg-muted mb-1 overflow-hidden">
                                                        <img src={m.url} alt={m.original_name} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="h-16 w-full rounded-md bg-muted mb-1 flex items-center justify-center text-muted-foreground">
                                                        {getMediaIcon(m.mime_type)}
                                                    </div>
                                                )}
                                                <p className="text-[10px] font-semibold truncate">{m.original_name}</p>
                                                <p className="text-[9px] text-muted-foreground">{formatBytes(m.file_size)}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Dialog>
        </>
    );
}
