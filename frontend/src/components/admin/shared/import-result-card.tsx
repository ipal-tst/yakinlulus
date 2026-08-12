// src/components/admin/shared/import-result-card.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImportResultError {
    row: number;
    message: string;
}

export interface ImportResultData {
    total: number;
    success: number;
    skipped: number;
    failed: number;
    errors?: ImportResultError[];
}

export interface ImportResultCardProps {
    result: ImportResultData;
    onClose?: () => void;
    className?: string;
}

export function ImportResultCard({ result, onClose, className }: ImportResultCardProps) {
    const { total, success, skipped, failed, errors = [] } = result;
    const [showErrors, setShowErrors] = React.useState(false);

    const stats: { label: string; value: number; icon: React.ReactNode; color: string }[] = [
        { label: "Total", value: total, icon: <Info className="h-4 w-4" />, color: "text-muted-foreground" },
        { label: "Sukses", value: success, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-600" },
        { label: "Dilewati", value: skipped, icon: <Info className="h-4 w-4" />, color: "text-orange-500" },
        { label: "Gagal", value: failed, icon: <XCircle className="h-4 w-4" />, color: "text-red-500" },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <Card className={cn("border-border shadow-xs", className)}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                    <CardTitle className="text-base font-bold">Hasil Import</CardTitle>
                    {onClose && (
                        <Button type="button" size="sm" variant="ghost" className="h-8 w-8 rounded-lg p-0" onClick={onClose} aria-label="Tutup">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {stats.map((s) => (
                            <div key={s.label} className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                                <div className={cn("flex items-center gap-1.5 text-xs font-medium", s.color)}>
                                    {s.icon}
                                    {s.label}
                                </div>
                                <div className="mt-1 text-lg font-bold text-foreground">{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {failed > 0 && errors.length > 0 && (
                        <div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-lg text-muted-foreground"
                                onClick={() => setShowErrors((v) => !v)}
                            >
                                {showErrors ? "Sembunyikan detail" : `Lihat detail (${errors.length})`}
                            </Button>
                            {showErrors && (
                                <div className="mt-2 max-h-48 space-y-1 overflow-auto rounded-lg border border-border bg-muted/20 p-2">
                                    {errors.map((e, i) => (
                                        <div key={`${e.row}-${i}`} className="flex items-start gap-2 px-1.5 py-1 text-xs">
                                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                                            <span className="text-muted-foreground">
                                                Baris <span className="font-semibold text-foreground">{e.row}</span>: {e.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
