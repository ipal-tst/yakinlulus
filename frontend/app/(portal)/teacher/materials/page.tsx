"use client";

import * as React from "react";
import Link from "next/link";
import { useMaterials } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    BookOpen,
    Plus,
    Search,
    Filter,
    FileText,
    Video,
    Eye,
    Edit3,
    Trash2,
    CheckCircle2,
    Sparkles,
    Loader2,
    AlertCircle,
} from "lucide-react";

export default function TeacherMaterialsPage() {
    const { data: materialsData, isLoading, error } = useMaterials();
    const [searchQuery, setSearchQuery] = React.useState("");

    const filteredMaterials = React.useMemo(() => {
        if (!materialsData) return [];
        const arr = Array.isArray(materialsData) ? materialsData : [];
        return arr.filter((mat: any) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                (mat.title || "").toLowerCase().includes(q) ||
                (mat.code || mat.id || "").toLowerCase().includes(q)
            );
        });
    }, [materialsData, searchQuery]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p className="text-sm font-medium">Gagal memuat data materi</p>
                <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Header Command Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">TEACHER MATERIALS CMS</Badge>
                        <span className="text-xs text-muted-foreground">Go Backend: `internal/material`</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Materi Pembelajaran Guru</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kelola modul pembelajaran, upload PDF rangkuman, video tutorial HD, & AI Material Summary.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/teacher/materials/create">
                        <Button size="sm" className="text-xs font-bold shadow-md shadow-primary/20">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Upload Materi Baru
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-3 rounded-2xl border shadow-xs">
                <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Cari judul materi, sub-tes, atau kode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 text-xs h-9"
                    />
                </div>
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterials.map((mat: any) => (
                    <Card key={mat.id} className="p-5 flex flex-col justify-between hover:border-primary/40 transition-all space-y-4 shadow-xs">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="font-mono text-[10px]">{mat.code || mat.id.slice(0, 8)}</Badge>
                                <Badge
                                    variant={mat.status === "PUBLISHED" ? "success" : "secondary"}
                                    className="text-[10px]"
                                >
                                    {mat.status}
                                </Badge>
                            </div>
                            <h3 className="font-extrabold text-base text-foreground leading-snug">{mat.title}</h3>
                            <p className="text-xs text-muted-foreground">{mat.subject_id || mat.content_type} • {mat.grade_id}</p>
                        </div>

                        <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-semibold">
                                {mat.material?.content_format === "VIDEO" ? (
                                    <Video className="h-4 w-4 text-primary" />
                                ) : (
                                    <FileText className="h-4 w-4 text-info" />
                                )}
                                <span>{mat.material?.content_format || "TEXT"}</span>
                            </div>
                            <span className="text-muted-foreground font-mono">{mat.material?.read_count ?? 0} Dibaca</span>
                        </div>

                        <div className="pt-2 border-t flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="text-xs h-8">
                                <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Link href="/teacher/materials/create">
                                <Button size="sm" className="text-xs h-8 font-bold">
                                    <Eye className="h-3.5 w-3.5 mr-1" /> Pratinjau
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
