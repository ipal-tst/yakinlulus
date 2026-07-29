"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ShieldAlert, Search, AlertCircle,
    Key, FileText, RefreshCw
} from "lucide-react";
import { useAuditStats, useAuditLogs } from "@/lib/api";

const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
};

const getSeverity = (s: string): { variant: "destructive" | "warning" | "outline"; label: string } => {
    if (s === "CRITICAL") return { variant: "destructive", label: "CRITICAL" };
    if (s === "WARNING") return { variant: "warning", label: "WARNING" };
    return { variant: "outline", label: "INFO" };
};

export default function AuditLogsPage() {
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState("");
    const [severityFilter, setSeverityFilter] = React.useState("");
    const { data: stats, isLoading: statsLoading } = useAuditStats() as any;
    const { data: logsData, isLoading: logsLoading } = useAuditLogs(page, 20, severityFilter || undefined) as any;

    const auditLogs = logsData?.logs ?? (Array.isArray(logsData) ? logsData : []);
    const total = logsData?.meta?.total ?? (Array.isArray(logsData) ? logsData.length : 0);
    const totalPages = logsData?.meta?.total_pages ?? 1;

    const filteredLogs = Array.isArray(auditLogs)
        ? auditLogs.filter((log: any) =>
            !search ||
            log.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
            log.action?.toLowerCase().includes(search.toLowerCase()) ||
            log.description?.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    const statCards = [
        {
            label: "Total Audit Logs",
            value: stats?.total_logs ?? 0,
            icon: FileText,
            color: "text-primary",
            sub: "Semua waktu",
        },
        {
            label: "Critical Events",
            value: stats?.critical_count ?? 0,
            icon: ShieldAlert,
            color: "text-danger",
            sub: "Perlu tindakan segera",
        },
        {
            label: "Warning Events",
            value: stats?.warning_count ?? 0,
            icon: AlertCircle,
            color: "text-warning",
            sub: "Perlu perhatian",
        },
        {
            label: "Percobaan Login (24j)",
            value: stats?.login_attempts ?? 0,
            icon: Key,
            color: "text-indigo-500",
            sub: "Sukses & gagal",
        },
    ];

    return (
        <div className="space-y-8 p-6 pb-16">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[10px] font-bold">SECURITY & COMPLIANCE</Badge>
                        <span className="text-xs text-muted-foreground">Immutable Audit Logs</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-1">Audit Log & Security Center</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Log peristiwa keamanan sistem, deteksi login abnormal, dan jejak aktivitas administrator.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs font-semibold" onClick={() => window.location.reload()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <Card key={card.label} className="p-4 flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${card.color}`}>
                            <card.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground font-semibold">{card.label}</span>
                            <div className={`text-xl font-extrabold ${card.color}`}>
                                {statsLoading ? "..." : card.value.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{card.sub}</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Audit Log Table */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h3 className="font-bold text-sm">Security Log Stream</h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari log..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full sm:w-48 pl-9 pr-4 py-2 text-xs rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <select
                            value={severityFilter}
                            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2 text-xs rounded-xl border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                        >
                            <option value="">Semua Level</option>
                            <option value="CRITICAL">CRITICAL</option>
                            <option value="WARNING">WARNING</option>
                            <option value="INFO">INFO</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {logsLoading ? (
                        <div className="text-center py-12 text-xs text-muted-foreground">Memuat data...</div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12 text-xs text-muted-foreground">
                            {search || severityFilter ? "Tidak ada log yang cocok" : "Belum ada log"}
                        </div>
                    ) : (
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                                <tr>
                                    <th className="p-4">Tingkat Risiko</th>
                                    <th className="p-4">Aktor / Pengguna</th>
                                    <th className="p-4">Aksi / Event</th>
                                    <th className="p-4">Deskripsi</th>
                                    <th className="p-4">Target</th>
                                    <th className="p-4">IP Address</th>
                                    <th className="p-4">Waktu Event</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredLogs.map((log: any) => {
                                    const sev = getSeverity(log.severity);
                                    return (
                                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4">
                                                <Badge variant={sev.variant} className="text-[10px] font-bold">
                                                    {sev.label}
                                                </Badge>
                                            </td>
                                            <td className="p-4 font-bold text-foreground">{log.actor_email}</td>
                                            <td className="p-4 font-mono text-primary font-semibold">{log.action}</td>
                                            <td className="p-4 text-muted-foreground max-w-[250px] truncate" title={log.description}>
                                                {log.description}
                                            </td>
                                            <td className="p-4">
                                                {log.entity_type ? (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {log.entity_type}/{log.entity_id}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground/50">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 font-mono text-muted-foreground">{log.ip_address || "-"}</td>
                                            <td className="p-4 font-mono text-muted-foreground text-[10px]">
                                                {formatDate(log.created_at)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                            Halaman {page} dari {totalPages} ({total} log)
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-xs h-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                Sebelumnya
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs h-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                Selanjutnya
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
