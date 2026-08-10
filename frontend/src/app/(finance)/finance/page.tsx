"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { StatsCard } from "@/components/data-display/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardService } from "@/services/dashboard.service";
import { subscriptionService } from "@/services/subscription.service";
import { DollarSign, Users, Receipt, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";

export default function FinanceDashboardPage() {
    const statsQuery = useQuery({
        queryKey: ["subscriptions-stats"],
        queryFn: () => subscriptionService.getStats(),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });
    const dashQuery = useQuery({
        queryKey: ["admin-dashboard"],
        queryFn: () => dashboardService.getAdminDashboard(),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });

    const err = statsQuery.error ?? dashQuery.error;
    const refetchAll = () => {
        statsQuery.refetch();
        dashQuery.refetch();
    };
    const isLoading = statsQuery.isLoading || dashQuery.isLoading;
    const data = dashQuery.data ?? null;
    const grossRevenue = data?.total_revenue;
    const recentPayments = data?.recent_payments ?? [];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Dashboard Keuangan & Modul Finance</h1>
                    <p className="text-sm text-muted-foreground">Metrik pendapatan, langganan aktif, paket membership, dan pembayaran.</p>
                </div>
                <Button variant="outline" size="sm" onClick={refetchAll} className="rounded-lg">
                    <RefreshCw className={statsQuery.isFetching || dashQuery.isFetching ? "animate-spin" : ""} />
                    Muat Ulang
                </Button>
            </div>

            {err && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Gagal memuat sebagian data keuangan. Periksa koneksi lalu coba lagi.</span>
                    <Button variant="ghost" size="sm" onClick={refetchAll} className="ml-auto rounded-lg">
                        Coba Lagi
                    </Button>
                </div>
            )}

            {/* Stats Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatsCard
                        title="Total Pendapatan (Gross)"
                        value={typeof grossRevenue === "number" ? formatCurrency(grossRevenue) : "-"}
                        icon={DollarSign}
                    />
                    <StatsCard
                        title="Siswa Berlangganan Aktif"
                        value={statsQuery.data?.active_subs ?? "-"}
                        icon={Users}
                    />
                    <StatsCard
                        title="MRR (Monthly Recurring Revenue)"
                        value={typeof statsQuery.data?.mrr === "number" ? formatCurrency(statsQuery.data.mrr) : "-"}
                        icon={TrendingUp}
                    />
                </div>
            )}

            {/* Payment History List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-primary" /> Transaksi Terakhir
                        </CardTitle>
                        <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
                            <Link href="/finance/payments">Lihat Semua Transaksi</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentPayments.length > 0 ? (
                        <div className="space-y-3">
                            {recentPayments.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/60"
                                >
                                    <div>
                                        <h4 className="font-heading font-semibold text-sm">{p.user_name}</h4>
                                        <p className="text-xs text-muted-foreground">{p.plan_name} • {p.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-heading font-bold text-sm text-primary">
                                            {formatCurrency(p.amount)}
                                        </span>
                                        <span className="block text-[10px] text-green-600 font-semibold">{p.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                            Belum ada transaksi.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}