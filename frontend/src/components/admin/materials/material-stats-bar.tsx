"use client";

import { Material } from "@/types";
import { Card } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Clock, FileEdit, Layers } from "lucide-react";

interface MaterialStatsBarProps {
    materials: Material[];
}

export function MaterialStatsBar({ materials }: MaterialStatsBarProps) {
    const totalMaterials = materials.length;
    const publishedCount = materials.filter((m) => m.status === "PUBLISHED" || (!m.status && m.is_completed !== undefined)).length;
    const draftCount = materials.filter((m) => m.status === "DRAFT").length;
    const totalReadingMinutes = materials.reduce((acc, m) => acc + (m.reading_time_minutes || 0), 0);
    const uniqueSubjectsCount = new Set(materials.map((m) => m.subject_name).filter(Boolean)).size;

    const stats = [
        {
            title: "Total Modul Belajar",
            value: totalMaterials,
            subtitle: "Rangkuman Teori & Strategi",
            icon: BookOpen,
            color: "text-blue-500 bg-blue-500/10",
        },
        {
            title: "Modul Terpublikasi",
            value: publishedCount,
            subtitle: "Dapat Diakses Siswa",
            icon: CheckCircle2,
            color: "text-emerald-500 bg-emerald-500/10",
        },
        {
            title: "Draf / Dalam Revisi",
            value: draftCount,
            subtitle: "Belum Dipublikasi",
            icon: FileEdit,
            color: "text-amber-500 bg-amber-500/10",
        },
        {
            title: "Total Waktu Baca",
            value: `${totalReadingMinutes} mnt`,
            subtitle: "Akumulasi Durasi Belajar",
            icon: Clock,
            color: "text-purple-500 bg-purple-500/10",
        },
        {
            title: "Cakupan Subjek",
            value: `${uniqueSubjectsCount} Mapel`,
            subtitle: "Master Akademik Tercover",
            icon: Layers,
            color: "text-indigo-500 bg-indigo-500/10",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <Card key={idx} className="p-4 flex flex-col justify-between space-y-2 border border-border/80 shadow-2xs rounded-2xl hover:border-primary/40 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">{stat.title}</span>
                            <div className={`p-2 rounded-xl ${stat.color}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-heading text-foreground tracking-tight">
                                {stat.value}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.subtitle}</p>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
