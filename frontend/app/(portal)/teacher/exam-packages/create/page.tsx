"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateExam } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Save,
    Sparkles,
    CheckCircle2,
    Calendar,
    Clock,
    Layers,
    FileSpreadsheet,
    Shield,
    Loader2,
} from "lucide-react";

export default function CreateTeacherExamPackagePage() {
    const router = useRouter();
    const createExam = useCreateExam();
    const [title, setTitle] = React.useState("");
    const [code, setCode] = React.useState("");
    const [duration, setDuration] = React.useState("195");
    const [jenjang, setJenjang] = React.useState("SMA");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        createExam.mutate(
            {
                title,
                code: code || undefined,
                duration_minutes: parseInt(duration, 10),
                grade_id: jenjang,
                status: "DRAFT",
            },
            {
                onSuccess: () => {
                    router.push("/teacher/exam-packages");
                },
            }
        );
    };

    return (
        <div className="space-y-6 p-6 pb-16 max-w-4xl mx-auto">
            {/* Header Nav */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/teacher/exam-packages">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <Badge variant="default" className="text-[10px] font-bold">CBT BLUEPRINT STUDIO</Badge>
                        <h1 className="text-2xl font-extrabold tracking-tight">Buat Paket Ujian Tryout Baru</h1>
                    </div>
                </div>

                <Button size="sm" onClick={handleSubmit} disabled={createExam.isPending} className="text-xs font-bold">
                    {createExam.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {createExam.isPending ? "Menyimpan..." : "Simpan Paket Ujian"}
                </Button>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6 space-y-4">
                    <h3 className="font-bold text-sm border-b pb-3 flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-primary" /> Informasi Utama Paket Ujian
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Kode Paket Ujian</label>
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Contoh: TO-SNBT-2026-04"
                                className="font-mono text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Target Jenjang Pendidikan</label>
                            <select
                                value={jenjang}
                                onChange={(e) => setJenjang(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold"
                            >
                                <option value="SD">SD (Kelas 4-6) - Asesmen Literasi & Numerasi</option>
                                <option value="SMP">SMP (Kelas 7-9) - Asesmen Nasional & US</option>
                                <option value="SMA">SMA (Kelas 10-12) & UTBK SNBT 2026</option>
                                <option value="GAP_YEAR">Gap Year / Alumni UTBK</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Judul Paket Ujian</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Contoh: Tryout Akbar SNBT UTBK 2026 Paket #4 (Standar BPPP)"
                            className="text-xs"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Durasi Ujian (Menit)</label>
                            <Input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="text-xs font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Skema Penilaian</label>
                            <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold">
                                <option value="IRT">Item Response Theory (IRT 3-PL Standard)</option>
                                <option value="CLASSIC">Klasik (Bobot Benar/Salah Standard)</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Sub-test Blueprint Selection */}
                <Card className="p-6 space-y-4">
                    <h3 className="font-bold text-sm border-b pb-3 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" /> Blueprint Komposisi Sub-tes & Soal
                    </h3>

                    <div className="space-y-3">
                        <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between text-xs">
                            <div>
                                <span className="font-bold block">1. Penalaran Umum (PU)</span>
                                <span className="text-muted-foreground">Logika Induktif, Deduktif, Kuantitaf</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs">30 Soal • 30 Mins</Badge>
                        </div>

                        <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between text-xs">
                            <div>
                                <span className="font-bold block">2. Pengetahuan Kuantitatif (PK)</span>
                                <span className="text-muted-foreground">Aljabar, Geometri, Aritmatika</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs">20 Soal • 25 Mins</Badge>
                        </div>

                        <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between text-xs">
                            <div>
                                <span className="font-bold block">3. Literasi Bahasa Inggris</span>
                                <span className="text-muted-foreground">Reading Comprehension & KaTeX passages</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs">20 Soal • 30 Mins</Badge>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-3 pt-2">
                    <Link href="/teacher/exam-packages">
                        <Button type="button" variant="outline" size="sm" className="text-xs">
                            Batal
                        </Button>
                    </Link>
                    <Button type="submit" size="sm" disabled={createExam.isPending} className="text-xs font-bold">
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Simpan & Lanjutkan
                    </Button>
                </div>
            </form>
        </div>
    );
}
