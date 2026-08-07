// frontend/src/components/siswa/GradeBadge.tsx
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

interface GradeBadgeProps {
    educationLevel?: string;
    grade?: string;
}

export function GradeBadge({ educationLevel = "SMA", grade = "12" }: GradeBadgeProps) {
    const isUtbk = educationLevel === "SMA" && (grade === "12" || grade === "GapYear");
    const label = `${educationLevel} ${grade ? `Kelas ${grade}` : ""}${isUtbk ? " (UTBK/SNBT 2026)" : ""}`;

    return (
        <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary gap-1.5 px-3 py-1 font-medium text-xs rounded-full">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            <span>{label}</span>
        </Badge>
    );
}
