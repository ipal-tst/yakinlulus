"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    HelpCircle,
    Brain,
    Sparkles,
    Play,
    Target,
    Zap,
    Bookmark,
    CheckCircle2,
    Clock,
    Flame,
    BarChart2,
} from "lucide-react";
import { usePracticeSessions } from "@/lib/api";

const SUBJECT_OPTIONS = [
    { id: "math", name: "Matematika", icon: Zap },
    { id: "physics", name: "Fisika", icon: Brain },
    { id: "indonesian", name: "Bahasa Indonesia", icon: Target },
    { id: "english", name: "Bahasa Inggris", icon: HelpCircle },
];

export default function StudentPracticePage() {
    const { data } = usePracticeSessions();

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">ADAPTIVE DRILLING ENGINE</Badge>
                        <span className="text-xs text-muted-foreground">Go Backend: `internal/practice` & `internal/question_bank`</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Latihan Soal Hub</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Tingkatkan tingkat penguasaan sub-tes dengan latihan adaptif berbasis IRT, daily practice, dan tantangan mingguan.
                    </p>
                </div>

                <Button variant="outline" size="sm" className="text-xs font-semibold">
                    <Bookmark className="mr-2 h-3.5 w-3.5 text-primary" /> Bank Soal Bookmark
                </Button>
            </div>

            {/* Subject Shortcuts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SUBJECT_OPTIONS.map((sub) => (
                    <Link key={sub.id} href={`/student/practice/subject?subject_id=${sub.id}`}>
                        <Card className="p-4 hover:border-primary/40 transition-all cursor-pointer group">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <sub.icon className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-xs font-bold">{sub.name}</span>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Daily Challenge Banner */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 via-card to-warning/10 border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-warning animate-bounce" />
                        <h3 className="font-bold text-sm">Daily Practice Challenge Hari Ini</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Selesaikan 10 soal Penalaran Umum hari ini untuk mendapatkan bonus <span className="font-bold text-foreground">+150 XP & Streak Multiplier</span>.
                    </p>
                </div>
                <Link href="/student/practice/prac-01">
                    <Button size="sm" className="text-xs font-bold shrink-0 shadow-md shadow-primary/20">
                        Mulai Daily Practice <Play className="ml-1.5 h-3.5 w-3.5 fill-primary-foreground" />
                    </Button>
                </Link>
            </Card>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(data as any)?.map((pkg: any) => (
                    <Card key={pkg.id} className="p-5 flex flex-col justify-between hover:border-primary/40 transition-all space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="font-mono text-[10px]">{pkg.code}</Badge>
                                {pkg.isAdaptive ? (
                                    <Badge variant="default" className="text-[10px] font-bold bg-indigo-600">
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
                            <span className="text-muted-foreground">{pkg.questionCount} Soal • {pkg.durationMinutes} Mins</span>
                            <Badge
                                variant={pkg.difficulty === "HARD" ? "destructive" : pkg.difficulty === "MEDIUM" ? "warning" : "outline"}
                                className="text-[10px]"
                            >
                                {pkg.difficulty}
                            </Badge>
                        </div>

                        <div className="pt-2 border-t flex justify-end">
                            <Link href={`/student/practice/${pkg.id}`}>
                                <Button size="sm" className="w-full text-xs font-bold">
                                    Mulai Kerjakan Latihan <Play className="ml-1.5 h-3.5 w-3.5 fill-primary-foreground" />
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
