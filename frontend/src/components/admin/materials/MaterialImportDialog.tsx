"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Material } from "@/types";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, Trash2 } from "lucide-react";

interface MaterialImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: (importedItems: Partial<Material>[]) => void;
}

export function MaterialImportDialog({
    isOpen,
    onClose,
    onImportSuccess,
}: MaterialImportDialogProps) {
    const [rawText, setRawText] = useState("");
    const [parsedItems, setParsedItems] = useState<Partial<Material>[]>([]);
    const [step, setStep] = useState<"UPLOAD" | "PREVIEW">("UPLOAD");
    const [errorMsg, setErrorMsg] = useState("");

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setRawText(content);
            parseContent(content);
        };
        reader.readAsText(file);
    };

    const parseContent = (text: string) => {
        setErrorMsg("");
        try {
            // Check if JSON format
            if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
                const json = JSON.parse(text);
                const items = Array.isArray(json) ? json : [json];
                const validItems = items.map((item, idx) => ({
                    title: item.title || `Materi Impor ${idx + 1}`,
                    subject_name: item.subject_name || "Penalaran Matematika",
                    category: item.category || "TEORI",
                    reading_time_minutes: Number(item.reading_time_minutes) || 15,
                    content: item.content || "",
                    status: (item.status || "PUBLISHED") as any,
                }));
                setParsedItems(validItems);
                setStep("PREVIEW");
                return;
            }

            // Parse Markdown format (Split by "# " or "---")
            const sections = text.split(/^#\s+/m).filter(Boolean);
            if (sections.length > 0) {
                const items = sections.map((sec, idx) => {
                    const lines = sec.split("\n");
                    const title = lines[0]?.trim() || `Materi Impor ${idx + 1}`;
                    const content = lines.slice(1).join("\n").trim();
                    return {
                        title,
                        subject_name: "Penalaran Matematika",
                        category: "TEORI",
                        reading_time_minutes: 15,
                        content,
                        status: "PUBLISHED" as any,
                    };
                });
                setParsedItems(items);
                setStep("PREVIEW");
                return;
            }

            setErrorMsg("Format file tidak dikenali. Gunakan file JSON atau Markdown (.md).");
        } catch {
            setErrorMsg("Gagal mengurai file. Pastikan struktur JSON atau Markdown valid.");
        }
    };

    const handleRemoveItem = (index: number) => {
        setParsedItems((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleCommitImport = () => {
        if (parsedItems.length === 0) return;
        onImportSuccess(parsedItems);
        handleReset();
        onClose();
    };

    const handleReset = () => {
        setRawText("");
        setParsedItems([]);
        setStep("UPLOAD");
        setErrorMsg("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto rounded-2xl border-border p-6 shadow-2xl">
                <DialogHeader className="space-y-1 pb-3 border-b border-border">
                    <DialogTitle className="text-lg font-bold font-heading flex items-center gap-2">
                        <UploadCloud className="h-5 w-5 text-primary" />
                        Impor Modul Belajar Massal (JSON / Markdown)
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground">
                        Unggah file dokumen materi belajar atau tempel teks Markdown untuk impor cepat ke database.
                    </p>
                </DialogHeader>

                {step === "UPLOAD" ? (
                    <div className="space-y-4 py-4 text-xs">
                        {/* Dropzone */}
                        <div className="border-2 border-dashed border-border hover:border-primary/60 transition-colors rounded-2xl p-8 text-center space-y-3 bg-muted/20">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-foreground">Pilih File Markdown (.md) atau JSON (.json)</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Atau drag and drop file dokumen Anda di sini</p>
                            </div>

                            <label className="inline-flex cursor-pointer">
                                <span className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs shadow-xs hover:bg-primary/90 transition-colors">
                                    Buka File Komputer
                                </span>
                                <input
                                    type="file"
                                    accept=".md,.json,.txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Raw Paste Textarea */}
                        <div className="space-y-1.5">
                            <label className="font-bold text-foreground">Atau Tempel Teks Raw Markdown / JSON:</label>
                            <textarea
                                rows={6}
                                value={rawText}
                                onChange={(e) => {
                                    setRawText(e.target.value);
                                    if (e.target.value.trim()) {
                                        parseContent(e.target.value);
                                    }
                                }}
                                placeholder="# Judul Materi 1&#10;Konten teori...&#10;&#10;# Judul Materi 2&#10;Konten teori..."
                                className="w-full rounded-xl border border-input bg-background p-3 font-mono text-xs focus:outline-hidden"
                            />
                        </div>

                        {errorMsg && (
                            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {errorMsg}
                            </div>
                        )}
                    </div>
                ) : (
                    /* PREVIEW parsed items step */
                    <div className="space-y-4 py-3 text-xs">
                        <div className="flex items-center justify-between bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="font-bold">Berhasil Mengurai {parsedItems.length} Materi</span>
                            </div>
                            <Button size="sm" variant="ghost" onClick={handleReset} className="h-7 text-xs">
                                Unggah File Lain
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                            {parsedItems.map((item, idx) => (
                                <div key={idx} className="p-3.5 rounded-xl border border-border bg-card space-y-2 relative group">
                                    <div className="flex items-center justify-between pr-8">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px]">
                                                {item.subject_name}
                                            </Badge>
                                            <span className="font-bold text-sm text-foreground">{item.title}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">
                                            {item.reading_time_minutes} mnt baca
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="absolute right-2 top-2 h-7 w-7 text-destructive hover:bg-destructive/10"
                                        title="Hapus dari daftar impor"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter className="pt-3 border-t border-border flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                        Batal
                    </Button>

                    {step === "PREVIEW" && (
                        <Button size="sm" onClick={handleCommitImport} className="rounded-xl gap-1.5 font-semibold shadow-xs">
                            <Sparkles className="h-4 w-4" /> Impor {parsedItems.length} Modul ke Database
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
