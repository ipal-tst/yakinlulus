// src/components/admin/schools/target-school-table.tsx
"use client";

import { useMemo } from "react";
import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { TargetSchool } from "@/services/target-school.service";
import { dumpTargetRow, formatScoreRange } from "@/lib/target-school-mappers";
import { MoreHorizontal, Pen, Power, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TargetSchoolTableProps {
    schools: TargetSchool[];
    onEdit: (school: TargetSchool) => void;
    onDelete: (school: TargetSchool) => void;
    onToggle: (school: TargetSchool) => void;
}

export function TargetSchoolTable({ schools = [], onEdit, onDelete, onToggle }: TargetSchoolTableProps) {
    const safeSchools = useMemo(() => (Array.isArray(schools) ? schools : []), [schools]);

    const columns: Column<TargetSchool>[] = [
        {
            header: "Nama Target / PT",
            accessorKey: "name",
            cell: (row) => {
                const t = dumpTargetRow(row);
                return (
                    <div className="flex flex-col text-left">
                        <span className="font-semibold text-foreground leading-none">{t.name}</span>
                        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <Badge variant="secondary">{t.level}</Badge>
                            {t.province || t.city ? [t.province, t.city].filter(Boolean).join(" · ") : ""}
                        </span>
                    </div>
                );
            },
        },
        {
            header: "Nilai Terendah Diterima",
            accessorKey: "min_score",
            cell: (row) => {
                const t = dumpTargetRow(row);
                return (
                    <span
                        className="font-mono text-xs font-semibold"
                        title={formatScoreRange(t.minScore, t.maxScore, t.maxTotalScore, t.level)}
                    >
                        {t.minScore ?? "-"}
                    </span>
                );
            },
        },
        {
            header: "Nilai Tertinggi Diterima",
            accessorKey: "max_score",
            cell: (row) => {
                const t = dumpTargetRow(row);
                return (
                    <span
                        className="font-mono text-xs font-semibold"
                        title={formatScoreRange(t.minScore, t.maxScore, t.maxTotalScore, t.level)}
                    >
                        {t.maxScore ?? "-"}
                    </span>
                );
            },
        },
        {
            header: "Tahun",
            accessorKey: (row) => row.academic_year || "-",
        },
        {
            header: "Status",
            accessorKey: "is_active",
            cell: (row) => (
                <Badge variant={row.is_active ? "success" : "outline"}>
                    {row.is_active ? "Aktif" : "Non-aktif"}
                </Badge>
            ),
        },
        {
            header: "Aksi",
            accessorKey: "id",
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(row)} className="gap-2">
                            <Pen className="h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggle(row)} className="gap-2">
                            <Power className="h-4 w-4" />
                            {row.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(row)} className="text-destructive focus:text-destructive gap-2">
                            <Trash2 className="h-4 w-4" />
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return <DataTable columns={columns} data={safeSchools} searchPlaceholder="Cari target sekolah..." />;
}