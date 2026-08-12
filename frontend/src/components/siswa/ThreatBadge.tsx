// frontend/src/components/siswa/ThreatBadge.tsx
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { VerdictStatus } from "@/types/siswa";
import { cn } from "@/lib/utils";

const MAP: Record<VerdictStatus, { label: string; className: string }> = {
    PASSED: {
        label: "Diterima",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    },
    SAFE: {
        label: "Aman",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    },
    NEAR: {
        label: "Mendekati",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    },
    BELOW: {
        label: "Belum Cukup",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
    },
    CRITICAL: {
        label: "Kritis",
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25",
    },
    PENDING: {
        label: "Belum Ada Skor",
        className: "bg-muted text-muted-foreground border-border",
    },
};

export function ThreatBadge({ status, className }: { status: VerdictStatus; className?: string }) {
    const cfg = MAP[status] ?? MAP.PENDING;
    return (
        <Badge variant="outline" className={cn("font-semibold border", cfg.className, className)}>
            {cfg.label}
        </Badge>
    );
}