"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    HelpCircle,
    Brain,
    Sparkles,
    Play,
    Target,
    Zap,
    Clock,
    Flame,
} from "lucide-react";
import { usePracticeSessions } from "@/lib/api";

const SUBJECT_OPTIONS = [
    { id: "math", name: "Matematika", icon: Zap },
    { id: "physics", name: "Fisika", icon: Brain },
    { id: "indonesian", name: "Bahasa Indonesia", icon: Target },
    { id: "english", name: "Bahasa Inggris", icon: HelpCircle },
];

export default function StudentPracticePage() {
    const { data, isLoading } = usePracticeSessions();

    const packages = (data as any) ?? [];
    const totalQuestions = packages.reduce((sum: number, p: any) => sum + (p.questionCount || 0), 0);
    const adaptiveCount = packages.filter((p: any) => p.isAdaptive).length;

    return (
        <div className="space-y-6">
            {/* Hero */}
            <section className="bg-primary rounded-2xl p-6 text-primary-foreground relative overflow-hidden shadow-lg shadow-primary/20">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">Adaptive Drilling Engine</span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Latihan Soal</h1>
                    <p className="text-xs opacity-90 mt-1 max-w-md leading-relaxed">
                        Tingkatkan penguasaan sub-tes dengan latihan adaptif berbasis IRT, daily practice, dan tantangan mingguan.
                    </p>
                    <div className="mt-4">
                        <Link href="/student/practice/prac-01">
                            <Button size="sm" className="bg-white text-primary hover:bg-white/90 text-xs font-bold shadow-sm">
                                Mulai Daily Practice <Play className="ml-1.5 h-3.5 w-3.5 fill-primary" />
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="absolute right-[-20px] top-[-20px] opacity-10">
                    <Target className="h-40 w-40" />
                </div>
            </section>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/60 rounded-xl p-4 text-center">
                    <span className="text-xl font-extrabold font-mono block">{isLoading ? "…" : packages.length}</span>
                    <span className="text-xs text-muted-foreground">Paket</span>
                </div>
                <div className="bg-muted/60 rounded-xl p-4 text-center">
                    <span className="text-xl font-extrabold font-mono block">{isLoading ? "…" : totalQuestions.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">Soal</span>
                </div>
                <div className="bg-muted/60 rounded-xl p-4 text-center">
                    <span className="text-xl font-extrabold font-mono block">{isLoading ? "…" : adaptiveCount}</span>
                    <span className="text-xs text-muted-foreground">Adaptif</span>
                </div>
            </div>

            {/* Subject Shortcuts */}
            <section>
                <h2 className="font-bold text-sm mb-3">Pilih Mata Pelajaran</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {SUBJECT_OPTIONS.map((sub) => (
                        <Link key={sub.id} href="/student/practice">
                            <div className="bg-card rounded-2xl border border-border shadow-sm p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <sub.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="text-xs font-bold">{sub.name}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Daily Challenge Banner */}
            <section className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                            <Flame className="h-5 w-5 text-warning" />
                        </div>
                        <h3 className="font-bold text-sm">Daily Practice Challenge Hari Ini</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Selesaikan 10 soal Penalaran Umum hari ini untuk melatih kemampuan Penalaran Umummu.
                    </p>
                </div>
                <Link href="/student/practice/prac-01" className="w-full md:w-auto">
                    <Button size="sm" className="text-xs font-bold w-full md:w-auto">
                        Mulai Daily Practice <Play className="ml-1.5 h-3.5 w-3.5 fill-primary-foreground" />
                    </Button>
                </Link>
            </section>

            {/* Packages Grid */}
            <section>
                <h2 className="font-bold text-sm mb-3">Paket Latihan</h2>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3">
                                <div className="animate-pulse bg-muted rounded-full h-4 w-20" />
                                <div className="animate-pulse bg-muted rounded-lg h-4 w-3/4" />
                                <div className="animate-pulse bg-muted rounded-lg h-3 w-1/2" />
                                <div className="animate-pulse bg-muted rounded-lg h-9 w-full" />
                            </div>
                        ))}
                    </div>
                ) : packages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {packages.map((pkg: any) => (
                            <Card key={pkg.id} className="rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="font-mono text-[10px]">{pkg.code}</Badge>
                                        {pkg.isAdaptive ? (
                                            <Badge variant="default" className="text-[10px] font-bold">
                                                <Sparkles className="mr-1 h-3 w-3" /> ADAPTIF IRT
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px]">STANDARD</Badge>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-sm text-foreground">{pkg.title}</h3>
                                    <p className="text-xs text-muted-foreground">{pkg.subject}</p>
                                </div>

                                <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {pkg.questionCount} Soal · {pkg.durationMinutes} Mins
                                    </span>
                                    <Badge
                                        variant={pkg.difficulty === "HARD" ? "destructive" : pkg.difficulty === "MEDIUM" ? "warning" : "outline"}
                                        className="text-[10px]"
                                    >
                                        {pkg.difficulty}
                                    </Badge>
                                </div>

                                <div className="pt-2 border-t">
                                    <Link href={`/student/practice/${pkg.id}`}>
                                        <Button size="sm" className="w-full text-xs font-bold">
                                            Mulai Kerjakan Latihan <Play className="ml-1.5 h-3.5 w-3.5 fill-primary-foreground" />
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl border border-dashed p-8 text-center space-y-2">
                        <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                        <h3 className="font-bold text-sm">Belum ada paket latihan</h3>
                        <p className="text-xs text-muted-foreground">Paket latihan akan muncul di sini saat tersedia.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
