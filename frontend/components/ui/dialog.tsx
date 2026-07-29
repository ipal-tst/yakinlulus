"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function Dialog({
    isOpen,
    onClose,
    title,
    description,
    children,
}: DialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg text-card-foreground animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                    <h2 className="text-lg font-semibold leading-none tracking-tight">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                <div className="py-4">{children}</div>
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

// Alias exports for compatibility
export const DialogTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>;
export const DialogContent = Dialog;
export const DialogHeader = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DialogTitle = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DialogDescription = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DialogFooter = ({ children }: { children: React.ReactNode }) => <>{children}</>;
