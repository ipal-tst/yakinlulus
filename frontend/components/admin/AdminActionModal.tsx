"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AdminActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    onSubmit?: () => void;
    submitLabel?: string;
    disabled?: boolean;
}

export function AdminActionModal({
    isOpen,
    onClose,
    title,
    description,
    children,
    onSubmit,
    submitLabel = "Simpan Perubahan",
    disabled = false,
}: AdminActionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between border-b pb-4">
                    <div>
                        <h2 className="text-lg font-extrabold tracking-tight text-foreground">{title}</h2>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4 text-xs">{children}</div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t pt-4">
                    <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-semibold">
                        Batal
                    </Button>
                    {onSubmit && (
                                            <Button size="sm" onClick={onSubmit} className="text-xs font-bold shadow-md shadow-primary/20" disabled={disabled}>
                                                {submitLabel}
                                            </Button>
                                        )}
                </div>
            </div>
        </div>
    );
}
