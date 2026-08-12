// src/components/admin/schools/target-score-trend-panel.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { targetSchoolService, TargetSchool } from "@/services/target-school.service";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface TargetScoreTrendPanelProps {
    payungs: TargetSchool[];
}

function DeltaBadge({ value }: { value?: number }) {
    if (value === undefined) return <span className="text-xs text-muted-foreground">-</span>;
    if (value > 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">
                <TrendingUp className="h-3 w-3" /> +{value}
            </span>
        );
    }
    if (value < 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                <TrendingDown className="h-3 w-3" /> {value}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            0
        </span>
    );
}

export function TargetScoreTrendPanel({ payungs = [] }: TargetScoreTrendPanelProps) {
    const safePayungs = Array.isArray(payungs) ? payungs : [];
    const [payungId, setPayungId] = useState(safePayungs[0]?.id ?? "");

    const { data: points = [], isLoading, error, refetch } = useQuery({
        queryKey: ["admin-target-score-trend", payungId],
        queryFn: () => targetSchoolService.getTrend(payungId),
        enabled: Boolean(payungId),
    });

    const safePoints = Array.isArray(points) ? points : [];

    return (
        <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-2">
                    <CardTitle className="text-base font-bold">Tren Nilai Penerimaan</CardTitle>
                    <Select value={payungId} onValueChange={(v: string | null) => setPayungId(v ?? "")}>
                        <SelectTrigger className="w-full sm:w-[300px]">
                            <SelectValue placeholder="Pilih target sekolah" />
                        </SelectTrigger>
                        <SelectContent>
                            {safePayungs.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {safePoints.length} tahun
                </span>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error instanceof Error ? error.message : "Gagal memuat tren nilai"}</span>
                        <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto rounded-lg">
                            Coba lagi
                        </Button>
                    </div>
                )}

                {isLoading ? (
                    <Skeleton className="h-56 w-full rounded-2xl" />
                ) : !payungId || safePoints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 py-10 text-center">
                        <p className="text-sm font-semibold text-foreground">Belum ada data nilai</p>
                        <p className="text-xs text-muted-foreground max-w-xs">
                            Tambahkan nilai penerimaan per tahun ajaran untuk melihat tren di sini.
                        </p>
                    </div>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={safePoints} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="academic_year" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={40} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: 12 }}
                                    labelStyle={{ fontWeight: 600 }}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line
                                    type="monotone"
                                    dataKey="min_score"
                                    name="Nilai Min"
                                    stroke="var(--primary)"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="max_score"
                                    name="Nilai Max"
                                    stroke="#F97316"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="px-3 py-2 font-semibold text-foreground">Tahun</th>
                                        <th className="px-3 py-2 font-semibold text-foreground">Min</th>
                                        <th className="px-3 py-2 font-semibold text-foreground">Max</th>
                                        <th className="px-3 py-2 font-semibold text-foreground">Δ Min</th>
                                        <th className="px-3 py-2 font-semibold text-foreground">Δ Max</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safePoints.map((p) => (
                                        <tr key={p.academic_year} className="border-b border-border/60 last:border-0">
                                            <td className="px-3 py-1.5 font-medium text-foreground">{p.academic_year}</td>
                                            <td className="px-3 py-1.5 font-mono">{p.min_score ?? "-"}</td>
                                            <td className="px-3 py-1.5 font-mono">{p.max_score ?? "-"}</td>
                                            <td className="px-3 py-1.5"><DeltaBadge value={p.delta_min} /></td>
                                            <td className="px-3 py-1.5"><DeltaBadge value={p.delta_max} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
