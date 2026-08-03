"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIPDFImportModal } from "@/components/admin/AIPDFImportModal";
import { BulkImportSection } from "@/components/admin/BulkImportSection";
import { useSubjects, useChapters, useQuestions } from "@/lib/api";
import { ArrowLeft, FileSpreadsheet, Sparkles } from "lucide-react";

export default function ImportQuestionPage() {
    const router = useRouter();
    const { data: subjects = [] } = useSubjects() as any;
    const subjectsList: any[] = Array.isArray(subjects) ? subjects : subjects?.data || [];
    const { data: chapters = [] } = useChapters() as any;
    const chaptersList: any[] = Array.isArray(chapters) ? chapters : chapters?.data || [];
    const { refetch } = useQuestions() as any;

    return (
        <div className="space-y-6 p-6 pb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold">BANK SOAL</Badge>
                        <span className="text-xs text-muted-foreground">Impor soal massal</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Import Soal</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Ekstrak soal otomatis dari PDF / Gambar / Excel / CSV, lalu pratinjau sebelum disimpan.
                    </p>
                </div>

                <Link href="/admin/question-bank">
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Bank Soal
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="ai">
                <TabsList className="gap-2">
                    <TabsTrigger value="ai" className="text-xs font-bold">
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI PDF / Gambar
                    </TabsTrigger>
                    <TabsTrigger value="excel" className="text-xs font-bold">
                        <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel / CSV
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="mt-4">
                    <AIPDFImportModal
                        variant="section"
                        subjectsList={subjectsList}
                        chaptersList={chaptersList}
                        onSuccessImport={() => refetch()}
                    />
                </TabsContent>

                <TabsContent value="excel" className="mt-4">
                    <BulkImportSection subjectsList={subjectsList} onSuccessImport={() => refetch()} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
