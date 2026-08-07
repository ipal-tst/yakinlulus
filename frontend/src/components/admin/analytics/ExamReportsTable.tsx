// src/components/admin/analytics/ExamReportsTable.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { ExamReport } from "@/services/analytics.service";

export function ExamReportsTable({ reports }: { reports: ExamReport[] }) {
    const columns: Column<ExamReport>[] = [
        {
            header: "Judul Ujian",
            accessorKey: "title",
            cell: (row) => <span className="font-semibold text-foreground text-sm">{row.title}</span>,
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (row) => (
                <Badge variant={row.status === "PUBLISHED" ? "success" : "outline"}>
                    {row.status || "DRAFT"}
                </Badge>
            ),
        },
        { header: "Peserta Terdaftar", accessorKey: (row) => row.total_participants ?? 0 },
        { header: "Selesai Mengerjakan", accessorKey: (row) => row.total_finished ?? 0 },
        {
            header: "Rata-rata Skor",
            accessorKey: "average_score",
            cell: (row) => <span className="font-mono text-xs font-semibold">{row.average_score?.toFixed(1) ?? "-"}</span>,
        },
        {
            header: "Tingkat Kelulusan",
            accessorKey: "pass_rate",
            cell: (row) => (
                <span className="font-semibold text-xs text-primary">
                    {row.pass_rate ? `${(row.pass_rate * 100).toFixed(1)}%` : "-"}
                </span>
            ),
        },
    ];

    return <DataTable columns={columns} data={reports} searchPlaceholder="Cari ujian..." />;
}