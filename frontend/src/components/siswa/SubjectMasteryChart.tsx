// frontend/src/components/siswa/SubjectMasteryChart.tsx
"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";
import type { SubjectMasteryResponse } from "@/types/siswa";
import { BarChart3, ClipboardList } from "lucide-react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SubjectMasteryChartProps {
    data: SubjectMasteryResponse | null;
    threshold?: number;
    loading?: boolean;
}

const CHART_COLORS = {
    strongLight: "#16A34A",
    strongDark: "#4ADE80",
    weakLight: "#EF4444",
    weakDark: "#F87171",
    gridLight: "#E2E8F0",
    gridDark: "#1F2937",
    tickLight: "#64748B",
    tickDark: "#9CA3AF",
};

export function SubjectMasteryChart({ data, threshold = 70, loading }: SubjectMasteryChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const rows = data?.subjects ?? [];
    const chartData = rows.map((s) => ({ id: s.subject_id, x: s.subject_name, pct: s.accuracy_pct }));

    if (loading) {
        return (
            <Card className="rounded-2xl">
                <CardHeader>
                    <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-60 w-full rounded-xl" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl h-full">
            <CardHeader>
                <SectionHeader
                    title="Statistik Mapel"
                    subtitle="% jawaban benar seluruh soal ujian & latihan"
                    icon={BarChart3}
                />
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <EmptyState
                        compact
                        icon={ClipboardList}
                        title="Belum ada data analisis mapel"
                        description="Kerjakan soal latihan agar statistik penguasaan mapelmu tampil."
                        actionLabel="Mulai Latihan"
                        actionHref="/practice"
                    />
                ) : (
                    <ResponsiveContainer width="100%" height={230}>
                        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke={isDark ? CHART_COLORS.gridDark : CHART_COLORS.gridLight}
                            />
                            <XAxis
                                dataKey="x"
                                tick={{ fontSize: 11, fill: isDark ? CHART_COLORS.tickDark : CHART_COLORS.tickLight }}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 11, fill: isDark ? CHART_COLORS.tickDark : CHART_COLORS.tickLight }}
                                tickLine={false}
                                axisLine={false}
                                unit="%"
                            />
                            <Tooltip
                                cursor={{
                                    fill: isDark ? "rgba(148,163,184,0.08)" : "rgba(15,23,42,0.05)",
                                }}
                            />
                            <Bar dataKey="pct" name="Akurasi" maxBarSize={44} radius={[6, 6, 0, 0]}>
                                {chartData.map((entry) => {
                                    const strong = entry.pct >= threshold;
                                    return (
                                        <Cell
                                            key={entry.id}
                                            fill={
                                                strong
                                                    ? isDark
                                                        ? CHART_COLORS.strongDark
                                                        : CHART_COLORS.strongLight
                                                    : isDark
                                                        ? CHART_COLORS.weakDark
                                                        : CHART_COLORS.weakLight
                                            }
                                        />
                                    );
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}