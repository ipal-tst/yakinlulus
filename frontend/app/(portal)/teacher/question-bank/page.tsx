"use client";

import * as React from "react";
import Link from "next/link";
import { useQuestions } from "@/lib/api";
import {
    Plus,
    Search,
    Filter,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    Clock,
    AlertCircle,
    Edit3,
    Eye,
    Copy,
    Trash2,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MathKaTeXPreview } from "@/components/editor/MathKaTeXPreview";

export default function QuestionBankCatalogPage() {
    const { data: questionsData, isLoading, error } = useQuestions();
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedSubject, setSelectedSubject] = React.useState("ALL");
    const [selectedStatus, setSelectedStatus] = React.useState("ALL");

    const filteredQuestions = React.useMemo(() => {
        if (!questionsData) return [];
        const arr = Array.isArray(questionsData) ? questionsData : [];
        return arr.filter((q: any) => {
            const matchesSearch =
                !searchQuery.trim() ||
                (q.code || q.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (q.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (q.stemLatex || q.body || "").toLowerCase().includes(searchQuery.toLowerCase());

            const matchesSubject = selectedSubject === "ALL" || q.subject === selectedSubject;
            const matchesStatus = selectedStatus === "ALL" || q.status === selectedStatus;

            return matchesSearch && matchesSubject && matchesStatus;
        });
    }, [questionsData, searchQuery, selectedSubject, selectedStatus]);

    const subjects = React.useMemo(() => {
        if (!questionsData) return [];
        const arr = Array.isArray(questionsData) ? questionsData : [];
        return [...new Set(arr.map((q: any) => q.subject || "").filter(Boolean))];
    }, [questionsData]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PUBLISHED":
            case "APPROVED":
                return <Badge variant="success">{status}</Badge>;
            case "IN_REVIEW":
                return <Badge variant="warning">{status}</Badge>;
            case "REJECTED":
                return <Badge variant="destructive">{status}</Badge>;
            default:
                return <Badge variant="secondary">{status || "DRAFT"}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p className="text-sm font-medium">Gagal memuat bank soal</p>
                <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Katalog Bank Soal Ujian</h2>
                    <p className="text-sm text-muted-foreground">
                        Kelola repositori butir soal dengan penyaringan hirarkis, preview LaTeX, dan workflow FSM.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/teacher/question-bank/create">
                        <Button size="sm">
                            <Plus className="mr-1.5 h-4 w-4" /> Tulis Soal Baru (Studio)
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filtering Controls */}
            <Card className="p-4 shadow-xs">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari kode soal, materi, atau rumus LaTeX..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="h-9 px-3 rounded-lg border bg-background text-xs font-medium focus:outline-hidden"
                        >
                            <option value="ALL">Semua Mata Pelajaran</option>
                            {subjects.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-9 px-3 rounded-lg border bg-background text-xs font-medium focus:outline-hidden"
                        >
                            <option value="ALL">Semua Status FSM</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="IN_REVIEW">IN_REVIEW</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="PUBLISHED">PUBLISHED</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Question List View */}
            <div className="space-y-4">
                {filteredQuestions.map((q: any) => (
                    <Card key={q.id} className="hover:border-primary/50 transition-colors shadow-xs">
                        <CardContent className="p-5 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                        {q.code || q.id.slice(0, 8)}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                        {q.subject || (q.question?.question_type ?? "SINGLE_CHOICE")}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <ChevronRight className="h-3 w-3" /> {q.chapter || "General"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px]">
                                        {q.question?.question_type || q.type || "SINGLE_CHOICE"}
                                    </Badge>
                                    {getStatusBadge(q.status)}
                                </div>
                            </div>

                            {/* Question Stem Render */}
                            <div className="bg-muted/30 p-3 rounded-lg border">
                                <MathKaTeXPreview content={q.stemLatex || q.body || ""} />
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                <span>Diperbarui: {new Date(q.updated_at || q.updatedAt || "").toLocaleDateString("id-ID")} • Tingkat Kesulitan: <strong className="text-foreground">{q.question?.difficulty || q.difficulty || "MEDIUM"}</strong></span>
                                <div className="flex items-center gap-2">
                                    <Link href="/teacher/question-bank/create">
                                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                                            <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                                        <Copy className="mr-1 h-3.5 w-3.5" /> Duplikasi
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredQuestions.length === 0 && (
                    <Card className="p-8 text-center text-muted-foreground">
                        Tidak ada butir soal yang sesuai dengan kriteria pencarian.
                    </Card>
                )}
            </div>
        </div>
    );
}
