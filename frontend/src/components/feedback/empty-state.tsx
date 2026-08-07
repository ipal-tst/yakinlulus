import * as React from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon = FolderOpen,
    title,
    description,
    actionLabel,
    onAction,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border bg-card/50 my-4",
                className
            )}
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/80 text-primary mb-4">
                <Icon className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} className="rounded-xl font-medium">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
