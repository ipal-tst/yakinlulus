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
    Star,
    Play,
    Sparkles,
    ShieldAlert,
} from "lucide-react";

interface PracticeItem {
    id: string;
    title: string;
    subject_name: string;
    type: "SUBJECT" | "TOPIC" | "ADMIN_DRILL";
    difficulty: "EASY" | "MEDIUM" | "HARD" | "HOTS";
    total_questions: number;
    estimated_minutes: number;
    completion_rate?: number;
    is_hot?: boolean;
    author?: string;
    description?: string;
}

export default function PracticePage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<"SUBJECT" | "TOPIC" | "ADMIN_DRILL">("SUBJECT");
    const [search, setSearch] = useState("");
    const [selectedPractice, setSelectedPractice] = useState<PracticeItem | null>(null);
    const [selectedMode, setSelectedMode] = useState<"SANTAI" | "SIMULASI">("SANTAI");

    // Practice items catalog (per mapel, per materi, drill admin)
    const practiceItems: PracticeItem[] = [
        // Per Mapel
        {
            id: "p-sub-1",
            title: "Latihan Intensif Penalaran Matematika",
            subject_name: "Penalaran Matematika",
            type: "SUBJECT",
            difficulty: "MEDIUM",
            total_questions: 20,
            estimated_minutes: 25,
            completion_rate: 65,
            is_hot: true,
            description: "Bank latihan lengkap logika kuantitatif, analisis grafik, dan aljabar cerita.",
        },
        {
            id: "p-sub-2",
            title: "Latihan Kilat Literasi Bahasa Indonesia",
            subject_name: "Literasi Bahasa Indonesia",
            type: "SUBJECT",
            difficulty: "EASY",
            total_questions: 15,
            estimated_minutes: 20,
            completion_rate: 80,
            description: "Pemantapan membaca wacana, kalimat efektif, dan penarikan kesimpulan teks.",
        },
        {
            id: "p-sub-3",
            title: "Mastery Drill Penalaran Umum",
            subject_name: "Penalaran Umum",
            type: "SUBJECT",
            difficulty: "HARD",
            total_questions: 25,
            estimated_minutes: 30,
            completion_rate: 50,
            is_hot: true,
            description: "Soal penalaran induktif, deduktif, dan kuantitatif tingkat tinggi.",
        },
        {
            id: "p-sub-4",
            title: "Latihan Pengetahuan Kuantitatif",
            subject_name: "Pengetahuan Kuantitatif",
            type: "SUBJECT",
            difficulty: "HOTS",
            total_questions: 20,
            estimated_minutes: 25,
            completion_rate: 40,
            description: "Soal kuantitatif aljabar, geometri, dan statistika standar SNBT.",
        },

        // Per Materi / Bab
        {
            id: "p-top-1",
            title: "Drill Bab 1: Deret Angka & Pola Bilangan",
            subject_name: "Penalaran Umum",
            type: "TOPIC",
            difficulty: "MEDIUM",
            total_questions: 10,
            estimated_minutes: 12,
            completion_rate: 90,
            description: "Latihan khusus menguasai pola deret bertingkat, deret huruf, dan matriks angka.",
        },
        {
            id: "p-top-2",
            title: "Drill Bab 2: Ide Pokok & Simpulan Paragraf",
            subject_name: "Literasi Bahasa Indonesia",
            type: "TOPIC",
            difficulty: "EASY",
            total_questions: 10,
            estimated_minutes: 15,
            completion_rate: 85,
            description: "Trik cepat menemukan kalimat utama dan simpulan implicit wacana panjang.",
        },
        {
            id: "p-top-3",
            title: "Drill Bab 3: Persamaan Linear & Pertidaksamaan",
            subject_name: "Penalaran Matematika",
            type: "TOPIC",
            difficulty: "HARD",
            total_questions: 12,
            estimated_minutes: 18,
            completion_rate: 60,
            description: "Penyelesaian sistem persamaan 2 variabel dan aplikasi soal cerita kuantitatif.",
        },

        // Drill Soal Spesial Admin
        {
            id: "p-adm-1",
            title: "🔥 Super Drill HOTS 15 Menit - UTBK 2026",
            subject_name: "Paket Mix UTBK",
            type: "ADMIN_DRILL",
            difficulty: "HOTS",
            total_questions: 15,
            estimated_minutes: 15,
            completion_rate: 35,
            is_hot: true,
            author: "Tim Pakar Akademik YakinLulus",
            description: "Drill cepat 15 soal tingkat tinggi pilihan langsung dari tim pengajar senior.",
        },
        {
            id: "p-adm-2",
            title: "⚡ Drill Kilat 10 Soal Penalaran Kuantitatif",
            subject_name: "Pengetahuan Kuantitatif",
            type: "ADMIN_DRILL",
            difficulty: "HARD",
            total_questions: 10,
            estimated_minutes: 10,
            completion_rate: 75,
            author: "Drs. Budi Santoso, M.Pd",
            description: "Trik penyelesaian cepat 10 soal kuantitatif favorit SNBT tahun lalu.",
        },
        {
            id: "p-adm-3",
            title: "🏆 Bank Soal Prediksi UTBK SNBT Gelombang 1",
            subject_name: "Campuran TPS",
            type: "ADMIN_DRILL",
            difficulty: "HOTS",
            total_questions: 30,
            estimated_minutes: 40,
            completion_rate: 25,
            is_hot: true,
            author: "Staf Akademik Pusat",
            description: "Prediksi kisi-kisi soal terakurat untuk persiapan ujian gelombang pertama.",
        },
    ];

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
        // Navigate to CBT engine session or exams launcher
        router.push(`/exams`);
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
                            <h4 className="text-lg font-bold">148 Soal</h4>
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center gap-3 border-border/70">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                            <Target className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Akurasi Jawaban</p>
                            <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">78.5%</h4>
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center gap-3 border-border/70">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                            <Flame className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Drill Streak</p>
                            <h4 className="text-lg font-bold text-amber-600 dark:text-amber-400">5 Hari</h4>
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center gap-3 border-border/70">
                        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 font-bold border border-purple-500/20">
                            <Award className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Total Skor Latihan</p>
                            <h4 className="text-lg font-bold text-purple-600 dark:text-purple-400">685 Pts</h4>
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

                {/* Practice Items Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <Card key={item.id} className="flex flex-col justify-between hover:border-primary transition-all group border-border/80">
                            <CardHeader className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary" className="text-[10px] font-semibold">
                                        {item.subject_name}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                        {item.is_hot && (
                                            <Badge variant="default" className="text-[10px] bg-red-500 text-white gap-1 px-1.5">
                                                <Flame className="h-3 w-3 fill-current" /> HOT
                                            </Badge>
                                        )}
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
