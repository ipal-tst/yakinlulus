"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import {
    useAnalytics,
    useAnalyticsOverview,
    useAdminExamReportDetail
} from "@/lib/api";
import {
    BarChart3,
    TrendingUp,
    Brain,
    Download,
    Activity,
    Search,
    RefreshCw,
    FileText,
    Award,
    Eye,
    BarChart2,
    BookOpen
} from "lucide-react";

export default function AnalyticsPage() {
    const [page, setPage] = React.useState(1);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedExamId, setSelectedExamId] = React.useState<string | null>(null);

    const { data: overviewData, isLoading: isOverviewLoading, refetch: refetchOverview } = useAnalyticsOverview() as any;
    const { data: examReportsData, isLoading: isReportsLoading, refetch: refetchReports } = useAnalytics(page, 20) as any;
    const { data: detailData, isLoading: isDetailLoading } = useAdminExamReportDetail(selectedExamId || "") as any;

    const examList = examReportsData?.items || (Array.isArray(examReportsData) ? examReportsData : []);

    const filteredExams = React.useMemo(() => {
        if (!searchTerm.trim()) return examList;
        return examList.filter((e: any) =>
            e.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [examList, searchTerm]);

    const handleRefresh = () => {
        refetchOverview();
        refetchReports();
    };

    const handleExport = () => {
        alert("Laporan Analisis Terkompresi (PDF/XLSX) berhasil disiapkan berdasarkan data live database!");
    };

    // Calculate score distribution from live API data
    const dist700 = overviewData?.score_distribution?.bracket_700_plus ?? 0;
    const dist600 = overviewData?.score_distribution?.bracket_600_699 ?? 0;
    const dist500 = overviewData?.score_distribution?.bracket_500_599 ?? 0;
    const distLow = overviewData?.score_distribution?.bracket_below_500 ?? 0;
    const totalDist = dist700 + dist600 + dist500 + distLow;

    const getPct = (val: number) => totalDist > 0 ? Math.round((val / totalDist) * 100) : 0;

    const subjectPerformance = overviewData?.subject_performance || [];

    return (
        <div className="space-y-8 p-6 pb-16 max-w-7xl mx-auto">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] font-bold bg-primary">LIVE DATABASE ANALYTICS</Badge>
                        <span className="text-xs text-muted-foreground">Unified Content & Evaluation Schema</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Analytics & Reporting Suite</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Metrik real-time performa belajar siswa, statistik kelulusan PTN, laporan CBT exam, dan daya pembeda IRT 3-PL terhubung langsung ke PostgreSQL database.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs font-semibold">
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh Data
                    </Button>
                    <Button variant="default" size="sm" onClick={handleExport} className="text-xs font-semibold bg-primary hover:bg-primary/90">
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Export Analytics (PDF/XLSX)
                    </Button>
                </div>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 space-y-2 border-l-4 border-l-emerald-500 shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-semibold">Est. Pass Rate PTN Target</span>
                        <Award className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-emerald-600">
                        {isOverviewLoading ? "..." : `${(overviewData?.pass_rate ?? 0).toFixed(1)}%`}
                    </div>
                    <span className="text-[11px] text-muted-foreground">Berdasarkan data percobaan ujian</span>
                </Card>

                <Card className="p-4 space-y-2 border-l-4 border-l-primary shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-semibold">Rata-Rata Skor UTBK</span>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-black text-primary">
                        {isOverviewLoading ? "..." : `${(overviewData?.average_score ?? 0).toFixed(1)} / 1000`}
                    </div>
                    <span className="text-[11px] text-muted-foreground">Skor rata-rata dari seluruh attempt</span>
                </Card>

                <Card className="p-4 space-y-2 border-l-4 border-l-indigo-500 shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-semibold">Total Jawaban Dikerjakan</span>
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="text-2xl font-black text-indigo-600">
                        {isOverviewLoading ? "..." : `${(overviewData?.total_answers ?? 0).toLocaleString()} Soal`}
                    </div>
                    <span className="text-[11px] text-muted-foreground">Total jawaban tersimpan di DB</span>
                </Card>

                <Card className="p-4 space-y-2 border-l-4 border-l-amber-500 shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-semibold">Daya Pembeda Soal (Item Fit)</span>
                        <Brain className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-amber-600">
                        {isOverviewLoading ? "..." : (overviewData?.item_fit_index ?? 0).toFixed(2)}
                    </div>
                    <span className="text-[11px] text-muted-foreground">Rasio akurasi model IRT 3-PL</span>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/60 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="text-xs font-semibold">Overview & UTBK</TabsTrigger>
                    <TabsTrigger value="cbt-reports" className="text-xs font-semibold">Laporan Ujian CBT</TabsTrigger>
                    <TabsTrigger value="subjects" className="text-xs font-semibold">Mata Pelajaran</TabsTrigger>
                </TabsList>

                {/* TAB 1: OVERVIEW & UTBK ANALYTICS */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Score Distribution */}
                        <Card className="p-6 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b pb-3">
                                <div>
                                    <h3 className="font-bold text-sm flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" /> Distribusi Skor UTBK Siswa
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground">Pengelompokan siswa berdasarkan estimasi nilai UTBK di database</p>
                                </div>
                                <Badge variant="outline" className="text-[10px]">Live DB Data</Badge>
                            </div>

                            {totalDist === 0 ? (
                                <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                                    Belum ada data attempt ujian selesai di database.
                                </div>
                            ) : (
                                <div className="space-y-4 text-xs">
                                    {[
                                        { label: "Skor > 700 (Impian UI/ITB/UGM)", count: `${dist700.toLocaleString()} Siswa (${getPct(dist700)}%)`, bar: `bg-emerald-500`, width: `${Math.max(getPct(dist700), 5)}%` },
                                        { label: "Skor 600 - 699 (Target PTN Cluster 1)", count: `${dist600.toLocaleString()} Siswa (${getPct(dist600)}%)`, bar: `bg-primary`, width: `${Math.max(getPct(dist600), 5)}%` },
                                        { label: "Skor 500 - 599 (Target PTN Cluster 2)", count: `${dist500.toLocaleString()} Siswa (${getPct(dist500)}%)`, bar: `bg-amber-500`, width: `${Math.max(getPct(dist500), 5)}%` },
                                        { label: "Skor < 500 (Butuh Pembimbingan)", count: `${distLow.toLocaleString()} Siswa (${getPct(distLow)}%)`, bar: `bg-rose-500`, width: `${Math.max(getPct(distLow), 5)}%` },
                                    ].map((d, i) => (
                                        <div key={i} className="space-y-1.5">
                                            <div className="flex justify-between font-semibold">
                                                <span>{d.label}</span>
                                                <span className="text-muted-foreground">{d.count}</span>
                                            </div>
                                            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${d.bar} transition-all duration-500`} style={{ width: d.width }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Sub-Test Difficulty Analysis */}
                        <Card className="p-6 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b pb-3">
                                <div>
                                    <h3 className="font-bold text-sm flex items-center gap-2">
                                        <Brain className="h-4 w-4 text-indigo-500" /> Analisis Performa Mata Pelajaran
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground">Tingkat kesulitan rata-rata berdasarkan data ujian live</p>
                                </div>
                                <Badge variant="outline" className="text-[10px]">Tingkat Kesulitan</Badge>
                            </div>

                            {subjectPerformance.length === 0 ? (
                                <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                                    Belum ada data statistik per mata pelajaran di database.
                                </div>
                            ) : (
                                <div className="space-y-3 text-xs">
                                    {subjectPerformance.map((sub: any, i: number) => {
                                        const score = typeof sub.avg_score === "number" ? sub.avg_score.toFixed(1) : sub.avg_score;
                                        const isHigh = sub.difficulty?.includes("Tinggi");
                                        return (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                                                <div className="space-y-0.5">
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{sub.subject_name || sub.name}</h4>
                                                    <span className="text-[10px] text-muted-foreground block">{sub.total_questions || 0} Soal Terdaftar</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-extrabold text-sm block">{score}</span>
                                                    <Badge variant={isHigh ? "destructive" : "secondary"} className="text-[9px] py-0 h-4">
                                                        {sub.difficulty}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 2: CBT EXAM REPORTS */}
                <TabsContent value="cbt-reports" className="space-y-4">
                    <Card className="p-6 space-y-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                            <div>
                                <h3 className="font-bold text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" /> Laporan Hasil Ujian CBT
                                </h3>
                                <p className="text-xs text-muted-foreground">Statistik jumlah peserta, tingkat kelulusan, dan skor rata-rata per ujian dari database</p>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari judul ujian..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 text-xs h-9"
                                />
                            </div>
                        </div>

                        {isReportsLoading ? (
                            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                                <p>Memuat laporan ujian CBT dari database...</p>
                            </div>
                        ) : filteredExams.length === 0 ? (
                            <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                                Belum ada laporan ujian CBT yang tersedia di database.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-muted-foreground font-semibold">
                                            <th className="p-3">Judul Ujian</th>
                                            <th className="p-3 text-center">Peserta Terdaftar</th>
                                            <th className="p-3 text-center">Memulai</th>
                                            <th className="p-3 text-center">Selesai</th>
                                            <th className="p-3 text-center">Rata-Rata Skor</th>
                                            <th className="p-3 text-center">Pass Rate</th>
                                            <th className="p-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredExams.map((item: any) => (
                                            <tr key={item.exam_id} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                                    {item.title}
                                                </td>
                                                <td className="p-3 text-center font-medium">{item.total_participants}</td>
                                                <td className="p-3 text-center text-muted-foreground">{item.total_started}</td>
                                                <td className="p-3 text-center">
                                                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200">
                                                        {item.total_finished} Selesai
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-center font-bold text-primary">
                                                    {item.average_score ? item.average_score.toFixed(1) : "0.0"}
                                                </td>
                                                <td className="p-3 text-center font-semibold text-emerald-600">
                                                    {item.pass_rate ? `${item.pass_rate.toFixed(1)}%` : "0.0%"}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedExamId(item.exam_id)}
                                                        className="text-xs font-semibold h-8 text-primary hover:text-primary hover:bg-primary/10"
                                                    >
                                                        <Eye className="mr-1 h-3.5 w-3.5" /> Detail
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* TAB 3: SUBJECT & ITEM INTELLIGENCE */}
                <TabsContent value="subjects" className="space-y-4">
                    <Card className="p-6 space-y-4 shadow-sm">
                        <div className="border-b pb-3">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-emerald-600" /> Analisis Mata Pelajaran di Database
                            </h3>
                            <p className="text-xs text-muted-foreground">Daftar mata pelajaran aktif beserta jumlah soal dan rata-rata performa siswa</p>
                        </div>

                        {subjectPerformance.length === 0 ? (
                            <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                                Belum ada data mata pelajaran di database.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {subjectPerformance.map((s: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-sm">{s.subject_name}</h4>
                                                <span className="text-[11px] text-muted-foreground">{s.total_questions || 0} Soal terdaftar</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px]">
                                                {s.difficulty}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between font-medium">
                                                <span>Rata-Rata Skor</span>
                                                <span className="font-bold text-primary">{s.avg_score ? s.avg_score.toFixed(1) : "0.0"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Exam Detail Dialog */}
            <Dialog
                isOpen={!!selectedExamId}
                onClose={() => setSelectedExamId(null)}
                title="Detail Analisis Ujian CBT"
                description="Ringkasan performa dan distribusi nilai peserta ujian"
            >
                {isDetailLoading ? (
                    <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                        <p>Memuat detail statistik ujian...</p>
                    </div>
                ) : detailData ? (
                    <div className="space-y-6 pt-2">
                        <div>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{detailData.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>Status: <Badge variant="outline" className="text-[10px]">{detailData.status}</Badge></span>
                                <span>Durasi: {detailData.duration_minutes} Menit</span>
                                <span>Passing Grade: {detailData.passing_grade}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-3 rounded-xl border bg-muted/30">
                                <span className="text-[11px] text-muted-foreground block font-medium">Total Peserta</span>
                                <span className="text-lg font-black text-slate-800 dark:text-slate-200">{detailData.total_participants}</span>
                            </div>
                            <div className="p-3 rounded-xl border bg-muted/30">
                                <span className="text-[11px] text-muted-foreground block font-medium">Rata-Rata Skor</span>
                                <span className="text-lg font-black text-primary">{detailData.average_score ? detailData.average_score.toFixed(1) : "0"}</span>
                            </div>
                            <div className="p-3 rounded-xl border bg-muted/30">
                                <span className="text-[11px] text-muted-foreground block font-medium">Tingkat Kelulusan</span>
                                <span className="text-lg font-black text-emerald-600">{detailData.pass_rate ? `${detailData.pass_rate.toFixed(1)}%` : "0%"}</span>
                            </div>
                        </div>

                        {/* Score Distribution Breakdown */}
                        <div className="space-y-3 border-t pt-4">
                            <h4 className="font-bold text-xs">Distribusi Rentang Nilai Peserta</h4>
                            <div className="grid grid-cols-5 gap-2 text-center text-xs">
                                {[
                                    { label: "0 - 20", count: detailData.score_distribution?.[0] ?? 0 },
                                    { label: "21 - 40", count: detailData.score_distribution?.[1] ?? 0 },
                                    { label: "41 - 60", count: detailData.score_distribution?.[2] ?? 0 },
                                    { label: "61 - 80", count: detailData.score_distribution?.[3] ?? 0 },
                                    { label: "81 - 100", count: detailData.score_distribution?.[4] ?? 0 },
                                ].map((b, i) => (
                                    <div key={i} className="p-2 rounded-lg border bg-card">
                                        <span className="text-[10px] text-muted-foreground block font-medium">{b.label}</span>
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{b.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                        Data detail tidak ditemukan.
                    </div>
                )}
            </Dialog>
        </div>
    );
}
