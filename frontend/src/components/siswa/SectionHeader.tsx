// frontend/src/components/siswa/SectionHeader.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    className?: string;
}

export function SectionHeader({
    title,
    subtitle,
    icon: Icon,
    actionLabel,
    actionHref,
    onAction,
    className,
}: SectionHeaderProps) {
    return (
        <div className={cn("flex items-center justify-between gap-3", className)}>
            <div className="space-y-0.5">
                <h2 className="font-heading text-base md:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                    {Icon && <Icon className="h-4.5 w-4.5 h-5 w-5 text-primary" />}
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
            </div>
            {actionLabel && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
                >
                    {actionHref ? (
                        <Link href={actionHref} className="inline-flex items-center gap-0.5">
                            {actionLabel}
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    ) : (
                        <>
                            {actionLabel}
                            <ChevronRight className="h-3.5 w-3.5" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}