"use client";

import * as React from "react";
import { useExamPackages, usePackageExams, useRanking } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Calendar, School } from "lucide-react";

export default function StudentLeaderboardPage() {
    const { user } = useAuth();
    const { data: packagesData } = useExamPackages() as any;
    const packages = Array.isArray(packagesData)
        ? (packagesData as any[]).filter((p) => p.is_active !== false)
        : [];

    const [selectedPackageId, setSelectedPackageId] = React.useState<string>("");
    const [selectedMonth, setSelectedMonth] = React.useState<string>(
        new Date().toISOString().slice(0, 7),
    );

    React.useEffect(() => {
        if (!selectedPackageId && packages.length > 0) {
            setSelectedPackageId(packages[0].id);
        }
    }, [packages, selectedPackageId]);

    const { data: packageExamsData } = usePackageExams(selectedPackageId || undefined) as any;
    const packageExams = Array.isArray(packageExamsData) ? packageExamsData : [];

    const { data: rankingData, isLoading: rankingLoading } = useRanking(selectedPackageId || undefined, selectedMonth) as any;
    const rows = Array.isArray(rankingData) ? rankingData : [];

    const selectedPackage = packages.find((p: any) => p.id === selectedPackageId);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const isCurrentMonth = selectedMonth === currentMonth;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Peringkat Nilai</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Kompetisi sehat se-Indonesia. Peringkat dihitung dari nilai tryout setiap paket ujian.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <section className="bg-card rounded-2xl border p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Paket Ujian</label>
                        {packages.length > 0 ? (
                            <select
                                value={selectedPackageId}
                                onChange={(e) => setSelectedPackageId(e.target.value)}
                                className="w-full h-10 rounded-lg border bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {packages.map((p: any) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.education_level})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-xs text-muted-foreground py-2.5">Belum ada paket ujian tersedia.</div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Bulan</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full h-10 rounded-lg border bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>
                {isCurrentMonth && (
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-primary bg-primary/10 px-3 py-2 rounded-lg">
                        <Calendar className="h-3.5 w-3.5" /> Peringkat di-reset setiap bulan. Bulan ini = {selectedMonth}
                    </div>
                )}
            </section>

            {/* Empty state */}
            {selectedPackageId && packageExams.length === 0 && (
                <section className="bg-card rounded-2xl border border-dashed p-10 text-center">
                    <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                        Paket ini belum memiliki ujian. Hubungi admin untuk menautkan ujian ke paket.
                    </p>
                </section>
            )}

            {/* Ranking table */}
            {selectedPackageId && packageExams.length > 0 && (
                <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b">
                        <h2 className="font-bold text-sm">
                            {selectedPackage?.name || "Peringkat"} · {selectedMonth}
                        </h2>
                        <span className="text-[11px] text-muted-foreground">Reset bulanan</span>
                    </div>
                    {rankingLoading ? (
                        <div className="p-8 text-center">
                            <div className="h-5 w-40 animate-pulse bg-muted rounded-lg mx-auto mb-3" />
                            <div className="h-3 w-64 animate-pulse bg-muted rounded-lg mx-auto" />
                        </div>
                    ) : rows.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left text-muted-foreground bg-muted/40">
                                        <th className="py-3 px-4 font-semibold text-center w-12">No</th>
                                        <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                                        {packageExams.map((e: any) => (
                                            <th key={e.subject_id} className="py-3 px-4 font-semibold text-center whitespace-nowrap">
                                                {e.subject_name}
                                            </th>
                                        ))}
                                        <th className="py-3 px-4 font-semibold text-center">Total</th>
                                        <th className="py-3 px-4 font-semibold text-center">Rata-rata</th>
                                        <th className="py-3 px-4 font-semibold">
                                            <span className="inline-flex items-center gap-1">
                                                <School className="h-3.5 w-3.5" /> Sekolah
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r: any) => {
                                        const isMe = r.user_id === user?.id;
                                        return (
                                            <tr
                                                key={r.user_id}
                                                className={`border-b border-border/50 last:border-0 ${isMe ? "bg-primary/5" : "hover:bg-muted/30"}`}
                                            >
                                                <td className={`py-3 px-4 text-center font-black ${r.rank === 1 ? "text-warning" : r.rank === 2 ? "text-muted-foreground" : r.rank === 3 ? "text-amber-600" : ""}`}>
                                                    {r.rank}
                                                </td>
                                                <td className="py-3 px-4 font-semibold whitespace-nowrap">
                                                    {r.full_name}
                                                    {isMe && <span className="text-primary ml-1 text-xs">(Anda)</span>}
                                                </td>
                                                {packageExams.map((e: any) => {
                                                    const score = r.subject_scores?.[e.subject_id];
                                                    return (
                                                        <td key={e.subject_id} className="py-3 px-4 text-center font-mono">
                                                            {score != null ? score.toFixed(1) : "—"}
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-3 px-4 text-center font-mono font-bold">{r.total?.toFixed(1)}</td>
                                                <td className="py-3 px-4 text-center font-mono font-bold text-primary">{r.average?.toFixed(1)}</td>
                                                <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">{r.school_name || "—"}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-10 text-center">
                            <p className="text-xs text-muted-foreground">Belum ada nilai tryout pada bulan ini.</p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
