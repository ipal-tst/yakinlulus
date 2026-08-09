// src/app/(staff)/staff/audit/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/admin/page-header";
import { AuditStatsCards } from "@/components/admin/audit/AuditStatsCards";
import { AuditLogTable } from "@/components/admin/audit/AuditLogTable";
import { auditService, AuditStats } from "@/services/audit.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export default function AuditLogsPage() {
    const statsQuery = useQuery<AuditStats>({
        queryKey: ["audit-stats"],
        queryFn: () => auditService.getStats(),
    });

    const logsQuery = useQuery({
        queryKey: ["audit-logs"],
        queryFn: () => auditService.getLogs({ page: 1, limit: 100 }),
    });

    const logs = Array.isArray(logsQuery.data) ? logsQuery.data : logsQuery.data?.items || [];
    const isLoading = statsQuery.isLoading || logsQuery.isLoading;
    const error = statsQuery.error || logsQuery.error;

    return (

            <div className="space-y-6">
                <PageHeader
                    title="Audit Log System & Keamanan"
                    description="Catatan riwayat aktivitas penting, perubahan role, dan jejak audit keamanan platform."
                />

                {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error instanceof Error ? error.message : "Gagal memuat data audit"}</span>
                        <Button variant="ghost" size="sm" onClick={() => { statsQuery.refetch(); logsQuery.refetch(); }} className="ml-auto rounded-lg">
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
                        {statsQuery.data && <AuditStatsCards stats={statsQuery.data} />}
                        <AuditLogTable logs={logs} />
                    </>
                )}
            </div>

    );
}