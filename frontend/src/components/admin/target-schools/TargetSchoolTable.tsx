// src/components/admin/target-schools/TargetSchoolTable.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TargetSchool } from "@/services/target-school.service";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TargetSchoolTableProps {
    schools: TargetSchool[];
    onDelete: (school: TargetSchool) => void;
}

export function TargetSchoolTable({ schools, onDelete }: TargetSchoolTableProps) {
    const columns: Column<TargetSchool>[] = [
        {
            header: "Nama Target / PTN",
            accessorKey: "name",
            cell: (row) => (
                <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground leading-none">{row.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">Tahun: {row.academic_year || "-"}</span>
                </div>
            ),
        },
        {
            header: "Jenjang",
            accessorKey: "level",
            cell: (row) => <Badge variant="secondary">{row.level}</Badge>,
        },
        {
            header: "Skor Maksimal",
            accessorKey: "max_total_score",
            cell: (row) => <span className="font-mono text-xs font-semibold">{row.max_total_score}</span>,
        },
        {
            header: "Mata Pelajaran",
            accessorKey: (row) => (row.subjects && row.subjects.length > 0 ? row.subjects.join(", ") : "-"),
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
                    <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDelete(row)} className="text-destructive focus:text-destructive gap-2">
                            <Trash2 className="h-4 w-4" />
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return <DataTable columns={columns} data={schools} searchPlaceholder="Cari target..." />;
}