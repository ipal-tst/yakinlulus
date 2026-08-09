"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/admin/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthStatusGrid } from "@/components/admin/admin/HealthStatusGrid";
import { LogsViewer } from "@/components/admin/admin/LogsViewer";
import { AuditStatsCards } from "@/components/admin/audit/AuditStatsCards";
import { AuditLogTable } from "@/components/admin/audit/AuditLogTable";
import { AiConfigForm } from "@/components/admin/ai/AiConfigForm";
import { adminService } from "@/services/admin.service";
import { auditService, AuditStats } from "@/services/audit.service";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

export default function MonitorConfigPage() {
    const healthQuery = useQuery({
        queryKey: ["admin-health"],
        queryFn: () => adminService.getHealth(),
    });

    const logsQuery = useQuery({
        queryKey: ["admin-logs"],
        queryFn: () => adminService.getLogs(100),
    });

    const statsQuery = useQuery<AuditStats>({
        queryKey: ["audit-stats"],
        queryFn: () => auditService.getStats(),
    });

    const auditLogsQuery = useQuery({
        queryKey: ["audit-logs"],
        queryFn: () => auditService.getLogs({ page: 1, limit: 100 }),
    });

    const logs = logsQuery.data?.logs || [];
    const auditLogs = Array.isArray(auditLogsQuery.data) ? auditLogsQuery.data : auditLogsQuery.data?.items || [];

    return (

            <div className="space-y-6">
                <PageHeader
                    title="Monitoring &amp; Konfigurasi"
                    description="Pantau kesehatan sistem, audit log operasional, dan konfigurasi AI dalam satu tempat."
                />

                <Tabs defaultValue="health" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="health">System Health</TabsTrigger>
                        <TabsTrigger value="audit">Audit Log</TabsTrigger>
                        <TabsTrigger value="ai">AI Config</TabsTrigger>
                    </TabsList>

                    <TabsContent value="health" className="space-y-6 pt-4">
                        {(healthQuery.error || logsQuery.error) && (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>Gagal memuat status sistem</span>
                                <Button variant="ghost" size="sm" onClick={() => { healthQuery.refetch(); logsQuery.refetch(); }} className="ml-auto rounded-lg">
                                    Coba lagi
                                </Button>
                            </div>
                        )}
                        {healthQuery.isLoading || logsQuery.isLoading ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                                    ))}
                                </div>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                                ))}
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
                    </TabsContent>

                    <TabsContent value="audit" className="space-y-6 pt-4">
                        {statsQuery.error || auditLogsQuery.error ? (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>Gagal memuat data audit</span>
                                <Button variant="ghost" size="sm" onClick={() => { statsQuery.refetch(); auditLogsQuery.refetch(); }} className="ml-auto rounded-lg">
                                    Coba lagi
                                </Button>
                            </div>
                        ) : null}
                        {statsQuery.isLoading || auditLogsQuery.isLoading ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                                    ))}
                                </div>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <>
                                {statsQuery.data && <AuditStatsCards stats={statsQuery.data} />}
                                <AuditLogTable logs={auditLogs} />
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="ai" className="pt-4">
                        <AiConfigForm />
                    </TabsContent>
                </Tabs>
            </div>

    );
}