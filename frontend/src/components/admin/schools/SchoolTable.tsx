// src/components/admin/schools/SchoolTable.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { School } from "@/services/school.service";
import { levelLabel } from "@/lib/school-form-values";
import { MoreHorizontal, Pen, Power, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SchoolTableProps {
    schools: School[];
    onToggleStatus: (school: School) => void;
    onDelete: (school: School) => void;
    onEdit: (school: School) => void;
    selectable?: boolean;
    selectedRowIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
}

export function SchoolTable({
    schools = [],
    onToggleStatus,
    onDelete,
    onEdit,
    selectable = false,
    selectedRowIds,
    onSelectionChange,
}: SchoolTableProps) {
    const safeSchools = Array.isArray(schools) ? schools : ((schools as unknown as { items?: School[] })?.items ?? []);
    const columns: Column<School>[] = [
        {
            header: "Nama Sekolah",
            accessorKey: "school_name",
            cell: (row) => (
                <div className="flex flex-col text-left max-w-[320px]">
                    <TooltipProvider delay={200}>
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <span className="font-semibold text-foreground leading-tight truncate">
                                        {row.school_name}
                                    </span>
                                }
                            />
                            <TooltipContent>{row.school_name}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    {row.school_code && (
                        <span className="text-xs text-muted-foreground mt-0.5">Kode: {row.school_code}</span>
                    )}
                </div>
            ),
        },
        {
            header: "Bentuk",
            accessorKey: "institution_type",
            cell: (row) => (
                <Badge variant={row.institution_type === "PT" ? "secondary" : "outline"}>
                    {row.institution_type === "PT" ? "PT" : "Sekolah"}
                </Badge>
            ),
        },
        {
            header: "Jenjang",
            accessorKey: "education_level",
            cell: (row) => <span className="text-sm text-foreground">{levelLabel(row.education_level)}</span>,
        },
        {
            header: "Kota/Kab",
            accessorKey: "city",
            cell: (row) => <span className="text-sm text-foreground">{row.city || row.regency || "-"}</span>,
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (row) => (
                <Badge variant={row.status === "ACTIVE" ? "success" : "outline"}>
                    {row.status === "ACTIVE" ? "Aktif" : "Non-aktif"}
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
                        <DropdownMenuItem onClick={() => onToggleStatus(row)} className="gap-2">
                            <Power className="h-4 w-4" />
                            {row.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
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

    return (
        <DataTable
            columns={columns}
            data={safeSchools}
            searchPlaceholder="Cari nama sekolah..."
            selectable={selectable}
            selectedRowIds={selectedRowIds}
            onSelectionChange={onSelectionChange}
            getRowId={(row) => row.id}
        />
    );
}
