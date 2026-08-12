"use client";

import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getProgressColor, getProgressLabel } from "@/hooks/use-learn";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface ChapterAccordionProps {
    chapters: Array<{
        chapter_id: string;
        subject_id: string;
        title: string;
        order_index: number;
        progress_pct: number;
        correct_count: number;
        target_correct: number;
        status: string;
        quiz_exam_id?: string;
    }>;
}

export function ChapterAccordion({ chapters }: ChapterAccordionProps) {
    const progressColors = {
        green: "bg-emerald-500",
        amber: "bg-orange-500",
        red: "bg-red-500",
        grey: "bg-muted-foreground/50",
    };

    return (
        <div className="space-y-3">
            {chapters.map((chapter) => {
                const pct = Math.round(chapter.progress_pct);
                const colorStatus = chapter.status || (pct >= 100 ? "green" : pct > 0 ? "amber" : "grey");
                const progressColor = progressColors[getProgressColor(pct)];

                return (
                    <Collapsible key={chapter.chapter_id} className="group">
                        <div className="rounded-xl border bg-card overflow-hidden">
                            <CollapsibleTrigger className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                                    colorStatus === "green" ? "bg-emerald-500/10 text-emerald-600" :
                                    colorStatus === "red" ? "bg-red-500/10 text-red-600" :
                                    "bg-muted text-muted-foreground"
                                )}>
                                    {chapter.order_index}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm">{chapter.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                        <span className="flex items-center gap-1">
                                            {chapter.correct_count} benar
                                        </span>
                                        <span className="text-muted-foreground">•</span>
                                        <span>Target: {chapter.target_correct}</span>
                                    </p>
                                </div>
                                <div className="w-24">
                                    <Progress value={pct} className="h-1.5" indicatorClassName={progressColor} />
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <Badge variant="outline" className="text-xs border-border/50">
                                        {pct}%
                                    </Badge>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="px-4 pb-4 pt-2 border-t border-border/50">
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                                            <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Progres</p>
                                            <p className="text-xs font-semibold">{chapter.correct_count} soal benar</p>
                                        </div>
                                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                                            <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Target</p>
                                            <p className="text-xs font-semibold">{chapter.target_correct} benar</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="default" className="rounded-lg text-xs flex-1 gap-2">
                                            Belajar Bab
                                        </Button>
                                        {chapter.quiz_exam_id && (
                                            <Button variant="outline" className="rounded-lg text-xs" asChild>
                                                <Link href={`/exams/${chapter.quiz_exam_id}`}>
                                                    Kerjakan Ujian
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </div>
                    </Collapsible>
                );
            })}
        </div>
    );
}
