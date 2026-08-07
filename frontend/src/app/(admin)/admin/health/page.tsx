// src/app/(admin)/admin/health/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/admin/page-header";
import { HealthStatusGrid } from "@/components/admin/admin/HealthStatusGrid";
import { LogsViewer } from "@/components/admin/admin/LogsViewer";
import { adminService } from "@/services/admin.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AdminHealthPage() {
    const healthQuery = useQuery({
        queryKey: ["admin-health"],
        queryFn: () => adminService.getHealth(),
    });

    const logsQuery = useQuery({
        queryKey: ["admin-logs"],
        queryFn: () => adminService.getLogs(100),
    });

    const logs = logsQuery.data?.logs || [];
    const isLoading = healthQuery.isLoading || logsQuery.isLoading;
    const error = healthQuery.error || logsQuery.error;

    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    title="System Health & Application Logs"
                    description="Pantau status infrastruktur database, server API, dan log aktivitas backend terbaru secara real-time."
                />

                {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error instanceof Error ? error.message : "Gagal memuat status sistem"}</span>
                        <Button variant="ghost" size="sm" onClick={() => { healthQuery.refetch(); logsQuery.refetch(); }} className="ml-auto rounded-lg">
                            Coba lagi
                        </Button>
                    </div>
                )}

                {isLoading ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Array.from({ length: 3 }).map((_, i) => (
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
                        {healthQuery.data && <HealthStatusGrid health={healthQuery.data} />}
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3 font-heading">Application Logs</h3>
                            <LogsViewer logs={logs} />
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
}