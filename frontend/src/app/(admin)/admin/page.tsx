"use client";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertCircle } from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { analyticsService } from "@/services/analytics.service";
import { AdminKPIGrid } from "@/components/admin/dashboard/admin-kpi-grid";
import { AdminExamStatus } from "@/components/admin/dashboard/admin-exam-status";
import { AdminScoreDistribution } from "@/components/admin/dashboard/admin-score-distribution";
import { AdminSystemHealth } from "@/components/admin/dashboard/admin-system-health";
import { AdminRecentActivity } from "@/components/admin/dashboard/admin-recent-activity";
import { AdminQuickActions } from "@/components/admin/dashboard/admin-quick-actions";

export default function AdminDashboardPage() {
    const dashQuery = useQuery({
        queryKey: ["admin-dashboard"],
        queryFn: () => dashboardService.getAdminDashboard(),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });
    const overviewQuery = useQuery({
        queryKey: ["admin-overview"],
        queryFn: () => analyticsService.getAdminOverview(),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });

    const err = dashQuery.error ?? overviewQuery.error;
    const refetchAll = () => {
        dashQuery.refetch();
        overviewQuery.refetch();
    };

    return (

            <div className="space-y-6">
                <PageHeader
                    title="Dashboard Admin"
                    description="Ringkasan operasional platform: aktivitas pengguna, ujian, konten, dan kesehatan sistem."
                    actions={
                        <Button variant="outline" size="sm" onClick={refetchAll} className="rounded-lg">
                            <RefreshCw className={dashQuery.isFetching ? "animate-spin" : ""} />
                            Muat Ulang
                        </Button>
                    }
                />

                {err && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Gagal memuat sebagian data.</span>
                        <Button variant="ghost" size="sm" onClick={refetchAll} className="ml-auto rounded-lg">
                            Coba Lagi
                        </Button>
                    </div>
                )}

                {dashQuery.isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <AdminKPIGrid dash={dashQuery.data ?? null} />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold">Ujian &amp; Tryout</h3>
                        {dashQuery.isLoading ? (
                            <div className="space-y-3">
                                {[0, 1, 2].map((i) => (
                                    <Skeleton key={i} className="h-14 rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <AdminExamStatus monitor={dashQuery.data?.cbt_monitoring} />
                        )}
                    </section>
                    <AdminScoreDistribution overview={overviewQuery.data} isLoading={overviewQuery.isLoading} />
                </div>

                <AdminSystemHealth health={dashQuery.data?.system_health} isLoading={dashQuery.isLoading} />
                <AdminQuickActions />
                <AdminRecentActivity items={dashQuery.data?.recent_activity} isLoading={dashQuery.isLoading} />
            </div>

    );
}