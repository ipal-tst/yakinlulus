"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getProgressColor, getProgressLabel } from "@/hooks/use-learn";
import { BookOpen, Lightbulb, PlayCircle, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubjectCardProps {
    subject: {
        subject_id: string;
        subject_name: string;
        icon?: string;
        icon_color?: string;
        total_children: number;
        completed_children: number;
        progress_pct: number;
        is_mastered: boolean;
    };
    onClick?: () => void;
}

const ICON_COLORS = {
    "si-blue": "bg-blue-500 text-white",
    "si-sky": "bg-sky-500 text-white",
    "si-orange": "bg-orange-500 text-white",
    "si-violet": "bg-violet-500 text-white",
    "si-pink": "bg-pink-500 text-white",
    "si-green": "bg-emerald-500 text-white",
};

export function SubjectCard({ subject, onClick }: SubjectCardProps) {
    const pct = Math.round(subject.progress_pct);
    const colorClass = ICON_COLORS[subject.icon_color as keyof typeof ICON_COLORS] || "bg-blue-500 text-white";

    return (
        <div
            onClick={onClick}
            className={cn(
                "group cursor-pointer rounded-2xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md",
                "border-border/80"
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl flex items-center justify-center", colorClass)}>
                    <BookOpen className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="text-xs">
                    {subject.completed_children}/{subject.total_children} Bab
                </Badge>
            </div>
            <h3 className="font-bold text-lg mb-1">{subject.subject_name}</h3>
            <div className="space-y-1.5">
                <Progress value={pct} className="h-2" />
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{getProgressLabel(pct)}</span>
                    <span className="font-semibold">{pct}%</span>
                </div>
            </div>
            {subject.is_mastered && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Dikuasai
                </div>
            )}
        </div>
    );
}

export function NonMaterialCard({ kind, title, description }: { kind: string; title: string; description: string }) {
    const iconMap = {
        tips: <Lightbulb className="h-5 w-5" />,
        video: <PlayCircle className="h-5 w-5" />,
        audio: <Headphones className="h-5 w-5" />,
    };
    const bgMap = {
        tips: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
        video: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
        audio: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    };

    return (
        <div className="group cursor-pointer rounded-2xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md flex gap-4 items-center">
            <div className={cn("p-3 rounded-2xl shrink-0", bgMap[kind as keyof typeof bgMap])}>
                {iconMap[kind as keyof typeof iconMap]}
            </div>
            <div>
                <h4 className="font-bold text-base">{title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
        </div>
    );
}

export function ChapterAccordionItem({ chapter }: { chapter: { chapter_id: string; subject_id: string; title: string; order_index: number; progress_pct: number; correct_count: number; target_correct: number; status: string; quiz_exam_id?: string } }) {
    const pct = Math.round(chapter.progress_pct);
    const colorStatus = chapter.status || (pct >= 100 ? "green" : pct > 0 ? "amber" : "grey");
    const progressColor = getProgressColor(pct);

    return (
        <div className={cn("rounded-xl border overflow-hidden transition-colors", colorStatus === "green" ? "border-emerald-200 dark:border-emerald-900/50" : colorStatus === "red" ? "border-red-200 dark:border-red-900/50" : "border-border/80")}>
            <div className="p-4 flex items-center gap-4">
                <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                    colorStatus === "green" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                    colorStatus === "red" ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                    "bg-muted text-muted-foreground"
                )}>
                    {chapter.order_index}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{chapter.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 font-medium",
                            colorStatus === "green" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                            colorStatus === "red" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                            "bg-muted text-muted-foreground"
                        )}>
                            {getProgressLabel(pct)}
                        </span>
                        <span>• {chapter.correct_count}/{chapter.target_correct} benar</span>
                    </div>
                </div>
                <div className="w-32">
                    <Progress value={pct} className="h-2" indicatorClassName={progressColor === "green" ? "bg-emerald-500" : progressColor === "amber" ? "bg-orange-500" : progressColor === "red" ? "bg-red-500" : "bg-muted-foreground/50"} />
                </div>
            </div>
        </div>
    );
}
