// frontend/src/components/siswa/MasteryBadge.tsx
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { MasteryStatus } from "@/types/siswa";
import { cn } from "@/lib/utils";

const MAP: Record<MasteryStatus, { label: string; className: string }> = {
    MASTERED: {
        label: "Kuat",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    },
    GUARD: {
        label: "Perlu Perhatian",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    },
    WEAK: {
        label: "Lemah",
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25",
    },
};

export function MasteryBadge({ status, className }: { status: MasteryStatus; className?: string }) {
    const cfg = MAP[status] ?? MAP.WEAK;
    return (
        <Badge variant="outline" className={cn("font-semibold border", cfg.className, className)}>
            {cfg.label}
        </Badge>
    );
}