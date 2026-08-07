"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, BookOpen, Layers, Award, Library } from "lucide-react";

interface AcademicStatsOverviewProps {
    totalLevels: number;
    totalSubjects: number;
    totalCurriculums: number;
    totalPrograms: number;
    isLoading: boolean;
}

export function AcademicStatsOverview({
    totalLevels,
    totalSubjects,
    totalCurriculums,
    totalPrograms,
    isLoading
}: AcademicStatsOverviewProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Total Jenjang</p>
                        <p className="text-xl font-bold font-heading">{totalLevels}</p>
                    </div>
                </div>
            </Card>

            <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Mata Pelajaran (Mapel)</p>
                        <p className="text-xl font-bold font-heading">{totalSubjects}</p>
                    </div>
                </div>
            </Card>

            <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                        <Layers className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Total Kurikulum</p>
                        <p className="text-xl font-bold font-heading">{totalCurriculums}</p>
                    </div>
                </div>
            </Card>

            <Card className="p-4 rounded-2xl bg-card hover:border-primary/50 transition-colors shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                        <Award className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Total Program</p>
                        <p className="text-xl font-bold font-heading">{totalPrograms}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
