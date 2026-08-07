"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { academicService } from "@/services/academic.service";
import { Material } from "@/types";
import { BookOpen, Search, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
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
                        content: "Penalaran matematika menguji kemampuan logika kuantitatif...",
                        is_completed: true,
                    },
                    {
                        id: "m-2",
                        title: "Strategi Memahami Teks Bahasa Indonesia SNBT",
                        subject_name: "Literasi Bahasa Indonesia",
                        category: "STRATEGI",
                        reading_time_minutes: 20,
                        content: "Ide pokok paragraf merupakan inti dari sebuah wacana...",
                        is_completed: false,
                    },
                    {
                        id: "m-3",
                        title: "Trik Cepat Soal Penalaran Umum (Kuantitatif)",
                        subject_name: "Penalaran Umum",
                        category: "TRIK_CEPAT",
                        reading_time_minutes: 10,
                        content: "Pola deret angka dan hubungan antar kuantitas...",
                        is_completed: false,
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
        const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) || subName.toLowerCase().includes(search.toLowerCase());
        const matchSubject = selectedSubject === "ALL" || subName === selectedSubject;
        return matchSearch && matchSubject;
    });

    return (
        <AppShell>
            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Modul Belajar & Teori UTBK</h1>
                    <p className="text-sm text-muted-foreground">Pelajari konsep dasar, rangkuman teori, dan trik cepat per mata pelajaran.</p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari judul materi atau subjek..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        {["ALL", "Penalaran Matematika", "Literasi Bahasa Indonesia", "Penalaran Umum"].map((sub) => (
                            <Button
                                key={sub}
                                variant={selectedSubject === sub ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedSubject(sub)}
                                className="rounded-xl whitespace-nowrap text-xs"
                            >
                                {sub === "ALL" ? "Semua Subjek" : sub}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Material Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((m) => (
                        <Card key={m.id} className="flex flex-col justify-between hover:border-primary transition-all">
                            <CardHeader className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary" className="text-[10px]">
                                        {m.subject_name}
                                    </Badge>
                                    {m.is_completed && (
                                        <Badge variant="success" className="gap-1 text-[10px]">
                                            <CheckCircle2 className="h-3 w-3" /> Selesai
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-base line-clamp-2">{m.title}</CardTitle>
                                <CardDescription className="line-clamp-2">{m.content}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex items-center justify-between pt-4 border-t border-border mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" /> {m.reading_time_minutes} menit baca
                                    </span>
                                    <Button asChild size="sm" variant="ghost" className="text-primary gap-1 p-0 hover:bg-transparent">
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
