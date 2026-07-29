"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Search, Clock, Play, BookOpen, Film, FileText,
    Monitor, Headphones, Eye, Layers,
} from "lucide-react";
import { useMaterials } from "@/lib/api";

const getFormat = (fmt: string) => {
    const map: Record<string, { icon: any; label: string; color: string }> = {
        VIDEO: { icon: Film, label: "Video", color: "text-rose-500 bg-rose-500/10" },
        PDF: { icon: FileText, label: "PDF", color: "text-red-500 bg-red-500/10" },
        MARKDOWN: { icon: BookOpen, label: "Markdown", color: "text-blue-500 bg-blue-500/10" },
        RICH_TEXT: { icon: Monitor, label: "Rich Text", color: "text-indigo-500 bg-indigo-500/10" },
        TEXT: { icon: FileText, label: "Text", color: "text-muted-foreground bg-muted/30" },
        AUDIO: { icon: Headphones, label: "Audio", color: "text-emerald-500 bg-emerald-500/10" },
        INTERACTIVE: { icon: Monitor, label: "Interaktif", color: "text-purple-500 bg-purple-500/10" },
    };
    return (map[fmt] ?? map.TEXT)!;
};

export default function StudentMaterialsPage() {
    const [search, setSearch] = React.useState("");
    const [selectedSubject, setSelectedSubject] = React.useState("ALL");

    const { data: materialsData, isLoading } = useMaterials({ status: "PUBLISHED" }) as any;

    const materials = materialsData ?? [];

    const subjectNames = React.useMemo(() => {
        const names = [...new Set(materials.map((m: any) => m.subject_name).filter(Boolean))] as string[];
        names.sort();
        return names;
    }, [materials]);

    const filtered = materials.filter((m: any) => {
        const title = m.title || "";
        const subject = m.subject_name || "";
        const chapter = m.chapter_name || "";
        const matchSearch = title.toLowerCase().includes(search.toLowerCase()) ||
            subject.toLowerCase().includes(search.toLowerCase()) ||
            chapter.toLowerCase().includes(search.toLowerCase());
        const matchSubject = selectedSubject === "ALL" || subject === selectedSubject;
        return matchSearch && matchSubject;
    });

    const grouped = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        filtered.forEach((m: any) => {
            const key = m.subject_name || "Lainnya";
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });
        const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
        return sorted;
    }, [filtered]);

    const totalReads = materials.reduce((sum: number, m: any) => sum + (m.read_count || 0), 0);

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">MATERI LEARNING HUB</Badge>
                        <span className="text-xs text-muted-foreground">{materials.length} Modul &bull; {totalReads.toLocaleString()} Dibaca</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Materi Pembelajaran</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Akses modul, video, PDF, dan rangkuman materi per mata pelajaran.
                    </p>
                </div>
            </div>

            {/* Search & Filter */}
            <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari judul, mata pelajaran, bab..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    <Button
                        key="ALL"
                        variant={selectedSubject === "ALL" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSubject("ALL")}
                        className="text-[11px] font-semibold shrink-0 h-8"
                    >
                        Semua
                    </Button>
                    {subjectNames.map((sub: string) => (
                        <Button
                            key={sub}
                            variant={selectedSubject === sub ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSubject(sub)}
                            className="text-[11px] font-semibold shrink-0 h-8"
                        >
                            {sub}
                        </Button>
                    ))}
                </div>
            </Card>

            {/* Materials Grid Grouped by Subject */}
            {isLoading ? (
                <div className="p-12 text-center text-xs text-muted-foreground">Memuat modul dari database...</div>
            ) : grouped.length > 0 ? (
                <div className="space-y-10">
                    {grouped.map(([subject, items]) => (
                        <section key={subject}>
                            <div className="flex items-center gap-3 mb-4">
                                <h2 className="text-lg font-black tracking-tight">{subject}</h2>
                                <Badge variant="outline" className="text-[10px]">{items.length} Modul</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {items.map((m: any) => {
                                    const fmt = getFormat(m.content_format);
                                    const Icon = fmt.icon;
                                    return (
                                        <Card key={m.id} className="p-5 flex flex-col hover:border-primary/40 hover:shadow-md transition-all group">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div className={`p-1.5 rounded-lg ${fmt.color}`}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <Badge variant="outline" className="text-[9px] font-mono">
                                                        {fmt.label}
                                                    </Badge>
                                                </div>
                                                {m.chapter_name && (
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                        <Layers className="h-3 w-3" />
                                                        {m.chapter_name}
                                                    </div>
                                                )}
                                                <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors">
                                                    {m.title}
                                                </h3>
                                            </div>
                                            <div className="pt-4 mt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex items-center gap-3">
                                                    {m.estimated_duration && (
                                                        <span className="flex items-center gap-1 font-semibold">
                                                            <Clock className="h-3.5 w-3.5 text-primary" /> {m.estimated_duration} Menit
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 text-[10px]">
                                                        <Eye className="h-3 w-3" /> {m.read_count?.toLocaleString() || 0}
                                                    </span>
                                                </div>
                                                <Link href={`/student/materials/${m.id}`} scroll={false}>
                                                    <Button size="sm" className="h-7 text-xs font-bold">
                                                        Buka <Play className="ml-1 h-3 w-3 fill-primary-foreground" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center space-y-3">
                    <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
                    <h3 className="font-bold text-sm">Tidak ada modul ditemukan</h3>
                    <p className="text-xs text-muted-foreground">
                        {search || selectedSubject !== "ALL"
                            ? "Coba ubah kata kunci pencarian atau filter mata pelajaran."
                            : "Belum ada materi pembelajaran yang tersedia."}
                    </p>
                </Card>
            )}
        </div>
    );
}
