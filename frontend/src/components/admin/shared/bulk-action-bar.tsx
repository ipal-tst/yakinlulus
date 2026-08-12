// src/components/admin/shared/bulk-action-bar.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BulkAction {
    label: string;
    variant?: "default" | "destructive" | "outline";
    onClick: () => void;
    confirm?: string;
}

export interface BulkActionBarProps {
    count: number;
    actions: BulkAction[];
    onClear?: () => void;
    className?: string;
}

export function BulkActionBar({ count, actions = [], onClear, className }: BulkActionBarProps) {
    if (count <= 0) return null;

    const handleAction = (action: BulkAction) => {
        if (action.confirm && typeof window !== "undefined") {
            const ok = window.confirm(action.confirm);
            if (!ok) return;
        }
        action.onClick();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.15 }}
            role="toolbar"
            aria-label={`${count} item terpilih`}
            className={cn(
                "sticky top-0 z-30 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 backdrop-blur-sm",
                className
            )}
        >
            <span className="text-sm font-semibold text-foreground">
                {count} terpilih
            </span>
            <div className="flex flex-wrap items-center gap-2">
                {actions.map((action) => (
                    <Button
                        key={action.label}
                        type="button"
                        size="sm"
                        variant={action.variant ?? "default"}
                        className="rounded-lg"
                        onClick={() => handleAction(action)}
                    >
                        {action.label}
                    </Button>
                ))}
            </div>
            {onClear && (
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="ml-auto rounded-lg text-muted-foreground"
                    onClick={onClear}
                >
                    <X className="h-4 w-4" />
                    Bersihkan
                </Button>
            )}
        </motion.div>
    );
}
