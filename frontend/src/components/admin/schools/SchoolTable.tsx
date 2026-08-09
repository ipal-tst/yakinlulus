// src/components/admin/schools/SchoolTable.tsx
"use client";

import { Column, DataTable } from "@/components/data-display/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { School } from "@/services/school.service";
import { MoreHorizontal, Pen, Power, Trash2, Users } from "lucide-react";
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
}

export function SchoolTable({ schools = [], onToggleStatus, onDelete, onEdit }: SchoolTableProps) {
    const safeSchools = Array.isArray(schools) ? schools : ((schools as unknown as { items?: School[] })?.items ?? []);
    const columns: Column<School>[] = [
        {
            header: "Nama Sekolah",
            accessorKey: "name",
            cell: (row) => (
                <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground leading-none">{row.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">Kode: {row.code || "-"}</span>
                </div>
            ),
        },
        { header: "NPSN", accessorKey: (row) => row.npsn || "-" },
        { header: "Jenjang", accessorKey: (row) => row.education_level || "-" },
        {
            header: "Siswa",
            accessorKey: "total_students",
            cell: (row) => (
                <span className="inline-flex items-center gap-1 text-xs font-medium">
                    <Users className="h-3.5 w-3.5 text-primary" /> {row.total_students ?? 0}
                </span>
            ),
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

    return <DataTable columns={columns} data={safeSchools} searchPlaceholder="Cari nama sekolah..." />;
}