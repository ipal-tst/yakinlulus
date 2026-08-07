// src/components/admin/admin/LogsViewer.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { LogEntry } from "@/types/admin";

function levelBadge(level: string) {
    const l = level.toUpperCase();
    if (l === "ERROR" || l === "FATAL") return <Badge variant="destructive">{level}</Badge>;
    if (l === "WARN" || l === "WARNING") return <Badge variant="warning">{level}</Badge>;
    return <Badge variant="secondary">{level}</Badge>;
}

export function LogsViewer({ logs }: { logs: LogEntry[] }) {
    const columns: Column<LogEntry>[] = [
        {
            header: "Level",
            accessorKey: "level",
            cell: (row) => levelBadge(row.level || "INFO"),
        },
        {
            header: "Modul",
            accessorKey: "module",
            cell: (row) => <span className="font-mono text-xs font-semibold">{row.module || "-"}</span>,
        },
        {
            header: "Pesan Log",
            accessorKey: "message",
            cell: (row) => <span className="text-xs text-foreground font-mono">{row.message}</span>,
        },
        {
            header: "Waktu",
            accessorKey: "timestamp",
            cell: (row) => <span className="text-xs text-muted-foreground whitespace-nowrap">{row.timestamp}</span>,
        },
    ];

    return <DataTable columns={columns} data={logs} searchPlaceholder="Filter pesan log..." />;
}