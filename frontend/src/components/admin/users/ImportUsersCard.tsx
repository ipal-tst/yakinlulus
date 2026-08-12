"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Upload, FileCheck, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { userService, UserImportResult } from "@/services/user.service";
import { ImportResultCard, ImportResultData } from "@/components/admin/shared/import-result-card";
import { cn } from "@/lib/utils";

interface ImportUsersCardProps {
    onClose?: () => void;
    className?: string;
}

export function ImportUsersCard({ onClose, className }: ImportUsersCardProps) {
    const [file, setFile] = React.useState<File | null>(null);
    const [dragging, setDragging] = React.useState(false);
    const [result, setResult] = React.useState<ImportResultData | null>(null);
    const [step, setStep] = React.useState<"upload" | "processing" | "result">("upload");

    const importMutation = useMutation({
        mutationFn: (file: File) => userService.importUsers(file),
        onMutate: () => setStep("processing"),
        onSuccess: (res: UserImportResult) => {
            const mappedResult: ImportResultData = {
                total: res.total_rows,
                success: res.success_count,
                skipped: 0, // The API doesn't return skipped count
                failed: res.failed_count,
                errors: res.errors?.map((msg, idx) => ({ row: idx + 1, message: msg })) || []
            };
            setResult(mappedResult);
            setStep("result");
        },
        onError: (error: Error) => {
            const mappedResult: ImportResultData = {
                total: 0,
                success: 0,
                skipped: 0,
                failed: 1,
                errors: [{ row: 0, message: error.message }]
            };
            setResult(mappedResult);
            setStep("result");
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            validateFile(selectedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            validateFile(droppedFile);
        }
    };

    const validateFile = (f: File) => {
        const allowedTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
        ];
        
        if (!allowedTypes.includes(f.type)) {
            alert("Format file tidak didukung. Harap gunakan file Excel (.xlsx).");
            return;
        }
        
        if (f.size > 10 * 1024 * 1024) { // 10MB
            alert("Ukuran file terlalu besar. Maksimal 10MB.");
            return;
        }
        
        setFile(f);
    };

    const handleImport = () => {
        if (file) {
            importMutation.mutate(file);
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setStep("upload");
        if (onClose) onClose();
    };

    const handleDownloadTemplate = () => {
        userService.downloadTemplate();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={cn("w-full max-w-2xl", className)}
        >
            <Card className="rounded-2xl shadow-lg border-border">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="font-heading text-lg">Import Pengguna</CardTitle>
                        {onClose && (
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg p-0"
                                onClick={handleReset}
                                aria-label="Tutup"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {step === "upload" && (
                        <div className="space-y-4">
                            <div
                                className={cn(
                                    "relative border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                                    dragging
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    id="import-file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={importMutation.isPending}
                                />
                                <Upload className={cn(
                                    "h-10 w-10 mx-auto mb-3",
                                    dragging ? "text-primary" : "text-muted-foreground"
                                )} />
                                <p className="text-sm font-medium text-foreground mb-1">
                                    {file ? file.name : "Drag & drop file Excel atau klik untuk memilih"}
                                </p>
                                {file && (
                                    <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                )}
                                {!file && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Format: .xlsx (maksimal 10MB)
                                    </p>
                                )}
                                {!file && (
                                    <label
                                        htmlFor="import-file"
                                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer"
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                        Pilih File
                                    </label>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadTemplate}
                                    className="rounded-xl"
                                    disabled={importMutation.isPending}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download Template
                                </Button>
                                <span className="text-xs text-muted-foreground flex-1">
                                    Gunakan template untuk memastikan format kolom benar
                                </span>
                            </div>

                            {file && (
                                <Button
                                    onClick={handleImport}
                                    disabled={importMutation.isPending}
                                    className="w-full rounded-xl"
                                    size="lg"
                                >
                                    {importMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <FileCheck className="h-4 w-4 mr-2" />
                                            Mulai Import
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}

                    {step === "processing" && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground text-center">
                                Memproses file import... Mohon tunggu sebentar.
                            </p>
                        </div>
                    )}

                    {step === "result" && result && (
                        <div className="space-y-4">
                            <ImportResultCard
                                result={result}
                                onClose={handleReset}
                            />
                            
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    className="rounded-xl"
                                >
                                    Import Lagi
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                        if (onClose) onClose();
                                    }}
                                    className="rounded-xl"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Selesai
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}