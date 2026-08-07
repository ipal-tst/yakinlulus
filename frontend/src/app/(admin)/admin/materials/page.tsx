"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { academicService } from "@/services/academic.service";
import { Material } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaterialStatsBar } from "@/components/admin/materials/material-stats-bar";
import { MaterialFilterBar, MaterialFilterState } from "@/components/admin/materials/material-filter-bar";
import { MaterialPreviewDialog } from "@/components/admin/materials/MaterialPreviewDialog";
import {
    BookOpen,
    Clock,
    Eye,
    FileEdit,
    Trash2,
    CheckCircle2,
    Video,
    FileText,
    Sparkles,
} from "lucide-react";

export default function AdminMaterialsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Filters state
    const [filters, setFilters] = useState<MaterialFilterState>({
        search: "",
        subject: "ALL",
        category: "ALL",
        status: "ALL",
    });

    // Preview Dialog State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewItem, setPreviewItem] = useState<Material | null>(null);

    // Initial mock backup materials
    const mockMaterials: Material[] = [
        {
            id: "m-1",
            title: "Konsep Dasar & Formula Cepat Penalaran Matematika UTBK",
            subject_name: "Penalaran Matematika",
            category: "TEORI",
            reading_time_minutes: 15,
            content: "Penalaran matematika menguji kemampuan logika kuantitatif. Pahami persamaan kuadrat, deret aritmatika, dan interpretasi grafik data secara cepat.\n\n$$f(x) = ax^2 + bx + c$$\n\nSifat diskriminan $D = b^2 - 4ac$ menentukan akar real.",
            status: "PUBLISHED",
            is_completed: true,
            created_at: new Date().toISOString(),
        },
        {
            id: "m-2",
            title: "Strategi Memahami Teks & Gagasan Utama Bahasa Indonesia SNBT",
            subject_name: "Literasi Bahasa Indonesia",
            category: "STRATEGI",
            reading_time_minutes: 20,
            content: "Ide pokok paragraf merupakan inti dari sebuah wacana. Tentukan kalimat utama di awal (deduktif) atau di akhir (induktif) dengan cepat tanpa membaca ulang seluruh paragraf.",
            status: "PUBLISHED",
            is_completed: false,
            created_at: new Date().toISOString(),
        },
        {
            id: "m-3",
            title: "Trik Cepat Soal Penalaran Umum & Pola Barisan Angka",
            subject_name: "Penalaran Umum",
            category: "TRIK_CEPAT",
            reading_time_minutes: 10,
            content: "Pola deret angka bertingkat dan hubungan kuantitas $P$ vs $Q$. Gunakan eliminasi opsi ekstrem untuk menghemat waktu ujian.",
            status: "DRAFT",
            is_completed: false,
            created_at: new Date().toISOString(),
        },
        {
            id: "m-4",
            title: "Rangkuman Hukum Newton & Dinamika Gerak Lurus",
            subject_name: "Fisika",
            category: "TEORI",
            reading_time_minutes: 25,
            content: "Hukum II Newton $\\Sigma F = m \\cdot a$. Analisis diagram gaya bebas pada bidang miring licin dan kasar.",
            status: "PUBLISHED",
            is_completed: false,
            created_at: new Date().toISOString(),
        },
    ];

    // Data Fetching Query
    const { data: fetchedMaterials = [], isLoading } = useQuery({
        queryKey: ["admin-materials-list"],
        queryFn: async () => {
            try {
                const res = await academicService.getMaterials();
                return Array.isArray(res) && res.length > 0 ? res : mockMaterials;
            } catch {
                return mockMaterials;
            }
        },
    });

    const materials = fetchedMaterials.length > 0 ? fetchedMaterials : mockMaterials;

    // Filter Logic
    const filteredMaterials = materials.filter((m) => {
        const titleMatch = (m.title || "").toLowerCase().includes(filters.search.toLowerCase());
        const contentMatch = (m.content || "").toLowerCase().includes(filters.search.toLowerCase());
        const searchMatch = titleMatch || contentMatch;

        const subjectMatch =
            filters.subject === "ALL" || (m.subject_name || "") === filters.subject;
        const categoryMatch =
            filters.category === "ALL" || (m.category || "") === filters.category;
        const statusMatch =
            filters.status === "ALL" || (m.status || "PUBLISHED") === filters.status;

        return searchMatch && subjectMatch && categoryMatch && statusMatch;
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            try {
                await academicService.deleteMaterial(id);
            } catch {
                // ignore
            }
            return id;
        },
        onSuccess: (deletedId) => {
            queryClient.setQueryData(["admin-materials-list"], (old: Material[] = []) =>
                old.filter((m) => m.id !== deletedId)
            );
        },
    });

    // Handlers navigating to Full Pages
    const handleOpenCreate = () => {
        router.push("/admin/materials/create");
    };

    const handleOpenEdit = (item: Material) => {
        router.push(`/admin/materials/${item.id}/edit`);
    };

    const handleOpenImport = () => {
        router.push("/admin/materials/import");
    };

    const handleOpenPreview = (item: Material) => {
        setPreviewItem(item);
        setIsPreviewOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus modul materi belajar ini?")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <AppShell>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-heading text-2xl font-bold tracking-tight">
                                Kelola Materi Pelajaran
                            </h1>
                            <Badge variant="secondary" className="gap-1 font-mono text-xs">
                                <Sparkles className="h-3 w-3 text-primary" /> Authoring Hub
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Pusat pengeloaan modul rangkuman teori, strategi belajar, dan trik cepat terintegrasi database master akademik.
                        </p>
                    </div>
                </div>

                {/* Stat Bar */}
                <MaterialStatsBar materials={materials} />

                {/* Filter & Search Bar */}
                <MaterialFilterBar
                    filters={filters}
                    onFilterChange={setFilters}
                    onOpenAuthoring={handleOpenCreate}
                    onOpenImport={handleOpenImport}
                />

                {/* Material Grid List */}
                {isLoading ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                        Memuat daftar modul materi belajar...
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="py-16 border-2 border-dashed border-border rounded-2xl text-center space-y-3 bg-muted/20">
                        <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
                        <div>
                            <p className="font-bold text-sm text-foreground">Tidak Ada Modul Materi Ditemukan</p>
                            <p className="text-xs text-muted-foreground">Coba sesuaikan pencarian atau kata kunci filter Anda.</p>
                        </div>
                        <Button size="sm" onClick={handleOpenCreate} className="rounded-xl text-xs gap-1.5">
                            Tulis Materi Baru
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredMaterials.map((m) => (
                            <Card
                                key={m.id}
                                className="flex flex-col justify-between hover:border-primary/50 transition-all border-border/80 rounded-2xl shadow-2xs group"
                            >
                                <CardHeader className="space-y-2.5 p-5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Badge variant="secondary" className="text-[10px] font-semibold">
                                                {m.subject_name || "Umum"}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px]">
                                                {m.category === "TRIK_CEPAT"
                                                    ? "Trik Cepat"
                                                    : m.category === "STRATEGI"
                                                        ? "Strategi"
                                                        : "Teori"}
                                            </Badge>
                                        </div>

                                        <Badge
                                            variant={m.status === "DRAFT" ? "warning" : "success"}
                                            className="text-[10px] gap-1"
                                        >
                                            <CheckCircle2 className="h-3 w-3" />
                                            {m.status === "DRAFT" ? "Draf" : "Terpublikasi"}
                                        </Badge>
                                    </div>

                                    <CardTitle className="text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                        {m.title}
                                    </CardTitle>

                                    <CardDescription className="line-clamp-3 text-xs leading-relaxed">
                                        {m.content}
                                    </CardDescription>

                                    {/* Media badges indicators */}
                                    {(m.video_url || m.pdf_url) && (
                                        <div className="flex items-center gap-2 pt-1">
                                            {m.video_url && (
                                                <Badge variant="outline" className="text-[10px] gap-1 text-blue-600 border-blue-200 bg-blue-50">
                                                    <Video className="h-3 w-3" /> Video
                                                </Badge>
                                            )}
                                            {m.pdf_url && (
                                                <Badge variant="outline" className="text-[10px] gap-1 text-purple-600 border-purple-200 bg-purple-50">
                                                    <FileText className="h-3 w-3" /> PDF
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </CardHeader>

                                <CardContent className="pt-0 p-5">
                                    <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1 font-medium">
                                            <Clock className="h-3.5 w-3.5" /> {m.reading_time_minutes || 15} mnt baca
                                        </span>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleOpenPreview(m)}
                                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary"
                                                title="Pratinjau Tampilan Siswa"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleOpenEdit(m)}
                                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary"
                                                title="Edit Materi (Halaman Utuh)"
                                            >
                                                <FileEdit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(m.id)}
                                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                                                title="Hapus Modul"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Student LMS Preview Simulator */}
            <MaterialPreviewDialog
                item={previewItem}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
            />
        </AppShell>
    );
}
