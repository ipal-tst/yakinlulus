"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { mapScoreDistribution, formatPct, formatAvg } from "@/lib/dashboard-mappers";
import type { AdminOverview } from "@/services/analytics.service";

export function AdminScoreDistribution({ overview, isLoading }: { overview?: AdminOverview; isLoading: boolean }) {
    if (isLoading) return <Skeleton className="h-56 w-full rounded-2xl" />;
    const data = mapScoreDistribution(overview);
    return (
        <Card className="rounded-2xl">
            <CardHeader>
                <CardTitle className="text-sm font-semibold">Distribusi Skor Peserta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Belum ada data skor.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                )}
                <div className="flex items-center justify-between">
                    {data.map((b) => (
                        <div key={b.name} className="text-center">
                            <p className="text-lg font-bold">{b.value}</p>
                            <p className="text-xs text-muted-foreground">{b.name}</p>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-muted p-3">
                        <p className="text-muted-foreground">Skor rerata</p>
                        <p className="font-bold text-base">{formatAvg(overview?.avg_score)}</p>
                    </div>
                    <div className="rounded-xl bg-muted p-3">
                        <p className="text-muted-foreground">Tingkat lulus</p>
                        <p className="font-bold text-base">{formatPct(overview?.pass_rate)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}