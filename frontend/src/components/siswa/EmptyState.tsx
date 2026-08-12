// frontend/src/components/siswa/EmptyState.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    className?: string;
    compact?: boolean;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
    className,
    compact,
}: EmptyStateProps) {
    const content = (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6",
                compact ? "py-6" : "py-12",
                className
            )}
        >
            {Icon && (
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-background border border-border/60 shadow-sm">
                    <Icon className="h-7 w-7 text-muted-foreground" />
                </div>
            )}
            <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">{description}</p>
            )}
            {actionLabel && (
                <Button
                    asChild={!!actionHref}
                    onClick={onAction}
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-xl gap-1.5"
                >
                    {actionHref ? (
                        <Link href={actionHref}>
                            {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    ) : (
                        <>{actionLabel}</>
                    )}
                </Button>
            )}
        </div>
    );

    return content;
}