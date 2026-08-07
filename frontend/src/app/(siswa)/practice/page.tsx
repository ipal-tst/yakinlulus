// frontend/src/app/(siswa)/practice/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth.store";
import { GradeBadge } from "@/components/siswa/GradeBadge";
import { academicService } from "@/services/academic.service";
import { Exam, Material } from "@/types";
import {
    PenTool,
    Target,
    Flame,
    Award,
    BookOpen,
    Search,
    Clock,
    ArrowRight,
    CheckCircle2,
    Zap,
    HelpCircle,
    Play,
    Sparkles,
    Inbox,
} from "lucide-react";

interface PracticeItem {
    id: string;
    title: string;
    subject_name: string;
    type: "SUBJECT" | "TOPIC" | "ADMIN_DRILL";
    difficulty: "EASY" | "MEDIUM" | "HARD" | "HOTS";
    total_questions: number;
    estimated_minutes: number;
    is_hot?: boolean;
    author?: string;
    description?: string;
}

export default function PracticePage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<"SUBJECT" | "TOPIC" | "ADMIN_DRILL">("SUBJECT");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
    const [selectedPractice, setSelectedPractice] = useState<PracticeItem | null>(null);
    const [selectedMode, setSelectedMode] = useState<"SANTAI" | "SIMULASI">("SANTAI");

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Fetch real data from backend API
                const [examsRes, materialsRes] = await Promise.allSettled([
                    academicService.getExams(),
                    academicService.getMaterials(),
                ]);

                const items: PracticeItem[] = [];

                if (examsRes.status === "fulfilled" && Array.isArray(examsRes.value)) {
                    examsRes.value.forEach((exam: Exam) => {
                        const isDrill = exam.category === "UJIAN_BAB" || exam.category === "UJIAN_HARIAN";
                        items.push({
                            id: exam.id,
                            title: exam.title,
                            subject_name: exam.category ? exam.category.replace(/_/g, " ") : "Paket Latihan",
                            type: isDrill ? "ADMIN_DRILL" : "SUBJECT",
                            difficulty: exam.total_questions > 20 ? "HOTS" : "MEDIUM",
                            total_questions: exam.total_questions || 10,
                            estimated_minutes: exam.duration_minutes || 15,
                            description: exam.description || "Latihan soal terstandar sesuai kurikulum.",
                            author: "Tim Akademik Admin",
                        });
                    });
                }

                if (materialsRes.status === "fulfilled" && Array.isArray(materialsRes.value)) {
                    materialsRes.value.forEach((mat: Material) => {
                        items.push({
                            id: mat.id,
                            title: `Latihan: ${mat.title}`,
                            subject_name: mat.subject_name || "Materi Pelajaran",
                            type: "TOPIC",
                            difficulty: "MEDIUM",
                            total_questions: 10,
                            estimated_minutes: mat.estimated_duration || mat.reading_time_minutes || 15,
                            description: mat.description || mat.body || "Latihan soal per materi untuk pemantapan konsep.",
                        });
                    });
                }

                setPracticeItems(items);
            } catch {
                // If API fails or yields 0 items, set empty array to match DB exactly
                setPracticeItems([]);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    const filteredItems = practiceItems.filter((item) => {
        const matchType = item.type === activeTab;
        const matchSearch =
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.subject_name.toLowerCase().includes(search.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
        return matchType && matchSearch;
    });

    const handleStartPractice = () => {
        if (!selectedPractice) return;
        router.push(`/exams?id=${selectedPractice.id}`);
        setSelectedPractice(null);
    };

    return (
        <AppShell>
            <div className="space-y-8">
                {/* Header & Student Context */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="font-heading text-2xl font-bold tracking-tight">Pusat Latihan Soal & Drill</h1>
                            <GradeBadge educationLevel={user?.education_level} grade={user?.grade} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Asah kemampuan dengan latihan soal per mapel, per materi, dan paket drill khusus buatan Admin.
                        </p>
                    </div>
                </div>

                {/* Summary Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 flex items-center gap-3 border-border/70">
                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                            <PenTool className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Soal Dikerjakan</p>
                            <h4 className="text-lg font-bold">0 Soal</h4>
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center gap-3 border-border/70">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                            <Target className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Akurasi Jawaban</p>
                            <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">0%</h4>
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center gap-3 border-border/70">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                            <Flame className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Drill Streak</p>
                            <h4 className="text-lg font-bold text-amber-600 dark:text-amber-400">0 Hari</h4>
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center gap-3 border-border/70">
                        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 font-bold border border-purple-500/20">
                            <Award className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Total Skor Latihan</p>
                            <h4 className="text-lg font-bold text-purple-600 dark:text-purple-400">0 Pts</h4>
                        </div>
                    </Card>
                </div>

                {/* Filter Bar: Category Tabs & Search */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        <Button
                            variant={activeTab === "SUBJECT" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("SUBJECT")}
                            className="rounded-xl text-xs font-semibold gap-1.5 whitespace-nowrap"
                        >
                            <BookOpen className="h-3.5 w-3.5" /> Latihan Per Mapel
                        </Button>
                        <Button
                            variant={activeTab === "TOPIC" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("TOPIC")}
                            className="rounded-xl text-xs font-semibold gap-1.5 whitespace-nowrap"
                        >
                            <Zap className="h-3.5 w-3.5" /> Latihan Per Materi/Bab
                        </Button>
                        <Button
                            variant={activeTab === "ADMIN_DRILL" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveTab("ADMIN_DRILL")}
                            className="rounded-xl text-xs font-semibold gap-1.5 whitespace-nowrap"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Drill Spesial Admin
                        </Button>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari modul latihan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-xs rounded-xl"
                        />
                    </div>
                </div>

                {/* Practice Items Cards Grid / Empty State */}
                {loading ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                        Memuat data latihan dari database...
                    </div>
                ) : filteredItems.length === 0 ? (
                    <Card className="p-12 text-center space-y-4 border-dashed border-2 border-border/80">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                            <Inbox className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-base">Belum Ada Soal Latihan</h3>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                Tidak ada modul latihan yang tersedia di database untuk kategori ini saat ini. Silakan cek kembali nanti atau pilih tab lain.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <Card key={item.id} className="flex flex-col justify-between hover:border-primary transition-all group border-border/80">
                                <CardHeader className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="secondary" className="text-[10px] font-semibold">
                                            {item.subject_name}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] font-bold ${item.difficulty === "HOTS"
                                                    ? "text-purple-600 border-purple-500/30"
                                                    : item.difficulty === "HARD"
                                                        ? "text-red-500 border-red-500/30"
                                                        : item.difficulty === "MEDIUM"
                                                            ? "text-amber-600 border-amber-500/30"
                                                            : "text-emerald-600 border-emerald-500/30"
                                                }`}
                                        >
                                            {item.difficulty}
                                        </Badge>
                                    </div>

                                    <CardTitle className="text-base font-bold line-clamp-2 group-hover:text-primary transition-colors">
                                        {item.title}
                                    </CardTitle>

                                    {item.description && (
                                        <CardDescription className="line-clamp-2 text-xs">
                                            {item.description}
                                        </CardDescription>
                                    )}

                                    {item.author && (
                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1 font-medium">
                                            <span>Dibuat oleh:</span>
                                            <span className="text-foreground font-semibold">{item.author}</span>
                                        </div>
                                    )}
                                </CardHeader>

                                <CardContent className="pt-0 space-y-4">
                                    <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1 font-medium">
                                            <HelpCircle className="h-3.5 w-3.5 text-primary" /> {item.total_questions} Soal
                                        </span>
                                        <span className="flex items-center gap-1 font-medium">
                                            <Clock className="h-3.5 w-3.5 text-primary" /> {item.estimated_minutes} Menit
                                        </span>
                                    </div>

                                    <Button
                                        onClick={() => setSelectedPractice(item)}
                                        className="w-full rounded-xl text-xs gap-1.5 font-semibold shadow-xs"
                                    >
                                        <Play className="h-3.5 w-3.5 fill-current" /> Mulai Latihan
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Dialog Confirmation Launcher */}
            <Dialog open={!!selectedPractice} onOpenChange={() => setSelectedPractice(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-[10px]">
                                {selectedPractice?.subject_name}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                                {selectedPractice?.difficulty}
                            </Badge>
                        </div>
                        <DialogTitle className="text-lg font-bold">{selectedPractice?.title}</DialogTitle>
                        <DialogDescription className="text-xs">
                            {selectedPractice?.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/50 text-xs">
                            <div>
                                <span className="text-muted-foreground">Jumlah Soal:</span>
                                <p className="font-bold text-sm text-foreground">{selectedPractice?.total_questions} Soal</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Estimasi Waktu:</span>
                                <p className="font-bold text-sm text-foreground">{selectedPractice?.estimated_minutes} Menit</p>
                            </div>
                        </div>

                        {/* Mode Pengerjaan Option */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground">Pilih Mode Pengerjaan:</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    onClick={() => setSelectedMode("SANTAI")}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedMode === "SANTAI" ? "border-primary bg-primary/5 font-bold" : "border-border/60"
                                        }`}
                                >
                                    <p className="text-xs font-semibold">Mode Santai</p>
                                    <p className="text-[10px] text-muted-foreground font-normal">Pembahasan langsung setelah menjawab.</p>
                                </div>

                                <div
                                    onClick={() => setSelectedMode("SIMULASI")}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedMode === "SIMULASI" ? "border-primary bg-primary/5 font-bold" : "border-border/60"
                                        }`}
                                >
                                    <p className="text-xs font-semibold">Mode Simulasi Ujian</p>
                                    <p className="text-[10px] text-muted-foreground font-normal">Timer berjalan, nilai di akhir.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setSelectedPractice(null)} className="rounded-xl text-xs">
                            Batal
                        </Button>
                        <Button size="sm" onClick={handleStartPractice} className="rounded-xl text-xs font-semibold gap-1.5">
                            <Play className="h-3.5 w-3.5 fill-current" /> Mulai Pengerjaan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
}
