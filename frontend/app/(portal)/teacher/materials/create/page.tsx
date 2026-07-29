"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateMaterial } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Save,
    UploadCloud,
    BookOpen,
    FileText,
    Video,
    CheckCircle2,
    Sparkles,
    Loader2,
} from "lucide-react";

export default function CreateTeacherMaterialPage() {
    const router = useRouter();
    const createMaterial = useCreateMaterial();
    const [title, setTitle] = React.useState("");
    const [code, setCode] = React.useState("");
    const [subtest, setSubtest] = React.useState("Penalaran Umum");
    const [format, setFormat] = React.useState("PDF_RANGKUMAN");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        createMaterial.mutate(
            {
                title,
                code: code || undefined,
                content_type: "MATERIAL",
                subject_id: subtest,
                material: {
                    content_format: format === "VIDEO_HD" ? "VIDEO" : format === "PDF_RANGKUMAN" ? "PDF" : "INTERACTIVE",
                },
                status: "PUBLISHED",
            },
            {
                onSuccess: () => {
                    router.push("/teacher/materials");
                },
            }
        );
    };

    return (
        <div className="space-y-6 p-6 pb-16 max-w-4xl mx-auto">
            {/* Header Nav */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/teacher/materials">
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <Badge variant="default" className="text-[10px] font-bold">MATERIAL CMS EDITOR</Badge>
                        <h1 className="text-2xl font-extrabold tracking-tight">Upload Materi Pembelajaran Baru</h1>
                    </div>
                </div>

                <Button size="sm" onClick={handleSubmit} disabled={createMaterial.isPending} className="text-xs font-bold">
                    {createMaterial.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {createMaterial.isPending ? "Mengunggah..." : "Terbitkan Materi"}
                </Button>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6 space-y-4">
                    <h3 className="font-bold text-sm border-b pb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" /> Informasi Materi Belajar
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Kode Modul Materi</label>
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Contoh: MAT-PM-005"
                                className="font-mono text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Kategori Sub-tes / Mapel</label>
                            <select
                                value={subtest}
                                onChange={(e) => setSubtest(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold"
                            >
                                <option value="Penalaran Umum">Penalaran Umum (PU)</option>
                                <option value="Pengetahuan Kuantitatif">Pengetahuan Kuantitatif (PK)</option>
                                <option value="Literasi Bahasa Inggris">Literasi Bahasa Inggris</option>
                                <option value="Penalaran Matematika">Penalaran Matematika (PM)</option>
                                <option value="Literasi Numerasi SD">Literasi Numerasi SD</option>
                                <option value="Asesmen SMP">Asesmen SMP</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Judul Materi Pembelajaran</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Contoh: Modul Rangkuman Rumus Cepat Penalaran Kuantitatif SNBT 2026"
                            className="text-xs"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Format Konten Modul</label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold"
                        >
                            <option value="PDF_RANGKUMAN">Dokumen PDF Rangkuman (Modul E-Book)</option>
                            <option value="VIDEO_HD">Video Streaming HD (YouTube / Vimeo Embed)</option>
                            <option value="SLIDE">Slide Presentasi Interactive (PPT/PDF)</option>
                        </select>
                    </div>

                    {/* Upload File Zone */}
                    <div className="border-2 border-dashed rounded-xl p-8 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer space-y-2">
                        <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-bold text-foreground">Drag & Drop file PDF/Video di sini atau klik untuk browse</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Ukuran maksimal file PDF: 25MB • Format yang didukung: PDF, MP4, WebM</p>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-3 pt-2">
                    <Link href="/teacher/materials">
                        <Button type="button" variant="outline" size="sm" className="text-xs">
                            Batal
                        </Button>
                    </Link>
                    <Button type="submit" size="sm" disabled={createMaterial.isPending} className="text-xs font-bold">
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Terbitkan Sekarang
                    </Button>
                </div>
            </form>
        </div>
    );
}
