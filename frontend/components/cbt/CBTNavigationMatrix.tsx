"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CBTNavigationMatrixProps {
    items: {
        id: number;
        code: string;
        status: "UNANSWERED" | "ANSWERED" | "FLAGGED";
        selectedAnswer: string | undefined;
    }[];
    currentIndex: number;
    onSelectQuestion: (index: number) => void;
    columns?: number;
    showLegend?: boolean;
}

export function CBTNavigationMatrix({
    items,
    currentIndex,
    onSelectQuestion,
    columns = 5,
    showLegend = true,
}: CBTNavigationMatrixProps) {
    const answeredCount = React.useMemo(
        () => items.filter((i) => i.status === "ANSWERED").length,
        [items]
    );
    const flaggedCount = React.useMemo(
        () => items.filter((i) => i.status === "FLAGGED").length,
        [items]
    );
    const unansweredCount = React.useMemo(
        () => items.filter((i) => i.status === "UNANSWERED").length,
        [items]
    );

    return (
        <div className="space-y-4">
            {showLegend && (
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 text-[11px] border">
                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-xs bg-success border border-success/50 inline-block" />
                        <span>Terjawab ({answeredCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-xs bg-warning border border-warning/50 inline-block" />
                        <span>Ragu ({flaggedCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-xs bg-background border border-muted-foreground/30 inline-block" />
                        <span>Kosong ({unansweredCount})</span>
                    </div>
                </div>
            )}

            <div className={cn(
                "grid gap-2 p-1 max-h-96 overflow-y-auto",
                `grid-cols-${columns}`
            )}>
                {items.map((item, idx) => {
                    const isActive = idx === currentIndex;
                    let bgColor = "bg-background border-input hover:bg-accent/40 text-foreground";

                    if (item.status === "ANSWERED") {
                        bgColor = "bg-success/20 border-success/50 text-success font-bold";
                    } else if (item.status === "FLAGGED") {
                        bgColor = "bg-warning/20 border-warning/50 text-warning font-bold";
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelectQuestion(idx)}
                            className={cn(
                                "h-11 rounded-lg text-xs font-mono font-bold transition-all border flex flex-col items-center justify-center relative",
                                bgColor,
                                isActive && "ring-2 ring-primary ring-offset-2 scale-105"
                            )}
                        >
                            <span>{item.id}</span>
                            {item.selectedAnswer && (
                                <span className="text-[9px] font-bold opacity-80">{item.selectedAnswer}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}