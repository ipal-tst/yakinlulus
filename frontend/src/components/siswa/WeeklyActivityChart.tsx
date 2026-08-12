// frontend/src/components/siswa/WeeklyActivityChart.tsx
"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";
import type { DashboardWeeklyActivity } from "@/types/siswa";
import { Activity, BarChart3 } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface WeeklyActivityChartProps {
    data: DashboardWeeklyActivity[] | null;
    loading?: boolean;
}

const CHART_COLORS = {
    materialsLight: "#2563EB",
    materialsDark: "#3B82F6",
    questionsLight: "#22C55E",
    questionsDark: "#4ADE80",
    gridLight: "#E2E8F0",
    gridDark: "#1F2937",
    tickLight: "#64748B",
    tickDark: "#9CA3AF",
};

const DAY_NAMES = new Intl.DateTimeFormat("id-ID", { weekday: "short" });

export function WeeklyActivityChart({ data, loading }: WeeklyActivityChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    if (loading) {
        return (
            <Card className="rounded-2xl">
                <CardHeader>
                    <Skeleton className="h-5 w-44" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-60 w-full rounded-xl" />
                </CardContent>
            </Card>
        );
    }

    if (data === null) {
        return (
            <Card className="rounded-2xl">
                <CardHeader>
                    <SectionHeader title="Aktivitas Mingguan" subtitle="7 hari terakhir · materi & soal" icon={Activity} />
                </CardHeader>
                <CardContent>
                    <EmptyState
                        compact
                        icon={BarChart3}
                        title="Belum ada data aktivitas mingguan"
                        description="Statistik aktivitasmu selama 7 hari terakhir akan tampil di sini."
                        actionLabel="Mulai Belajar"
                        actionHref="/materials"
                    />
                </CardContent>
            </Card>
        );
    }

    const seed = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { x: DAY_NAMES.format(d), key: d.toDateString(), materials: 0, questions: 0 };
    });

    for (const act of data) {
        const d = new Date(act.date);
        if (Number.isNaN(d.getTime())) continue;
        const target = seed.find((r) => r.key === d.toDateString());
        if (target) {
            target.materials = act.materials;
            target.questions = act.questions;
        }
    }

    const rows = seed.map((r) => ({ x: r.x, materials: r.materials, questions: r.questions }));

    return (
        <Card className="rounded-2xl">
            <CardHeader>
                <SectionHeader
                    title="Aktivitas Mingguan"
                    subtitle="7 hari terakhir · materi dibaca & soal dikerjakan"
                    icon={Activity}
                />
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={rows} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
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
                            allowDecimals={false}
                            tick={{ fontSize: 11, fill: isDark ? CHART_COLORS.tickDark : CHART_COLORS.tickLight }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip cursor={{ fill: isDark ? "rgba(148,163,184,0.08)" : "rgba(15,23,42,0.05)" }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Bar
                            dataKey="materials"
                            name="Materi"
                            fill={isDark ? CHART_COLORS.materialsDark : CHART_COLORS.materialsLight}
                            maxBarSize={18}
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="questions"
                            name="Soal"
                            fill={isDark ? CHART_COLORS.questionsDark : CHART_COLORS.questionsLight}
                            maxBarSize={18}
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}