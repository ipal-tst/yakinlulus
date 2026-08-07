"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Material } from "@/types";
import { Monitor, Smartphone, BookOpen, Clock, CheckCircle2, Video, FileText, ArrowLeft, Share2, Bookmark } from "lucide-react";

interface MaterialPreviewDialogProps {
    item: Material | null;
    isOpen: boolean;
    onClose: () => void;
}

export function MaterialPreviewDialog({ item, isOpen, onClose }: MaterialPreviewDialogProps) {
    const [viewMode, setViewMode] = useState<"DESKTOP" | "MOBILE">("DESKTOP");
    const [isSimulatedCompleted, setIsSimulatedCompleted] = useState(false);

    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-[90vw] max-h-[92vh] overflow-y-auto rounded-2xl border-border p-6 shadow-2xl">
                <DialogHeader className="space-y-1 pb-3 border-b border-border">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-bold font-heading flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            Pratinjau Modul Belajar Siswa (LMS Simulator)
                        </DialogTitle>

                        {/* Viewport Switcher */}
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                            <Button
                                variant={viewMode === "DESKTOP" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("DESKTOP")}
                                className="h-7 text-xs rounded-lg gap-1.5"
                            >
                                <Monitor className="h-3.5 w-3.5" /> Desktop
                            </Button>
                            <Button
                                variant={viewMode === "MOBILE" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("MOBILE")}
                                className="h-7 text-xs rounded-lg gap-1.5"
                            >
                                <Smartphone className="h-3.5 w-3.5" /> Mobile App
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Simulator Screen Area */}
                <div className="py-4 flex justify-center bg-muted/30 rounded-2xl p-4 min-h-[500px]">
                    <div
                        className={`transition-all duration-300 bg-background border border-border rounded-2xl p-6 shadow-lg space-y-6 ${viewMode === "MOBILE" ? "w-[380px] max-w-full" : "w-full max-w-3xl"
                            }`}
                    >
                        {/* LMS Student Top Bar */}
                        <div className="flex items-center justify-between pb-3 border-b border-border/60">
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                <ArrowLeft className="h-3.5 w-3.5" /> Kembalike Katalog
                            </span>
                            <div className="flex items-center gap-2">
                                <Bookmark className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                <Share2 className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </div>
                        </div>

                        {/* Badges & Meta */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                    {item.subject_name || "Penalaran Matematika"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {item.category === "TRIK_CEPAT"
                                        ? "Trik Cepat"
                                        : item.category === "STRATEGI"
                                            ? "Strategi Belajar"
                                            : "Rangkuman Teori"}
                                </Badge>
                                <Badge variant="outline" className="text-xs gap-1 text-purple-600 border-purple-200 bg-purple-50">
                                    <Clock className="h-3 w-3" /> {item.reading_time_minutes || 15} Menit Baca
                                </Badge>
                            </div>

                            <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground leading-tight">
                                {item.title}
                            </h1>
                        </div>

                        {/* Optional Video Embed Preview */}
                        {item.video_url && (
                            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-border shadow-xs">
                                <div className="text-center p-6 space-y-2">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 text-primary mx-auto flex items-center justify-center">
                                        <Video className="h-6 w-6" />
                                    </div>
                                    <p className="text-xs font-medium text-white">Video Tutorial Terlampir</p>
                                    <p className="text-[11px] text-zinc-400 font-mono">{item.video_url}</p>
                                </div>
                            </div>
                        )}

                        {/* Material Content Reader */}
                        <div className="prose prose-slate dark:prose-invert max-w-none text-xs md:text-sm leading-relaxed space-y-4 font-sans border-t border-b border-border/50 py-4">
                            {item.content ? (
                                item.content.split("\n\n").map((para, idx) => (
                                    <p key={idx} className="text-foreground/90 whitespace-pre-wrap">
                                        {para}
                                    </p>
                                ))
                            ) : (
                                <p className="text-muted-foreground italic text-xs">
                                    Belum ada konten tulisan pada modul ini. Masukkan teks teori melalui editor authoring.
                                </p>
                            )}
                        </div>

                        {/* Optional PDF Attachment Preview */}
                        {item.pdf_url && (
                            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                    <div>
                                        <p className="font-semibold text-purple-900 dark:text-purple-300">File Rangkuman PDF</p>
                                        <p className="text-[11px] text-purple-700/80 dark:text-purple-400 font-mono">{item.pdf_url}</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 border-purple-300 text-purple-700">
                                    Unduh PDF
                                </Button>
                            </div>
                        )}

                        {/* LMS Student Completion Action */}
                        <div className="pt-2 flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                Modul 1 dari 8 pada Bab ini
                            </div>

                            <Button
                                size="sm"
                                variant={isSimulatedCompleted ? "outline" : "default"}
                                onClick={() => setIsSimulatedCompleted(!isSimulatedCompleted)}
                                className="rounded-xl gap-1.5 text-xs h-9 font-semibold"
                            >
                                <CheckCircle2 className={`h-4 w-4 ${isSimulatedCompleted ? "text-emerald-500" : ""}`} />
                                {isSimulatedCompleted ? "Selesai Dibaca" : "Tandai Selesai"}
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-3 border-t border-border">
                    <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                        Tutup Pratinjau
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
