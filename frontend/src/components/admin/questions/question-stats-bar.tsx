"use client";

import { Card } from "@/components/ui/card";
import { HelpCircle, FileText, CheckCircle2, Flame, UploadCloud } from "lucide-react";

interface StatsProps {
    totalQuestions: number;
    publishedCount: number;
    draftCount: number;
    hotsCount: number;
    importJobsCount: number;
}

export function QuestionStatsBar({
    totalQuestions,
    publishedCount,
    draftCount,
    hotsCount,
    importJobsCount,
}: StatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-4 bg-card border-border/80 rounded-2xl flex items-center gap-3 shadow-2xs">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Soal</p>
                    <h3 className="text-xl font-bold font-heading">{totalQuestions}</h3>
                </div>
            </Card>

            <Card className="p-4 bg-card border-border/80 rounded-2xl flex items-center gap-3 shadow-2xs">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">Published</p>
                    <h3 className="text-xl font-bold font-heading">{publishedCount}</h3>
                </div>
            </Card>

            <Card className="p-4 bg-card border-border/80 rounded-2xl flex items-center gap-3 shadow-2xs">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <FileText className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">Draft / Review</p>
                    <h3 className="text-xl font-bold font-heading">{draftCount}</h3>
                </div>
            </Card>

            <Card className="p-4 bg-card border-border/80 rounded-2xl flex items-center gap-3 shadow-2xs">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Flame className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">Soal HOTS</p>
                    <h3 className="text-xl font-bold font-heading">{hotsCount}</h3>
                </div>
            </Card>

            <Card className="p-4 bg-card border-border/80 rounded-2xl flex items-center gap-3 shadow-2xs col-span-2 md:col-span-1">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">Import Jobs</p>
                    <h3 className="text-xl font-bold font-heading">{importJobsCount}</h3>
                </div>
            </Card>
        </div>
    );
}
