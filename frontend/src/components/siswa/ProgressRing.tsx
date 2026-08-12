// frontend/src/components/siswa/ProgressRing.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
    value: number; // 0-100
    size?: number;
    strokeWidth?: number;
    label?: string;
    sublabel?: string;
    colorClass?: string;
    trackClass?: string;
    className?: string;
}

export function ProgressRing({
    value,
    size = 96,
    strokeWidth = 10,
    label,
    sublabel,
    colorClass = "stroke-primary",
    trackClass = "stroke-muted",
    className,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, value));
    const offset = circumference - (clamped / 100) * circumference;

    return (
        <div
            className={cn("relative inline-flex items-center justify-center", className)}
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className={trackClass}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn(
                        "transition-all duration-250 ease-out",
                        colorClass
                    )}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {label && (
                    <span className="font-heading text-lg font-bold leading-none text-foreground">
                        {label}
                    </span>
                )}
                {sublabel && (
                    <span className="mt-0.5 text-[10px] font-medium text-muted-foreground leading-tight">
                        {sublabel}
                    </span>
                )}
            </div>
        </div>
    );
}