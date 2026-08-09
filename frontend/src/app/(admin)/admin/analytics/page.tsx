// src/app/(admin)/admin/analytics/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/admin/page-header";
import { OverviewKPISection } from "@/components/admin/analytics/OverviewKPISection";
import { ExamReportsTable } from "@/components/admin/analytics/ExamReportsTable";
import { analyticsService } from "@/services/analytics.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AdminAnalyticsPage() {
    const overviewQuery = useQuery({
        queryKey: ["admin-analytics-overview"],
        queryFn: () => analyticsService.getAdminOverview(),
    });

    const reportsQuery = useQuery({
        queryKey: ["admin-exam-reports"],
        queryFn: () => analyticsService.getExamReports(),
    });

    const isLoading = overviewQuery.isLoading || reportsQuery.isLoading;
    const error = overviewQuery.error || reportsQuery.error;
    const reports = reportsQuery.data || [];

    return (

            <div className="space-y-6">
                <PageHeader
                    title="Analitik & Laporan Komprehensif"
                    description="Pantau KPI performa belajar siswa, statistik tingkat kelulusan tryout, serta detail laporan ujian nasional."
                />

                {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error instanceof Error ? error.message : "Gagal memuat laporan analitik"}</span>
                        <Button variant="ghost" size="sm" onClick={() => { overviewQuery.refetch(); reportsQuery.refetch(); }} className="ml-auto rounded-lg">
                            Coba lagi
                        </Button>
                    </div>
                )}

                {isLoading ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                            ))}
                        </div>
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-xl" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {overviewQuery.data && <OverviewKPISection overview={overviewQuery.data} />}
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3 font-heading">Laporan Statistik Paket Ujian</h3>
                            <ExamReportsTable reports={reports} />
                        </div>
                    </>
                )}
            </div>

    );
}