// frontend/src/app/(siswa)/materials/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/auth.store";
import { academicService } from "@/services/academic.service";
import { Material } from "@/types";
import { GradeBadge } from "@/components/siswa/GradeBadge";
import { BookOpen, Search, Clock, ArrowRight, CheckCircle2, Sparkles, Layers, Zap } from "lucide-react";

interface SubjectSummary {
    name: string;
    total: number;
    completed: number;
    iconColor: string;
}

const SUBJECT_SUMMARIES: SubjectSummary[] = [
    { name: "Penalaran Matematika", total: 12, completed: 8, iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    { name: "Literasi Bahasa Indonesia", total: 10, completed: 6, iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { name: "Penalaran Umum", total: 15, completed: 11, iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    { name: "Pengetahuan Kuantitatif", total: 14, completed: 5, iconColor: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
];

export default function MaterialsPage() {
    const { user } = useAuthStore();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [selectedSubject, setSelectedSubject] = useState("ALL");

    useEffect(() => {
        async function load() {
            try {
                const res = await academicService.getMaterials();
                setMaterials(res);
            } catch {
                setMaterials([
                    {
                        id: "m-1",
                        title: "Konsep Dasar Penalaran Matematika UTBK",
                        subject_name: "Penalaran Matematika",
                        category: "TEORI",
                        reading_time_minutes: 15,
                        description: "Penalaran matematika menguji kemampuan logika kuantitatif dan analisis pola data.",
                        content: "Penalaran matematika menguji kemampuan logika kuantitatif...",
                        is_completed: true,
                    },
                    {
                        id: "m-2",
                        title: "Strategi Memahami Teks Bahasa Indonesia SNBT",
                        subject_name: "Literasi Bahasa Indonesia",
                        category: "STRATEGI",
                        reading_time_minutes: 20,
                        description: "Trik cepat menganalisis ide pokok wacana dan kesimpulan paragraf.",
                        content: "Ide pokok paragraf merupakan inti dari sebuah wacana...",
                        is_completed: false,
                    },
                    {
                        id: "m-3",
                        title: "Trik Cepat Soal Penalaran Umum (Kuantitatif)",
                        subject_name: "Penalaran Umum",
                        category: "TRIK_CEPAT",
                        reading_time_minutes: 10,
                        description: "Pola deret angka, kecukupan data, dan logika penarikan kesimpulan.",
                        content: "Pola deret angka dan hubungan antar kuantitas...",
                        is_completed: false,
                    },
                    {
                        id: "m-4",
                        title: "Rangkuman Rumus Cepat Pengetahuan Kuantitatif",
                        subject_name: "Pengetahuan Kuantitatif",
                        category: "RANGKUMAN",
                        reading_time_minutes: 25,
                        description: "Rangkuman lengkap ALJABAR, GEOMETRI, dan STATISTIKA UTBK 2026.",
                        content: "Matriks dasar, trigonometri sederhana, dan kombinatorika...",
                        is_completed: true,
                    },
                ]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filtered = materials.filter((m) => {
        const subName = m.subject_name || "";
        const catName = m.category || "TEORI";

        const matchSearch =
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            subName.toLowerCase().includes(search.toLowerCase()) ||
            (m.description && m.description.toLowerCase().includes(search.toLowerCase()));

        const matchSubject = selectedSubject === "ALL" || subName === selectedSubject;
        const matchCategory = selectedCategory === "ALL" || catName === selectedCategory;

        return matchSearch && matchSubject && matchCategory;
    });

    return (
        <AppShell>
            <div className="space-y-8">
                {/* Header & Grade Level Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="font-heading text-2xl font-bold tracking-tight">Modul Belajar & Teori UTBK</h1>
                            <GradeBadge educationLevel={user?.education_level} grade={user?.grade} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Kumpulan konsep dasar, rangkuman rumus, dan trik cepat per mata pelajaran.
                        </p>
                    </div>
                </div>

                {/* Subject Summary Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SUBJECT_SUMMARIES.map((sub) => {
                        const pct = Math.round((sub.completed / sub.total) * 100);
                        const isSelected = selectedSubject === sub.name;

                        return (
                            <Card
                                key={sub.name}
                                onClick={() => setSelectedSubject(isSelected ? "ALL" : sub.name)}
                                className={`cursor-pointer transition-all hover:border-primary border-2 ${isSelected ? "border-primary bg-primary/5 shadow-xs" : "border-border/60"}`}
                            >
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-center justify-between">
                                        <span className={`p-2 rounded-xl border font-bold ${sub.iconColor}`}>
                                            <BookOpen className="h-4 w-4" />
                                        </span>
                                        <Badge variant="outline" className="text-[10px]">
                                            {sub.completed}/{sub.total} Selesai
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-sm font-bold mt-2 line-clamp-1">{sub.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-1 space-y-2">
                                    <Progress value={pct} className="h-2" />
                                    <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                                        <span>Progres Belajar</span>
                                        <span className="text-primary font-semibold">{pct}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        {[
                            { key: "ALL", label: "Semua Kategori" },
                            { key: "TEORI", label: "Teori Dasar" },
                            { key: "STRATEGI", label: "Strategi Soal" },
                            { key: "TRIK_CEPAT", label: "Trik Cepat" },
                            { key: "RANGKUMAN", label: "Rangkuman Bab" },
                        ].map((cat) => (
                            <Button
                                key={cat.key}
                                variant={selectedCategory === cat.key ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(cat.key)}
                                className="rounded-xl text-xs font-medium whitespace-nowrap"
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari materi atau topik..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-xs rounded-xl"
                        />
                    </div>
                </div>

                {/* Material Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((m) => (
                        <Card key={m.id} className="flex flex-col justify-between hover:border-primary transition-all group">
                            <CardHeader className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary" className="text-[10px] font-semibold">
                                        {m.subject_name}
                                    </Badge>
                                    {m.is_completed ? (
                                        <Badge variant="success" className="gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                            <CheckCircle2 className="h-3 w-3" /> Selesai
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/20">
                                            Belum Dibaca
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-base font-bold line-clamp-2 group-hover:text-primary transition-colors">
                                    {m.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 text-xs">
                                    {m.description || m.content}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-4">
                                <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <Clock className="h-3.5 w-3.5 text-primary" /> {m.reading_time_minutes} menit baca
                                    </span>
                                    <Button asChild size="sm" variant="default" className="rounded-xl text-xs gap-1 font-medium shadow-xs">
                                        <Link href={`/materials/${m.id}`}>
                                            Baca Materi <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}
