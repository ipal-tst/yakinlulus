// src/components/admin/audit/AuditLogTable.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { AuditLog } from "@/services/audit.service";

function severityBadge(severity: string) {
    const s = severity.toUpperCase();
    if (s === "CRITICAL" || s === "ERROR" || s === "DANGER") return <Badge variant="destructive">{severity}</Badge>;
    if (s === "WARNING" || s === "WARN") return <Badge variant="warning">{severity}</Badge>;
    return <Badge variant="secondary">{severity}</Badge>;
}

function formatDate(value: string) {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
    const columns: Column<AuditLog>[] = [
        {
            header: "Aksi",
            accessorKey: "action",
            cell: (row) => <span className="font-mono text-xs font-semibold text-foreground">{row.action || row.event_type}</span>,
        },
        {
            header: "Deskripsi",
            accessorKey: "description",
            cell: (row) => <span className="text-xs text-foreground">{row.description || "-"}</span>,
        },
        {
            header: "Aktor",
            accessorKey: "actor_email",
            cell: (row) => (
                <div className="flex flex-col text-left">
                    <span className="text-xs font-medium text-foreground leading-none">{row.actor_email || "SYSTEM"}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{row.actor_role || ""}</span>
                </div>
            ),
        },
        { header: "Entitas", accessorKey: (row) => row.entity_type || "-" },
        {
            header: "Severity",
            accessorKey: "severity",
            cell: (row) => severityBadge(row.severity || "INFO"),
        },
        {
            header: "Waktu",
            accessorKey: "created_at",
            cell: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>,
        },
    ];

    return <DataTable columns={columns} data={logs} searchPlaceholder="Cari aksi, aktor, atau entitas..." />;
}