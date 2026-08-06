// src/components/admin/confirm-dialog.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    variant?: "default" | "destructive";
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Konfirmasi",
    variant = "default",
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">{title}</DialogTitle>
                    {description && <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>}
                </DialogHeader>
                <DialogFooter className="gap-2 sm:justify-end mt-4">
                    <Button variant="outline" onClick={onCancel} disabled={loading} className="rounded-xl">
                        Batal
                    </Button>
                    <Button variant={variant} onClick={onConfirm} disabled={loading} className="rounded-xl">
                        {loading ? "Memproses..." : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}