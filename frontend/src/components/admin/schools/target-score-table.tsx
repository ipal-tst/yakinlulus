// src/components/admin/schools/target-score-table.tsx
"use client";

import { useMemo } from "react";
import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { levelLabel } from "@/lib/school-form-values";
import { TrendingUp, TrendingDown, Pen, Trash2, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TargetScoreRow {
    id: string;
    target_school_id: string;
    school_name: string;
    level: string;
    academic_year: string;
    min_score?: number;
    max_score?: number;
    max_total_score: number;
    is_active: boolean;
    delta_min?: number;
    delta_max?: number;
}

function DeltaBadge({ value }: { value?: number }) {
    if (value === undefined) return <span className="text-xs text-muted-foreground">-</span>;
    if (value > 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">
                <TrendingUp className="h-3 w-3" /> +{value}
            </span>
        );
    }
    if (value < 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                <TrendingDown className="h-3 w-3" /> {value}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            0
        </span>
    );
}

interface TargetScoreTableProps {
    rows: TargetScoreRow[];
    onEdit?: (row: TargetScoreRow) => void;
    onDelete?: (row: TargetScoreRow) => void;
    selectable?: boolean;
    selectedRowIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
}

export function TargetScoreTable({ rows = [], onEdit, onDelete, selectable, selectedRowIds, onSelectionChange }: TargetScoreTableProps) {
    const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

    const columns: Column<TargetScoreRow>[] = [
        {
            header: "Tahun Ajaran",
            accessorKey: "academic_year",
            cell: (row) => (
                <span className="font-semibold text-foreground whitespace-nowrap">
                    {row.academic_year}
                    {!row.is_active && <Badge variant="outline" className="ml-2">Nonaktif</Badge>}
                </span>
            ),
        },
        {
            header: "Sekolah / PT",
            accessorKey: "school_name",
            cell: (row) => <span className="font-medium text-foreground">{row.school_name}</span>,
        },
        {
            header: "Jenjang",
            accessorKey: "level",
            cell: (row) => <Badge variant="secondary">{levelLabel(row.level)}</Badge>,
        },
        {
            header: "Min",
            accessorKey: "min_score",
            cell: (row) => <span className="font-mono text-sm">{row.min_score ?? "-"}</span>,
        },
        {
            header: "Max",
            accessorKey: "max_score",
            cell: (row) => <span className="font-mono text-sm">{row.max_score ?? "-"}</span>,
        },
        {
            header: "Skala",
            accessorKey: "max_total_score",
            cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.max_total_score}</span>,
        },
        {
            header: "Δ Min",
            accessorKey: "delta_min",
            cell: (row) => <DeltaBadge value={row.delta_min} />,
        },
        {
            header: "Δ Max",
            accessorKey: "delta_max",
            cell: (row) => <DeltaBadge value={row.delta_max} />,
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
                        {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(row)} className="gap-2">
                                <Pen className="h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                        )}
                        {onDelete && (
                            <DropdownMenuItem onClick={() => onDelete(row)} className="text-destructive focus:text-destructive gap-2">
                                <Trash2 className="h-4 w-4" />
                                Hapus
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={safeRows}
            searchPlaceholder="Cari tahun ajaran / sekolah..."
            enableExport={false}
            selectable={selectable}
            selectedRowIds={selectedRowIds}
            onSelectionChange={onSelectionChange}
            getRowId={(row) => row.id}
        />
    );
}
