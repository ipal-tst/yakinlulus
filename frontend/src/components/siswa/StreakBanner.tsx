// frontend/src/components/siswa/StreakBanner.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GradeBadge } from "./GradeBadge";
import { Sparkles, ArrowRight, Flame, BookOpen, Bot } from "lucide-react";

interface StreakBannerProps {
    userName?: string;
    educationLevel?: string;
    grade?: string;
    streakDays?: number;
    totalExamsTaken?: number;
}

export function StreakBanner({
    userName = "Siswa",
    educationLevel,
    grade,
    streakDays = 5,
    totalExamsTaken = 0,
}: StreakBannerProps) {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary via-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-md">
            <div className="relative z-10 space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Target Lulus 2026
                    </span>
                    <GradeBadge educationLevel={educationLevel} grade={grade} />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-400/30">
                        <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> 🔥 {streakDays} Hari Streak Belajar
                    </span>
                </div>

                <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
                    Selamat datang kembali, {userName}! 👋
                </h1>
                <p className="text-white/80 text-sm md:text-base leading-relaxed">
                    Kamu telah menyelesaikan <strong className="text-white font-semibold">{totalExamsTaken} Try Out</strong>. Pertahankan ritme latihanmu!
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                    <Button asChild className="rounded-xl bg-white text-primary hover:bg-white/90 font-semibold shadow-xs">
                        <Link href="/exams">Mulai Try Out Baru <ArrowRight className="h-4 w-4 ml-1" /></Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 font-semibold">
                        <Link href="/materials"><BookOpen className="h-4 w-4 mr-1.5" /> Pelajari Materi</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 font-semibold">
                        <Link href="/ai"><Bot className="h-4 w-4 mr-1.5" /> Tanya AI Tutor</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
