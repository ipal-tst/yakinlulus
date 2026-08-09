"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { StatsCard } from "@/components/data-display/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboardService } from "@/services/dashboard.service";
import { GuruDashboard } from "@/types/admin";
import { HelpCircle, FileCheck, BookOpen, Plus, FolderKanban } from "lucide-react";

export default function GuruDashboardPage() {
    const [data, setData] = useState<GuruDashboard | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await dashboardService.getTeacherDashboard();
                setData(res);
            } catch {
                setData({
                    total_questions: 1250,
                    active_exams: 8,
                    total_materials: 45,
                    recent_questions: [
                        {
                            id: "q-1",
                            subject_name: "Penalaran Matematika",
                            content_preview: "Diberikan matriks A dan B berukuran 2x2...",
                            difficulty: "HARD",
                            created_at: "2026-03-02",
                        },
                        {
                            id: "q-2",
                            subject_name: "Literasi Bahasa Indonesia",
                            content_preview: "Manakah gagasan utama paragraf ketiga di atas?",
                            difficulty: "MEDIUM",
                            created_at: "2026-03-01",
                        },
                    ],
                });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard Guru</h1>
                        <p className="text-sm text-muted-foreground">Kelola bank soal, ujian, materi pembelajaran, dan media.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild className="rounded-xl gap-2 font-medium">
                            <Link href="/guru/questions/create">
                                <Plus className="h-4 w-4" /> Buat Soal Baru
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatsCard
                        title="Total Bank Soal"
                        value={data?.total_questions || 0}
                        icon={HelpCircle}
                        trend={{ value: 12, label: "bulan ini" }}
                    />
                    <StatsCard
                        title="Ujian / Try Out Aktif"
                        value={data?.active_exams || 0}
                        icon={FileCheck}
                    />
                    <StatsCard
                        title="Materi Terpublikasi"
                        value={data?.total_materials || 0}
                        icon={BookOpen}
                    />
                </div>

                {/* Recent Questions List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-primary" /> Soal Terakhir Ditambahkan
                            </CardTitle>
                            <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
                                <Link href="/guru/questions">Kelola Bank Soal</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {data?.recent_questions && data.recent_questions.length > 0 ? (
                            <div className="space-y-3">
                                {data.recent_questions.map((q) => (
                                    <div
                                        key={q.id}
                                        className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/60 hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="space-y-1 max-w-xl">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {q.subject_name}
                                                </Badge>
                                                <Badge
                                                    variant={
                                                        q.difficulty === "HARD"
                                                            ? "destructive"
                                                            : q.difficulty === "MEDIUM"
                                                                ? "warning"
                                                                : "success"
                                                    }
                                                    className="text-[10px]"
                                                >
                                                    {q.difficulty}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-foreground font-medium truncate">
                                                {q.content_preview}
                                            </p>
                                        </div>
                                        <Button asChild size="sm" variant="outline" className="rounded-xl">
                                            <Link href={`/guru/questions/${q.id}`}>Edit</Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                Belum ada soal dalam bank soal.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

    );
}
