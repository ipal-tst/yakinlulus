"use client";

import { useQuery } from "@tanstack/react-query";

import { StatsCard } from "@/components/data-display/stats-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { subscriptionService } from "@/services/subscription.service";
import { analyticsService } from "@/services/analytics.service";
import { TrendingUp, DollarSign, Users, Award, RefreshCw, AlertCircle } from "lucide-react";

export default function InvestorDashboardPage() {
    const statsQuery = useQuery({
        queryKey: ["subscriptions-stats"],
        queryFn: () => subscriptionService.getStats(),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });
    const overviewQuery = useQuery({
        queryKey: ["admin-overview"],
        queryFn: () => analyticsService.getAdminOverview(),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });

    const err = statsQuery.error ?? overviewQuery.error;
    const refetchAll = () => {
        statsQuery.refetch();
        overviewQuery.refetch();
    };
    const isLoading = statsQuery.isLoading || overviewQuery.isLoading;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);
    };

    const mrr = statsQuery.data?.mrr;
    const arr = typeof mrr === "number" ? mrr * 12 : undefined;
    const totalStudents = overviewQuery.data?.total_students;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Investor Executive Dashboard</h1>
                    <p className="text-sm text-muted-foreground">High-level KPIs, unit economics, growth metrics, and investor relations.</p>
                </div>
                <Button variant="outline" size="sm" onClick={refetchAll} className="rounded-lg">
                    <RefreshCw className={statsQuery.isFetching || overviewQuery.isFetching ? "animate-spin" : ""} />
                    Muat Ulang
                </Button>
            </div>

            {err && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Gagal memuat data dashboard. Periksa koneksi lalu coba lagi.</span>
                    <Button variant="ghost" size="sm" onClick={refetchAll} className="ml-auto rounded-lg">
                        Coba Lagi
                    </Button>
                </div>
            )}

            {/* Stats Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="ARR (Annual Run Rate)"
                        value={arr != null ? formatCurrency(arr) : "-"}
                        icon={TrendingUp}
                    />
                    <StatsCard
                        title="MRR (Monthly Recurring Revenue)"
                        value={typeof mrr === "number" ? formatCurrency(mrr) : "-"}
                        icon={DollarSign}
                    />
                    <StatsCard
                        title="Total Active Users"
                        value={totalStudents ?? "-"}
                        icon={Users}
                    />
                    <StatsCard
                        title="Retention Rate"
                        value="-"
                        icon={Award}
                        description="Churn: -"
                    />
                </div>
            )}

            {/* Executive Summary Card */}
            <Card className="p-6">
                <h3 className="font-heading font-bold text-lg mb-2">Ikhtisar Kinerja Perusahaan</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Metrik ditampilkan bersumber langsung dari sistem: MRR (pendapatan berulang bulanan), jumlah subscriber aktif, dan total pengguna aktif.
                    ARR dihitung dari MRR bulan berjalan. Retention dan churn belum tersedia dari API sehingga ditampilkan sebagai placeholder {'-'}. Tidak ada angka fiktif yang dipublikasikan.
                </p>
            </Card>
        </div>
    );
}